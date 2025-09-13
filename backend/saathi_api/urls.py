from django.urls import path
from saathi_api import views


urlpatterns = [
    path("", views.home),
    path("tts/", views.text_to_speech, name="generate_tts"),
]
