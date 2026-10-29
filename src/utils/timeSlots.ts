export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseSlotToMinutes(slot: string): number | null {
  if (!slot) return null;
  // If slot has a range like "10:00 AM - 10:30 AM", take the first part
  const clean = slot.split('-')[0].trim();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hour = Number(match12[1]);
    const minute = Number(match12[2]);
    const period = match12[3] ? match12[3].toUpperCase() : null;
    if (minute < 0 || minute > 59) return null;
    if (period) {
      if (hour < 1 || hour > 12) return null;
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
    } else {
      // 24 hour fallback
      if (hour < 0 || hour > 23) return null;
    }
    return hour * 60 + minute;
  }
  return null;
}

export function formatMinutesToSlot(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function generateTimeSlots(
  doctor: {
    availableDays: number[];
    availableHours: { start: string; end: string };
    slotDurationMinutes: number;
    blockedDates: string[];
  } | null,
  date: string
): string[] {
  if (!doctor || !date) return [];
  const parts = date.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return [];
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (Number.isNaN(d.getTime())) return [];
  if (!doctor.availableDays.includes(d.getDay())) return [];
  if (doctor.blockedDates.includes(date)) return [];

  const [startH, startM] = (doctor.availableHours?.start || '09:00').split(':').map(Number);
  const [endH, endM] = (doctor.availableHours?.end || '17:00').split(':').map(Number);
  const duration = doctor.slotDurationMinutes || 30;

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const generated: string[] = [];
  for (let time = startMinutes; time + duration <= endMinutes; time += duration) {
    generated.push(formatMinutesToSlot(time));
  }
  return generated;
}

export function isPastSlot(date: string, slot: string, now: Date = new Date()): boolean {
  const minutes = parseSlotToMinutes(slot);
  if (minutes === null) return true;
  const today = localDateKey(now);
  if (date < today) return true;
  if (date > today) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return minutes <= nowMinutes;
}

export function isSlotBooked(
  doctorId: string,
  date: string,
  slot: string,
  appointments: { doctorId: string; date: string; timeSlot: string; status: string }[]
): boolean {
  return appointments.some(
    (a) => a.doctorId === doctorId && a.date === date && a.timeSlot === slot && a.status !== 'cancelled'
  );
}

/**
 * Builds the exact Date for an appointment's start time in local timezone.
 */
export function getAppointmentStartDate(dateStr: string, timeSlotStr: string): Date | null {
  if (!dateStr || !timeSlotStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const slotMinutes = parseSlotToMinutes(timeSlotStr);
  if (slotMinutes === null) return null;

  const hours = Math.floor(slotMinutes / 60);
  const minutes = slotMinutes % 60;
  return new Date(parts[0], parts[1] - 1, parts[2], hours, minutes, 0, 0);
}

export type SchedulePhase = 'future' | 'approaching' | 'live_now' | 'past';

export interface ScheduleStatusInfo {
  start: Date | null;
  end: Date | null;
  phase: SchedulePhase;
  isLiveNow: boolean;
  isApproaching: boolean;
  isFuture: boolean;
  isPast: boolean;
  canJoin: boolean;
  secondsUntilStart: number;
  minutesUntilStart: number;
  countdownFormatted: string;
  badgeText: string;
  badgeStyle: string;
}

/**
 * Computes live schedule state & countdown for an appointment.
 * - approaching: within 10 minutes of start time (waiting room open)
 * - live_now: currently within the consultation window (start until end + 15m grace)
 * - future: > 10 minutes away
 * - past: slot expired
 */
export function getAppointmentScheduleInfo(
  dateStr: string,
  timeSlotStr: string,
  durationMinutes: number = 30,
  now: Date = new Date()
): ScheduleStatusInfo {
  const start = getAppointmentStartDate(dateStr, timeSlotStr);
  if (!start) {
    return {
      start: null,
      end: null,
      phase: 'past',
      isLiveNow: false,
      isApproaching: false,
      isFuture: false,
      isPast: true,
      canJoin: false,
      secondsUntilStart: 0,
      minutesUntilStart: 0,
      countdownFormatted: 'Invalid date/time',
      badgeText: 'Unknown Time',
      badgeStyle: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  // Give a 15-minute grace period after scheduled slot end
  const graceEnd = new Date(end.getTime() + 15 * 60 * 1000);
  const nowMs = now.getTime();
  const startMs = start.getTime();
  const diffMs = startMs - nowMs;
  const secondsUntilStart = Math.floor(diffMs / 1000);
  const minutesUntilStart = Math.round(diffMs / 60000);

  let phase: SchedulePhase;
  let canJoin = false;
  let isLiveNow = false;
  let isApproaching = false;
  let isFuture = false;
  let isPast = false;
  let countdownFormatted = '';
  let badgeText = '';
  let badgeStyle = '';

  if (nowMs > graceEnd.getTime()) {
    phase = 'past';
    isPast = true;
    countdownFormatted = 'Scheduled time passed';
    badgeText = 'Slot Concluded';
    badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
  } else if (nowMs >= startMs) {
    phase = 'live_now';
    isLiveNow = true;
    canJoin = true;
    const remainingSecs = Math.max(0, Math.floor((graceEnd.getTime() - nowMs) / 1000));
    const remM = Math.floor(remainingSecs / 60);
    const remS = remainingSecs % 60;
    countdownFormatted = `Live Now (${remM}m ${String(remS).padStart(2, '0')}s remaining)`;
    badgeText = 'Live Consultation Now';
    badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse';
  } else if (diffMs <= 10 * 60 * 1000) {
    // Within 10 minutes prior: approaching
    phase = 'approaching';
    isApproaching = true;
    canJoin = true;
    const m = Math.floor(secondsUntilStart / 60);
    const s = Math.max(0, secondsUntilStart % 60);
    countdownFormatted = `Starts in ${m}m ${String(s).padStart(2, '0')}s`;
    badgeText = `Starting in ${m}m (Ready)`;
    badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse';
  } else {
    // Future (> 10 mins)
    phase = 'future';
    isFuture = true;
    canJoin = false;
    const totalHours = Math.floor(secondsUntilStart / 3600);
    const remainingM = Math.floor((secondsUntilStart % 3600) / 60);

    if (totalHours < 24) {
      countdownFormatted = `Starts in ${totalHours}h ${remainingM}m`;
      badgeText = `In ${totalHours}h ${remainingM}m`;
    } else {
      const days = Math.floor(totalHours / 24);
      countdownFormatted = `Starts in ${days} day${days > 1 ? 's' : ''}`;
      badgeText = `In ${days} day${days > 1 ? 's' : ''}`;
    }
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return {
    start,
    end,
    phase,
    isLiveNow,
    isApproaching,
    isFuture,
    isPast,
    canJoin,
    secondsUntilStart,
    minutesUntilStart,
    countdownFormatted,
    badgeText,
    badgeStyle,
  };
}

/**
 * Gentle double-tone Web Audio chime when scheduled call starts or arrives.
 */
export function playAppointmentChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.65);
  } catch {
    // Ignore audio permission/context errors safely
  }
}
