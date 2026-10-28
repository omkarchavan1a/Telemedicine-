export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseSlotToMinutes(slot: string): number | null {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
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
