export type AnswerOption = "A" | "B" | "C" | "D";

export type Question = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: "MEDIUM" | "HARD";
  category: string;
  displayOrder: number;
};

export type StartParticipantResponse = {
  participantId: string;
  name: string;
  uniqueId: string;
};

export type StartQuizResponse = {
  attemptToken: string;
  expiresAt: string;
  durationMinutes: number;
  maxViolations: number;
};

export type QuizQuestionsResponse = {
  questions: Question[];
  savedAnswers: Record<string, AnswerOption | null>;
  expiresAt: string;
};

export type QuizStatusResponse = {
  status: "IN_PROGRESS" | "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED";
  expiresAt: string;
  remainingSeconds: number;
  quizStatus: "DRAFT" | "PUBLISHED" | "ACTIVE" | "ENDED";
};

export type ViolationType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "COPY_ATTEMPT"
  | "PASTE_ATTEMPT"
  | "CUT_ATTEMPT"
  | "RIGHT_CLICK";
