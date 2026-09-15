import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-faint">
          National-Level Technical Quiz
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-ink sm:text-5xl">ByteBattle</h1>
        <p className="mt-4 max-w-md text-base text-subtle">
          30 questions on AI, machine learning, and modern ML systems. No sign-up —
          just your name and 30 minutes on the clock.
        </p>
        <Button className="mt-8" onClick={() => navigate("/start")}>
          Start Quiz
        </Button>
      </main>
      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-5 text-center text-xs text-faint">
      Designed &amp; Developed by Ahsan Mohamed
    </footer>
  );
}
