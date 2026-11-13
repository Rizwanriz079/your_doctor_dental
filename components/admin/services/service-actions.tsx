"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RowMenu } from "@/components/admin/doctors/row-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { serviceLifecycle } from "@/features/services/actions";

type Action = "activate" | "deactivate" | "archive" | "restore" | "delete";

const COPY: Record<Action, { title: string; body: string; label: string; danger?: boolean }> = {
  activate: { title: "Activate this service?", body: "It will appear on the website and can be booked with assigned doctors.", label: "Activate" },
  deactivate: {
    title: "Deactivate this service?",
    body: "It will be hidden from the website and new bookings. Existing appointments keep their service.",
    label: "Deactivate",
    danger: true,
  },
  archive: {
    title: "Archive this service?",
    body: "Archived services are hidden everywhere except historical appointment records. You can restore it later.",
    label: "Archive",
    danger: true,
  },
  restore: { title: "Restore this service?", body: "It will be restored as inactive. Activate it when ready.", label: "Restore" },
  delete: {
    title: "Delete this service permanently?",
    body: "This cannot be undone. Services with appointment history cannot be deleted; archive them instead.",
    label: "Delete",
    danger: true,
  },
};

export function ServiceActions({ service }: { service: { id: string; name: string; is_active: boolean; archived_at: string | null } }) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, startTransition] = useTransition();
  const archived = Boolean(service.archived_at);

  function run(action: Action) {
    startTransition(async () => {
      const res = await serviceLifecycle({ id: service.id, action });
      setPending(null);
      if (!res.ok) {
        toast.error(res.message, { duration: 8000 });
        return;
      }
      toast.success(res.message ?? "Updated");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={`/dentaladmincalicut/services/${service.id}/edit`}
        aria-label={`Edit ${service.name}`}
        title="Edit"
        className="grid size-9 place-items-center rounded-lg text-body transition-colors hover:bg-muted hover:text-navy-800"
      >
        <Pencil className="size-[18px]" aria-hidden />
      </Link>
      <RowMenu
        label={`More actions for ${service.name}`}
        items={[
          { label: "Activate", icon: Power, hidden: archived || service.is_active, onSelect: () => setPending("activate") },
          { label: "Deactivate", icon: PowerOff, hidden: archived || !service.is_active, onSelect: () => setPending("deactivate") },
          { label: "Archive", icon: Archive, hidden: archived, onSelect: () => setPending("archive") },
          { label: "Restore", icon: ArchiveRestore, hidden: !archived, onSelect: () => setPending("restore") },
          { label: "Delete permanently", icon: Trash2, tone: "danger", onSelect: () => setPending("delete") },
        ]}
      />
      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) run(pending);
        }}
        title={pending ? COPY[pending].title : ""}
        description={pending ? COPY[pending].body : undefined}
        confirmLabel={pending ? COPY[pending].label : "Confirm"}
        tone={pending && COPY[pending].danger ? "danger" : "primary"}
        loading={busy}
      />
    </div>
  );
}
