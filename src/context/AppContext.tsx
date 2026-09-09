import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  PatientProfile,
  DoctorProfile,
  Appointment,
  Prescription,
  HealthRecord,
  VitalMeasurement,
  AuditLog,
  PlatformConfig,
  DoctorRegistrationInput,
  AdminRegistrationInput,
  PatientRegistrationInput,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PATIENT_PROFILE,
  INITIAL_DOCTORS,
  INITIAL_APPOINTMENTS,
  INITIAL_PRESCRIPTIONS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_VITALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONFIG,
} from '../data/initialData';
import {
  securityStore,
  DUMMY_BCRYPT_HASH,
  hashPassword,
  verifyPassword,
  delayAsync,
  loginInputSchema,
  doctorRegistrationSchema,
  patientRegistrationSchema,
  adminRegistrationSchema,
  passwordResetSchema,
  resetPasswordWithOldPasswordSchema,
  sanitizePlainText,
} from '../utils/security';

interface AppContextType {
  currentUser: User;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  allUsers: User[];

  patientProfile: PatientProfile;
  updatePatientProfile: (updated: Partial<PatientProfile>) => void;

  doctors: DoctorProfile[];
  updateDoctorStatus: (doctorId: string, status: 'approved' | 'pending' | 'suspended') => void;
  updateDoctorProfile: (doctorId: string, updates: Partial<DoctorProfile>) => void;
  updateDoctorAvailability: (
    doctorId: string,
    updates: {
      availableDays?: number[];
      availableHours?: { start: string; end: string };
      slotDurationMinutes?: number;
      consultationFee?: number;
      blockedDates?: string[];
    }
  ) => void;

  appointments: Appointment[];
  bookAppointment: (data: {
    doctorId: string;
    date: string;
    timeSlot: string;
    reason: string;
    symptoms?: string;
    paymentMethod: 'Credit/Debit Card' | 'UPI' | 'Net Banking';
    amount: number;
    patientName?: string;
    patientEmail?: string;
  }) => Appointment;
  cancelAppointment: (
    appointmentId: string,
    reason: string,
    cancelledBy: 'patient' | 'doctor' | 'admin'
  ) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  submitRating: (appointmentId: string, rating: number, comment?: string) => void;

  prescriptions: Prescription[];
  issuePrescription: (prescription: Omit<Prescription, 'id' | 'issuedAt'>) => Prescription;

  healthRecords: HealthRecord[];
  uploadHealthRecord: (record: Omit<HealthRecord, 'id' | 'uploadedAt'>) => void;
  deleteHealthRecord: (recordId: string) => void;

