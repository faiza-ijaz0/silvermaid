// lib/admin-access.ts
// Applies a user's allowedPages to admin URLs, mirroring what the admin sidebar shows.
// This is a UI guard only: Firestore security rules must protect the data itself.

export interface PageConfig {
  href: string
}

export interface MenuEntry {
  key: string
  submenu?: { key: string }[]
}

// Always reachable so that users land somewhere after sign-in.
const ALWAYS_ALLOWED = ['Dashboard']

// Pages not in the menu inherit their closest parent's permission; pages without any
// permission key are left accessible, as before this guard existed.
export function isPathAllowed(
  path: string,
  allowedPages: string[],
  pages: Record<string, PageConfig>,
  menu: MenuEntry[],
): boolean {
  const allowed = new Set([...allowedPages, ...ALWAYS_ALLOWED])
  const menuKeys = new Set<string>()
  for (const entry of menu) {
    menuKeys.add(entry.key)
    for (const sub of entry.submenu ?? []) menuKeys.add(sub.key)
    // A group is visible when any of its items is allowed
    if (entry.submenu?.some((sub) => allowed.has(sub.key))) allowed.add(entry.key)
  }

  const matches = Object.entries(pages)
    .filter(([, page]) => path === page.href || path.startsWith(`${page.href}/`))
    .sort(([, a], [, b]) => b.href.length - a.href.length)

  if (matches.length === 0) return true

  for (const [key, page] of matches) {
    if (allowed.has(key)) return true
    if (menuKeys.has(key)) {
      // Entries sharing the same href (e.g. CRM and Lead Dashboard) are equivalent
      return matches.some(([otherKey, other]) => other.href === page.href && allowed.has(otherKey))
    }
  }
  return false
}
