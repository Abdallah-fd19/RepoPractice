import uuid
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import login
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from . import services
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

		return Response(data, status=status.HTTP_200_OK)

