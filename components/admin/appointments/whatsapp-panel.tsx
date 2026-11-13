"use client";

import { AlertTriangle, ExternalLink, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { logWhatsAppMessage } from "@/features/appointments/actions";
import { formatDate, formatTime } from "@/lib/utils";
import {
  buildPatientMessage,
  MESSAGE_KIND_LABEL,
  toWhatsAppNumber,
  whatsAppUrl,
  type MessageKind,
} from "@/lib/whatsapp";

/** Event other components dispatch to open this panel, e.g. right after confirming a booking. */
export const WHATSAPP_PROMPT_EVENT = "whatsapp:prompt";
type PromptOverrides = { reason?: string; date?: string; startTime?: string };
type PromptDetail = { kind: MessageKind } & PromptOverrides;

/** Values passed explicitly so the message is right even before the page has refreshed. */
export function promptWhatsApp(kind: MessageKind, overrides: PromptOverrides = {}) {
  window.dispatchEvent(new CustomEvent<PromptDetail>(WHATSAPP_PROMPT_EVENT, { detail: { kind, ...overrides } }));
}

const STATUS_TO_KIND: Record<string, MessageKind> = {
  pending: "pending",
  confirmed: "confirmed",
  rejected: "rejected",
  cancelled: "cancelled",
  completed: "completed",
  expired: "expired",
};

type Props = {
  appointment: {
    id: string;
    status: string;
    reference: string;
    patientName: string;
    patientPhone: string;
    doctorName: string;
    serviceName: string;
    date: string;
    startTime: string;
    reason: string | null;
  };
  clinic: { name: string; phone: string; address: string };
  siteUrl: string;
};

export function WhatsAppPanel({ appointment: a, clinic, siteUrl }: Props) {
  const defaultKind = STATUS_TO_KIND[a.status] ?? "confirmed";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<MessageKind>(defaultKind);
  const [text, setText] = useState("");
  const [number, setNumber] = useState(() => toWhatsAppNumber(a.patientPhone).digits);

  function messageFor(k: MessageKind, o: PromptOverrides = {}) {
    return buildPatientMessage({
      kind: k,
      patientName: a.patientName,
      doctorName: a.doctorName,
      serviceName: a.serviceName,
      dateLabel: formatDate(o.date ?? a.date),
      timeLabel: formatTime(o.startTime ?? a.startTime),
      reference: a.reference,
      reason: o.reason ?? a.reason,
      clinicName: clinic.name,
      clinicPhone: clinic.phone || null,
      clinicAddress: clinic.address || null,
      siteUrl,
    });
  }

  function openWith(k: MessageKind, o: PromptOverrides = {}) {
    setKind(k);
    setText(messageFor(k, o));
    setNumber(toWhatsAppNumber(a.patientPhone).digits);
    setOpen(true);
  }

  // Opened from elsewhere (toast after a status change / reschedule).
  useEffect(() => {
    function onPrompt(e: Event) {
      const { kind: k, ...o } = (e as CustomEvent<PromptDetail>).detail ?? { kind: defaultKind };
      openWith(k ?? defaultKind, o);
    }
    window.addEventListener(WHATSAPP_PROMPT_EVENT, onPrompt);
    return () => window.removeEventListener(WHATSAPP_PROMPT_EVENT, onPrompt);
  });

  // The field holds the international digits already (converted when the dialog opens).
  const original = toWhatsAppNumber(a.patientPhone);
  // A number the patient typed that could not be resolved must be corrected before sending.
  const numberValid = /^[1-9]\d{10,14}$/.test(number) && (original.valid || number !== original.digits);

  async function send() {
    if (!numberValid) {
      toast.error("Please check the WhatsApp number (include the country code, e.g. 91…).");
      return;
    }
    window.open(whatsAppUrl(number, text), "_blank", "noopener,noreferrer");
    setOpen(false);
    const res = await logWhatsAppMessage({ id: a.id, kind });
    if (!res.ok) toast.error(res.message);
  }

  return (
    <>
      <p className="text-sm text-body">
        Send the patient a ready-written WhatsApp message about this booking. It opens in WhatsApp for you to press Send — free, no
        account needed.
      </p>
      {!original.valid && (
        <p className="mt-3 flex gap-2 rounded-xl bg-warning-50 p-3 text-sm text-warning-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          The phone number “{a.patientPhone}” doesn’t look like a full mobile number. You can correct it before sending.
        </p>
      )}
      <Button className="mt-4 w-full bg-success-600 hover:bg-success-700" onClick={() => openWith(defaultKind)}>
        <MessageCircle className="size-4" aria-hidden /> Send WhatsApp message
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="WhatsApp message to patient"
        description={`${a.patientName} · ${a.reference}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="bg-success-600 hover:bg-success-700" onClick={send} disabled={!text.trim()}>
              <ExternalLink className="size-4" aria-hidden /> Open in WhatsApp
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Message type">
            {({ id }) => (
              <Select
                id={id}
                value={kind}
                onChange={(e) => {
                  const k = e.target.value as MessageKind;
                  setKind(k);
                  setText(messageFor(k));
                }}
              >
                {(Object.keys(MESSAGE_KIND_LABEL) as MessageKind[]).map((k) => (
                  <option key={k} value={k}>
                    {MESSAGE_KIND_LABEL[k]}
                    {k === defaultKind ? " (current status)" : ""}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="WhatsApp number"
            error={numberValid ? undefined : "Enter the full number with country code, e.g. 919876543210."}
            hint={original.assumedCountryCode ? "Country code +91 was added to the number the patient entered." : "Digits only, with country code."}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                inputMode="tel"
                value={number}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                onChange={(e) => setNumber(e.target.value.replace(/[^\d]/g, ""))}
              />
            )}
          </Field>
        </div>
        <Field label="Message" className="mt-4" hint="You can edit the text before opening WhatsApp.">
          {({ id, describedBy }) => (
            <Textarea id={id} aria-describedby={describedBy} rows={12} value={text} onChange={(e) => setText(e.target.value)} />
          )}
        </Field>
      </Dialog>
    </>
  );
}
