import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { downloadDoctorVisitSummaryPdf } from '../../utils/pdfReport';
import { JpgAvatarUploader } from '../common/JpgAvatarUploader';
import { getAppointmentScheduleInfo } from '../../utils/timeSlots';
import {
  Users,
  Video,
  FileText,
  Clock,
  Calendar,
  IndianRupee,
  Star,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  TrendingUp,
  Camera,
  X,
  ShieldCheck,
  Pencil,
  Save,
  Sparkles,
  PlayCircle,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const {
    currentUser,
    setCurrentRole,
    setCurrentTab,
    appointments,
    doctors,
    authDoctor,
    setActiveVideoAppointment,
    updateAppointmentStatus,
    setViewingPrescription,
    prescriptions,
    setDoctorPrescriptionTargetApt,
    updateDoctorProfile,
     platformConfig,
     vitals,
     healthRecords,
   } = useApp();

  const [queueFilter, setQueueFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showDoctorDpEdit, setShowDoctorDpEdit] = useState(false);
  const [dpUpdatedMsg, setDpUpdatedMsg] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [editFee, setEditFee] = useState(0);
  const [editBio, setEditBio] = useState('');
  const [editLanguages, setEditLanguages] = useState('');

  const openProfileEdit = (phone: string, hospital: string, fee: number, bio: string, languages: string[]) => {
    setEditPhone(phone);
    setEditHospital(hospital);
    setEditFee(fee);
    setEditBio(bio);
    setEditLanguages(languages.join(', '));
    setProfileError('');
    setProfileSavedMsg(false);
    setShowProfileEdit(true);
  };

  const saveProfileEdit = (doctorId: string) => {
    setProfileError('');
    const feeNum = Number(editFee);
    if (!Number.isFinite(feeNum) || feeNum < platformConfig.minFeeLimit || feeNum > platformConfig.maxFeeLimit) {
      setProfileError(`Consultation fee must be between ₹${platformConfig.minFeeLimit} and ₹${platformConfig.maxFeeLimit}.`);
      return;
    }
    updateDoctorProfile(doctorId, {
      phone: editPhone.trim(),
      hospitalAffiliation: editHospital.trim() || 'General Medical Center',
      consultationFee: Math.round(feeNum),
      bio: editBio.trim(),
      languages: editLanguages.split(',').map((l) => l.trim()).filter(Boolean),
    });
    setProfileSavedMsg(true);
    setTimeout(() => {
      setProfileSavedMsg(false);
      setShowProfileEdit(false);
    }, 1500);
  };

  // Identify active doctor dynamically (strict: never fall back to another doctor's profile)
  const activeDoctor =
    authDoctor ||
    doctors.find(
      (d) =>
        d.id === currentUser.id ||
        (currentUser.email && d.email.toLowerCase() === currentUser.email.toLowerCase())
    );

  if (!activeDoctor) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xs text-center space-y-2">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Doctor profile not found</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Your session is not linked to a registered doctor profile. Please sign in again or complete registration.
        </p>
      </div>
    );
  }

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter appointments for active doctor
  const doctorAppointments = appointments.filter(
    (apt) =>
      apt.doctorId === activeDoctor.id ||
      apt.doctorName.toLowerCase().includes(activeDoctor.name.toLowerCase().split(',')[0])
  );

  const waitingOrActive = doctorAppointments.find((a) => {
    if (a.status === 'in_waiting_room' || a.status === 'in_consultation') return true;
    if (a.status === 'scheduled') {
      const sch = getAppointmentScheduleInfo(a.date, a.timeSlot, 30, now);
      return sch.isLiveNow || sch.isApproaching;
    }
    return false;
  });

  const completedToday = doctorAppointments.filter((a) => a.status === 'completed');
  const totalEarnings = doctorAppointments
    .filter((a) => a.status === 'completed' || a.status === 'scheduled')
    .reduce((sum, a) => sum + a.amount, 0);

  const filteredQueue = doctorAppointments.filter((apt) => {
    if (queueFilter === 'pending') {
      return (
        apt.status === 'in_waiting_room' ||
        apt.status === 'in_consultation' ||
        apt.status === 'scheduled'
      );
    }
    if (queueFilter === 'completed') {
      return apt.status === 'completed';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="relative group shrink-0">
              {activeDoctor.avatar ? (
                <img
                  src={activeDoctor.avatar}
                  alt={activeDoctor.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-200 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {activeDoctor.name.charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowDoctorDpEdit(!showDoctorDpEdit)}
                title="Update doctor DP (JPG)"
                className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-xs transition-transform hover:scale-110"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Doctor Console · Active Shift
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">
                {activeDoctor.name}
              </h1>
              <p className="text-xs text-slate-500">
                {activeDoctor.specialization} Specialist · {activeDoctor.hospitalAffiliation} · Lic #{activeDoctor.regNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDoctorDpEdit(!showDoctorDpEdit)}
              className="px-3 py-1.5 border border-slate-200 hover:border-blue-400 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-blue-50/50 flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>{showDoctorDpEdit ? 'Hide DP Uploader' : 'Change DP (JPG)'}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                showProfileEdit
                  ? setShowProfileEdit(false)
                  : openProfileEdit(
                      activeDoctor.phone,
                      activeDoctor.hospitalAffiliation,
                      activeDoctor.consultationFee,
                      activeDoctor.bio,
                      activeDoctor.languages
                    )
              }
              className="px-3 py-1.5 border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 bg-slate-50 hover:bg-indigo-50/50 flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showProfileEdit ? 'Hide Profile Editor' : 'Edit Profile'}</span>
            </button>

            {activeDoctor.status === 'pending' ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending Admin Approval</span>
                </span>
              </div>
            ) : activeDoctor.status === 'suspended' ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Account Suspended</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Telemedicine Shift: Available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Pending Administrative Approval Notice Banner */}
        {activeDoctor.status === 'pending' && (
          <div className="mt-5 p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border-2 border-amber-300/80 rounded-2xl shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-5 h-5 text-amber-700 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-amber-950">
                      Application Pending Administrative Verification & Approval
                    </h3>
                    <span className="px-2 py-0.5 bg-amber-200/90 text-amber-900 text-[10px] font-extrabold uppercase rounded-full">
                      Admin Approval Required
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                    Your medical credentials (License <strong className="font-mono text-amber-950">#{activeDoctor.regNumber}</strong>, {activeDoctor.hospitalAffiliation}) have been submitted. In compliance with patient safety protocols, your profile is hidden from the public patient directory and symptom matcher until approved by Platform Administration.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentRole('admin');
                    setCurrentTab('admin-doctors');
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Review in Admin Portal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Doctor JPG DP Uploader */}
        {showDoctorDpEdit && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Upload Doctor Display Picture (JPG format only)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Update your official verified headshot displayed to prospective patients.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDoctorDpEdit(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <JpgAvatarUploader
              currentAvatar={activeDoctor.avatar}
              fallbackName={activeDoctor.name}
              onAvatarChange={(newAvatarUrl) => {
                updateDoctorProfile(activeDoctor.id, { avatar: newAvatarUrl });
                setDpUpdatedMsg(true);
                setTimeout(() => setDpUpdatedMsg(false), 3000);
              }}
              label="Select or drag-and-drop a JPG headshot for doctor profile"
            />
            {dpUpdatedMsg && (
              <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Doctor display picture updated successfully!
              </p>
            )}
          </div>
        )}

        {/* Expandable Doctor Profile Editor */}
        {showProfileEdit && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-indigo-600" />
                Edit Professional Profile
              </h4>
              <button
                type="button"
                onClick={() => setShowProfileEdit(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close profile editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {profileError && (
              <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                {profileError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Consultation Fee (₹ {platformConfig.minFeeLimit}–{platformConfig.maxFeeLimit})
                </label>
                <input
                  type="number"
                  min={platformConfig.minFeeLimit}
                  max={platformConfig.maxFeeLimit}
                  value={editFee}
                  onChange={(e) => setEditFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Hospital / Clinic Affiliation</label>
              <input
                type="text"
                value={editHospital}
                onChange={(e) => setEditHospital(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Languages (comma separated)</label>
              <input
                type="text"
                value={editLanguages}
                onChange={(e) => setEditLanguages(e.target.value)}
                placeholder="English, Hindi"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Professional Bio</label>
              <textarea
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => saveProfileEdit(activeDoctor.id)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{profileSavedMsg ? 'Profile Saved!' : 'Save Profile'}</span>
            </button>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Total Bookings</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {doctorAppointments.length}
            </div>
            <div className="text-[11px] text-blue-600 mt-1 flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>Patients assigned</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Completed Visits</div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">
              {completedToday.length}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Digital prescriptions signed</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Gross Billings</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              ₹{totalEarnings}.00
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct patient fees</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Patient Rating</div>
            <div className="text-2xl font-extrabold text-amber-500 mt-0.5 flex items-center gap-1">
              <span>{activeDoctor.rating.toFixed(1)}</span>
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{activeDoctor.reviewCount} verified reviews</div>
          </div>
        </div>
      </div>

      {/* Active Call Alert if a patient is in waiting room or scheduled time arrived */}
      {waitingOrActive && (() => {
        const sch = getAppointmentScheduleInfo(waitingOrActive.date, waitingOrActive.timeSlot, 30, now);
        const isWaiting = waitingOrActive.status === 'in_waiting_room';
        const isLive = sch.isLiveNow || waitingOrActive.status === 'in_consultation';

        return (
          <div
            className={`border rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              isLive
                ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center animate-pulse shrink-0 ${
                  isLive ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    isLive
                      ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  {isLive
                    ? 'Scheduled Time Arrived · Live Consultation Now'
                    : isWaiting
                    ? 'Patient Waiting In Room'
                    : `Starts in ${sch.countdownFormatted}`}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {waitingOrActive.patientName} — Consultation Ready
                </h3>
                <p className="text-xs text-slate-600">
                  Reason: {waitingOrActive.reason} · Slot: {waitingOrActive.date} at {waitingOrActive.timeSlot} ({sch.countdownFormatted})
                </p>
              </div>
            </div>

            <button
              id="doctor-join-waiting-room-btn"
              onClick={() => {
                if (waitingOrActive.status === 'scheduled') {
                  updateAppointmentStatus(waitingOrActive.id, 'in_consultation');
                }
                setActiveVideoAppointment(waitingOrActive);
              }}
              className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 shrink-0 ${
                isLive
                  ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse ring-2 ring-emerald-300'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{isLive ? 'Start Live Video Call' : 'Admit Patient & Start Call'}</span>
            </button>
          </div>
        );
      })()}

      {/* Consultation Queue List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Consultation Queue & Patient Caseload
            </h2>
            <p className="text-xs text-slate-500">
              Inspect patient symptoms, launch video appointments, or sign digital prescriptions.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setQueueFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                queueFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({doctorAppointments.length})
            </button>
            <button
              onClick={() => setQueueFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                queueFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setQueueFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                queueFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {filteredQueue.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No consultations found in this queue.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQueue.map((apt) => {
              const rx = prescriptions.find((p) => p.appointmentId === apt.id);
              const isWaiting = apt.status === 'in_waiting_room';
              const isJoinable = apt.status === 'in_waiting_room' || apt.status === 'scheduled' || apt.status === 'in_consultation';
              const schedule = getAppointmentScheduleInfo(apt.date, apt.timeSlot, 30, now);

              return (
                <div
                  key={apt.id}
                  id={`doctor-queue-apt-${apt.id}`}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isWaiting
                      ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-200'
                      : schedule.isLiveNow && isJoinable
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                      : 'bg-white border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{apt.patientName}</span>
                      <span className="text-[11px] text-slate-500">({apt.patientEmail})</span>

                      {isWaiting ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold animate-pulse">
                          ● Waiting in Room
                        </span>
                      ) : apt.status === 'completed' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-semibold">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-semibold">
                          Scheduled
                        </span>
                      )}

                      {/* Schedule status badge */}
                      {isJoinable && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${schedule.badgeStyle}`}>
                          <Clock className="w-3 h-3" />
                          <span>{schedule.badgeText}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {apt.date} · {apt.timeSlot}
                      </span>
                      <span>•</span>
                      <span className="text-slate-600">
                        Fee: <strong>₹{String(apt.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</strong> ({apt.paymentStatus})
                      </span>
                    </div>

                    {/* Schedule countdown text */}
                    {isJoinable && (
                      <div className="pt-0.5">
                        {schedule.isLiveNow ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Schedule Time Arrived: Live Video Slot Open ({schedule.countdownFormatted})</span>
                          </div>
                        ) : schedule.isApproaching ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                            <Sparkles className="w-3 h-3 text-amber-700" />
                            <span>Starts in {schedule.countdownFormatted}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Scheduled to start in {schedule.countdownFormatted}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-700">
                      <strong className="text-slate-900">Symptoms / Concern:</strong> {apt.reason}
                    </p>
                    {apt.symptoms && (
                      <p className="text-xs text-slate-500 italic">
                        "{apt.symptoms}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Enter Video Call */}
                    {(apt.status === 'in_waiting_room' || apt.status === 'scheduled') && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (apt.status === 'scheduled') {
                              updateAppointmentStatus(apt.id, 'in_consultation');
                            }
                            setActiveVideoAppointment(apt);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition-colors ${
                            schedule.isLiveNow
                              ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse ring-2 ring-emerald-300'
                              : isWaiting
                              ? 'bg-rose-600 hover:bg-rose-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>
                            {schedule.isLiveNow
                              ? 'Start Scheduled Call'
                              : isWaiting
                              ? 'Admit Patient Now'
                              : 'Open Video Room'}
                          </span>
                        </button>

                        {/* Early start option */}
                        {schedule.isFuture && (
                          <button
                            type="button"
                            onClick={() => {
                              updateAppointmentStatus(apt.id, 'in_consultation');
                              setActiveVideoAppointment(apt);
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline"
                            title="Start call early ahead of schedule"
                          >
                            Start Early
                          </button>
                        )}
                      </div>
                    )}

                    {/* Write Prescription Button */}
                    {!rx && (
                      <button
                        onClick={() => setDoctorPrescriptionTargetApt(apt)}
                        className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Issue Prescription</span>
                      </button>
                    )}

                     {/* View Issued Prescription if completed */}
                     {rx && (
                       <button
                         onClick={() => setViewingPrescription(rx)}
                         className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                       >
                         <FileText className="w-3.5 h-3.5 text-emerald-600" />
                         <span>View Issued Rx</span>
                       </button>
                     )}

                     <button
                       onClick={() =>
                         downloadDoctorVisitSummaryPdf({
                           appointment: apt,
                           prescription: rx,
                           patientProfile: null,
                           doctor: activeDoctor,
                           vitals: vitals || [],
                           healthRecords: healthRecords || [],
                           platformConfig,
                         })
                       }
                       className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                     >
                       <FileText className="w-3.5 h-3.5" />
                       <span>Download Visit Summary PDF</span>
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
