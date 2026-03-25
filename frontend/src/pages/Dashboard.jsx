import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/Sidebar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  FiCheckCircle,
  FiCode,
  FiFolder,
  FiList,
  FiTrendingUp,
  FiArrowRight,
  FiGitBranch,
  FiZap,
} from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DIFFICULTY_DOT = {
  easy: "bg-emerald-400",
  medium: "bg-amber-400",
  hard: "bg-red-400",
};

const STATUS_BADGE = {
  pending: "border-[var(--color-border)] text-[var(--color-text-muted)]",
  in_progress: "border-blue-400/40 text-blue-500 bg-blue-500/10",
  completed: "border-emerald-400/40 text-emerald-500 bg-emerald-500/10",
};

function StatCard({ label, value, icon, accent, delay }) {
  const Ic = icon;
  return (
    <div
      className={`animate-slide-up ${delay} group relative overflow-hidden rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-5 shadow-md hover:shadow-lg transition-shadow duration-300`}
    >
      <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full ${accent} opacity-[0.07] blur-md group-hover:opacity-[0.12] transition-opacity duration-500`} />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] tracking-wide uppercase">{label}</p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--color-text)] tabular-nums">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent} bg-opacity-10`}>
          <Ic size={20} className="text-current opacity-70" />
        </div>
      </div>
    </div>
  );
}

const CHART_COLORS = {
  pending: "#94a3b8",
  in_progress: "#3b82f6",
  completed: "#10b981",
};

const CHART_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-[var(--color-text)]">{d.label}</p>
      <p className="text-[var(--color-text-muted)]">{d.value} challenge{d.value !== 1 ? "s" : ""}</p>
    </div>
  );
}

