import { useEffect, useState } from "react";
import { Sheet, RefreshCw, AlertCircle } from "lucide-react";
import { useAdminQuiz } from "../QuizContext";
import { getSheetsStatus, syncGoogleSheets } from "../api";
import { Card, NoQuizSelected } from "../components/Card";
import { Button } from "../../components/ui/Button";
import { getApiErrorMessage } from "../../api/client";

export function AdminGoogleSheetsPage() {
  const { selectedQuiz, loading: quizLoading } = useAdminQuiz();
  const [status, setStatus] = useState<{
    configured: boolean;
    lastSyncedAt: string | null;
    lastSyncedCount: number | null;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedQuiz) return;
    getSheetsStatus(selectedQuiz.id).then(setStatus);
  }, [selectedQuiz]);

  async function handleSync() {
    if (!selectedQuiz) return;
    setError(null);
    setMessage(null);
    setSyncing(true);
    try {
      const res = await syncGoogleSheets(selectedQuiz.id);
      setMessage(res.message);
      setStatus((s) => (s ? { ...s, lastSyncedAt: res.lastSyncedAt, lastSyncedCount: res.lastSyncedCount } : s));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  }

  if (quizLoading) return null;
  if (!selectedQuiz) return <NoQuizSelected />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Sheet className="h-5 w-5 text-accent" />
        <h1 className="text-xl font-semibold text-ink">Google Sheets</h1>
      </div>

      <Card>
        {status && !status.configured && (
          <p className="flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-3 text-sm text-subtle">
            <AlertCircle className="h-4 w-4 flex-none" />
            Not configured yet. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and
            GOOGLE_PRIVATE_KEY on the backend to enable syncing.
          </p>
        )}

        <p className="mt-1 text-sm text-subtle">
          {status?.lastSyncedAt ? (
            <>
              Last synced: {new Date(status.lastSyncedAt).toLocaleString()}
              {status.lastSyncedCount !== null && <> · {status.lastSyncedCount} results synchronized</>}
            </>
          ) : (
            "Never synced yet."
          )}
        </p>

        {message && <p className="mt-2 text-sm text-success">{message}</p>}
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}

        <Button className="mt-4" onClick={handleSync} loading={syncing} disabled={!status?.configured}>
          <RefreshCw className="h-4 w-4" /> Sync to Google Sheets
        </Button>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-ink">Sheet columns</h2>
        <p className="mt-2 text-sm text-subtle">
          Serial Number, Name, Unique ID, Correct Answers, Wrong Answers, Time Taken — plus
          Score, Submitted At, and Violation Count as hidden admin columns. Only completed
          attempts sync, and existing rows are updated by Unique ID rather than duplicated.
        </p>
      </Card>
    </div>
  );
}
