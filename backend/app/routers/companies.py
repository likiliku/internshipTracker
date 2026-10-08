from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Company, Role
from app.core.security import require, serialize

router = APIRouter(prefix="/api/companies", tags=["companies"])

@router.post("")
def update_company(name: str, website: str | None = None, description: str | None = None, user=Depends(require(Role.COMPANY)), db: Session = Depends(get_db)):
    company = db.scalar(select(Company).where(Company.user_id == user.id))
    company.name = name
    company.website = website
    company.description = description
    db.commit()
    return serialize(company)

@router.get("/{company_id}")
def company(company_id: int, db: Session = Depends(get_db)):
    x = db.get(Company, company_id)
    if not x: 
        raise HTTPException(404, "Company not found")
    return serialize(x)
