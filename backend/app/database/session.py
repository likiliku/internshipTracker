from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./internship_tracker.db"
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    jooble_api_key: str = ""
    jsearch_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    cors_origins: str = "http://localhost:5173"
    upload_dir: str = "uploads"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

if not settings.jwt_secret_key or settings.jwt_secret_key == "development-only-change-me":
    raise ValueError("JWT_SECRET_KEY is not set securely. Please set a strong random secret in your .env file.")

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif "tidbcloud" in settings.database_url:
    connect_args = {"ssl": {"ssl_cert_reqs": "CERT_NONE"}}

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
