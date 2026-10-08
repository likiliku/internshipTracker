from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Dict

from app.database.session import get_db
from app.models import StudentProfile, Internship, Role, PostingStatus, Application
from app.core.security import require
from app.services.recommendation_engine import get_recommendations
from app.ai.mock_interview import start_interview, evaluate_answer
from app.ai.skill_gap import analyse

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.get("/skill-gap")
def skill_gap(internship_id: int, user=Depends(require(Role.STUDENT)), db: Session = Depends(get_db)):
    p = db.scalar(select(StudentProfile).where(StudentProfile.user_id == user.id))
    if not p:
        raise HTTPException(404, "Profile not found")
    x = db.get(Internship, internship_id)
    if not x: 
        raise HTTPException(404, "Internship not found")
    return analyse([s.name for s in p.skills] if p.skills else [], x.required_skills or [])

@router.get("/recommendations")
def recommendations(user=Depends(require(Role.STUDENT)), db:Session=Depends(get_db)):
    print(f"DEBUG API HIT: User ID: {user.id}")
    profile = db.scalar(select(StudentProfile).where(StudentProfile.user_id==user.id))
    print(f"DEBUG PROFILE: {profile}")
    rows = db.scalars(select(Internship).where(Internship.status==PostingStatus.APPROVED)).all()
    print(f"DEBUG INTERNSHIPS COUNT: {len(rows)}")
    
    if not profile:
        print("DEBUG: Returning empty because no profile")
        return []
        
    recs = get_recommendations(profile, rows)
    print(f"DEBUG RECS COUNT: {len(recs)}")
    return recs

class StartInterviewReq(BaseModel):
    application_id: int

class ReplyInterviewReq(BaseModel):
    application_id: int
    chat_history: List[Dict[str, str]]
    latest_answer: str

@router.post("/mock-interview/start")
def mock_interview_start(req: StartInterviewReq, user=Depends(require(Role.STUDENT)), db:Session=Depends(get_db)):
    app = db.get(Application, req.application_id)
    if not app or app.user_id != user.id: raise HTTPException(404, "Application not found")
    
    intern = app.internship
    try:
        q = start_interview(intern.job_title, intern.company_name, ", ".join(intern.required_skills), user.name)
        return {"question": q}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/mock-interview/reply")
def mock_interview_reply(req: ReplyInterviewReq, user=Depends(require(Role.STUDENT)), db:Session=Depends(get_db)):
    app = db.get(Application, req.application_id)
    if not app or app.user_id != user.id: raise HTTPException(404, "Application not found")
    
    intern = app.internship
    try:
        return evaluate_answer(intern.job_title, ", ".join(intern.required_skills), req.chat_history, req.latest_answer)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
