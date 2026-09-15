import { Question, AnswerOption } from "../../types/quiz";

export function NavigationGrid({
  questions,
  currentIndex,
  answers,
  onJump,
}: {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, AnswerOption | null>;
  onJump: (index: number) => void;
}) {
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink">Questions</h2>
        <span className="font-mono text-xs text-subtle">
          {answeredCount}/{questions.length} answered
        </span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isAnswered = Boolean(answers[q.id]);
          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              aria-current={isCurrent ? "true" : undefined}
              aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}`}
              className={[
                "focus-ring flex h-9 w-9 items-center justify-center rounded-md font-mono text-sm transition-colors duration-150",
                isCurrent
                  ? "bg-accent text-white"
                  : isAnswered
                  ? "bg-accent-light text-accent-dark"
                  : "bg-surface text-subtle hover:bg-line",
              ].join(" ")}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-col gap-1.5 text-xs text-subtle">
        <LegendRow swatchClass="bg-accent" label="Current" />
        <LegendRow swatchClass="bg-accent-light" label="Answered" />
        <LegendRow swatchClass="bg-surface border border-line" label="Unanswered" />
      </div>
    </div>
  );
}

function LegendRow({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded ${swatchClass}`} />
      {label}
    </div>
  );
}
