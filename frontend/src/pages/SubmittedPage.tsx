import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { Footer } from "./HomePage";
import { readSession, clearSession } from "../hooks/useParticipantSession";

export function SubmittedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateUniqueId = (location.state as { uniqueId?: string } | null)?.uniqueId;
  const uniqueId = stateUniqueId ?? readSession().uniqueId;

  useEffect(() => {
    // Clear everything now that the attempt is closed - a refresh here should
    // just show this same confirmation, not offer to resume a quiz.
    clearSession();
  }, []);

  useEffect(() => {
    if (!uniqueId) navigate("/", { replace: true });
  }, [uniqueId, navigate]);

  if (!uniqueId) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h1 className="mt-4 text-2xl font-semibold text-ink">Quiz submitted successfully</h1>
        <p className="mt-2 text-sm text-subtle">Unique ID</p>
        <p className="mt-1 rounded-md border border-line bg-surface px-6 py-3 font-mono text-xl font-medium tracking-wide text-accent-dark">
          {uniqueId}
        </p>
        <p className="mt-6 max-w-sm text-sm text-subtle">
          Thank you for participating. Results are reviewed by the organizers.
        </p>
      </main>
      <Footer />
    </div>
  );
}
