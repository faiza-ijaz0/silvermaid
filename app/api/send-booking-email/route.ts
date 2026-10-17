import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  MAX_BODY_BYTES,
  RecentKeys,
  SlidingWindowLimiter,
  buildBookingEmail,
  validateBookingPayload,
} from '@/lib/booking-email';

// Best-effort, per-instance limits (see lib/booking-email.ts). Durable limits belong in the
// hosting layer, e.g. a Vercel Firewall rate-limit rule on this path.
const limiter = new SlidingWindowLimiter(5, 10 * 60 * 1000);
const sentBookings = new RecentKeys(24 * 60 * 60 * 1000);

function jsonError(error: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ success: false, error }, { status, headers });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  if (!limiter.allow(clientIp(request))) {
    return jsonError('Too many requests. Please try again later.', 429, { 'Retry-After': '600' });
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return jsonError('Content-Type must be application/json', 415);
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonError('Request body is too large', 413);
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return jsonError('Request body is too large', 413);
    }
    body = JSON.parse(raw);
  } catch {
    return jsonError('Request body must be valid JSON', 400);
  }

  const validation = validateBookingPayload(body);
  if (!validation.ok) {
    return NextResponse.json(
      { success: false, error: 'Invalid booking details', details: validation.errors },
      { status: 400 }
    );
  }
  const booking = validation.data;

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const notificationEmail = process.env.BOOKING_NOTIFICATION_EMAIL;

  if (!gmailUser || !gmailAppPassword || !notificationEmail) {
    console.error('Booking email not configured: set GMAIL_USER, GMAIL_APP_PASSWORD and BOOKING_NOTIFICATION_EMAIL');
    return jsonError('Email service is temporarily unavailable', 503);
  }

  // A booking notification is sent at most once per booking ID (per server instance).
  if (!sentBookings.claim(booking.bookingId)) {
    return NextResponse.json({ success: true, duplicate: true, staffName: booking.staffName });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  const { subject, html, text } = buildBookingEmail(booking);

  try {
    await transporter.sendMail({
      from: `"SilverMaid" <${gmailUser}>`,
      to: notificationEmail,
      replyTo: booking.clientEmail,
      subject,
      html,
      text,
    });
  } catch (error: unknown) {
    sentBookings.release(booking.bookingId);
    const code = (error as { code?: string; responseCode?: number })?.code ?? 'UNKNOWN';
    const responseCode = (error as { responseCode?: number })?.responseCode;
    console.error(`Booking email failed for ${booking.bookingId}: ${code}${responseCode ? ` (${responseCode})` : ''}`);
    return jsonError('Failed to send notification email', 502);
  }

  return NextResponse.json({ success: true, staffName: booking.staffName });
}
