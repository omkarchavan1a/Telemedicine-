# TeleDoc — Telemedicine & Virtual Care Platform

A production-ready telemedicine web application combining **Liquid Glass** and **Bento Morphism** aesthetics with real hardware video calling, 5-minute timed payments (Credit Card & UPI), digital prescriptions, electronic health records, doctor scheduling, and administrative governance.

---

## ✨ Design System: Liquid Glass & Bento Morphism Mixture

TeleDoc blends two contemporary digital design paradigms:

1. **Bento Morphism (Structural Hierarchy)**
   - Asymmetric, harmonious modular grid tiles that organize clinical data, doctor credentials, and scheduling slots like a Japanese bento box.
   - High visual density with optical balance, mathematical corner radius nesting, and clean negative space.
   - Contextual visual hierarchy for key vital stats, doctor ratings, pricing tiers, and quick actions.

2. **Liquid Glass (Material & Lighting)**
   - Translucent glassmorphism (`backdrop-filter: blur(18px)`) with crisp 1px specular light refraction borders (`border-white/80` and inset highlights).
   - Soft organic ambient gradient mesh blobs in the canvas background that subtly refract through frosted glass cards.
   - Glossy, responsive micro-interactions: card hover lifts, pill tabs, glowing interactive focus rings, and liquid progress indicators.
   - Strict adherence to WCAG AA contrast ratios (≥ 4.5:1 for body copy).

---

## 🚀 Key Modules & Capabilities

### 1. Real Hardware Video Consultation & Device Calibration
- **Hardware Camera Streaming**: Directly streams video and audio from local user hardware via `navigator.mediaDevices.getUserMedia`.
- **Live Decibel Audio Meter**: Real-time Web Audio API `AudioContext` and `AnalyserNode` monitoring microphone frequency levels with visual volume indicators.
- **Simulated 30 FPS Telemedicine Stream**: Interactive canvas stream featuring animated respiration oscillation, dynamic ECG telemetry waveform graph, pulse rate, SpO2 readings, and speech synthesis audio.
- **Pre-Call Calibration Booth**: Integrated waiting room for testing camera visibility, microphone levels, background blur, and device permissions before the doctor connects.
- **In-Call Media Controls**: Hardware audio mute/unmute, camera toggle, screen sharing via `getDisplayMedia`, background blur filter, perspective flip, and real-time clinical text chat.

### 2. 5-Minute Timed Checkout & Payment Engine
- **Active 5-Minute Session Timer**: A strict 300-second countdown with `MM:SS` display and live progress bar to ensure atomic scheduling and prevent slot hoarding.
- **Under 60s Warning**: Visual urgency alert when under 1 minute remains.
- **Dual Payment Gateways**:
  - **Credit / Debit Card**: Interactive EMV chip card preview displaying cardholder name, card number, expiry, CVV, and 256-bit SSL encryption.
  - **Instant UPI / QR Code**: Dynamic UPI QR code compatible with Google Pay, PhonePe, and Paytm, with copyable UPI ID / VPA.
- **Lifecycle Outcome States**:
  - **Payment Successful**: Instant authorization confirmation, unique transaction ID, receipt breakdown, and one-click transition to the video consultation room.
  - **Payment Cancelled**: Explicit user cancellation releasing the appointment slot with zero charges.
  - **Time Over (Expired)**: Automatic timeout when the 5-minute timer reaches `00:00`, safely releasing the reservation with a 1-click option to restart a fresh session.
  - **Fast-Forward Testing**: Includes a `⚡ Test 5s Timeout` shortcut for rapid verification.

### 3. Patient Portal
- **Doctor Directory**: Specialty filters (Cardiology, Pediatrics, Dermatology, Neurology, etc.), rating filters, price sliders, and full-text search.
- **Slot Reservation**: Multi-step calendar picker with time slots and medical intake notes.
- **Consultation Management**: Filter by upcoming, completed, and cancelled appointments, with direct links to video calls and printable prescriptions.
- **Health Records Vault**: Secure storage for blood reports, MRI scans, vaccination records, and allergy profiles with drag-and-drop file uploads.
- **Medical Profile & Vitals**: Emergency contact details, chronic condition trackers, and past surgical histories.

