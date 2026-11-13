"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, CalendarCheck, CalendarOff, Eye, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteDoctor, setDoctorStatus } from "@/features/doctors/actions";
import { RowMenu, type RowMenuItem } from "./row-menu";

type Doctor = { id: string; full_name: string; status: string; accepting_bookings: boolean };

type Pending =
  | { kind: "status"; status: "active" | "inactive" | "archived"; accepting: boolean; title: string; body: string; label: string; danger?: boolean }
  | { kind: "delete" }
  | null;

/** View / Edit icons plus a menu of lifecycle actions, each confirmed in a dialog. */
export function DoctorActions({ doctor, compact = true, afterDelete }: { doctor: Doctor; compact?: boolean; afterDelete?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending>(null);
  const [busy, startTransition] = useTransition();
  const archived = doctor.status === "archived";

  function runStatus(p: Extract<Pending, { kind: "status" }>) {
    startTransition(async () => {
      const res = await setDoctorStatus({ id: doctor.id, status: p.status, accepting: p.accepting });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setPending(null);
      const upcoming = res.data.upcoming;
      if (upcoming > 0 && (p.status !== "active" || !p.accepting)) {
        toast.warning(`${doctor.full_name} has ${upcoming} upcoming appointment(s). They were not changed. Review them in Appointments.`, {
          duration: 8000,
        });
      } else {
        toast.success("Doctor status updated");
      }
      router.refresh();
    });
  }

  function runDelete() {
    startTransition(async () => {
      const res = await deleteDoctor(doctor.id);
      if (!res.ok) {
        toast.error(res.message, { duration: 8000 });
        setPending(null);
        return;
      }
      setPending(null);
      toast.success(`${doctor.full_name} was deleted`);
      if (afterDelete) router.push(afterDelete);
      else router.refresh();
    });
  }

  const items: RowMenuItem[] = [
    {
      label: "Activate",
      icon: Power,
      hidden: doctor.status !== "inactive",
      onSelect: () =>
        setPending({
          kind: "status",
          status: "active",
          accepting: doctor.accepting_bookings,
          title: `Activate ${doctor.full_name}?`,
          body: "The doctor will appear on the public website again.",
          label: "Activate",
        }),
    },
    {
      label: "Deactivate",
      icon: PowerOff,
      hidden: doctor.status !== "active",
      onSelect: () =>
        setPending({
          kind: "status",
          status: "inactive",
          accepting: doctor.accepting_bookings,
          title: `Deactivate ${doctor.full_name}?`,
          body: "The doctor will be hidden from the website and cannot receive new bookings. Existing appointments and history are kept.",
          label: "Deactivate",
          danger: true,
        }),
    },
    {
      label: "Pause new bookings",
      icon: CalendarOff,
      hidden: archived || !doctor.accepting_bookings,
      onSelect: () =>
        setPending({
          kind: "status",
          status: doctor.status as "active" | "inactive",
          accepting: false,
          title: "Pause new bookings?",
          body: "The profile stays visible but patients cannot book this doctor. Existing appointments are not changed.",
          label: "Pause bookings",
        }),
    },
    {
      label: "Resume new bookings",
      icon: CalendarCheck,
      hidden: archived || doctor.accepting_bookings,
      onSelect: () =>
        setPending({
          kind: "status",
          status: doctor.status as "active" | "inactive",
          accepting: true,
          title: "Resume new bookings?",
          body: "Patients will be able to book this doctor again on scheduled days.",
          label: "Resume bookings",
        }),
    },
    {
      label: "Archive",
      icon: Archive,
      hidden: archived,
      onSelect: () =>
        setPending({
          kind: "status",
          status: "archived",
          accepting: false,
          title: `Archive ${doctor.full_name}?`,
          body: "Archived doctors are removed from active lists and the website. All appointment records are kept and you can restore the doctor later.",
          label: "Archive",
          danger: true,
        }),
    },
    {
      label: "Restore",
      icon: ArchiveRestore,
      hidden: !archived,
      onSelect: () =>
        setPending({
          kind: "status",
          status: "inactive",
          accepting: false,
          title: `Restore ${doctor.full_name}?`,
          body: "The doctor is restored as Inactive. Activate them when they are ready to appear on the website.",
          label: "Restore",
        }),
    },
    { label: "Delete permanently", icon: Trash2, tone: "danger", onSelect: () => setPending({ kind: "delete" }) },
  ];

  const iconBtn =
    "grid size-9 place-items-center rounded-lg text-body transition-colors hover:bg-muted hover:text-navy-800";

  return (
    <div className="flex items-center justify-end gap-0.5">
      {compact && (
        <>
          <Link href={`/admin/doctors/${doctor.id}`} className={iconBtn} aria-label={`View ${doctor.full_name}`} title="View">
            <Eye className="size-[18px]" aria-hidden />
          </Link>
          <Link href={`/admin/doctors/${doctor.id}/edit`} className={iconBtn} aria-label={`Edit ${doctor.full_name}`} title="Edit">
            <Pencil className="size-[18px]" aria-hidden />
          </Link>
        </>
      )}
      <RowMenu items={items} label={`More actions for ${doctor.full_name}`} />

      <ConfirmDialog
        open={pending?.kind === "status"}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === "status") runStatus(pending);
        }}
        title={pending?.kind === "status" ? pending.title : ""}
        description={pending?.kind === "status" ? pending.body : undefined}
        confirmLabel={pending?.kind === "status" ? pending.label : "Confirm"}
        tone={pending?.kind === "status" && pending.danger ? "danger" : "primary"}
        loading={busy}
      />
      <ConfirmDialog
        open={pending?.kind === "delete"}
        onClose={() => setPending(null)}
        onConfirm={runDelete}
        title={`Delete ${doctor.full_name} permanently?`}
        description="This cannot be undone. Doctors with any appointment history cannot be deleted. Archive them instead to keep records intact."
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
      />
    </div>
  );
}
