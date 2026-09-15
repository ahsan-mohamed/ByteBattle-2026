import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Footer } from "./HomePage";
import { startParticipant, startQuiz } from "../api/participant";
import { getApiErrorMessage } from "../api/client";
import { writeSession } from "../hooks/useParticipantSession";

export function StartPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [registered, setRegistered] = useState<{ uniqueId: string; participantId: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    setLoading(true);
    try {
      const res = await startParticipant(name.trim());
      writeSession({ participantId: res.participantId, name: res.name, uniqueId: res.uniqueId });
      setRegistered({ uniqueId: res.uniqueId, participantId: res.participantId });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleBegin() {
    if (!registered) return;
    setError(null);
    setLoading(true);
    try {
      const res = await startQuiz(registered.participantId);
      writeSession({ attemptToken: res.attemptToken, maxViolations: res.maxViolations });
      navigate("/quiz");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {!registered ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-ink">Enter your name</h1>
                <p className="mt-1.5 text-sm text-subtle">
                  We'll generate a unique participant ID for you — no account needed.
                </p>
              </div>
              <Input
                autoFocus
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={error ?? undefined}
              />
              <Button type="submit" loading={loading}>
                Continue
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div>
                <h1 className="text-2xl font-semibold text-ink">You're all set, {name}</h1>
                <p className="mt-1.5 text-sm text-subtle">Your unique participant ID is</p>
              </div>
              <p className="rounded-md border border-line bg-surface px-6 py-3 font-mono text-2xl font-medium tracking-wide text-accent-dark">
                {registered.uniqueId}
              </p>
              <p className="text-xs text-faint">
                Save this ID — it's how the organizer identifies your attempt.
              </p>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button onClick={handleBegin} loading={loading} className="mt-2 w-full">
                Begin Quiz
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
