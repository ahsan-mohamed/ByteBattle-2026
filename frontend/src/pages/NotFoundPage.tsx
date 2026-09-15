import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-sm text-faint">404</p>
      <h1 className="text-xl font-semibold text-ink">Page not found.</h1>
      <p className="text-sm text-subtle">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/">
        <Button variant="secondary" className="mt-2">
          Back to ByteBattle
        </Button>
      </Link>
    </div>
  );
}
