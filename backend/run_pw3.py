
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context()
    page = context.new_page()
    
    page.goto("http://localhost:5173/")
    page.evaluate("localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Iiwicm9sZSI6IlNUVURFTlQiLCJleHAiOjE3OTA3NzI5MjJ9.na94x8mKnDB5uO7vLJOa26kbXxKAj8WhiR5ZbJqI_k8')")
    
    user_str = """{"id": 6, "name": "likhitha", "email": "likilikhitha17@gmail.com", "password_hash": "$2b$12$L6ll6P4UQf43lF7ffh0qQ.IlzzpB4Svu9SOiKWozmkCRNhzNHS8MK", "role": "STUDENT", "phone": null, "created_at": "2026-09-29T07:21:37", "updated_at": "2026-09-29T07:21:37"}"""
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
