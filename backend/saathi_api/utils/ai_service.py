# saathi_api/utils/ai_service.py
import requests
import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def generate_sql(user_question, driver_id):
    """
    Generates SQL dynamically using GPT (via OpenRouter API)
    """
    prompt = f"""
    You are an AI that converts user questions to SQL queries.
    Database tables:
    drivers(id, name, phone, language_preference, created_at)
    trips(id, driver_id, date, earnings, expenses, penalties, created_at)
    penalties(id, trip_id, reason, amount, created_at)

    Generate SQL for this question: "{user_question}"
    - Replace driver_id with {driver_id} as parameter
    - Return only SQL (no explanation, no markdown, no ``` fences)
    """

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "openai/gpt-4o",
        "messages": [
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": prompt}
        ]
    }

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    data = response.json()

    # Clean the SQL response
    sql_query = data["choices"][0]["message"]["content"].strip()
    sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

    return sql_query

