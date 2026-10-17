// lib/booking-email.ts
// Validation and email rendering for /api/send-booking-email.
// Kept free of path aliases and framework imports so it can be unit tested with `node --test`.

export const MAX_BODY_BYTES = 10_000

const FREQUENCIES = ['once', 'weekly', 'biweekly'] as const
type Frequency = (typeof FREQUENCIES)[number]

const FREQUENCY_LABELS: Record<Frequency, string> = {
  once: 'One-Time',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
}

export interface BookingEmailData {
  bookingId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  message: string
  propertyType: string
  area: string
  frequency: Frequency
  staffName: string
  staffId: string
}

export type ValidationResult =
  | { ok: true; data: BookingEmailData }
  | { ok: false; errors: string[] }

// Escapes text for use in HTML element content and quoted attribute values.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Removes CR/LF and other control characters so values are safe in headers such as Subject.
export function toSingleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim()
}

const BOOKING_ID_PATTERN = /^BK\d{10,20}$/
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/
// The booking form uses a free-form tel input, so only require a plausible number of digits.
const MIN_PHONE_DIGITS = 6

type FieldRule = { key: keyof BookingEmailData; required: boolean; max: number; multiline?: boolean }

const FIELD_RULES: FieldRule[] = [
  { key: 'bookingId', required: true, max: 32 },
  { key: 'clientName', required: true, max: 100 },
  { key: 'clientEmail', required: true, max: 254 },
  { key: 'clientPhone', required: true, max: 25 },
  { key: 'serviceName', required: true, max: 150 },
  { key: 'bookingDate', required: true, max: 40 },
  { key: 'bookingTime', required: false, max: 20 },
  { key: 'message', required: false, max: 2000, multiline: true },
  { key: 'propertyType', required: false, max: 50 },
  { key: 'area', required: false, max: 150 },
  { key: 'staffName', required: false, max: 100 },
  { key: 'staffId', required: false, max: 64 },
]

export function validateBookingPayload(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, errors: ['Request body must be a JSON object'] }
  }

  const input = body as Record<string, unknown>
  const errors: string[] = []
  const values: Record<string, string> = {}

  // Older clients sent the staff name as `selectedStaff`.
  const raw: Record<string, unknown> = { ...input, staffName: input.staffName ?? input.selectedStaff }

  for (const rule of FIELD_RULES) {
    const value = raw[rule.key]
    if (value === undefined || value === null || value === '') {
      if (rule.required) errors.push(`${rule.key} is required`)
      values[rule.key] = ''
      continue
    }
    if (typeof value !== 'string') {
      errors.push(`${rule.key} must be a string`)
      continue
    }
    const cleaned = rule.multiline ? value.replace(/\r\n?/g, '\n').trim() : toSingleLine(value)
    if (rule.required && cleaned === '') errors.push(`${rule.key} is required`)
    if (cleaned.length > rule.max) errors.push(`${rule.key} must be at most ${rule.max} characters`)
    values[rule.key] = cleaned
  }

  if (values.bookingId && !BOOKING_ID_PATTERN.test(values.bookingId)) errors.push('bookingId is invalid')
  if (values.clientEmail && !EMAIL_PATTERN.test(values.clientEmail)) errors.push('clientEmail is invalid')
  if (values.clientPhone && values.clientPhone.replace(/\D/g, '').length < MIN_PHONE_DIGITS) {
    errors.push('clientPhone is invalid')
  }

  const frequencyInput = input.frequency ?? 'once'
  if (typeof frequencyInput !== 'string' || !FREQUENCIES.includes(frequencyInput as Frequency)) {
    errors.push('frequency is invalid')
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: { ...(values as Omit<BookingEmailData, 'frequency'>), frequency: frequencyInput as Frequency },
  }
}

