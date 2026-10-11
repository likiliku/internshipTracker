from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import get_db
from app.schemas.core import ApplicationIn, ApplicationUpdate
from app.models import Application, Internship, Role, Notification, ApplicationStatusHistory, Company
from app.core.security import serialize, require

router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.post("", status_code=201)
def add_application(data:ApplicationIn, user=Depends(require(Role.STUDENT, Role.ADMIN)), db:Session=Depends(get_db)):
    if not db.get(Internship, data.internship_id): raise HTTPException(404, "Internship not found")
    if db.scalar(select(Application).where(Application.user_id==user.id, Application.internship_id==data.internship_id)): 
        raise HTTPException(409, "This internship is already tracked")
        
    x = Application(user_id=user.id, **data.model_dump())
    db.add(x)
    db.flush()
    db.add(ApplicationStatusHistory(application_id=x.id, status=x.status, notes="Application created"))
    db.commit()
    return serialize(x)

@router.get("")
def applications(user=Depends(require(Role.STUDENT, Role.ADMIN)), db:Session=Depends(get_db)):
    rows = db.scalars(select(Application).where(Application.user_id==user.id)).all()
    return [{**serialize(x), "internship": serialize(x.internship)} for x in rows]

@router.put("/{application_id}")
def update_application(application_id:int, data:ApplicationUpdate, user=Depends(require(Role.STUDENT, Role.COMPANY, Role.ADMIN)), db:Session=Depends(get_db)):
    x = db.get(Application, application_id)
    if not x: raise HTTPException(404, "Application not found")
    
    # Simple authorization check
    if user.role == Role.STUDENT and x.user_id != user.id:
        raise HTTPException(403, "Not authorized")
    elif user.role == Role.COMPANY and x.internship.company_id != db.scalar(select(Company).where(Company.user_id == user.id)).id:
        raise HTTPException(403, "Not authorized")
        
    old_status = x.status
    for k,v in data.model_dump(exclude_none=True).items(): setattr(x,k,v)
    
    if old_status != x.status:
        db.add(ApplicationStatusHistory(application_id=x.id, status=x.status, notes=x.notes))
        db.add(Notification(user_id=x.user_id, title="Application updated", message=f"Your {x.internship.job_title} application is now {x.status.value}.", type="status"))
        
    db.commit()
    return serialize(x)
