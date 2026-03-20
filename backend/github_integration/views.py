import uuid
import json
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

from . import services, ai
from .models import Repo, Challenge, ChallengeSubmission
from .serializers import RepoSerializer, ChallengeSerializer, ChallengeSubmissionSerializer
from users.models import Profile


class GitHubLoginView(APIView):
	def get(self, request):
		state = uuid.uuid4().hex
		request.session['github_oauth_state'] = state
		url = services.build_authorize_url(state)
		return redirect(url)


class GitHubCallbackView(APIView):
	def get(self, request):
		state = request.GET.get('state')
		code = request.GET.get('code')

		saved = request.session.pop('github_oauth_state', None)
		if not state or saved != state:
			return Response({'detail': 'Invalid OAuth state'}, status=status.HTTP_400_BAD_REQUEST)

		if not code:
			return Response({'detail': 'Missing code parameter'}, status=status.HTTP_400_BAD_REQUEST)

		try:
			token = services.exchange_code_for_token(code)
			gh_user = services.get_github_user(token)
		except Exception as e:
			return Response({'detail': 'Failed exchanging code or fetching user', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

		gh_username = gh_user.get('login')
		gh_email = gh_user.get('email')

		user = None
		if gh_email:
			user = User.objects.filter(email__iexact=gh_email).first()

		if not user and gh_username:
			user = User.objects.filter(username=gh_username).first()

		if not user:
			base_username = gh_username or f'gh_{uuid.uuid4().hex[:8]}'
			username = base_username
			suffix = 1
			while User.objects.filter(username=username).exists():
				username = f"{base_username}_{suffix}"
				suffix += 1

			user = User.objects.create_user(username=username, email=gh_email or '')
			user.set_unusable_password()
			user.save()
			Profile.objects.create(user=user, github_username=gh_username, github_access_token=token)
		else:
			# ensure profile exists
			profile, _ = Profile.objects.get_or_create(user=user)
			profile.github_username = gh_username or profile.github_username
			profile.github_access_token = token
			profile.save()

		refresh = RefreshToken.for_user(user)

		data = {
			'message': 'GitHub login successful',
			'user': {
				'id': user.id,
				'username': user.username,
				'email': user.email,
			},
			'tokens': {
				'refresh': str(refresh),
				'access': str(refresh.access_token),
			}
		}

		# Store the data in session for retrieval by frontend
		request.session['github_auth_data'] = data
		
		# Redirect back to frontend with auth data
		frontend_callback_url = settings.GITHUB_OAUTH_FRONTEND_CALLBACK_URL
		return redirect(f"{frontend_callback_url}?code={code}&state={state}")


class GitHubCompleteView(APIView):
	@csrf_exempt
	def post(self, request):
		"""
		Complete the OAuth flow by retrieving the authenticated user data.
		The frontend sends the code and state, and we retrieve the user data
		from the session.
		"""
		try:
			# Get the stored auth data from session
			auth_data = request.session.get('github_auth_data')
			if not auth_data:
				return Response({'detail': 'No authentication data found in session. Please try logging in again.'}, status=status.HTTP_400_BAD_REQUEST)

			# Clear the session data
			request.session.pop('github_auth_data', None)

			return Response(auth_data, status=status.HTTP_200_OK)

		except Exception as e:
			return Response({'detail': 'Failed to complete GitHub authentication', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ── Repos ─────────────────────────────────────────────────────────────────────

class RepoListView(APIView):
    """GET /github/repos/ — fetch repos from GitHub and sync to DB."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        token = profile.github_access_token if profile else None
        if not token:
            return Response(
                {'detail': 'No GitHub account connected. Please log in with GitHub first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            gh_repos = services.get_github_repos(token)
        except Exception as e:
            return Response({'detail': f'Failed to fetch repos from GitHub: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

        synced = []
        for r in gh_repos:
            obj, _ = Repo.objects.update_or_create(
                user=request.user,
                github_id=r['id'],
                defaults={
                    'name': r['name'],
                    'full_name': r['full_name'],
                    'description': r.get('description') or '',
                    'language': r.get('language') or '',
                    'html_url': r['html_url'],
                    'default_branch': r.get('default_branch', 'main'),
                },
            )
            synced.append(obj)

        return Response(RepoSerializer(synced, many=True).data)


# ── Challenge generation ───────────────────────────────────────────────────────

class GenerateChallengesView(APIView):
    """POST /github/repos/<repo_id>/generate/ — generate challenges for a repo."""
    permission_classes = [IsAuthenticated]

    def post(self, request, repo_id):
        try:
            repo = Repo.objects.get(id=repo_id, user=request.user)
        except Repo.DoesNotExist:
            return Response({'detail': 'Repo not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(request.user, 'profile', None)
        token = profile.github_access_token if profile else None
        if not token:
            return Response(
                {'detail': 'No GitHub access token found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            all_files = services.get_repo_file_tree(token, repo.full_name, repo.default_branch)
        except Exception as e:
            return Response({'detail': f'Failed to read repo tree: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

        if not all_files:
            return Response({'detail': 'No code files found in this repo.'}, status=status.HTTP_400_BAD_REQUEST)

        selected_paths = ai.pick_files_for_challenge(all_files, n=5)
        if not selected_paths:
            return Response(
                {'detail': 'No eligible user-code files found. Try a repo with source files (not only config/infrastructure).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_snippets = []
        for path in selected_paths:
            content = services.get_file_content(token, repo.full_name, path)
            if content:
                file_snippets.append({'path': path, 'content': content})

        if not file_snippets:
            return Response({'detail': 'Could not read any file content from this repo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            raw_challenges = ai.generate_challenges(repo.full_name, file_snippets)
        except Exception as e:
            return Response({'detail': f'AI generation failed: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

        created = []
        for c in raw_challenges:
            obj = Challenge.objects.create(
                user=request.user,
                repo=repo,
                type=c.get('type', 'refactor'),
                title=c.get('title', 'Untitled'),
                description=c.get('description', ''),
                code_snippet=c.get('code_snippet', ''),
                file_path=c.get('file_path', ''),
                difficulty=c.get('difficulty', 'medium'),
            )
            created.append(obj)

        return Response(ChallengeSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


# ── Challenges ─────────────────────────────────────────────────────────────────

class ChallengeListView(APIView):
    """GET /github/challenges/ — list all challenges for the user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        challenges = Challenge.objects.filter(user=request.user).select_related('repo')
        repo_id = request.query_params.get('repo')
        if repo_id:
            challenges = challenges.filter(repo_id=repo_id)
        status_filter = request.query_params.get('status')
        if status_filter:
            challenges = challenges.filter(status=status_filter)
        return Response(ChallengeSerializer(challenges, many=True).data)


class ChallengeDetailView(APIView):
    """GET/PATCH /github/challenges/<id>/"""
    permission_classes = [IsAuthenticated]

    def _get_challenge(self, request, pk):
        try:
            return Challenge.objects.get(id=pk, user=request.user)
        except Challenge.DoesNotExist:
            return None

    def get(self, request, pk):
        challenge = self._get_challenge(request, pk)
        if not challenge:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ChallengeSerializer(challenge).data)

    def patch(self, request, pk):
        challenge = self._get_challenge(request, pk)
        if not challenge:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChallengeSerializer(challenge, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChallengeSubmitView(APIView):
    """POST /github/challenges/<id>/submit/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            challenge = Challenge.objects.get(id=pk, user=request.user)
        except Challenge.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        code = request.data.get('code', '').strip()
        if not code:
            return Response({'detail': 'code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        submission = ChallengeSubmission.objects.create(challenge=challenge, code=code)
        evaluation = ai.evaluate_submission(
            challenge={
                'type': challenge.type,
                'title': challenge.title,
                'description': challenge.description,
                'code_snippet': challenge.code_snippet or '',
                'difficulty': challenge.difficulty,
            },
            submission=submission.code,
        )
        submission.score = evaluation.get('score', 0)
        submission.result = evaluation.get('result', ChallengeSubmission.Result.PARTIAL)
        submission.feedback = evaluation.get('feedback', '')
        submission.model_answer = evaluation.get('model_answer', '')
        submission.save()

        if submission.result == ChallengeSubmission.Result.CORRECT:
            challenge.status = Challenge.Status.COMPLETED
        else:
            challenge.status = Challenge.Status.IN_PROGRESS
        challenge.save()

        return Response(ChallengeSubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)


