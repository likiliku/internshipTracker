from app.ai.skill_normalizer import normalize_many
PARTIAL={"sql":"mysql","mysql":"sql","javascript":"typescript","typescript":"javascript"}
def analyse(student:list[str], required:list[str])->dict:
    have=set(normalize_many(student)); need=set(normalize_many(required)); matched=sorted(have&need); partial=[f"{x} → {PARTIAL[x]}" for x in have if PARTIAL.get(x) in need and x not in need]; missing=sorted(need-have-{PARTIAL.get(x) for x in have})
    return {"matched":matched,"partially_matched":partial,"missing":missing,"learning_areas":[f"{x.title()} fundamentals" for x in missing]}
