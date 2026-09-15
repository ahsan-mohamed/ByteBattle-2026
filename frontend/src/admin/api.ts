import { apiClient } from "../api/client";
import {
  Quiz,
  AdminQuestion,
  QuestionStats,
  Readiness,
  DashboardStats,
  ResultRow,
  ResultDetail,
  LeaderboardResponse,
  Difficulty,
  AnswerOption,
} from "./types";

const BASE = "/admin";

// --- auth ---
export async function adminLogin(username: string, password: string): Promise<{ username: string }> {
  const { data } = await apiClient.post(`${BASE}/login`, { username, password });
  return data;
}
export async function adminLogout(): Promise<void> {
  await apiClient.post(`${BASE}/logout`);
}
export async function adminMe(): Promise<{ username: string }> {
  const { data } = await apiClient.get(`${BASE}/me`);
  return data;
}

// --- dashboard ---
export async function getDashboard(quizId: string): Promise<DashboardStats> {
  const { data } = await apiClient.get(`${BASE}/dashboard`, { params: { quizId } });
  return data;
}

// --- quizzes ---
export async function listQuizzes(): Promise<Quiz[]> {
  const { data } = await apiClient.get(`${BASE}/quizzes`);
  return data.quizzes;
}
export async function getQuiz(id: string): Promise<{ quiz: Quiz; questionStats: QuestionStats }> {
  const { data } = await apiClient.get(`${BASE}/quiz/${id}`);
  return data;
}
export async function updateQuizSettings(id: string, patch: Partial<Quiz>): Promise<Quiz> {
  const { data } = await apiClient.put(`${BASE}/quiz/${id}/settings`, patch);
  return data;
}
export async function getQuizReadiness(id: string): Promise<Readiness> {
  const { data } = await apiClient.get(`${BASE}/quiz/${id}/readiness`);
  return data;
}
export async function publishQuiz(id: string): Promise<Quiz> {
  const { data } = await apiClient.post(`${BASE}/quiz/${id}/publish`);
  return data;
}
export async function startCompetition(id: string): Promise<Quiz> {
  const { data } = await apiClient.post(`${BASE}/quiz/${id}/start`);
  return data;
}
export async function endCompetition(id: string): Promise<Quiz> {
  const { data } = await apiClient.post(`${BASE}/quiz/${id}/end`);
  return data;
}
export async function duplicateQuiz(id: string, name: string): Promise<Quiz> {
  const { data } = await apiClient.post(`${BASE}/quiz/${id}/duplicate`, { name });
  return data;
}

// --- questions ---
export async function listQuestions(
  quizId: string,
  filters?: { search?: string; difficulty?: Difficulty; category?: string }
): Promise<{ questions: AdminQuestion[]; stats: QuestionStats }> {
  const { data } = await apiClient.get(`${BASE}/questions`, {
    params: { quizId, ...filters },
  });
  return data;
}
export type QuestionInput = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  difficulty: Difficulty;
  category: string;
};
export async function createQuestion(quizId: string, input: QuestionInput): Promise<AdminQuestion> {
  const { data } = await apiClient.post(`${BASE}/questions`, { quizId, ...input });
  return data;
}
export async function updateQuestion(
  id: string,
  input: Partial<QuestionInput>
): Promise<AdminQuestion> {
  const { data } = await apiClient.put(`${BASE}/questions/${id}`, input);
  return data;
}
export async function deleteQuestion(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/questions/${id}`);
}
export async function duplicateQuestion(id: string): Promise<AdminQuestion> {
  const { data } = await apiClient.post(`${BASE}/questions/${id}/duplicate`);
  return data;
}
export async function reorderQuestions(quizId: string, orderedQuestionIds: string[]): Promise<void> {
  await apiClient.put(`${BASE}/questions/reorder`, { quizId, orderedQuestionIds });
}

// --- results ---
export async function listResults(
  quizId: string,
  params?: { search?: string; sortBy?: string; sortDir?: string }
): Promise<ResultRow[]> {
  const { data } = await apiClient.get(`${BASE}/results`, { params: { quizId, ...params } });
  return data.results;
}
export async function getResultDetail(attemptId: string): Promise<ResultDetail> {
  const { data } = await apiClient.get(`${BASE}/results/${attemptId}`);
  return data;
}
export function exportResultsCsvUrl(quizId: string): string {
  const base = apiClient.defaults.baseURL || "";
  return `${base}${BASE}/export?quizId=${quizId}`;
}

// --- leaderboard ---
export async function getLeaderboard(quizId: string): Promise<LeaderboardResponse> {
  const { data } = await apiClient.get(`${BASE}/leaderboard`, { params: { quizId } });
  return data;
}
export async function refreshLeaderboard(quizId: string): Promise<LeaderboardResponse> {
  const { data } = await apiClient.post(`${BASE}/leaderboard/refresh`, { quizId });
  return data;
}

// --- google sheets ---
export async function getSheetsStatus(
  quizId: string
): Promise<{ configured: boolean; lastSyncedAt: string | null; lastSyncedCount: number | null }> {
  const { data } = await apiClient.get(`${BASE}/sheets/status`, { params: { quizId } });
  return data;
}
export async function syncGoogleSheets(
  quizId: string
): Promise<{ message: string; lastSyncedAt: string; lastSyncedCount: number }> {
  const { data } = await apiClient.post(`${BASE}/sync-sheets`, { quizId });
  return data;
}
