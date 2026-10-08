from app.services.recommendation_engine import calculate_basic_match
import json

def run_tests():
    print("--- RUNNING AI MATCHING ACCURACY TESTS ---\n")
    
    tests = [
        {
            "name": "Perfect Match (100% overlap)",
            "student_skills": ["Python", "React", "SQL", "Git"],
            "internship_skills": ["Python", "React", "SQL", "Git"]
        },
        {
            "name": "Partial Match (50% overlap)",
            "student_skills": ["Python", "HTML", "CSS"],
            "internship_skills": ["Python", "React", "SQL", "Git"]
        },
        {
            "name": "Overqualified Candidate (Student has more skills)",
            "student_skills": ["Python", "React", "SQL", "Git", "Docker", "AWS"],
            "internship_skills": ["Python", "React"]
        },
        {
            "name": "Complete Mismatch (0% overlap)",
            "student_skills": ["Java", "Spring", "Oracle DB"],
            "internship_skills": ["Python", "React", "SQL"]
        }
    ]
    
    for i, t in enumerate(tests):
        res = calculate_basic_match(t["student_skills"], t["internship_skills"])
        print(f"Test {i+1}: {t['name']}")
        print(f"Candidate Skills: {t['student_skills']}")
        print(f"Required Skills:  {t['internship_skills']}")
        print(f"-> Match Score:   {res['match_score']}%")
        print(f"-> Matched:       {res['matched_skills']}")
        print(f"-> Missing:       {res['missing_skills']}")
        print("-" * 50)

if __name__ == "__main__":
    run_tests()
