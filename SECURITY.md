# Security

This document describes Silvermaid's security model, what has been hardened, what remains open, and the manual actions that must be taken outside the codebase. Last reviewed: 17 October 2026.

## Security model

Almost all data access happens **directly from the browser to Cloud Firestore** through the Firebase Web SDK. The Firebase web configuration in `lib/firebase.ts` is public by design, so anyone can call Firestore with it, bypassing the application UI entirely.

As a result:

- **Firestore and Storage security rules are the only real access control.** Code in this repository can improve the UI, but it cannot stop a determined user from reading or writing data the rules allow.
- The rules are managed in the Firebase console and are **not stored in this repository**, so they could not be reviewed as part of this audit.
- The only server-side code is `app/api/send-booking-email/route.ts`.

## Hardened in this repository

| Area | Change |
| --- | --- |
| Booking email credentials | Read only from server-side environment variables (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `BOOKING_NOTIFICATION_EMAIL`); never sent to the browser. |
| Booking email endpoint | Validates the JSON body (types, lengths, booking ID, email, phone, frequency). Escapes every customer-supplied value before it goes into the HTML email, and strips line breaks from the subject. Rejects bodies over 10 KB. Returns `400`/`413`/`415`/`429`/`502`/`503` with generic messages, and logs only error codes and booking IDs, never customer details. |
| Abuse protection | Per-instance limit of 5 requests per IP per 10 minutes, and duplicate suppression per booking ID for 24 hours (see the limitations below). |
| Admin portal | Before any admin page renders, the layout verifies the visitor through Firebase Auth and re-reads their `users-role` record instead of trusting `localStorage`. `allowedPages` is now enforced on direct URL navigation as well as in the sidebar (`lib/admin-access.ts`). |
| Employee portal | The new `app/employee/layout.tsx` does the same verification. It also refreshes the stored session, so pages use the `employeeId` from the user's own record. |
| Deleted users | `getUserRole` treats `users-role` records marked `deleted` as missing. Before, such records fell back to the admin portal. |
| Debug code | Removed the public `/debug/auth` page, `lib/auth-test.ts`, and the hard-coded `DEMO_CREDENTIALS`. |
| Dependencies | Upgraded `next` (16.1.0 → 16.4.2), `jspdf` (3 → 4.2.1) and `nodemailer` (8 → 10.1.2), and applied `npm audit fix` to transitive packages. |

## Required manual actions

These cannot be done from the codebase and are listed in priority order.

### 1. Revoke the exposed Gmail App Password (Google Account)

A Gmail App Password for `notificationfromsilvermaid@gmail.com` was committed in `050b0c7` and is still readable in the public Git history. Removing it from the current code does not remove it from history.

1. Sign in to that Google account → **Security → 2-Step Verification → App passwords**.
2. Revoke the existing app password.
3. Create a new one for "Silvermaid booking notifications".
4. Review **Security → Recent security activity** and the account's **Sent** folder for unexpected use.

Rewriting Git history is not recommended here: the repository is public, so the old value must be assumed copied already. Revocation is the fix.

### 2. Configure the booking email in Vercel

In **Vercel → Project → Settings → Environment Variables**, set these for Production (and Preview if needed), then redeploy:

| Variable | Value |
| --- | --- |
| `GMAIL_USER` | The sending Gmail address |
| `GMAIL_APP_PASSWORD` | The new App Password from step 1 |
| `BOOKING_NOTIFICATION_EMAIL` | The inbox that should receive booking notifications |

After redeploying, make one real booking on the live site and confirm the email arrives. Until then, email delivery has not been verified.

### 3. Add a rate-limit rule in Vercel

The in-code rate limiter is per serverless instance and resets on cold starts, so it reduces but does not prevent spam. In **Vercel → Project → Firewall**, add a rate-limit rule for `POST /api/send-booking-email`, for example 5 requests per IP per 10 minutes.

### 4. Review and tighten Firestore and Storage rules (Firebase console)

Open **Firebase console → Firestore Database → Rules** and **Storage → Rules**. If either still says `allow read, write: if true;` or uses a time-limited test-mode rule, all business data is publicly readable and writable, regardless of the UI changes above.

The rules need to support the current application flows:

