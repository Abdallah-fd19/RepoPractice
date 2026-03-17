import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SideBar from "../components/Sidebar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

const STATUS_STYLES = {
  pending: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const TYPE_LABELS = {
  refactor: "Refactor",
  debug: "Debug",
  extend: "Extend",
  write_test: "Write Test",
  explain: "Explain",
};

export default function Challenges() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const repoFilter = searchParams.get("repo");
  const repoName = searchParams.get("name");

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (repoFilter) params.set("repo", repoFilter);
        if (statusFilter) params.set("status", statusFilter);
        const res = await authFetch(`${API}/auth/github/challenges/?${params}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to load challenges");
        }
        setChallenges(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [repoFilter, statusFilter]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 overflow-hidden">
      <SideBar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {repoName ? `Challenges — ${repoName}` : "All Challenges"}
            </h1>
            <p className="text-gray-600 mt-1">
              {repoName
                ? "Freshly generated challenges from your repository."
                : "All coding challenges across your repositories."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {repoFilter && (
              <button
                onClick={() => navigate("/challenges")}
                className="text-sm text-gray-500 hover:text-primary-600 underline"
              >
                View all
              </button>
            )}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-sm py-1.5 w-auto"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={() => navigate("/repos")}
              className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + New Challenges
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium">No challenges yet.</p>
            <p className="text-sm mt-1">
              Go to{" "}
              <button
                onClick={() => navigate("/repos")}
                className="text-primary-600 underline hover:text-primary-700"
              >
                Repos
              </button>{" "}
              and generate some.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((c) => (
              <Card
                key={c.id}
                className="card-shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/challenges/${c.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                          {TYPE_LABELS[c.type] || c.type}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{c.repo_name}</span>
                        {c.file_path && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400 font-mono truncate max-w-xs">
                              {c.file_path}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{c.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_STYLES[c.difficulty]}`}>
                        {c.difficulty}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
