import { useCallback, useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Copy, Pencil, Trash2, Eye, Plus, Lock } from "lucide-react";
import { useAdminQuiz } from "../QuizContext";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  reorderQuestions,
  QuestionInput,
} from "../api";
import { AdminQuestion, Difficulty } from "../types";
import { Card, NoQuizSelected } from "../components/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { QuestionEditorModal } from "../components/QuestionEditorModal";
import { Modal } from "../../components/ui/Modal";

export function AdminQuestionsPage() {
  const { selectedQuiz, loading: quizLoading } = useAdminQuiz();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [stats, setStats] = useState({ total: 0, mediumCount: 0, hardCount: 0 });
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "">("");
  const [editorState, setEditorState] = useState<{ open: boolean; question: AdminQuestion | null }>({
    open: false,
    question: null,
  });
  const [previewQuestion, setPreviewQuestion] = useState<AdminQuestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const locked = selectedQuiz?.status === "ACTIVE" || selectedQuiz?.status === "ENDED";

  const load = useCallback(async () => {
    if (!selectedQuiz) return;
    const res = await listQuestions(selectedQuiz.id, {
      search: search || undefined,
      difficulty: difficultyFilter || undefined,
    });
    setQuestions(res.questions);
    setStats(res.stats);
  }, [selectedQuiz, search, difficultyFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(input: QuestionInput) {
    if (!selectedQuiz) return;
    if (editorState.question) {
      await updateQuestion(editorState.question.id, input);
    } else {
      await createQuestion(selectedQuiz.id, input);
    }
    setEditorState({ open: false, question: null });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question? This can't be undone.")) return;
    try {
      await deleteQuestion(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      await duplicateQuestion(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate.");
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length || !selectedQuiz) return;
    const reordered = [...questions];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setQuestions(reordered);
    try {
      await reorderQuestions(selectedQuiz.id, reordered.map((q) => q.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder.");
      await load();
    }
  }

  if (quizLoading) return null;
  if (!selectedQuiz) return <NoQuizSelected />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Questions</h1>
          <p className="mt-1 text-sm text-subtle">
            <span className="font-mono">{stats.total}</span> total ·{" "}
            <span className="font-mono">{stats.mediumCount}</span> Medium ·{" "}
            <span className="font-mono">{stats.hardCount}</span> Hard
          </p>
        </div>
        {locked ? (
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs text-subtle">
            <Lock className="h-3.5 w-3.5" /> Locked while {selectedQuiz.status.toLowerCase()}
          </span>
        ) : (
          <Button onClick={() => setEditorState({ open: true, question: null })}>
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | "")}
          className="focus-ring rounded-md border border-line px-3 py-2.5 text-sm text-ink"
        >
          <option value="">All difficulties</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-faint">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Difficulty</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={q.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-faint">{i + 1}</td>
                <td className="max-w-md truncate px-4 py-3 text-ink">{q.questionText}</td>
                <td className="px-4 py-3 text-subtle">{q.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      q.difficulty === "HARD"
                        ? "bg-danger-light text-danger"
                        : "bg-accent-light text-accent-dark"
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <IconButton label="Preview" onClick={() => setPreviewQuestion(q)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    {!locked && (
                      <>
                        <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Move down"
                          onClick={() => move(i, 1)}
                          disabled={i === questions.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Duplicate" onClick={() => handleDuplicate(q.id)}>
                          <Copy className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Edit"
                          onClick={() => setEditorState({ open: true, question: q })}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Delete" onClick={() => handleDelete(q.id)}>
                          <Trash2 className="h-4 w-4 text-danger" />
                        </IconButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {questions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-subtle">
                  No questions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <QuestionEditorModal
        open={editorState.open}
        initial={editorState.question}
        onCancel={() => setEditorState({ open: false, question: null })}
        onSave={handleSave}
      />

      {previewQuestion && (
        <Modal open labelledBy="preview-heading">
          <h2 id="preview-heading" className="text-lg font-semibold text-ink">
            Preview
          </h2>
          <p className="mt-4 text-base text-ink">{previewQuestion.questionText}</p>
          <div className="mt-4 flex flex-col gap-2">
            {(["A", "B", "C", "D"] as const).map((k) => (
              <div
                key={k}
                className={`rounded-md border px-3 py-2 text-sm ${
                  previewQuestion.correctAnswer === k
                    ? "border-success bg-success-light text-success"
                    : "border-line text-ink"
                }`}
              >
                {k}. {previewQuestion[`option${k}` as keyof AdminQuestion] as string}
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={() => setPreviewQuestion(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="focus-ring rounded-md p-1.5 text-subtle hover:bg-surface hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
