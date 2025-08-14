import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Require explicit SECRET_KEY to avoid accidental use of a hardcoded secret in production
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        # Fail fast to avoid insecure deployments without a secret key
        raise RuntimeError('SECRET_KEY environment variable is not set. Set it before running the app.')

    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///cards.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    API_KEY = os.getenv('API_KEY')

    # Directory where generated PDFs will be stored
    PDF_UPLOAD_FOLDER = os.getenv('PDF_UPLOAD_FOLDER', os.path.join(os.getcwd(), 'pdfs'))

    # Session cookie security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'