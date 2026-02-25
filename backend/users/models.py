from django.db import models
from django.contrib.auth.models import User
import uuid
# Create your models here.

class Profile(models.Model):
 id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
 user = models.OneToOneField(User, on_delete=models.CASCADE)
 bio = models.TextField(blank=True, null=True)
 avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
 
 def __self__(self):
  return f"{self.user.username}"
 