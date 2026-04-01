# 🏋️ RepoPractice

A full-stack web app that connects to your GitHub repositories and generates AI-powered coding challenges from your actual code. Practice refactoring, debugging, extending, testing, and explaining real code — then submit solutions and get instant AI evaluation with scores and feedback.

### 🎬 [Watch Demo](https://youtu.be/DJ6ssMvwU0Q)

## ✨ Features

- **GitHub OAuth** — sign in with GitHub to sync your repositories
- **AI Challenge Generation** — Gemini AI analyzes your code and creates targeted challenges (refactor, debug, extend, write tests, explain)
- **Smart File Selection** — prioritizes user-authored source code over config/boilerplate files
- **AI Evaluation** — submit solutions and receive a score (0–100), correctness verdict, actionable feedback, and a model answer
- **Dashboard** — track repositories, challenge progress, completion rate, average score, and language breakdown
- **Dark Mode** — CSS variable-based theming that swaps instantly
- **Toast Notifications** — global notification system for success/error/info feedback
- **Search & Filter** — filter challenges by status, difficulty, and repo name

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 6.0, Django REST Framework, Simple JWT |
| Frontend | React 19, Vite 7, Tailwind CSS 4, Recharts |
| AI | Google Gemini 2.5 Flash |
| Auth | JWT (email/password) + GitHub OAuth |
| Database | SQLite (development) |

## 📁 Project Structure

```
RepoPractice/
├── backend/
│   ├── config/              # Django settings, root URLs, WSGI
│   ├── users/               # Registration, login, JWT, profile
│   ├── github_integration/  # OAuth, repos, challenges, AI
│   ├── media/               # User uploads (avatars)
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Repos, Challenges, ChallengeDetail, Profile, Login, SignUp, GitHubCallback
│   │   ├── components/      # Sidebar, Card, Button, Input, ToastContainer, ProtectedRoute
│   │   └── contexts/        # AuthContext, ThemeContext, ToastContext
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- A [GitHub OAuth App](https://github.com/settings/developers) (set the callback URL to `http://localhost:8000/auth/github/callback/`)
- A [Google Gemini API key](https://ai.google.dev/)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```
SECRET_KEY=your-django-secret-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_OAUTH_REDIRECT_URI=http://localhost:8000/auth/github/callback/
GITHUB_OAUTH_FRONTEND_CALLBACK_URL=http://localhost:5173/auth/github/callback
GEMINI_API_KEY=your-gemini-api-key
```

Run migrations and start the server:

```bash
python manage.py migrate
python manage.py runserver
```

The API runs at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

Optionally create `frontend/.env` if the backend runs on a different port:

```
VITE_API_URL=http://localhost:8000
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/register/` | Create account (returns JWT) |
| POST | `/users/login/` | Email/password login (returns JWT) |
| POST | `/users/refresh/` | Refresh access token |
| GET/PATCH | `/users/profile/` | View/update profile |

### GitHub Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/github/login/` | Start GitHub OAuth flow |
| GET | `/auth/github/callback/` | OAuth callback (handled by backend) |
| POST | `/auth/github/complete/` | Frontend retrieves JWT after OAuth |
| GET | `/auth/github/repos/` | List synced repositories |
| POST | `/auth/github/repos/:id/generate/` | Generate AI challenges for a repo |
| GET | `/auth/github/challenges/` | List challenges (filterable by `?repo=`, `?status=`) |
| GET/PATCH | `/auth/github/challenges/:id/` | Challenge detail |
| POST | `/auth/github/challenges/:id/submit/` | Submit solution for AI evaluation |

## ⚙️ How It Works

1. **Connect GitHub** — OAuth flow syncs your public and private repositories
2. **Generate Challenges** — pick a repo, and Gemini analyzes your source files to create 5 targeted challenges
3. **Solve & Submit** — write your solution and submit for instant AI evaluation
4. **Track Progress** — dashboard shows completion rate, scores, and language breakdown across all repos

## 🔐 Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| `SECRET_KEY` | `backend/.env` | Django secret key |
| `GITHUB_CLIENT_ID` | `backend/.env` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | `backend/.env` | GitHub OAuth app client secret |
| `GITHUB_OAUTH_REDIRECT_URI` | `backend/.env` | OAuth callback URL (backend) |
| `GITHUB_OAUTH_FRONTEND_CALLBACK_URL` | `backend/.env` | Where to redirect after OAuth (frontend) |
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key |
| `VITE_API_URL` | `frontend/.env` | Backend API URL (defaults to `http://localhost:8000`) |
