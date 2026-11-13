"use client";

import { CheckCircle2, MessageSquareQuote, Pencil, Plus, ShieldAlert, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Card, EmptyState } from "@/components/ui/misc";
import { deleteTestimonial, saveTestimonial } from "@/features/content/actions";
import { testimonialSchema, type TestimonialValues } from "@/features/content/schema";
import type { Testimonial } from "@/lib/types";

const EMPTY: TestimonialValues = {
  author_display: "",
  content: "",
  rating: null,
  consent_confirmed: false,
  is_approved: false,
  sort_order: 0,
};

export function TestimonialsManager({ testimonials }: { testimonials: Testimonial[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TestimonialValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [toDelete, setToDelete] = useState<Testimonial | null>(null);
  const [busy, startTransition] = useTransition();

  function open(t?: Testimonial) {
    setErrors({});
    setEditing(
      t
        ? {
            id: t.id,
            author_display: t.author_display,
            content: t.content,
            rating: t.rating,
            consent_confirmed: t.consent_confirmed,
            is_approved: t.is_approved,
            sort_order: t.sort_order,
          }
        : { ...EMPTY },
    );
  }

  function save() {
    if (!editing) return;
    const parsed = testimonialSchema.safeParse(editing);
    if (!parsed.success) {
      const e: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (e[i.path.join(".")] ??= []).push(i.message);
      setErrors(e);
      return;
    }
    startTransition(async () => {
      const res = await saveTestimonial(parsed.data);
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        setEditing(null);
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.message);
      }
    });
  }

  function remove() {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteTestimonial(toDelete.id);
      setToDelete(null);
      if (res.ok) {
        toast.success(res.message ?? "Deleted");
        router.refresh();
      } else toast.error(res.message);
    });
  }

  const set = (patch: Partial<TestimonialValues>) => setEditing((v) => (v ? { ...v, ...patch } : v));

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-navy-800">Testimonials</h2>
          <p className="mt-0.5 max-w-xl text-sm text-body">
            Only approved testimonials with confirmed patient consent are published. Never write or edit reviews on a patient’s behalf.
          </p>
        </div>
        <Button variant="navy" onClick={() => open()}>
          <Plus className="size-4" aria-hidden />
          Add testimonial
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="No testimonials yet"
          description="The testimonials section stays hidden on the website until one is approved."
        />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {testimonials.map((t) => (
            <li key={t.id} className="flex flex-col rounded-2xl border border-line p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-navy-800">{t.author_display}</span>
                {t.rating && (
                  <span className="flex items-center gap-0.5 text-xs text-warning-700" aria-label={`${t.rating} out of 5`}>
                    <Star className="size-3.5 fill-current" aria-hidden />
                    {t.rating}/5
                  </span>
                )}
                <span className="ml-auto">
                  {t.is_approved ? (
                    <Badge tone="success" icon={CheckCircle2}>
                      Published
                    </Badge>
                  ) : t.consent_confirmed ? (
                    <Badge tone="neutral">Draft</Badge>
                  ) : (
                    <Badge tone="warning" icon={ShieldAlert}>
                      No consent
                    </Badge>
                  )}
                </span>
              </div>
              <p className="line-clamp-4 flex-1 text-sm">“{t.content}”</p>
              <div className="mt-3 flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => open(t)}>
                  <Pencil className="size-4" aria-hidden />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-danger-700 hover:bg-danger-50" onClick={() => setToDelete(t)}>
                  <Trash2 className="size-4" aria-hidden />
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        busy={busy}
        title={editing?.id ? "Edit testimonial" : "Add testimonial"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="navy" onClick={save} loading={busy}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="flex flex-col gap-4">
            <Field label="Name or initials" required hint="Use only what the patient agreed to share, e.g. “Sara K.”" error={errors.author_display?.[0]}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  data-autofocus
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={editing.author_display}
                  onChange={(e) => set({ author_display: e.target.value })}
                />
              )}
            </Field>
            <Field label="Testimonial" required error={errors.content?.[0]}>
              {({ id, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  rows={5}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={editing.content}
                  onChange={(e) => set({ content: e.target.value })}
                />
              )}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rating (optional)">
                {({ id }) => (
                  <Select
                    id={id}
                    value={editing.rating ?? ""}
                    onChange={(e) => set({ rating: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">No rating</option>
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} / 5
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Display order">
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    value={editing.sort_order}
                    onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })}
                  />
                )}
              </Field>
            </div>
            <Checkbox
              label="The patient gave written consent to publish this testimonial with the name shown."
              checked={editing.consent_confirmed}
              onChange={(e) => set({ consent_confirmed: e.target.checked, is_approved: e.target.checked ? editing.is_approved : false })}
            />
            <div>
              <Checkbox
                label="Approved: publish on the website"
                checked={editing.is_approved}
                disabled={!editing.consent_confirmed}
                onChange={(e) => set({ is_approved: e.target.checked })}
              />
              {!editing.consent_confirmed && <p className="ml-8 mt-1 text-xs text-body">Confirm consent first to enable approval.</p>}
              {errors.is_approved?.[0] && <p className="ml-8 mt-1 text-sm text-danger-700">{errors.is_approved[0]}</p>}
            </div>
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this testimonial?"
        description="It will be removed from the website immediately. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
      />
    </Card>
  );
}
