import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  DollarSign,
  Save,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  CalendarCheck,
} from 'lucide-react';

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 0, label: 'Sunday' },
];

export const AvailabilityManager: React.FC = () => {
  const { doctors, updateDoctorAvailability } = useApp();

  // Active doctor (Dr. Rajiv Mehta)
  const currentDoctor = doctors.find((d) => d.id === 'doc-mehta') || doctors[0];

  const [availableDays, setAvailableDays] = useState<number[]>(currentDoctor.availableDays);
  const [startTime, setStartTime] = useState(currentDoctor.availableHours.start);
  const [endTime, setEndTime] = useState(currentDoctor.availableHours.end);
  const [slotDuration, setSlotDuration] = useState(currentDoctor.slotDurationMinutes);
  const [consultationFee, setConsultationFee] = useState(currentDoctor.consultationFee);
  const [blockedDates, setBlockedDates] = useState<string[]>(currentDoctor.blockedDates);
  const [newBlockDate, setNewBlockDate] = useState('');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleDay = (dayId: number) => {
    if (availableDays.includes(dayId)) {
      setAvailableDays(availableDays.filter((d) => d !== dayId));
    } else {
      setAvailableDays([...availableDays, dayId]);
    }
  };

  const addBlockedDate = () => {
    if (newBlockDate && !blockedDates.includes(newBlockDate)) {
      setBlockedDates([...blockedDates, newBlockDate]);
      setNewBlockDate('');
    }
  };

  const removeBlockedDate = (dateToRemove: string) => {
    setBlockedDates(blockedDates.filter((d) => d !== dateToRemove));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDoctorAvailability(currentDoctor.id, {
      availableDays,
      availableHours: { start: startTime, end: endTime },
      slotDurationMinutes: slotDuration,
      consultationFee,
      blockedDates,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Telemedicine Schedule & Slot Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure your weekly recurring clinic hours, slot increments, pricing, and blocked vacation dates.
          </p>
        </div>

        <button
          onClick={handleSave}
          type="button"
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
            savedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Schedule Synchronized</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Schedule</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Recurring Days */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Recurring Available Days
          </h3>
          <p className="text-xs text-slate-500">
            Select the days of the week patients can book video slots on your calendar.
          </p>

          <div className="space-y-2">
            {DAYS.map((day) => {
              const isSelected = availableDays.includes(day.id);
              return (
                <div
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{day.label}</span>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && '✓'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operating Hours & Pricing */}
        <div className="space-y-6">
          {/* Daily Timing & Duration */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Daily Hours & Slot Duration
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Consultation Slot Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSlotDuration(mins)}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      slotDuration === mins
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Consultation Fee Setting */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Standard Consultation Fee
            </h3>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input
                  type="number"
                  min="20"
                  max="300"
                  step="5"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 font-mono"
                />
              </div>
              <span className="text-xs text-slate-500">USD per session</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Patients pay this fee upfront when confirming appointment slots.
            </p>
          </div>
        </div>
      </div>

      {/* Blocked Dates / Vacation Blackout */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-amber-500" />
          Blocked Dates & Leave Outages
        </h3>
        <p className="text-xs text-slate-500">
          Blackout dates prevent patients from booking any slots on specific days (conferences, hospital rounds, personal leave).
        </p>

        <div className="flex flex-wrap gap-2">
          {blockedDates.length === 0 ? (
            <span className="text-xs text-slate-400 italic">No blackout dates currently scheduled.</span>
          ) : (
            blockedDates.map((date) => (
              <span
                key={date}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold"
              >
                <span>{date}</span>
                <button
                  type="button"
                  onClick={() => removeBlockedDate(date)}
                  className="hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 max-w-sm">
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={newBlockDate}
            onChange={(e) => setNewBlockDate(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
          <button
            type="button"
            onClick={addBlockedDate}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Block Date</span>
          </button>
        </div>
      </div>
    </div>
  );
};
