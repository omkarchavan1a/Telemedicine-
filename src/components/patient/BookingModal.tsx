import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorProfile, Appointment } from '../../types';
import confetti from 'canvas-confetti';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Shield,
  Bell,
  Video,
  Timer,
  TimerOff,
  XCircle,
  RotateCcw,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';

interface BookingModalProps {
  doctor: DoctorProfile | null;
  onClose: () => void;
  onBookingSuccess?: (appointment: Appointment) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  doctor,
  onClose,
  onBookingSuccess,
}) => {
  const { appointments, bookAppointment, setActiveVideoAppointment } = useApp();

  // Booking step: 1 = slot & intake, 2 = payment & checkout, 3 = confirmation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Payment session state: 'active' (5-minute timer running), 'success' (paid), 'cancelled' (user cancelled), 'expired' (5 min time over)
  const [paymentSessionStatus, setPaymentSessionStatus] = useState<'active' | 'success' | 'cancelled' | 'expired'>('active');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes = 300 seconds
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Selected date (defaults to next available date)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });

  const [selectedSlot, setSelectedSlot] = useState<string>('10:00 AM');
  const [reason, setReason] = useState('Routine consultation & general checkup');
  const [symptoms, setSymptoms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Credit/Debit Card' | 'UPI' | 'Net Banking'>('Credit/Debit Card');

  // Simulated Payment Form fields
  const [cardHolder, setCardHolder] = useState('Anjali Sharma');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('987');
  const [upiId, setUpiId] = useState('anjali.sharma@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedApt, setConfirmedApt] = useState<Appointment | null>(null);

  const [formError, setFormError] = useState<string>('');

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // 5-minute countdown timer logic when in Step 2 with active payment session
  useEffect(() => {
    if (step !== 2 || paymentSessionStatus !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentSessionStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, paymentSessionStatus]);

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check if doctor works on selected date's day of week & date isn't blocked
  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return -1;
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.getDay();
  }, [selectedDate]);

  const isDayAvailable = useMemo(() => {
    if (!doctor) return false;
    return doctor.availableDays.includes(selectedDayOfWeek);
  }, [doctor, selectedDayOfWeek]);

  const isDateBlocked = useMemo(() => {
    if (!doctor) return false;
    return doctor.blockedDates.includes(selectedDate);
  }, [doctor, selectedDate]);

  // Calculate real available time slots for doctor based on their schedule hours & duration
  const availableSlots = useMemo(() => {
    if (!doctor || !isDayAvailable || isDateBlocked) return [];

    const [startH, startM] = (doctor.availableHours?.start || '09:00').split(':').map(Number);
    const [endH, endM] = (doctor.availableHours?.end || '17:00').split(':').map(Number);
    const duration = doctor.slotDurationMinutes || 30;

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const generated: string[] = [];
    for (let time = startMinutes; time + duration <= endMinutes; time += duration) {
      const h = Math.floor(time / 60);
      const m = time % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m.toString().padStart(2, '0');
      generated.push(`${displayH.toString().padStart(2, '0')}:${displayM} ${period}`);
    }

    // Filter out already booked slots for this doctor on this date (atomic prevention)
    const booked = appointments
      .filter((a) => a.doctorId === doctor.id && a.date === selectedDate && a.status !== 'cancelled')
      .map((a) => a.timeSlot);

    return generated.filter((slot) => !booked.includes(slot));
  }, [doctor, selectedDate, isDayAvailable, isDateBlocked, appointments]);

  if (!doctor) return null;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!isDayAvailable) {
      setFormError(`Doctor does not hold clinic on ${DAY_NAMES[selectedDayOfWeek]}. Please select one of: ${doctor.availableDays.map(d => DAY_NAMES[d]).join(', ')}.`);
      return;
    }
    if (isDateBlocked) {
      setFormError(`Doctor is unavailable on ${selectedDate}. Please select another date.`);
      return;
    }
    if (!selectedSlot) {
      setFormError('Please select an available appointment time slot.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Please specify the primary reason for your consultation.');
      return;
    }

    // Initialize 5-minute payment session
    setTimeLeft(300);
    setPaymentSessionStatus('active');
    setStep(2);
  };

  const handleCancelPayment = () => {
    setPaymentSessionStatus('cancelled');
  };

  const handleRetryPayment = () => {
    setTimeLeft(300);
    setPaymentSessionStatus('active');
    setStep(2);
  };

  const handleConfirmAndPay = () => {
    if (timeLeft <= 0 || paymentSessionStatus === 'expired') {
      setPaymentSessionStatus('expired');
      return;
    }

    setIsProcessing(true);

    // Simulate reliable payment gateway interaction
    setTimeout(() => {
      const apt = bookAppointment({
        doctorId: doctor.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason,
        symptoms,
        paymentMethod,
        amount: doctor.consultationFee,
      });

      setIsProcessing(false);
      setConfirmedApt(apt);
      setPaymentSessionStatus('success');
      setStep(3);

      // Trigger celebratory confetti on confirmed booking
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }
    }, 1200);
  };

  const copyUpiVpa = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="booking-modal-container"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                Booking Consultation
              </div>
              <h3 className="text-base font-bold text-white leading-tight">{doctor.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>1</span>
            <span>Slot & Intake</span>
          </div>
          <span className="text-slate-300">———</span>
          <div
            className={`flex items-center gap-2 ${
              step === 2
                ? paymentSessionStatus === 'cancelled'
                  ? 'text-rose-600 font-bold'
                  : paymentSessionStatus === 'expired'
                  ? 'text-amber-700 font-bold'
                  : 'text-blue-600 font-bold'
                : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === 2
                  ? paymentSessionStatus === 'cancelled' || paymentSessionStatus === 'expired'
                    ? 'bg-rose-600 text-white'
                    : 'bg-blue-600 text-white'
                  : 'bg-slate-200'
              }`}
            >
              2
            </span>
            <span>
              {step === 2 && paymentSessionStatus === 'active'
                ? `Payment (${formatTimer(timeLeft)})`
                : step === 2 && paymentSessionStatus === 'cancelled'
                ? 'Payment Cancelled'
                : step === 2 && paymentSessionStatus === 'expired'
                ? 'Time Expired'
                : 'Payment (5 Min)'}
            </span>
          </div>
          <span className="text-slate-300">———</span>
          <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-600 font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200'}`}>3</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Step 1: Slot & Symptoms Selection */}
        {step === 1 && (
          <form onSubmit={handleProceedToPayment} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                Select Consultation Date
              </label>
              <input
                id="booking-date-input"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                  setFormError('');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              {!isDayAvailable && (
                <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Dr. {doctor.name.split(',')[0]} holds clinic on:{' '}
                    <strong>{doctor.availableDays.map((d) => DAY_NAMES[d]).join(', ')}</strong>.
                  </span>
                </p>
              )}

              {isDateBlocked && (
                <p className="mt-1.5 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Doctor is unavailable on this date ({selectedDate}) due to hospital commitments.</span>
                </p>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Available Time Slots ({doctor.slotDurationMinutes || 30}-min increments)
              </label>
              {availableSlots.length === 0 ? (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {!isDayAvailable
                      ? `No clinic hours on ${DAY_NAMES[selectedDayOfWeek]}. Please select an active day.`
                      : isDateBlocked
                      ? 'Doctor is on leave on this date. Please select another date.'
                      : 'All slots are fully booked for this date. Please select another date.'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      id={`slot-btn-${slot.replace(/[:\s]/g, '-')}`}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setFormError('');
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        selectedSlot === slot
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Consultation Reason *
              </label>
              <input
                id="booking-reason-input"
                type="text"
                required
                placeholder="e.g. Hypertension review, skin rash, lab follow-up"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Describe Symptoms / History (Optional)
              </label>
              <textarea
                id="booking-symptoms-input"
                rows={2}
                placeholder="Duration of symptoms, any recent changes or medications..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Price Banner */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Standard Consultation Fee:</span>
              <span className="text-base font-extrabold text-slate-900">${doctor.consultationFee}.00</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="booking-step1-next-btn"
                disabled={!selectedSlot}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                Proceed to Payment (5 Min Window)
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Payment & Checkout with 5-Minute Timer */}
        {step === 2 && (
          <>
            {/* Condition 1: User explicitly cancelled the payment */}
            {paymentSessionStatus === 'cancelled' && (
              <div className="p-6 text-center space-y-5">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Payment Cancelled
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    The payment authorization process was cancelled. No funds were debited from your account. The temporary reservation on this appointment slot has been released.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Appointment Slot:</span>
                    <span className="font-bold text-slate-900">{selectedDate} at {selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultant Doctor:</span>
                    <span className="font-bold text-blue-700">{doctor.name} ({doctor.specialization})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-bold text-slate-800">${doctor.consultationFee}.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Transaction Status:</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[11px]">
                      CANCELLED BY USER
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    id="retry-payment-btn"
                    onClick={handleRetryPayment}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Try Payment Again (5 Min Window)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Change Slot or Date
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Exit
                  </button>
                </div>
              </div>
            )}

            {/* Condition 2: 5 Minutes Expired (Time Over) */}
            {paymentSessionStatus === 'expired' && (
              <div className="p-6 text-center space-y-5">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <TimerOff className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Time Over — Payment Cancelled
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    The allocated <strong>5-minute payment window has expired</strong>. To maintain atomic scheduling and prevent slot hoarding, your payment session was automatically cancelled and the slot released.
                  </p>
                </div>

                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-amber-900/70">Timer Status:</span>
                    <span className="font-mono font-bold text-amber-900">00:00 (5 Minutes Exceeded)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-900/70">Requested Slot:</span>
                    <span className="font-bold text-slate-900">{selectedDate} at {selectedSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-900/70">Doctor:</span>
                    <span className="font-bold text-blue-800">{doctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-900/70">Amount Due:</span>
                    <span className="font-bold text-slate-800">${doctor.consultationFee}.00</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200">
                    <span className="text-amber-900/70">Resolution:</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[11px]">
                      AUTO-CANCELLED DUE TO TIMEOUT
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    id="restart-payment-session-btn"
                    onClick={handleRetryPayment}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restart 5-Min Payment Session</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Select Another Slot
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Condition 3: Active Payment Session with 5-Minute Timer */}
            {paymentSessionStatus === 'active' && (
              <div className="p-6 space-y-5">
                {/* 5-Minute Live Countdown Timer Header */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    timeLeft <= 60
                      ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-300'
                      : 'bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-blue-50/80 border-blue-200 text-blue-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          timeLeft <= 60
                            ? 'bg-rose-600 text-white animate-bounce'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                          <span>5-Minute Payment Window</span>
                          {timeLeft <= 60 && (
                            <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[10px] font-bold animate-pulse">
                              HURRY!
                            </span>
                          )}
                        </div>
                        <div className="text-xs">
                          {timeLeft <= 60
                            ? 'Less than 1 minute remaining before automatic cancellation!'
                            : 'Complete payment to reserve your consultation slot.'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div
                        id="payment-countdown-display"
                        className={`font-mono text-xl font-black tracking-tight px-3 py-1 rounded-xl border ${
                          timeLeft <= 60
                            ? 'bg-white text-rose-600 border-rose-300 shadow-xs animate-pulse'
                            : 'bg-white text-blue-700 border-blue-200 shadow-xs'
                        }`}
                      >
                        {formatTimer(timeLeft)}
                      </div>
                      {/* Fast-forward helper for testing timeout */}
                      <button
                        type="button"
                        onClick={() => setTimeLeft(5)}
                        className="text-[10px] text-slate-400 hover:text-rose-600 underline mt-1 transition-colors"
                        title="Jump to 5s remaining to test the 5-minute timeout"
                      >
                        ⚡ Test 5s Timeout
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar (300s total) */}
                  <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        timeLeft <= 60 ? 'bg-rose-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 300) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Consultation Summary */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Selected Slot:</span>
                    <span>{selectedDate} at {selectedSlot}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Consultant:</span>
                    <span>{doctor.name} ({doctor.specialization})</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Booking Fee:</span>
                    <span className="text-emerald-600 font-bold">$0.00 (Waived)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                    <span>Total Amount Due:</span>
                    <span className="text-blue-700">${doctor.consultationFee}.00</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Select Payment Gateway (5 Min Session Active)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="pay-method-card"
                      onClick={() => setPaymentMethod('Credit/Debit Card')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'Credit/Debit Card'
                          ? 'bg-blue-50 text-blue-800 border-blue-600 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Credit / Debit Card</span>
                    </button>
                    <button
                      type="button"
                      id="pay-method-upi"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-purple-50 text-purple-800 border-purple-600 shadow-xs ring-1 ring-purple-500'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-200'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-purple-600" />
                      <span>Instant UPI / QR Code</span>
                    </button>
                  </div>
                </div>

                {/* Credit / Debit Card Form */}
                {paymentMethod === 'Credit/Debit Card' ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {/* Simulated Credit Card Preview */}
                    <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-950 to-indigo-900 text-white shadow-md space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-4 bg-amber-400 rounded-xs opacity-90" />
                          <span className="text-[10px] tracking-widest text-slate-300 font-mono">EMV CHIP</span>
                        </div>
                        <span className="text-xs font-bold tracking-wider text-blue-300">VISA / MC</span>
                      </div>
                      <div className="font-mono text-base tracking-widest text-slate-100 font-semibold">
                        {cardNumber || '4242 •••• •••• 4242'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <div>
                          <div className="text-[8px] uppercase tracking-wider text-slate-400">Cardholder</div>
                          <div className="font-bold text-white uppercase">{cardHolder || 'Anjali Sharma'}</div>
                        </div>
                        <div>
                          <div className="text-[8px] uppercase tracking-wider text-slate-400">Expires</div>
                          <div className="font-bold text-white font-mono">{cardExpiry || '12/28'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          placeholder="Name on card"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Expiry Date (MM/YY)
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          CVV / CVC
                        </label>
                        <input
                          type="password"
                          value={cardCvc}
                          maxLength={4}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* UPI Payment Form */
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    {/* Simulated Dynamic UPI QR Code */}
                    <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-28 h-28 bg-slate-900 text-white p-2 rounded-xl flex flex-col items-center justify-center relative shrink-0 shadow-inner">
                        {/* Dynamic QR pattern simulation */}
                        <div className="grid grid-cols-5 gap-1 w-full h-full p-1 bg-white rounded-lg">
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-200 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-purple-600 rounded-xs" />
                          <div className="bg-purple-600 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-200 rounded-xs" />
                          <div className="bg-slate-200 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-purple-600 rounded-xs" />
                          <div className="bg-slate-200 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-200 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-200 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                          <div className="bg-slate-900 rounded-xs" />
                        </div>
                        <span className="absolute bottom-1 text-[8px] bg-slate-900 text-white font-mono px-1 rounded">
                          UPI QR
                        </span>
                      </div>

                      <div className="text-left space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                          <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                          <span>Scan with Any UPI Application</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Open Google Pay, PhonePe, Paytm, BHIM, or your bank app to scan and authorize <strong>${doctor.consultationFee}.00</strong>.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-[10px] font-semibold">
                            Google Pay
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-[10px] font-semibold">
                            PhonePe
                          </span>
                          <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded font-mono text-[10px] font-semibold">
                            Paytm
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Or Pay via UPI ID / Virtual Payment Address (VPA)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@bank"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={copyUpiVpa}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        A payment collect request will be simulated immediately upon authorization.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>256-Bit SSL Encrypted Healthcare Checkout. Zero card details stored in plaintext.</span>
                </div>

                {/* Bottom Action Controls with explicit Cancel and Pay buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={isProcessing}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Back
                    </button>
                    {/* Explicit Cancel Payment Button */}
                    <button
                      type="button"
                      id="cancel-payment-btn"
                      onClick={handleCancelPayment}
                      disabled={isProcessing}
                      className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Payment</span>
                    </button>
                  </div>

                  {/* Confirm & Pay Button */}
                  <button
                    type="button"
                    id="confirm-payment-btn"
                    onClick={handleConfirmAndPay}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span>Authorizing Payment...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {paymentMethod === 'UPI'
                            ? `Approve UPI Payment & Pay $${doctor.consultationFee}.00`
                            : `Pay $${doctor.consultationFee}.00 & Confirm`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 3: Successfully Payment / Confirmation Screen */}
        {step === 3 && confirmedApt && (
          <div className="p-6 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold mb-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Successfully Payment Processed</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Payment Successful & Consultation Confirmed!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Your payment of <strong>${confirmedApt.amount}.00</strong> via <strong>{confirmedApt.paymentMethod}</strong> has been successfully authorized and your video appointment slot is locked.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800">{confirmedApt.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[11px]">
                  PAID IN FULL
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{confirmedApt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time Slot:</span>
                <span className="font-bold text-slate-900">{confirmedApt.date} at {confirmedApt.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consultant:</span>
                <span className="font-bold text-blue-700">{confirmedApt.doctorName} ({confirmedApt.doctorSpecialization})</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">Total Paid:</span>
                <span className="font-extrabold text-emerald-700 text-sm">${confirmedApt.amount}.00</span>
              </div>
            </div>

            {/* Automated Reminders Preview (FR-3.4 / FR-9.2) */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800 flex items-start gap-2 text-left">
              <Bell className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Automated Notifications Scheduled:</strong>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Email & SMS reminders scheduled for 24h prior and 1h prior with direct video room link.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                id="booking-done-btn"
                onClick={() => {
                  onBookingSuccess?.(confirmedApt);
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-300 transition-colors"
              >
                View Consultations List
              </button>
              <button
                type="button"
                id="booking-enter-room-btn"
                onClick={() => {
                  onBookingSuccess?.(confirmedApt);
                  onClose();
                  setActiveVideoAppointment(confirmedApt);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Enter Video Room Waiting Area</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
