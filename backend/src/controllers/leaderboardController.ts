import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { formatDuration } from "./resultsController";

const COMPLETED_STATUSES = ["SUBMITTED", "AUTO_SUBMITTED", "EXPIRED"] as const;

type LeaderboardRow = {
  rank: number;
  serialNumber: number;
  name: string;
  uniqueId: string;
  correctAnswers: number;
  wrongAnswers: number;
  timeTaken: string;
};

async function computeLeaderboard(quizId: string): Promise<LeaderboardRow[]> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, status: { in: [...COMPLETED_STATUSES] } },
    include: { participant: true },
  });

  // Ranking per spec section 17:
  // 1. Higher correct answers first
  // 2. Tie -> lower time taken first
  // 3. Still tied -> earlier submission time first
  const sorted = [...attempts].sort((a, b) => {
    const correctDiff = (b.correctAnswers ?? 0) - (a.correctAnswers ?? 0);
    if (correctDiff !== 0) return correctDiff;

    const timeDiff = (a.timeTakenSeconds ?? Infinity) - (b.timeTakenSeconds ?? Infinity);
    if (timeDiff !== 0) return timeDiff;

    const aT = a.submittedAt?.getTime() ?? Infinity;
    const bT = b.submittedAt?.getTime() ?? Infinity;
    return aT - bT;
  });

  return sorted.map((a, i) => ({
    rank: i + 1,
    serialNumber: i + 1,
    name: a.participant.name,
    uniqueId: a.participant.uniqueId,
    correctAnswers: a.correctAnswers ?? 0,
    wrongAnswers: a.wrongAnswers ?? 0,
    timeTaken: formatDuration(a.timeTakenSeconds ?? 0),
  }));
}

/**
 * GET /api/admin/leaderboard
 * Returns the most recent stored snapshot, NOT a live recalculation - the
 * organizer must explicitly click refresh (spec section 18: no auto-refresh).
 * If no snapshot exists yet, computes one on the fly without persisting it,
 * so a first-time visit to the page isn't just an empty table.
 */
export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = z.object({ quizId: z.string().uuid() }).parse(req.query);

    const latestSnapshot = await prisma.leaderboardSnapshot.findFirst({
      where: { quizId },
      orderBy: { refreshedAt: "desc" },
      include: { refreshedBy: true },
    });

    if (latestSnapshot) {
      return res.json({
        rows: JSON.parse(latestSnapshot.data) as LeaderboardRow[],
        lastRefreshedAt: latestSnapshot.refreshedAt,
        lastRefreshedBy: latestSnapshot.refreshedBy.username,
      });
    }

    const rows = await computeLeaderboard(quizId);
    res.json({ rows, lastRefreshedAt: null, lastRefreshedBy: null });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/leaderboard/refresh
 * The only way the leaderboard's stored snapshot changes. Recomputes from
 * current PostgreSQL data and records who refreshed it and when, for the
 * audit trail in spec section 19.
 */
export async function refreshLeaderboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = z.object({ quizId: z.string().uuid() }).parse(req.body);
    const adminId = req.session.adminId!;

    const rows = await computeLeaderboard(quizId);

    const snapshot = await prisma.leaderboardSnapshot.create({
      data: {
        quizId,
        refreshedById: adminId,
        data: JSON.stringify(rows),
      },
      include: { refreshedBy: true },
    });

    res.json({
      rows,
      lastRefreshedAt: snapshot.refreshedAt,
      lastRefreshedBy: snapshot.refreshedBy.username,
    });
  } catch (err) {
    next(err);
  }
}
