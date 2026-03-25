import { useEffect, useMemo, useState } from "react";
import SideBar from "../components/Sidebar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/Card.jsx";
import Button from "../components/Button.jsx";

export default function Profile() {
  const { user, loadProfile, authFetch, error, loading } = useAuth();
  const apiBaseUrl = useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:8000", []);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [localError, setLocalError] = useState("");

  const githubUsername = useMemo(() => user?.github_username || "", [user]);

  const hasChanges = useMemo(
    () =>
      username.trim() !== (user?.username ?? "") ||
      bio !== (user?.bio ?? "") ||
      !!avatarFile,
    [username, bio, avatarFile, user?.username, user?.bio]
  );

  useEffect(() => {
    loadProfile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUsername(user?.username ?? "");
    setBio(user?.bio ?? "");
    if (user?.avatar) {
      setAvatarPreview(
        user.avatar.startsWith("http")
          ? user.avatar
          : `${apiBaseUrl}${user.avatar}`
      );
    } else {
      setAvatarPreview(null);
    }
    setAvatarFile(null);
  }, [user?.username, user?.bio, user?.avatar, apiBaseUrl]);

  const handleSave = async () => {
    setLocalError("");
    setSuccessMessage("");
    setSaving(true);
    try {
      const formData = new FormData();
      if (username.trim()) {
        formData.append("username", username.trim());
      }
      formData.append("bio", bio ?? "");
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await authFetch(`${apiBaseUrl}/users/profile/`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          data.username?.[0] ||
          data.avatar?.[0] ||
          data.detail ||
          "Failed to update profile";
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
    <div className="flex h-screen bg-[var(--color-bg)] overflow-hidden">
      <SideBar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Profile</h1>
          <p className="text-[var(--color-text-secondary)]">View and update your account details.</p>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Username can be updated below; email and GitHub are read-only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[var(--color-card-hover)] overflow-hidden flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm text-[var(--color-text-muted)]">No avatar</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-sm text-[var(--color-text)]"
                  />
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">Upload a square image for best results.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Username</label>
                  <input
                    type="text"
                    className="input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</p>
                  <div className="input-field bg-[var(--color-bg)]">{user?.email ?? "-"}</div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">GitHub username</p>
                <div className="input-field bg-[var(--color-bg)]">{githubUsername || "-"}</div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Managed by GitHub OAuth. You can't edit this here.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="h-6" />

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your public profile info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Bio</label>
                <textarea
                  className="input-field min-h-28"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself…"
                />
              </div>

              {(localError || (error && (!user || error !== "Failed to load profile"))) && (
                <div className="bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-md p-3">
                  <p className="text-sm text-[var(--color-error-text)]">{localError || error}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-md p-3">
                  <p className="text-sm text-[var(--color-success-text)]">{successMessage}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="button" onClick={handleSave} loading={saving} disabled={saving || loading || !hasChanges}>
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
