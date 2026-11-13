import Link from "next/link";
import { Loader2 } from "lucide-react";
import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-400 select-none";

const variants = {
  primary: "bg-brand-600 text-white shadow-[0_6px_18px_-6px_rgb(11_122_124/0.6)] hover:bg-brand-700",
  navy: "bg-navy-800 text-white shadow-[0_6px_18px_-8px_rgb(23_50_77/0.6)] hover:bg-navy-900",
  secondary: "bg-white text-navy-800 ring-1 ring-line hover:bg-muted hover:ring-navy-100",
  ghost: "text-navy-800 hover:bg-navy-50",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  danger: "bg-danger-600 text-white hover:bg-danger-700",
  "danger-soft": "bg-danger-50 text-danger-700 hover:bg-danger-600 hover:text-white",
  glass: "bg-white/15 text-white ring-1 ring-white/40 backdrop-blur-md hover:bg-white/25",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
  icon: "h-10 w-10 p-0",
  "icon-sm": "h-8 w-8 p-0 rounded-lg",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
