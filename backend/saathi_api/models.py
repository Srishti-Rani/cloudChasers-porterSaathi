# saathi_app/models.py

from django.db import models

class Driver(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    language_preference = models.CharField(max_length=10, default="en-IN")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Trip(models.Model):
    driver = models.ForeignKey("Driver", on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    earnings = models.DecimalField(max_digits=10, decimal_places=2)
    expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    total_penalties = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)  # ✅ renamed



class Penalty(models.Model):
    trip = models.ForeignKey("Trip", on_delete=models.CASCADE, related_name="penalty_records")  # ✅ avoids clash
    reason = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)

