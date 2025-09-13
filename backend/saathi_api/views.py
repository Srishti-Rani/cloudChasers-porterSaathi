# saathi_api/views.py
from django.http import JsonResponse, FileResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from elevenlabs import ElevenLabs
import os
from dotenv import load_dotenv
from io import BytesIO

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


