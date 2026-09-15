import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { AdminQuestion, AnswerOption, Difficulty } from "../types";
import { QuestionInput } from "../api";

const OPTION_KEYS: AnswerOption[] = ["A", "B", "C", "D"];

export function QuestionEditorModal({
  open,
  initial,
  onCancel,
  onSave,
}: {
  open: boolean;
  initial: AdminQuestion | null;
  onCancel: () => void;
  onSave: (input: QuestionInput) => Promise<void>;
}) {
  const [form, setForm] = useState<QuestionInput>(() => ({
    questionText: initial?.questionText ?? "",
    optionA: initial?.optionA ?? "",
    optionB: initial?.optionB ?? "",
    optionC: initial?.optionC ?? "",
    optionD: initial?.optionD ?? "",
    correctAnswer: initial?.correctAnswer ?? "A",
    difficulty: initial?.difficulty ?? "MEDIUM",
    category: initial?.category ?? "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSave() {
    setError(null);
    if (!form.questionText.trim() || !form.category.trim()) {
      setError("Question text and category are required.");
      return;
    }
    if (OPTION_KEYS.some((k) => !form[`option${k}` as keyof QuestionInput])) {
      setError("All four options are required.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} labelledBy="question-editor-heading">
      <h2 id="question-editor-heading" className="text-lg font-semibold text-ink">
        {initial ? "Edit question" : "Add question"}
      </h2>

      <div className="mt-5 flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
        <Field label="Question">
          <textarea
            className="focus-ring w-full rounded-md border border-line px-4 py-3 text-sm"
            rows={3}
            value={form.questionText}
            onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
          />
        </Field>

        {OPTION_KEYS.map((key) => (
          <Field label={`Option ${key}`} key={key}>
            <Input
              value={form[`option${key}` as keyof QuestionInput] as string}
              onChange={(e) =>
                setForm((f) => ({ ...f, [`option${key}`]: e.target.value }))
              }
            />
          </Field>
        ))}

        <div className="grid grid-cols-3 gap-3">
          <Field label="Correct Answer">
            <select
              className="focus-ring w-full rounded-md border border-line px-3 py-2.5 text-sm"
              value={form.correctAnswer}
              onChange={(e) =>
                setForm((f) => ({ ...f, correctAnswer: e.target.value as AnswerOption }))
              }
            >
              {OPTION_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              className="focus-ring w-full rounded-md border border-line px-3 py-2.5 text-sm"
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))
              }
            >
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving}>
          Save Question
        </Button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}
