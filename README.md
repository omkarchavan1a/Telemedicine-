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

## 🛠️ Technology Stack

- **Framework**: React 18+ with Vite and TypeScript
- **Styling**: Tailwind CSS with custom Liquid Glass & Bento Morphism design tokens
- **Icons**: Lucide React
- **Animations & Effects**: Canvas-Confetti, CSS Keyframe liquid mesh floaters
- **Audio/Video Processing**: Web Audio API, WebRTC MediaStreams, HTML5 Canvas Rendering
- **State Management**: React Context with LocalStorage persistence

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
