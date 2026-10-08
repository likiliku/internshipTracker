from datetime import datetime, date
from enum import Enum
from sqlalchemy import String, Text, DateTime, Date, Float, ForeignKey, UniqueConstraint, Index, Boolean, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
class Role(str, Enum): STUDENT="STUDENT"; COMPANY="COMPANY"; ADMIN="ADMIN"
class ApplicationStatus(str, Enum): SAVED="Saved"; APPLIED="Applied"; INTERVIEW="Interview"; SELECTED="Selected"; REJECTED="Rejected"; WITHDRAWN="Withdrawn"
class PostingStatus(str, Enum): PENDING="PENDING"; APPROVED="APPROVED"; REJECTED="REJECTED"
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
class User(TimestampMixin, Base):
    __tablename__="users"; id: Mapped[int]=mapped_column(primary_key=True); name: Mapped[str]=mapped_column(String(120)); email: Mapped[str]=mapped_column(String(255),unique=True,index=True); password_hash: Mapped[str]=mapped_column(String(255)); role: Mapped[Role]=mapped_column(SAEnum(Role),default=Role.STUDENT,index=True); phone: Mapped[str|None]=mapped_column(String(30),nullable=True)
    student_profile: Mapped["StudentProfile"]=relationship(back_populates="user",cascade="all, delete-orphan",uselist=False); company: Mapped["Company"]=relationship(back_populates="user",cascade="all, delete-orphan",uselist=False)
    applications: Mapped[list["Application"]] = relationship(back_populates="user", cascade="all, delete-orphan")
class StudentProfile(TimestampMixin, Base):
    __tablename__="student_profiles"; id: Mapped[int]=mapped_column(primary_key=True); user_id: Mapped[int]=mapped_column(ForeignKey("users.id"),unique=True); college: Mapped[str|None]=mapped_column(String(160)); degree: Mapped[str|None]=mapped_column(String(100)); branch: Mapped[str|None]=mapped_column(String(100)); current_year: Mapped[str|None]=mapped_column(String(50), nullable=True); graduation_year: Mapped[int|None]=mapped_column(nullable=True); cgpa: Mapped[float|None]=mapped_column(Float,nullable=True)
    user: Mapped["User"]=relationship(back_populates="student_profile")
    skills: Mapped[list["StudentSkill"]]=relationship(back_populates="profile", cascade="all, delete-orphan")
    projects: Mapped[list["StudentProject"]]=relationship(back_populates="profile", cascade="all, delete-orphan")
    certifications: Mapped[list["StudentCertification"]]=relationship(back_populates="profile", cascade="all, delete-orphan")
    experience: Mapped[list["StudentExperience"]]=relationship(back_populates="profile", cascade="all, delete-orphan")
    preferences: Mapped["StudentPreference"]=relationship(back_populates="profile", cascade="all, delete-orphan", uselist=False)
    links: Mapped["StudentLink"]=relationship(back_populates="profile", cascade="all, delete-orphan", uselist=False)
    resume: Mapped["StudentResume"]=relationship(back_populates="profile", cascade="all, delete-orphan", uselist=False)

class StudentSkill(TimestampMixin, Base):
    __tablename__="student_skills"; id: Mapped[int]=mapped_column(primary_key=True); profile_id: Mapped[int]=mapped_column(ForeignKey("student_profiles.id")); name: Mapped[str]=mapped_column(String(100)); category: Mapped[str]=mapped_column(String(50))
    profile: Mapped["StudentProfile"]=relationship(back_populates="skills")

class StudentProject(TimestampMixin, Base):
    __tablename__="student_projects"; id: Mapped[int]=mapped_column(primary_key=True); profile_id: Mapped[int]=mapped_column(ForeignKey("student_profiles.id")); name: Mapped[str]=mapped_column(String(150)); description: Mapped[str|None]=mapped_column(Text); link: Mapped[str|None]=mapped_column(String(255))
    profile: Mapped["StudentProfile"]=relationship(back_populates="projects")

