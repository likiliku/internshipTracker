import logging
import httpx
from typing import List, Dict, Any
from datetime import datetime
from app.services.job_providers.base_provider import BaseJobProvider
from app.ai.skill_extractor import extract_skills
from app.database.session import settings

logger = logging.getLogger(__name__)

class JSearchProvider(BaseJobProvider):
    def __init__(self):
        self.api_key = getattr(settings, 'jsearch_api_key', None)
        self.host = "jsearch.p.rapidapi.com"
        self.base_url = f"https://{self.host}/search-v2"

    async def search_jobs(self, keyword: str = "", location: str = "", page: int = 1, results_per_page: int = 20) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []

        query = keyword
        if location:
            query += f" in {location}"
            
        params = {
            "query": query or "Internship",
            "page": str(page),
            "num_pages": "1",
            "date_posted": "all"
        }

        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": self.host
        }

        try:
            async with httpx.AsyncClient(timeout=20) as client:
                res = await client.get(self.base_url, headers=headers, params=params)
                res.raise_for_status()
                data = res.json()
                
                jobs_data = data.get("data", [])
                if isinstance(jobs_data, dict):
                    jobs_list = jobs_data.get("jobs", [])
                else:
                    jobs_list = jobs_data
                    
                return [self.normalize_job(job) for job in jobs_list if isinstance(job, dict)]
        except Exception as e:
            logger.warning(f"JSearch API Error: {e}")
            return []

    def normalize_job(self, job: dict) -> dict:
        desc = job.get("job_description", "")
        skills = extract_skills(desc)
        
        posted_date = None
        if job.get("job_posted_at_timestamp"):
            try:
                posted_date = datetime.fromtimestamp(job["job_posted_at_timestamp"]).date()
            except:
                pass
                
        deadline_date = None
        if job.get("job_offer_expiration_timestamp"):
            try:
                deadline_date = datetime.fromtimestamp(job["job_offer_expiration_timestamp"]).date()
            except:
                pass

        location_parts = []
        if job.get("job_city"): location_parts.append(job["job_city"])
        if job.get("job_state"): location_parts.append(job["job_state"])
        if job.get("job_country"): location_parts.append(job["job_country"])
        location_str = ", ".join(location_parts) if location_parts else "Not specified"

        return {
            "external_id": str(job.get("job_id", "")),
            "source": "JSearch",
            "job_title": job.get("job_title", ""),
            "company_name": job.get("employer_name", "Unknown"),
            "description": desc,
            "location": location_str,
            "work_mode": "Remote" if job.get("job_is_remote") else "On-site",
            "stipend_min": job.get("job_min_salary"),
            "stipend_max": job.get("job_max_salary"),
            "currency": job.get("job_salary_currency", "INR") or "INR",
            "employment_type": job.get("job_employment_type", "Internship").capitalize(),
            "category": "Internship", 
            "required_skills": skills,
            "application_url": job.get("job_apply_link", ""),
            "posted_date": posted_date,
            "application_deadline": deadline_date
        }
