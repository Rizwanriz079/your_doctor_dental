"use client";

import { MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { addAppointmentNote } from "@/features/appointments/actions";

export function NoteForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!note.trim()) {
          setError("Write a note first.");
          return;
        }
        setBusy(true);
        const res = await addAppointmentNote({ id: appointmentId, note });
        setBusy(false);
        if (res.ok) {
          setNote("");
          toast.success(res.message ?? "Note added.");
          router.refresh();
        } else setError(res.message);
      }}
    >
      <Field label="Add internal note" error={error} hint="Visible to clinic staff only.">
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError(undefined);
            }}
          />
        )}
      </Field>
      <div className="mt-3 flex justify-end">
        <Button type="submit" variant="soft" size="sm" loading={busy}>
          <MessageSquarePlus className="size-4" aria-hidden />
          Save note
        </Button>
      </div>
    </form>
  );
}
