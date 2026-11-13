"use client";

import Link from "next/link";
import { CalendarCheck2, CalendarDays, CalendarRange, CircleCheckBig, Clock3, Stethoscope, Users, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";

type StatKey = "total" | "today" | "pending" | "confirmed" | "completed" | "patients" | "activeDoctors";

const CARDS: { key: StatKey; label: string; icon: LucideIcon; href: string; tone: string }[] = [
  { key: "today", label: "Today's appointments", icon: CalendarDays, href: "/dentaladmincalicut/appointments?range=today", tone: "bg-brand-50 text-brand-700" },
  { key: "pending", label: "Pending", icon: Clock3, href: "/dentaladmincalicut/appointments?status=pending", tone: "bg-danger-50 text-danger-700" },
  { key: "confirmed", label: "Confirmed", icon: CalendarCheck2, href: "/dentaladmincalicut/appointments?status=confirmed", tone: "bg-brand-50 text-brand-700" },
  { key: "completed", label: "Completed", icon: CircleCheckBig, href: "/dentaladmincalicut/appointments?status=completed", tone: "bg-success-50 text-success-700" },
  { key: "total", label: "Total appointments", icon: CalendarRange, href: "/dentaladmincalicut/appointments", tone: "bg-navy-50 text-navy-800" },
  { key: "patients", label: "Total patients", icon: Users, href: "/dentaladmincalicut/patients", tone: "bg-navy-50 text-navy-800" },
  { key: "activeDoctors", label: "Active doctors", icon: Stethoscope, href: "/dentaladmincalicut/doctors?status=active", tone: "bg-brand-50 text-brand-700" },
];

export function StatCards({ stats }: { stats: Record<StatKey, number> }) {
  return (
    <Stagger as="ul" gap={0.06} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-7">
      {CARDS.map(({ key, label, icon: Icon, href, tone }) => (
        <StaggerItem as="li" key={key} className="min-w-0">
          <Link
            href={href}
            className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className={cn("grid size-10 place-items-center rounded-xl", tone)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-2xl font-bold tabular-nums tracking-tight text-navy-800 sm:text-3xl">
                {stats[key].toLocaleString()}
              </span>
              <span className="mt-0.5 block text-sm text-body">{label}</span>
            </span>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
