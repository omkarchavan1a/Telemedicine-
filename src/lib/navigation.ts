import type { UserRole } from '../types';

// Canonical tab ids used across the app. Aliases are normalized via normalizeTab().
export type AppTab =
  | 'home'
  | 'doctors'
  | 'find-doctors'
  | 'appointments'
  | 'records'
  | 'health-records'
  | 'profile'
  | 'medical-profile'
  | 'doctor-queue'
  | 'doctor-availability'
  | 'availability'
  | 'doctor-analytics'
  | 'admin-analytics'
  | 'admin-doctors'
  | 'admin-appointments'
  | 'admin-config'
  | 'admin-audit';

export interface NavItem {
  id: AppTab;
  label: string;
  shortLabel: string;
}

const PATIENT_NAV: NavItem[] = [
  { id: 'home', label: 'Home', shortLabel: 'Home' },
  { id: 'doctors', label: 'Find Doctors', shortLabel: 'Find Doctors' },
  { id: 'appointments', label: 'My Consultations', shortLabel: 'My Consultations' },
  { id: 'records', label: 'Health Records', shortLabel: 'Health Records' },
  { id: 'profile', label: 'Medical Intake', shortLabel: 'Medical Profile' },
];

const DOCTOR_NAV: NavItem[] = [
  { id: 'doctor-queue', label: 'Consultation Queue', shortLabel: 'Queue' },
  { id: 'doctor-availability', label: 'Schedule & Slots', shortLabel: 'Schedule & Slots' },
  { id: 'doctor-analytics', label: 'Performance & Earnings', shortLabel: 'Earnings' },
];

const ADMIN_NAV: NavItem[] = [
  { id: 'admin-analytics', label: 'Analytics', shortLabel: 'Reports' },
  { id: 'admin-doctors', label: 'Doctor Approvals', shortLabel: 'Approvals' },
  { id: 'admin-appointments', label: 'Bookings & Disputes', shortLabel: 'Disputes' },
  { id: 'admin-config', label: 'Platform Config', shortLabel: 'Config' },
  { id: 'admin-audit', label: 'Audit Logs', shortLabel: 'Audit' },
];

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  patient: PATIENT_NAV,
  doctor: DOCTOR_NAV,
  admin: ADMIN_NAV,
};

// Resolve legacy aliases to a single canonical id for comparisons.
export function normalizeTab(tab: string): AppTab {
  switch (tab) {
    case 'home':
    case 'find-doctors':
    case 'doctors':
      return 'doctors';
    case 'health-records':
    case 'records':
      return 'records';
    case 'medical-profile':
    case 'profile':
      return 'profile';
    case 'availability':
    case 'doctor-availability':
      return 'doctor-availability';
    default:
      return tab as AppTab;
  }
}

export function isNavActive(current: string, itemId: AppTab): boolean {
  if (current === itemId) return true;
  return normalizeTab(current) === normalizeTab(itemId);
}
