from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.entities import Role, ApplicationStatus
class RegisterIn(BaseModel): name:str; email:EmailStr; password:str=Field(min_length=8); role:Role=Role.STUDENT; phone:str|None=None
class LoginIn(BaseModel): email:EmailStr; password:str
class OTPLoginIn(BaseModel): email: EmailStr
class OTPVerifyIn(BaseModel): email: EmailStr; otp: str
class SkillIn(BaseModel): name: str; category: str
class ProjectIn(BaseModel): name: str; description: str | None = None; link: str | None = None
class CertificationIn(BaseModel): name: str; issuer: str | None = None; date: str | None = None; link: str | None = None
class ExperienceIn(BaseModel): company: str; role: str; duration: str | None = None; description: str | None = None
class PreferenceIn(BaseModel): roles: list[str] = []; industries: list[str] = []; locations: list[str] = []; work_mode: str | None = None; duration: str | None = None; internship_type: str | None = None; minimum_stipend: float | None = None; available_from: str | None = None
class LinkIn(BaseModel): github: str | None = None; linkedin: str | None = None; portfolio: str | None = None

class ProfileIn(BaseModel): college:str|None=None; degree:str|None=None; branch:str|None=None; current_year:str|None=None; graduation_year:int|None=None; cgpa:float|None=None; skills:list[SkillIn]=[]; projects:list[ProjectIn]=[]; certifications:list[CertificationIn]=[]; experience:list[ExperienceIn]=[]; preferences:PreferenceIn|None=None; links:LinkIn|None=None
class InternshipIn(BaseModel): company_name:str; job_title:str; description:str; required_skills:list[str]=[]; location:str|None=None; work_mode:str="Remote"; employment_type:str="Internship"; stipend_min:float|None=None; stipend_max:float|None=None; currency:str="INR"; duration:str|None=None; eligibility:str|None=None; application_deadline:date|None=None; application_url:str|None=None
class ApplicationIn(BaseModel): internship_id:int; status:ApplicationStatus=ApplicationStatus.SAVED; applied_date:date|None=None; interview_date:datetime|None=None; notes:str|None=None; follow_up_date:date|None=None
class ApplicationUpdate(BaseModel): status:ApplicationStatus|None=None; interview_date:datetime|None=None; notes:str|None=None; follow_up_date:date|None=None

class ResumeMetadata(BaseModel): id: int; original_filename: str; file_type: str; file_size: int; uploaded_at: datetime; parsed_at: datetime | None = None
class ResumeAnalyzeResponse(BaseModel): success: bool; data: dict; confidence: dict | None = None

class ApplicationSummaryCounts(BaseModel): pending: int = 0; selected: int = 0; rejected: int = 0; withdrawn: int = 0; total: int = 0
class AdminStudentSummary(BaseModel): id: int; name: str; email: str; phone: str | None = None; college: str | None = None; degree: str | None = None; branch: str | None = None; graduation_year: int | None = None; cgpa: float | None = None; application_summary: ApplicationSummaryCounts
class AdminStudentDetail(AdminStudentSummary): applications: list[dict] = []
