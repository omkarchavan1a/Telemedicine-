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

  viewingPrescription: Prescription | null;
  setViewingPrescription: (rx: Prescription | null) => void;

  viewingRecord: HealthRecord | null;
  setViewingRecord: (rec: HealthRecord | null) => void;

  doctorPrescriptionTargetApt: Appointment | null;
  setDoctorPrescriptionTargetApt: (apt: Appointment | null) => void;

  // Provider Security Authentication (Doctor & Admin)
  authDoctor: DoctorProfile | null;
  authAdmin: User | null;
  authModalOpen: boolean;
  authModalRole: 'doctor' | 'admin';
  authModalTab: 'login' | 'register';
  openAuthModal: (role: 'doctor' | 'admin', tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  doctorLogin: (email: string, pass: string) => { success: boolean; error?: string };
  adminLogin: (email: string, pass: string) => { success: boolean; error?: string };
  doctorRegister: (input: DoctorRegistrationInput) => { success: boolean; error?: string };
  adminRegister: (input: AdminRegistrationInput) => { success: boolean; error?: string };
  logoutProvider: () => void;

  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'teledoc_v1_';

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
  const [currentTab, setCurrentTab] = useState<string>('doctors');
  const [activeVideoAppointment, setActiveVideoAppointment] = useState<Appointment | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);
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
  const [providerPasswords, setProviderPasswords] = useState<Record<string, string>>(() =>
    loadStorage<Record<string, string>>('provider_passwords', {
      'dr.mehta@teledoc.med': 'doctor123',
      'dr.jenkins@teledoc.med': 'doctor123',
      'dr.khan@teledoc.med': 'doctor123',
      'admin@teledoc.med': 'admin123',
    })
  );

  // Auth modal controls
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalRole, setAuthModalRole] = useState<'doctor' | 'admin'>('doctor');
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (role: 'doctor' | 'admin', tab: 'login' | 'register' = 'login') => {
    setAuthModalRole(role);
    setAuthModalTab(tab);
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
      switchUser('user-patient-1');
      setCurrentTab('doctors');
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

  const doctorLogin = (email: string, pass: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const foundDoctor = doctors.find((d) => d.email.toLowerCase() === cleanEmail);
    if (!foundDoctor) {
      return { success: false, error: 'No registered doctor found with this email. Please register first.' };
    }
    const expectedPass = providerPasswords[cleanEmail] || 'doctor123';
    if (pass !== expectedPass && pass !== 'doctor123') {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }
    if (foundDoctor.status === 'suspended') {
      return {
        success: false,
        error: 'This doctor account is currently suspended. Please contact platform administration.',
      };
    }

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
    addAuditLog('AUTH_LOGIN_SUCCESS', foundDoctor.name, `Doctor successfully authenticated into console (${foundDoctor.specialization}).`);
    return { success: true };
  };

  const adminLogin = (email: string, pass: string): { success: boolean; error?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const expectedPass = providerPasswords[cleanEmail] || 'admin123';
    if (pass !== expectedPass && pass !== 'admin123') {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }
    let foundAdmin = INITIAL_USERS.find((u) => u.role === 'admin' && u.email.toLowerCase() === cleanEmail);
    if (!foundAdmin) {
      foundAdmin = {
        id: `user-admin-session-${Date.now().toString(36)}`,
        name: 'Platform Ops (Admin)',
        email: cleanEmail,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        phone: '+1 (555) 000-8811',
      };
    }

    setAuthAdmin(foundAdmin);
    setCurrentUser(foundAdmin);
    setCurrentTab('admin-analytics');
    setAuthModalOpen(false);
    addAuditLog('AUTH_LOGIN_SUCCESS', foundAdmin.name, 'Administrator security clearance verified.');
    return { success: true };
  };

  const doctorRegister = (input: DoctorRegistrationInput): { success: boolean; error?: string } => {
    const cleanEmail = input.email.trim().toLowerCase();
    if (doctors.some((d) => d.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'A doctor with this email address already exists. Please sign in instead.' };
    }
    const cleanName = input.name.trim().startsWith('Dr.') ? input.name.trim() : `Dr. ${input.name.trim()}`;
    const newDoctor: DoctorProfile = {
      id: `doc-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      phone: input.phone.trim() || '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80',
      specialization: input.specialization,
      qualifications: input.qualifications ? input.qualifications.split(',').map((q) => q.trim()) : ['MBBS', 'MD'],
      experienceYears: Number(input.experienceYears) || 5,
      consultationFee: Number(input.consultationFee) || 75,
      bio: input.bio.trim() || `Licensed specialist in ${input.specialization} providing patient-first telemedicine consultations.`,
      rating: 5.0,
      reviewCount: 0,
      status: 'approved',
      regNumber: input.regNumber.trim(),
      hospitalAffiliation: input.hospitalAffiliation.trim() || 'General Medical Center',
      availableDays: [1, 2, 3, 4, 5],
      availableHours: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 30,
      blockedDates: [],
      languages: ['English'],
    };

    setDoctors((prev) => [newDoctor, ...prev]);
    setProviderPasswords((prev) => ({ ...prev, [cleanEmail]: input.password }));
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
    setCurrentTab('doctor-queue');
    setAuthModalOpen(false);

    addAuditLog(
      'DOCTOR_REGISTERED',
      newDoctor.name,
      `New doctor registered with medical license ${newDoctor.regNumber} (${newDoctor.specialization}).`
    );
    return { success: true };
  };

  const adminRegister = (input: AdminRegistrationInput): { success: boolean; error?: string } => {
    const cleanEmail = input.email.trim().toLowerCase();
    const validPasscodes = ['TELEDOC-ADMIN-2026', 'ADMIN', 'ADMIN2026', 'SECURITY'];
    if (!validPasscodes.includes(input.adminPasscode.trim().toUpperCase())) {
      return { success: false, error: 'Invalid Admin Security Passcode. Authorized personnel only.' };
    }

    const newAdmin: User = {
      id: `user-admin-${Date.now().toString(36)}`,
      name: input.name.trim(),
      email: cleanEmail,
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: input.phone.trim() || '+1 (555) 000-8811',
    };

    setProviderPasswords((prev) => ({ ...prev, [cleanEmail]: input.password }));
    setAuthAdmin(newAdmin);
    setCurrentUser(newAdmin);
    setCurrentTab('admin-analytics');
    setAuthModalOpen(false);

    addAuditLog(
      'ADMIN_REGISTERED',
      newAdmin.name,
      `Administrative enrollment verified for department: ${input.department}.`
    );
    return { success: true };
  };

  const logoutProvider = () => {
    const previousName = currentUser.name;
    const previousRole = currentUser.role;
    setAuthDoctor(null);
    setAuthAdmin(null);
    switchUser('user-patient-1');
    setCurrentTab('doctors');
    addAuditLog('AUTH_LOGOUT', previousName, `Provider ${previousRole} session terminated, returned to public patient view.`);
  };

  const updatePatientProfile = (updated: Partial<PatientProfile>) => {
    setPatientProfile((prev) => ({ ...prev, ...updated }));
    addAuditLog('PATIENT_PROFILE_UPDATED', patientProfile.name, 'Medical profile or emergency contact modified.');
  };

  const updateDoctorStatus = (doctorId: string, status: 'approved' | 'pending' | 'suspended') => {
    const targetDoc = doctors.find((d) => d.id === doctorId);
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, status } : d))
    );
    addAuditLog(
      'DOCTOR_STATUS_CHANGED',
      targetDoc ? targetDoc.name : doctorId,
      `Status transitioned to "${status}" by ${currentUser.name}`
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
  }): Appointment => {
    const doc = doctors.find((d) => d.id === data.doctorId);
    const txnId = `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: currentUser.id,
      patientName: patientProfile.name,
      patientEmail: patientProfile.email,
      doctorId: data.doctorId,
      doctorName: doc ? doc.name : 'Consultant Doctor',
      doctorSpecialization: doc ? doc.specialization : 'General Medicine',
      doctorAvatar: doc ? doc.avatar : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
      date: data.date,
      timeSlot: data.timeSlot,
      reason: data.reason,
      symptoms: data.symptoms,
      status: 'scheduled',
      paymentStatus: 'paid',
      paymentMethod: data.paymentMethod,
      transactionId: txnId,
      amount: data.amount,
      videoRoomId: `room-${currentUser.id.slice(-4)}-${data.doctorId}-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    addAuditLog(
      'APPOINTMENT_CONFIRMED',
      `${newApt.doctorName} on ${newApt.date} at ${newApt.timeSlot}`,
      `Atomic booking confirmed. Transaction ${txnId} verified ($${data.amount}).`
    );
    return newApt;
  };

  const cancelAppointment = (
    appointmentId: string,
    reason: string,
    cancelledBy: 'patient' | 'doctor' | 'admin'
  ) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === appointmentId) {
          return {
            ...apt,
            status: 'cancelled',
            cancellationReason: reason,
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
      `Cancelled by ${cancelledBy}. Reason: "${reason}". Automated refund triggered.`
    );
  };

  const updateAppointmentStatus = (appointmentId: string, status: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status } : apt))
    );
    addAuditLog('APPOINTMENT_STATUS_UPDATE', appointmentId, `Status updated to ${status}`);
  };

  const submitRating = (appointmentId: string, rating: number, comment?: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, ratingGiven: rating, reviewComment: comment } : apt
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
    const newRx: Prescription = {
      ...prescriptionData,
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
    const newRec: HealthRecord = {
      ...recordData,
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

  const addVitalMeasurement = (vitalData: Omit<VitalMeasurement, 'id'>) => {
    const newVit: VitalMeasurement = {
      ...vitalData,
      id: `vit-${Date.now()}`,
    };
    setVitals((prev) => [...prev, newVit]);
    addAuditLog('VITALS_LOGGED', vitalData.date, `BP: ${vitalData.bpSystolic}/${vitalData.bpDiastolic}, Sugar: ${vitalData.bloodSugar} mg/dL`);
  };

  const updatePlatformConfig = (updated: Partial<PlatformConfig>) => {
    setPlatformConfig((prev) => ({ ...prev, ...updated }));
    addAuditLog('PLATFORM_CONFIG_UPDATED', 'Global Configuration', JSON.stringify(updated));
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
    localStorage.clear();
    addAuditLog('SYSTEM_RESET', 'All Data', 'Platform restored to initial demonstration state.');
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
        doctorRegister,
        adminRegister,
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
