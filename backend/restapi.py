import os
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from main import CardGenerator

app = Flask(__name__)
CORS(app)

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

@app.route('/download', methods=['GET'])
def download_pdf():
    try:
        if not os.path.exists(PDF_FILENAME):
            return jsonify({'error': 'PDF file not found.'}), 404

        return send_file(PDF_FILENAME, as_attachment=True)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    #app.run(debug=True)
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000))) #render
    #app.run(host="127.0.0.1", port=int(os.getenv("PORT", 5328))) #vercel