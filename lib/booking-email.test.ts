import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  RecentKeys,
  SlidingWindowLimiter,
  buildBookingEmail,
  escapeHtml,
  toSingleLine,
  validateBookingPayload,
  type BookingEmailData,
} from './booking-email.ts'

const validPayload = {
  bookingId: 'BK1760700000000123',
  clientName: 'Aisha Khan',
  clientEmail: 'aisha@example.com',
  clientPhone: '+971 50 123 4567',
  serviceName: 'Villa Deep Cleaning',
  bookingDate: '2026-10-20',
  bookingTime: '10:30',
  message: 'Please bring ladders.',
  propertyType: 'villa',
  area: 'Jumeirah',
  frequency: 'weekly',
  staffName: 'Maria',
  staffId: 'abc123def456',
  source: 'book-service-page',
}

function valid(overrides: Record<string, unknown> = {}): BookingEmailData {
  const result = validateBookingPayload({ ...validPayload, ...overrides })
  assert.ok(result.ok, `expected payload to be valid: ${JSON.stringify(!result.ok && result.errors)}`)
  return result.data
}

test('escapeHtml escapes markup and quote characters', () => {
  assert.equal(escapeHtml(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;')
})

test('toSingleLine removes CR/LF and control characters', () => {
  assert.equal(toSingleLine('Hello\r\nBcc: attacker@example.com\t!'), 'Hello Bcc: attacker@example.com !')
})

test('accepts the payload sent by the booking form', () => {
  const data = valid()
  assert.equal(data.clientName, 'Aisha Khan')
  assert.equal(data.frequency, 'weekly')
})

test('defaults frequency to once and treats missing optional fields as empty', () => {
  const data = valid({ frequency: undefined, message: undefined, staffName: null, staffId: '' })
  assert.equal(data.frequency, 'once')
  assert.equal(data.message, '')
  assert.equal(data.staffName, '')
})

test('falls back to the legacy selectedStaff field', () => {
  assert.equal(valid({ staffName: undefined, selectedStaff: 'Legacy Name' }).staffName, 'Legacy Name')
})

test('rejects non-object bodies', () => {
  for (const body of [null, 'text', 42, ['a']]) {
    assert.equal(validateBookingPayload(body).ok, false)
  }
})

test('rejects missing required fields', () => {
  const result = validateBookingPayload({ ...validPayload, clientName: '   ', serviceName: undefined })
  assert.equal(result.ok, false)
  assert.ok(!result.ok && result.errors.includes('clientName is required'))
  assert.ok(!result.ok && result.errors.includes('serviceName is required'))
})

test('rejects malformed values', () => {
  const cases: Record<string, unknown>[] = [
    { bookingId: '<script>' },
    { clientEmail: 'not-an-email' },
    { clientPhone: 'call me' },
    { frequency: 'daily' },
    { clientName: { toString: 'x' } },
    { message: 'x'.repeat(2001) },
  ]
  for (const overrides of cases) {
    assert.equal(validateBookingPayload({ ...validPayload, ...overrides }).ok, false, JSON.stringify(overrides))
  }
})

test('escapes customer-controlled values in the HTML email', () => {
  const data = valid({
    clientName: '<script>alert(1)</script>',
    message: '<img src=x onerror=alert(1)>\n"quoted"',
    area: `"><a href="https://evil.example">click</a>`,
    staffName: '<b>Staff</b>',
  })
  const { html, text } = buildBookingEmail(data)

  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(!html.includes('<img src=x'))
  assert.ok(!html.includes('<a href="https://evil.example">'))
  assert.ok(!html.includes('<b>Staff</b>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
  assert.ok(html.includes('&quot;&gt;&lt;a href=&quot;https://evil.example&quot;&gt;'))
  // The plain-text part is not HTML, so it keeps the original characters.
  assert.ok(text.includes('<script>alert(1)</script>'))
})

test('builds a single-line subject', () => {
  const data = valid({ clientName: 'Aisha Khan', staffName: 'Maria' })
  const { subject } = buildBookingEmail(data)
  assert.equal(subject, '📋 Aisha Khan - Villa Deep Cleaning (Staff: Maria) #BK1760700000000123')
  assert.ok(!/[\r\n]/.test(subject))
})

test('omits the staff section when no staff is assigned', () => {
  const { html, subject } = buildBookingEmail(valid({ staffName: '', staffId: '' }))
  assert.ok(html.includes('To be assigned'))
  assert.ok(!html.includes('ASSIGNED PROFESSIONAL'))
  assert.ok(!subject.includes('Staff:'))
})

test('SlidingWindowLimiter blocks after the limit and recovers after the window', () => {
  const limiter = new SlidingWindowLimiter(2, 1000)
  assert.equal(limiter.allow('ip', 0), true)
  assert.equal(limiter.allow('ip', 10), true)
  assert.equal(limiter.allow('ip', 20), false)
  assert.equal(limiter.allow('other-ip', 20), true)
  assert.equal(limiter.allow('ip', 1001), true)
})

test('RecentKeys detects duplicates, supports release, and expires', () => {
  const keys = new RecentKeys(1000)
  assert.equal(keys.claim('BK1', 0), true)
  assert.equal(keys.claim('BK1', 10), false)
  keys.release('BK1')
  assert.equal(keys.claim('BK1', 20), true)
  assert.equal(keys.claim('BK1', 1020), true)
})
