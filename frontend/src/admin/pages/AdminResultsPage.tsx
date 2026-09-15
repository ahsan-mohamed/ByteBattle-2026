import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useAdminQuiz } from "../QuizContext";
import { listResults, getResultDetail, exportResultsCsvUrl } from "../api";
import { ResultRow, ResultDetail } from "../types";
import { Card, NoQuizSelected } from "../components/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

function formatTime(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AdminResultsPage() {
  const { selectedQuiz, loading: quizLoading } = useAdminQuiz();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "timeTaken" | "submittedAt">("score");
  const [detail, setDetail] = useState<ResultDetail | null>(null);

  const load = useCallback(async () => {
    if (!selectedQuiz) return;
    const res = await listResults(selectedQuiz.id, { search: search || undefined, sortBy, sortDir: "desc" });
    setResults(res);
  }, [selectedQuiz, search, sortBy]);

  useEffect(() => {
    load();
  }, [load]);

  if (quizLoading) return null;
  if (!selectedQuiz) return <NoQuizSelected />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Results</h1>
        <a href={exportResultsCsvUrl(selectedQuiz.id)} target="_blank" rel="noreferrer">
          <Button variant="secondary">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </a>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by name or unique ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="focus-ring rounded-md border border-line px-3 py-2.5 text-sm text-ink"
        >
          <option value="score">Sort by score</option>
          <option value="timeTaken">Sort by time taken</option>
          <option value="submittedAt">Sort by submission time</option>
        </select>
      </div>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Unique ID</th>
              <th className="px-4 py-3 font-medium">Correct</th>
              <th className="px-4 py-3 font-medium">Wrong</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Violations</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.attemptId} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink">{r.name}</td>
                <td className="px-4 py-3 font-mono text-subtle">{r.uniqueId}</td>
                <td className="px-4 py-3 font-mono text-ink">{r.correctAnswers ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-ink">{r.wrongAnswers ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-ink">{formatTime(r.timeTakenSeconds)}</td>
                <td className="px-4 py-3">
                  {r.violationCount > 0 ? (
                    <span className="rounded-full bg-danger-light px-2 py-0.5 text-xs font-medium text-danger">
                      {r.violationCount}
                    </span>
                  ) : (
                    <span className="text-faint">0</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    className="focus-ring text-sm font-medium text-accent hover:text-accent-dark"
                    onClick={() => getResultDetail(r.attemptId).then(setDetail)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-subtle">
                  No results yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {detail && (
        <Modal open labelledBy="result-detail-heading">
          <h2 id="result-detail-heading" className="text-lg font-semibold text-ink">
            {detail.name}
          </h2>
          <p className="font-mono text-sm text-subtle">{detail.uniqueId}</p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <DetailRow label="Correct" value={detail.correctAnswers ?? "—"} />
            <DetailRow label="Wrong" value={detail.wrongAnswers ?? "—"} />
            <DetailRow label="Unanswered" value={detail.unanswered ?? "—"} />
            <DetailRow label="Time Taken" value={formatTime(detail.timeTakenSeconds)} />
            <DetailRow
              label="Submitted At"
              value={detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : "—"}
            />
            <DetailRow label="Status" value={detail.status} />
          </dl>

          <h3 className="mt-5 text-sm font-semibold text-ink">
            Violations ({detail.totalViolations})
          </h3>
          {detail.totalViolations === 0 ? (
            <p className="mt-1 text-sm text-subtle">No violations recorded.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {Object.entries(detail.violationBreakdown).map(([type, count]) => (
                <li key={type} className="flex justify-between text-subtle">
                  <span>{type.replace(/_/g, " ").toLowerCase()}</span>
                  <span className="font-mono text-ink">{count}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={() => setDetail(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="font-mono text-ink">{value}</dd>
    </div>
  );
}
