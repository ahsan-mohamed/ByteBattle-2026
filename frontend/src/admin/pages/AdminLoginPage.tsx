import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { getApiErrorMessage } from "../../api/client";

export function AdminLoginPage() {
  const { username, loading, login } = useAdminAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && username) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const username = form.username.trim();
    const password = form.password;

    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(username, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-line bg-white p-8"
      >
        <p className="font-mono text-xs uppercase tracking-wide text-faint">
          Admin
        </p>

        <h1 className="mt-1 text-xl font-semibold text-ink">
          Sign in to ByteBattle
        </h1>

        <div className="mt-6 flex flex-col gap-4">
          <Input
            id="admin-username"
            name="username"
            type="text"
            placeholder="Username"
            autoComplete="username"
            autoFocus
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                username: e.target.value,
              }))
            }
          />

          <Input
            id="admin-password"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                password: e.target.value,
              }))
            }
          />

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            loading={submitting}
            className="w-full"
          >
            Sign in
          </Button>
        </div>
      </form>
    </div>
  );
}