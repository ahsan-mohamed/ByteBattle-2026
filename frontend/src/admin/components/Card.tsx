import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-white p-6 ${className}`}>{children}</div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-subtle">{label}</p>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-ink">{value}</p>
    </Card>
  );
}

export function NoQuizSelected() {
  return (
    <Card className="text-center text-subtle">
      No quiz found yet. Create one by seeding the database, then refresh.
    </Card>
  );
}
