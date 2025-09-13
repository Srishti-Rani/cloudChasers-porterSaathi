# saathi_api/views.py
from django.http import JsonResponse, FileResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from elevenlabs import ElevenLabs
import os
from dotenv import load_dotenv
from io import BytesIO
from .utils.ai_service import generate_sql
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

import json

load_dotenv()
elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


def home(request):
    return HttpResponse("Porter Saathi Backend is running ✅")

@csrf_exempt
def text_to_speech(request):
    if request.method == "POST":
        text = request.POST.get("text")
        if not text:
            return JsonResponse({"error": "Please provide text to convert"}, status=400)

        try:
            # Generate TTS audio
            audio_gen = elevenlabs.text_to_speech.convert(
                text=text,
                voice_id="JBFqnCBsd6RMkjVDRZzb",  # choose your voice
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128"
            )

            # Convert generator to bytes
            audio_bytes = b"".join(audio_gen)

            # Send as audio file
            return FileResponse(BytesIO(audio_bytes), content_type="audio/mpeg", filename="output.mp3")

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "POST method required"}, status=405)


@csrf_exempt
def ask_dynamic(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    driver_id = data.get("driver_id")
    question = data.get("question")

    if not driver_id or not question:
        return JsonResponse({"error": "Missing driver_id or question"}, status=400)

    try:
        # 1️⃣ Generate dynamic SQL via GPT
        sql_query = generate_sql(question, driver_id)

        # 2️⃣ Execute SQL safely with Django’s DB connection
        with connection.cursor() as cursor:
            cursor.execute(sql_query)
            columns = [col[0] for col in cursor.description] if cursor.description else []
            rows = cursor.fetchall()

        result = [dict(zip(columns, row)) for row in rows] if rows else []

        # 3️⃣ Convert result to natural response
        if result:
            response_text = f"Result: {result}"
        else:
            response_text = "Koi data nahi mila."

        return JsonResponse({"query": sql_query, "response": response_text, "data": result})
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



