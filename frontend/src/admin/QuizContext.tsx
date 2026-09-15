import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { listQuizzes } from "./api";
import { Quiz } from "./types";

type QuizContextState = {
  quizzes: Quiz[];
  selectedQuiz: Quiz | null;
  selectQuiz: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
};

const QuizContext = createContext<QuizContextState | null>(null);

export function AdminQuizProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listQuizzes();
      setQuizzes(list);
      setSelectedId((prev) => {
        if (prev && list.some((q) => q.id === prev)) return prev;
        // Default to the ACTIVE quiz if there is one, else the most recent.
        const active = list.find((q) => q.status === "ACTIVE");
        return active?.id ?? list[0]?.id ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedQuiz = quizzes.find((q) => q.id === selectedId) ?? null;

  return (
    <QuizContext.Provider
      value={{ quizzes, selectedQuiz, selectQuiz: setSelectedId, loading, refresh }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useAdminQuiz(): QuizContextState {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useAdminQuiz must be used within AdminQuizProvider");
  return ctx;
}
