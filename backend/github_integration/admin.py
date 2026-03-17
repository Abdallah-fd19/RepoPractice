from django.contrib import admin
from .models import Repo, Challenge, ChallengeSubmission
# Register your models here.

admin.site.register(Repo)
admin.site.register(Challenge)
admin.site.register(ChallengeSubmission)