| Who | Needs | Collections |
| --- | --- | --- |
| Anyone (public site) | read | `services`, `blog-post`, `faq`, `privacy-policy`, `testimonials`, `employees` (booking form staff list) |
| Anyone (public site) | create only | `bookings`, `process-inquiry`, `survey_submissions` |
| Anyone (survey link) | read, constrained update | `surveys` (`app/survey/[id]/page.tsx` updates the survey document) |
| Signed-in employee | own records only | `attendance`, `leave-management`, `payroll`, `employeeMessages`, `employeeReplies`, matched by the `employeeId` in their `users-role` document |
| Signed-in admin (`users-role/{uid}.portal == 'admin'`) | read/write | all business collections |
| Admins only | write | `users-role`. **This is the most important rule.** Otherwise anyone can create an Auth account with the public API key and give themselves `portal: 'admin'`. |

Known blockers to deploying strict rules safely:

- **Role Manager creates users in the browser.** `createUserWithRole` calls `createUserWithEmailAndPassword`, which signs the browser in as the *new* user. The follow-up write to `users-role` therefore runs as that new user, and an admin-only rule on `users-role` would block it. It also signs the admin out. Fix this before enforcing admin-only writes, either by moving user creation to a server route using the Firebase Admin SDK, or by creating users through a secondary Firebase app instance.
- **Legacy `users-role` documents without a `portal` field** are treated as admins by `getUserRole`. Add `portal` to every document before writing rules that check it.
- **Public `employees` reads** expose every field stored on employee documents. Consider publishing only the fields the booking form needs (for example, name and status) to a separate public collection.

Test any rule changes in the **Rules Playground** or the Firebase Emulator with these flows before publishing: public booking, survey submission, admin sign-in, Role Manager user creation, and employee sign-in.

### 5. Restrict the Firebase API key (Google Cloud console)

In **Google Cloud console → APIs & Services → Credentials**, edit the browser key used in `lib/firebase.ts`:

- Under **Application restrictions → Websites**, allow only `silvermaid-cg2i.vercel.app`, any custom domain, and `localhost:3000` for development.
- Under **API restrictions**, limit the key to the Firebase APIs the app uses (Identity Toolkit, Cloud Firestore, Firebase Installations, Firebase Storage and Firebase Analytics-related APIs).

Also consider enabling **Firebase App Check** for Firestore and Storage.

## Known open issues

- **Authorization is not server-enforced.** The portal checks above are UI guards. Data protection depends entirely on the Firestore rules (see step 4).
- **Unprotected manager, client and guest pages.** These pages under `app/manager`, `app/client` and `app/guest` have no working sign-in (their login pages are empty placeholders) and are not gated. Whether they should require an admin session, or be removed, is a product decision. Any data they query is protected only by Firestore rules.
- **Dashboard is always reachable.** The admin dashboard is always allowed for signed-in admins, so users keep a landing page after sign-in.
- **Rate limiting and duplicate suppression are best-effort.** They are in-memory and per instance. Use the Vercel Firewall (step 3) for durable limits.
- **Remaining `npm audit` findings (5 high, 0 critical):**
  - `@grpc/grpc-js@1.9.16` reaches `firebase` through `@firebase/firestore`, which pins `~1.9.0` even in its latest release (4.18.0). There is no compatible upstream fix yet, and npm's suggested "fix" is a downgrade to `firebase@9.14.0`, which is not appropriate. The advisories concern gRPC servers and certificate handling. The browser build of Firestore uses WebChannel, not gRPC. Re-check when Firebase releases an update.
  - `xlsx@0.18.5` has no fixed version on npm. Its advisories (prototype pollution, ReDoS) affect **parsing** spreadsheets. This app only **writes** spreadsheets (`aoa_to_sheet` and `writeFile` in `app/admin/report/page.tsx`) and never reads user-supplied files, so the vulnerable code paths are not reachable. If spreadsheet import is ever added, first switch to the patched build SheetJS distributes from its own CDN (`https://cdn.sheetjs.com/`).

## Reporting a vulnerability

Please report security issues privately to the repository owner via GitHub ([faiza-ijaz0](https://github.com/faiza-ijaz0)) rather than opening a public issue.
