import fitz # PyMuPDF
import docx
import json
import logging
from google import genai  # type: ignore
from app.database.session import settings

logger = logging.getLogger(__name__)

def parse_pdf(file_path: str) -> str:
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text("text") + "\n"
    except Exception as e:
        logger.error(f"Error reading PDF: {e}")
    return text

def parse_docx(file_path: str) -> str:
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        logger.error(f"Error reading DOCX: {e}")
    return text

def parse_resume(file_path: str, file_type: str) -> dict:
    if file_type == "application/pdf" or file_path.endswith(".pdf"):
        text = parse_pdf(file_path)
    elif "word" in file_type or file_path.endswith(".docx"):
        text = parse_docx(file_path)
    else:
        text = ""
        
    if not text.strip():
        return {"error": "No text could be extracted. The file might be an image or unsupported format."}
        
    # Use Gemini to extract entities reliably
    api_key = settings.gemini_api_key
    if not api_key:
        logger.warning("No Gemini API Key set. Falling back to simple heuristic parser.")
        from app.ai.entity_extractor import extract_entities
        return extract_entities(text)
        
    client = genai.Client(api_key=api_key)
    
    prompt = f"""
    You are an expert resume parser. Extract the following information from the resume text provided below.
    Format your response EXACTLY as a JSON object, with no markdown formatting or extra text.
    {{
        "data": {{
            "name": "Full Name or null",
            "email": "Email Address or null",
            "phone": "Phone Number or null",
            "education": {{
                "college": "College Name or null",
                "degree": "Degree (e.g. B.Tech) or null",
                "branch": "Branch/Major or null",
                "graduation_year": YYYY (number) or null,
                "cgpa": CGPA (number out of 10) or null
            }},
            "skills": [
                {{"name": "Skill 1"}},
                {{"name": "Skill 2"}}
            ],
            "projects": [
                {{"name": "Project Name", "description": "Brief description"}}
            ],
            "certifications": [
                {{"name": "Certification Name", "issuer": "Issuer Name"}}
            ],
            "experience": [
                {{"company": "Company Name", "role": "Role Title", "description": "Brief description of work"}}
            ],
            "links": {{
                "github": "URL or null",
                "linkedin": "URL or null",
                "portfolio": "URL or null"
            }}
        }},
        "confidence": {{
            "name": 100,
            "email": 100,
            "phone": 100,
            "education": {{"college": 90, "degree": 90, "branch": 90, "graduation_year": 90, "cgpa": 90}},
            "skills": 95,
            "projects": 90,
            "certifications": 90,
            "experience": 90,
            "links": {{"github": 100, "linkedin": 100, "portfolio": 100}}
        }}
    }}
    
    Resume Text:
    ---
    {text[:15000]}
    ---
    
    Output ONLY valid JSON.
    """
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt
        )
        response_text = response.text.strip()
        # Strip markdown if present
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
            
        return json.loads(response_text)
    except Exception as e:
        logger.error(f"Gemini API Error in resume parser: {e}")
        # Fallback to heuristic parser
        from app.ai.entity_extractor import extract_entities
        return extract_entities(text)
