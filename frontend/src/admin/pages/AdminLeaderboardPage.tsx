import { useEffect, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { useAdminQuiz } from "../QuizContext";
import { getLeaderboard, refreshLeaderboard } from "../api";
import { LeaderboardResponse } from "../types";
import { Card, NoQuizSelected } from "../components/Card";
import { Button } from "../../components/ui/Button";
import { getApiErrorMessage } from "../../api/client";

export function AdminLeaderboardPage() {
  const { selectedQuiz, loading: quizLoading } = useAdminQuiz();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedQuiz) return;
    getLeaderboard(selectedQuiz.id).then(setData);
  }, [selectedQuiz]);

  async function handleRefresh() {
    if (!selectedQuiz) return;
    setError(null);
    setRefreshing(true);
    try {
      const res = await refreshLeaderboard(selectedQuiz.id);
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }

  if (quizLoading) return null;
  if (!selectedQuiz) return <NoQuizSelected />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-semibold text-ink">Leaderboard</h1>
        </div>
        <Button onClick={handleRefresh} loading={refreshing}>
          <RefreshCw className="h-4 w-4" /> Refresh Leaderboard
        </Button>
      </div>

      <p className="text-sm text-subtle">
        {data?.lastRefreshedAt ? (
          <>
            Last refreshed: {new Date(data.lastRefreshedAt).toLocaleString()}
            {data.lastRefreshedBy && <> by {data.lastRefreshedBy}</>}
          </>
        ) : (
          "Not refreshed yet — this preview is computed live but not saved until you refresh."
        )}
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Unique ID</th>
              <th className="px-4 py-3 font-medium">Correct</th>
              <th className="px-4 py-3 font-medium">Wrong</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((row) => (
              <tr key={row.uniqueId} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono font-semibold text-ink">{row.rank}</td>
                <td className="px-4 py-3 text-ink">{row.name}</td>
                <td className="px-4 py-3 font-mono text-subtle">{row.uniqueId}</td>
                <td className="px-4 py-3 font-mono text-ink">{row.correctAnswers}</td>
                <td className="px-4 py-3 font-mono text-ink">{row.wrongAnswers}</td>
                <td className="px-4 py-3 font-mono text-ink">{row.timeTaken}</td>
              </tr>
            ))}
            {(!data || data.rows.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-subtle">
                  No completed attempts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
