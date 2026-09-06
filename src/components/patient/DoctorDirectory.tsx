import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorProfile } from '../../types';
import { PatientIntakeAndDoctorMatcher } from './PatientIntakeAndDoctorMatcher';
import {
  Search,
  Star,
  Clock,
  Award,
  CheckCircle2,
  Calendar,
  DollarSign,
  Filter,
  Languages,
  Lock,
  Stethoscope,
  ShieldCheck,
  UserPlus,
  Sparkles,
  ListFilter,
  HeartPulse,
} from 'lucide-react';

const SPECIALIZATIONS = [
  'All',
  'Cardiology',
  'Pediatrics',
  'Dermatology',
  'General Medicine',
  'Neurology',
  'Orthopedics',
  'Psychiatry',
];

interface DoctorDirectoryProps {
  onSelectDoctorToBook?: (doctor: DoctorProfile) => void;
  onViewDoctorProfile?: (doctor: DoctorProfile) => void;
  onSelectDoctor?: (doctor: DoctorProfile) => void;
  onBookDoctor?: (doctor: DoctorProfile) => void;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({
  onSelectDoctorToBook,
  onViewDoctorProfile,
  onSelectDoctor,
  onBookDoctor,
}) => {
  const { doctors, openAuthModal } = useApp();

  const handleBook = onBookDoctor || onSelectDoctorToBook || (() => {});
  const handleView = onSelectDoctor || onViewDoctorProfile || (() => {});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [maxFee, setMaxFee] = useState<number>(150);
  const [viewMode, setViewMode] = useState<'guided_matcher' | 'all_doctors'>('guided_matcher');

  // Only show approved doctors to patients per FR-2.2
  const approvedDoctors = useMemo(() => {
    return doctors.filter((doc) => doc.status === 'approved');
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return approvedDoctors.filter((doc) => {
      // Specialization match
      if (selectedSpecialization !== 'All' && doc.specialization !== selectedSpecialization) {
        return false;
      }
      // Rating filter
      if (doc.rating < minRating) return false;
      // Price filter
      if (doc.consultationFee > maxFee) return false;
      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(query);
        const matchesSpec = doc.specialization.toLowerCase().includes(query);
        const matchesBio = doc.bio.toLowerCase().includes(query);
        const matchesQual = doc.qualifications.some((q) => q.toLowerCase().includes(query));
        return matchesName || matchesSpec || matchesBio || matchesQual;
      }
      return true;
    });
  }, [approvedDoctors, selectedSpecialization, minRating, maxFee, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Clinical Pathway Selector: Guided Matcher vs Full Directory */}
      <div className="liquid-glass rounded-2xl p-2.5 border border-white/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shadow-2xs">
            <HeartPulse className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 font-display">Clinical Consultation Gateway</div>
            <div className="text-[11px] text-slate-500">Intelligent doctor suggestion based on your symptoms or browse all</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 w-full sm:w-auto">
          <button
            type="button"
            id="tab-guided-symptom-matcher"
            onClick={() => setViewMode('guided_matcher')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'guided_matcher'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Symptom Intake &amp; Doctor Matcher</span>
          </button>
          <button
            type="button"
            id="tab-browse-all-doctors"
            onClick={() => setViewMode('all_doctors')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              viewMode === 'all_doctors'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Browse All Doctors ({approvedDoctors.length})</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Guided Patient Intake & Doctor Matcher */}
      {viewMode === 'guided_matcher' && (
        <PatientIntakeAndDoctorMatcher
          onBookDoctor={handleBook}
          onViewDoctorProfile={handleView}
          onSkipToAllDoctors={() => setViewMode('all_doctors')}
        />
      )}

      {/* Mode 2: Browse Full Directory */}
      {viewMode === 'all_doctors' && (
        <div className="space-y-6">
          {/* Bento Grid Header Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Hero Bento Tile */}
            <div className="lg:col-span-8 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase mb-3 border border-white/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>Board-Certified Virtual Care</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Consult Top Physicians in Real-Time
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-lg">
                  Direct encrypted video appointments, dynamic ECG telemetry, 5-minute checkout, and instant digital prescriptions.
                </p>
              </div>

              <div className="relative z-10 mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-xl text-xs font-semibold text-blue-100 border border-white/15">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  HIPAA Compliant
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-xl text-xs font-semibold text-blue-100 border border-white/15">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  Average Wait &lt; 3 Mins
                </span>
              </div>

              {/* Decorative liquid sheen blobs inside hero */}
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-1/4 -bottom-20 w-56 h-56 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Bento Metrics Right Column */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {/* Bento Tile 1: Satisfaction */}
              <div className="liquid-glass-card rounded-3xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shadow-2xs">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    +4.9 / 5.0
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">99.4%</div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Patient Satisfaction</p>
                </div>
              </div>

              {/* Bento Tile 2: Queue Time */}
              <div className="liquid-glass-card rounded-3xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shadow-2xs">
                    <Clock className="w-4 h-4" />
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">&lt; 3 Min</div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Live Queue Wait</p>
                </div>
              </div>

              {/* Bento Tile 3: Specialties */}
              <div className="liquid-glass-card rounded-3xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80 shadow-2xs">
                    <Award className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full">
                    Certified
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">15+</div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Clinical Specialties</p>
                </div>
              </div>

              {/* Bento Tile 4: Encrypted Records */}
              <div className="liquid-glass-card rounded-3xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    AES-256
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">100%</div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Data Privacy Shield</p>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Security Access Callout Banner - Liquid Glass Style */}
          <div className="liquid-glass rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/70 shadow-2xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Healthcare Provider &amp; Governance Access</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50/90 border border-emerald-200/80 font-bold px-2 py-0.5 rounded-full">
                    Patients do not require login
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Doctors and platform administrators can sign in with credentials or register via the registration form.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="provider-card-doc-login"
                onClick={() => openAuthModal('doctor', 'login')}
                className="px-3 py-2 bg-white/80 hover:bg-white text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Sign In</span>
              </button>
              <button
                type="button"
                id="provider-card-doc-register"
                onClick={() => openAuthModal('doctor', 'register')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Doctor Sign Up</span>
              </button>
              <button
                type="button"
                id="provider-card-admin-login"
                onClick={() => openAuthModal('admin', 'login')}
                className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>
          </div>

      {/* Search & Filter Bar - Liquid Glass Container */}
      <div className="liquid-glass rounded-3xl p-5 shadow-xs space-y-4 border border-white/90">
        {/* Top search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="doctor-search-input"
            type="text"
            placeholder="Search by doctor name, specialty, condition, or hospital affiliation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/80 border border-slate-200/90 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Specialization pills with liquid glass styling */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              id={`filter-spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedSpecialization(spec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSpecialization === spec
                  ? 'bg-blue-600 text-white shadow-xs scale-102'
                  : 'bg-white/70 hover:bg-white text-slate-600 border border-slate-200/70'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Secondary filters: Rating and Max Fee */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Min Rating:</span>
              <select
                id="filter-rating-select"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="bg-white/80 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none text-slate-800 font-semibold text-xs"
              >
                <option value={0}>Any rating</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={4.8}>4.8+ Stars</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Max Fee:</span>
              <span className="font-bold text-blue-700">${maxFee}</span>
              <input
                id="filter-fee-range"
                type="range"
                min="40"
                max="150"
                step="5"
                value={maxFee}
                onChange={(e) => setMaxFee(Number(e.target.value))}
                className="w-24 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filteredDoctors.length}</strong> verified doctor{filteredDoctors.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Doctors Bento Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-14 liquid-glass rounded-3xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No doctors match your criteria</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms, fee slider, or clearing the specialization filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedSpecialization('All');
              setMinRating(0);
              setMaxFee(150);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              id={`doctor-card-${doc.id}`}
              className="liquid-glass-card rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Doctor Head Info */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white shadow-2xs" title="Verified Practitioner">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50/90 text-blue-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider border border-blue-100">
                        {doc.specialization}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200/60">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{doc.rating}</span>
                        <span className="text-slate-400 font-normal">({doc.reviewCount})</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1.5 truncate font-display">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{doc.hospitalAffiliation}</p>
                  </div>
                </div>

                {/* Badges / Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50/70 p-2 rounded-xl border border-slate-200/50">
                    <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>{doc.experienceYears}</strong> yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50/70 p-2 rounded-xl border border-slate-200/50">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span><strong>{doc.slotDurationMinutes}</strong> min video</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 col-span-2 px-1 pt-1">
                    <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 text-[11px] truncate">{doc.languages.join(', ')}</span>
                  </div>
                </div>

                {/* Brief bio */}
                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doc.bio}
                </p>
              </div>

              {/* Card Footer with fee and buttons */}
              <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-200/60 flex items-center justify-between gap-2 backdrop-blur-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Consultation</div>
                  <div className="text-lg font-black text-slate-900">${doc.consultationFee}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`view-profile-${doc.id}`}
                    onClick={() => handleView(doc)}
                    className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
                  >
                    Details
                  </button>
                  <button
                    id={`book-doctor-${doc.id}`}
                    onClick={() => handleBook(doc)}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Slot</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}
</div>
);
};
