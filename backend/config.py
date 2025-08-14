import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///cards.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    API_KEY = os.getenv('API_KEY') 