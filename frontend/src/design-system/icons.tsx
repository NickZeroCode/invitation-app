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
