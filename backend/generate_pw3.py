import urllib.request
import json
from app.database.session import SessionLocal
from app.models import User
from app.core.security import serialize, token

db = SessionLocal()
user = db.query(User).filter(User.name=='likhitha').first()
tok = token(user)
usr = json.dumps(serialize(user))

script = f'''
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    page = context.new_page()
    
    page.goto("http://localhost:5173/")
    page.evaluate("localStorage.setItem('token', '{tok}')")
    
    user_str = """{usr}"""
    page.evaluate("localStorage.setItem('user', JSON.stringify(" + user_str + "))")
    
    page.goto("http://localhost:5173/student/recommendations")
    page.wait_for_timeout(3000)
    
    html = page.content()
    
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")
    rec_div = soup.select_one(".recommendations")
    
    with open("scraped.html", "w", encoding="utf-8") as f:
        f.write(str(rec_div))
        
    browser.close()
'''
with open('run_pw3.py', 'w') as f:
    f.write(script)
