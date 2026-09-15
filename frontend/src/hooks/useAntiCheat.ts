import { useEffect, useState } from "react";
import { reportViolation } from "../api/participant";
import { ViolationType } from "../types/quiz";

type AntiCheatState = {
  violationCount: number;
  lastWarning: string | null;
  autoSubmitted: boolean;
};

/**
 * Wires up the browser-level anti-cheat controls from spec section 11.
 * Tab-switch and window-blur are the two violation types that count toward
 * the configurable max (server-enforced - the backend is what actually
 * auto-submits; this hook just reports events and reflects the result).
 * Copy/paste/cut/right-click are blocked outright and logged for the record,
 * but don't count toward the violation limit on their own.
 */
export function useAntiCheat(attemptToken: string | null, active: boolean) {
  const [state, setState] = useState<AntiCheatState>({
    violationCount: 0,
    lastWarning: null,
    autoSubmitted: false,
  });

  useEffect(() => {
    if (!attemptToken || !active) return;

    async function report(type: ViolationType, warning: string, countsTowardLimit: boolean) {
      try {
        const result = await reportViolation(attemptToken!, type);
        if (countsTowardLimit) {
          setState({
            violationCount: result.violationCount,
            lastWarning: warning,
            autoSubmitted: result.autoSubmitted,
          });
        } else {
          setState((s) => ({ ...s, lastWarning: warning }));
        }
      } catch {
        // Best-effort logging - never block the participant's quiz on this failing.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        report("TAB_SWITCH", "Please stay on the quiz page.", true);
      }
    }
    function handleBlur() {
      report("WINDOW_BLUR", "Please stay on the quiz page.", true);
    }
    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
      report("RIGHT_CLICK", "Right-click is disabled during the quiz.", false);
    }
    function handleCopy(e: ClipboardEvent) {
      e.preventDefault();
      report("COPY_ATTEMPT", "Copying is disabled during the quiz.", false);
    }
    function handlePaste(e: ClipboardEvent) {
      e.preventDefault();
      report("PASTE_ATTEMPT", "Pasting is disabled during the quiz.", false);
    }
    function handleCut(e: ClipboardEvent) {
      e.preventDefault();
      report("CUT_ATTEMPT", "Cutting is disabled during the quiz.", false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      const blockedCombo =
        (e.ctrlKey || e.metaKey) && ["c", "v", "x", "u", "s", "p"].includes(key);
      if (blockedCombo || key === "f12") {
        e.preventDefault();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [attemptToken, active]);

  return state;
}
