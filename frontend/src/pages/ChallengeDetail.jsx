import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SideBar from "../components/Sidebar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card.jsx";
import Button from "../components/Button.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const TYPE_LABELS = {
  refactor: "Refactor",
  debug: "Debug",
  extend: "Extend",
  write_test: "Write Test",
  explain: "Explain",
};

export default function ChallengeDetail() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${API}/auth/github/challenges/${id}/`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Challenge not found");
        }
        const data = await res.json();
        setChallenge(data);
        if (data.status === "completed") setSubmitted(true);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await authFetch(`${API}/auth/github/challenges/${id}/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: answer }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Submission failed");
      }
      setSubmitted(true);
      setChallenge((prev) => ({ ...prev, status: "completed" }));
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 overflow-hidden">
        <SideBar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-4 max-w-3xl">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (error && !challenge) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 overflow-hidden">
        <SideBar />
        <main className="flex-1 p-6 lg:p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 overflow-hidden">
      <SideBar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Back */}
        <button
          onClick={() => navigate(`/challenges?repo=${challenge.repo}`)}
          className="text-sm text-gray-500 hover:text-primary-600 mb-4 flex items-center gap-1"
        >
          ← Back to challenges
        </button>

        <div className="max-w-3xl space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                {TYPE_LABELS[challenge.type] || challenge.type}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500">{challenge.repo_full_name}</span>
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_STYLES[challenge.difficulty]}`}>
                {challenge.difficulty}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
            {challenge.file_path && (
              <p className="text-sm font-mono text-gray-400 mt-1">{challenge.file_path}</p>
            )}
          </div>

          {/* Description */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-base">Challenge</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {challenge.description}
              </p>
            </CardContent>
          </Card>

          {/* Code snippet */}
          {challenge.code_snippet && (
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="text-base">Code to work with</CardTitle>
                {challenge.file_path && (
                  <CardDescription className="font-mono text-xs">{challenge.file_path}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
                  <code>{challenge.code_snippet}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Answer */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-base">Your answer</CardTitle>
              <CardDescription>
                {submitted
                  ? "You have already submitted an answer for this challenge."
                  : "Write your solution or explanation below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="input-field min-h-48 font-mono text-sm"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your code or explanation here…"
                disabled={submitted}
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  <p className="text-sm text-emerald-700 font-medium">
                    Challenge completed! Well done.
                  </p>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting || !answer.trim()}
                >
                  Submit answer
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
