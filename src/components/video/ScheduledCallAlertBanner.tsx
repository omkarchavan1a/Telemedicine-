import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getAppointmentScheduleInfo,
  playAppointmentChime,
  localDateKey,
  formatMinutesToSlot,
} from '../../utils/timeSlots';
import { Video, Clock, Bell, X, Sparkles, ArrowRight } from 'lucide-react';

export const ScheduledCallAlertBanner: React.FC = () => {
  const {
    currentUser,
    currentRole,
    authDoctor,
    appointments,
    activeVideoAppointment,
    setActiveVideoAppointment,
    updateAppointmentStatus,
  } = useApp();

  const [now, setNow] = useState(() => new Date());
  const [dismissedAptIds, setDismissedAptIds] = useState<Record<string, number>>({});
  const alertedAptIdsRef = useRef<Set<string>>(new Set());

  // Tick every second to ensure precision countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Don't show the floating banner if already inside an active video call
  if (activeVideoAppointment) {
    return null;
  }

  // Find relevant active appointments for the current user
  const relevantAppointments = appointments.filter((apt) => {
    if (apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no_show') {
      return false;
    }
    if (currentRole === 'patient') {
      return (
        apt.patientId === currentUser.id ||
        (currentUser.email && apt.patientEmail === currentUser.email)
      );
    }
    if (currentRole === 'doctor') {
      return (
        (authDoctor && apt.doctorId === authDoctor.id) ||
        apt.doctorName === currentUser.name ||
        apt.doctorId === currentUser.id
      );
    }
    // Admin sees all active appointments
    return true;
  });

  // Check each relevant appointment's schedule info
  const scheduledReadyApts = relevantAppointments
    .map((apt) => ({
      apt,
      schedule: getAppointmentScheduleInfo(apt.date, apt.timeSlot, 30, now),
    }))
    .filter(({ apt, schedule }) => {
      // Is it live now or approaching (starts in <= 10 mins)?
      if (!schedule.isLiveNow && !schedule.isApproaching && apt.status !== 'in_waiting_room') {
        return false;
      }
      // Check if dismissed recently (within last 3 minutes)
      const dismissedAt = dismissedAptIds[apt.id];
      if (dismissedAt && now.getTime() - dismissedAt < 3 * 60 * 1000) {
        return false;
      }
      return true;
    });

  if (scheduledReadyApts.length === 0) {
    return null;
  }

  // Take the most urgent appointment (live now first, or closest to start)
  const currentReady = scheduledReadyApts[0];
  const { apt, schedule } = currentReady;

  // Play chime once when entering live_now
  if (schedule.isLiveNow && !alertedAptIdsRef.current.has(apt.id)) {
    alertedAptIdsRef.current.add(apt.id);
    playAppointmentChime();
  }

  const handleStartCall = () => {
    if (apt.status === 'scheduled') {
      // If doctor starts, set to consultation, if patient starts, waiting room or direct consultation
      updateAppointmentStatus(apt.id, currentRole === 'doctor' ? 'in_consultation' : 'in_waiting_room');
    }
    setActiveVideoAppointment(apt);
  };

  const handleDismiss = () => {
    setDismissedAptIds((prev) => ({ ...prev, [apt.id]: now.getTime() }));
  };

  const isLive = schedule.isLiveNow || apt.status === 'in_consultation';
  const isApproaching = schedule.isApproaching && !isLive;

  return (
    <aside
      role="region"
      aria-label="Scheduled appointment notification"
      className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-lg w-[calc(100%-2rem)] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div
        className={`p-4 sm:p-5 rounded-3xl shadow-2xl backdrop-blur-xl border flex flex-col gap-3.5 transition-all ${
          isLive
            ? 'bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-emerald-950/95 border-emerald-400/60 ring-2 ring-emerald-500/40 text-white shadow-emerald-950/40'
            : 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-amber-400/60 ring-2 ring-amber-500/40 text-white shadow-amber-950/40'
        }`}
      >
        {/* Top header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                isLive
                  ? 'bg-emerald-500 text-white animate-pulse'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {isLive ? <Video className="w-5 h-5" /> : <Bell className="w-5 h-5 animate-bounce" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isLive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  }`}
                >
                  {isLive ? 'Scheduled Time Arrived · Live Now' : 'Scheduled Call Starting Soon'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h4 className="text-sm font-extrabold text-white mt-0.5">
                {currentRole === 'patient'
                  ? `Consultation with ${apt.doctorName}`
                  : `Patient Visit: ${apt.patientName}`}
              </h4>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss scheduled call banner"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Schedule slot & live countdown details */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Scheduled: <strong>{apt.timeSlot}</strong>
            </span>
          </div>

          <div
            className={`font-mono font-bold text-xs flex items-center gap-1 ${
              isLive ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{schedule.countdownFormatted}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            id="start-scheduled-call-alert-btn"
            onClick={handleStartCall}
            className={`flex-1 py-3 px-4 rounded-2xl text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              isLive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black shadow-emerald-500/30 ring-2 ring-white/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-amber-500/30'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{isLive ? 'Start Video Call Now' : 'Enter Waiting Room Now'}</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            onClick={handleDismiss}
            className="px-3 py-3 rounded-2xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </aside>
  );
};
