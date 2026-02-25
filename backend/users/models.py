from django.db import models
from django.contrib.auth.models import User
import uuid
# Create your models here.

class Profile(models.Model):
 id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
 user = models.OneToOneField(User, on_delete=models.CASCADE)
 bio = models.TextField(blank=True, null=True)
 avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
 balance_usd = models.FloatField(default=10000.0)  # Starting balance for trading
 btc_held = models.FloatField(default=0.0)
 is_bot_active = models.BooleanField(default=False)
 rsi_threshold_buy = models.IntegerField(default=30)
 rsi_threshold_sell = models.IntegerField(default=70)
 
 def __self__(self):
  return f"{self.user.username}'s Wallet"
 