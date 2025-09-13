from django.http import JsonResponse, FileResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from elevenlabs import ElevenLabs
import os
from dotenv import load_dotenv
from io import BytesIO
import json

load_dotenv()
elevenlabs = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


def home(request):
    return HttpResponse("Porter Saathi Backend is running ✅")

@csrf_exempt
def text_to_speech(request):
    # Accept POST and OPTIONS (if you manually handle preflight)
    if request.method == "OPTIONS":
        return HttpResponse(status=200)  # CORS library usually handles this

    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    # Support JSON body or form-data
    text = None
    content_type = request.META.get("CONTENT_TYPE", "")

    if "application/json" in content_type:
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
            text = payload.get("text")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    else:
        text = request.POST.get("text")

    if not text:
        return JsonResponse({"error": "Please provide text to convert"}, status=400)

    try:
        # Example using ElevenLabs SDK generator (adapt names to your SDK)
        # Some SDKs return bytes directly or a generator — adjust accordingly.
        audio_gen = elevenlabs.text_to_speech.convert(
            text=text,
            voice_id="JBFqnCBsd6RMkjVDRZzb",
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128"
        )

        # If audio_gen is a generator yielding bytes:
        if hasattr(audio_gen, "_iter_") and not isinstance(audio_gen, (bytes, bytearray)):
            audio_bytes = b"".join(audio_gen)
        else:
            audio_bytes = audio_gen  # already bytes

        response = HttpResponse(audio_bytes, content_type="audio/mpeg")
        response["Content-Disposition"] = 'attachment; filename="tts.mp3"'
        return response

    except Exception as e:
        # log the error in server logs
        return JsonResponse({"error": "TTS generation failed", "detail": str(e)}, status=500)