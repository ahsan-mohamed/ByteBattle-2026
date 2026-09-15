import { Clock } from "lucide-react";
import { formatTime } from "../../hooks/useTimer";

export function Timer({ remainingSeconds }: { remainingSeconds: number | null }) {
  if (remainingSeconds === null) {
    return <div className="font-mono text-sm text-faint">--:--</div>;
  }
  const isCritical = remainingSeconds <= 120;
  return (
    <div
      className={`flex items-center gap-2 font-mono text-lg font-medium tabular-nums ${
        isCritical ? "text-danger" : "text-ink"
      }`}
      role="timer"
      aria-live="polite"
    >
      <Clock className="h-4 w-4" />
      {formatTime(remainingSeconds)}
    </div>
  );
}
