import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user
from flask_bcrypt import Bcrypt
from dotenv import load_dotenv
from main import CardGenerator
from models import db, User
from auth import auth
from cards import cards

from config import Config

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, supports_credentials=True)

# Initialize extensions
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Register blueprints
app.register_blueprint(auth, url_prefix='/auth')
app.register_blueprint(cards, url_prefix='/cards')

card_generator = CardGenerator()
PDF_FILENAME = 'cards.pdf'

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

@app.route('/generate-and-save', methods=['POST'])
@login_required
def generate_and_save():
    try:
        data = request.get_json()
        category = data.get('category')
        num_pairs = data.get('num_pairs', 10)

        if not category:
            return jsonify({'error': 'Category is required.'}), 400

        word_pairs = card_generator.generate_word_pairs(category, num_pairs)
        if not word_pairs:
            return jsonify({'error': 'Failed to generate word pairs.'}), 400

        # Generate unique PDF filename
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"cards_{current_user.id}_{timestamp}.pdf"
        
        # Create PDF with custom filename
        card_generator.create_pdf(word_pairs, pdf_filename)
        card_generator.pairs = word_pairs

        # Save to database
        from cards import save_card_to_db
        card_id = save_card_to_db(current_user.id, category, word_pairs, num_pairs, pdf_filename)

        return jsonify({
            'word_pairs': word_pairs,
            'card_id': card_id,
            'pdf_filename': pdf_filename
        }), 200

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

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    #app.run(debug=True)
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000))) #render
    #app.run(host="127.0.0.1", port=int(os.getenv("PORT", 5328))) #vercel