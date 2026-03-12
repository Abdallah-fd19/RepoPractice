import { useEffect, useMemo, useState } from "react";
import SideBar from "../components/Sidebar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx";
import Button from "../components/Button.jsx";

export default function Profile() {
  const { user, loadProfile, authFetch, error, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState("");

  const githubUsername = useMemo(() => user?.github_username || "", [user]);

  useEffect(() => {
    loadProfile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setBio(user?.bio ?? "");
  }, [user?.username, user?.bio]);

  const handleSave = async () => {
    setLocalError("");
    setSuccessMessage("");
    setSaving(true);
    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/users/profile/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() || undefined, bio }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.username?.[0] || data.detail || "Failed to update profile";
        throw new Error(message);
      }

      await loadProfile?.();
      setSuccessMessage("Profile updated");
    } catch (e) {
      setLocalError(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100/50 overflow-hidden">
      <SideBar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">View and update your account details.</p>
        </div>

        <div className="max-w-2xl">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Username can be updated below; email and GitHub are read-only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                  <div className="input-field bg-gray-50">{user?.email ?? "-"}</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">GitHub username</p>
                <div className="input-field bg-gray-50">{githubUsername || "-"}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Managed by GitHub OAuth. You can’t edit this here.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="h-6" />

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your public profile info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  className="input-field min-h-28"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself…"
                />
              </div>

              {(localError || (error && (!user || error !== "Failed to load profile"))) && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{localError || error}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                  <p className="text-sm text-emerald-700">{successMessage}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="button" onClick={handleSave} loading={saving} disabled={saving || loading}>
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

