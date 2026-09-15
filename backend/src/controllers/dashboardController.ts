import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = z.object({ quizId: z.string().uuid() }).parse(req.query);
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new AppError("Quiz not found.", 404);

    const [totalParticipants, completed, active, aggregates] = await Promise.all([
      prisma.quizAttempt.count({ where: { quizId } }),
      prisma.quizAttempt.count({
        where: { quizId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"] } },
      }),
      prisma.quizAttempt.count({ where: { quizId, status: "IN_PROGRESS" } }),
      prisma.quizAttempt.aggregate({
        where: { quizId, score: { not: null } },
        _avg: { score: true, timeTakenSeconds: true },
        _max: { score: true },
      }),
    ]);

    res.json({
      quizStatus: quiz.status,
      totalParticipants,
      completedAttempts: completed,
      activeAttempts: active,
      averageScore: aggregates._avg.score ?? 0,
      highestScore: aggregates._max.score ?? 0,
      averageTimeSeconds: Math.round(aggregates._avg.timeTakenSeconds ?? 0),
    });
  } catch (err) {
    next(err);
  }
}
