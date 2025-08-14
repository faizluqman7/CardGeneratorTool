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

# If JWT secret is not provided, fall back to a development secret and warn.
if not JWT_SECRET:
    JWT_SECRET = 'dev-secret'
    print("Warning: JWT_SECRET not set. Using development JWT_SECRET.", file=sys.stderr)

# Initialize database tables on startup
db_manager.create_tables()

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON.'}), 400
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


@app.errorhandler(401)
def handle_unauthorized(e):
    # Return JSON for unauthorized errors so frontends don't get HTML redirects
    return jsonify({'error': 'Unauthorized'}), 401

@app.route('/download', methods=['GET'])
def download_pdf():
    try:
        # Resolve to absolute path to avoid surprises when running from different CWDs
        pdf_path = os.path.abspath(PDF_FILENAME)
        if not os.path.exists(pdf_path):
            return jsonify({'error': 'PDF file not found.'}), 404

        return send_file(pdf_path, as_attachment=True)

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
        if not data:
            return jsonify({'error': 'Request body must be JSON.'}), 400
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
        if not data:
            return jsonify({'error': 'Request body must be JSON.'}), 400
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        if not email or not username or not password:
            return jsonify({'error': 'Email, username, and password are required.'}), 400

        hashed_password = generate_password_hash(password)
        try:
            user_id = db_manager.create_user(email, username, hashed_password)
        except psycopg2.IntegrityError:
            # Likely duplicate email/username
            return jsonify({'error': 'User with that email or username already exists.'}), 409

        if user_id:
            return jsonify({'message': 'User registered successfully.', 'user_id': user_id}), 201
        else:
            return jsonify({'error': 'Failed to register user.'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['GET', 'POST'])
def login():
    try:
        # Allow GET for developer tools or redirects from browsers to avoid 405
        if request.method == 'GET':
            return jsonify({'message': 'Send POST with email and password.'}), 200
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON.'}), 400
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


@app.route('/community', methods=['GET'])
def get_all_cards():
    try:
        # Retrieve all cards from the database
        cards = db_manager.get_all_cards()

        # Return an empty list (200) when there are no community cards instead of 404.
        if cards:
            return jsonify(cards), 200
        else:
            return jsonify([]), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    #app.run(debug=True)
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000))) #render
    #app.run(host="127.0.0.1", port=int(os.getenv("PORT", 5328))) #vercel