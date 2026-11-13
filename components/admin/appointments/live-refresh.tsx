"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Re-renders the current server page when appointments change (new bookings, status updates).
 * Realtime only triggers a refresh; the data itself is always re-read from the database.
 */
export function AppointmentsLiveRefresh({ appointmentId }: { appointmentId?: string }) {
  const router = useRouter();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`admin-appointments-${appointmentId ?? "list"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          ...(appointmentId ? { filter: `id=eq.${appointmentId}` } : {}),
        },
        () => {
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => router.refresh(), 600);
        },
      )
      .subscribe();
    return () => {
      window.clearTimeout(timer.current);
      void supabase.removeChannel(channel);
    };
  }, [router, appointmentId]);

  return null;
}
