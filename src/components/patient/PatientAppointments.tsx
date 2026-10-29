import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import { downloadPatientHealthSummaryPdf } from '../../utils/pdfReport';
import {
  getAppointmentScheduleInfo,
  playAppointmentChime,
} from '../../utils/timeSlots';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Star,
  XCircle,
  CheckCircle2,
  IndianRupee,
  AlertTriangle,
  Send,
  Sparkles,
  PlayCircle,
} from 'lucide-react';

interface PatientAppointmentsProps {
  onBookNew: () => void;
}

export const PatientAppointments: React.FC<PatientAppointmentsProps> = ({ onBookNew }) => {
  const {
    currentUser,
    appointments,
    cancelAppointment,
    setActiveVideoAppointment,
    updateAppointmentStatus,
    setViewingPrescription,
    prescriptions,
    vitals,
    healthRecords,
    doctors,
    patientProfile,
    submitRating,
    platformConfig,
  } = useApp();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [ratingAptId, setRatingAptId] = useState<string | null>(null);
  const [starCount, setStarCount] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  // Filter appointments for this patient
  const patientAppointments = appointments.filter(
    (apt) => apt.patientId === currentUser.id || apt.patientEmail === currentUser.email
  );

  const filteredAppointments = patientAppointments.filter((apt) => {
    if (activeTab === 'upcoming') {
      return apt.status === 'scheduled' || apt.status === 'in_waiting_room' || apt.status === 'in_consultation';
    }
    if (activeTab === 'completed') {
      return apt.status === 'completed';
    }
    return true;
  });

  const handleRatingSubmit = (aptId: string) => {
    submitRating(aptId, starCount, reviewComment);
    setRatingAptId(null);
    setReviewComment('');
  };

  const handleCancelSubmit = () => {
    if (!cancelModalApt) return;
    if (!cancelReason.trim()) {
      setCancelError('Please specify a brief reason for the cancellation.');
      return;
    }
    try {
      cancelAppointment(cancelModalApt.id, cancelReason.trim(), 'patient');
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Cancellation failed. Please try again.');
      return;
    }
    setCancelModalApt(null);
    setCancelReason('');
    setCancelError('');
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'in_waiting_room':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            In Waiting Room (Ready)
          </span>
        );
      case 'in_consultation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Consultation In Progress
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Calendar className="w-3 h-3" />
            Confirmed & Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Cancelled (Refunded)
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            No Show
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            My Consultations & Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your teleconsultation schedule, join video calls, and access clinical prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() =>
              downloadPatientHealthSummaryPdf({
                patient: { name: currentUser.name, email: currentUser.email },
                patientProfile: patientProfile,
                appointments: patientAppointments,
                prescriptions: prescriptions.filter((p) => p.patientId === (currentUser.id || currentUser.name)),
                healthRecords: (healthRecords || []).filter((r) => r.patientId === (currentUser.id || currentUser.name)),
                vitals: (vitals || []).filter((v) => v.patientId === (currentUser.id || currentUser.name)),
                doctors: doctors || [],
              })
            }
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Download Health Summary PDF</span>
          </button>
          <button
            onClick={onBookNew}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Book New Consultation</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-xl transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Bookings ({patientAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3.5 py-1.5 rounded-xl transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active & Upcoming ({patientAppointments.filter((a) => a.status === 'scheduled' || a.status === 'in_waiting_room' || a.status === 'in_consultation').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3.5 py-1.5 rounded-xl transition-colors ${
            activeTab === 'completed'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Completed ({patientAppointments.filter((a) => a.status === 'completed').length})
        </button>
      </div>

      {/* Appointment Cards */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You don't have any appointments under this tab. You can schedule a video consultation anytime.
          </p>
          <button
            onClick={onBookNew}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Find a Doctor
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const rx = prescriptions.find((p) => p.appointmentId === apt.id);
            const isJoinable =
              apt.status === 'in_waiting_room' ||
              apt.status === 'in_consultation' ||
              apt.status === 'scheduled';
            const schedule = getAppointmentScheduleInfo(apt.date, apt.timeSlot, 30, now);

            return (
              <div
                key={apt.id}
                id={`appointment-card-${apt.id}`}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  schedule.isLiveNow && isJoinable
                    ? 'border-emerald-400 ring-2 ring-emerald-200/70 bg-gradient-to-r from-emerald-50/30 to-white'
                    : schedule.isApproaching && isJoinable
                    ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/20'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                {/* Doctor info & appointment time */}
                <div className="flex items-start gap-4">
                  <img
                    src={apt.doctorAvatar}
                    alt={apt.doctorName}
                    className="w-14 h-14 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-slate-900">{apt.doctorName}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                        {apt.doctorSpecialization}
                      </span>
                      {getStatusBadge(apt.status)}

                      {/* Schedule status badge */}
                      {isJoinable && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${schedule.badgeStyle}`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{schedule.badgeText}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {apt.date}
                      </span>
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        {apt.timeSlot}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                        ₹{String(apt.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ({apt.paymentStatus})
                      </span>
                    </div>

                    {/* Schedule Live Countdown Callout */}
                    {isJoinable && (
                      <div className="pt-0.5">
                        {schedule.isLiveNow ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>Schedule Time Arrived: Video consultation is active now! ({schedule.countdownFormatted})</span>
                          </div>
                        ) : schedule.isApproaching ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-100/90 text-amber-900 border border-amber-300">
                            <Sparkles className="w-3 h-3 text-amber-700 animate-spin" />
                            <span>Scheduled start in {schedule.countdownFormatted} · Waiting room open</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Video call will be ready at scheduled time ({schedule.countdownFormatted})</span>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-600">
                      <strong className="text-slate-800">Reason:</strong> {apt.reason}
                    </p>

                    {apt.cancellationReason && (
                      <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg inline-block">
                        <strong>Cancellation Note:</strong> {apt.cancellationReason} (Refunded)
                      </p>
                    )}

                    {/* Patient Rating if completed */}
                    {apt.ratingGiven && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 pt-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>You rated this consultation: <strong>{apt.ratingGiven}/5</strong></span>
                        {apt.reviewComment && (
                          <span className="text-slate-500 italic">— "{apt.reviewComment}"</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions column */}
                <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Join Video Room button if scheduled or waiting room */}
                  {isJoinable && (
                    <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-1.5">
                      {schedule.isLiveNow || apt.status === 'in_consultation' ? (
                        <button
                          id={`join-call-btn-${apt.id}`}
                          onClick={() => {
                            if (apt.status === 'scheduled') {
                              updateAppointmentStatus(apt.id, 'in_waiting_room');
                            }
                            setActiveVideoAppointment(apt);
                          }}
                          className="w-full md:w-auto px-4 py-2.5 rounded-xl text-xs font-black text-white shadow-md flex items-center justify-center gap-1.5 transition-all bg-emerald-600 hover:bg-emerald-700 animate-pulse ring-2 ring-emerald-400"
                        >
                          <Video className="w-4 h-4" />
                          <span>Start Video Call Now (Live)</span>
                        </button>
                      ) : schedule.isApproaching || apt.status === 'in_waiting_room' ? (
                        <button
                          id={`join-call-btn-${apt.id}`}
                          onClick={() => {
                            if (apt.status === 'scheduled') {
                              updateAppointmentStatus(apt.id, 'in_waiting_room');
                            }
                            setActiveVideoAppointment(apt);
                          }}
                          className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors bg-amber-600 hover:bg-amber-700 animate-pulse"
                        >
                          <Video className="w-4 h-4" />
                          <span>Enter Waiting Room ({schedule.badgeText})</span>
                        </button>
                      ) : (
                        <button
                          id={`join-call-btn-${apt.id}`}
                          onClick={() => setActiveVideoAppointment(apt)}
                          className="w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors bg-blue-600 hover:bg-blue-700"
                        >
                          <Video className="w-4 h-4" />
                          <span>Enter Video Room (Preview)</span>
                        </button>
                      )}

                      {/* Instant Demonstration / Test Trigger */}
                      {schedule.isFuture && (
                        <button
                          type="button"
                          onClick={() => {
                            updateAppointmentStatus(apt.id, 'in_waiting_room');
                            setActiveVideoAppointment(apt);
                          }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline self-center md:self-end flex items-center gap-1"
                          title="Start video call now ahead of scheduled time for instant demonstration"
                        >
                          <PlayCircle className="w-3 h-3" />
                          <span>Start Call Now (Early)</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* View Digital Prescription if issued */}
                  {rx && (
                    <button
                      id={`view-rx-btn-${apt.id}`}
                      onClick={() => setViewingPrescription(rx)}
                      className="w-full md:w-auto px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Digital Prescription</span>
                    </button>
                  )}

                  {/* Rate Consultation if completed and not rated */}
                  {apt.status === 'completed' && !apt.ratingGiven && (
                    <button
                      id={`rate-doctor-btn-${apt.id}`}
                      onClick={() => {
                        setRatingAptId(apt.id);
                        setStarCount(5);
                      }}
                      className="w-full md:w-auto px-3.5 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>Rate Consultation</span>
                    </button>
                  )}

                  {/* Cancel Booking option if scheduled */}
                  {apt.status === 'scheduled' && (
                    <button
                      id={`cancel-apt-btn-${apt.id}`}
                      onClick={() => setCancelModalApt(apt)}
                      className="text-xs text-slate-500 hover:text-rose-600 py-1 transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      {ratingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Rate Your Consultation Experience
            </h3>
            <p className="text-xs text-slate-500">
              Your feedback helps other patients and directly improves quality of care.
            </p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStarCount(s)}
                  className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      s <= starCount
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Patient Comments
              </label>
              <textarea
                rows={3}
                placeholder="Share your experience regarding doctor's punctuality, guidance, and prescription clarity..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRatingAptId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRatingSubmit(ratingAptId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Rating</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation & Refund Confirmation Modal */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Cancel Appointment with {cancelModalApt.doctorName}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Cancellations made more than {platformConfig.cancellationWindowHours} hours before the slot are eligible for an immediate full automated refund (₹{String(cancelModalApt.amount).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}).
              </p>
            </div>

            {cancelError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {cancelError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Cancellation *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Schedule conflict, feeling better, need different date..."
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setCancelError('');
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setCancelModalApt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelSubmit}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
              >
                Confirm Cancellation & Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
