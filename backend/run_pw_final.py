
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    page = context.new_page()
    
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("response", lambda response: print(f"RESPONSE: {response.url} - {response.status}"))
    
    page.goto("http://localhost:5173/")
    page.evaluate("localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Iiwicm9sZSI6IlNUVURFTlQiLCJleHAiOjE3OTA3NzQ4NjN9.QhdIi3uKh5t-nN9k7hplk99PiJuvLowQYLn506PzYrI')")
    
    user_str = """{"id": 6, "name": "likhitha", "email": "likilikhitha17@gmail.com", "password_hash": "$2b$12$L6ll6P4UQf43lF7ffh0qQ.IlzzpB4Svu9SOiKWozmkCRNhzNHS8MK", "role": "STUDENT", "phone": null, "created_at": "2026-09-29T07:21:37", "updated_at": "2026-09-29T07:21:37"}"""
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
