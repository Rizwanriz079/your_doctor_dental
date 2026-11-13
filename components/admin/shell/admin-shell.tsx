"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelsTopLeft,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { signOutAction } from "@/features/auth/actions";
import { duration, easeOut } from "@/lib/motion";
import type { Notification } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { NotificationBell } from "../notifications/notification-bell";
import { NotificationsProvider, useNotifications } from "../notifications/notifications-provider";
import { BrandMark } from "./brand-mark";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: "unread" };

const NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/admin/availability", label: "Availability", icon: CalendarClock },
  { href: "/admin/patients", label: "Patients", icon: Users },
  { href: "/admin/services", label: "Services", icon: Sparkles },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, badge: "unread" },
  { href: "/admin/content", label: "Content", icon: PanelsTopLeft },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

type ShellProps = {
  admin: { userId: string; email: string; fullName: string };
  clinicName: string;
  logoPath: string | null;
  initialNotifications: Notification[];
  initialUnread: number;
  children: ReactNode;
};

export function AdminShell({ admin, clinicName, logoPath, initialNotifications, initialUnread, children }: ShellProps) {
  return (
    <NotificationsProvider userId={admin.userId} initialItems={initialNotifications} initialUnread={initialUnread}>
      <ShellInner admin={admin} clinicName={clinicName} logoPath={logoPath}>
        {children}
      </ShellInner>
    </NotificationsProvider>
  );
}

function ShellInner({
  admin,
  clinicName,
  logoPath,
  children,
}: Pick<ShellProps, "admin" | "clinicName" | "logoPath" | "children">) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close the drawer after navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus(), 30);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
      if (e.key === "Tab" && drawerRef.current) {
        const els = Array.from(drawerRef.current.querySelectorAll<HTMLElement>("a, button"));
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    const menuButton = menuButtonRef.current;
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      menuButton?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-muted lg:flex">
        <SidebarContent clinicName={clinicName} logoPath={logoPath} variant="desktop" />
      </aside>

      {/* Mobile / tablet drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <motion.div
              className="absolute inset-0 bg-navy-900/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.normal }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation"
              className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col bg-muted shadow-lift"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: duration.normal, ease: easeOut }}
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-5 grid size-9 place-items-center rounded-full text-body hover:bg-white hover:text-navy-800"
                aria-label="Close navigation"
              >
                <X className="size-5" aria-hidden />
              </button>
              <SidebarContent clinicName={clinicName} logoPath={logoPath} variant="drawer" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-md">
          <div className="flex h-[4.5rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid size-11 place-items-center rounded-2xl text-navy-800 ring-1 ring-line hover:bg-muted lg:hidden"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
              <BrandMark logoPath={logoPath} className="size-8" />
              <span className="hidden truncate font-bold text-navy-800 sm:inline">{clinicName}</span>
            </Link>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Link
                href="/admin/settings"
                className="hidden size-11 place-items-center rounded-2xl bg-white text-navy-800 ring-1 ring-line transition-colors hover:bg-muted sm:grid"
                aria-label="Clinic settings"
              >
                <Settings className="size-5" aria-hidden />
              </Link>
              <NotificationBell />
              <UserMenu admin={admin} />
            </div>
          </div>
        </header>
        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-4 text-xs text-body sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {clinicName} · Admin dashboard
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  clinicName,
  logoPath,
  variant,
}: {
  clinicName: string;
  logoPath: string | null;
  variant: "desktop" | "drawer";
}) {
  const pathname = usePathname();
  const { unread } = useNotifications();
  return (
    <>
      <Link href="/admin/dashboard" className="flex items-center gap-3 px-6 pb-6 pt-7">
        <BrandMark logoPath={logoPath} />
        <span className="min-w-0 truncate text-lg font-bold tracking-tight text-navy-800">{clinicName}</span>
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-6">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[0.95rem] font-medium transition-colors duration-200",
                    active ? "text-navy-800" : "text-body hover:bg-white/70 hover:text-navy-800",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`admin-nav-pill-${variant}`}
                      className="absolute inset-0 rounded-2xl bg-brand-100"
                      transition={{ duration: duration.normal, ease: easeOut }}
                      aria-hidden
                    />
                  )}
                  <Icon className={cn("relative size-5 shrink-0", active && "text-brand-700")} aria-hidden />
                  <span className={cn("relative", active && "font-bold")}>{item.label}</span>
                  {item.badge === "unread" && unread > 0 && (
                    <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-danger-600 px-1.5 text-[0.7rem] font-bold text-white">
                      {unread > 99 ? "99+" : unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="px-6 pb-6">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-2xl bg-navy-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-900"
        >
          View public website
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </Link>
      </div>
    </>
  );
}

function UserMenu({ admin }: { admin: ShellProps["admin"] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${admin.fullName}`}
        className="flex h-11 items-center gap-2.5 rounded-2xl bg-white pl-1.5 pr-2 ring-1 ring-line transition-colors hover:bg-muted sm:pr-3"
      >
        <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-brand-100 to-sky-soft text-xs font-bold text-brand-700">
          {initials(admin.fullName) || "A"}
        </span>
        <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-navy-800 md:inline">{admin.fullName}</span>
        <ChevronDown className={cn("hidden size-4 text-body transition-transform md:block", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: duration.normal, ease: easeOut }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white shadow-lift"
          >
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-sm font-bold text-navy-800">{admin.fullName}</p>
              <p className="break-anywhere text-xs text-body">{admin.email}</p>
              <p className="mt-1 text-xs font-semibold text-brand-700">Super Admin</p>
            </div>
            <div className="p-1.5">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-navy-800 hover:bg-muted"
              >
                <ExternalLink className="size-4" aria-hidden />
                View site
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-danger-700 hover:bg-danger-50"
                >
                  <LogOut className="size-4" aria-hidden />
                  Sign out
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
