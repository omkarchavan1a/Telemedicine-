export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
}

export interface PatientProfile {
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  dateOfBirth: string;
  gender: 'Female' | 'Male' | 'Other';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  pastSurgeries: string[];
  familyHistory: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
}

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  specialization: 'Cardiology' | 'Pediatrics' | 'Dermatology' | 'General Medicine' | 'Neurology' | 'Orthopedics' | 'Psychiatry';
  qualifications: string[];
  experienceYears: number;
  consultationFee: number;
  bio: string;
  rating: number;
  reviewCount: number;
  status: 'approved' | 'pending' | 'suspended';
  regNumber: string;
  hospitalAffiliation: string;
  availableDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  availableHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  slotDurationMinutes: number;
  blockedDates: string[]; // YYYY-MM-DD
  languages: string[];
}

export type AppointmentStatus =
  | 'scheduled'
  | 'in_waiting_room'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorAvatar: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "10:00 AM"
  reason: string;
  symptoms?: string;
  status: AppointmentStatus;
  paymentStatus: 'paid' | 'refunded' | 'failed';
  paymentMethod: 'Credit/Debit Card' | 'UPI' | 'Net Banking';
  transactionId: string;
  amount: number;
  cancellationReason?: string;
  cancelledBy?: 'patient' | 'doctor' | 'admin';
  videoRoomId: string;
  callDurationSeconds?: number;
  ratingGiven?: number;
  reviewComment?: string;
  createdAt: string;
}

export interface PrescriptionMedication {
  id: string;
  name: string;
  dosage: string;       // e.g. "500 mg"
  frequency: string;    // e.g. "Twice daily after food"
  duration: string;     // e.g. "5 days"
  instructions: string; // e.g. "Take with plenty of water"
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientBloodGroup?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  doctorRegNo: string;
  diagnosis: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
  };
  medications: PrescriptionMedication[];
  advice: string;
  followUpDate?: string;
  issuedAt: string;
  doctorSignature: string;
}

export type HealthRecordCategory =
  | 'Blood Test'
  | 'Imaging & Scan'
  | 'Prescription'
  | 'Cardiology'
  | 'Discharge Summary'
  | 'Pathology';

export interface HealthRecord {
  id: string;
  patientId: string;
  title: string;
  category: HealthRecordCategory;
  recordDate: string;
  fileType: 'pdf' | 'jpg' | 'png';
  fileName: string;
  fileSize: string;
  labName?: string;
  notes?: string;
  uploadedAt: string;
  downloadUrl?: string;
  fileData?: string; // Real base64 data URL for uploaded files
}

export interface VitalMeasurement {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  bpSystolic: number;
  bpDiastolic: number;
  heartRate: number;
  bloodSugar: number; // mg/dL
  weight: number; // kg
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: UserRole | 'system';
  action: string;
  target: string;
  details: string;
}

export interface PlatformConfig {
  cancellationWindowHours: number;
  platformCommissionPercent: number;
  reminderTimingHours: number[];
  minFeeLimit: number;
  maxFeeLimit: number;
}

export interface DoctorRegistrationInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  specialization: 'Cardiology' | 'Pediatrics' | 'Dermatology' | 'General Medicine' | 'Neurology' | 'Orthopedics' | 'Psychiatry';
  regNumber: string;
  hospitalAffiliation: string;
  experienceYears: number;
  consultationFee: number;
  qualifications: string;
  bio: string;
}

export interface AdminRegistrationInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  adminPasscode: string;
  department: string;
}
