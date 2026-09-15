import { apiClient } from "./client";
import {
  StartParticipantResponse,
  StartQuizResponse,
  QuizQuestionsResponse,
  QuizStatusResponse,
  AnswerOption,
  ViolationType,
} from "../types/quiz";

export async function startParticipant(name: string): Promise<StartParticipantResponse> {
  const { data } = await apiClient.post("/participants/start", { name });
  return data;
}

export async function startQuiz(participantId: string): Promise<StartQuizResponse> {
  const { data } = await apiClient.post("/quiz/start", { participantId });
  return data;
}

export async function fetchQuizQuestions(attemptToken: string): Promise<QuizQuestionsResponse> {
  const { data } = await apiClient.get("/quiz/questions", { params: { attemptToken } });
  return data;
}

export async function fetchQuizStatus(attemptToken: string): Promise<QuizStatusResponse> {
  const { data } = await apiClient.get("/quiz/status", { params: { attemptToken } });
  return data;
}

export async function saveProgress(
  attemptToken: string,
  questionId: string,
  selectedAnswer: AnswerOption | null
): Promise<void> {
  await apiClient.post("/quiz/save-progress", { attemptToken, questionId, selectedAnswer });
}

export async function submitQuiz(
  attemptToken: string
): Promise<{ message: string; uniqueId: string }> {
  const { data } = await apiClient.post("/quiz/submit", { attemptToken });
  return data;
}

export async function reportViolation(
  attemptToken: string,
  type: ViolationType,
  metadata?: string
): Promise<{ violationCount: number; autoSubmitted: boolean }> {
  const { data } = await apiClient.post("/quiz/violation", { attemptToken, type, metadata });
  return data;
}
