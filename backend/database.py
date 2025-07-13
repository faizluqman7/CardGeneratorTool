import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

class DatabaseManager:
    def __init__(self):
        # Get Supabase connection URL from environment variable
        self.connection_string = os.getenv('SUPABASE_URL')
        
        if not self.connection_string:
            raise ValueError("SUPABASE_URL environment variable is required")
    
    def get_connection(self):
        """Get a database connection"""
        try:
            conn = psycopg2.connect(self.connection_string)
            return conn
        except Exception as e:
            print(f"Error connecting to database: {e}")
            return None
    
    def create_tables(self):
        """Create the cards and users tables if they don't exist"""
        conn = self.get_connection()
        if not conn:
            return False
        
        try:
            cursor = conn.cursor()
            
            # Create cards table
            create_cards_table_query = """
            CREATE TABLE IF NOT EXISTS cards (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                word_pairs JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            cursor.execute(create_cards_table_query)

            # Create users table
            create_users_table_query = """
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """

            cursor.execute(create_users_table_query)
            conn.commit()
            cursor.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Error creating tables: {e}")
            if conn:
                conn.close()
            return False
    
    def save_cards(self, name, word_pairs):
        """Save cards to the database"""
        conn = self.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor()
            
            insert_query = """
            INSERT INTO cards (name, word_pairs)
            VALUES (%s, %s)
            RETURNING id;
            """
            
            cursor.execute(insert_query, (name, json.dumps(word_pairs)))
            card_id = cursor.fetchone()[0]
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return str(card_id)
            
        except Exception as e:
            print(f"Error saving cards: {e}")
            if conn:
                conn.rollback()
                conn.close()
            return None
    
    def retrieve_cards(self, card_id):
        """Retrieve cards from the database by ID"""
        conn = self.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            select_query = """
            SELECT name, word_pairs, created_at
            FROM cards
            WHERE id = %s;
            """
            
            cursor.execute(select_query, (card_id,))
            result = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            if result:
                return {
                    'name': result['name'],
                    'word_pairs': result['word_pairs'],
                    'created_at': result['created_at'].isoformat() if result['created_at'] else None
                }
            return None
            
        except Exception as e:
            print(f"Error retrieving cards: {e}")
            if conn:
                conn.close()
            return None

    def create_user(self, email, username, password):
        """Register a new user"""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            cursor = conn.cursor()

            insert_query = """
            INSERT INTO users (email, username, password)
            VALUES (%s, %s, %s)
            RETURNING id;
            """

            cursor.execute(insert_query, (email, username, password))
            user_id = cursor.fetchone()[0]

            conn.commit()
            cursor.close()
            conn.close()

            return str(user_id)

        except Exception as e:
            print(f"Error creating user: {e}")
            if conn:
                conn.rollback()
                conn.close()
            return None

    def get_user_by_email(self, email):
        """Retrieve a user by email"""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            select_query = """
            SELECT id, email, username, password, created_at
            FROM users
            WHERE email = %s;
            """

            cursor.execute(select_query, (email,))
            result = cursor.fetchone()

            cursor.close()
            conn.close()

            return result

        except Exception as e:
            print(f"Error retrieving user: {e}")
            if conn:
                conn.close()
            return None

    def get_all_cards(self):
        """Retrieve all cards from the database"""
        conn = self.get_connection()
        if not conn:
            return None

        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            select_query = """
            SELECT id, name, word_pairs, created_at
            FROM cards;
            """

            cursor.execute(select_query)
            results = cursor.fetchall()

            cursor.close()
            conn.close()

            return [
                {
                    'id': row['id'],
                    'name': row['name'],
                    'word_pairs': row['word_pairs'],
                    'created_at': row['created_at'].isoformat() if row['created_at'] else None
                }
                for row in results
            ]

        except Exception as e:
            print(f"Error retrieving all cards: {e}")
            if conn:
                conn.close()
            return None