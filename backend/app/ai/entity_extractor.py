import re
from app.ai.skill_extractor import extract_skills

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

def extract_entities(text: str) -> dict:
    data = {
        "name": None,
        "email": None,
        "phone": None,
        "education": {
            "college": None,
            "degree": None,
            "branch": None,
            "graduation_year": None,
            "cgpa": None
        },
        "skills": [],
        "projects": [],
        "certifications": [],
        "experience": [],
        "links": {
            "github": None,
            "linkedin": None,
            "portfolio": None
        }
    }
    
    confidence = {
        "name": 0,
        "email": 0,
        "phone": 0,
        "education": {
            "college": 0,
            "degree": 0,
            "branch": 0,
            "graduation_year": 0,
            "cgpa": 0
        },
        "skills": 0,
        "projects": 0,
        "certifications": 0,
        "experience": 0,
        "links": {
            "github": 0,
            "linkedin": 0,
            "portfolio": 0
        }
    }
    
    # Regex Extractions
    email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
    if email_match:
        data["email"] = email_match.group(0)
        confidence["email"] = 100
        
    phone_match = re.search(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b', text)
    if phone_match:
        data["phone"] = phone_match.group(0)
        confidence["phone"] = 90
        
    if "github.com/" in text.lower():
        gh = re.search(r'(https?://)?(www\.)?github\.com/[a-zA-Z0-9-]+', text)
        if gh: data["links"]["github"] = gh.group(0); confidence["links"]["github"] = 95
        
    if "linkedin.com/" in text.lower():
        li = re.search(r'(https?://)?(www\.)?linkedin\.com/in/[a-zA-Z0-9-]+', text)
        if li: data["links"]["linkedin"] = li.group(0); confidence["links"]["linkedin"] = 95
    
    cgpa_match = re.search(r'(?i)(?:cgpa|gpa)[\s:]*([0-9](?:\.[0-9]{1,2})?)(?:/10)?', text)
    if cgpa_match:
        try:
            data["education"]["cgpa"] = float(cgpa_match.group(1))
            confidence["education"]["cgpa"] = 85
        except: pass
        
    year_match = re.search(r'\b(201[0-9]|202[0-9]|203[0-9])\b', text)
    if year_match:
        data["education"]["graduation_year"] = int(year_match.group(1))
        confidence["education"]["graduation_year"] = 70
        
    extracted_skills = extract_skills(text)
    if extracted_skills:
        data["skills"] = [{"name": s} for s in extracted_skills]
        confidence["skills"] = 85
        
    if nlp:
        doc = nlp(text)
        for ent in doc.ents:
            if ent.label_ == "PERSON" and not data["name"]:
                if '\n' not in ent.text and len(ent.text.split()) >= 2:
                    data["name"] = ent.text
                    confidence["name"] = 80
            if ent.label_ == "ORG" and not data["education"]["college"]:
                if any(kw in ent.text.lower() for kw in ["university", "college", "institute", "school"]):
                    data["education"]["college"] = ent.text
                    confidence["education"]["college"] = 85

    # Section-based heuristic parsing
    lines = text.split('\n')
    current_section = None
    section_content = {"experience": [], "projects": [], "certifications": [], "achievements": []}
    
    for line in lines:
        line_clean = line.strip().upper()
        if not line_clean: continue
        
        # Identify sections
        if "EXPERIENCE" in line_clean and len(line_clean) < 30:
            current_section = "experience"
            continue
        elif "PROJECT" in line_clean and len(line_clean) < 20:
            current_section = "projects"
            continue
        elif ("CERTIFICATION" in line_clean or "COURSE" in line_clean) and len(line_clean) < 30:
            current_section = "certifications"
            continue
        elif ("ACHIEVEMENT" in line_clean or "AWARD" in line_clean) and len(line_clean) < 30:
            current_section = "achievements"
            continue
        elif any(kw in line_clean for kw in ["EDUCATION", "SKILL", "SUMMARY", "PROFILE"]) and len(line_clean) < 20:
            current_section = "other"
            continue
            
        if current_section in section_content:
            section_content[current_section].append(line.strip())

    if section_content["experience"]:
        exp_text = " \n ".join(section_content["experience"])
        if exp_text:
            data["experience"].append({
                "company": "Extracted Experience",
                "role": "Review and Edit",
                "description": exp_text[:1000]
            })
            confidence["experience"] = 50

    if section_content["projects"]:
        proj_text = " \n ".join(section_content["projects"])
        if proj_text:
            data["projects"].append({
                "name": "Extracted Projects",
                "description": proj_text[:1000]
            })
            confidence["projects"] = 50
            
    if section_content["certifications"]:
        for c in section_content["certifications"]:
            if len(c) > 10:
                data["certifications"].append({
                    "name": c[:100],
                    "issuer": "Review and Edit"
                })
        if data["certifications"]: confidence["certifications"] = 60
        
    if section_content["achievements"]:
        for a in section_content["achievements"]:
            if len(a) > 10:
                data["certifications"].append({
                    "name": f"Achievement: {a[:80]}",
                    "issuer": "N/A"
                })

    return {"data": data, "confidence": confidence}
