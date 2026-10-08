
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
    page.evaluate("localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Iiwicm9sZSI6IlNUVURFTlQiLCJleHAiOjE3OTA3NzI3Mjh9.LNwiHApD9WadfbpDs1wtE59rLiFhCloF_Ge3ZTVu3J0')")
    
    user_str = """{"id": 6, "name": "likhitha", "email": "likilikhitha17@gmail.com", "password_hash": "$2b$12$L6ll6P4UQf43lF7ffh0qQ.IlzzpB4Svu9SOiKWozmkCRNhzNHS8MK", "role": "STUDENT", "phone": null, "created_at": "2026-09-29T07:21:37", "updated_at": "2026-09-29T07:21:37"}"""
    page.evaluate("localStorage.setItem('user', JSON.stringify(" + user_str + "))")
    
    print("Navigating to recommendations...")
    page.goto("http://localhost:5173/student/recommendations")
    page.wait_for_timeout(3000)
    
    browser.close()
