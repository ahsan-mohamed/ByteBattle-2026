import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { StartPage } from "./pages/StartPage";
import { QuizPage } from "./pages/QuizPage";
import { SubmittedPage } from "./pages/SubmittedPage";
import { NotFoundPage } from "./pages/NotFoundPage";

import { AdminAuthProvider } from "./admin/AuthContext";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminQuestionsPage } from "./admin/pages/AdminQuestionsPage";
import { AdminQuizControlPage } from "./admin/pages/AdminQuizControlPage";
import { AdminResultsPage } from "./admin/pages/AdminResultsPage";
import { AdminLeaderboardPage } from "./admin/pages/AdminLeaderboardPage";
import { AdminGoogleSheetsPage } from "./admin/pages/AdminGoogleSheetsPage";
import { AdminSettingsPage } from "./admin/pages/AdminSettingsPage";

/**
 * Provides admin authentication only to admin routes.
 *
 * This prevents participant pages from calling /api/admin/me.
 */
function AdminAuthRoutes() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PARTICIPANT ROUTES
            ========================= */}

        <Route path="/" element={<HomePage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/submitted" element={<SubmittedPage />} />

        {/* =========================
            ADMIN ROUTES
            ========================= */}

        <Route element={<AdminAuthRoutes />}>
          {/* Admin login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected admin application */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="quiz" element={<AdminQuizControlPage />} />
            <Route path="questions" element={<AdminQuestionsPage />} />
            <Route path="results" element={<AdminResultsPage />} />
            <Route path="leaderboard" element={<AdminLeaderboardPage />} />
            <Route path="google-sheets" element={<AdminGoogleSheetsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* =========================
            404
            ========================= */}

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}