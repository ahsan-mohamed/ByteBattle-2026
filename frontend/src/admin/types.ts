export type QuizStatus = "DRAFT" | "PUBLISHED" | "ACTIVE" | "ENDED";
export type Difficulty = "MEDIUM" | "HARD";
export type AnswerOption = "A" | "B" | "C" | "D";

export type Quiz = {
  id: string;
  name: string;
  status: QuizStatus;
  durationMinutes: number;
  maxViolations: number;
  requiredTotal: number;
  requiredMedium: number;
  requiredHard: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastSheetsSyncAt: string | null;
  lastSheetsSyncCount: number | null;
};

export type AdminQuestion = {
  id: string;
  quizId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  difficulty: Difficulty;
  category: string;
  displayOrder: number;
};

export type QuestionStats = { total: number; mediumCount: number; hardCount: number };

export type Readiness = {
  ready: boolean;
  problems: string[];
  total: number;
  mediumCount: number;
  hardCount: number;
};

export type DashboardStats = {
  quizStatus: QuizStatus;
  totalParticipants: number;
  completedAttempts: number;
  activeAttempts: number;
  averageScore: number;
  highestScore: number;
  averageTimeSeconds: number;
};

export type ResultRow = {
  attemptId: string;
  name: string;
  uniqueId: string;
  status: string;
  correctAnswers: number | null;
  wrongAnswers: number | null;
  unanswered: number | null;
  score: number | null;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
  violationCount: number;
};

export type ResultDetail = {
  name: string;
  uniqueId: string;
  correctAnswers: number | null;
  wrongAnswers: number | null;
  unanswered: number | null;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
  status: string;
  violationBreakdown: Record<string, number>;
  totalViolations: number;
};

export type LeaderboardRow = {
  rank: number;
  serialNumber: number;
  name: string;
  uniqueId: string;
  correctAnswers: number;
  wrongAnswers: number;
  timeTaken: string;
};

export type LeaderboardResponse = {
  rows: LeaderboardRow[];
  lastRefreshedAt: string | null;
  lastRefreshedBy: string | null;
};