### 4. Doctor Console (Authenticated)
- **Consultation Queue**: Live patient triage queue showing waiting room patients, upcoming appointments, and instant join controls.
- **Availability Scheduler**: Configurable consultation days, working hours, slot durations, and buffer times.
- **Digital Prescription Pad**: Structured digital prescription writer with ICD-10 diagnosis codes, dosage instructions, duration, pharmacy notes, and physician digital signature.
- **Practice Analytics**: Revenue tracking, patient retention metrics, consultation completion rates, and average patient reviews.

### 5. Admin Governance & Platform Operations (Authenticated)
- **Executive Analytics**: Gross transaction volume, doctor utilization rates, refund ratios, and specialty distribution charts.
- **Doctor Verification**: Review medical licenses, educational credentials, and approve/reject provider applications.
- **Dispute Resolution**: Automated refund handling for cancelled appointments.
- **Platform Configuration**: Commission fee sliders, minimum cancellation notice buffers, and system feature toggles.
- **Audit Logging**: Immutable system audit trail recording every authentication, booking, prescription generation, and refund event.

---

## 🛠️ Technology Stack & Architecture Details

TeleDoc is built on a full-stack, secure, and modern TypeScript architecture combining high-performance frontend engineering with clinical-grade backend cryptographic and security infrastructure.

### 🎨 Frontend Architecture & Technologies

| Layer / Capability | Technologies & Libraries | Implementation Details |
| :--- | :--- | :--- |
| **Core Framework** | **React 19** (`react` `19.0.1`, `react-dom` `19.0.1`) | Modern functional component architecture, custom hooks, and centralized reactive Context API state management. |
| **Language** | **TypeScript** (`~5.8.2`) | Strict type safety across clinical interfaces, doctor profiles, payment sessions, prescriptions, and audit logs (`tsc --noEmit`). |
| **Build Tool & Bundler** | **Vite 6** (`vite` `6.2.3`, `@vitejs/plugin-react`) | High-speed native ES module bundling, rapid cold starts, and optimized production tree-shaking into static assets (`dist/`). |
| **Styling & Design System** | **Tailwind CSS v4** (`@tailwindcss/vite` `4.1.14`) | Styled via `@import "tailwindcss"` with custom design tokens embodying **Liquid Glass** (frosted blur `backdrop-filter`, 1px specular light refraction borders, ambient gradient mesh orbs) and **Bento Morphism** (asymmetrical modular cards with mathematical corner nesting). |
| **Motion & Micro-interactions** | **Motion** (`motion` `12.23.24`, `motion/react`) | Declarative page route transitions, modal dialog animations, collapsible drawers, and spring physics. |
| **Celebratory Feedback** | **Canvas-Confetti** (`canvas-confetti` `1.9.4`) | High-performance particle bursts upon appointment reservation completion and payment authorization. |
| **Iconography** | **Lucide React** (`lucide-react` `0.546.0`) | Comprehensive medical, hardware, audio/video, clinical status, and navigation SVG icons. |
| **Hardware Video & Audio** | **WebRTC & MediaDevices API** (`getUserMedia`) | Live camera and microphone capture from user hardware with permission negotiation, device flipping, and stream lifecycle management. |
| **Screen Sharing** | **Screen Capture API** (`getDisplayMedia`) | Real-time desktop, application, and browser tab sharing during active doctor-patient telemedicine sessions. |
| **Live Audio Decibel Meter** | **Web Audio API** (`AudioContext`, `AnalyserNode`) | Real-time Fast Fourier Transform (FFT) audio frequency analysis with visual decibel VU meter for pre-call microphone calibration. |
| **Clinical Telemetry Stream** | **HTML5 Canvas API** (2D Rendering Context) | Custom 30 FPS animated clinical stream rendering dynamic sinusoidal respiration curves, real-time ECG waveform graph, pulse rate, and SpO2 telemetry. |
| **Speech Guidance** | **Web Speech Synthesis API** (`speechSynthesis`) | Browser-native auditory cues and synthesized clinical recommendations during active tele-consultations. |
| **Image & Profile Processing** | **HTML5 FileReader & Canvas API** | Client-side JPG avatar processing, strict MIME validation (`image/jpeg`, `.jpg`), dimensions verification, and base64 compression for doctors and patients. |
| **Schema Validation** | **Zod** (`zod` `4.5.4`) | Runtime schema validation for patient intake, doctor credentials, medical registration numbers, and authentication inputs. |

