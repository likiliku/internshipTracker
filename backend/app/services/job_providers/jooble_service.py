import logging
import httpx
from typing import List, Dict, Any
from datetime import datetime
from app.services.job_providers.base_provider import BaseJobProvider
from app.ai.skill_extractor import extract_skills
from app.database.session import settings

logger = logging.getLogger(__name__)

class JoobleProvider(BaseJobProvider):
    def __init__(self):
        self.api_key = settings.jooble_api_key
        self.base_url = "https://jooble.org/api/"

    async def search_jobs(self, keyword: str = "", location: str = "", page: int = 1, results_per_page: int = 50) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []

        url = f"{self.base_url}{self.api_key}"
        payload = {
            "keywords": keyword,
            "location": location,
            "page": str(page)
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
                response.raise_for_status()
                data = response.json()
                return [self.normalize_job(job) for job in data.get("jobs", [])]
            except Exception as e:
                logger.warning(f"Jooble API error: {e}")
                return []

    def normalize_job(self, job: dict) -> dict:
        desc = job.get("snippet", "")
        # Remove HTML tags from Jooble snippet
        desc = desc.replace("<b>", "").replace("</b>", "").replace("&nbsp;", " ")
        skills = extract_skills(desc)
        posted_str = job.get("updated", "")
        
        try:
            posted_date = datetime.strptime(posted_str[:10], "%Y-%m-%d").date() if posted_str else None
        except:
            posted_date = None

        title = job.get("title", "")
        
        return {
            "external_id": str(job.get("id", job.get("link", ""))),
            "source": "Jooble",
            "job_title": title,
            "company_name": job.get("company", "Unknown"),
            "description": desc,
            "location": job.get("location", "Not specified"),
            "work_mode": "Remote" if "remote" in title.lower() or "remote" in desc.lower() else "On-site",
            "stipend_min": None,
            "stipend_max": None,
            "currency": "INR",
            "employment_type": "Internship" if "intern" in title.lower() or "intern" in desc.lower() else "Full-time",
            "category": job.get("type", "Not specified"),
            "required_skills": skills,
            "application_url": job.get("link", ""),
            "posted_date": posted_date,
            "application_deadline": None
        }
