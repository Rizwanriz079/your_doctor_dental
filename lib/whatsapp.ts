/**
 * Free WhatsApp messaging via "click to chat" links (https://wa.me/<number>?text=...).
 * No API account or cost: the link opens WhatsApp (app or WhatsApp Web) with the message
 * pre-filled, and staff press Send. Pure functions so they work on server and client.
 */

/** Country code added to local numbers with no code (clinic is in India). */
export const DEFAULT_COUNTRY_CODE = "91";

export type WhatsAppNumber = { digits: string; valid: boolean; assumedCountryCode: boolean };

/**
 * Converts a stored phone number to the international digits-only form wa.me needs.
 * "+91 98765 43210" -> 919876543210, "09876543210" -> 919876543210, "9876543210" -> 919876543210.
 */
export function toWhatsAppNumber(raw: string, defaultCountryCode = DEFAULT_COUNTRY_CODE): WhatsAppNumber {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  let assumedCountryCode = false;
  // Only trust a number as international when it clearly is one: "+…", "00…", or
  // already starting with the default country code. Anything else that isn't a local
  // 10-digit / 0-prefixed number is flagged so staff check it before sending.
  let international = trimmed.startsWith("+");
  if (!international && digits.startsWith("00")) {
    digits = digits.slice(2);
    international = true;
  } else if (!international && digits.length === 11 && digits.startsWith("0")) {
    digits = defaultCountryCode + digits.slice(1);
    assumedCountryCode = true;
    international = true;
  } else if (!international && digits.length === 10) {
    digits = defaultCountryCode + digits;
    assumedCountryCode = true;
    international = true;
  } else if (!international && digits.startsWith(defaultCountryCode) && digits.length === defaultCountryCode.length + 10) {
    international = true;
  }
  // E.164: max 15 digits; a full international number is at least 11 digits for India/most countries.
  const valid = international && /^[1-9]\d{10,14}$/.test(digits);
  return { digits, valid, assumedCountryCode };
}

export function whatsAppUrl(digits: string, text: string) {
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export type MessageKind = "pending" | "confirmed" | "rescheduled" | "rejected" | "cancelled" | "completed" | "expired";

export const MESSAGE_KIND_LABEL: Record<MessageKind, string> = {
  pending: "Booking received",
  confirmed: "Booking confirmed",
  rescheduled: "Booking rescheduled",
  rejected: "Booking not accepted",
  cancelled: "Booking cancelled",
  completed: "Thank you after visit",
  expired: "Booking request expired",
};

export type MessageInput = {
  kind: MessageKind;
  patientName: string;
  doctorName: string;
  serviceName: string;
  dateLabel: string; // e.g. "Tuesday, 1 December 2026"
  timeLabel: string; // e.g. "10:00 AM"
  reference: string;
  reason?: string | null;
  clinicName: string;
  clinicPhone?: string | null;
  clinicAddress?: string | null;
  siteUrl?: string | null;
};

/** Patient-facing message for each booking status. Plain text; WhatsApp renders *bold*. */
export function buildPatientMessage(m: MessageInput): string {
  const first = m.patientName.trim().split(/\s+/)[0] || "there";
  const greeting = `Hi ${first.charAt(0).toUpperCase()}${first.slice(1)},`;
  const details = [
    `🦷 ${m.serviceName}`,
    `👩‍⚕️ ${m.doctorName}`,
    `📅 ${m.dateLabel}`,
    `⏰ ${m.timeLabel}`,
    `🔖 Booking ref: ${m.reference}`,
  ].join("\n");
  const contact = m.clinicPhone ? `\nQuestions? Reply here or call ${m.clinicPhone}.` : "\nQuestions? Just reply to this message.";
  const statusLink = m.siteUrl ? `\nCheck your booking: ${m.siteUrl}/my-appointments?ref=${m.reference}` : "";
  const bookLink = m.siteUrl ? `${m.siteUrl}/book-appointment` : null;
  const reason = m.reason?.trim() ? `\nReason: ${m.reason.trim()}` : "";
  const sign = `\n— ${m.clinicName}`;

  switch (m.kind) {
    case "pending":
      return `${greeting}\n\nWe've received your booking request at *${m.clinicName}*:\n\n${details}\n\nWe'll confirm your appointment shortly.${statusLink}${contact}${sign}`;
    case "confirmed":
      return `${greeting}\n\nYour appointment at *${m.clinicName}* is *confirmed* ✅\n\n${details}${m.clinicAddress ? `\n📍 ${m.clinicAddress}` : ""}\n\nPlease arrive 10 minutes early. If you need to reschedule or cancel, please let us know.${statusLink}${contact}${sign}`;
    case "rescheduled":
      return `${greeting}\n\nYour appointment at *${m.clinicName}* has been *rescheduled*. Your new time is:\n\n${details}${m.clinicAddress ? `\n📍 ${m.clinicAddress}` : ""}\n\nIf this time doesn't suit you, please let us know.${statusLink}${contact}${sign}`;
    case "rejected":
      return `${greeting}\n\nSorry, we couldn't accept your booking request for ${m.serviceName} with ${m.doctorName} on ${m.dateLabel} at ${m.timeLabel} (ref ${m.reference}).${reason}\n\n${bookLink ? `Please choose another time: ${bookLink}` : "Please contact us to choose another time."}${contact}${sign}`;
    case "cancelled":
      return `${greeting}\n\nYour appointment for ${m.serviceName} with ${m.doctorName} on ${m.dateLabel} at ${m.timeLabel} (ref ${m.reference}) has been *cancelled*.${reason}\n\n${bookLink ? `You can book a new time here: ${bookLink}` : "Please contact us to book a new time."}${contact}${sign}`;
    case "completed":
      return `${greeting}\n\nThank you for visiting *${m.clinicName}* today. We hope your appointment with ${m.doctorName} went well.\n\nIf you have any questions or discomfort after your treatment, please contact us.${bookLink ? `\nBook your next visit: ${bookLink}` : ""}${contact}${sign}`;
    case "expired":
      return `${greeting}\n\nYour booking request for ${m.serviceName} on ${m.dateLabel} at ${m.timeLabel} (ref ${m.reference}) has expired and was not confirmed.\n\n${bookLink ? `Please choose a new time: ${bookLink}` : "Please contact us to book again."}${contact}${sign}`;
  }
}
