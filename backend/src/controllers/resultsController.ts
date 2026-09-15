import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";
import { resultsQuerySchema } from "../utils/adminValidation";

const COMPLETED_STATUSES = ["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"] as const;

export async function listResults(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId, search, sortBy, sortDir, onlyCompleted } = resultsQuerySchema.parse(
      req.query
    );

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        ...(onlyCompleted ? { status: { in: [...COMPLETED_STATUSES] } } : {}),
        ...(search
          ? {
              participant: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { uniqueId: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        participant: true,
        _count: { select: { violations: true } },
      },
    });

    const sorted = [...attempts].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "timeTaken") {
        return ((a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity)) * dir;
      }
      if (sortBy === "submittedAt") {
        const aT = a.submittedAt?.getTime() ?? Infinity;
        const bT = b.submittedAt?.getTime() ?? Infinity;
        return (aT - bT) * dir;
      }
      // default: score
      return ((a.score ?? -1) - (b.score ?? -1)) * dir;
    });

    res.json({
      results: sorted.map((a) => ({
        attemptId: a.id,
        name: a.participant.name,
        uniqueId: a.participant.uniqueId,
        status: a.status,
        correctAnswers: a.correctAnswers,
        wrongAnswers: a.wrongAnswers,
        unanswered: a.unanswered,
        score: a.score,
        timeTakenSeconds: a.timeTakenSeconds,
        submittedAt: a.submittedAt,
        violationCount: a._count.violations,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getResultDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { attemptId } = z.object({ attemptId: z.string().uuid() }).parse(req.params);

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { participant: true, violations: true },
    });
    if (!attempt) throw new AppError("Attempt not found.", 404);

    const violationBreakdown: Record<string, number> = {};
    for (const v of attempt.violations) {
      violationBreakdown[v.type] = (violationBreakdown[v.type] ?? 0) + 1;
    }

    res.json({
      name: attempt.participant.name,
      uniqueId: attempt.participant.uniqueId,
      correctAnswers: attempt.correctAnswers,
      wrongAnswers: attempt.wrongAnswers,
      unanswered: attempt.unanswered,
      timeTakenSeconds: attempt.timeTakenSeconds,
      submittedAt: attempt.submittedAt,
      status: attempt.status,
      violationBreakdown,
      totalViolations: attempt.violations.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportResultsCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = z.object({ quizId: z.string().uuid() }).parse(req.query);

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, status: { in: [...COMPLETED_STATUSES] } },
      include: { participant: true },
      orderBy: [{ score: "desc" }, { timeTakenSeconds: "asc" }],
    });

    const header = "Serial Number,Name,Unique ID,Correct Answers,Wrong Answers,Time Taken\n";
    const rows = attempts.map((a: {
      timeTakenSeconds: number | null;
      participant: { name: string; uniqueId: string };
      correctAnswers: number | null;
      wrongAnswers: number | null;
    }, i: number) => {
      const timeTaken = formatDuration(a.timeTakenSeconds ?? 0);
      const escapedName = `"${a.participant.name.replace(/"/g, '""')}"`;
      return `${i + 1},${escapedName},${a.participant.uniqueId},${a.correctAnswers ?? 0},${a.wrongAnswers ?? 0},${timeTaken}`;
    });

    const csv = header + rows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="bytebattle-results.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
