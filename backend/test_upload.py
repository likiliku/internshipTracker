import requests
from app.core.security import token
from app.models import Role

class FakeUser:
    def __init__(self):
        self.id = 1
        self.role = Role.STUDENT

t = token(FakeUser())
res = requests.post(
    'http://localhost:8000/api/students/resume/upload', 
    headers={'Authorization': f'Bearer {t}'}, 
    files={'file': ('test.pdf', b'%PDF-1.4\nTest PDF', 'application/pdf')}
)
print(res.status_code, res.text)
