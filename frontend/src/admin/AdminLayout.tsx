import { NavLink, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Settings2,
  BarChart3,
  Trophy,
  Sheet,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { useAdminAuth } from "./AuthContext";
import { AdminQuizProvider, useAdminQuiz } from "./QuizContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/quiz", label: "Quiz Control", icon: SlidersHorizontal },
  { to: "/admin/questions", label: "Questions", icon: ListChecks },
  { to: "/admin/results", label: "Results", icon: BarChart3 },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/admin/google-sheets", label: "Google Sheets", icon: Sheet },
  { to: "/admin/settings", label: "Settings", icon: Settings2 },
];

export function AdminLayout() {
  const { username, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-subtle">Loading…</p>
      </div>
    );
  }
  if (!username) return <Navigate to="/admin/login" replace />;

  return (
    <AdminQuizProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-surface">
          <TopBar />
          <main className="p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminQuizProvider>
  );
}

function Sidebar() {
  const { logout, username } = useAdminAuth();
  return (
    <aside className="flex w-60 flex-none flex-col border-r border-line bg-white">
      <div className="border-b border-line px-5 py-5">
        <p className="font-mono text-xs uppercase tracking-wide text-faint">Admin</p>
        <p className="mt-0.5 text-lg font-semibold text-ink">ByteBattle</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                isActive ? "bg-accent-light text-accent-dark" : "text-subtle hover:bg-surface hover:text-ink",
              ].join(" ")
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line px-5 py-4">
        <p className="truncate text-xs text-faint">Signed in as</p>
        <p className="truncate text-sm font-medium text-ink">{username}</p>
        <button
          onClick={() => logout()}
          className="focus-ring mt-3 flex items-center gap-2 text-sm text-subtle hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  const { quizzes, selectedQuiz, selectQuiz } = useAdminQuiz();
  if (quizzes.length === 0) return null;

  return (
    <div className="flex items-center justify-between border-b border-line bg-white px-8 py-3">
      <select
        value={selectedQuiz?.id ?? ""}
        onChange={(e) => selectQuiz(e.target.value)}
        className="focus-ring rounded-md border border-line bg-white px-3 py-1.5 text-sm text-ink"
      >
        {quizzes.map((q) => (
          <option key={q.id} value={q.id}>
            {q.name} — {q.status}
          </option>
        ))}
      </select>
      {selectedQuiz && (
        <StatusBadge status={selectedQuiz.status} />
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-surface text-subtle border-line",
    PUBLISHED: "bg-accent-light text-accent-dark border-accent/20",
    ACTIVE: "bg-success-light text-success border-success/20",
    ENDED: "bg-danger-light text-danger border-danger/20",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 font-mono text-xs font-medium ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
