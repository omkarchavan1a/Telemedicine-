import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorProfile } from '../../types';
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
            Board-Certified Medical Specialists
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Consult Top Physicians Online
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed">
            Direct video consultations, digital prescriptions, and continuity of care. Filter by specialty, read patient reviews, and book an instant slot.
          </p>
        </div>

        <div className="absolute right-[-40px] top-[-40px] w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Provider Security Access Callout Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Healthcare Provider & Governance Access</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-1.5 py-0.5 rounded-sm">
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
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor Sign In</span>
          </button>
          <button
            type="button"
            id="provider-card-doc-register"
            onClick={() => openAuthModal('doctor', 'register')}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Doctor Sign Up</span>
          </button>
          <button
            type="button"
            id="provider-card-admin-login"
            onClick={() => openAuthModal('admin', 'login')}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="doctor-search-input"
            type="text"
            placeholder="Search by doctor name, specialty, condition, or hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Specialization pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {SPECIALIZATIONS.map((spec) => (
            <button
              key={spec}
              id={`filter-spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedSpecialization(spec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSpecialization === spec
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Secondary filters: Rating and Max Fee */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">Min Rating:</span>
              <select
                id="filter-rating-select"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none text-slate-800 font-medium"
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
            Showing <strong className="text-slate-900">{filteredDoctors.length}</strong> available doctor{filteredDoctors.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              id={`doctor-card-${doc.id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-5">
                {/* Doctor Head Info */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white" title="Verified Practitioner">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        {doc.specialization}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{doc.rating}</span>
                        <span className="text-slate-400 font-normal">({doc.reviewCount})</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{doc.hospitalAffiliation}</p>
                  </div>
                </div>

                {/* Badges / Metrics */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><strong>{doc.experienceYears}</strong> yrs exp</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span><strong>{doc.slotDurationMinutes}</strong> min video</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                    <Languages className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">{doc.languages.join(', ')}</span>
                  </div>
                </div>

                {/* Brief bio */}
                <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {doc.bio}
                </p>
              </div>

              {/* Card Footer with fee and buttons */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Consultation</div>
                  <div className="text-lg font-extrabold text-slate-900">${doc.consultationFee}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`view-profile-${doc.id}`}
                    onClick={() => handleView(doc)}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    id={`book-doctor-${doc.id}`}
                    onClick={() => handleBook(doc)}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
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
  );
};
