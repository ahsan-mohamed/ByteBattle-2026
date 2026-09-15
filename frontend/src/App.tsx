import { BrowserRouter, Routes, Route } from "react-router-dom";
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

export function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          {/* Participant routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/start" element={<StartPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/submitted" element={<SubmittedPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="quiz" element={<AdminQuizControlPage />} />
            <Route path="questions" element={<AdminQuestionsPage />} />
            <Route path="results" element={<AdminResultsPage />} />
            <Route path="leaderboard" element={<AdminLeaderboardPage />} />
            <Route path="google-sheets" element={<AdminGoogleSheetsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
