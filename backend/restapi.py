import os
import psycopg2
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from main import CardGenerator
from database import DatabaseManager
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

card_generator = CardGenerator()
db_manager = DatabaseManager()
PDF_FILENAME = 'cards.pdf'

# Secret key for JWT
JWT_SECRET = os.getenv('JWT_SECRET')

# Initialize database tables on startup
db_manager.create_tables()

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        category = data.get('category')
        num_pairs = data.get('num_pairs', 10)

        if not category:
            return jsonify({'error': 'Category is required.'}), 400

        word_pairs = card_generator.generate_word_pairs(category, num_pairs)
        if not word_pairs:
            return jsonify({'error': 'Failed to generate word pairs.'}), 400

        card_generator.create_pdf(word_pairs)
        card_generator.pairs = word_pairs

        return jsonify(word_pairs), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['GET'])
def download_pdf():
    try:
        if not os.path.exists(PDF_FILENAME):
            return jsonify({'error': 'PDF file not found.'}), 404

        return send_file(PDF_FILENAME, as_attachment=True)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save', methods=['POST'])
def save_cards():
    try:
        # Verify JWT token
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Authorization token is required.'}), 401

        try:
            if token.startswith("Bearer "):
                token = token.split(" ")[1]
            decoded_token = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token.'}), 401

        data = request.get_json()
        name = data.get('name')
        word_pairs = data.get('word_pairs')

        if not name or not word_pairs:
            return jsonify({'error': 'Name and word pairs are required.'}), 400

        # Save cards to the PostgreSQL database
        card_id = db_manager.save_cards(name, word_pairs)
        
        if card_id:
            return jsonify({
                'message': 'Cards saved successfully.',
                'card_id': card_id
            }), 200
        else:
            return jsonify({'error': 'Failed to save cards to database.'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/retrieve', methods=['GET'])
def retrieve_cards():
    try:
        card_id = request.args.get('id')

        if not card_id:
            return jsonify({'error': 'Card ID is required'}), 400

        # Retrieve cards from the database
        cards_data = db_manager.retrieve_cards(card_id)
        
        if cards_data:
            return jsonify(cards_data), 200
        else:
            return jsonify({'error': 'Card not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        if not email or not username or not password:
            return jsonify({'error': 'Email, username, and password are required.'}), 400

        hashed_password = generate_password_hash(password)
        user_id = db_manager.create_user(email, username, hashed_password)

        if user_id:
            return jsonify({'message': 'User registered successfully.', 'user_id': user_id}), 201
        else:
            return jsonify({'error': 'Failed to register user.'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required.'}), 400

        user = db_manager.get_user_by_email(email)
        if user and check_password_hash(user['password'], password):
            # Generate JWT token
            payload = {
                'user_id': user['id'],
                'username': user['username'],
                'exp': datetime.utcnow() + timedelta(hours=24)  # Token expires in 24 hours
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')

            return jsonify({'message': 'Login successful.', 'token': token}), 200
        else:
            return jsonify({'error': 'Invalid email or password.'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    #app.run(debug=True)
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000))) #render
    #app.run(host="127.0.0.1", port=int(os.getenv("PORT", 5328))) #vercel