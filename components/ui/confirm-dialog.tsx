"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { Field, Textarea } from "./field";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  /** Ask for a reason (e.g. cancellation / rejection). */
  reason?: { label: string; required?: boolean; placeholder?: string };
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  tone = "primary",
  loading,
  reason,
}: ConfirmDialogProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();

  function close() {
    setText("");
    setError(undefined);
    onClose();
  }

  async function confirm() {
    if (reason?.required && !text.trim()) {
      setError("Please enter a reason.");
      return;
    }
    await onConfirm(text.trim());
    setText("");
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={description}
      size="sm"
      busy={loading}
      role="alertdialog"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            Keep as is
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={confirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {reason && (
        <Field label={reason.label} required={reason.required} error={error} className={children ? "mt-4" : undefined}>
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              rows={3}
              value={text}
              placeholder={reason.placeholder}
              onChange={(e) => {
                setText(e.target.value);
                setError(undefined);
              }}
              data-autofocus
            />
          )}
        </Field>
      )}
    </Dialog>
  );
}
