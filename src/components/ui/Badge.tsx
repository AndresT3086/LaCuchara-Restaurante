import { HTMLAttributes } from "react";

type BadgeVariant = "good" | "warn" | "bad" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  good: "bg-hoja/15 text-hoja border border-hoja/30",
  warn: "bg-platano/20 text-[#8a6300] border border-platano/40",
  bad: "bg-aji/15 text-aji border border-aji/30",
  neutral: "bg-cafe/10 text-cafe border border-cafe/20",
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
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-body",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
