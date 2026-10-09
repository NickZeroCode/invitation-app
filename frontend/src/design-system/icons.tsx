/**
 * Minimal stroke icon set (24×24 grid, currentColor).
 * Bare icons by design — no decorative containers behind them.
 */
export interface IconProps {
  className?: string
}

function base(className: string) {
  return {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  }
}

export function IconOverview({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="11" width="7" height="10" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconSettings({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 6h10" />
      <path d="M18 6h2" />
      <path d="M4 12h2" />
      <path d="M10 12h10" />
      <path d="M4 18h7" />
      <path d="M15 18h5" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="13" cy="18" r="2" />
    </svg>
  )
}

export function IconEvents({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="m12 13 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.2-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" />
    </svg>
  )
}

export function IconTemplates({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="3" width="8" height="18" rx="1.5" />
      <rect x="14" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconLogout({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export function IconChevronLeft({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function IconMenu({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}

export function IconClose({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  )
}

export function IconEye({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  )
}

export function IconEyeOff({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.1 3.9" />
      <path d="M6.5 7.9A16.6 16.6 0 0 0 2.5 12s3.5 6.5 9.5 6.5c1.2 0 2.3-.2 3.3-.6" />
      <path d="M10.1 10.2a2.75 2.75 0 0 0 3.7 3.8" />
    </svg>
  )
}

export function IconAlert({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2h.01" />
    </svg>
  )
}

export function IconCheck({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  )
}

export function IconInfo({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5" />
      <path d="M12 8.2h.01" />
    </svg>
  )
}

export function IconInbox({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 12h4l2 3h6l2-3h4" />
      <path d="M5.5 5h13l2.5 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2.5-7Z" />
    </svg>
  )
}

export function IconRefresh({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M20 11.5a8 8 0 1 0-.7 4.3" />
      <path d="M20 5.5v6h-6" />
    </svg>
  )
}

export function IconSidebar({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M9.5 4v16" />
    </svg>
  )
}

export function IconPlus({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconSearch({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  )
}

export function IconUsers({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
      <path d="M15.5 4.9a3.25 3.25 0 0 1 0 6.2" />
      <path d="M17.5 14.7c1.8.6 3.1 2.1 3.5 4.8" />
    </svg>
  )
}

export function IconMail({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  )
}

export function IconChart({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </svg>
  )
}

export function IconEdit({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  )
}

export function IconTrash({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

export function IconLink({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  )
}

export function IconDownload({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 4v11" />
      <path d="m7 10.5 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

export function IconBan({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function IconMore({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="5.5" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconArrowRight({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export function IconCalendar({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  )
}

export function IconPin({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  )
}

export function IconType({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 7V5h14v2" />
      <path d="M12 5v14M9 19h6" />
    </svg>
  )
}

export function IconImage({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="m20.5 16-4.8-4.8L6 19.5" />
    </svg>
  )
}

export function IconShirt({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M9 3.5 4 6l1.6 4.2L8 9.4V20.5h8V9.4l2.4.8L20 6l-5-2.5a3 3 0 0 1-6 0Z" />
    </svg>
  )
}

export function IconClock({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function IconQuestion({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4.5 18.5V6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H8l-3.5 2Z" />
      <path d="M9.8 8.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 1.9-2.2 3" />
      <path d="M12 14.6h.01" />
    </svg>
  )
}

export function IconSparkle({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3.5 13.7 10.3 20.5 12l-6.8 1.7L12 20.5l-1.7-6.8L3.5 12l6.8-1.7Z" />
    </svg>
  )
}

export function IconPalette({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.7-1.1-2.9 0-1 .8-1.6 1.8-1.6h2.2a3.8 3.8 0 0 0 3.8-3.8c0-3.9-3.8-7-8.5-7Z" />
      <circle cx="7.8" cy="11.3" r="1" fill="currentColor" />
      <circle cx="10.4" cy="7.6" r="1" fill="currentColor" />
      <circle cx="14.9" cy="7.9" r="1" fill="currentColor" />
    </svg>
  )
}

export function IconPhone({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="6.5" y="2.75" width="11" height="18.5" rx="2.25" />
      <path d="M11 18h2" />
    </svg>
  )
}

export function IconMonitor({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3" y="4" width="18" height="12.5" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </svg>
  )
}

export function IconExternal({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </svg>
  )
}
