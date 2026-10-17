import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPathAllowed, type MenuEntry, type PageConfig } from './admin-access.ts'

// Mirrors the relevant parts of ALL_PAGES_CONFIG and MENU_STRUCTURE in app/admin/layout.tsx
const pages: Record<string, PageConfig> = {
  Dashboard: { href: '/admin/dashboard' },
  CRM: { href: '/admin/crm' },
  'Lead Dashboard': { href: '/admin/crm' },
  Communications: { href: '/admin/crm/communications' },
  Clients: { href: '/admin/crm/clients' },
  Jobs: { href: '/admin/jobs' },
  'HR Management': { href: '/admin/hr' },
  Payroll: { href: '/admin/hr/payroll' },
  Attendance: { href: '/admin/hr/attendance' },
  'Performance Dashboard': { href: '/admin/hr/performance-dashboard' },
  Finance: { href: '/admin/finance' },
  'Admin Management': { href: '/admin/admin-management' },
  'Role Manager': { href: '/admin/admin-management/role-manager' },
  'User Accounts': { href: '/admin/admin-management/user-accounts' },
  'AI Command Center': { href: '/admin/ai-command-center' },
  'AI Recommendations': { href: '/admin/ai-command-center/recommendations' },
}

const menu: MenuEntry[] = [
  { key: 'Dashboard' },
  { key: 'CRM', submenu: [{ key: 'Lead Dashboard' }, { key: 'Clients' }] },
  { key: 'Jobs' },
  { key: 'HR Management', submenu: [{ key: 'Attendance' }, { key: 'Payroll' }] },
  { key: 'Finance' },
  { key: 'Admin Management', submenu: [{ key: 'Role Manager' }] },
  { key: 'AI Command Center' },
]

const allowed = (path: string, pagesAllowed: string[]) => isPathAllowed(path, pagesAllowed, pages, menu)

test('allows assigned pages and their sub-routes', () => {
  assert.equal(allowed('/admin/jobs', ['Jobs']), true)
  assert.equal(allowed('/admin/jobs/abc123/task-progress', ['Jobs']), true)
})

test('blocks pages that are not assigned', () => {
  assert.equal(allowed('/admin/finance', ['Jobs']), false)
  assert.equal(allowed('/admin/admin-management/role-manager', ['Jobs']), false)
})

test('always allows the dashboard landing page', () => {
  assert.equal(allowed('/admin/dashboard', []), true)
})

test('does not match on partial path segments', () => {
  assert.equal(allowed('/admin/jobsx', []), true) // no permission key covers this path
  assert.equal(allowed('/admin/finance-report', []), true)
})

test('menu items are enforced individually inside a group', () => {
  assert.equal(allowed('/admin/hr/attendance', ['Attendance']), true)
  assert.equal(allowed('/admin/hr/payroll', ['Attendance']), false)
})

test('a group page is allowed when any of its items is allowed', () => {
  assert.equal(allowed('/admin/hr', ['Attendance']), true)
  assert.equal(allowed('/admin/hr', ['Jobs']), false)
})

test('pages outside the menu inherit their parent permission', () => {
  assert.equal(allowed('/admin/ai-command-center/recommendations', ['AI Command Center']), true)
  assert.equal(allowed('/admin/ai-command-center/recommendations', ['Jobs']), false)
  assert.equal(allowed('/admin/hr/performance-dashboard', ['Payroll']), true)
  assert.equal(allowed('/admin/admin-management/user-accounts', ['Role Manager']), true)
  assert.equal(allowed('/admin/crm/communications', ['Lead Dashboard']), true)
})

test('entries sharing an href are equivalent', () => {
  assert.equal(allowed('/admin/crm', ['Lead Dashboard']), true)
  assert.equal(allowed('/admin/crm/clients', ['Lead Dashboard']), false)
})

test('paths without a permission key remain accessible', () => {
  assert.equal(allowed('/admin/blog/new', []), true)
})
