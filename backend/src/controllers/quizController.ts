import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";
import { quizSettingsSchema } from "../utils/adminValidation";

export async function getQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError("Quiz not found.", 404);

    const [total, mediumCount, hardCount] = await Promise.all([
      prisma.question.count({ where: { quizId: id } }),
      prisma.question.count({ where: { quizId: id, difficulty: "MEDIUM" } }),
      prisma.question.count({ where: { quizId: id, difficulty: "HARD" } }),
    ]);

    res.json({ quiz, questionStats: { total, mediumCount, hardCount } });
  } catch (err) {
    next(err);
  }
}

export async function listQuizzes(_req: Request, res: Response, next: NextFunction) {
  try {
    const quizzes = await prisma.quiz.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
}

export async function updateQuizSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = quizSettingsSchema.parse(req.body);

    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError("Quiz not found.", 404);
    if (quiz.status === "ACTIVE" || quiz.status === "ENDED") {
      throw new AppError("Cannot change settings once the competition has started.", 409);
    }

    const updated = await prisma.quiz.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * Checks the readiness rules from spec section 25: exact required counts of
 * Medium/Hard questions, every question fully filled in. Used before publish
 * and before activating.
 */
async function checkReadiness(quizId: string) {
  const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: quizId } });
  const questions = await prisma.question.findMany({ where: { quizId } });

  const total = questions.length;
  const mediumCount = questions.filter((q: { difficulty: string }) => q.difficulty === "MEDIUM").length;
  const hardCount = questions.filter((q: { difficulty: string }) => q.difficulty === "HARD").length;

  const problems: string[] = [];
  if (total !== quiz.requiredTotal) {
    problems.push(`Quiz must contain exactly ${quiz.requiredTotal} questions (currently ${total}).`);
  }
  if (mediumCount !== quiz.requiredMedium || hardCount !== quiz.requiredHard) {
    problems.push(
      `Quiz must contain exactly ${quiz.requiredMedium} Medium and ${quiz.requiredHard} Hard questions (currently ${mediumCount} Medium, ${hardCount} Hard).`
    );
  }
  for (const q of questions) {
    const opts = [q.optionA, q.optionB, q.optionC, q.optionD];
    if (opts.some((o) => !o.trim())) {
      problems.push(`Question "${q.questionText.slice(0, 40)}..." is missing an option.`);
    }
  }

  return { ready: problems.length === 0, problems, total, mediumCount, hardCount };
}

export async function getQuizReadiness(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const readiness = await checkReadiness(id);
    res.json(readiness);
  } catch (err) {
    next(err);
  }
}

export async function publishQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError("Quiz not found.", 404);
    if (quiz.status !== "DRAFT") throw new AppError("Only a DRAFT quiz can be published.", 409);

    const readiness = await checkReadiness(id);
    if (!readiness.ready) {
      throw new AppError(`Quiz is not ready to publish: ${readiness.problems.join(" ")}`, 422);
    }

    const updated = await prisma.quiz.update({ where: { id }, data: { status: "PUBLISHED" } });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function startCompetition(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError("Quiz not found.", 404);
    if (quiz.status !== "PUBLISHED") {
      throw new AppError("Only a PUBLISHED quiz can be started.", 409);
    }

    // Only one quiz should be ACTIVE at a time - the participant flow picks it
    // up by status alone, with no quiz ID passed from the frontend.
    const alreadyActive = await prisma.quiz.findFirst({ where: { status: "ACTIVE" } });
    if (alreadyActive && alreadyActive.id !== id) {
      throw new AppError(`Quiz "${alreadyActive.name}" is already active. End it first.`, 409);
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: { status: "ACTIVE", startedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function endCompetition(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const quiz = await prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new AppError("Quiz not found.", 404);
    if (quiz.status !== "ACTIVE") throw new AppError("Only an ACTIVE quiz can be ended.", 409);

    const updated = await prisma.quiz.update({
      where: { id },
      data: { status: "ENDED", endedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function duplicateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const newName = z.string().trim().min(1).max(120).parse(req.body.name);

    const source = await prisma.quiz.findUnique({ where: { id } });
    if (!source) throw new AppError("Quiz not found.", 404);
    const questions = await prisma.question.findMany({ where: { quizId: id } });

    const newQuiz = await prisma.$transaction(async (tx: typeof prisma) => {
      const created = await tx.quiz.create({
        data: {
          name: newName,
          status: "DRAFT",
          durationMinutes: source.durationMinutes,
          maxViolations: source.maxViolations,
          requiredTotal: source.requiredTotal,
          requiredMedium: source.requiredMedium,
          requiredHard: source.requiredHard,
        },
      });

      if (questions.length > 0) {
        await tx.question.createMany({
          data: questions.map((q: {
            questionText: string;
            optionA: string;
            optionB: string;
            optionC: string;
            optionD: string;
            correctAnswer: string;
            difficulty: string;
            category: string;
            displayOrder: number;
          }) => ({
            quizId: created.id,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            category: q.category,
            displayOrder: q.displayOrder,
          })),
        });
      }
      return created;
    });

    res.status(201).json(newQuiz);
  } catch (err) {
    next(err);
  }
}