class StudentCertification(TimestampMixin, Base):
    __tablename__="student_certifications"; id: Mapped[int]=mapped_column(primary_key=True); profile_id: Mapped[int]=mapped_column(ForeignKey("student_profiles.id")); name: Mapped[str]=mapped_column(String(150)); issuer: Mapped[str|None]=mapped_column(String(150)); date: Mapped[str|None]=mapped_column(String(50)); link: Mapped[str|None]=mapped_column(String(255))
    profile: Mapped["StudentProfile"]=relationship(back_populates="certifications")

class StudentExperience(TimestampMixin, Base):
    __tablename__="student_experience"; id: Mapped[int]=mapped_column(primary_key=True); profile_id: Mapped[int]=mapped_column(ForeignKey("student_profiles.id")); company: Mapped[str]=mapped_column(String(150)); role: Mapped[str]=mapped_column(String(150)); duration: Mapped[str|None]=mapped_column(String(100)); description: Mapped[str|None]=mapped_column(Text)
    profile: Mapped["StudentProfile"]=relationship(back_populates="experience")

class StudentPreference(TimestampMixin, Base):
    __tablename__="student_preferences"; id: Mapped[int]=mapped_column(primary_key=True); profile_id: Mapped[int]=mapped_column(ForeignKey("student_profiles.id"), unique=True)
    roles: Mapped[list]=mapped_column(JSON, default=list); industries: Mapped[list]=mapped_column(JSON, default=list); locations: Mapped[list]=mapped_column(JSON, default=list); work_mode: Mapped[str|None]=mapped_column(String(50)); duration: Mapped[str|None]=mapped_column(String(50)); internship_type: Mapped[str|None]=mapped_column(String(50)); minimum_stipend: Mapped[float|None]=mapped_column(Float, nullable=True); available_from: Mapped[str|None]=mapped_column(String(50))
    profile: Mapped["StudentProfile"]=relationship(back_populates="preferences")

class StudentLink(TimestampMixin, Base):
    __tablename__="student_links"; id: Mapped[int]=mapped_column(primary_key=True); profile_id: Mapped[int]=mapped_column(ForeignKey("student_profiles.id"), unique=True)
    github: Mapped[str|None]=mapped_column(String(255)); linkedin: Mapped[str|None]=mapped_column(String(255)); portfolio: Mapped[str|None]=mapped_column(String(255))
    profile: Mapped["StudentProfile"]=relationship(back_populates="links")

class StudentResume(TimestampMixin, Base):
    __tablename__="student_resumes"; id: Mapped[int]=mapped_column(primary_key=True); profile_id: Mapped[int]=mapped_column(ForeignKey("student_profiles.id"), unique=True)
    original_filename: Mapped[str]=mapped_column(String(255)); file_type: Mapped[str]=mapped_column(String(50)); file_size: Mapped[int]=mapped_column(); storage_path: Mapped[str]=mapped_column(String(500))
    uploaded_at: Mapped[datetime]=mapped_column(DateTime, default=datetime.utcnow); parsed_at: Mapped[datetime|None]=mapped_column(DateTime, nullable=True)
    profile: Mapped["StudentProfile"]=relationship(back_populates="resume")
class Company(TimestampMixin, Base):
    __tablename__="companies"; id: Mapped[int]=mapped_column(primary_key=True); user_id: Mapped[int]=mapped_column(ForeignKey("users.id"),unique=True); name: Mapped[str]=mapped_column(String(150)); website: Mapped[str|None]=mapped_column(String(255)); description: Mapped[str|None]=mapped_column(Text); logo_url: Mapped[str|None]=mapped_column(String(255)); user: Mapped[User]=relationship(back_populates="company")
