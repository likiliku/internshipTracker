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
    
    page.on("console", lambda msg: print(f"CONSOLE: {{msg.text}}"))
    page.on("response", lambda response: print(f"RESPONSE: {{response.url}} - {{response.status}}"))
    
    page.goto("http://localhost:5173/")
    page.evaluate("localStorage.setItem('token', '{tok}')")
    
    user_str = """{usr}"""
    page.evaluate("localStorage.setItem('user', JSON.stringify(" + user_str + "))")
    
    page.goto("http://localhost:5173/student/recommendations")
    page.wait_for_timeout(3000)
    
    # Let's see the text content of the page-title
    print("PAGE TITLE:", page.locator('.page-title').inner_text())
    
    # Check if there are any articles
    articles = page.locator('article.recommendation')
    print("ARTICLES COUNT:", articles.count())
    
    page.screenshot(path="debug_pw.png")
    
    browser.close()
'''
with open('run_pw_final.py', 'w') as f:
    f.write(script)
