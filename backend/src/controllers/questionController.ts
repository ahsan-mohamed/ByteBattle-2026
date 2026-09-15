import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";
import {
  questionInputSchema,
  questionUpdateSchema,
  reorderSchema,
  questionQuerySchema,
} from "../utils/adminValidation";

/**
 * Questions are editable only while the quiz is DRAFT or PUBLISHED. Once a quiz
 * goes ACTIVE, every participant must see the exact same question set - so all
 * mutating endpoints below call this guard first (spec section 7 & 26).
 */
async function assertQuizEditable(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new AppError("Quiz not found.", 404);
  if (quiz.status === "ACTIVE" || quiz.status === "ENDED") {
    throw new AppError(
      "Questions are locked while the competition is active or has ended.",
      409
    );
  }
  return quiz;
}

export async function listQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId, search, difficulty, category } = questionQuerySchema.parse(req.query);

    const questions = await prisma.question.findMany({
      where: {
        quizId,
        ...(difficulty ? { difficulty } : {}),
        ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
        ...(search
          ? { questionText: { contains: search, mode: "insensitive" } }
          : {}),
      },
      orderBy: { displayOrder: "asc" },
    });

    const total = await prisma.question.count({ where: { quizId } });
    const mediumCount = await prisma.question.count({ where: { quizId, difficulty: "MEDIUM" } });
    const hardCount = await prisma.question.count({ where: { quizId, difficulty: "HARD" } });

    res.json({ questions, stats: { total, mediumCount, hardCount } });
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const quizId = z.string().uuid().parse(req.body.quizId);
    const data = questionInputSchema.parse(req.body);
    await assertQuizEditable(quizId);

    const maxOrder = await prisma.question.aggregate({
      where: { quizId },
      _max: { displayOrder: true },
    });
    const displayOrder = (maxOrder._max.displayOrder ?? 0) + 1;

    const question = await prisma.question.create({
      data: { ...data, quizId, displayOrder },
    });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = questionUpdateSchema.parse(req.body);

    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) throw new AppError("Question not found.", 404);
    await assertQuizEditable(existing.quizId);

    const question = await prisma.question.update({ where: { id }, data });
    res.json(question);
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) throw new AppError("Question not found.", 404);
    await assertQuizEditable(existing.quizId);

    await prisma.question.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function duplicateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) throw new AppError("Question not found.", 404);
    await assertQuizEditable(existing.quizId);

    const maxOrder = await prisma.question.aggregate({
      where: { quizId: existing.quizId },
      _max: { displayOrder: true },
    });

    const { id: _oldId, createdAt, updatedAt, ...rest } = existing;
    const copy = await prisma.question.create({
      data: { ...rest, displayOrder: (maxOrder._max.displayOrder ?? 0) + 1 },
    });
    res.status(201).json(copy);
  } catch (err) {
    next(err);
  }
}

export async function reorderQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId, orderedQuestionIds } = reorderSchema.parse(req.body);
    await assertQuizEditable(quizId);

    await prisma.$transaction(
      orderedQuestionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { displayOrder: index + 1 },
        })
      )
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

