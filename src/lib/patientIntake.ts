import type { PatientProfile } from '../types';

export interface IntakeChecklistItem {
  key: string;
  label: string;
  done: boolean;
}

// Step 1 of the patient journey: personal + medical information gathered
// before consultations. All items required to unlock the "intake complete" state.
export function getIntakeChecklist(profile: PatientProfile): IntakeChecklistItem[] {
  return [
    { key: 'name', label: 'Full name', done: profile.name.trim().length >= 2 },
    { key: 'email', label: 'Email address', done: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) },
    { key: 'phone', label: 'Contact phone', done: profile.phone.trim().length >= 4 },
    { key: 'dob', label: 'Date of birth', done: profile.dateOfBirth.trim().length > 0 },
    { key: 'emergencyName', label: 'Emergency contact name', done: profile.emergencyContact.name.trim().length >= 2 },
    { key: 'emergencyPhone', label: 'Emergency contact phone', done: profile.emergencyContact.phone.trim().length >= 4 },
  ];
}

export function getIntakeProgress(profile: PatientProfile): { done: number; total: number; percent: number } {
  const items = getIntakeChecklist(profile);
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, percent: Math.round((done / items.length) * 100) };
}

export function isIntakeComplete(profile: PatientProfile): boolean {
  return getIntakeChecklist(profile).every((i) => i.done);
}
