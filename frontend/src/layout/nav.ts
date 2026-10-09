import type { ReactElement } from 'react'

import {
  IconEvents,
  IconOverview,
  IconSettings,
  IconTemplates,
  type IconProps,
} from '../design-system/index.ts'
import { fr } from '../locales/fr.ts'

export interface NavItem {
  to: string
  label: string
  /** Short label for the mobile tab bar. */
  shortLabel: string
  icon: (props: IconProps) => ReactElement
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/accueil', label: fr.nav.overview, shortLabel: fr.nav.overviewShort, icon: IconOverview, end: true },
  { to: '/evenements', label: fr.nav.events, shortLabel: fr.nav.events, icon: IconEvents },
  { to: '/modeles', label: fr.nav.templates, shortLabel: fr.nav.templates, icon: IconTemplates },
  { to: '/parametres', label: fr.nav.settings, shortLabel: fr.nav.settingsShort, icon: IconSettings },
]

export const COLLAPSE_KEY = 'nickevents.sidebar.collapsed'

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** The event editor is a full-bleed workspace (no centered page column). */
export function isWorkspaceRoute(pathname: string): boolean {
  return /^\/evenements\/(nouveau|\d+)\/?$/.test(pathname)
}
