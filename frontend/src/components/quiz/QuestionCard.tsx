import { Question, AnswerOption } from "../../types/quiz";

const OPTION_KEYS: AnswerOption[] = ["A", "B", "C", "D"];

export function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
}: {
  question: Question;
  index: number;
  total: number;
  selected: AnswerOption | null;
  onSelect: (option: AnswerOption) => void;
}) {
  const optionText: Record<AnswerOption, string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };

  return (
    <div>
      <p className="font-mono text-sm text-subtle">
        Question {index + 1} of {total}
      </p>
      <h1 className="mt-2 text-xl font-medium leading-snug text-ink sm:text-2xl">
        {question.questionText}
      </h1>

      <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="Answer options">
        {OPTION_KEYS.map((key) => {
          const isSelected = selected === key;
          return (
            <button
              key={key}
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(key)}
              className={[
                "focus-ring flex items-start gap-3 rounded-md border px-4 py-3.5 text-left text-base transition-colors duration-150",
                isSelected
                  ? "border-accent bg-accent-light text-ink"
                  : "border-line bg-white text-ink hover:border-faint",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-6 w-6 flex-none items-center justify-center rounded-full font-mono text-xs font-medium",
                  isSelected ? "bg-accent text-white" : "bg-surface text-subtle",
                ].join(" ")}
              >
                {key}
              </span>
              <span>{optionText[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
