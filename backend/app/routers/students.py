import os
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.orm import Session
import logging

from app.database.session import get_db, settings
from app.models import StudentProfile, User, Role, Notification
from app.models.entities import StudentSkill, StudentProject, StudentCertification, StudentExperience, StudentPreference, StudentLink, StudentResume
from app.schemas.core import ProfileIn
from app.core.security import require, serialize, current_user
from app.ai.resume_parser import parse_resume

router = APIRouter(prefix="/api/students", tags=["students"])

def serialize_profile(p: StudentProfile):
    data = serialize(p)
    data['skills'] = [serialize(x) for x in p.skills]
    data['projects'] = [serialize(x) for x in p.projects]
    data['certifications'] = [serialize(x) for x in p.certifications]
    data['experience'] = [serialize(x) for x in p.experience]
    data['preferences'] = serialize(p.preferences) if p.preferences else None
    data['links'] = serialize(p.links) if p.links else None
    data['resume'] = serialize(p.resume) if p.resume else None
    return data

@router.get("/profile")
def profile(user=Depends(require(Role.STUDENT, Role.ADMIN)), db: Session = Depends(get_db)):
    p = db.scalar(select(StudentProfile).where(StudentProfile.user_id == user.id))
    if not p:
        p = StudentProfile(user_id=user.id)
        db.add(p)
        db.commit()
        db.refresh(p)
    return {**serialize(user), **serialize_profile(p)}

@router.put("/profile")
def update_profile(data: ProfileIn, user=Depends(require(Role.STUDENT, Role.ADMIN)), db: Session = Depends(get_db)):
    p = db.scalar(select(StudentProfile).where(StudentProfile.user_id == user.id))
    if not p:
        p = StudentProfile(user_id=user.id)
        db.add(p)
        db.flush()
    dump = data.model_dump()
    for k in ['college', 'degree', 'branch', 'current_year', 'graduation_year', 'cgpa']: 
        setattr(p, k, dump.get(k))
    
    # Update skills
    db.query(StudentSkill).filter_by(profile_id=p.id).delete()
    for s in dump.get('skills', []): db.add(StudentSkill(profile_id=p.id, **s))
    
    # Update projects
    db.query(StudentProject).filter_by(profile_id=p.id).delete()
    for proj in dump.get('projects', []): db.add(StudentProject(profile_id=p.id, **proj))
    
    # Update certifications
    db.query(StudentCertification).filter_by(profile_id=p.id).delete()
    for c in dump.get('certifications', []): db.add(StudentCertification(profile_id=p.id, **c))
    
    # Update experience
    db.query(StudentExperience).filter_by(profile_id=p.id).delete()
    for e in dump.get('experience', []): db.add(StudentExperience(profile_id=p.id, **e))
    
    # Update preferences and links
    if p.preferences: db.delete(p.preferences)
    if p.links: db.delete(p.links)
    db.flush()
    
    if dump.get('preferences'): db.add(StudentPreference(profile_id=p.id, **dump['preferences']))
    if dump.get('links'): db.add(StudentLink(profile_id=p.id, **dump['links']))
    
    db.commit()
    db.refresh(p)
    return {**serialize(user), **serialize_profile(p)}

@router.get("/notifications")
def notifications(user=Depends(current_user), db: Session = Depends(get_db)): 
    return [serialize(x) for x in db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())).all()]

@router.put("/notifications/{id}/read")
def read_notification(id: int, user=Depends(current_user), db: Session = Depends(get_db)):
    n = db.get(Notification, id)
    if not n or n.user_id != user.id: raise HTTPException(404, "Not found")
    n.is_read = True
    db.commit()
    return serialize(n)

@router.put("/notifications/read-all")
def read_all_notifications(user=Depends(current_user), db: Session = Depends(get_db)):
    for n in db.scalars(select(Notification).where(Notification.user_id == user.id, Notification.is_read == False)):
        n.is_read = True
    db.commit()
    return {"success": True}

@router.post("/resume/upload")
def upload_resume(file: UploadFile = File(...), user=Depends(require(Role.STUDENT, Role.ADMIN)), db: Session = Depends(get_db)):
    if file.content_type not in {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"} and not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(400, "Only PDF and DOCX resumes are accepted (.doc is not supported)")
    content = file.file.read()
    if len(content) > 10_000_000: 
        raise HTTPException(400, "Resume must be 10 MB or smaller")
        
    folder = Path(settings.upload_dir)
    folder.mkdir(parents=True, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    target = folder / f"{user.id}_{int(datetime.utcnow().timestamp())}{ext}"
    target.write_bytes(content)
    
    p = db.scalar(select(StudentProfile).where(StudentProfile.user_id == user.id))
    if not p:
        p = StudentProfile(user_id=user.id)
        db.add(p)
        db.flush()

    if p.resume:
        try: 
            os.remove(p.resume.storage_path)
        except Exception as e:
            logging.warning(f"Failed to delete old resume file {p.resume.storage_path}: {e}")
        db.delete(p.resume)
        db.flush()
        
    resume = StudentResume(profile_id=p.id, original_filename=file.filename, file_type=file.content_type, file_size=len(content), storage_path=str(target), uploaded_at=datetime.utcnow())
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    # Process immediately and return parsed data
    result = parse_resume(str(target), file.content_type)
    if "error" in result:
        db.delete(resume)
        db.commit()
        try: os.remove(target)
        except: pass
        raise HTTPException(400, f"Cannot parse resume: {result['error']}")
        
    resume.parsed_at = datetime.utcnow()
    db.commit()
    
    return {"success": True, "resume_id": resume.id, **result}

@router.delete("/resume/{resume_id}")
def delete_resume(resume_id: int, user=Depends(require(Role.STUDENT, Role.ADMIN)), db: Session = Depends(get_db)):
    p = db.scalar(select(StudentProfile).where(StudentProfile.user_id == user.id))
    if not p or not p.resume or p.resume.id != resume_id: 
        raise HTTPException(404, "Resume not found")
        
    try: 
        os.remove(p.resume.storage_path)
    except Exception as e:
        logging.warning(f"Failed to delete resume file {p.resume.storage_path}: {e}")
        
    db.delete(p.resume)
    db.commit()
    return {"success": True}
