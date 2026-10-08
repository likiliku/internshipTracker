import logging
import httpx
from typing import List, Dict, Any
from datetime import datetime
from app.services.job_providers.base_provider import BaseJobProvider
from app.ai.skill_extractor import extract_skills

logger = logging.getLogger(__name__)

class RemotiveProvider(BaseJobProvider):
    def __init__(self):
        self.base_url = "https://remotive.com/api/remote-jobs"

    async def search_jobs(self, keyword: str = "", location: str = "", page: int = 1, results_per_page: int = 20) -> List[Dict[str, Any]]:
        query = keyword or "Software"
        
        params = {
            "search": query,
            "limit": results_per_page
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.get(self.base_url, params=params)
                res.raise_for_status()
                data = res.json()
                return [self.normalize_job(job) for job in data.get("jobs", [])]
        except Exception as e:
            logger.warning(f"Remotive API Error: {e}")
            return []

    def normalize_job(self, job: dict) -> dict:
        desc = job.get("description", "")
        skills = extract_skills(desc)
        
        posted_date = None
        if job.get("publication_date"):
            try:
                posted_date = datetime.fromisoformat(job["publication_date"]).date()
            except:
                pass

        location_str = job.get("candidate_required_location", "Remote")

        stipend_min = None
        stipend_max = None
        currency = "USD"
        
        return {
            "external_id": str(job.get("id", "")),
            "source": "Remotive",
            "job_title": job.get("title", ""),
            "company_name": job.get("company_name", "Unknown"),
            "description": desc,
            "location": location_str,
            "work_mode": "Remote",
            "stipend_min": stipend_min,
            "stipend_max": stipend_max,
            "currency": currency,
            "employment_type": job.get("job_type", "full_time").replace("_", " ").capitalize(),
            "category": job.get("category", "Software Development"), 
            "required_skills": skills,
            "application_url": job.get("url", ""),
            "posted_date": posted_date,
            "application_deadline": None
        }
