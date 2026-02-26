
import requests
from urllib.parse import urlencode
from django.conf import settings

AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
TOKEN_URL = 'https://github.com/login/oauth/access_token'
API_USER_URL = 'https://api.github.com/user'
API_EMAILS_URL = 'https://api.github.com/user/emails'


def build_authorize_url(state: str) -> str:
	params = {
		'client_id': settings.GITHUB_CLIENT_ID,
		'redirect_uri': settings.GITHUB_OAUTH_REDIRECT_URI,
		'scope': 'read:user user:email',
		'state': state,
		'allow_signup': 'true',
	}
	return f"{AUTHORIZE_URL}?{urlencode(params)}"


def exchange_code_for_token(code: str) -> str:
	data = {
		'client_id': settings.GITHUB_CLIENT_ID,
		'client_secret': settings.GITHUB_CLIENT_SECRET,
		'code': code,
		'redirect_uri': settings.GITHUB_OAUTH_REDIRECT_URI,
	}
	headers = {'Accept': 'application/json'}
	resp = requests.post(TOKEN_URL, data=data, headers=headers, timeout=10)
	resp.raise_for_status()
	payload = resp.json()
	return payload.get('access_token')


def get_github_user(access_token: str) -> dict:
	headers = {
		'Authorization': f'Bearer {access_token}',
		'Accept': 'application/json'
	}
	resp = requests.get(API_USER_URL, headers=headers, timeout=10)
	resp.raise_for_status()
	user_data = resp.json()

	# Ensure we have an email; if not present, fetch emails list
	if not user_data.get('email'):
		resp2 = requests.get(API_EMAILS_URL, headers=headers, timeout=10)
		resp2.raise_for_status()
		emails = resp2.json()
		primary = None
		for e in emails:
			if e.get('primary') and e.get('verified'):
				primary = e.get('email')
				break
		user_data['email'] = primary or (emails[0].get('email') if emails else None)

	return user_data

