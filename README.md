# TeleDoc — Telemedicine & Virtual Care Platform

A telemedicine web app with a **Liquid Glass + Bento** UI: role-based portals for **patients, doctors and admins**, guided medical intake, doctor discovery with symptom matching, 5-minute timed Card/UPI checkout, real video visits, digital prescriptions, health-records vault, and platform governance — with bcrypt auth, rate limiting, lockouts and audit logging built in.

> Starts with **zero demo data**. Register real accounts to use it. Data persists in the browser (`localStorage`, `teledoc_v2_*` keys).

---

## 1. Patient journey (front page → intake → consultations)

The patient portal is deliberately ordered:

1. **Front page (`Home`)** — hero with the 3-step path, live intake-progress bar, next-appointment card, platform stats (verified doctors, specialties, my consultations, records), care-by-specialty grid, and trust strip. This is the landing tab after login, registration, role-switch and logout.
2. **Patient information & medical intake (`Medical Intake` tab)** — contact details, date of birth, blood group, allergies, chronic conditions, medications, surgeries, family history, emergency contact, JPG display picture, plus password management. A 6-item checklist (name, email, phone, DOB, emergency-contact name + phone) drives the progress % shown on the front page.
3. **Consultations (`Find Doctors`, `My Consultations`)** — until intake is complete, the directory shows a "Step 1 pending" banner linking back to intake. Booking itself validates patient name + email.

### Patient registration & login (`AuthModal`)
- **Register**: full name, email, phone, DOB, blood group, JPG avatar, strong password (min 8, upper + lower + digit + special) with confirm-match check. Creates the patient profile and signs in.
- **Login**: real credential check — email + bcrypt password verification with rate limiting (10 req/min/IP), 5-strike 15-min lockout, progressive delays (1s→30s), CAPTCHA challenge after 3 failures, and timing-equalized responses (CWE-204). Unknown email → "register first".
- **Reset password**: via old-password verification, or email-link flow issuing a temporary password + reset token.
- Guest browsing (no login) is allowed for the directory; booking/records need an account.

## 2. Doctor flow

- **Register**: name, work email, phone, specialization, license number, hospital, experience, fee, qualifications, bio, JPG headshot. New doctors start as **`pending`** — hidden from patients until an admin approves.
- **Login**: same hardened pipeline as patients (bcrypt, lockout, CAPTCHA).
- **Doctor Console**: consultation queue (waiting / in-consultation / scheduled / completed with join + prescribe actions), **schedule & slots manager** (recurring days, hours, slot duration, fee, blocked dates), **practice analytics** (revenue, utilization, monthly trends, unique patients), **digital prescription pad** (diagnosis, vitals, medications, advice, follow-up, digital signature — marks the appointment completed), and an **Edit Profile** panel (phone, hospital, fee clamped to platform limits, bio, languages) plus JPG photo update.

## 3. Admin flow

- **Register**: name, email, password, phone, department + **enrollment passcode** (allowlist only: `TELEDOC-ADMIN-2026`, `TELEDOC-BOARD-2026`, `MED-BOARD-SECURE-2026`). Invalid codes are rejected and audit-logged.
- **Login**: hardened pipeline, same as above.
- **Oversight console**: KPI banner (volume, net revenue, practitioners, refunds), **doctor approvals** (approve/suspend with audit trail), **bookings & disputes** (force-refund with reason, force-complete), **platform config** (refund window, commission %, fee caps — validated), **immutable audit log** table, and an **admin profile card** (edit name/phone).

---

## 4. Feature details

### 5-minute payment engine (`BookingModal`)
- 3 steps: slot & intake → payment (300s `MM:SS` countdown + progress bar, red alert under 60s) → confirmation with receipt, transaction ID and confetti.
- Validated inputs: slot must be currently offered; card number 12–19 digits, expiry `MM/YY` in the future, CVC 3–4 digits, cardholder name; UPI `name@bank` pattern (+ copiable VPA, QR visual).
- Outcomes: success (atomic booking, slot locked), user-cancelled (slot released, no charge), expired (auto-cancel + one-click restart), `⚡ Test 5s Timeout` helper.
- Server-side-equivalent guards in `bookAppointment`: doctor must exist and be approved, required fields, **double-booking race guard**, and the **amount is always derived from the doctor's fee** (caller totals ignored). Timer expiry during authorization aborts the booking instead of confirming.

### Video visits (`VideoRoom`)
- Real camera/mic via `getUserMedia` with waiting-room calibration (mic level meter, camera check, blur), mute/camera toggle, `getDisplayMedia` screen share, in-call clinical chat, patient-records drawer, canvas doctor feed with ECG telemetry HUD, and status transitions (`scheduled → waiting → consultation → completed` + end-call summary).