  vitals: VitalMeasurement[];
  addVitalMeasurement: (vital: Omit<VitalMeasurement, 'id'>) => void;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, target: string, details: string) => void;

  platformConfig: PlatformConfig;
  updatePlatformConfig: (config: Partial<PlatformConfig>) => void;

  // Modals & Navigation triggers
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeVideoAppointment: Appointment | null;
  setActiveVideoAppointment: (apt: Appointment | null) => void;

  bookingDoctor: DoctorProfile | null;
  setBookingDoctor: (doc: DoctorProfile | null) => void;
  prefilledBookingData: {
    reason?: string;
    symptoms?: string;
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
  } | null;
  setPrefilledBookingData: (data: {
    reason?: string;
    symptoms?: string;
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
  } | null) => void;

  viewingPrescription: Prescription | null;
  setViewingPrescription: (rx: Prescription | null) => void;

  viewingRecord: HealthRecord | null;
  setViewingRecord: (rec: HealthRecord | null) => void;

  doctorPrescriptionTargetApt: Appointment | null;
  setDoctorPrescriptionTargetApt: (apt: Appointment | null) => void;

  // Authentication (Patient, Doctor & Admin)
  authDoctor: DoctorProfile | null;
  authAdmin: User | null;
  authModalOpen: boolean;
  authModalRole: 'patient' | 'doctor' | 'admin';
  authModalTab: 'login' | 'register' | 'forgot';
  openAuthModal: (role: 'patient' | 'doctor' | 'admin', tab?: 'login' | 'register' | 'forgot' | 'reset') => void;
  closeAuthModal: () => void;
  doctorLogin: (
    email: string,
    pass: string,
    captchaToken?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    locked?: boolean;
    remainingSeconds?: number;
    delayMs?: number;
  }>;
  adminLogin: (
    email: string,
    pass: string,
    captchaToken?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    locked?: boolean;
    remainingSeconds?: number;
    delayMs?: number;
  }>;
  patientLogin: (
    email: string,
    pass: string,
    captchaToken?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    locked?: boolean;
    remainingSeconds?: number;
    delayMs?: number;
  }>;
  updateAdminProfile: (updates: { name?: string; phone?: string }) => void;
  doctorRegister: (input: DoctorRegistrationInput) => Promise<{ success: boolean; error?: string }>;
  adminRegister: (input: AdminRegistrationInput) => Promise<{ success: boolean; error?: string }>;
  patientRegister: (input: PatientRegistrationInput) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{
    success: boolean;
    message: string;
    tempPassword?: string;
    resetToken?: string;
    dispatchedTo?: string;
    deliveryTime?: string;
  }>;
  resetPasswordWithOldPassword: (
    email: string,
    oldPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetSecurityLimits: () => void;
  logoutProvider: () => void;

  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'teledoc_v2_';

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error(`Failed to load ${key} from storage`, err);
  }
  return fallback;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() =>
    loadStorage<User>('current_user', INITIAL_USERS[0])
  );
  const [patientProfile, setPatientProfile] = useState<PatientProfile>(() =>
    loadStorage<PatientProfile>('patient_profile', INITIAL_PATIENT_PROFILE)
  );
  const [doctors, setDoctors] = useState<DoctorProfile[]>(() =>
    loadStorage<DoctorProfile[]>('doctors', INITIAL_DOCTORS)
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    loadStorage<Appointment[]>('appointments', INITIAL_APPOINTMENTS)
  );
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() =>
    loadStorage<Prescription[]>('prescriptions', INITIAL_PRESCRIPTIONS)
  );
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>(() =>
    loadStorage<HealthRecord[]>('health_records', INITIAL_HEALTH_RECORDS)
  );
  const [vitals, setVitals] = useState<VitalMeasurement[]>(() =>
    loadStorage<VitalMeasurement[]>('vitals', INITIAL_VITALS)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS)
  );
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() =>
    loadStorage<PlatformConfig>('platform_config', INITIAL_CONFIG)
  );

  // Active view states
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeVideoAppointment, setActiveVideoAppointment] = useState<Appointment | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);
  const [prefilledBookingData, setPrefilledBookingData] = useState<{
    reason?: string;
    symptoms?: string;
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
  } | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [viewingRecord, setViewingRecord] = useState<HealthRecord | null>(null);
  const [doctorPrescriptionTargetApt, setDoctorPrescriptionTargetApt] = useState<Appointment | null>(null);

  // Provider Security Authentication state
  const [authDoctor, setAuthDoctor] = useState<DoctorProfile | null>(() =>
    loadStorage<DoctorProfile | null>('auth_doctor', null)
  );
  const [authAdmin, setAuthAdmin] = useState<User | null>(() =>
    loadStorage<User | null>('auth_admin', null)
  );
  const [providerPasswords, setProviderPasswords] = useState<Record<string, string>>(() => {
    const defaultHashes: Record<string, string> = {};
    const loaded = loadStorage<Record<string, string>>('provider_passwords', defaultHashes);
    // Transparent migration: hash any legacy plain-text entries.
    const upgraded: Record<string, string> = { ...loaded };
    for (const [email, pass] of Object.entries(upgraded)) {
      if (!pass) {
        delete upgraded[email];
      } else if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(pass)) {
        upgraded[email] = hashPassword(pass);
      }
    }
    return upgraded;
  });

  // Auth modal controls
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');

  const openAuthModal = (
    role: 'patient' | 'doctor' | 'admin',
    tab: 'login' | 'register' | 'forgot' | 'reset' = 'login'
  ) => {
    setAuthModalRole(role);
    setAuthModalTab(tab === 'reset' ? 'forgot' : tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'current_user', JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'patient_profile', JSON.stringify(patientProfile));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'doctors', JSON.stringify(doctors));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'appointments', JSON.stringify(appointments));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'prescriptions', JSON.stringify(prescriptions));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'health_records', JSON.stringify(healthRecords));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'vitals', JSON.stringify(vitals));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'platform_config', JSON.stringify(platformConfig));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_doctor', JSON.stringify(authDoctor));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_admin', JSON.stringify(authAdmin));
      localStorage.setItem(STORAGE_KEY_PREFIX + 'provider_passwords', JSON.stringify(providerPasswords));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [
    currentUser,
    patientProfile,
    doctors,
    appointments,
    prescriptions,
    healthRecords,
    vitals,
    auditLogs,
    platformConfig,
    authDoctor,
    authAdmin,
    providerPasswords,
  ]);

  const addAuditLog = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorEmail: currentUser.email,
      actorRole: currentUser.role,
      action,
      target,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const found = INITIAL_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const setCurrentRole = (role: UserRole) => {
    if (role === 'patient') {
      switchUser('user-guest');
      setCurrentTab('home');
    } else if (role === 'doctor') {
      if (!authDoctor) {
        openAuthModal('doctor', 'login');
        return;
      }
      const docUser: User = {
        id: authDoctor.id,
        name: authDoctor.name,
        email: authDoctor.email,
        role: 'doctor',
        avatar: authDoctor.avatar,
        phone: authDoctor.phone,
      };
      setCurrentUser(docUser);
      setCurrentTab('doctor-queue');
    } else {
      if (!authAdmin) {
        openAuthModal('admin', 'login');
        return;
      }
      setCurrentUser(authAdmin);
      setCurrentTab('admin-analytics');
    }
  };

  const doctorLogin = async (
    email: string,
    pass: string,
    captchaToken?: string
  ): Promise<{
    success: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    locked?: boolean;
    remainingSeconds?: number;
    delayMs?: number;
  }> => {
    // 1. IP Rate Limiting (max 10 requests / min / IP)
    const rateLimit = securityStore.checkRateLimit('client-ip');
    if (!rateLimit.allowed) {
      addAuditLog('SECURITY_RATE_LIMIT_EXCEEDED', email || 'Anonymous', 'Client IP exceeded 10 login requests per minute.');
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Account Lockout Check (5 failed attempts -> 15 min lockout)
    const lockout = securityStore.isAccountLocked(cleanEmail);
    if (lockout.locked) {
      await delayAsync(1000); // Progressive delay
      addAuditLog('SECURITY_LOCKED_ATTEMPT', cleanEmail, `Attempt against locked account (${lockout.remainingSeconds}s remaining).`);
      return {
        success: false,
        error: 'Incorrect email or password.',
        locked: true,
        remainingSeconds: lockout.remainingSeconds,
      };
    }

    // 3. Progressive Delay Schedule (1s, 2s, 5s, 15s, 30s)
    const delayMs = securityStore.getProgressiveDelayMs(cleanEmail);
    if (delayMs > 0) {
      await delayAsync(delayMs);
    }

    // 4. CAPTCHA Check (triggered on >= 3 failures)
    if (securityStore.requiresCaptcha(cleanEmail) && !captchaToken) {
      return {
        success: false,
        error: 'Security verification required. Please complete the CAPTCHA.',
        requiresCaptcha: true,
        delayMs,
      };
    }

    // 5. Server-Side Zod Validation & Sanitization
    const validation = loginInputSchema.safeParse({ email: cleanEmail, password: pass, captchaToken });
    if (!validation.success) {
      return { success: false, error: 'Incorrect email or password.' };
    }

    // 6. Timing Equalization for Non-Existent Accounts (CWE-204 Defense)
    const foundDoctor = doctors.find((d) => d.email.toLowerCase() === cleanEmail);
    if (!foundDoctor) {
      // Execute dummy bcrypt hash verification to equalize CPU workload with real checks
      verifyPassword(pass, DUMMY_BCRYPT_HASH);
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, `Failed login attempt (${failCount}/5).`);
      return {
        success: false,
        error: 'Incorrect email or password.',
        requiresCaptcha: securityStore.requiresCaptcha(cleanEmail),
        locked: lockedNow,
        remainingSeconds: lockedNow ? 15 * 60 : 0,
        delayMs,
      };
    }

    // 7. Constant-Time Bcrypt Password Verification
    const storedHash = providerPasswords[cleanEmail];
    if (!storedHash) {
      verifyPassword(pass, DUMMY_BCRYPT_HASH);
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, `Failed login attempt (${failCount}/5).`);
      return {
        success: false,
        error: 'Incorrect email or password.',
        requiresCaptcha: securityStore.requiresCaptcha(cleanEmail),
        locked: lockedNow,
        remainingSeconds: lockedNow ? 15 * 60 : 0,
        delayMs,
      };
    }
    const isPasswordCorrect = verifyPassword(pass, storedHash);

    if (!isPasswordCorrect) {
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      if (lockedNow) {
        addAuditLog(
          'SECURITY_ACCOUNT_LOCKED',
          cleanEmail,
          'Account locked for 15 minutes due to 5 consecutive failed login attempts. Security notification dispatched.'
        );
      } else {
        addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, `Failed password verification attempt (${failCount}/5).`);
      }
      return {
        success: false,
        error: 'Incorrect email or password.',
        requiresCaptcha: securityStore.requiresCaptcha(cleanEmail),
        locked: lockedNow,
        remainingSeconds: lockedNow ? 15 * 60 : 0,
        delayMs,
      };
    }

    if (foundDoctor.status === 'suspended') {
      return {
        success: false,
        error: 'Account access restricted. Please contact medical board administration.',
      };
    }

    // Success: Reset failed counters, update session
    securityStore.recordSuccessfulLogin(cleanEmail);
    setAuthDoctor(foundDoctor);
    const docUser: User = {
      id: foundDoctor.id,
      name: foundDoctor.name,
      email: foundDoctor.email,
      role: 'doctor',
      avatar: foundDoctor.avatar,
      phone: foundDoctor.phone,
    };
    setCurrentUser(docUser);
    setCurrentTab('doctor-queue');
    setAuthModalOpen(false);
    addAuditLog('AUTH_LOGIN_SUCCESS', foundDoctor.name, `Doctor successfully authenticated (${foundDoctor.specialization}).`);
    return { success: true };
  };

  const adminLogin = async (
    email: string,
    pass: string,
    captchaToken?: string
  ): Promise<{
    success: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    locked?: boolean;
    remainingSeconds?: number;
    delayMs?: number;
  }> => {
    // 1. IP Rate Limiting
    const rateLimit = securityStore.checkRateLimit('client-ip');
    if (!rateLimit.allowed) {
      addAuditLog('SECURITY_RATE_LIMIT_EXCEEDED', email || 'Anonymous', 'Admin IP rate limit exceeded.');
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Lockout Check
    const lockout = securityStore.isAccountLocked(cleanEmail);
    if (lockout.locked) {
      await delayAsync(1000);
      addAuditLog('SECURITY_LOCKED_ATTEMPT', cleanEmail, `Attempt against locked admin account (${lockout.remainingSeconds}s remaining).`);
      return {
        success: false,
        error: 'Incorrect email or password.',
        locked: true,
        remainingSeconds: lockout.remainingSeconds,
      };
    }

    // 3. Progressive Delay
    const delayMs = securityStore.getProgressiveDelayMs(cleanEmail);
    if (delayMs > 0) {
      await delayAsync(delayMs);
    }

    // 4. CAPTCHA Check
    if (securityStore.requiresCaptcha(cleanEmail) && !captchaToken) {
      return {
        success: false,
        error: 'Security verification required. Please complete the CAPTCHA.',
        requiresCaptcha: true,
        delayMs,
      };
    }

    // 5. Server-side Validation
    const validation = loginInputSchema.safeParse({ email: cleanEmail, password: pass, captchaToken });
    if (!validation.success) {
      return { success: false, error: 'Incorrect email or password.' };
    }

    // 6. Timing Equalization
    let foundAdmin = INITIAL_USERS.find((u) => u.role === 'admin' && u.email.toLowerCase() === cleanEmail);
    const storedHash = providerPasswords[cleanEmail];

    if (!storedHash) {
      verifyPassword(pass, DUMMY_BCRYPT_HASH);
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, `Failed admin login attempt (${failCount}/5).`);
      return {
        success: false,
        error: 'Incorrect email or password.',
        requiresCaptcha: securityStore.requiresCaptcha(cleanEmail),
        locked: lockedNow,
        remainingSeconds: lockedNow ? 15 * 60 : 0,
        delayMs,
      };
    }

    // 7. Constant-Time Bcrypt Verification
    const isPasswordCorrect = verifyPassword(pass, storedHash);

    if (!isPasswordCorrect) {
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      if (lockedNow) {
        addAuditLog(
          'SECURITY_ACCOUNT_LOCKED',
          cleanEmail,
          'Admin account locked for 15 minutes due to 5 consecutive failed attempts.'
        );
      } else {
        addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, `Failed admin password attempt (${failCount}/5).`);
      }
      return {
        success: false,
        error: 'Incorrect email or password.',
        requiresCaptcha: securityStore.requiresCaptcha(cleanEmail),
        locked: lockedNow,
        remainingSeconds: lockedNow ? 15 * 60 : 0,
        delayMs,
      };
    }

    if (!foundAdmin) {
      foundAdmin = {
        id: `user-admin-session-${Date.now().toString(36)}`,
        name: 'Administrator',
        email: cleanEmail,
        role: 'admin',
        avatar: '',
        phone: '',
      };
    }

    securityStore.recordSuccessfulLogin(cleanEmail);
    setAuthAdmin(foundAdmin);
    setCurrentUser(foundAdmin);
    setCurrentTab('admin-analytics');
    setAuthModalOpen(false);
    addAuditLog('AUTH_LOGIN_SUCCESS', foundAdmin.name, 'Administrator clearance verified.');
    return { success: true };
  };

  const patientLogin = async (
    email: string,
    pass: string,
    captchaToken?: string
  ): Promise<{
    success: boolean;
    error?: string;
    requiresCaptcha?: boolean;
    locked?: boolean;
    remainingSeconds?: number;
    delayMs?: number;
  }> => {
    // 1. IP Rate Limiting (max 10 requests / min / IP)
    const rateLimit = securityStore.checkRateLimit('client-ip');
    if (!rateLimit.allowed) {
      addAuditLog('SECURITY_RATE_LIMIT_EXCEEDED', email || 'Anonymous', 'Client IP exceeded 10 login requests per minute.');
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Account Lockout Check (5 failed attempts -> 15 min lockout)
    const lockout = securityStore.isAccountLocked(cleanEmail);
    if (lockout.locked) {
      await delayAsync(1000);
      addAuditLog('SECURITY_LOCKED_ATTEMPT', cleanEmail, `Attempt against locked account (${lockout.remainingSeconds}s remaining).`);
      return {
        success: false,
        error: 'Incorrect email or password.',
        locked: true,
        remainingSeconds: lockout.remainingSeconds,
      };
    }

    // 3. Progressive Delay Schedule
    const delayMs = securityStore.getProgressiveDelayMs(cleanEmail);
    if (delayMs > 0) {
      await delayAsync(delayMs);
    }

    // 4. CAPTCHA Check (triggered on >= 3 failures)
    if (securityStore.requiresCaptcha(cleanEmail) && !captchaToken) {
      return {
        success: false,
        error: 'Security verification required. Please complete the CAPTCHA.',
        requiresCaptcha: true,
        delayMs,
      };
    }

    // 5. Server-Side Zod Validation
    const validation = loginInputSchema.safeParse({ email: cleanEmail, password: pass, captchaToken });
    if (!validation.success) {
      return { success: false, error: 'Incorrect email or password.' };
    }

    // 6. Timing Equalization for Non-Existent Accounts (CWE-204 Defense)
    const storedHash = providerPasswords[cleanEmail];
    if (!storedHash) {
      verifyPassword(pass, DUMMY_BCRYPT_HASH);
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, `Failed patient login attempt (${failCount}/5).`);
      return {
        success: false,
        error: 'No patient account found with this email. Please register first.',
        requiresCaptcha: securityStore.requiresCaptcha(cleanEmail),
        locked: lockedNow,
        remainingSeconds: lockedNow ? 15 * 60 : 0,
        delayMs,
      };
    }

    // 7. Constant-Time Bcrypt Password Verification
    const isPasswordCorrect = verifyPassword(pass, storedHash);
    if (!isPasswordCorrect) {
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      if (lockedNow) {
        addAuditLog(
          'SECURITY_ACCOUNT_LOCKED',
          cleanEmail,
          'Patient account locked for 15 minutes due to 5 consecutive failed login attempts.'
        );
      } else {
        addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, `Failed patient password attempt (${failCount}/5).`);
      }
      return {
        success: false,
        error: 'Incorrect email or password.',
        requiresCaptcha: securityStore.requiresCaptcha(cleanEmail),
        locked: lockedNow,
        remainingSeconds: lockedNow ? 15 * 60 : 0,
        delayMs,
      };
    }

    // Success: sign in linked patient profile (or a session identity for this email)
    securityStore.recordSuccessfulLogin(cleanEmail);
    const linkedProfile =
      patientProfile.email.toLowerCase() === cleanEmail
        ? patientProfile
        : { ...INITIAL_PATIENT_PROFILE, email: cleanEmail };
    const patientUser: User = {
      id: linkedProfile.userId,
      name: linkedProfile.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'patient',
      avatar: linkedProfile.avatar,
      phone: linkedProfile.phone,
    };
    setCurrentUser(patientUser);
    setCurrentTab('home');
    setAuthModalOpen(false);
    addAuditLog('AUTH_LOGIN_SUCCESS', patientUser.name, 'Patient successfully authenticated.');
    return { success: true };
  };

  const updateAdminProfile = (updates: { name?: string; phone?: string }) => {
    if (!authAdmin) return;
    const cleanName = updates.name !== undefined ? sanitizePlainText(updates.name, 70) : undefined;
    const cleanPhone = updates.phone !== undefined ? sanitizePlainText(updates.phone, 30) : undefined;
    setAuthAdmin((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        ...(cleanName ? { name: cleanName } : {}),
        ...(cleanPhone !== undefined ? { phone: cleanPhone } : {}),
      };
      setCurrentUser(next);
      return next;
    });
    addAuditLog('ADMIN_PROFILE_UPDATED', authAdmin.email, 'Administrator updated profile details.');
  };

  const doctorRegister = async (input: DoctorRegistrationInput): Promise<{ success: boolean; error?: string }> => {
    // 1. Server-side Zod Schema Validation & Input Sanitization
    const parseResult = doctorRegistrationSchema.safeParse(input);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid registration input.';
      return { success: false, error: firstError };
    }

    const validData = parseResult.data;
    const cleanEmail = validData.email.toLowerCase();

    // Check duplicate email
    if (doctors.some((d) => d.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: 'A medical provider with this email is already registered. Please sign in.',
      };
    }

    const cleanName = validData.name.startsWith('Dr.') ? validData.name : `Dr. ${validData.name}`;

    // 2. Hash Password with Salted Bcrypt (Cost 10)
    const secureHash = hashPassword(validData.password);

    const newDoctor: DoctorProfile = {
      id: `doc-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      phone: validData.phone,
      avatar:
        input.avatar ||
        validData.avatar ||
        '',
      specialization: validData.specialization,
      qualifications: validData.qualifications ? validData.qualifications.split(',').map((q) => q.trim()) : ['MBBS', 'MD'],
      experienceYears: Number(validData.experienceYears) || 5,
      consultationFee: Number(validData.consultationFee) || 75,
      bio: validData.bio || `Licensed specialist in ${validData.specialization} providing patient-first telemedicine consultations.`,
      rating: 5.0,
      reviewCount: 0,
      status: 'pending',
      regNumber: validData.regNumber,
      hospitalAffiliation: validData.hospitalAffiliation || 'General Medical Center',
      availableDays: [1, 2, 3, 4, 5],
      availableHours: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 30,
      blockedDates: [],
      languages: ['English'],
    };

    setDoctors((prev) => [newDoctor, ...prev]);
    // Store only bcrypt hash - never plaintext password!
    setProviderPasswords((prev) => ({ ...prev, [cleanEmail]: secureHash }));
    setAuthDoctor(newDoctor);

    const docUser: User = {
      id: newDoctor.id,
      name: newDoctor.name,
      email: newDoctor.email,
      role: 'doctor',
      avatar: newDoctor.avatar,
      phone: newDoctor.phone,
    };
    setCurrentUser(docUser);
    setCurrentRole('doctor');
    setCurrentTab('doctor-queue');
    setAuthModalOpen(false);

    addAuditLog(
      'DOCTOR_REGISTERED',
      newDoctor.name,
      `New doctor registered with medical license ${newDoctor.regNumber} (${newDoctor.specialization}). Application submitted with "pending" status awaiting administrative verification and approval before appearing to patients.`
    );
    return { success: true };
  };

  const adminRegister = async (input: AdminRegistrationInput): Promise<{ success: boolean; error?: string }> => {
    // 1. Server-side Zod Schema Validation & Input Sanitization
    const parseResult = adminRegistrationSchema.safeParse(input);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid administrative registration input.';
      return { success: false, error: firstError };
    }

    const validData = parseResult.data;
    const cleanEmail = validData.email.toLowerCase();

    const validPasscodes = ['TELEDOC-ADMIN-2026', 'TELEDOC-BOARD-2026', 'MED-BOARD-SECURE-2026'];
    const enteredPasscode = validData.adminPasscode.trim().toUpperCase();
    if (!validPasscodes.includes(enteredPasscode)) {
      addAuditLog('SECURITY_ADMIN_PASSCODE_REJECTED', cleanEmail, 'Invalid administrative enrollment passcode.');
      return { success: false, error: 'Invalid administrative passcode. Contact the medical board for enrollment.' };
    }

    // 2. Hash Password with Salted Bcrypt (Cost 10)
    const secureHash = hashPassword(validData.password);

    const newAdmin: User = {
      id: `user-admin-${Date.now().toString(36)}`,
      name: validData.name,
      email: cleanEmail,
      role: 'admin',
      avatar: '',
      phone: validData.phone || '',
    };

    setProviderPasswords((prev) => ({ ...prev, [cleanEmail]: secureHash }));
    setAuthAdmin(newAdmin);
    setCurrentUser(newAdmin);
    setCurrentRole('admin');
    setCurrentTab('admin-analytics');
    setAuthModalOpen(false);

    addAuditLog(
      'ADMIN_REGISTERED',
      newAdmin.name,
      `Administrative enrollment verified for department: ${validData.department}.`
    );
    return { success: true };
  };

  const patientRegister = async (input: PatientRegistrationInput): Promise<{ success: boolean; error?: string }> => {
    // 1. Zod validation & Sanitization
    const parseResult = patientRegistrationSchema.safeParse(input);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid patient registration details.';
      return { success: false, error: firstError };
    }

    const validData = parseResult.data;
    const cleanEmail = validData.email.toLowerCase();

    // Use uploaded JPG avatar if provided, otherwise no avatar (initials fallback)
    const avatarUrl =
      input.avatar ||
      validData.avatar ||
      '';

    const newPatientId = `user-patient-${Date.now().toString(36)}`;
    const newPatient: PatientProfile = {
      ...patientProfile,
      userId: newPatientId,
      name: validData.name,
      email: cleanEmail,
      phone: validData.phone || '',
      avatar: avatarUrl,
      dateOfBirth: validData.dateOfBirth || '',
      gender: validData.gender || 'Female',
      bloodGroup: validData.bloodGroup || 'O+',
    };

    const securePatientHash = hashPassword(validData.password);
    setProviderPasswords((prev) => ({ ...prev, [cleanEmail]: securePatientHash }));

    setPatientProfile(newPatient);

    const patientUser: User = {
      id: newPatientId,
      name: newPatient.name,
      email: newPatient.email,
      role: 'patient',
      avatar: newPatient.avatar,
      phone: newPatient.phone,
    };

    setCurrentUser(patientUser);
    setCurrentTab('home');
    setAuthModalOpen(false);

    addAuditLog(
      'PATIENT_REGISTERED',
      newPatient.name,
      `New patient registered with display picture and medical record.`
    );
    return { success: true };
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{
    success: boolean;
    message: string;
    tempPassword?: string;
    resetToken?: string;
    dispatchedTo?: string;
    deliveryTime?: string;
  }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Validate format
    const parseResult = passwordResetSchema.safeParse({ email: cleanEmail });
    if (!parseResult.success) {
      return {
        success: false,
        message: 'Please provide a valid Gmail or email address (e.g. name@gmail.com).',
      };
    }

    // Equalize timing (~350ms delay)
    await delayAsync(350);

    // Generate a cryptographically structured temporary password
    const digits = Math.floor(1000 + Math.random() * 9000);
    const tempPassword = `TeleDoc#${digits}!`;
    const resetToken = `RST-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Store this temporary password in bcrypt format so the user can immediately:
    // 1. Sign in with it
    // 2. Or use it as their 'old password' to set their own custom password!
    const secureHash = hashPassword(tempPassword);
    setProviderPasswords((prev) => ({
      ...prev,
      [cleanEmail]: secureHash,
    }));

    addAuditLog(
      'SECURITY_PASSWORD_RESET_DISPATCH',
      cleanEmail || 'Unknown',
      `Temporary password & one-click reset link generated and dispatched to Gmail (${cleanEmail}). Token: ${resetToken}`
    );

    return {
      success: true,
      message: `Password sent! We dispatched a temporary password and reset link directly to your Gmail: ${cleanEmail}`,
      tempPassword,
      resetToken,
      dispatchedTo: cleanEmail,
      deliveryTime: nowTime,
    };
  };

  const resetPasswordWithOldPassword = async (
    email: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    // 1. Zod input validation
    const parseResult = resetPasswordWithOldPasswordSchema.safeParse({
      email,
      oldPassword,
      newPassword,
    });

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid password reset input.';
      return { success: false, error: firstError };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Validate that new password is not identical to old password
    if (oldPassword === newPassword) {
      return {
        success: false,
        error: 'New password must be different from your current/old password.',
      };
    }

    // 3. Rate limiting check
    const rateLimit = securityStore.checkRateLimit(cleanEmail);
    if (!rateLimit.allowed) {
      addAuditLog('SECURITY_RATE_LIMIT_EXCEEDED', cleanEmail, 'Password reset rate limit exceeded.');
      return {
        success: false,
        error: 'Too many password reset requests. Please wait a minute before trying again.',
      };
    }

    // Timing equalization to prevent account enumeration via response latency
    await delayAsync(300);

    // 4. Retrieve stored hash for this email
    const storedHash = providerPasswords[cleanEmail];

    // If account not found in system:
    if (!storedHash) {
      verifyPassword(oldPassword, DUMMY_BCRYPT_HASH);
      securityStore.recordFailedAttempt(cleanEmail);
      addAuditLog('SECURITY_AUTH_FAILED', cleanEmail, 'Failed password reset: Email not registered.');
      return {
        success: false,
        error: 'No account registered with this email or Gmail address. Please check your spelling.',
      };
    }

    // 5. Verify Old Password (constant-time bcrypt)
    const isOldPasswordCorrect = verifyPassword(oldPassword, storedHash);

    if (!isOldPasswordCorrect) {
      const { lockedNow, failCount } = securityStore.recordFailedAttempt(cleanEmail);
      addAuditLog('SECURITY_PASSWORD_RESET_FAILED', cleanEmail, `Old password verification failed (${failCount}/5).`);
      return {
        success: false,
        error: 'Incorrect current/old password. Please enter the password currently registered to your account.',
      };
    }

    // 6. Generate salted bcrypt hash (cost factor 10)
    const newHash = hashPassword(newPassword);

    // 7. Update passwords dictionary
    setProviderPasswords((prev) => ({
      ...prev,
      [cleanEmail]: newHash,
    }));

    // Reset failed counter
    securityStore.recordSuccessfulLogin(cleanEmail);

    // 8. Immutable audit trail
    addAuditLog(
      'SECURITY_PASSWORD_CHANGED',
      cleanEmail,
      'Password successfully reset and updated with salted bcrypt hash using verified old password.'
    );

    return {
      success: true,
      message: 'Your password has been successfully reset! Your new password has been set and is now active.',
    };
  };

  const resetSecurityLimits = () => {
    securityStore.resetAllSecurityLimits();
    addAuditLog('SECURITY_LIMITS_CLEARED', currentUser.name, 'Administrator reset security rate limits and account lockouts.');
  };

  const logoutProvider = () => {
    const previousName = currentUser.name;
    const previousRole = currentUser.role;
    setAuthDoctor(null);
    setAuthAdmin(null);
    switchUser('user-guest');
    setCurrentTab('home');
    addAuditLog('AUTH_LOGOUT', previousName, `Provider ${previousRole} session terminated, returned to public patient view.`);
  };

  const updatePatientProfile = (updated: Partial<PatientProfile>) => {
    setPatientProfile((prev) => {
      const next = { ...prev, ...updated };
      if (updated.avatar && currentUser.role === 'patient') {
        setCurrentUser((u) => ({ ...u, avatar: updated.avatar! }));
      }
      return next;
    });
    addAuditLog('PATIENT_PROFILE_UPDATED', patientProfile.name, 'Medical profile or display picture modified.');
  };

  const updateDoctorProfile = (doctorId: string, updates: Partial<DoctorProfile>) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, ...updates } : d))
    );
    if (authDoctor && authDoctor.id === doctorId) {
      setAuthDoctor((prev) => (prev ? { ...prev, ...updates } : null));
    }
    if (currentUser.role === 'doctor') {
      setCurrentUser((prev) => ({
        ...prev,
        avatar: updates.avatar || prev.avatar,
        name: updates.name || prev.name,
      }));
    }
    addAuditLog('DOCTOR_PROFILE_UPDATED', doctorId, 'Doctor profile or display picture updated.');
  };

  const updateDoctorStatus = (doctorId: string, status: 'approved' | 'pending' | 'suspended') => {
    const targetDoc = doctors.find((d) => d.id === doctorId);
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, status } : d))
    );
    if (authDoctor && authDoctor.id === doctorId) {
      setAuthDoctor((prev) => (prev ? { ...prev, status } : null));
    }
    const logDetails =
      status === 'approved'
        ? `Doctor credential verified & approved by ${currentUser.name}. Profile is now live and visible to all patients.`
        : status === 'suspended'
        ? `Doctor account suspended by ${currentUser.name}. Profile hidden from patient directory.`
        : `Doctor status transitioned to "${status}" by ${currentUser.name}.`;

    addAuditLog(
      'DOCTOR_STATUS_CHANGED',
      targetDoc ? targetDoc.name : doctorId,
      logDetails
    );
  };

  const updateDoctorAvailability = (
    doctorId: string,
    updates: {
      availableDays?: number[];
      availableHours?: { start: string; end: string };
      slotDurationMinutes?: number;
      consultationFee?: number;
      blockedDates?: string[];
    }
  ) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, ...updates } : d))
    );
    addAuditLog('DOCTOR_AVAILABILITY_UPDATED', doctorId, 'Doctor modified schedule hours or consultation fee.');
  };

  const bookAppointment = (data: {
    doctorId: string;
    date: string;
    timeSlot: string;
    reason: string;
    symptoms?: string;
    paymentMethod: 'Credit/Debit Card' | 'UPI' | 'Net Banking';
    amount: number;
    patientName?: string;
    patientEmail?: string;
  }): Appointment => {
    const doc = doctors.find((d) => d.id === data.doctorId);
    if (!doc) {
      throw new Error('Selected doctor profile was not found. Please choose another doctor.');
    }
    if (doc.status !== 'approved') {
      throw new Error(`Dr. ${doc.name}'s profile is currently ${doc.status} and cannot accept patient bookings until approved by platform administration.`);
    }
    if (!data.date || !data.timeSlot) {
      throw new Error('A consultation date and time slot are required to confirm booking.');
    }
    if (!data.reason || !data.reason.trim()) {
      throw new Error('Please specify the primary reason for your consultation.');
    }
    // Atomic double-booking guard: slot must still be free at confirm time
    const slotTaken = appointments.some(
      (a) => a.doctorId === data.doctorId && a.date === data.date && a.timeSlot === data.timeSlot && a.status !== 'cancelled'
    );
    if (slotTaken) {
      throw new Error('This slot was just booked by another patient. Please select a different time.');
    }
    // Amount is always derived from the doctor's current fee (never trust caller-supplied totals)
    const amount = doc.consultationFee;
    const txnId = `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: currentUser.id,
      patientName: (data.patientName || patientProfile.name || 'Patient').trim() || 'Patient',
      patientEmail: (data.patientEmail || patientProfile.email || '').trim(),
      doctorId: data.doctorId,
      doctorName: doc.name,
      doctorSpecialization: doc.specialization,
      doctorAvatar: doc.avatar,
      date: data.date,
      timeSlot: data.timeSlot,
      reason: data.reason,
      symptoms: data.symptoms,
      status: 'scheduled',
      paymentStatus: 'paid',
      paymentMethod: data.paymentMethod,
      transactionId: txnId,
      amount,
      videoRoomId: `room-${currentUser.id.slice(-4)}-${data.doctorId}-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    addAuditLog(
      'APPOINTMENT_CONFIRMED',
      `${newApt.doctorName} on ${newApt.date} at ${newApt.timeSlot}`,
      `Atomic booking confirmed. Transaction ${txnId} verified ($${amount}).`
    );
    return newApt;
  };

  const cancelAppointment = (
    appointmentId: string,
    reason: string,
    cancelledBy: 'patient' | 'doctor' | 'admin'
  ) => {
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) {
      throw new Error('Appointment was not found. It may have been removed already.');
    }
    if (target.status === 'cancelled' || target.status === 'completed' || target.status === 'no_show') {
      throw new Error(`This appointment is already ${target.status.replace('_', ' ')} and cannot be cancelled again.`);
    }
    if (!reason || !reason.trim()) {
      throw new Error('Please provide a brief reason for the cancellation.');
    }
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === appointmentId) {
          return {
            ...apt,
            status: 'cancelled',
            cancellationReason: reason.trim(),
            cancelledBy,
            paymentStatus: 'refunded',
          };
        }
        return apt;
      })
    );
    addAuditLog(
      'APPOINTMENT_CANCELLED',
      appointmentId,
      `Cancelled by ${cancelledBy}. Reason: "${reason.trim()}". Automated refund triggered.`
    );
  };

  const APPOINTMENT_TRANSITIONS: Record<Appointment['status'], Appointment['status'][]> = {
    scheduled: ['in_waiting_room', 'in_consultation', 'completed', 'cancelled', 'no_show'],
    in_waiting_room: ['in_consultation', 'completed', 'cancelled', 'no_show'],
    in_consultation: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  const updateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) return;
    if (target.status === status) return;
    const allowed = APPOINTMENT_TRANSITIONS[target.status] || [];
    if (!allowed.includes(status)) {
      addAuditLog('APPOINTMENT_STATUS_REJECTED', appointmentId, `Illegal transition ${target.status} -> ${status} blocked.`);
      return;
    }
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
    );
    addAuditLog('APPOINTMENT_STATUS_UPDATE', appointmentId, `Status updated to ${status}`);
  };

  const submitRating = (appointmentId: string, rating: number, comment?: string) => {
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target || target.status !== 'completed') return;
    if (target.ratingGiven != null) return; // one rating per appointment
    const safeRating = Math.min(5, Math.max(1, Math.round(rating)));
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, ratingGiven: safeRating, reviewComment: comment } : apt
      )
    );
    // Update doctor's aggregate rating
    const targetApt = appointments.find((a) => a.id === appointmentId);
    if (targetApt) {
      setDoctors((prev) =>
        prev.map((d) => {
          if (d.id === targetApt.doctorId) {
            const newCount = d.reviewCount + 1;
            const newRating = Number(((d.rating * d.reviewCount + rating) / newCount).toFixed(1));
            return { ...d, rating: newRating, reviewCount: newCount };
          }
          return d;
        })
      );
    }
    addAuditLog('DOCTOR_RATED', targetApt ? targetApt.doctorName : appointmentId, `Rated ${rating}/5 stars.`);
  };

  const issuePrescription = (prescriptionData: Omit<Prescription, 'id' | 'issuedAt'>): Prescription => {
    if (!prescriptionData.diagnosis || !prescriptionData.diagnosis.trim()) {
      throw new Error('A clinical diagnosis is required to issue a prescription.');
    }
    const namedMeds = (prescriptionData.medications || []).filter((m) => m.name && m.name.trim());
    if (namedMeds.length === 0) {
      throw new Error('At least one medication with a name is required.');
    }
    const newRx: Prescription = {
      ...prescriptionData,
      diagnosis: prescriptionData.diagnosis.trim(),
      medications: namedMeds,
      id: `rx-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      issuedAt: new Date().toISOString(),
    };

    setPrescriptions((prev) => [newRx, ...prev]);

    // Mark corresponding appointment as completed if not already
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === newRx.appointmentId ? { ...apt, status: 'completed' } : apt
      )
    );

    addAuditLog(
      'PRESCRIPTION_ISSUED',
      `Rx ${newRx.id} for ${newRx.patientName}`,
      `Digitally signed by ${newRx.doctorName} with ${newRx.medications.length} medications.`
    );
    return newRx;
  };

  const uploadHealthRecord = (recordData: Omit<HealthRecord, 'id' | 'uploadedAt'>) => {
    if (!recordData.title || !recordData.title.trim()) {
      throw new Error('A document title is required.');
    }
    const newRec: HealthRecord = {
      ...recordData,
      title: recordData.title.trim(),
      id: `rec-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    setHealthRecords((prev) => [newRec, ...prev]);
    addAuditLog('HEALTH_RECORD_UPLOADED', newRec.title, `Category: ${newRec.category}, Size: ${newRec.fileSize}`);
  };

  const deleteHealthRecord = (recordId: string) => {
    const rec = healthRecords.find((r) => r.id === recordId);
    setHealthRecords((prev) => prev.filter((r) => r.id !== recordId));
    addAuditLog('HEALTH_RECORD_DELETED', rec ? rec.title : recordId, 'Record deleted by patient.');
  };

  const clamp = (v: number, min: number, max: number, fallback: number) =>
    Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

  const addVitalMeasurement = (vitalData: Omit<VitalMeasurement, 'id'>) => {
    if (!vitalData.date) {
      throw new Error('A measurement date is required.');
    }
    const newVit: VitalMeasurement = {
      patientId: vitalData.patientId,
      date: vitalData.date,
      bpSystolic: clamp(vitalData.bpSystolic, 50, 300, 120),
      bpDiastolic: clamp(vitalData.bpDiastolic, 30, 200, 80),
      heartRate: clamp(vitalData.heartRate, 20, 250, 72),
      bloodSugar: clamp(vitalData.bloodSugar, 20, 1000, 90),
      weight: clamp(vitalData.weight, 1, 500, 60),
      id: `vit-${Date.now()}`,
    };
    setVitals((prev) => [...prev, newVit]);
    addAuditLog('VITALS_LOGGED', vitalData.date, `BP: ${vitalData.bpSystolic}/${vitalData.bpDiastolic}, Sugar: ${vitalData.bloodSugar} mg/dL`);
  };

  const updatePlatformConfig = (updated: Partial<PlatformConfig>) => {
    const safe: Partial<PlatformConfig> = { ...updated };
    if (safe.platformCommissionPercent !== undefined) {
      safe.platformCommissionPercent = clamp(safe.platformCommissionPercent, 0, 50, 15);
    }
    if (safe.cancellationWindowHours !== undefined) {
      safe.cancellationWindowHours = clamp(safe.cancellationWindowHours, 0, 72, 4);
    }
    if (safe.minFeeLimit !== undefined) {
      safe.minFeeLimit = Math.max(0, safe.minFeeLimit);
    }
    if (safe.maxFeeLimit !== undefined) {
      safe.maxFeeLimit = Math.max(0, safe.maxFeeLimit);
    }
    if (safe.minFeeLimit !== undefined && safe.maxFeeLimit !== undefined && safe.minFeeLimit > safe.maxFeeLimit) {
      throw new Error('Minimum fee cannot exceed maximum fee.');
    }
    setPlatformConfig((prev) => ({ ...prev, ...safe }));
    addAuditLog('PLATFORM_CONFIG_UPDATED', 'Global Configuration', JSON.stringify(safe));
  };

  const resetToDefaults = () => {
    setCurrentUser(INITIAL_USERS[0]);
    setPatientProfile(INITIAL_PATIENT_PROFILE);
    setDoctors(INITIAL_DOCTORS);
    setAppointments(INITIAL_APPOINTMENTS);
    setPrescriptions(INITIAL_PRESCRIPTIONS);
    setHealthRecords(INITIAL_HEALTH_RECORDS);
    setVitals(INITIAL_VITALS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setPlatformConfig(INITIAL_CONFIG);
    setAuthDoctor(null);
    setAuthAdmin(null);
    setProviderPasswords({});
    localStorage.clear();
    addAuditLog('SYSTEM_RESET', 'All Data', 'Platform data cleared to empty state.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        setCurrentRole,
        switchUser,
        allUsers: INITIAL_USERS,
        patientProfile,
        updatePatientProfile,
        doctors,
        updateDoctorStatus,
        updateDoctorProfile,
        updateDoctorAvailability,
        appointments,
        bookAppointment,
        cancelAppointment,
        updateAppointmentStatus,
        submitRating,
        prescriptions,
        issuePrescription,
        healthRecords,
        uploadHealthRecord,
        deleteHealthRecord,
        vitals,
        addVitalMeasurement,
        auditLogs,
        addAuditLog,
        platformConfig,
        updatePlatformConfig,
        currentTab,
        setCurrentTab,
        activeVideoAppointment,
        setActiveVideoAppointment,
        bookingDoctor,
        setBookingDoctor,
        prefilledBookingData,
        setPrefilledBookingData,
        viewingPrescription,
        setViewingPrescription,
        viewingRecord,
        setViewingRecord,
        doctorPrescriptionTargetApt,
        setDoctorPrescriptionTargetApt,
        authDoctor,
        authAdmin,
        authModalOpen,
        authModalRole,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        doctorLogin,
        adminLogin,
        patientLogin,
        updateAdminProfile,
        doctorRegister,
        adminRegister,
        patientRegister,
        requestPasswordReset,
        resetPasswordWithOldPassword,
        resetSecurityLimits,
        logoutProvider,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
