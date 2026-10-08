from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from typing import List, Dict, Any

from app.database.session import get_db, settings
from app.models import Internship, PostingStatus, Role
from app.schemas.core import InternshipIn
from app.core.security import serialize, require
from app.models import Company
from app.services.job_providers.adzuna_service import AdzunaProvider
from app.services.job_providers.remotive_service import RemotiveProvider
from app.services.job_providers.jsearch_service import JSearchProvider
from app.services.job_providers.jooble_service import JoobleProvider
from app.ai.skill_extractor import extract_skills
from datetime import date
import asyncio
import time
from fastapi import Request

search_cache = {}
CACHE_TTL = 300
rate_limits = {}
RATE_LIMIT_SECONDS = 5

router = APIRouter(prefix="/api/internships", tags=["internships"])

@router.get("")
def get_internships(q:str="", location:str="", work_mode:str="", category:str="", sort:str="latest", page:int=1, limit:int=20, db:Session=Depends(get_db)):
    stmt = select(Internship).where(Internship.status == PostingStatus.APPROVED)
    if q: stmt = stmt.where(or_(Internship.job_title.ilike(f"%{q}%"), Internship.company_name.ilike(f"%{q}%"), Internship.description.ilike(f"%{q}%")))
    if location: stmt = stmt.where(Internship.location.ilike(f"%{location}%"))
    if work_mode: stmt = stmt.where(Internship.work_mode.ilike(f"%{work_mode}%"))
    if category: 
        if category.lower() != "other":
            stmt = stmt.where(or_(
                Internship.category.ilike(f"%{category}%"),
                Internship.job_title.ilike(f"%{category}%"),
                Internship.description.ilike(f"%{category}%")
            ))
    
    if sort == "salary":
        stmt = stmt.order_by(Internship.stipend_max.desc().nullslast())
    elif sort == "relevance":
        # Relevance sorting in DB is tough without full text search, just use latest for now
        stmt = stmt.order_by(Internship.created_at.desc())
    else:
        stmt = stmt.order_by(Internship.created_at.desc())
        
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.scalars(stmt.offset((page-1)*limit).limit(limit)).all()
    return {"items": [serialize(x) for x in rows], "total": total, "page": page, "page_size": limit}

