from flask import Blueprint, request, jsonify, send_file
from flask_login import login_required, current_user
from models import db, SavedCard
import json
import os
from datetime import datetime

cards = Blueprint('cards', __name__)

@cards.route('/save', methods=['POST'])
@login_required
def save_card():
    try:
        data = request.get_json()
        category = data.get('category')
        word_pairs = data.get('word_pairs')
        num_pairs = data.get('num_pairs')
        
        if not all([category, word_pairs, num_pairs]):
            return jsonify({'error': 'Category, word pairs, and number of pairs are required'}), 400
        
        # Convert word pairs to JSON string for storage
        word_pairs_json = json.dumps(word_pairs)
        
        # Generate unique PDF filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"cards_{current_user.id}_{timestamp}.pdf"
        
        # Create saved card record
        saved_card = SavedCard(
            user_id=current_user.id,
            category=category,
            word_pairs=word_pairs_json,
            num_pairs=num_pairs,
            pdf_filename=pdf_filename
        )
        
        db.session.add(saved_card)
        db.session.commit()
        
        return jsonify({
            'message': 'Card saved successfully',
            'card_id': saved_card.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards.route('/my-cards', methods=['GET'])
@login_required
def get_my_cards():
    try:
        user_cards = SavedCard.query.filter_by(user_id=current_user.id).order_by(SavedCard.created_at.desc()).all()
        
        cards_data = []
        for card in user_cards:
            cards_data.append({
                'id': card.id,
                'category': card.category,
                'word_pairs': json.loads(card.word_pairs),
                'num_pairs': card.num_pairs,
                'pdf_filename': card.pdf_filename,
                'created_at': card.created_at.isoformat()
            })
        
        return jsonify(cards_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards.route('/card/<int:card_id>', methods=['GET'])
@login_required
def get_card(card_id):
    try:
        card = SavedCard.query.filter_by(id=card_id, user_id=current_user.id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        return jsonify({
            'id': card.id,
            'category': card.category,
            'word_pairs': json.loads(card.word_pairs),
            'num_pairs': card.num_pairs,
            'pdf_filename': card.pdf_filename,
            'created_at': card.created_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards.route('/card/<int:card_id>/download', methods=['GET'])
@login_required
def download_saved_card(card_id):
    try:
        card = SavedCard.query.filter_by(id=card_id, user_id=current_user.id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if not card.pdf_filename or not os.path.exists(card.pdf_filename):
            return jsonify({'error': 'PDF file not found'}), 404
        
        return send_file(card.pdf_filename, as_attachment=True)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards.route('/card/<int:card_id>', methods=['DELETE'])
@login_required
def delete_card(card_id):
    try:
        card = SavedCard.query.filter_by(id=card_id, user_id=current_user.id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Delete PDF file if it exists
        if card.pdf_filename and os.path.exists(card.pdf_filename):
            os.remove(card.pdf_filename)
        
        db.session.delete(card)
        db.session.commit()
        
        return jsonify({'message': 'Card deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def save_card_to_db(user_id, category, word_pairs, num_pairs, pdf_filename):
    """Helper function to save card to database"""
    try:
        word_pairs_json = json.dumps(word_pairs)
        
        saved_card = SavedCard(
            user_id=user_id,
            category=category,
            word_pairs=word_pairs_json,
            num_pairs=num_pairs,
            pdf_filename=pdf_filename
        )
        
        db.session.add(saved_card)
        db.session.commit()
        
        return saved_card.id
        
    except Exception as e:
        db.session.rollback()
        raise e 