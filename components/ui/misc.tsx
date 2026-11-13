import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox, type LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn, initials, mediaUrl } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-soft", className)} {...props} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-navy-50", className)} aria-hidden />;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="size-6" aria-hidden />
      </div>
      <h3 className="text-base font-bold text-navy-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-body">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({
  name,
  path,
  size = 40,
  className,
}: {
  name: string;
  path?: string | null;
  size?: number;
  className?: string;
}) {
  const src = mediaUrl(path);
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-100 to-sky-soft font-bold text-brand-700",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-body">
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-navy-300" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="truncate transition-colors hover:text-brand-700">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-semibold text-navy-800">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Link-based pagination: keeps current search params and swaps `page`. */
export function Pagination({
  page,
  pageCount,
  hrefFor,
  total,
  pageSize,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  total: number;
  pageSize: number;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );
  const item = "grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-body">
        Showing <span className="font-semibold text-navy-800">{from}</span>–
        <span className="font-semibold text-navy-800">{to}</span> of{" "}
        <span className="font-semibold text-navy-800">{total}</span>
      </p>
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={cn(item, "bg-white ring-1 ring-line hover:bg-muted")} aria-label="Previous page">
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(item, "bg-white text-navy-300 ring-1 ring-line")} aria-hidden>
              <ChevronLeft className="size-4" />
            </span>
          )}
        </li>
        {pages.map((p, i) => (
          <li key={p} className="flex items-center gap-1">
            {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-body">…</span>}
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(item, p === page ? "bg-navy-800 text-white" : "bg-white text-navy-800 ring-1 ring-line hover:bg-muted")}
            >
              {p}
            </Link>
          </li>
        ))}
        <li>
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)} className={cn(item, "bg-white ring-1 ring-line hover:bg-muted")} aria-label="Next page">
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : (
            <span className={cn(item, "bg-white text-navy-300 ring-1 ring-line")} aria-hidden>
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
