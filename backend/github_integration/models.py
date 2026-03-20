from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Repo(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="repos")
    github_id = models.BigIntegerField()
    name = models.CharField(max_length=255)
    full_name = models.CharField(max_length=512)
    description = models.TextField(blank=True, null=True)
    language = models.CharField(max_length=100, blank=True, null=True)
    html_url = models.URLField()
    default_branch = models.CharField(max_length=100, default="main")
    last_synced = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "github_id")
        ordering = ["name"]

    def __str__(self):
        return self.full_name


class Challenge(models.Model):
    class Type(models.TextChoices):
        REFACTOR = "refactor", "Refactor"
        DEBUG = "debug", "Debug"
        EXTEND = "extend", "Extend"
        WRITE_TEST = "write_test", "Write Test"
        EXPLAIN = "explain", "Explain"

    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="challenges")
    repo = models.ForeignKey(Repo, on_delete=models.CASCADE, related_name="challenges")
    type = models.CharField(max_length=20, choices=Type.choices)
    title = models.CharField(max_length=255)
    description = models.TextField()
    code_snippet = models.TextField(blank=True, null=True)
    file_path = models.CharField(max_length=512, blank=True, null=True)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.type}] {self.title}"


class ChallengeSubmission(models.Model):


    class Result(models.TextChoices):
        CORRECT = "correct", "Correct"
        PARTIAL = "partial", "Partial"
        INCORRECT = "incorrect", "Incorrect"

    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name="submissions")
    code = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    score = models.IntegerField(
    validators=[MinValueValidator(0), MaxValueValidator(100)],
    default=0
    )
    result = models.CharField(max_length=20, choices=Result.choices, default=Result.PARTIAL)
    feedback = models.TextField(blank=True, null=True)
    model_answer = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"Submission for {self.challenge}"