class Internship(TimestampMixin, Base):
    __tablename__ = "internships"
    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_source_external"),
        Index("ix_internships_search", "job_title", "location")
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str|None] = mapped_column(String(500), nullable=True)
    source: Mapped[str] = mapped_column(String(40), default="company")
    company_id: Mapped[int|None] = mapped_column(ForeignKey("companies.id"), nullable=True)
    company_name: Mapped[str] = mapped_column(String(150))
    company_logo: Mapped[str|None] = mapped_column(String(255))
    job_title: Mapped[str] = mapped_column(String(180), index=True)
    description: Mapped[str] = mapped_column(Text)
    category: Mapped[str|None] = mapped_column(String(100), nullable=True)
    required_skills: Mapped[list] = mapped_column(JSON, default=list)
    location: Mapped[str|None] = mapped_column(String(120), index=True)
    work_mode: Mapped[str] = mapped_column(String(30), default="Remote")
    employment_type: Mapped[str] = mapped_column(String(50), default="Internship")
    stipend_min: Mapped[float|None] = mapped_column(Float, nullable=True)
    stipend_max: Mapped[float|None] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    duration: Mapped[str|None] = mapped_column(String(50))
    eligibility: Mapped[str|None] = mapped_column(Text)
    application_deadline: Mapped[date|None] = mapped_column(Date, nullable=True)
    posted_date: Mapped[date|None] = mapped_column(Date, nullable=True)
    application_url: Mapped[str|None] = mapped_column(String(600))
    status: Mapped[PostingStatus] = mapped_column(SAEnum(PostingStatus), default=PostingStatus.PENDING, index=True)
class Application(TimestampMixin, Base):
    __tablename__="applications"; __table_args__=(UniqueConstraint("user_id","internship_id",name="uq_application"),); id: Mapped[int]=mapped_column(primary_key=True); user_id: Mapped[int]=mapped_column(ForeignKey("users.id"),index=True); internship_id: Mapped[int]=mapped_column(ForeignKey("internships.id"),index=True); applied_date: Mapped[date|None]=mapped_column(Date,nullable=True); status: Mapped[ApplicationStatus]=mapped_column(SAEnum(ApplicationStatus),default=ApplicationStatus.SAVED); interview_date: Mapped[datetime|None]=mapped_column(DateTime,nullable=True); notes: Mapped[str|None]=mapped_column(Text); follow_up_date: Mapped[date|None]=mapped_column(Date,nullable=True); internship: Mapped[Internship]=relationship(); user: Mapped["User"]=relationship(back_populates="applications")

class ApplicationStatusHistory(TimestampMixin, Base):
    __tablename__="application_status_history"
    id: Mapped[int]=mapped_column(primary_key=True)
    application_id: Mapped[int]=mapped_column(ForeignKey("applications.id", ondelete="CASCADE"), index=True)
    status: Mapped[ApplicationStatus]=mapped_column(SAEnum(ApplicationStatus))
    notes: Mapped[str|None]=mapped_column(Text, nullable=True)

class Notification(TimestampMixin, Base):
    __tablename__="notifications"; id: Mapped[int]=mapped_column(primary_key=True); user_id: Mapped[int]=mapped_column(ForeignKey("users.id"),index=True); title: Mapped[str]=mapped_column(String(140)); message: Mapped[str]=mapped_column(Text); type: Mapped[str]=mapped_column(String(40)); is_read: Mapped[bool]=mapped_column(Boolean,default=False)
    reference_id: Mapped[str|None]=mapped_column(String(100), unique=True, nullable=True)

class OTPVerification(TimestampMixin, Base):
    __tablename__="otp_verifications"
    id: Mapped[int]=mapped_column(primary_key=True)
    email: Mapped[str]=mapped_column(String(255), index=True)
    otp: Mapped[str]=mapped_column(String(10))
    expires_at: Mapped[datetime]=mapped_column(DateTime)
    is_used: Mapped[bool]=mapped_column(Boolean, default=False)
