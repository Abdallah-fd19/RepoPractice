from rest_framework import serializers
from .models import Repo, Challenge, ChallengeSubmission


class RepoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repo
        fields = ['id', 'github_id', 'name', 'full_name', 'description',
                  'language', 'html_url', 'default_branch', 'last_synced']


class ChallengeSerializer(serializers.ModelSerializer):
    repo_name = serializers.CharField(source='repo.name', read_only=True)
    repo_full_name = serializers.CharField(source='repo.full_name', read_only=True)
    latest_submission = serializers.SerializerMethodField()

    def get_latest_submission(self, obj):
        latest = obj.submissions.order_by('-submitted_at').first()
        if not latest:
            return None
        return ChallengeSubmissionSerializer(latest).data

    class Meta:
        model = Challenge
        fields = ['id', 'repo', 'repo_name', 'repo_full_name', 'type', 'title',
                  'description', 'code_snippet', 'file_path', 'difficulty',
                  'status', 'created_at', 'latest_submission']
        read_only_fields = ['id', 'created_at', 'repo_name', 'repo_full_name', 'latest_submission']


class ChallengeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeSubmission
        fields = ['id', 'challenge', 'code', 'submitted_at', 'score', 'result', 'feedback', 'model_answer']
        read_only_fields = ['id', 'submitted_at', 'score', 'result', 'feedback', 'model_answer']
