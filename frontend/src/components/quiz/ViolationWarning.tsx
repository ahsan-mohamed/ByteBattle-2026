import { AlertTriangle } from "lucide-react";

export function ViolationWarning({
  message,
  violationCount,
  maxViolations,
}: {
  message: string;
  violationCount: number;
  maxViolations: number;
}) {
  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-md border border-danger/30 bg-danger-light px-4 py-3 text-sm text-danger shadow-sm"
    >
      <AlertTriangle className="h-4 w-4 flex-none" />
      <span>
        {message}{" "}
        <span className="font-mono font-medium">
          ({violationCount}/{maxViolations})
        </span>
      </span>
    </div>
  );
}
