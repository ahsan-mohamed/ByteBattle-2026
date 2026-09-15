import { Router } from "express";
import rateLimit from "express-rate-limit";

import { adminLogin, adminLogout, adminMe } from "../controllers/authController";
import { requireAdmin } from "../middleware/adminAuth";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  reorderQuestions,
} from "../controllers/questionController";
import {
  getQuiz,
  listQuizzes,
  updateQuizSettings,
  getQuizReadiness,
  publishQuiz,
  startCompetition,
  endCompetition,
  duplicateQuiz,
} from "../controllers/quizController";
import { getDashboard } from "../controllers/dashboardController";
import { listResults, getResultDetail, exportResultsCsv } from "../controllers/resultsController";
import { getLeaderboard, refreshLeaderboard } from "../controllers/leaderboardController";
import { syncGoogleSheets, getSheetsSyncStatus } from "../controllers/sheetsController";

const router = Router();

// Brute-force protection on login specifically - tighter than the general API limit.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, adminLogin);
router.post("/logout", requireAdmin, adminLogout);
router.get("/me", requireAdmin, adminMe);

// Everything below requires an authenticated admin session.
router.use(requireAdmin);

router.get("/dashboard", getDashboard);

router.get("/quizzes", listQuizzes);
router.get("/quiz/:id", getQuiz);
router.put("/quiz/:id/settings", updateQuizSettings);
router.get("/quiz/:id/readiness", getQuizReadiness);
router.post("/quiz/:id/publish", publishQuiz);
router.post("/quiz/:id/start", startCompetition);
router.post("/quiz/:id/end", endCompetition);
router.post("/quiz/:id/duplicate", duplicateQuiz);

router.get("/questions", listQuestions);
router.post("/questions", createQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);
router.post("/questions/:id/duplicate", duplicateQuestion);
router.put("/questions/reorder", reorderQuestions);

router.get("/results", listResults);
router.get("/results/:attemptId", getResultDetail);
router.get("/export", exportResultsCsv);

router.get("/leaderboard", getLeaderboard);
router.post("/leaderboard/refresh", refreshLeaderboard);

router.get("/sheets/status", getSheetsSyncStatus);
router.post("/sync-sheets", syncGoogleSheets);

export default router;
