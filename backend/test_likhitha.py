from app.database.session import SessionLocal
from app.models import User, StudentProfile, Internship, PostingStatus
from sqlalchemy import select
from app.services.recommendation_engine import get_recommendations

db = SessionLocal()
user = db.query(User).filter(User.name=='likhitha').first()
if user:
    profile = db.scalar(select(StudentProfile).where(StudentProfile.user_id==user.id))
    internships = db.scalars(select(Internship).where(Internship.status==PostingStatus.APPROVED)).all()
    try:
        recs = get_recommendations(profile, internships)
        print("Success! Number of recs:", len(recs))
        for r in recs[:2]:
            print(r)
    except Exception as e:
        print("RECOMMENDATION ERROR:", e)
        import traceback; traceback.print_exc()
else:
    print("User not found")
