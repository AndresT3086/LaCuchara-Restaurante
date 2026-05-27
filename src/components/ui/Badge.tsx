import { HTMLAttributes } from "react";

type BadgeVariant = "good" | "warn" | "bad" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  good: "bg-hoja-soft text-hoja",
  warn: "bg-platano-soft text-[#8A6716]",
  bad: "bg-aji-soft text-aji",
  neutral: "bg-maiz-2 text-cafe-2",
};

export default function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.04em] font-body before:h-1.5 before:w-1.5 before:rounded-full before:bg-current",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
