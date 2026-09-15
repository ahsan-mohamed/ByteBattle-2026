import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...rest }, ref) => (
    <div>
      <input
        ref={ref}
        className={`focus-ring w-full rounded-md border px-4 py-3 text-base text-ink placeholder:text-faint ${
          error ? "border-danger" : "border-line"
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
