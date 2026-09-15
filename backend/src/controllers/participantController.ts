import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { generateUniqueParticipantId } from "../utils/uniqueId";
import { Errors } from "../utils/errors";
import {
  startParticipantSchema,
  startQuizSchema,
  attemptTokenSchema,
  saveProgressSchema,
  submitQuizSchema,
  violationSchema,
} from "../utils/validation";

/**
 * POST /api/participants/start
 *
 * Registers a name and returns a backend-generated unique ID.
 * No password, no email, no account - just a name -> ID mapping.
 */
export async function startParticipant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name } = startParticipantSchema.parse(req.body);

    // Retry loop guards against the astronomically unlikely case of a sequence
    // collision. The DB unique constraint is the real backstop.
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const uniqueId = await generateUniqueParticipantId();

        const participant = await prisma.participant.create({
          data: {
            name,
            uniqueId,
          },
        });

        return res.status(201).json({
          participantId: participant.id,
          name: participant.name,
          uniqueId: participant.uniqueId,
        });
      } catch (err: any) {
        lastError = err;

        if (err.code === "P2002") {
          continue;
        }

        throw err;
      }
    }

    throw lastError;
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quiz/start
 *
 * Starts (or resumes) the single attempt a participant is allowed for the
 * currently ACTIVE quiz.
 *
 * Server sets startedAt/expiresAt - frontend never dictates the timer.
 */
export async function startQuiz(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { participantId } = startQuizSchema.parse(req.body);

    const quiz = await prisma.quiz.findFirst({
      where: {
        status: "ACTIVE",
      },
    });

    if (!quiz) {
      throw Errors.quizNotActive();
    }

    // One attempt per participant per quiz.
    // Also enforced by @@unique([quizId, participantId]).
    let attempt = await prisma.quizAttempt.findUnique({
      where: {
        quizId_participantId: {
          quizId: quiz.id,
          participantId,
        },
      },
    });

    if (attempt) {
      if (attempt.status !== "IN_PROGRESS") {
        throw Errors.alreadySubmitted();
      }

      if (attempt.expiresAt < new Date()) {
        throw Errors.sessionExpired();
      }
    } else {
      const startedAt = new Date();

      const expiresAt = new Date(
        startedAt.getTime() + quiz.durationMinutes * 60_000
      );

      attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          participantId,
          startedAt,
          expiresAt,
        },
      });
    }

    res.status(200).json({
      attemptToken: attempt.attemptToken,
      expiresAt: attempt.expiresAt,
      durationMinutes: quiz.durationMinutes,
      maxViolations: quiz.maxViolations,
    });
  } catch (err) {
    next(err);
  }
}

async function getLiveAttempt(attemptToken: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: {
      attemptToken,
    },
    include: {
      quiz: true,
    },
  });

  if (!attempt) {
    throw Errors.invalidAttempt();
  }

  return attempt;
}

/**
 * GET /api/quiz/questions?attemptToken=...
 *
 * Returns question text + options only.
 * correctAnswer is NEVER selected here.
 *
 * Also returns participant's previously saved answers so a refresh
 * can restore progress without creating a new attempt.
 */
