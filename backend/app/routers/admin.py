from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, selectinload
from typing import List

from app.database.session import get_db
from app.models import User, Internship, Application, Role, PostingStatus, ApplicationStatus, StudentProfile, Notification, Company
from app.core.security import require, serialize
from app.schemas.core import AdminStudentSummary, AdminStudentDetail, ApplicationSummaryCounts
from app.services.email_service import send_email_async

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/dashboard")
def admin_dashboard(user=Depends(require(Role.ADMIN)), db: Session = Depends(get_db)):
    return {
        "students": db.scalar(select(func.count()).select_from(User).where(User.role == Role.STUDENT)),
        "companies": db.scalar(select(func.count()).select_from(User).where(User.role == Role.COMPANY)),
        "internships": db.scalar(select(func.count()).select_from(Internship)),
        "applications": db.scalar(select(func.count()).select_from(Application)),
        "pending": db.scalar(select(func.count()).select_from(Internship).where(Internship.status == PostingStatus.PENDING)),
        "selected": db.scalar(select(func.count()).select_from(Application).where(Application.status == ApplicationStatus.SELECTED))
    }

@router.put("/internships/{internship_id}/approve")
def approve(internship_id: int, background_tasks: BackgroundTasks, user=Depends(require(Role.ADMIN)), db: Session = Depends(get_db)):
    x = db.get(Internship, internship_id)
    if not x: raise HTTPException(404, "Internship not found")
    x.status = PostingStatus.APPROVED
    if x.company_id:
        company = db.get(Company, x.company_id)
        if company:
            db.add(Notification(user_id=company.user_id, title="Internship Approved", message=f"Your posting '{x.job_title}' has been approved.", type="INFO"))
            if company.user and company.user.email:
                background_tasks.add_task(
                    send_email_async,
                    subject="Internship Approved - InternIQ",
                    email_to=company.user.email,
                    body=f"<h1>Congratulations!</h1><p>Your posting <b>'{x.job_title}'</b> has been approved and is now live.</p>"
                )
    db.commit()
    return serialize(x)

@router.put("/internships/{internship_id}/reject")
def reject(internship_id: int, background_tasks: BackgroundTasks, user=Depends(require(Role.ADMIN)), db: Session = Depends(get_db)):
    x = db.get(Internship, internship_id)
    if not x: raise HTTPException(404, "Internship not found")
    x.status = PostingStatus.REJECTED
    if x.company_id:
        company = db.get(Company, x.company_id)
        if company:
            db.add(Notification(user_id=company.user_id, title="Internship Rejected", message=f"Your posting '{x.job_title}' was rejected.", type="WARNING"))
            if company.user and company.user.email:
                background_tasks.add_task(
                    send_email_async,
                    subject="Internship Rejected - InternIQ",
                    email_to=company.user.email,
                    body=f"<h1>Internship Status Update</h1><p>Unfortunately, your posting <b>'{x.job_title}'</b> was rejected by the admin team.</p>"
                )
    db.commit()
    return serialize(x)

@router.get("/users")
def admin_users(user=Depends(require(Role.ADMIN)), db: Session = Depends(get_db)): 
    return [serialize(x) for x in db.scalars(select(User)).all()]

@router.get("/internships")
def admin_internships(user=Depends(require(Role.ADMIN)), db: Session = Depends(get_db)): 
    return [serialize(x) for x in db.scalars(select(Internship)).all()]

def _build_student_summary(u: User, profile: StudentProfile | None, apps: list[Application]) -> dict:
    counts = ApplicationSummaryCounts()
    for a in apps:
        counts.total += 1
        if a.status in (ApplicationStatus.SAVED, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW): counts.pending += 1
        elif a.status == ApplicationStatus.SELECTED: counts.selected += 1
        elif a.status == ApplicationStatus.REJECTED: counts.rejected += 1
        elif a.status == ApplicationStatus.WITHDRAWN: counts.withdrawn += 1
    return {
        "id": u.id, "name": u.name, "email": u.email, "phone": u.phone,
        "college": profile.college if profile else None,
        "degree": profile.degree if profile else None,
        "branch": profile.branch if profile else None,
        "graduation_year": profile.graduation_year if profile else None,
        "cgpa": profile.cgpa if profile else None,
        "application_summary": counts.model_dump()
    }

@router.get("/students")
def get_students(page:int=1, limit:int=20, q:str="", status:str="", user=Depends(require(Role.ADMIN)), db: Session = Depends(get_db)):
    conditions = [User.role == Role.STUDENT]
    if q:
        conditions.append(or_(User.name.ilike(f"%{q}%"), User.email.ilike(f"%{q}%")))
    
    if status:
        status_lower = status.lower()
        if status_lower == "pending":
            conditions.append(User.applications.any(Application.status.in_([ApplicationStatus.SAVED, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW])))
        elif status_lower == "selected":
            conditions.append(User.applications.any(Application.status == ApplicationStatus.SELECTED))
        elif status_lower == "rejected":
            conditions.append(User.applications.any(Application.status == ApplicationStatus.REJECTED))
            
    total = db.scalar(select(func.count()).select_from(User).where(*conditions))
    
    stmt = select(User).where(*conditions).options(
        selectinload(User.student_profile),
        selectinload(User.applications)
    ).limit(limit).offset((page - 1) * limit)
    
    users = db.scalars(stmt).all()
    
    items = [_build_student_summary(u, u.student_profile, u.applications) for u in users]
    
    return {"items": items, "total": total, "page": page, "page_size": limit}

@router.get("/students/{student_id}")
def get_student_detail(student_id: int, user=Depends(require(Role.ADMIN)), db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.id == student_id, User.role == Role.STUDENT).options(
        selectinload(User.student_profile),
        selectinload(User.applications).selectinload(Application.internship)
    ))
    if not u: raise HTTPException(404, "Student not found")
    
    summary = _build_student_summary(u, u.student_profile, u.applications)
    apps = []
    for a in u.applications:
        apps.append({
            "internship_id": a.internship_id,
            "job_title": a.internship.job_title,
            "company_name": a.internship.company_name,
            "status": a.status.value,
            "applied_date": str(a.applied_date) if a.applied_date else None,
            "interview_date": str(a.interview_date) if a.interview_date else None,
            "follow_up_date": str(a.follow_up_date) if a.follow_up_date else None,
            "notes": a.notes
        })
    summary["applications"] = apps
    return summary
