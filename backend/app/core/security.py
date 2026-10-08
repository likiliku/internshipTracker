from datetime import datetime, timedelta, date
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import bcrypt

from app.database.session import settings, get_db
from app.models import User

oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

class PwdContext:
    def hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    def verify(self, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

pwd = PwdContext()

def serialize(o):
    data = {c.name: getattr(o, c.name) for c in o.__table__.columns}
    for k, v in data.items():
        if isinstance(v, (datetime, date)): 
            data[k] = v.isoformat()
        elif hasattr(v, 'value'): 
            data[k] = v.value
    return data

def token(user): 
    return jwt.encode(
        {"sub": str(user.id), "role": user.role.value, "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)},
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )

def current_user(raw: str = Depends(oauth2), db: Session = Depends(get_db)):
    try: 
        uid = int(jwt.decode(raw, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])["sub"])
    except (JWTError, KeyError, ValueError): 
        raise HTTPException(401, "Invalid or expired token")
    
    user = db.get(User, uid)
    if not user: 
        raise HTTPException(401, "Account no longer exists")
    return user

def current_user_optional(raw: str = Depends(OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)), db: Session = Depends(get_db)):
    if not raw: return None
    try: 
        uid = int(jwt.decode(raw, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])["sub"])
        return db.get(User, uid)
    except: 
        return None

def require(*roles):
    def check(user = Depends(current_user)):
        if user.role not in roles: 
            raise HTTPException(403, "This action is not permitted for your role")
        return user
    return check
