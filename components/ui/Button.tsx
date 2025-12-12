import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  href,
  isLoading = false,
  disabled,
  ...props
}) => {
  const isDisabled = Boolean(disabled || isLoading);

  const base =
    "inline-flex items-center justify-center gap-2 font-semibold " +
    "transition shadow-sm active:translate-y-[1px] " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 " +
    "disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes: Record<string, string> = {
    sm: "px-4 py-2 text-sm rounded-xl",
    md: "px-5 py-3 text-[15px] rounded-2xl",
    lg: "px-6 py-4 text-base rounded-2xl",
  };

  const variants: Record<string, string> = {
    primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-md",
    secondary: "bg-white/80 text-stone-900 border border-stone-200 hover:bg-white shadow-md",
    outline: "bg-transparent text-stone-800 border border-stone-300 hover:bg-white/70",
    ghost: "bg-transparent text-stone-700 hover:bg-stone-100",
  };

  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`.trim();

  const spinner =
    isLoading ? (
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
        aria-hidden="true"
      />
    ) : null;

  if (href) {
    if (isDisabled) {
      return (
        <span className={cls} aria-disabled="true">
          {spinner}
          {children}
        </span>
      );
    }
    return (
      <Link href={href} className={cls}>
        {spinner}
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} disabled={isDisabled} aria-busy={isLoading || undefined} {...props}>
      {spinner}
      {children}
    </button>
  );
};
