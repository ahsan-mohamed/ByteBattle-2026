import { prisma } from "./prisma";

const SEQUENCE_NAME = "bb_participant_seq";

/**
 * Ensures the Postgres sequence backing participant IDs exists.
 * Safe to call repeatedly (IF NOT EXISTS) - call once at server boot.
 */
export async function ensureUniqueIdSequence(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `CREATE SEQUENCE IF NOT EXISTS ${SEQUENCE_NAME} START 1 INCREMENT 1;`
  );
}

/**
 * Generates a globally unique, human-readable participant ID like BB2026-0001.
 *
 * Uses a native Postgres sequence (nextval) rather than "SELECT COUNT(*) + 1" or
 * in-app counters, so it stays correct under concurrent requests (100+ simultaneous
 * participants) without needing an explicit row lock. Postgres sequences are
 * atomic and never hand out the same value twice, even across concurrent
 * transactions, and a gap on rollback is fine here (we only need uniqueness,
 * not perfectly contiguous numbers).
 *
 * The DB-level UNIQUE constraint on Participant.uniqueId is the final backstop:
 * if two requests somehow raced (they shouldn't, given nextval's atomicity), the
 * second insert would fail and the caller should retry.
 */
export async function generateUniqueParticipantId(): Promise<string> {
  const year = new Date().getFullYear();
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT nextval('${SEQUENCE_NAME}') as nextval;`
  )) as { nextval: bigint }[];
  const seq = rows[0].nextval;
  const padded = seq.toString().padStart(4, "0");
  return `BB${year}-${padded}`;
}
