import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Question, AnswerOption } from "../types/quiz";
import { fetchQuizQuestions, saveProgress, submitQuiz } from "../api/participant";
import { getApiErrorMessage } from "../api/client";
import { readSession, writeSession } from "../hooks/useParticipantSession";
import { useServerSyncedTimer } from "../hooks/useTimer";
import { useAntiCheat } from "../hooks/useAntiCheat";
import { Timer } from "../components/quiz/Timer";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { NavigationGrid } from "../components/quiz/NavigationGrid";
import { SubmitConfirmModal } from "../components/quiz/SubmitConfirmModal";
import { ViolationWarning } from "../components/quiz/ViolationWarning";
import { Button } from "../components/ui/Button";

const FALLBACK_MAX_VIOLATIONS = 3;

export function QuizPage() {
  const navigate = useNavigate();
  const attemptToken = readSession().attemptToken ?? null;

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerOption | null>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Redirect immediately if there's no active attempt to resume - this page
  // is meaningless without one (e.g. direct URL visit, or after submission).
  useEffect(() => {
    if (!attemptToken) navigate("/start", { replace: true });
  }, [attemptToken, navigate]);

  useEffect(() => {
    if (!attemptToken) return;
    fetchQuizQuestions(attemptToken)
      .then((res) => {
        setQuestions(res.questions);
        setAnswers(res.savedAnswers);
      })
      .catch((err) => setLoadError(getApiErrorMessage(err)));
  }, [attemptToken]);

  const doSubmit = useCallback(async () => {
    if (!attemptToken || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await submitQuiz(attemptToken);
      writeSession({ attemptToken: undefined });
      navigate("/submitted", { state: { uniqueId: res.uniqueId }, replace: true });
    } catch (err) {
      setLoadError(getApiErrorMessage(err));
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [attemptToken, navigate]);

  const remainingSeconds = useServerSyncedTimer(attemptToken, doSubmit);
  const antiCheat = useAntiCheat(attemptToken, Boolean(questions) && !submittedRef.current);

  useEffect(() => {
    if (antiCheat.autoSubmitted) doSubmit();
  }, [antiCheat.autoSubmitted, doSubmit]);

  function handleSelect(option: AnswerOption) {
    if (!questions || !attemptToken) return;
    const question = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
    saveProgress(attemptToken, question.id, option).catch(() => {
      // Retry silently on the next save-triggering action; the answer stays
      // in local state either way so nothing visible is lost.
    });
  }

  if (loadError && !questions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
        <p className="text-sm text-subtle">{loadError}</p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-sm text-subtle">Loading questions…</p>
      </div>
    );
  }

  const question = questions[currentIndex];
  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const maxViolations = readSession().maxViolations ?? FALLBACK_MAX_VIOLATIONS;

  return (
    <div className="quiz-lockdown flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <span className="font-mono text-sm font-medium text-ink">ByteBattle</span>
        <Timer remainingSeconds={remainingSeconds} />
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[1fr_260px]">
        <div>
          <QuestionCard
            question={question}
            index={currentIndex}
            total={questions.length}
            selected={answers[question.id] ?? null}
            onSelect={handleSelect}
          />

          <div className="mt-10 flex items-center justify-between">
            <Button
              variant="secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              Previous
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
                Next
              </Button>
            ) : (
              <Button onClick={() => setConfirmOpen(true)}>Submit Quiz</Button>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <NavigationGrid
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onJump={setCurrentIndex}
          />
          <Button variant="secondary" className="mt-4 w-full" onClick={() => setConfirmOpen(true)}>
            Submit Quiz
          </Button>
        </div>
      </main>

      <SubmitConfirmModal
        open={confirmOpen}
        answeredCount={answeredCount}
        totalCount={questions.length}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
      />

      {antiCheat.lastWarning && !antiCheat.autoSubmitted && (
        <ViolationWarning
          message={antiCheat.lastWarning}
          violationCount={antiCheat.violationCount}
          maxViolations={maxViolations}
        />
      )}
    </div>
  );
}
