const STORAGE_KEY = "bytebattle.session";

type StoredSession = {
  participantId?: string;
  name?: string;
  uniqueId?: string;
  attemptToken?: string;
  maxViolations?: number;
};

export function readSession(): StoredSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeSession(patch: Partial<StoredSession>): StoredSession {
  const next = { ...readSession(), ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