export function buildBookingEmail(data: BookingEmailData): { subject: string; html: string; text: string } {
  const e = (value: string) => escapeHtml(value)
  const staffAssigned = data.staffName !== ''
  const frequency = FREQUENCY_LABELS[data.frequency]

  const subject = toSingleLine(
    staffAssigned
      ? `📋 ${data.clientName} - ${data.serviceName} (Staff: ${data.staffName}) #${data.bookingId}`
      : `📋 ${data.clientName} - ${data.serviceName} #${data.bookingId}`,
  ).slice(0, 250)

  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Notification - SilverMaid</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
          .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #eaeaea; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
          .content { padding: 30px; }
          .booking-id { background: #f3f4f6; padding: 15px 20px; border-radius: 12px; margin-bottom: 25px; font-size: 18px; font-weight: 600; border-left: 4px solid #667eea; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: 600; color: #6b7280; font-size: 13px; text-transform: uppercase; margin-bottom: 5px; }
          .value { font-size: 16px; color: #1f2937; font-weight: 500; background: #f9fafb; padding: 8px 12px; border-radius: 8px; }
          .message { white-space: pre-wrap; }

          /* STAFF SECTION HIGHLIGHT */
          .staff-section {
            background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
            border: 2px solid #0284c7;
            border-radius: 12px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
          }
          .staff-name-large {
            font-size: 24px;
            font-weight: 800;
            color: #0369a1;
            margin: 10px 0;
          }
          .staff-badge {
            background: #0284c7;
            color: white;
            padding: 6px 16px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 600;
            display: inline-block;
          }
          .divider { height: 1px; background: #e5e7eb; margin: 25px 0; }
          .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 16px; border-radius: 30px; font-size: 14px; font-weight: 600; }
          .footer { text-align: center; padding: 25px; background: #f9fafb; color: #6b7280; font-size: 13px; border-top: 1px solid #eaeaea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ New Booking Received</h1>
          </div>
          <div class="content">
            <div class="booking-id">
              Booking ID: #${e(data.bookingId)}
            </div>

            <div class="info-grid">
              <div class="field">
                <div class="label">👤 Client</div>
                <div class="value">${e(data.clientName)}</div>
              </div>
              <div class="field">
                <div class="label">📞 Phone</div>
                <div class="value">${e(data.clientPhone)}</div>
              </div>
            </div>

            <div class="field">
              <div class="label">📧 Email</div>
              <div class="value">${e(data.clientEmail)}</div>
            </div>

            <div class="divider"></div>

            <div class="field">
              <div class="label">🔧 Service</div>
              <div class="value">${e(data.serviceName)}</div>
            </div>

            ${staffAssigned ? `
            <div class="staff-section">
              <div class="label" style="color: #0369a1;">👥 ASSIGNED PROFESSIONAL</div>
              <div class="staff-name-large">${e(data.staffName)}</div>
              ${data.staffId ? `<p style="font-size: 14px; color: #0369a1; margin: 5px 0;">ID: ${e(data.staffId.substring(0, 8))}...</p>` : ''}
              <span class="staff-badge">⭐ Certified & Verified</span>
            </div>
            ` : `
            <div class="field">
              <div class="label">👥 Staff</div>
              <div class="value" style="color: #9ca3af; font-style: italic;">To be assigned</div>
            </div>
            `}

            <div class="info-grid">
              <div class="field">
                <div class="label">🏠 Property</div>
                <div class="value">${e(data.propertyType || 'Not specified')}</div>
              </div>
              <div class="field">
                <div class="label">📍 Location</div>
                <div class="value">${e(data.area || 'Not specified')}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="field">
                <div class="label">🔄 Frequency</div>
                <div class="value">${e(frequency)}</div>
              </div>
              <div class="field">
                <div class="label">📅 Date</div>
                <div class="value">${e(data.bookingDate)}</div>
              </div>
            </div>

            <div class="field">
              <div class="label">⏰ Time</div>
              <div class="value">${e(data.bookingTime || 'Not specified')}</div>
            </div>

            ${data.message ? `
            <div class="divider"></div>
            <div class="field">
              <div class="label">📝 Notes</div>
              <div class="value message">${e(data.message)}</div>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 25px;">
              <span class="status-badge">⏳ PENDING</span>
            </div>
          </div>
          <div class="footer">
            <p>SilverMaid Booking System</p>
          </div>
        </div>
      </body>
      </html>
    `

  const text = [
    `New booking #${data.bookingId}`,
    `Client: ${data.clientName}`,
    `Phone: ${data.clientPhone}`,
    `Email: ${data.clientEmail}`,
    `Service: ${data.serviceName}`,
    `Staff: ${staffAssigned ? data.staffName : 'To be assigned'}`,
    `Property: ${data.propertyType || 'Not specified'}`,
    `Location: ${data.area || 'Not specified'}`,
    `Frequency: ${frequency}`,
    `Date: ${data.bookingDate}`,
    `Time: ${data.bookingTime || 'Not specified'}`,
    ...(data.message ? ['', 'Notes:', data.message] : []),
  ].join('\n')

  return { subject, html, text }
}

// Best-effort, per-instance protection against spam and duplicate sends. Serverless
// instances do not share memory, so this complements (not replaces) platform rate limiting.
export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>()
  private readonly limit: number
  private readonly windowMs: number

  constructor(limit: number, windowMs: number) {
    this.limit = limit
    this.windowMs = windowMs
  }

  allow(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs)
    if (recent.length >= this.limit) {
      this.hits.set(key, recent)
      return false
    }
    recent.push(now)
    this.hits.set(key, recent)
    if (this.hits.size > 5000) this.prune(now)
    return true
  }

  private prune(now: number) {
    for (const [key, times] of this.hits) {
      if (times.every((t) => now - t >= this.windowMs)) this.hits.delete(key)
    }
  }
}

export class RecentKeys {
  private seen = new Map<string, number>()
  private readonly ttlMs: number

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs
  }

  // Returns true the first time a key is seen within the TTL.
  claim(key: string, now = Date.now()): boolean {
    for (const [k, t] of this.seen) {
      if (now - t >= this.ttlMs) this.seen.delete(k)
    }
    if (this.seen.has(key)) return false
    this.seen.set(key, now)
    return true
  }

  release(key: string) {
    this.seen.delete(key)
  }
}
