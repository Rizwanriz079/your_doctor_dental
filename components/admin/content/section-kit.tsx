"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/misc";
import { saveContent } from "@/features/content/actions";
import { contentSchemas, type ContentSection } from "@/features/content/schema";
import { cn } from "@/lib/utils";

export type Errors = Record<string, string[] | undefined>;

/** Local state + client validation + save for one clinic_settings section. */
export function useSection<T extends Record<string, unknown>>(section: ContentSection, initial: T) {
  const router = useRouter();
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);
  const [saving, startTransition] = useTransition();

  function set<K extends keyof T>(key: K, value: T[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(next)) if (k === key || k.startsWith(`${String(key)}.`)) delete next[k];
      return next;
    });
  }

  function save() {
    const parsed = contentSchemas[section].safeParse(values);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const i of parsed.error.issues) (errs[i.path.join(".")] ??= []).push(i.message);
      setErrors(errs);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    startTransition(async () => {
      const res = await saveContent(section, values);
      if (res.ok) {
        toast.success(res.message ?? "Saved");
        setDirty(false);
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.message);
      }
    });
  }

  return { values, set, errors, saving, dirty, save };
}

export function SectionCard({
  title,
  description,
  children,
  onSave,
  saving,
  dirty,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="mb-5">
          <h2 className="text-lg font-bold text-navy-800">{title}</h2>
          {description && <div className="mt-0.5 text-sm text-body">{description}</div>}
        </div>
        <div className="flex flex-col gap-5">{children}</div>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-line pt-4">
          {dirty && <span className="text-sm text-warning-700">Unsaved changes</span>}
          <Button type="submit" variant="navy" loading={saving}>
            Save &amp; publish
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  multiline,
  rows = 4,
  type = "text",
  required,
  placeholder,
  maxLength,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string[];
  hint?: ReactNode;
  multiline?: boolean;
  rows?: number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <Field label={label} error={error?.[0]} hint={hint} required={required} className={className}>
      {({ id, describedBy, invalid }) =>
        multiline ? (
          <Textarea
            id={id}
            rows={rows}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <Input
            id={id}
            type={type}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Field>
  );
}

/** Repeatable list with add / remove / reorder controls. */
export function ListEditor<T>({
  items,
  onChange,
  render,
  newItem,
  addLabel,
  max,
  itemLabel,
  error,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  newItem: () => T;
  addLabel: string;
  max: number;
  itemLabel: (index: number) => string;
  error?: string[];
}) {
  function move(i: number, dir: -1 | 1) {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  }
  const btn = "grid size-8 place-items-center rounded-lg text-body transition-colors hover:bg-muted hover:text-navy-800 disabled:opacity-30";
  return (
    <div>
      {items.length > 0 && (
        <ol className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={i} className="rounded-2xl border border-line bg-muted/40 p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-body">{itemLabel(i)}</span>
                <div className="flex items-center gap-0.5">
                  <button type="button" className={btn} disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${itemLabel(i)} up`}>
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={btn}
                    disabled={i === items.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label={`Move ${itemLabel(i)} down`}
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={cn(btn, "hover:bg-danger-50 hover:text-danger-700")}
                    onClick={() => onChange(items.filter((_, k) => k !== i))}
                    aria-label={`Remove ${itemLabel(i)}`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
              {render(item, (patch) => onChange(items.map((x, k) => (k === i ? { ...x, ...patch } : x))), i)}
            </li>
          ))}
        </ol>
      )}
      {error?.[0] && <p className="mt-2 text-sm text-danger-700">{error[0]}</p>}
      <button
        type="button"
        disabled={items.length >= max}
        onClick={() => onChange([...items, newItem()])}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
        <span className="font-normal text-body">
          ({items.length}/{max})
        </span>
      </button>
    </div>
  );
}

/** Accessible tabs (arrow keys move between tabs). Panels stay mounted to keep unsaved edits. */
export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKey(e: KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    setActive(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Content sections" className="-mx-1 mb-5 flex gap-1 relative overflow-x-auto px-1 pb-1">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-200",
              active === t.id ? "bg-navy-800 text-white" : "bg-white text-navy-800 ring-1 ring-line hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
