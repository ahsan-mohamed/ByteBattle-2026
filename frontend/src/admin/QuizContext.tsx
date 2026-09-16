import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
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

      setSelectedId((previousId) => {
        if (previousId && list.some((quiz) => quiz.id === previousId)) {
          return previousId;
        }

        const activeQuiz = list.find((quiz) => quiz.status === "ACTIVE");

        if (activeQuiz) {
          return activeQuiz.id;
        }

        // The backend returns quizzes newest-first.
        // If there is no ACTIVE quiz, select the newest one.
        return list.length > 0 ? list[0].id : null;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedQuiz =
    selectedId !== null
      ? quizzes.find((quiz) => quiz.id === selectedId) ?? null
      : null;

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        selectedQuiz,
        selectQuiz: setSelectedId,
        loading,
        refresh,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useAdminQuiz(): QuizContextState {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error("useAdminQuiz must be used within AdminQuizProvider");
  }

  return context;
}