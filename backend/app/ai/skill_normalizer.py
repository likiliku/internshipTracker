ALIASES={"js":"javascript","reactjs":"react","react.js":"react","my sql":"mysql","spring":"spring boot","py":"python","nodejs":"node.js"}
SKILLS={"python","java","javascript","typescript","react","node.js","fastapi","spring boot","sql","mysql","postgresql","mongodb","docker","aws","azure","git","html","css","machine learning","scikit-learn","tensorflow","pandas","figma","excel","c++","angular","kubernetes"}
def normalize(skill:str)->str: return ALIASES.get(" ".join(skill.lower().strip().split())," ".join(skill.lower().strip().split()))
def normalize_many(values:list[str])->list[str]: return sorted({normalize(x) for x in values if normalize(x)})
