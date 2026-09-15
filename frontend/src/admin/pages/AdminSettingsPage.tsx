import { useAdminAuth } from "../AuthContext";
import { useAdminQuiz } from "../QuizContext";
import { Card, NoQuizSelected } from "../components/Card";

export function AdminSettingsPage() {
  const { username } = useAdminAuth();
  const { selectedQuiz, loading } = useAdminQuiz();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">Settings</h1>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Account</h2>
        <p className="mt-2 text-sm text-subtle">
          Signed in as <span className="font-mono text-ink">{username}</span>. Admin credentials
          are managed via the backend's environment variables
          (<code className="font-mono text-xs">ADMIN_USERNAME</code> /{" "}
          <code className="font-mono text-xs">ADMIN_PASSWORD</code>) — update those and redeploy
          to change your login.
        </p>
      </Card>

      {!selectedQuiz ? (
        <NoQuizSelected />
      ) : (
        <Card>
          <h2 className="text-sm font-semibold text-ink">Active configuration</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-faint">Quiz</dt>
              <dd className="text-ink">{selectedQuiz.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Duration</dt>
              <dd className="font-mono text-ink">{selectedQuiz.durationMinutes} min</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Max Violations</dt>
              <dd className="font-mono text-ink">{selectedQuiz.maxViolations}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-faint">
            To change these, use Quiz Control instead — settings here are read-only.
          </p>
        </Card>
      )}
    </div>
  );
}
