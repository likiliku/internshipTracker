from datetime import date
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.base import Base
from app.database.session import engine, get_db, settings
from app.models import Internship, Company, Role, PostingStatus
from app.schemas.core import InternshipIn
from app.ai.skill_extractor import extract_skills
from app.core.security import require, serialize

Base.metadata.create_all(bind=engine)
app = FastAPI(title="Intelligent Internship Tracking System with AI", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in settings.cors_origins.split(',')], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

from apscheduler.schedulers.background import BackgroundScheduler
from app.services.reminders import generate_reminders

scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(generate_reminders, 'interval', hours=6, id="generate_reminders_job", replace_existing=True)
    scheduler.start()
    
@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()

@app.get("/health")
def health(): 
    return {"status": "ok"}

@app.post("/api/internships", status_code=201)
def create_internship(data: InternshipIn, user=Depends(require(Role.COMPANY, Role.ADMIN)), db: Session = Depends(get_db)):
    values = data.model_dump()
    values['required_skills'] = extract_skills(values['description'] + ' ' + ' '.join(values['required_skills'])) or values['required_skills']
    values['source'] = 'company'
    values['posted_date'] = date.today()
    values['status'] = PostingStatus.APPROVED if user.role == Role.ADMIN else PostingStatus.PENDING
    
    x = Internship(**values)
    if user.role == Role.COMPANY:
        company = db.scalar(select(Company).where(Company.user_id == user.id))
        if company:
            x.company_id = company.id
            
    db.add(x)
    db.commit()
    return serialize(x)

@app.put("/api/internships/{internship_id}")
def edit_internship(internship_id: int, data: InternshipIn, user=Depends(require(Role.COMPANY, Role.ADMIN)), db: Session = Depends(get_db)):
    x = db.get(Internship, internship_id)
    if not x: 
        raise HTTPException(404, "Internship not found")
    
    if user.role == Role.COMPANY:
        company = db.scalar(select(Company).where(Company.user_id == user.id))
        if not company or x.company_id != company.id:
            raise HTTPException(403, "You can only edit internships posted by your company")
            
    for k, v in data.model_dump().items(): 
        setattr(x, k, v)
    if user.role == Role.COMPANY:
        x.status = PostingStatus.PENDING
    db.commit()
    return serialize(x)

@app.delete("/api/internships/{internship_id}", status_code=204)
def delete_internship(internship_id: int, user=Depends(require(Role.COMPANY, Role.ADMIN)), db: Session = Depends(get_db)):
    x = db.get(Internship, internship_id)
    if not x: 
        raise HTTPException(404, "Internship not found")
    
    if user.role == Role.COMPANY:
        company = db.scalar(select(Company).where(Company.user_id == user.id))
        if not company or x.company_id != company.id:
            raise HTTPException(403, "You can only delete internships posted by your company")
            
    db.delete(x)
    db.commit()

from app.routers import auth, students, admin, companies, internships, applications, ai

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(admin.router)
app.include_router(companies.router)
app.include_router(internships.router)
app.include_router(applications.router)
app.include_router(ai.router)
