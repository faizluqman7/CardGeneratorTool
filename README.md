## CardGeneratorTool — Generated README (snapshot)

This README summarizes the current state of the CardGeneratorTool project as of the latest repository snapshot. It lists app features, backend endpoints, environment variables, install/run steps, security notes, and recommended next steps.

### Summary
- Web app that generates card-matching word pairs (via a generative language model), renders them to PDF, and persists/save cards to a database.
- Frontend: Vite + React (under `frontend/`).
- Backend: Flask-based API (several modules under `backend/`) with two DB approaches present in the codebase: a Flask-SQLAlchemy model layer and a separate `backend/database.py` using psycopg2 (Supabase/Postgres style). There are also blueprints using Flask-Login plus JWT-based endpoints — these should be unified before production.

### Key features
- Generate word-pair lists using an external generative language API (configurable with `API_KEY`).
- Produce printable PDF card sheets from generated word pairs.
- Save cards metadata and PDF filenames to a persistent database.
- Download saved PDFs.
- User registration and authentication: both session-based (Flask-Login) and JWT-style handlers exist in the codebase.
- Community/public endpoint to list cards from the DB.

### Backend API (endpoints)
The primary backend API implemented in `backend/restapi.py` exposes the following endpoints:

- POST /generate
  - Payload: JSON { "category": "animals", "num_pairs": 10 }
  - Returns: generated word pairs (JSON array) and writes a PDF for the last generation.

- GET /download
  - Returns: the most recent generated `cards.pdf` (file must exist on server).

- POST /save
  - Auth: Bearer JWT token in `Authorization` header.
  - Payload: JSON { "name": "My deck", "word_pairs": [...] }
  - Saves to Postgres (via `backend/database.py`) and returns card id.

- GET /retrieve?id=<card_id>
  - Returns: saved card record (name, word_pairs, created_at).

- POST /register
  - Payload: { email, username, password }
  - Creates a user in the SQL DB and returns 201 on success.

- POST /login
  - Payload: { email, password }
  - Returns: JWT token when credentials are valid.

- GET /community
  - Returns: list of cards (via the DB manager).

Note: There are also Flask blueprint implementations in `backend/auth.py` and `backend/cards.py` that use session cookies and Flask-Login; refer to those files if you rely on cookie-based auth instead of JWT.

### Environment variables / configuration
- `SECRET_KEY` — required by `backend/config.py` (session signing). The app will raise if missing.
- `API_KEY` — API key for the external generative language API used by `backend/main.py`.
- `JWT_SECRET` — symmetric secret used to sign JWT tokens (used in `restapi.py`).
- `PDF_UPLOAD_FOLDER` — optional; directory where generated PDFs are stored (some code stores basenames in DB and writes into this folder).
- `DATABASE_URL` — used by SQLAlchemy-style config (may be `sqlite:///cards.db` by default).
- `SUPABASE_URL` — used by `backend/database.py`/psycopg2 if you use the Postgres/Supabase manager.
- `PORT` — optional port for running the Flask app (default 5000).

Make sure to set these in a `.env` file or environment before running.

### Install (backend)
1. Create and activate a Python virtualenv (recommended):
```bash
python3 -m venv .venv
source .venv/bin/activate
```
2. Install dependencies:
```bash
python -m pip install -r backend/requirements.txt
```

### Run (backend)
1. Export required env vars (example):
```bash
export SECRET_KEY='replace-with-strong-secret'
export API_KEY='your-model-api-key'
export JWT_SECRET='replace-with-jwt-secret'
export SUPABASE_URL='postgres://user:pass@host:5432/dbname' # if using DatabaseManager
export PDF_UPLOAD_FOLDER="$PWD/backend/pdfs"
mkdir -p "$PDF_UPLOAD_FOLDER"
```
2. Start the API server:
```bash
python3 backend/restapi.py
```

### Run (frontend)
1. Go to `frontend/`, install and run (Vite):
```bash
cd frontend
npm install
npm run dev
```

### Example requests
- Generate word pairs (cURL):
```bash
curl -X POST http://localhost:5000/generate \
  -H 'Content-Type: application/json' \
  -d '{"category": "animals", "num_pairs": 8}'
```

- Login and save (cURL):
```bash
# Login -> get token
curl -X POST http://localhost:5000/login -H 'Content-Type: application/json' -d '{"email":"me@example.com","password":"pass"}'

# Save with token
curl -X POST http://localhost:5000/save -H "Authorization: Bearer <TOKEN>" -H 'Content-Type: application/json' \
  -d '{"name":"My deck","word_pairs": [["CAT","CAT"],["DOG","DOG"]]}'
```

### Notes and caveats (important)
- There is duplication and inconsistent persistence/auth stacks in `backend/`:
  - `backend/models.py` (SQLAlchemy models + Flask-Login) vs `backend/database.py` (psycopg2 DatabaseManager). Decide which DB approach you want and remove the other to avoid split logic.
  - There are both cookie/session endpoints (blueprints) and JWT endpoints. Pick one auth strategy for consistency.
- The generative model integration currently accepts and stores responses — you should hard-validate/sanitize model outputs before writing them to PDFs or the DB.
- Serving files: current code stores PDF basenames in DB and expects files under `PDF_UPLOAD_FOLDER`. Ensure permissions and backups for that folder.
- `backend/config.py` may enforce a `SECRET_KEY` — set it for production.

### Security recommendations
- Use Authorization header (Bearer) for API calls rather than query params (avoid key leakage).
- Set `SESSION_COOKIE_SECURE`, `HTTPONLY`, and `SAMESITE` for cookies in production.
- Add CSRF protection if you use cookie/session auth + frontend with credentials.
- Log and monitor attempts to generate unexpected content; sanitize before persist.

### Next steps / suggested cleanups
1. Choose a single DB strategy (SQLAlchemy OR Postgres client) and consolidate code.
2. Pick one auth approach (JWT or session cookies) and remove the other blueprints.
3. Add unit tests for `CardGenerator.generate_word_pairs()` and PDF generation to avoid runtime surprises.
4. Add a small migration script to move old PDF files into `PDF_UPLOAD_FOLDER` and update DB rows to store basenames.

---
This file was generated from a snapshot of the repository; review and tweak before using in production.
