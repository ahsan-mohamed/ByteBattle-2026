import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { AppError } from "../utils/errors";
import { formatDuration } from "./resultsController";
import { isSheetsConfigured, syncResultsToSheet, SheetSyncRow } from "../services/googleSheetsService";

const COMPLETED_STATUSES = ["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"] as const;

export async function getSheetsSyncStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = z.object({ quizId: z.string().uuid() }).parse(req.query);
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new AppError("Quiz not found.", 404);

    res.json({
      configured: isSheetsConfigured(),
      lastSyncedAt: quiz.lastSheetsSyncAt,
      lastSyncedCount: quiz.lastSheetsSyncCount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/sync-sheets
 * Only syncs completed attempts (never fires on every browser event, per spec
 * section 21). Ordering matches the leaderboard/CSV rules so "Serial Number"
 * in the sheet lines up with the organizer's other views.
 */
export async function syncGoogleSheets(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = z.object({ quizId: z.string().uuid() }).parse(req.body);

    if (!isSheetsConfigured()) {
      throw new AppError(
        "Google Sheets is not configured. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.",
        409
      );
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId, status: { in: [...COMPLETED_STATUSES] } },
      include: { participant: true, _count: { select: { violations: true } } },
      orderBy: [{ score: "desc" }, { timeTakenSeconds: "asc" }],
    });

    const rows: SheetSyncRow[] = attempts.map((a: {
      participant: { name: string; uniqueId: string };
      correctAnswers: number | null;
      wrongAnswers: number | null;
      timeTakenSeconds: number | null;
      score: number | null;
      submittedAt: Date | null;
      _count: { violations: number };
    }) => ({
      name: a.participant.name,
      uniqueId: a.participant.uniqueId,
      correctAnswers: a.correctAnswers ?? 0,
      wrongAnswers: a.wrongAnswers ?? 0,
      timeTaken: formatDuration(a.timeTakenSeconds ?? 0),
      score: a.score ?? 0,
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : "",
      violationCount: a._count.violations,
    }));

    const syncedCount = await syncResultsToSheet(rows);

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: { lastSheetsSyncAt: new Date(), lastSheetsSyncCount: syncedCount },
    });

    res.json({
      message: `${syncedCount} results synchronized.`,
      lastSyncedAt: updated.lastSheetsSyncAt,
      lastSyncedCount: updated.lastSheetsSyncCount,
    });
  } catch (err) {
    next(err);
  }
}