### Prescriptions & records
- Printable prescription viewer; doctor pad validates diagnosis + ≥1 named medication; one rating per completed consultation.
- Records vault: PDF/JPG/PNG only, 10 MB cap, drag-and-drop with real file storage; vitals with physiological range clamps and trend chart. Doctors see **only their own patients'** records; admins see all.

### Symptom matcher
- `PatientIntakeAndDoctorMatcher` + `utils/doctorMatcher`: rule-based specialty matching with red-flag emergency detection and fee/availability-aware ranking.

### Cancellations & refunds
- Patient/admin cancellations require a reason; terminal states (cancelled/completed/no-show) can't be re-cancelled; refunds marked automatically; illegal status jumps are blocked and logged.

---

## 5. Security

- Bcrypt cost-10 hashing, constant-time compare, valid dummy hash for timing equalization.
- Zod validation + `sanitizePlainText`/name-whitelist on every auth/register form; React escaping throughout (no `dangerouslySetInnerHTML`, no `eval`).
- Uploads re-encoded via canvas (avatars) and type/size-gated (records).
- Lockout/CAPTCHA state persisted across reloads; every auth, booking, prescription, refund, approval and config change is audit-logged.
- Limitation: this build persists to browser `localStorage` unencrypted — suitable for demo/self-host, not for real PHI without a backend + encrypted store.

## 6. Responsive (320px phones → desktop)

Viewport meta, collapsing grids (`grid-cols-1 → sm/md/lg`), `overflow-x-auto` tables/charts/tab rails with a custom `no-scrollbar` utility, `dvh`-aware modal scroll areas, video drawers that overlay full-width on phones and dock on desktop, compact auth pills/stats/buttons under 400px, and initials fallbacks wherever avatars are empty.

---

## 7. Tech stack (actually wired)

| Layer | Package |
|---|---|
| UI | `react` + `react-dom` 19, `vite` 6, `tailwindcss` v4 (`@tailwindcss/vite`), `lucide-react`, `canvas-confetti` |
| Validation / crypto | `zod` 4, `bcryptjs` 3 |
| State | React Context (`src/context/AppContext.tsx`) + `localStorage` sync |
| Types / checks | `typescript` ~5.8 (`npm run lint` = `tsc --noEmit`) |

> `express`, `@google/genai`, `motion`, `dotenv` ship in `package.json` but are **not imported** by the app — reserved for future backend/AI work, not active architecture.

---

## 8. Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # tsc --noEmit
npm run build    # vite build → dist/
```

First run: open the app → **Provider Portal → Register Doctor** (or Patient/Admin) → admin approves the doctor → book a consultation. To wipe all local data, clear site storage (keys start with `teledoc_v2_` plus `teledoc_security_lockout_store`).

## 9. Project structure

```
src/
  App.tsx                    # role/tab routing + global modals + footer
  lib/
    navigation.ts            # AppTab union, NAV_CONFIG, alias normalization
    patientIntake.ts         # intake checklist / progress / completion
    cn.ts                    # classnames helper
  components/
    ui/                      # shared Tailwind-only primitives (Button, Card, Input, Badge, Dialog)
    auth/AuthModal.tsx       # register/login/reset for all 3 roles + CAPTCHA/lockout UI
    auth/SecurityCheckpoint.tsx
    patient/                 # PatientFrontPage, DoctorDirectory, intake matcher, BookingModal,
                             # PatientAppointments, HealthRecordsVault, MedicalProfileView, modals
    doctor/                  # DoctorDashboard (+profile editor), AvailabilityManager,
                             # DoctorAnalytics, PrescriptionPadModal
    admin/AdminDashboard.tsx # KPIs, approvals, disputes, config, audit, admin profile
    video/VideoRoom.tsx
    prescription/PrescriptionModal.tsx
    layout/Navbar.tsx        # brand, segmented nav (desktop+mobile), role switcher
    common/JpgAvatarUploader.tsx
  context/AppContext.tsx     # all state, auth, booking, guards, audit
  data/initialData.ts        # empty seeds (no demo people) + platform defaults
  utils/security.ts          # zod schemas, bcrypt, sanitizers, rate-limit/lockout store
  utils/doctorMatcher.ts
```

---

## 10. Privacy & compliance notice

Outpatient non-emergency use only — emergency banner (`Call 911 / 112`) is shown in the header and footer on every view. Follows HIPAA-aligned handling principles (verified identities, audit trails, encrypted checkout messaging), but see the `localStorage` limitation above before any clinical deployment.
