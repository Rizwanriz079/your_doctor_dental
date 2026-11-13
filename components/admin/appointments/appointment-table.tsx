"use client";

import { useSafeReducedMotion } from "@/lib/use-reduced-motion";
import { motion } from "motion/react";
import { Check, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/badge";
import { setAppointmentStatus } from "@/features/appointments/actions";
import { cn, formatDate, formatDateTime, formatTime } from "@/lib/utils";

export type AppointmentRowView = {
  id: string;
  booking_reference: string;
  patient_name: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  doctor_name: string;
  service_name: string;
};

function QuickConfirm({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await setAppointmentStatus({ id, status: "confirmed" });
        setBusy(false);
        if (res.ok) {
          toast.success(res.message ?? "Appointment confirmed.");
          router.refresh();
        } else toast.error(res.message);
      }}
      className="grid size-9 place-items-center rounded-lg text-success-700 transition-colors hover:bg-success-50 disabled:opacity-50"
      aria-label="Confirm appointment"
      title="Confirm"
    >
      <Check className="size-[18px]" aria-hidden />
    </button>
  );
}

// Rows animate on the first load of the list only, not after filter changes or live refreshes.
let listHasAnimated = false;

const th = "px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-body";

export function AppointmentTable({ rows }: { rows: AppointmentRowView[] }) {
  const reduce = useSafeReducedMotion();
  const animate = !listHasAnimated && !reduce;
  useEffect(() => {
    listHasAnimated = true;
  }, []);

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden relative overflow-x-auto md:block">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className={th}>Reference</th>
              <th scope="col" className={th}>Patient</th>
              <th scope="col" className={th}>Doctor</th>
              <th scope="col" className={th}>Service</th>
              <th scope="col" className={th}>Date</th>
              <th scope="col" className={th}>Time</th>
              <th scope="col" className={th}>Status</th>
              <th scope="col" className={th}>Booked</th>
              <th scope="col" className={cn(th, "text-right")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr
                key={r.id}
                initial={animate ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: animate ? Math.min(i, 12) * 0.03 : 0 }}
                className="border-b border-line last:border-0 transition-colors hover:bg-muted/60"
              >
                <td className="px-4 py-3.5 font-mono text-xs font-semibold text-navy-700">{r.booking_reference}</td>
                <td className="max-w-[12rem] px-4 py-3.5 font-semibold text-navy-800">
                  <span className="line-clamp-2 break-anywhere">{r.patient_name}</span>
                </td>
                <td className="max-w-[12rem] px-4 py-3.5 text-navy-800">
                  <span className="line-clamp-2">{r.doctor_name}</span>
                </td>
                <td className="max-w-[12rem] px-4 py-3.5">
                  <span className="line-clamp-2">{r.service_name}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-navy-800">{formatDate(r.appointment_date, "weekday")}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-navy-800">{formatTime(r.start_time)}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-xs">{formatDateTime(r.created_at)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    {r.status === "pending" && <QuickConfirm id={r.id} />}
                    <Link
                      href={`/dentaladmincalicut/appointments/${r.id}`}
                      className="grid size-9 place-items-center rounded-lg text-navy-700 transition-colors hover:bg-navy-50"
                      aria-label={`View appointment ${r.booking_reference}`}
                      title="View"
                    >
                      <Eye className="size-[18px]" aria-hidden />
                    </Link>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dentaladmincalicut/appointments/${r.id}`} className="font-semibold text-navy-800 break-anywhere hover:text-brand-700">
                  {r.patient_name}
                </Link>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-sm text-navy-800">
                {formatDate(r.appointment_date, "weekday")} · {formatTime(r.start_time)}
              </p>
              <p className="mt-0.5 text-sm break-anywhere">
                {r.doctor_name} · {r.service_name}
              </p>
              <p className="mt-1 font-mono text-xs text-body">{r.booking_reference}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1">
              <Link
                href={`/dentaladmincalicut/appointments/${r.id}`}
                className="grid size-10 place-items-center rounded-lg text-navy-700 ring-1 ring-line hover:bg-navy-50"
                aria-label={`View appointment ${r.booking_reference}`}
              >
                <Eye className="size-[18px]" aria-hidden />
              </Link>
              {r.status === "pending" && <QuickConfirm id={r.id} />}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
