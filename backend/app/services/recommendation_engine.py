from typing import List, Dict, Any
import json
import logging
from google import genai  # type: ignore
from app.models import StudentProfile, Internship
from app.database.session import settings

logger = logging.getLogger(__name__)

def calculate_basic_match(student_skills: List[str], internship_skills: List[str]) -> Dict[str, Any]:
    if not student_skills and not internship_skills:
        return {"match_score": 50, "matched_skills": [], "missing_skills": []}
        
    if not internship_skills:
        return {"match_score": 35, "matched_skills": [], "missing_skills": []}
        
    if not student_skills:
        return {"match_score": 0, "matched_skills": [], "missing_skills": internship_skills}
        
    student_skills_lower = set([s.lower() for s in student_skills])
    internship_skills_lower = set([s.lower() for s in internship_skills])
    
    matched = list(student_skills_lower.intersection(internship_skills_lower))
    missing = list(internship_skills_lower.difference(student_skills_lower))
    
    base = 20
    score = base + int((len(matched) / len(internship_skills_lower)) * (100 - base)) if internship_skills_lower else 100
    
    matched_original = [s for s in internship_skills if s.lower() in matched]
    missing_original = [s for s in internship_skills if s.lower() in missing]
    
    return {
        "match_score": score,
        "matched_skills": matched_original,
        "missing_skills": missing_original
    }

def get_recommendations(profile: StudentProfile, internships: List[Internship]) -> List[Dict[str, Any]]:
    student_skills = [s.name for s in profile.skills] if profile.skills else []
    
    # 1. Calculate basic heuristic scores for all internships
    results = []
    for x in internships:
        req_skills = x.required_skills or []
        match_data = calculate_basic_match(student_skills, req_skills)
        
        reason = "Strong match with your skills." if match_data["match_score"] > 70 else "Partial match with your skills." if match_data["match_score"] > 30 else "Consider learning missing skills to improve your chances."
        
        results.append({
            "internship_id": x.id,
            "title": x.job_title,
            "company": x.company_name,
            "match_score": match_data["match_score"],
            "matched_skills": match_data["matched_skills"],
            "missing_skills": match_data["missing_skills"],
            "reason": reason,
            "_raw_internship": x
        })
        
    # Sort by basic score to find top candidates
    results.sort(key=lambda item: item["match_score"], reverse=True)
    
    # Return heuristic matches immediately to ensure fast response times
    for r in results: 
        r.pop("_raw_internship", None)
    return results[:10]
