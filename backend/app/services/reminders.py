import logging
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database.session import SessionLocal
from app.models import Application, Notification, ApplicationStatus

logger = logging.getLogger(__name__)

def generate_reminders():
    logger.info("Running reminder checks...")
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        today_date = now.date()
        
        apps = db.scalars(select(Application).where(Application.status.in_([ApplicationStatus.SAVED, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW]))).all()
        
        for app in apps:
            # 1. Follow-up date (due today)
            if app.follow_up_date and app.follow_up_date == today_date:
                ref_id = f"followup_{app.id}_{today_date}"
                if not db.scalar(select(Notification).where(Notification.reference_id == ref_id)):
                    db.add(Notification(
                        user_id=app.user_id,
                        title="Follow-up Reminder",
                        message=f"You have a follow-up scheduled today for your application at {app.internship.company_name}.",
                        type="INFO",
                        reference_id=ref_id
                    ))
            
            # 2. Interview date (24h before)
            if app.interview_date:
                time_diff = app.interview_date - now
                if timedelta(hours=0) < time_diff <= timedelta(hours=24):
                    ref_id = f"interview_{app.id}_{app.interview_date.date()}"
                    if not db.scalar(select(Notification).where(Notification.reference_id == ref_id)):
                        db.add(Notification(
                            user_id=app.user_id,
                            title="Upcoming Interview",
                            message=f"You have an interview coming up in less than 24 hours for {app.internship.company_name}.",
                            type="WARNING",
                            reference_id=ref_id
                        ))
            
            # 3. Application deadline (3 days before)
            if app.status == ApplicationStatus.SAVED and app.internship.application_deadline:
                days_diff = (app.internship.application_deadline - today_date).days
                if 0 < days_diff <= 3:
                    ref_id = f"deadline_{app.id}_{app.internship.application_deadline}"
                    if not db.scalar(select(Notification).where(Notification.reference_id == ref_id)):
                        db.add(Notification(
                            user_id=app.user_id,
                            title="Application Deadline Approaching",
                            message=f"The deadline for {app.internship.job_title} at {app.internship.company_name} is in {days_diff} days.",
                            type="WARNING",
                            reference_id=ref_id
                        ))
        
        db.commit()
    except Exception as e:
        logger.error(f"Error generating reminders: {e}")
        db.rollback()
    finally:
        db.close()
