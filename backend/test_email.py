import asyncio
from app.services.email_service import send_email_async
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("Sending test email to likilikhitha17@gmail.com...")
    success = await send_email_async(
        subject="Test Email from Khushi Tracker!",
        email_to="likilikhitha17@gmail.com",
        body="<h1>It Works!</h1><p>Your Gmail SMTP integration is successfully configured and running.</p>"
    )
    if success:
        print("Success! The email was sent.")
    else:
        print("Failed to send email. Check the logs for details.")

if __name__ == "__main__":
    asyncio.run(test())
