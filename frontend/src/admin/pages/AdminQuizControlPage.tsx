import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useAdminQuiz } from "../QuizContext";
import {
  getQuizReadiness,
  updateQuizSettings,
  publishQuiz,
  startCompetition,
  endCompetition,
  duplicateQuiz,
} from "../api";
import { Readiness } from "../types";
import { Card, NoQuizSelected } from "../components/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { StatusBadge } from "../AdminLayout";
import { getApiErrorMessage } from "../../api/client";

export function AdminQuizControlPage() {
  const { selectedQuiz, loading: quizLoading, refresh } = useAdminQuiz();
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [settings, setSettings] = useState({
    name: "",
    durationMinutes: 30,
    maxViolations: 3,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState("");

  useEffect(() => {
    if (!selectedQuiz) return;
    setSettings({
      name: selectedQuiz.name,
      durationMinutes: selectedQuiz.durationMinutes,
      maxViolations: selectedQuiz.maxViolations,
    });
    getQuizReadiness(selectedQuiz.id).then(setReadiness);
  }, [selectedQuiz]);

  if (quizLoading) return null;
  if (!selectedQuiz) return <NoQuizSelected />;

  const editable = selectedQuiz.status === "DRAFT" || selectedQuiz.status === "PUBLISHED";

  async function runAction(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      await refresh();
      const r = await getQuizReadiness(selectedQuiz!.id);
      setReadiness(r);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Quiz Control</h1>
        <StatusBadge status={selectedQuiz.status} />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Card>
        <h2 className="text-sm font-semibold text-ink">Settings</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Quiz Name">
            <Input
              value={settings.name}
              disabled={!editable}
              onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
            />
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              value={settings.durationMinutes}
              disabled={!editable}
              onChange={(e) =>
                setSettings((s) => ({ ...s, durationMinutes: Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="Max Violations">
            <Input
              type="number"
              value={settings.maxViolations}
              disabled={!editable}
              onChange={(e) =>
                setSettings((s) => ({ ...s, maxViolations: Number(e.target.value) }))
              }
            />
          </Field>
        </div>
        {editable && (
          <Button
            className="mt-4"
            variant="secondary"
            loading={busy}
            onClick={() => runAction(() => updateQuizSettings(selectedQuiz.id, settings))}
          >
            Save Settings
          </Button>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Readiness</h2>
        {readiness && (
          <div className="mt-3">
            <p className="font-mono text-sm text-subtle">
              {readiness.mediumCount} Medium · {readiness.hardCount} Hard · {readiness.total} Total
            </p>
            {readiness.ready ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> Ready to publish
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {readiness.problems.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-danger">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" /> {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Lifecycle</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {selectedQuiz.status === "DRAFT" && (
            <Button
              loading={busy}
              disabled={!readiness?.ready}
              onClick={() => runAction(() => publishQuiz(selectedQuiz.id))}
            >
              Publish Quiz
            </Button>
          )}
          {selectedQuiz.status === "PUBLISHED" && (
            <Button loading={busy} onClick={() => runAction(() => startCompetition(selectedQuiz.id))}>
              Start Competition
            </Button>
          )}
          {selectedQuiz.status === "ACTIVE" && (
            <Button
              variant="danger"
              loading={busy}
              onClick={() => runAction(() => endCompetition(selectedQuiz.id))}
            >
              End Competition
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Duplicate for a future event</h2>
        <div className="mt-4 flex gap-3">
          <Input
            placeholder="e.g. ByteBattle 2027"
            value={duplicateName}
            onChange={(e) => setDuplicateName(e.target.value)}
            className="max-w-xs"
          />
          <Button
            variant="secondary"
            loading={busy}
            disabled={!duplicateName.trim()}
            onClick={() =>
              runAction(async () => {
                await duplicateQuiz(selectedQuiz.id, duplicateName.trim());
                setDuplicateName("");
              })
            }
          >
            Duplicate Quiz
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
