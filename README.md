# CardGeneratorTool - Extended Version

**Live Demo:** [https://cardgpt.faizluqman.my/](https://cardgpt.faizluqman.my/)

A web application that generates word pair cards for educational games, with user authentication and card saving capabilities.

## Features

### Core Features
- **Word Pair Generation**: Generate word pairs for any category using AI
- **PDF Export**: Download generated cards as PDF files
- **Customizable**: Choose the number of word pairs (1-10)

### New Features (Extended Version)
- **User Authentication**: Register and login with username/email
- **Card Saving**: Save generated cards to your account
- **Card Management**: View, download, and delete saved cards
- **User Dashboard**: Access your saved cards anytime
- **Secure Storage**: Cards are securely stored with user association

## Tech Stack

### Backend
- **Flask**: Python web framework
- **SQLAlchemy**: Database ORM
- **Flask-Login**: User session management
- **Flask-Bcrypt**: Password hashing
- **FPDF**: PDF generation
- **Requests**: API calls to Gemini AI

### Frontend
- **React**: JavaScript framework
- **Vite**: Build tool
- **CSS3**: Styling with modern design

### Database
- **SQLite**: Local database (can be configured for PostgreSQL/MySQL)

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Gemini API key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory:
   ```
   SECRET_KEY=your-super-secret-key-change-this-in-production
   DATABASE_URL=sqlite:///cards.db
   API_KEY=your-gemini-api-key-here
   ```

4. Run the backend server:
   ```bash
   python restapi.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Getting Started
1. Open the application in your browser
2. Register a new account or login with existing credentials
3. Navigate to "Generate Cards" to create new word pairs

### Generating Cards
1. Enter a category (e.g., "Animals", "Colors", "Food")
2. Choose the number of word pairs (1-10)
3. Click "Generate Word Pairs" for temporary generation
4. Click "Generate & Save" to save cards to your account

### Managing Saved Cards
1. Navigate to "My Cards" in the navigation
2. View all your saved cards with creation dates
3. Download PDFs of saved cards
4. Delete cards you no longer need

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### Card Generation
- `POST /generate` - Generate cards (temporary)
- `POST /generate-and-save` - Generate and save cards
- `GET /download` - Download latest generated PDF

### Card Management
- `GET /cards/my-cards` - Get user's saved cards
- `GET /cards/card/<id>` - Get specific card details
- `GET /cards/card/<id>/download` - Download saved card PDF
- `DELETE /cards/card/<id>` - Delete saved card

## Database Schema

### Users Table
- `id` (Primary Key)
- `username` (Unique)
- `email` (Unique)
- `password_hash`
- `created_at`

### SavedCards Table
- `id` (Primary Key)
- `user_id` (Foreign Key to Users)
- `category`
- `word_pairs` (JSON string)
- `num_pairs`
- `pdf_filename`
- `created_at`

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **Session Management**: Secure session handling with Flask-Login
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **User Isolation**: Users can only access their own cards

## Deployment

### Backend Deployment
The backend is configured for deployment on platforms like Render or Heroku:
- Set environment variables in your deployment platform
- Configure database URL for production database
- Set a strong SECRET_KEY

### Frontend Deployment
The frontend can be deployed on platforms like Vercel or Netlify:
- Build the project: `npm run build`
- Deploy the `dist` folder

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please open an issue in the repository. 