@router.get("/search")
async def search_live_internships(request: Request, keyword:str="Internship", location:str="", page:int=1, limit:int=20, db:Session=Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    if ip in rate_limits and now - rate_limits[ip] < RATE_LIMIT_SECONDS:
        raise HTTPException(429, "Too many requests")
    rate_limits[ip] = now

    cache_key = (keyword.lower(), location.lower(), page, limit)
    if cache_key in search_cache:
        cached_time, cached_data = search_cache[cache_key]
        if now - cached_time < CACHE_TTL:
            return cached_data

    adzuna = AdzunaProvider()
    remotive = RemotiveProvider()
    jsearch = JSearchProvider()
    jooble = JoobleProvider()
    adzuna_res, remotive_res, jsearch_res, jooble_res = await asyncio.gather(
        adzuna.search_jobs(keyword, location, page, limit),
        remotive.search_jobs(keyword, location, page, limit),
        jsearch.search_jobs(keyword, location, page, limit),
        jooble.search_jobs(keyword, location, page, limit)
    )
    result = {"provider": "Multiple", "items": adzuna_res + remotive_res + jsearch_res + jooble_res}
    search_cache[cache_key] = (now, result)
    return result

@router.post("/sync")
async def sync_internships(keyword:str="Internship", location:str="", user=Depends(require(Role.ADMIN)), db:Session=Depends(get_db)):
    adzuna = AdzunaProvider()
    remotive = RemotiveProvider()
    jsearch = JSearchProvider()
    jooble = JoobleProvider()
    adzuna_res, remotive_res, jsearch_res, jooble_res = await asyncio.gather(
        adzuna.search_jobs(keyword, location, 1, 25),
        remotive.search_jobs(keyword, location, 1, 25),
        jsearch.search_jobs(keyword, location, 1, 25),
        jooble.search_jobs(keyword, location, 1, 25)
    )
    results = adzuna_res + remotive_res + jsearch_res + jooble_res
    added = 0
    for values in results:
        existing = db.scalar(select(Internship).where(Internship.source==values['source'], Internship.external_id==values['external_id']))
        if not existing:
            values['status'] = PostingStatus.APPROVED
            db.add(Internship(**values))
            added += 1
    db.commit()
    return {"synced": added, "provider": "All Providers"}

from app.core.security import current_user_optional

@router.get("/{id}")
def get_internship_by_id(id:int, user=Depends(current_user_optional), db:Session=Depends(get_db)):
    x = db.get(Internship, id)
    if not x: raise HTTPException(404, "Internship not found")
    
    if x.status != PostingStatus.APPROVED:
        if not user or (user.role != Role.ADMIN and user.id != x.company_id):
            raise HTTPException(404, "Internship not found")
            
    return serialize(x)

@router.post("")
def create_internship(data: InternshipIn, user=Depends(require(Role.COMPANY)), db:Session=Depends(get_db)):
    company = db.scalar(select(Company).where(Company.user_id == user.id))
    if not company: raise HTTPException(400, "Company profile not found")
    
    internship = Internship(
        **data.model_dump(),
        company_id=company.id,
        company_name=company.name,
        source="Direct",
        status=PostingStatus.PENDING
    )
    db.add(internship)
    db.commit()
    db.refresh(internship)
    return serialize(internship)

@router.put("/{id}")
def update_internship(id: int, data: InternshipIn, user=Depends(require(Role.COMPANY)), db:Session=Depends(get_db)):
    x = db.get(Internship, id)
    if not x: raise HTTPException(404, "Internship not found")
    company = db.scalar(select(Company).where(Company.user_id == user.id))
    if x.company_id != company.id: raise HTTPException(403, "Not authorized")
    
    for k, v in data.model_dump().items():
        setattr(x, k, v)
    x.status = PostingStatus.PENDING # Re-verify after edit
    db.commit()
    return serialize(x)

@router.delete("/{id}")
def delete_internship(id: int, user=Depends(require(Role.COMPANY)), db:Session=Depends(get_db)):
    x = db.get(Internship, id)
    if not x: raise HTTPException(404, "Internship not found")
    company = db.scalar(select(Company).where(Company.user_id == user.id))
    if x.company_id != company.id: raise HTTPException(403, "Not authorized")
    
    db.delete(x)
    db.commit()
    return {"success": True}

@router.get("/company/mine")
def get_my_internships(user=Depends(require(Role.COMPANY)), db:Session=Depends(get_db)):
    company = db.scalar(select(Company).where(Company.user_id == user.id))
    if not company: return []
    rows = db.scalars(select(Internship).where(Internship.company_id == company.id).order_by(Internship.created_at.desc())).all()
    return [serialize(x) for x in rows]

from app.models import Application, User, StudentProfile
from sqlalchemy.orm import selectinload

@router.get("/{id}/applicants")
def get_applicants(id: int, user=Depends(require(Role.COMPANY)), db:Session=Depends(get_db)):
    x = db.get(Internship, id)
    if not x: raise HTTPException(404, "Internship not found")
    company = db.scalar(select(Company).where(Company.user_id == user.id))
    if x.company_id != company.id: raise HTTPException(403, "Not authorized")
    
    apps = db.scalars(select(Application).where(Application.internship_id == id).options(
        selectinload(Application.user).selectinload(User.student_profile)
    )).all()
    
    results = []
    for a in apps:
        p = a.user.student_profile
        results.append({
            "id": a.id,
            "status": a.status.value,
            "applied_date": str(a.applied_date) if a.applied_date else None,
            "student_id": a.user.id,
            "student_name": a.user.name,
            "student_email": a.user.email,
            "student_college": p.college if p else None,
            "student_skills": [s.name for s in p.skills] if p and p.skills else []
        })
    return results
