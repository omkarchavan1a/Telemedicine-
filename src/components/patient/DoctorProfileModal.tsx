import React from 'react';
import { DoctorProfile } from '../../types';
import {
  X,
  Star,
  CheckCircle2,
  Award,
  Clock,
  Building2,
  Calendar,
  Languages,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

interface DoctorProfileModalProps {
  doctor: DoctorProfile | null;
  onClose: () => void;
  onBook: (doctor: DoctorProfile) => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({
  doctor,
  onClose,
  onBook,
}) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="doctor-profile-modal-container"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Specialist
              </div>
              <h2 className="text-2xl font-bold">{doctor.name}</h2>
              <p className="text-blue-100 text-sm">{doctor.specialization}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-blue-100">
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  {doctor.rating} ({doctor.reviewCount} verified reviews)
                </span>
                <span>•</span>
                <span>Reg: {doctor.regNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl text-center border border-slate-100">
              <Award className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs text-slate-500 font-medium">Experience</div>
              <div className="text-base font-extrabold text-slate-900">{doctor.experienceYears} Years</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl text-center border border-slate-100">
              <Clock className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
              <div className="text-xs text-slate-500 font-medium">Slot Length</div>
              <div className="text-base font-extrabold text-slate-900">{doctor.slotDurationMinutes} Mins</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl text-center border border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-xs text-slate-500 font-medium">Standard Fee</div>
              <div className="text-base font-extrabold text-slate-900">${doctor.consultationFee}</div>
            </div>
          </div>

          {/* Clinical Bio */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
              Clinical Background & Practice
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {doctor.bio}
            </p>
          </div>

          {/* Qualifications & Hospital */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Degrees & Certifications
              </h4>
              <ul className="space-y-1 text-xs text-slate-700">
                {doctor.qualifications.map((q, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Hospital Affiliation
              </h4>
              <p className="text-xs text-slate-700 font-medium">{doctor.hospitalAffiliation}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                <span>Languages: {doctor.languages.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Weekly Available Schedule */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Teleconsultation Schedule
            </h4>
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
              <div className="font-semibold">
                Available Days: {doctor.availableDays.map((d) => DAY_NAMES[d]).join(', ')}
              </div>
              <div className="text-emerald-700">
                Regular Hours: {doctor.availableHours.start} — {doctor.availableHours.end} (EST)
              </div>
              {doctor.blockedDates.length > 0 && (
                <div className="text-[11px] text-amber-700 mt-1">
                  * Notice: Doctor unavailable on {doctor.blockedDates.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
          <button
            id="modal-proceed-to-book-btn"
            onClick={() => {
              onClose();
              onBook(doctor);
            }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Consultation (${doctor.consultationFee})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
