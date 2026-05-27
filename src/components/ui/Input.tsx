import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-cafe font-body"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "w-full px-3 py-2 text-sm font-body text-cafe bg-white border rounded-md outline-none transition-colors",
            "placeholder:text-cafe/40",
            error
              ? "border-aji focus:ring-2 focus:ring-aji/30"
              : "border-cafe/20 focus:border-rojo-ladrillo focus:ring-2 focus:ring-rojo-ladrillo/20",
            className,
          ].join(" ")}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-cafe/50 font-body">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-aji font-body" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
