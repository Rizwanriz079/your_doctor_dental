import type { SocialLinks } from "@/lib/types";

const common = { viewBox: "0 0 24 24", "aria-hidden": true, className: "size-[18px]" } as const;

const ICONS: Record<keyof SocialLinks, React.ReactNode> = {
  instagram: (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg {...common} fill="currentColor">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3Z" />
    </svg>
  ),
  x: (
    <svg {...common} fill="currentColor">
      <path d="M17.6 3h3.1l-6.8 7.7L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.7 3h6.4l4.4 5.9L17.6 3Zm-1.1 16.2h1.7L7.6 4.7H5.8l10.7 14.5Z" />
    </svg>
  ),
  youtube: (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10.5 9.5 4 2.5-4 2.5v-5Z" fill="currentColor" />
    </svg>
  ),
  linkedin: (
    <svg {...common} fill="currentColor">
      <path d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3 9h3v12H3V9Zm6 0h2.9v1.7c.4-.8 1.5-1.9 3.4-1.9 3.1 0 3.7 2 3.7 4.7V21h-3v-6.6c0-1.6 0-3.5-2.2-3.5s-2.5 1.7-2.5 3.4V21H9V9Z" />
    </svg>
  ),
  tiktok: (
    <svg {...common} fill="currentColor">
      <path d="M16.6 3c.4 2.2 1.8 3.6 4 3.8v3.1c-1.5 0-2.8-.4-4-1.2v6.1c0 3.3-2.6 5.7-5.8 5.7a5.7 5.7 0 0 1-.8-11.4v3.2a2.6 2.6 0 1 0 1.8 2.5V3h4.8Z" />
    </svg>
  ),
};

const LABELS: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export function SocialIcons({ links, className }: { links: SocialLinks; className?: string }) {
  const entries = (Object.keys(ICONS) as (keyof SocialLinks)[]).filter((k) => links[k]);
  if (entries.length === 0) return null;
  return (
    <ul className={className ?? "flex flex-wrap gap-2"}>
      {entries.map((key) => (
        <li key={key}>
          <a
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${LABELS[key]} (opens in a new tab)`}
            className="grid size-11 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white hover:text-navy-800"
          >
            {ICONS[key]}
          </a>
        </li>
      ))}
    </ul>
  );
}
