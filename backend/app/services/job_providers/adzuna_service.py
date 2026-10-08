import logging
import httpx
from typing import List, Dict, Any
from app.services.job_providers.base_provider import BaseJobProvider
from app.ai.skill_extractor import extract_skills
from app.database.session import settings
from datetime import datetime

logger = logging.getLogger(__name__)

class AdzunaProvider(BaseJobProvider):
    async def search_jobs(self, keyword: str = "", location: str = "", page: int = 1, results_per_page: int = 20) -> List[Dict[str, Any]]:
        if not settings.adzuna_app_id or not settings.adzuna_app_key:
            return []
            
        url = f"https://api.adzuna.com/v1/api/jobs/in/search/{page}"
        params = {
            "app_id": settings.adzuna_app_id,
            "app_key": settings.adzuna_app_key,
            "what": keyword,
            "where": location,
            "results_per_page": results_per_page
        }
        
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.get(url, params=params)
                res.raise_for_status()
                results = res.json().get("results", [])
        except Exception as e:
            logger.warning(f"Adzuna API Error: {e}")
            return []
            
        return [self.normalize_job(x) for x in results]
        
    def normalize_job(self, x: dict) -> dict:
        desc = x.get('description', '')
        skills = extract_skills(desc)
        posted_str = x.get('created', '')
        try:
            posted_date = datetime.strptime(posted_str[:10], "%Y-%m-%d").date() if posted_str else None
        except:
            posted_date = None

        return {
            "external_id": str(x['id']),
            "source": "Adzuna",
            "job_title": x.get('title', ''),
            "company_name": x.get('company', {}).get('display_name', 'Unknown'),
            "description": desc,
            "location": x.get('location', {}).get('display_name', 'Not specified'),
            "work_mode": "Remote" if 'remote' in desc.lower() else "On-site",
            "stipend_min": x.get('salary_min'),
            "stipend_max": x.get('salary_max'),
            "currency": "INR",
            "employment_type": "Internship",
            "category": x.get('category', {}).get('label', 'Not specified'),
            "required_skills": skills,
            "application_url": x.get('redirect_url', ''),
            "posted_date": posted_date,
            "application_deadline": None
        }
