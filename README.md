# Intelligent Internship Tracking System with AI

Production-oriented React + FastAPI internship tracker with role-based authentication, approved company postings, provider-based job sync, PDF resume analysis, application Kanban, notifications, and transparent content-based matching.

## Quick start

1. Create a `.env` file from `backend/.env.example` in `backend/.env`. By default, the `DATABASE_URL` is configured for a local SQLite database (`sqlite:///./internship_tracker.db`), so no database server setup is required. Set a strong `JWT_SECRET_KEY`, and optionally `JOOBLE_API_KEY` or `GEMINI_API_KEY`.
2. Backend: `cd backend`, create/activate a virtual environment, run `pip install -r requirements.txt`, then run `uvicorn app.main:app --reload`.
3. Frontend: `cd frontend && npm install && npm run dev`.

API documentation is at `http://localhost:8000/docs`. Use Swagger's Authorize button with the bearer token returned by `/api/auth/login`. Set `VITE_API_URL` in `frontend/.env` for deployed APIs.

## Architecture

- **Database:** normalized users, student profiles, companies, internships, applications, and notifications, with foreign keys, unique constraints, timestamps, and search indexes. SQLAlchemy emits MySQL-compatible DDL; Alembic is configured for versioned migrations.
- **Jobs:** `JobProvider` allows authorized providers. `AdzunaProvider` normalizes Adzuna results; no scraping is performed. A development-only `MockProvider` is available when no key exists.
- **AI:** skills are extracted and normalized first. Matching is currently basic, with advanced text-based matching planned for Phase 2. Scores mean *profile-to-role similarity only*, never likelihood of selection. Skill gaps identify matched, partial, missing skills, and learning areas.
- **Deployment:** serve the Vite build through a CDN/static host; deploy FastAPI behind HTTPS (for example Gunicorn/Uvicorn workers), use managed MySQL, set restrictive `CORS_ORIGINS`, store uploads in object storage, rotate JWT secrets, and run migrations in CI/CD.
