import { useEffect, useRef, useState } from "react";
import { fetchQuizStatus } from "../api/participant";

/**
 * Ticks down locally every second for a smooth display, but re-syncs against
 * the server's /quiz/status every 20s so clock drift or a suspended background
 * tab can't let the participant believe they have more time than they do.
 * onExpire fires once, the moment remaining time hits zero.
 */
export function useServerSyncedTimer(attemptToken: string | null, onExpire: () => void) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!attemptToken) return;
    let cancelled = false;

    async function sync() {
      try {
        const status = await fetchQuizStatus(attemptToken!);
        if (cancelled) return;
        setRemainingSeconds(status.remainingSeconds);
        if (status.remainingSeconds <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpire();
        }
      } catch {
        // A transient network blip shouldn't crash the timer - just skip this sync.
      }
    }

    sync();
    const syncInterval = setInterval(sync, 20_000);
    const tickInterval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        const next = Math.max(0, prev - 1);
        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpire();
        }
        return next;
      });
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(syncInterval);
      clearInterval(tickInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptToken]);

  return remainingSeconds;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
