"use client";

import { Ban, CalendarClock, CheckCircle2, CircleCheckBig, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { setAppointmentStatus } from "@/features/appointments/actions";
import { RescheduleDialog } from "./reschedule-dialog";

type Target = "confirmed" | "rejected" | "cancelled" | "completed";

const CONFIG: Record<Target, { title: string; description: string; confirm: string; tone: "primary" | "danger"; reason?: boolean }> = {
  confirmed: { title: "Confirm this appointment?", description: "The booking will be marked as confirmed.", confirm: "Confirm appointment", tone: "primary" },
  completed: { title: "Mark as completed?", description: "Use this after the patient has attended.", confirm: "Mark completed", tone: "primary" },
  rejected: {
    title: "Reject this booking?",
    description: "The slot will be released for other patients. Please record why.",
    confirm: "Reject booking",
    tone: "danger",
    reason: true,
  },
  cancelled: {
    title: "Cancel this appointment?",
    description: "The slot will be released for other patients. Please record why.",
    confirm: "Cancel appointment",
    tone: "danger",
    reason: true,
  },
};

export function AppointmentActions({
  appointment,
}: {
  appointment: {
    id: string;
    status: string;
    doctor_id: string;
    service_id: string;
    appointment_date: string;
    start_time: string;
    today: string;
  };
}) {
  const router = useRouter();
  const [target, setTarget] = useState<Target | null>(null);
  const [busy, setBusy] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const { status } = appointment;

  async function run(reason: string) {
    if (!target) return;
    setBusy(true);
    const res = await setAppointmentStatus({ id: appointment.id, status: target, reason });
    setBusy(false);
    if (res.ok) {
      toast.success(res.message ?? "Updated.");
      setTarget(null);
      router.refresh();
    } else {
      toast.error(res.message);
      if (res.code === "invalid_transition" || res.code === "hold_expired") {
        setTarget(null);
        router.refresh();
      }
    }
  }

  const canReschedule = status === "pending" || status === "confirmed";
  if (!canReschedule) {
    return <p className="text-sm text-body">No further actions are available for a {status} appointment.</p>;
  }

  const cfg = target ? CONFIG[target] : null;

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {status === "pending" && (
          <Button onClick={() => setTarget("confirmed")} className="w-full">
            <CheckCircle2 className="size-4" aria-hidden /> Confirm
          </Button>
        )}
        {status === "confirmed" && (
          <Button onClick={() => setTarget("completed")} className="w-full">
            <CircleCheckBig className="size-4" aria-hidden /> Mark completed
          </Button>
        )}
        <Button variant="secondary" onClick={() => setRescheduleOpen(true)} className="w-full">
          <CalendarClock className="size-4" aria-hidden /> Reschedule
        </Button>
        {status === "pending" && (
          <Button variant="danger-soft" onClick={() => setTarget("rejected")} className="w-full">
            <XCircle className="size-4" aria-hidden /> Reject
          </Button>
        )}
        <Button variant="danger-soft" onClick={() => setTarget("cancelled")} className="w-full">
          <Ban className="size-4" aria-hidden /> Cancel
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => !busy && setTarget(null)}
        onConfirm={run}
        loading={busy}
        title={cfg?.title ?? ""}
        description={cfg?.description}
        confirmLabel={cfg?.confirm}
        tone={cfg?.tone}
        reason={cfg?.reason ? { label: "Reason", required: true, placeholder: "Shared with the patient if they look up their booking" } : undefined}
      />

      <RescheduleDialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} appointment={appointment} />
    </>
  );
}
