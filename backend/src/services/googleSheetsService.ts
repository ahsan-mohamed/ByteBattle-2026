import { google, sheets_v4 } from "googleapis";

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB_NAME || "Sheet1";

// Visible columns (A-F) are exactly the spec's required 6. Columns G-I are the
// optional "hidden/admin" extras (spec section 20) - useful for the organizer,
// not part of the contract the six required columns give downstream tools.
const HEADER_ROW = [
  "Serial Number",
  "Name",
  "Unique ID",
  "Correct Answers",
  "Wrong Answers",
  "Time Taken",
  "Score",
  "Submitted At",
  "Violation Count",
];

export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
  );
}

function getSheetsClient(): sheets_v4.Sheets {
  // Private keys in .env typically have literal "\n" sequences instead of real
  // newlines - convert them back or the JWT signature will fail.
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export type SheetSyncRow = {
  name: string;
  uniqueId: string;
  correctAnswers: number;
  wrongAnswers: number;
  timeTaken: string; // "MM:SS", already formatted
  score: number;
  submittedAt: string; // ISO string or ""
  violationCount: number;
};

/**
 * Syncs completed results into Google Sheets, deduping by Unique ID.
 *
 * Strategy: read the whole tab once, build a uniqueId -> row-number map from
 * the existing data, then split incoming rows into "update in place" (existing
 * uniqueId, same physical row - keeps the organizer's manual sort/filter in
 * Sheets intact) vs "append" (new participant, added at the bottom). Serial
 * Number reflects current rank for every row we touch, whether updated or
 * newly appended.
 */
export async function syncResultsToSheet(rows: SheetSyncRow[]): Promise<number> {
  if (!isSheetsConfigured()) {
    throw new Error("Google Sheets is not configured (missing env vars).");
  }
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!;
  const sheets = getSheetsClient();

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A:I`,
  });

  const existingRows = existing.data.values || [];
  const hasHeader = existingRows.length > 0 && existingRows[0][0] === "Serial Number";

  if (!hasHeader) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER_ROW] },
    });
  }

  // Map uniqueId (column C, index 2) -> 1-based sheet row number.
  const uniqueIdToRow = new Map<string, number>();
  const dataStartIndex = hasHeader ? 1 : 1; // header now guaranteed at row 1 either way
  for (let i = dataStartIndex; i < existingRows.length; i++) {
    const uniqueId = existingRows[i][2];
    if (uniqueId) uniqueIdToRow.set(uniqueId, i + 1); // +1 for 1-based row number
  }

  const updates: { range: string; values: (string | number)[][] }[] = [];
  const appends: (string | number)[][] = [];
  let nextAppendRow = existingRows.length + 1;

  // Serial Number reflects each row's rank position within the freshly-sorted
  // `rows` input (the caller sorts by score/time before calling this), not its
  // physical position in the sheet - so it stays meaningful even though
  // existing rows are updated in place rather than reordered.
  rows.forEach((row, index) => {
    const serialNumber = index + 1;
    const values = [
      row.name,
      row.uniqueId,
      row.correctAnswers,
      row.wrongAnswers,
      row.timeTaken,
      row.score,
      row.submittedAt,
      row.violationCount,
    ];

    const existingRowNumber = uniqueIdToRow.get(row.uniqueId);
    if (existingRowNumber) {
      updates.push({
        range: `${SHEET_TAB}!A${existingRowNumber}:I${existingRowNumber}`,
        values: [[serialNumber, ...values]],
      });
    } else {
      appends.push([serialNumber, ...values]);
      uniqueIdToRow.set(row.uniqueId, nextAppendRow);
      nextAppendRow++;
    }
  });

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: "RAW", data: updates },
    });
  }

  if (appends.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: appends },
    });
  }

  return rows.length;
}
