"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-rojo-ladrillo text-maiz shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-rojo-ladrillo-dark active:bg-[#5a1111] focus-visible:ring-2 focus-visible:ring-rojo-ladrillo focus-visible:ring-offset-2",
  secondary:
    "bg-elevated border border-maiz-3 text-cafe hover:bg-maiz-2 active:bg-maiz-3 focus-visible:ring-2 focus-visible:ring-rojo-ladrillo focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-cafe-2 hover:bg-maiz-2 hover:text-cafe active:bg-maiz-3 focus-visible:ring-2 focus-visible:ring-cafe focus-visible:ring-offset-2",
  danger:
    "bg-aji text-white hover:bg-[#b33322] active:bg-[#922919] focus-visible:ring-2 focus-visible:ring-aji focus-visible:ring-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs rounded-md",
  md: "px-4 py-2.5 text-sm rounded-md",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2 font-semibold font-body transition-all outline-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        ].join(" ")}
        {...props}
      >
        {loading && (
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
