import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/Sidebar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/Card.jsx";
import Button from "../components/Button.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

function LanguageBadge({ lang }) {
  if (!lang) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
      {lang}
    </span>
  );
}

export default function Repos() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${API}/auth/github/repos/`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to load repos");
        }
        setRepos(await res.json());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleGenerate = async (repo) => {
    setGenerating(repo.id);
    setError("");
    try {
      const res = await authFetch(`${API}/auth/github/repos/${repo.id}/generate/`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to generate challenges");
      }
      navigate(`/challenges?repo=${repo.id}&name=${encodeURIComponent(repo.name)}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 overflow-hidden">
      <SideBar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Repos</h1>
          <p className="text-gray-600 mt-1">
            Select a repository to generate coding challenges from your actual code.
          </p>
        </div>

        {!loading && repos.length === 0 && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 font-medium">
              No GitHub account connected.{" "}
              <a href={`${API}/auth/github/login/`} className="underline hover:text-amber-900">
                Connect GitHub
              </a>{" "}
              to load your repos.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <Card key={repo.id} className="card-shadow hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary-600 transition-colors"
                      >
                        {repo.name}
                      </a>
                    </CardTitle>
                    <LanguageBadge lang={repo.language} />
                  </div>
                  {repo.description && (
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {repo.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    type="button"
                    onClick={() => handleGenerate(repo)}
                    loading={generating === repo.id}
                    disabled={!!generating}
                    className="w-full mt-2 text-sm"
                  >
                    Generate Challenges
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
