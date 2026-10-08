import re
from app.ai.skill_normalizer import SKILLS, normalize_many
def extract_skills(text:str)->list[str]: return normalize_many([s for s in SKILLS if re.search(r"(?<!\w)"+re.escape(s)+r"(?!\w)",text.lower())])
