
import requests
from urllib.parse import urlencode
from django.conf import settings

AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
TOKEN_URL = 'https://github.com/login/oauth/access_token'
API_USER_URL = 'https://api.github.com/user'
API_EMAILS_URL = 'https://api.github.com/user/emails'
API_REPOS_URL = 'https://api.github.com/user/repos'
API_CONTENTS_URL = 'https://api.github.com/repos/{full_name}/contents/{path}'
API_TREE_URL = 'https://api.github.com/repos/{full_name}/git/trees/{branch}?recursive=1'


def build_authorize_url(state: str) -> str:
    params = {
        'client_id': settings.GITHUB_CLIENT_ID,
        'redirect_uri': settings.GITHUB_OAUTH_REDIRECT_URI,
        'scope': 'read:user user:email repo',
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


def get_github_repos(access_token: str) -> list:
    """Fetch all repos (own + member) for the authenticated user, all pages."""
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
    }
    repos = []
    page = 1
    while True:
        resp = requests.get(
            API_REPOS_URL,
            headers=headers,
            params={'per_page': 100, 'page': page, 'sort': 'updated'},
            timeout=10,
        )
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        repos.extend(batch)
        page += 1
    return repos


def get_repo_file_tree(access_token: str, full_name: str, branch: str) -> list:
    """Return flat list of file paths (blobs only) from the repo tree."""
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
    }
    url = API_TREE_URL.format(full_name=full_name, branch=branch)
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    tree = resp.json().get('tree', [])
    return [item['path'] for item in tree if item['type'] == 'blob']


def get_file_content(access_token: str, full_name: str, path: str) -> str:
    """Fetch decoded content of a single file. Returns empty string on failure."""
    import base64
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json',
    }
    url = API_CONTENTS_URL.format(full_name=full_name, path=path)
    resp = requests.get(url, headers=headers, timeout=10)
    if not resp.ok:
        return ''
    data = resp.json()
    if data.get('encoding') == 'base64':
        try:
            return base64.b64decode(data['content']).decode('utf-8', errors='replace')
        except Exception:
            return ''
    return data.get('content', '')

