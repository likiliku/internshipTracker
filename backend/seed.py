from datetime import date, timedelta
from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.models import User, StudentProfile, Internship, Role, PostingStatus
from app.core.security import pwd
Base.metadata.create_all(engine); db=SessionLocal()
if not db.query(User).filter_by(email='admin@tracker.com').first():
    db.add(User(name='System Admin',email='admin@tracker.com',password_hash=pwd.hash('Admin123!'),role=Role.ADMIN))
db.commit(); print('Seed complete. Admin: admin@tracker.com / Admin123!')