export async function getQuizQuestions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { attemptToken } = attemptTokenSchema.parse(req.query);

    const attempt = await getLiveAttempt(attemptToken);

    if (attempt.status !== "IN_PROGRESS") {
      throw Errors.alreadySubmitted();
    }

    if (attempt.expiresAt < new Date()) {
      throw Errors.sessionExpired();
    }

    const [questions, savedAnswers] = await Promise.all([
      prisma.question.findMany({
        where: {
          quizId: attempt.quizId,
        },
        orderBy: {
          displayOrder: "asc",
        },
        select: {
          id: true,
          questionText: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          difficulty: true,
          category: true,
          displayOrder: true,

          // correctAnswer intentionally omitted
        },
      }),

      prisma.answer.findMany({
        where: {
          attemptId: attempt.id,
        },
      }),
    ]);

    const savedByQuestion = Object.fromEntries(
      savedAnswers.map((a) => [
        a.questionId,
        a.selectedAnswer,
      ])
    );

    res.json({
      questions,
      savedAnswers: savedByQuestion,
      expiresAt: attempt.expiresAt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quiz/status?attemptToken=...
 *
 * Server-authoritative remaining time + attempt status.
 * Frontend timer should synchronize against this.
 */
export async function getQuizStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { attemptToken } = attemptTokenSchema.parse(req.query);

    const attempt = await getLiveAttempt(attemptToken);

    const now = new Date();

    const remainingMs = Math.max(
      0,
      attempt.expiresAt.getTime() - now.getTime()
    );

    res.json({
      status: attempt.status,
      expiresAt: attempt.expiresAt,
      remainingSeconds: Math.floor(remainingMs / 1000),
      quizStatus: attempt.quiz.status,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quiz/save-progress
 *
 * Upserts a single answer.
 * Idempotent - safe to call repeatedly.
 */
export async function saveProgress(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      attemptToken,
      questionId,
      selectedAnswer,
    } = saveProgressSchema.parse(req.body);

    const attempt = await getLiveAttempt(attemptToken);

    if (attempt.status !== "IN_PROGRESS") {
      throw Errors.alreadySubmitted();
    }

    if (attempt.expiresAt < new Date()) {
      throw Errors.sessionExpired();
    }

    await prisma.answer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId,
        },
      },

      update: {
        selectedAnswer: selectedAnswer ?? null,
      },

      create: {
        attemptId: attempt.id,
        questionId,
        selectedAnswer: selectedAnswer ?? null,
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Shared scoring logic used by both the manual submit endpoint and the
 * server-side auto-submit path.
 */
export async function scoreAndCloseAttempt(
  attemptId: string,
  status: "SUBMITTED" | "AUTO_SUBMITTED" | "EXPIRED"
) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.quizAttempt.findUniqueOrThrow({
      where: {
        id: attemptId,
      },
    });

    // Already closed - idempotent.
    if (attempt.status !== "IN_PROGRESS") {
      return attempt;
    }

    const [questions, answers] = await Promise.all([
      tx.question.findMany({
        where: {
          quizId: attempt.quizId,
        },
      }),

      tx.answer.findMany({
        where: {
          attemptId,
        },
      }),
    ]);

    const answerMap = Object.fromEntries(
      answers.map((a) => [
        a.questionId,
        a.selectedAnswer,
      ])
    );

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    for (const q of questions) {
      const given = answerMap[q.id];

      if (!given) {
        unanswered++;
      } else if (given === q.correctAnswer) {
        correct++;
      } else {
        wrong++;
      }
    }

    const submittedAt = new Date();

    const timeTakenSeconds = Math.floor(
      (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000
    );

    return tx.quizAttempt.update({
      where: {
        id: attemptId,
      },

      data: {
        correctAnswers: correct,
        wrongAnswers: wrong,
        unanswered,
        score: correct,
        timeTakenSeconds,
        submittedAt,
        status,
      },
    });
  });
}

/**
 * POST /api/quiz/submit
 *
 * Participant-triggered submission.
 *
 * Score is computed and stored, but never returned to the participant.
 */
export async function submitQuiz(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { attemptToken } = submitQuizSchema.parse(req.body);

    const attempt = await getLiveAttempt(attemptToken);

    if (attempt.status !== "IN_PROGRESS") {
      throw Errors.alreadySubmitted();
    }

    // Backend rejects submissions made after the allowed time.
    const status =
      attempt.expiresAt < new Date()
        ? "EXPIRED"
        : "SUBMITTED";

    await scoreAndCloseAttempt(
      attempt.id,
      status
    );

    const participant =
      await prisma.participant.findUniqueOrThrow({
        where: {
          id: attempt.participantId,
        },
      });

    res.json({
      message: "Quiz submitted successfully.",
      uniqueId: participant.uniqueId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quiz/violation
 *
 * Records a single anti-cheat violation event.
 *
 * If the quiz-configured maximum is reached,
 * auto-submit the attempt server-side.
 */
export async function recordViolation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const {
      attemptToken,
      type,
      metadata,
    } = violationSchema.parse(req.body);

    const attempt = await getLiveAttempt(attemptToken);

    if (attempt.status !== "IN_PROGRESS") {
      // Attempt already closed - silently accept.
      return res.status(204).send();
    }

    await prisma.violation.create({
      data: {
        attemptId: attempt.id,
        type,
        metadata,
      },
    });

    const countableTypes = [
      "TAB_SWITCH",
      "WINDOW_BLUR",
    ] as const;

    const violationCount =
      await prisma.violation.count({
        where: {
          attemptId: attempt.id,
          type: {
            in: [...countableTypes],
          },
        },
      });

    let autoSubmitted = false;

    if (
      violationCount >=
      attempt.quiz.maxViolations
    ) {
      await scoreAndCloseAttempt(
        attempt.id,
        "AUTO_SUBMITTED"
      );

      autoSubmitted = true;
    }

    res.json({
      violationCount,
      autoSubmitted,
    });
  } catch (err) {
    next(err);
  }
}