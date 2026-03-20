import json
import os
import re
import random
from pathlib import PurePosixPath
from google import genai
from google.genai import types

_client = None

CODE_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.cs',
    '.go', '.rb', '.rs', '.php', '.swift', '.kt', '.scala', '.sh',
}

# Max chars per file sent to Gemini — keep input small so output fits
_FILE_CHAR_LIMIT = 1500
# Max lines to include in a code_snippet returned by Gemini
_SNIPPET_LINE_LIMIT = 20

_EXCLUDED_DIRS = {
    '.git', '.github', '.vscode', '__pycache__', 'node_modules', 'venv', '.venv',
    'dist', 'build', 'coverage', 'migrations', 'fixtures', 'docs',
    'config', 'configs', 'settings', 'configuration',
}

_EXCLUDED_FILE_NAMES = {
    'settings.py', 'local_settings.py',
    'manage.py', 'wsgi.py', 'asgi.py', 'conftest.py',
    'webpack.config.js', 'vite.config.js', 'vite.config.ts',
    'babel.config.js', 'eslint.config.js', 'jest.config.js',
    'tailwind.config.js', 'tailwind.config.ts',
}

_EXCLUDED_PATH_TOKENS = (
    '/config/', '/configs/', '/configuration/', '/settings/', '/migrations/',
    '/infra/', '/infrastructure/', '/ci/', '/cd/', '/scripts/', '/vendor/',
)

_PREFERRED_USER_CODE_DIRS = {
    'src', 'app', 'apps', 'lib', 'components', 'pages', 'views',
    'controllers', 'services', 'utils', 'hooks',
}

_AVOID_FOR_CHALLENGE_HINTS = ('test', 'tests', '__tests__', 'spec')


def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            raise ValueError('GEMINI_API_KEY is not set in environment')
        _client = genai.Client(api_key=api_key)
    return _client


def _is_code_file(path: str) -> bool:
    return any(path.endswith(ext) for ext in CODE_EXTENSIONS)


def _is_excluded_file(path: str) -> bool:
    p = PurePosixPath(path)
    lower = path.lower()

    if any(part.lower() in _EXCLUDED_DIRS for part in p.parts):
        return True
    if p.name.lower() in _EXCLUDED_FILE_NAMES:
        return True
    if any(token in lower for token in _EXCLUDED_PATH_TOKENS):
        return True
    return False


def _file_priority(path: str) -> int:
    p = PurePosixPath(path)
    parts = [part.lower() for part in p.parts]
    score = 0

    if any(part in _PREFERRED_USER_CODE_DIRS for part in parts):
        score += 3
    if any(hint in parts for hint in _AVOID_FOR_CHALLENGE_HINTS):
        score -= 2
    if p.name.lower().startswith('index.'):
        score -= 1

    return score


def _extract_json_array(text: str) -> str:
    """
    Robustly pull the first [...] JSON array out of a Gemini response,
    even when the model wraps it in markdown fences or adds prose.
    """
    # Strip ```json ... ``` or ``` ... ``` fences
    text = re.sub(r'^```[a-zA-Z]*\n?', '', text.strip())
    text = re.sub(r'\n?```$', '', text.strip())
    text = text.strip()

    # If it already starts with '[', use it directly
    if text.startswith('['):
        return text

    # Otherwise find the first '[' and last ']'
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]

    return text


def _extract_json_object(text: str) -> str:
    """
    Pull the first {...} JSON object from a model response.
    """
    text = re.sub(r'^```[a-zA-Z]*\n?', '', text.strip())
    text = re.sub(r'\n?```$', '', text.strip())
    text = text.strip()

    if text.startswith('{') and text.endswith('}'):
        return text

    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]

    return text


