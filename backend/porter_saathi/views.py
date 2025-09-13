# Simple home view
from django.http import HttpResponse

def home(request):
    return HttpResponse("Porter Saathi Backend is running ✅")