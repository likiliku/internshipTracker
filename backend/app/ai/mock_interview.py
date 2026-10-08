import logging
from google import genai  # type: ignore
from typing import List, Dict

from app.database.session import settings

logger = logging.getLogger(__name__)

def get_gemini_client():
    api_key = settings.gemini_api_key
    if not api_key:
        return None
    return genai.Client(api_key=api_key)

def start_interview(job_title: str, company: str, required_skills: str, candidate_name: str) -> str:
    """Generates the opening question for the interview."""
    client = get_gemini_client()
    if not client:
        raise RuntimeError("AI unavailable: GEMINI_API_KEY is not set.")
    
    prompt = f"""
    You are an expert technical interviewer and hiring manager for {company}. 
    You are interviewing {candidate_name} for the position of {job_title}. 
    The key skills required for this role are: {required_skills}.
    
    Start the interview by introducing yourself briefly, welcoming them, and asking the very first interview question.
    Make it realistic and conversational. Do not output anything other than your spoken response to the candidate.
    """
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API error (start): {e}")
        raise RuntimeError(f"AI unavailable: {str(e)}")

def evaluate_answer(job_title: str, required_skills: str, chat_history: List[Dict[str, str]], latest_answer: str) -> dict:
    """Evaluates the latest answer and generates the next question or final feedback."""
    client = get_gemini_client()
    if not client:
        raise RuntimeError("AI unavailable: GEMINI_API_KEY is not set.")
        
    # Check if the interview is long enough to end
    if len(chat_history) >= 6: # 3 AI questions, 3 User answers
        history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
        history_text += f"\nCandidate: {latest_answer}"
        
        prompt = f"""
        You are an expert hiring manager evaluating an interview for a {job_title} role.
        Here is the transcript of the interview so far:
        {history_text}
        
        The interview is now over. Based on the candidate's answers, evaluate their performance.
        Return your evaluation exactly in this format:
        Score: [0-100]
        Feedback: [Your conversational, constructive feedback summarizing their strengths and areas for improvement in 3-4 sentences.]
        """
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt
            ).text.strip()
            score = 75
            for line in response.split('\n'):
                if line.startswith('Score:'):
                    try:
                        score = int(line.replace('Score:', '').strip())
                    except: pass
            
            feedback = response.split('Feedback:')[-1].strip() if 'Feedback:' in response else response
            return {"type": "feedback", "response": feedback, "score": score}
        except Exception as e:
            logger.error(f"Gemini API error (eval): {e}")
            raise RuntimeError(f"AI unavailable: {str(e)}")
            
    # Generate next question
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
    history_text += f"\nCandidate: {latest_answer}"
    
    prompt = f"""
    You are an expert technical interviewer for a {job_title} role (Skills needed: {required_skills}).
    Here is the interview transcript so far:
    {history_text}
    
    Based on their last answer, ask the next interview question. It can be a follow-up to their answer, or a new question about their technical skills or behavioral traits. 
    Make it sound natural and conversational. Do not output anything other than your spoken response to the candidate.
    """
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt
        )
        return {"type": "question", "response": response.text.strip()}
    except Exception as e:
        logger.error(f"Gemini API error (next_q): {e}")
        raise RuntimeError(f"AI unavailable: {str(e)}")