def pick_files_for_challenge(file_paths: list, n: int = 5) -> list:
    """
    Pick a sample of user-authored code files from the repo tree.
    Excludes configuration/infrastructure files to keep challenges relevant.
    """
    code_files = [p for p in file_paths if _is_code_file(p) and not _is_excluded_file(p)]
    if not code_files:
        return []

    prioritized = sorted(code_files, key=lambda p: _file_priority(p), reverse=True)
    top_priority = [p for p in prioritized if _file_priority(p) > 0]
    candidate_pool = top_priority or prioritized
    return random.sample(candidate_pool, min(n, len(candidate_pool)))


def generate_challenges(repo_full_name: str, file_snippets: list[dict]) -> list[dict]:
    """
    Call Gemini to generate coding challenges from a list of file snippets.

    file_snippets: [{"path": "...", "content": "..."}]

    Returns a list of challenge dicts with keys:
        type, title, description, code_snippet, file_path, difficulty
    """
    files_text = ''
    for f in file_snippets:
        truncated = f['content'][:_FILE_CHAR_LIMIT]
        files_text += f"\n\n--- FILE: {f['path']} ---\n{truncated}"

    prompt = f"""You are a coding challenge generator. A developer has shared code from their GitHub repo "{repo_full_name}".

Based on the code below, generate 5 distinct coding challenges that would help them improve their skills.
Prioritize challenges from user-authored business/application code (not framework/config setup).
If the shown files don't provide enough concrete targets, create up to 2 fundamentals-focused challenges
(algorithms, data structures, debugging strategy, testing fundamentals) inspired by the same language/style.

Rules for the JSON output:
- "type": one of: refactor | debug | extend | write_test | explain
- "title": max 10 words
- "description": 2-3 sentences, specific and actionable
- "code_snippet": paste the MOST RELEVANT lines only — maximum {_SNIPPET_LINE_LIMIT} lines, no more. For fundamentals-focused challenges, use an empty string.
- "file_path": the file this snippet is from. For fundamentals-focused challenges, use an empty string.
- "difficulty": one of: easy | medium | hard

Return ONLY a raw JSON array of exactly 5 objects. No markdown fences, no prose, no extra keys.

CODE:
{files_text}
"""

    client = _get_client()
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.4,
            max_output_tokens=8192,
        ),
    )

    raw = _extract_json_array(response.text)
    challenges = json.loads(raw)
    return challenges

def evaluate_submission(challenge: dict, submission: str) -> dict:
    """
    Call Gemini to evaluate a user's submission to a challenge.

    challenge: {"type", "title", "description", "code_snippet", "difficulty"}
    submission: user's code/answer text

    Returns dict: score, result, feedback, model_answer
    """
    prompt = f"""You are a strict but helpful coding challenge evaluator.

Challenge metadata:
- type: {challenge.get('type', '')}
- title: {challenge.get('title', '')}
- difficulty: {challenge.get('difficulty', '')}

Challenge description:
{challenge.get('description', '')}

Reference snippet (may be empty):
{challenge.get('code_snippet', '')}

Developer submission:
{submission}

Evaluate the submission for correctness, completeness, and code quality.
Return ONLY a raw JSON object with exactly these keys:
- "score": integer from 0 to 100
- "result": one of: correct | partial | incorrect
- "feedback": concise actionable feedback (2-4 sentences)
- "model_answer": a strong example solution or explanation
"""

    try:
        client = _get_client()
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=4096,
            ),
        )
        raw = _extract_json_object(response.text)
        parsed = json.loads(raw)
    except Exception:
        parsed = {
            'score': 0,
            'result': 'partial',
            'feedback': 'Automatic evaluation is currently unavailable. Please review the submission manually.',
            'model_answer': '',
        }

    score = parsed.get('score', 0)
    try:
        score = int(score)
    except Exception:
        score = 0
    score = max(0, min(100, score))

    result = str(parsed.get('result', 'partial')).lower().strip()
    if result not in {'correct', 'partial', 'incorrect'}:
        if score >= 80:
            result = 'correct'
        elif score >= 50:
            result = 'partial'
        else:
            result = 'incorrect'

    return {
        'score': score,
        'result': result,
        'feedback': str(parsed.get('feedback', '')).strip(),
        'model_answer': str(parsed.get('model_answer', '')).strip(),
    }