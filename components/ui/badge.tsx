import { Ban, CheckCircle2, CircleCheckBig, Clock3, Hourglass, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-muted text-navy-700 ring-line",
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  success: "bg-success-50 text-success-700 ring-success-600/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-500/25",
  danger: "bg-danger-50 text-danger-700 ring-danger-600/20",
  navy: "bg-navy-50 text-navy-800 ring-navy-100",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  icon: Icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors duration-300",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

const STATUS: Record<string, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  pending: { label: "Pending", tone: "warning", icon: Clock3 },
  confirmed: { label: "Confirmed", tone: "brand", icon: CheckCircle2 },
  completed: { label: "Completed", tone: "success", icon: CircleCheckBig },
  rejected: { label: "Rejected", tone: "danger", icon: XCircle },
  cancelled: { label: "Cancelled", tone: "neutral", icon: Ban },
  expired: { label: "Expired", tone: "neutral", icon: Hourglass },
};

/** Appointment status: icon + text, never colour alone. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status] ?? { label: status, tone: "neutral" as const, icon: Clock3 };
  return (
    <Badge tone={s.tone} icon={s.icon} className={className}>
      {s.label}
    </Badge>
  );
}

export const APPOINTMENT_STATUSES = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }));
