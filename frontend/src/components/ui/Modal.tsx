import { ReactNode } from "react";

export function Modal({
  open,
  children,
  labelledBy,
}: {
  open: boolean;
  children: ReactNode;
  labelledBy: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-lg"
      >
        {children}
      </div>
    </div>
  );
}