function Dashboard() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const [reposRes, challengesRes] = await Promise.all([
          authFetch(`${API}/auth/github/repos/`),
          authFetch(`${API}/auth/github/challenges/`),
        ]);
        if (!reposRes.ok) {
          const d = await reposRes.json().catch(() => ({}));
          throw new Error(d.detail || "Failed to load repositories.");
        }
        if (!challengesRes.ok) {
          const d = await challengesRes.json().catch(() => ({}));
          throw new Error(d.detail || "Failed to load challenges.");
        }
        setRepos(await reposRes.json());
        setChallenges(await challengesRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch]);

  const m = useMemo(() => {
    const total = challenges.length;
    const completed = challenges.filter((c) => c.status === "completed").length;
    const inProgress = challenges.filter((c) => c.status === "in_progress").length;
    const rate = total ? Math.round((completed / total) * 100) : 0;
    const scores = challenges.map((c) => c.latest_submission?.score).filter((s) => typeof s === "number");
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { repos: repos.length, total, completed, inProgress, rate, avg };
  }, [repos, challenges]);

  const recent = challenges.slice(0, 6);

  const langs = useMemo(() => {
    const c = {};
    for (const r of repos) c[r.language || "Unknown"] = (c[r.language || "Unknown"] || 0) + 1;
    const sorted = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] || 1;
    return sorted.map(([name, count]) => ({ name, count, pct: Math.round((count / max) * 100) }));
  }, [repos]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  const gridStroke = getComputedStyle(document.documentElement).getPropertyValue("--color-border").trim() || "#e5e7eb";
  const tickFill = getComputedStyle(document.documentElement).getPropertyValue("--color-text-muted").trim() || "#94a3b8";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <SideBar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">

          <div className="animate-slide-up mb-10">
            <p className="text-sm font-medium text-primary-600 mb-1">{greeting()}</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)]">
              {user?.username || "Developer"}
            </h1>
            <p className="mt-2 text-[15px] text-[var(--color-text-muted)] max-w-xl">
              Your coding practice overview — repos synced, challenges tackled, and scores earned.
            </p>
          </div>

          {error && (
            <div className="mb-6 animate-fade-in rounded-xl border border-[var(--color-error-border)] bg-[var(--color-error-bg)] px-4 py-3">
              <p className="text-sm text-[var(--color-error-text)]">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-[104px] rounded-2xl shimmer-loading" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <StatCard label="Repositories" value={m.repos} icon={FiFolder} accent="bg-blue-500 text-blue-600" delay="stagger-1" />
                <StatCard label="Challenges" value={m.total} icon={FiList} accent="bg-violet-500 text-violet-600" delay="stagger-2" />
                <StatCard label="Completed" value={m.completed} icon={FiCheckCircle} accent="bg-emerald-500 text-emerald-600" delay="stagger-3" />
                <StatCard label="Avg Score" value={m.avg} icon={FiTrendingUp} accent="bg-amber-500 text-amber-600" delay="stagger-4" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
                <div className="xl:col-span-8 animate-slide-up stagger-3 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--color-text)]">Recent Challenges</h2>
                      <p className="text-sm text-[var(--color-text-muted)]">Your latest generated tasks.</p>
                    </div>
                    {recent.length > 0 && (
                      <button
                        type="button"
                        onClick={() => navigate("/challenges")}
                        className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        View all <FiArrowRight size={14} />
                      </button>
                    )}
                  </div>

                  {recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                        <FiZap className="text-primary-500" size={28} />
                      </div>
                      <p className="font-semibold text-[var(--color-text)]">No challenges yet</p>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)] max-w-xs">
                        Pick a repository and generate your first set of coding challenges.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/repos")}
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
                      >
                        <FiGitBranch size={15} /> Browse repositories
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {recent.map((ch, idx) => (
                        <button
                          type="button"
                          key={ch.id}
                          onClick={() => navigate(`/challenges/${ch.id}`)}
                          className={`animate-slide-right stagger-${Math.min(idx + 1, 5)} group w-full text-left flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-[var(--color-card-hover)] active:scale-[0.995]`}
                        >
                          <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${DIFFICULTY_DOT[ch.difficulty] || "bg-gray-300"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-text)] truncate group-hover:text-primary-600 transition-colors">
                              {ch.title}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                              {ch.repo_name} &middot; {ch.type.replace("_", " ")}
                            </p>
                          </div>
                          <span className={`shrink-0 text-[11px] font-medium border rounded-full px-2 py-0.5 capitalize ${STATUS_BADGE[ch.status] || ""}`}>
                            {ch.status.replace("_", " ")}
                          </span>
                          <FiArrowRight size={14} className="shrink-0 text-[var(--color-text-muted)] group-hover:text-primary-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="xl:col-span-4 space-y-6">
                  <div className="animate-slide-up stagger-4 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Challenge Breakdown</h3>
                    {m.total === 0 ? (
                      <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No challenges yet.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart
                          data={[
                            { key: "pending", label: CHART_LABELS.pending, value: m.total - m.completed - m.inProgress, color: CHART_COLORS.pending },
                            { key: "in_progress", label: CHART_LABELS.in_progress, value: m.inProgress, color: CHART_COLORS.in_progress },
                            { key: "completed", label: CHART_LABELS.completed, value: m.completed, color: CHART_COLORS.completed },
                          ]}
                          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                          barCategoryGap="25%"
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                          <XAxis dataKey="label" tick={{ fontSize: 12, fill: tickFill }} axisLine={false} tickLine={false} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickFill }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                            {["pending", "in_progress", "completed"].map((key) => (
                              <Cell key={key} fill={CHART_COLORS[key]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
                      <span className="font-semibold text-[var(--color-text)]">{m.completed}</span> of{" "}
                      <span className="font-semibold text-[var(--color-text)]">{m.total}</span> completed ({m.rate}%)
                    </p>
                  </div>

                  <div className="animate-slide-up stagger-5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-card)] p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">Languages</h3>
                    {langs.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-muted)]">No repos synced yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {langs.map(({ name, count, pct }) => (
                          <div key={name}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="flex items-center gap-1.5 font-medium text-[var(--color-text)]">
                                <FiCode size={13} className="text-primary-500" /> {name}
                              </span>
                              <span className="text-[var(--color-text-muted)] tabular-nums">{count}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-card-hover)]">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500"
                                style={{ width: `${pct}%`, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="animate-slide-up stagger-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/repos")}
                  className="group rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <FiGitBranch className="text-blue-500" size={18} />
                  </div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Pick a repository</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">Sync and generate fresh challenges.</p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/challenges?status=in_progress")}
                  className="group rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <FiZap className="text-amber-500" size={18} />
                  </div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Continue in progress</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{m.inProgress} challenge(s) waiting.</p>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/challenges?status=completed")}
                  className="group rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                    <FiCheckCircle className="text-emerald-500" size={18} />
                  </div>
                  <p className="text-sm font-bold text-[var(--color-text)]">Review completed</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{m.completed} challenge(s) done.</p>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
