from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta

from app.database.session import get_db
from app.models import User, StudentProfile, Company, Role, OTPVerification
from app.schemas.core import RegisterIn, LoginIn, OTPLoginIn, OTPVerifyIn
from app.core.security import pwd, serialize, token, current_user
from app.services.email_service import send_email_async

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(409, "An account with this email already exists")
        
    user = User(name=data.name, email=data.email, password_hash=pwd.hash(data.password), role=data.role, phone=data.phone)
    db.add(user)
    db.flush()
    
    if data.role == Role.STUDENT: 
        db.add(StudentProfile(user_id=user.id))
    if data.role == Role.COMPANY: 
        db.add(Company(user_id=user.id, name=data.name))
        
    db.commit()
    return {"access_token": token(user), "token_type": "bearer", "user": serialize(user)}

@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email))
    if not user or not pwd.verify(data.password, user.password_hash): 
        raise HTTPException(401, "Incorrect email or password")
    if user.role != Role.ADMIN:
        raise HTTPException(403, "Password login is restricted to administrators only. Users must log in via OTP.")
    return {"access_token": token(user), "token_type": "bearer", "user": serialize(user)}

@router.get("/me")
def me(user = Depends(current_user)): 
    return serialize(user)

@router.post("/send-otp")
def send_otp(data: OTPLoginIn, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    old_otps = db.scalars(select(OTPVerification).where(OTPVerification.email == data.email)).all()
    for o in old_otps: db.delete(o)
    
    otp_code = str(random.randint(100000, 999999))
    expires = datetime.utcnow() + timedelta(minutes=10)
    
    otp_entry = OTPVerification(email=data.email, otp=otp_code, expires_at=expires)
    db.add(otp_entry)
    db.commit()
    
    background_tasks.add_task(
        send_email_async,
        subject="Your InternIQ Login OTP",
        email_to=data.email,
        body=f"<h1>Login Verification</h1><p>Your one-time password is: <b>{otp_code}</b></p><p>This code expires in 10 minutes.</p>"
    )
    return {"message": "OTP sent successfully"}

@router.post("/verify-otp")
def verify_otp(data: OTPVerifyIn, db: Session = Depends(get_db)):
    otp_entry = db.scalar(select(OTPVerification).where(
        OTPVerification.email == data.email,
        OTPVerification.otp == data.otp,
        OTPVerification.is_used == False,
        OTPVerification.expires_at > datetime.utcnow()
    ))
    
    if not otp_entry:
        raise HTTPException(401, "Invalid or expired OTP")
        
    otp_entry.is_used = True
    
    user = db.scalar(select(User).where(User.email == data.email))
    if not user:
        user = User(name=data.email.split('@')[0], email=data.email, password_hash=pwd.hash(data.otp), role=Role.STUDENT)
        db.add(user)
        db.flush()
        db.add(StudentProfile(user_id=user.id))
        
    db.commit()
    
    return {"access_token": token(user), "token_type": "bearer", "user": serialize(user)}
