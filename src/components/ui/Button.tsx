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
    "bg-rojo-ladrillo text-maiz hover:bg-[#701515] active:bg-[#5a1111] focus-visible:ring-2 focus-visible:ring-rojo-ladrillo focus-visible:ring-offset-2",
  secondary:
    "bg-transparent border border-rojo-ladrillo text-rojo-ladrillo hover:bg-rojo-ladrillo hover:text-maiz active:bg-[#701515] focus-visible:ring-2 focus-visible:ring-rojo-ladrillo focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-cafe hover:bg-cafe/10 active:bg-cafe/20 focus-visible:ring-2 focus-visible:ring-cafe focus-visible:ring-offset-2",
  danger:
    "bg-aji text-white hover:bg-[#b33322] active:bg-[#922919] focus-visible:ring-2 focus-visible:ring-aji focus-visible:ring-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded",
  md: "px-4 py-2 text-sm rounded-md",
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
          "inline-flex items-center justify-center gap-2 font-medium font-body transition-colors outline-none",
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
