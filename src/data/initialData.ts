import {
  PatientProfile,
  DoctorProfile,
  Appointment,
  Prescription,
  HealthRecord,
  VitalMeasurement,
  AuditLog,
  PlatformConfig,
  User,
} from '../types';

// No demo people or demo content. App starts empty; real users register.
export const INITIAL_USERS: User[] = [
  {
    id: 'user-guest',
    name: 'Guest',
    email: '',
    role: 'patient',
    avatar: '',
    phone: '',
  },
];

export const INITIAL_PATIENT_PROFILE: PatientProfile = {
  userId: 'user-guest',
  name: '',
  email: '',
  phone: '',
  avatar: '',
  dateOfBirth: '',
  gender: 'Female',
  bloodGroup: 'O+',
  allergies: [],
  chronicConditions: [],
  currentMedications: [],
  pastSurgeries: [],
  familyHistory: '',
  emergencyContact: {
    name: '',
    relation: '',
    phone: '',
  },
};

export const INITIAL_DOCTORS: DoctorProfile[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [];

export const INITIAL_HEALTH_RECORDS: HealthRecord[] = [];

export const INITIAL_VITALS: VitalMeasurement[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const INITIAL_CONFIG: PlatformConfig = {
  cancellationWindowHours: 4,
  platformCommissionPercent: 15,
  reminderTimingHours: [24, 1],
  minFeeLimit: 20,
  maxFeeLimit: 300,
};
