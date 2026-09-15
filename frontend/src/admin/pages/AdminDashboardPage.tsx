import { useEffect, useState } from "react";
import { useAdminQuiz } from "../QuizContext";
import { getDashboard } from "../api";
import { DashboardStats } from "../types";
import { StatCard, NoQuizSelected, Card } from "../components/Card";
import { StatusBadge } from "../AdminLayout";

export function AdminDashboardPage() {
  const { selectedQuiz, loading: quizLoading } = useAdminQuiz();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!selectedQuiz) return;
    getDashboard(selectedQuiz.id).then(setStats);
  }, [selectedQuiz]);

  if (quizLoading) return null;
  if (!selectedQuiz) return <NoQuizSelected />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{selectedQuiz.name}</h1>
          <p className="mt-1 text-sm text-subtle">Overview</p>
        </div>
        <StatusBadge status={selectedQuiz.status} />
      </div>

      {!stats ? (
        <p className="font-mono text-sm text-subtle">Loading stats…</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Participants" value={stats.totalParticipants} />
          <StatCard label="Completed" value={stats.completedAttempts} />
          <StatCard label="Active" value={stats.activeAttempts} />
          <StatCard label="Average Score" value={stats.averageScore.toFixed(1)} />
          <StatCard label="Highest Score" value={stats.highestScore} />
          <StatCard
            label="Average Time"
            value={`${Math.floor(stats.averageTimeSeconds / 60)}m ${stats.averageTimeSeconds % 60}s`}
          />
        </div>
      )}

      <Card>
        <p className="text-sm text-subtle">
          Quiz duration <span className="font-mono text-ink">{selectedQuiz.durationMinutes} min</span>
          {" · "}
          Max violations <span className="font-mono text-ink">{selectedQuiz.maxViolations}</span>
        </p>
      </Card>
    </div>
  );
}