---

### ⚙️ Backend, Security & Infrastructure Architecture

| Layer / Capability | Technologies & Tools | Implementation Details |
| :--- | :--- | :--- |
| **Runtime Environment** | **Node.js** (v20+ ESM) | Native ES Module runtime (`"type": "module"` in `package.json`), running behind an external reverse proxy layer. |
| **Server Engine** | **Express** (`express` `4.21.2`, `@types/express`) | Server framework configured with `dotenv` (`17.2.3`) and `tsx` (`4.21.0`), supporting custom API routes, health checks, and static asset middleware. |
| **Server Compilation** | **esbuild** (`esbuild` `0.25.0`) | Bundles server modules into a single, high-performance CommonJS package (`dist/server.cjs`) bypassing Node runtime ESM lookup overhead. |
| **Network & Port Binding** | **Port 3000** (`0.0.0.0:3000`) | Standard containerized ingress port routing external traffic seamlessly to Vite/Express servers. |
| **Password Cryptography** | **Bcrypt.js** (`bcryptjs` `3.0.3`) | Secure password hashing using salt rounds (work factor 10), constant-time hash comparisons, and legacy upgrade fallbacks. |
| **Timing-Attack Defense** | **Dummy Hash Equalization** (CWE-204) | Pre-computed dummy bcrypt hash computation to equalize response times and prevent email enumeration side-channel attacks. |
| **Role-Based Access Control** | **Multi-Tier RBAC Engine** | Strict separation of concerns across 3 personas: **Patient** (booking, records, prescriptions), **Doctor** (triage queue, schedule, ICD-10 pad), and **Platform Admin** (auditing, refunds, verification). |
| **Input Sanitization** | **OWASP Top 10 Sanitizer** | Strips dangerous HTML, nested `<script>` tags, `javascript:` pseudoprotocols, and control characters to prevent Cross-Site Scripting (XSS / CWE-79). |
| **Rate Limiting & Lockouts** | **Sliding Window Rate Limiter** | Enforces max 10 requests/min per IP/account, progressive delay backoff schedule (1s, 2s, 5s, 15s, 30s), and automatic 15-minute account lockout after 5 consecutive failed attempts. |
| **Adaptive CAPTCHA** | **Security Verification Trigger** | Automated in-app security challenge widget activated dynamically after 3 consecutive failed login attempts. |
| **Clinical Symptom Triage** | **Deterministic Clinical Matcher** | Rule-based engine mapping multi-category patient symptoms (Cardiovascular, Pediatric, Dermatological, Neurological, Orthopedic, Psychiatric) to clinical specialties with red-flag emergency detection. |
| **AI Capabilities** | **Google Gen AI SDK** (`@google/genai` `2.4.0`) | Official TypeScript SDK integrated for server-side Gemini intelligence, medical summarization, and clinical decision support. |
| **Data Persistence Engine** | **Multi-Store Synchronizer** | Reactive client-server state persistence with Browser `localStorage` multi-entity stores for accounts, appointments, prescriptions, audit logs, and security lockouts. |
| **System Audit Trail** | **Immutable Audit Logger** | Structured audit logging recording timestamped event categories (`AUTH`, `BOOKING`, `PRESCRIPTION`, `REFUND`), actor user IDs, IP signatures, and severity levels. |

---

## 🏃 Getting Started

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The application runs on `http://localhost:3000`.

### Production Build
```bash
npm run build
```

---

## 🛡️ Privacy & Compliance Notice

TeleDoc incorporates HIPAA-compliant architectural principles:
- Zero unencrypted clinical data transmission.
- Outpatient non-emergency disclaimer prominently displayed across all views.
- Clear emergency callouts (`Call 911 / 112`) for immediate life-threatening events.
