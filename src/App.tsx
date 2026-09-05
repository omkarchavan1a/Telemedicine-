import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DoctorProfile } from './types';
import { Navbar } from './components/layout/Navbar';
import { DoctorDirectory } from './components/patient/DoctorDirectory';
import { DoctorProfileModal } from './components/patient/DoctorProfileModal';
import { BookingModal } from './components/patient/BookingModal';
import { PatientAppointments } from './components/patient/PatientAppointments';
import { HealthRecordsVault } from './components/patient/HealthRecordsVault';
import { MedicalProfileView } from './components/patient/MedicalProfileView';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { AvailabilityManager } from './components/doctor/AvailabilityManager';
import { DoctorAnalytics } from './components/doctor/DoctorAnalytics';
import { PrescriptionPadModal } from './components/doctor/PrescriptionPadModal';
import { PrescriptionModal } from './components/prescription/PrescriptionModal';
import { VideoRoom } from './components/video/VideoRoom';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { SecurityCheckpoint } from './components/auth/SecurityCheckpoint';
import {
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  Lock,
  Heart,
  Calendar,
  Users,
  FileText,
  Activity,
  Award,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    currentRole,
    currentTab,
    setCurrentTab,
    activeVideoAppointment,
    setActiveVideoAppointment,
    viewingPrescription,
    setViewingPrescription,
    doctorPrescriptionTargetApt,
    setDoctorPrescriptionTargetApt,
    authDoctor,
    authAdmin,
  } = useApp();

  // Modals for directory & booking flows
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);

  const handleOpenBooking = (doctor: DoctorProfile) => {
    setSelectedDoctor(null);
    setBookingDoctor(doctor);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/70 to-blue-50/40 flex flex-col font-sans text-slate-800 selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Liquid Ambient Aura Background Blobs (underneath frosted glass layers) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-20 w-96 h-96 sm:w-[520px] sm:h-[520px] rounded-full bg-blue-400/15 blur-3xl animate-liquid-float" />
        <div className="absolute top-1/4 -right-24 w-96 h-96 sm:w-[600px] sm:h-[600px] rounded-full bg-indigo-400/15 blur-3xl animate-liquid-float-reverse" />
        <div className="absolute top-2/3 left-1/4 w-80 h-80 sm:w-[500px] sm:h-[500px] rounded-full bg-cyan-300/15 blur-3xl animate-liquid-float" />
        <div className="absolute -bottom-20 right-1/3 w-80 h-80 sm:w-[480px] sm:h-[480px] rounded-full bg-emerald-300/12 blur-3xl animate-liquid-float-reverse" />
      </div>

      {/* Top Main Navigation Bar */}
      <Navbar />

      {/* Main View Port Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Role-specific views */}
        {currentRole === 'patient' && (
          <>
            {(currentTab === 'find-doctors' || currentTab === 'doctors' || currentTab === 'home') && (
              <DoctorDirectory
                onSelectDoctor={(doc) => setSelectedDoctor(doc)}
                onBookDoctor={(doc) => setBookingDoctor(doc)}
                onViewDoctorProfile={(doc) => setSelectedDoctor(doc)}
                onSelectDoctorToBook={(doc) => setBookingDoctor(doc)}
              />
            )}

            {currentTab === 'appointments' && (
              <PatientAppointments
                onBookNew={() => setCurrentTab('doctors')}
              />
            )}

            {(currentTab === 'health-records' || currentTab === 'records') && <HealthRecordsVault />}

            {(currentTab === 'medical-profile' || currentTab === 'profile') && <MedicalProfileView />}
          </>
        )}

        {currentRole === 'doctor' && (
          !authDoctor ? (
            <SecurityCheckpoint requiredRole="doctor" />
          ) : (
            <>
              {currentTab === 'doctor-queue' && <DoctorDashboard />}
              {(currentTab === 'doctor-availability' || currentTab === 'availability') && <AvailabilityManager />}
              {currentTab === 'doctor-analytics' && <DoctorAnalytics />}
            </>
          )
        )}

        {currentRole === 'admin' && (
          !authAdmin ? (
            <SecurityCheckpoint requiredRole="admin" />
          ) : (
            <AdminDashboard />
          )
        )}
      </main>

      {/* Persistent Global Modals */}

      {/* Security Login & Provider Registration Modal */}
      <AuthModal />

      {/* 1. Doctor Profile Modal */}
      {selectedDoctor && (
        <DoctorProfileModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          onBook={handleOpenBooking}
        />
      )}

      {/* 2. Slot Selection & Mock Payment Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBookingSuccess={() => {
            setCurrentTab('appointments');
          }}
        />
      )}

      {/* 3. Real-time Video Consultation Room */}
      {activeVideoAppointment && (
        <VideoRoom
          appointment={activeVideoAppointment}
          onClose={() => setActiveVideoAppointment(null)}
        />
      )}

      {/* 4. Official Printable Digital Prescription Viewer */}
      {viewingPrescription && (
        <PrescriptionModal
          prescription={viewingPrescription}
          onClose={() => setViewingPrescription(null)}
        />
      )}

      {/* 5. Doctor Structured Prescription Pad Modal */}
      {doctorPrescriptionTargetApt && (
        <PrescriptionPadModal
          appointment={doctorPrescriptionTargetApt}
          onClose={() => setDoctorPrescriptionTargetApt(null)}
          onSuccess={() => {
            // Completed prescription sign-off
          }}
        />
      )}

      {/* Footer & Compliance Safeguards */}
      <footer className="no-print relative z-10 liquid-glass border-t border-white/80 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Emergency Lifeline Callout - Bento Glass Pill */}
          <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/60 shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="text-amber-950">Medical Emergency Notice:</strong> TeleDoc is designed for non-emergency outpatient teleconsultations. If you are experiencing chest pain, difficulty breathing, stroke symptoms, or severe trauma, please immediately call <strong>911 / 112</strong> or visit the nearest emergency medical facility.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="tel:911"
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 911</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200/60 pt-6 text-[11px]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-xs" />
                TeleDoc Health Platform
              </div>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50/80 border border-emerald-200/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                HIPAA Compliant Vault
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1 text-slate-700 font-medium px-2 py-0.5 rounded-full bg-slate-100/80 border border-slate-200/60">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                AES-256 E2E Encryption
              </span>
            </div>

            <div className="text-slate-500">
              Telemedicine Suite v1.4.2 · Liquid Glass & Bento Morphism Edition
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
