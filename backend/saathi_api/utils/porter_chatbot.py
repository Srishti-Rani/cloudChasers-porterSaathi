import os
import json
import google.generativeai as genai
from fuzzywuzzy import fuzz
import datetime

# ----------------- CONFIG -----------------
os.environ["GOOGLE_API_KEY"] = "YOUR_API_KEY"
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
model = genai.GenerativeModel("gemini-1.5-flash")

# Load FAQ
with open("porter_FAQ.json", "r", encoding="utf-8") as f:
    faq_data = json.load(f)

# ----------------- UTILITY FUNCTIONS -----------------
def check_faq(question: str, threshold=80):
    best_match = None
    best_score = 0
    for q, ans in faq_data.items():
        score = fuzz.ratio(question.lower(), q.lower())
        if score > best_score:
            best_score = score
            best_match = ans
    if best_score >= threshold:
        return best_match
    return None

def translate_answer(answer: str, language: str = "Hindi"):
    if language.lower() in ["english", "en"]:
        return answer
    prompt = f"Translate the following answer into {language}:\n\n{answer}"
    response = model.generate_content(prompt)
    return response.text.strip()

def ask_gemini(question: str, language: str = "Hindi"):
    prompt = f"""
You are a helpful assistant. 
Answer the following question directly in {language}. 
Do not just repeat or translate the question. 
Question: {question}
"""
    response = model.generate_content(prompt)
    return response.text.strip()

def check_realtime_questions(question: str, language: str):
    q = question.lower()
    if "date" in q:
        today = datetime.date.today().strftime("%B %d, %Y")
        return translate_answer(f"Today's date is {today}", language)
    if "time" in q:
        now = datetime.datetime.now().strftime("%H:%M:%S")
        return translate_answer(f"The current time is {now}", language)
    return None

def is_emergency(question: str):
    keywords = ["help", "sahayata", "emergency", "fire", "injury"]
    return any(word in question.lower() for word in keywords)

def handle_emergency(question: str, language: str):
    prompt = f"""
You are an AI emergency assistant. 
A driver has requested help. 
Respond calmly, give step-by-step instructions, and stay conversational. 
Reply in {language}.

Driver said: {question}
"""
    response = model.generate_content(prompt)
    return response.text.strip()

# ----------------- SINGLE QUESTION HANDLER -----------------
def get_response(user_question: str, language: str = "Hindi"):
    # Emergency
    if is_emergency(user_question):
        return handle_emergency(user_question, language)

    # Real-time questions
    realtime_answer = check_realtime_questions(user_question, language)
    if realtime_answer:
        return realtime_answer

    # FAQ
    faq_answer = check_faq(user_question)
    if faq_answer:
        return translate_answer(faq_answer, language)

    # Gemini fallback
    return ask_gemini(user_question, language)

# ----------------- MAIN INTERACTIVE -----------------
if __name__ == "__main__":
    language = input("Enter response language (e.g., English, Hindi, Telugu): ")
    user_q = input("\nYou: ")
    answer = get_response(user_q, language)
    print(f"\nAnswer ({language}):\n{answer}")
