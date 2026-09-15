import { z } from "zod";

export const startParticipantSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100, "Name is too long"),
});

export const startQuizSchema = z.object({
  participantId: z.string().uuid(),
});

export const attemptTokenSchema = z.object({
  attemptToken: z.string().uuid(),
});

export const saveProgressSchema = z.object({
  attemptToken: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedAnswer: z.enum(["A", "B", "C", "D"]).nullable(),
});

export const submitQuizSchema = z.object({
  attemptToken: z.string().uuid(),
});

export const violationSchema = z.object({
  attemptToken: z.string().uuid(),
  type: z.enum([
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "COPY_ATTEMPT",
    "PASTE_ATTEMPT",
    "CUT_ATTEMPT",
    "RIGHT_CLICK",
  ]),
  metadata: z.string().max(500).optional(),
});
