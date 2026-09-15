import { z } from "zod";

export const questionInputSchema = z.object({
  questionText: z.string().trim().min(5).max(1000),
  optionA: z.string().trim().min(1).max(300),
  optionB: z.string().trim().min(1).max(300),
  optionC: z.string().trim().min(1).max(300),
  optionD: z.string().trim().min(1).max(300),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  difficulty: z.enum(["MEDIUM", "HARD"]),
  category: z.string().trim().min(1).max(60),
});

export const questionUpdateSchema = questionInputSchema.partial();

export const reorderSchema = z.object({
  quizId: z.string().uuid(),
  orderedQuestionIds: z.array(z.string().uuid()).min(1),
});

export const questionQuerySchema = z.object({
  quizId: z.string().uuid(),
  search: z.string().optional(),
  difficulty: z.enum(["MEDIUM", "HARD"]).optional(),
  category: z.string().optional(),
});

export const quizSettingsSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  durationMinutes: z.number().int().min(1).max(600).optional(),
  maxViolations: z.number().int().min(1).max(20).optional(),
  requiredTotal: z.number().int().min(1).optional(),
  requiredMedium: z.number().int().min(0).optional(),
  requiredHard: z.number().int().min(0).optional(),
});

export const resultsQuerySchema = z.object({
  quizId: z.string().uuid(),
  search: z.string().optional(),
  sortBy: z.enum(["score", "timeTaken", "submittedAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  onlyCompleted: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v !== "false"),
});
