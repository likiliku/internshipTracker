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
    
    page.on("console", lambda msg: print("CONSOLE:", msg.text))
    page.on("pageerror", lambda err: print("PAGE ERROR:", err.message))
    page.on("response", lambda res: print("NETWORK:", res.url, res.status) if "api" in res.url else None)
    
    print("Navigating to setup local storage...")
    page.goto("http://localhost:5173/")
    page.evaluate("localStorage.setItem('token', '{tok}')")
    
    user_str = """{usr}"""
    page.evaluate("localStorage.setItem('user', JSON.stringify(" + user_str + "))")
    
    print("Navigating to recommendations...")
    page.goto("http://localhost:5173/student/recommendations")
    page.wait_for_timeout(3000)
    
    browser.close()
'''
with open('run_pw.py', 'w') as f:
    f.write(script)
