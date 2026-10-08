from app.database.session import SessionLocal
from app.models import User
from app.core.security import token
import urllib.request
import json

db = SessionLocal()
user = db.query(User).filter(User.name=='likhitha').first()
if user:
    tok = token(user)
    req = urllib.request.Request('http://127.0.0.1:8000/api/ai/recommendations', headers={'Authorization': 'Bearer ' + tok})
    try:
        res = urllib.request.urlopen(req).read()
        data = json.loads(res.decode('utf-8'))
        print("HTTP Status: 200 OK")
        print("Data length:", len(data))
    except Exception as e:
        print("API ERROR:", e)
else:
    print("User not found")
