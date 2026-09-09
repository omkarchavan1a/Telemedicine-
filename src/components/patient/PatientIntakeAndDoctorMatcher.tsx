import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorProfile, PatientIntakeData, DoctorRecommendationMatch } from '../../types';
import {
  COMMON_SYMPTOM_OPTIONS,
  checkRedFlagEmergency,
  matchDoctorsToPatient,
} from '../../utils/doctorMatcher';
import {
  Sparkles,
  User,
  HeartPulse,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Award,
  Star,
  RotateCcw,
  Stethoscope,
  ArrowRight,
  Filter,
  DollarSign,
  Languages,
  Check,
} from 'lucide-react';

interface PatientIntakeAndDoctorMatcherProps {
  onBookDoctor: (doctor: DoctorProfile) => void;
  onViewDoctorProfile: (doctor: DoctorProfile) => void;
  onSkipToAllDoctors?: () => void;
}

export const PatientIntakeAndDoctorMatcher: React.FC<PatientIntakeAndDoctorMatcherProps> = ({
  onBookDoctor,
  onViewDoctorProfile,
  onSkipToAllDoctors,
}) => {
  const { doctors, patientProfile, setBookingDoctor, setPrefilledBookingData } = useApp();

  // Active step: 'intake' (Step 1: Get Patient Details) or 'recommendations' (Step 2: Suggest Doctors)
  const [currentStep, setCurrentStep] = useState<'intake' | 'recommendations'>('intake');

  // Intake form state
  const [patientName, setPatientName] = useState(patientProfile?.name || '');
  const [age, setAge] = useState<number>(0);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [phone, setPhone] = useState(patientProfile?.phone || '');
  const [email, setEmail] = useState(patientProfile?.email || '');

  const [primaryConcern, setPrimaryConcern] = useState('');
  const [symptomsDescription, setSymptomsDescription] = useState(
    ''
  );
  const [selectedSymptomTags, setSelectedSymptomTags] = useState<string[]>([]);
  const [duration, setDuration] = useState<'< 24 Hours' | '2 - 7 Days' | '1 - 4 Weeks' | 'Chronic (> 1 Month)'>('2 - 7 Days');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Acute / Severe'>('Moderate');

  const [existingConditions, setExistingConditions] = useState<string[]>(['None']);
  const [allergies, setAllergies] = useState<string[]>(['None']);
  const [priorityPreference, setPriorityPreference] = useState<'best_clinical_match' | 'earliest_slot' | 'budget_friendly'>(
    'best_clinical_match'
  );

  // Recommendations calculated after analysis
  const [matches, setMatches] = useState<DoctorRecommendationMatch[]>([]);
  const [emergencyAlert, setEmergencyAlert] = useState<string | null>(null);

  // Filter within recommendations
  const [filterView, setFilterView] = useState<'all_matches' | 'top_matches'>('all_matches');

  const toggleSymptomTag = (tagId: string) => {
    setSelectedSymptomTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        const targetOption = COMMON_SYMPTOM_OPTIONS.find((o) => o.id === tagId);
        // If empty or default, update primary concern headline
        if (targetOption && (!primaryConcern || primaryConcern.includes('Routine'))) {
          setPrimaryConcern(targetOption.label);
        }
        return [...prev, tagId];
      }
    });
  };

  const handleAnalyzeAndSuggest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const intake: PatientIntakeData = {
      patientName: patientName.trim() || 'Patient',
      age: Number(age) || 30,
      gender,
      phone: phone.trim() || '+1 (555) 000-0000',
      email: email.trim() || 'patient@example.com',
      primaryConcern: primaryConcern.trim() || 'Clinical Telemedicine Consultation',
      symptomsDescription: symptomsDescription.trim() || 'General medical review',
      selectedSymptomTags,
      duration,
      severity,
      existingConditions,
      allergies,
      priorityPreference,
    };

    // Check for red flags
    const redFlagCheck = checkRedFlagEmergency(intake);
    if (redFlagCheck.isEmergency && redFlagCheck.warning) {
      setEmergencyAlert(redFlagCheck.warning);
    } else {
      setEmergencyAlert(null);
    }

    // Run clinical doctor matching
    const results = matchDoctorsToPatient(intake, doctors);
    setMatches(results);

    // Transition to suggestions step
    setCurrentStep('recommendations');
  };

  // 1-Click booking for a recommended doctor with pre-filled patient details
  const handleBookMatchedDoctor = (doc: DoctorProfile) => {
    const formattedSymptoms = [
      `Primary Complaint: ${primaryConcern}`,
      `Description: ${symptomsDescription}`,
      `Duration: ${duration}`,
      `Severity: ${severity}`,
      selectedSymptomTags.length > 0 ? `Tags: ${selectedSymptomTags.join(', ')}` : '',
      `Patient Age/Gender: ${age} yrs, ${gender}`,
    ]
      .filter(Boolean)
      .join('\n');

    setPrefilledBookingData({
      reason: primaryConcern,
      symptoms: formattedSymptoms,
      patientName,
      patientEmail: email,
      patientPhone: phone,
    });

    if (onBookDoctor) {
      onBookDoctor(doc);
    } else {
      setBookingDoctor(doc);
    }
  };

  // Memoized top recommendation & other matches
  const topMatch = useMemo(() => matches.find((m) => m.isTopRecommendation) || matches[0], [matches]);
  const otherMatches = useMemo(() => {
    const rest = matches.filter((m) => m !== topMatch);
    if (filterView === 'top_matches') {
      return rest.filter((m) => m.matchScore >= 80);
    }
    return rest;
  }, [matches, topMatch, filterView]);

  return (
    <div className="space-y-6">
      {/* Step 1: Patient Clinical Details Intake View */}
      {currentStep === 'intake' && (
        <div className="space-y-6">
          {/* Header Banner with Bento Accents */}
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold tracking-wide uppercase mb-3 border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Step 1: Patient Details & Symptom Assessment</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-display">
                Tell Us Your Details & Symptoms
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-xl">
                We analyze your age, clinical complaints, duration, and severity to match you with the most qualified medical specialist in real-time.
              </p>
            </div>

            {/* Background Sheen Blobs */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/4 -bottom-20 w-56 h-56 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Main Intake Form in Bento Grid */}
          <form onSubmit={handleAnalyzeAndSuggest} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Bento Box 1: Patient Demographics */}
              <div className="lg:col-span-5 liquid-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shadow-2xs">
                      <User className="w-4 h-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 font-display">1. Patient Information</h2>
                      <p className="text-[11px] text-slate-500">Demographics & contact details</p>
                    </div>
                  </div>
                  {age > 0 && age < 16 && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full animate-pulse">
                      Child &lt; 16 yrs
                    </span>
                  )}
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      id="intake-patient-name"
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Full name"
                      className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Age (Years) *
                      </label>
                      <input
                        id="intake-patient-age"
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Biological Gender *</label>
                      <select
                        id="intake-patient-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        id="intake-patient-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                      <input
                        id="intake-patient-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner font-medium"
                      />
                    </div>
                  </div>

                  {/* Priority preference tile */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Consultation Preference</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPriorityPreference('best_clinical_match')}
                        className={`p-2 rounded-xl text-center border transition-all text-xs font-bold ${
                          priorityPreference === 'best_clinical_match'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                        }`}
                      >
                        Top Specialist
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriorityPreference('earliest_slot')}
                        className={`p-2 rounded-xl text-center border transition-all text-xs font-bold ${
                          priorityPreference === 'earliest_slot'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                        }`}
                      >
                        Earliest Slot
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriorityPreference('budget_friendly')}
                        className={`p-2 rounded-xl text-center border transition-all text-xs font-bold ${
                          priorityPreference === 'budget_friendly'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                        }`}
                      >
                        Budget-Friendly
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Box 2: Symptoms & Medical Complaints */}
              <div className="lg:col-span-7 liquid-glass-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200/70 pb-3">
                  <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 shadow-2xs">
                    <HeartPulse className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 font-display">2. Primary Concern & Health Symptoms</h2>
                    <p className="text-[11px] text-slate-500">Select common symptoms or describe what you are experiencing</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Primary Complaint Headline *
                    </label>
                    <input
                      id="intake-primary-concern"
                      type="text"
                      required
                      value={primaryConcern}
                      onChange={(e) => setPrimaryConcern(e.target.value)}
                      placeholder="e.g. Throbbing Migraine with Light Sensitivity"
                      className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner font-medium"
                    />
                  </div>

                  {/* Interactive Symptom Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">Quick Symptom Tags (Click to select)</label>
                      <span className="text-[11px] text-slate-500">
                        {selectedSymptomTags.length} selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                      {COMMON_SYMPTOM_OPTIONS.map((opt) => {
                        const isSelected = selectedSymptomTags.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleSymptomTag(opt.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs scale-102 font-bold'
                                : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Free-text symptoms description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Detailed Symptom Description
                    </label>
                    <textarea
                      id="intake-symptoms-description"
                      rows={2}
                      value={symptomsDescription}
                      onChange={(e) => setSymptomsDescription(e.target.value)}
                      placeholder="Describe when it started, trigger factors, affected areas, or past occurrences..."
                      className="w-full px-3.5 py-2.5 bg-white/80 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner font-medium resize-none"
                    />
                  </div>

                  {/* Duration and Severity Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">How long has it persisted?</label>
                      <select
                        id="intake-duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="< 24 Hours">&lt; 24 Hours (Recent Onset)</option>
                        <option value="2 - 7 Days">2 - 7 Days (Past Week)</option>
                        <option value="1 - 4 Weeks">1 - 4 Weeks (Subacute)</option>
                        <option value="Chronic (> 1 Month)">Chronic (&gt; 1 Month)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Severity</label>
                      <select
                        id="intake-severity"
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mild">Mild (Noticeable discomfort)</option>
                        <option value="Moderate">Moderate (Impacting routine)</option>
                        <option value="Acute / Severe">Acute / Severe (Intense pain/distress)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="liquid-glass rounded-2xl p-4 border border-white/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Clinical matching follows HIPAA data privacy guidelines. Details remain private.
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {onSkipToAllDoctors && (
                  <button
                    type="button"
                    onClick={onSkipToAllDoctors}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/60 hover:bg-white border border-slate-200 rounded-xl transition-all"
                  >
                    Browse All Doctors
                  </button>
                )}
                <button
                  type="submit"
                  id="btn-suggest-doctors"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  <span>Analyze Symptoms &amp; Suggest Doctors</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Tailored Doctor Suggestions View */}
      {currentStep === 'recommendations' && (
        <div className="space-y-6">
          {/* Emergency Alert if red flag detected */}
          {emergencyAlert && (
            <div className="bg-rose-50 border-2 border-rose-400 rounded-3xl p-5 text-rose-950 flex items-start gap-3.5 shadow-sm animate-pulse">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-extrabold text-rose-900 uppercase tracking-wide">Emergency Triage Notice</h2>
                <p className="text-xs sm:text-sm text-rose-800 mt-1 leading-relaxed">{emergencyAlert}</p>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href="tel:911"
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Call Emergency Services (911)
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Patient Details Summary Bar with Edit CTA */}
          <div className="liquid-glass rounded-3xl p-5 border border-white/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-slate-900 font-display">
                    Recommended for {patientName}
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {age} yrs • {gender}
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                    {duration}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    severity === 'Acute / Severe'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {severity} Severity
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>Presenting Concern:</strong> {primaryConcern}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-edit-patient-details"
                onClick={() => setCurrentStep('intake')}
                className="px-4 py-2 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit Symptoms &amp; Re-Analyze</span>
              </button>
            </div>
          </div>

          {/* Top Recommendation Highlight Tile */}
          {topMatch && (
            <div className="relative rounded-3xl p-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
              <div className="bg-white/95 rounded-[22px] p-6 sm:p-7 backdrop-blur-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Doctor Info & Match score */}
                  <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={topMatch.doctor.avatar}
                        alt={topMatch.doctor.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-blue-50 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <div
                        className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-white shadow-xs"
                        title="Board Verified Specialist"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-full shadow-2xs">
                          ★ #1 TOP CLINICAL RECOMMENDATION
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-full">
                          {topMatch.matchScore}% Optimal Match
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate font-display">
                        {topMatch.doctor.name}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                        <span className="font-bold text-blue-700">{topMatch.doctor.specialization}</span>
                        <span>•</span>
                        <span>{topMatch.doctor.hospitalAffiliation}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {topMatch.doctor.rating} ({topMatch.doctor.reviewCount} reviews)
                        </span>
                      </div>

                      {/* Clinical Match Rationale Tags */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Why this doctor is recommended for your condition:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {topMatch.reasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/90 text-blue-900 border border-blue-200/80 rounded-xl text-xs font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{reason}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consultation Pricing & 1-Click Booking CTA */}
                  <div className="lg:border-l lg:border-slate-200/80 lg:pl-6 shrink-0 flex flex-col justify-between items-start lg:items-end gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        Consultation Fee
                      </div>
                      <div className="text-3xl font-black text-slate-900 font-display">
                        ${topMatch.doctor.consultationFee}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {topMatch.doctor.slotDurationMinutes} min live video consult
                      </div>
                    </div>

                    <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2">
                      <button
                        type="button"
                        id={`book-top-match-${topMatch.doctor.id}`}
                        onClick={() => handleBookMatchedDoctor(topMatch.doctor)}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book Recommended Doctor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewDoctorProfile(topMatch.doctor)}
                        className="w-full px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <span>View Credentials</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secondary Matched Doctors Header */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                Additional Matching Specialists ({otherMatches.length})
              </h2>
              <p className="text-xs text-slate-500">
                Alternative verified physicians qualified to treat your symptoms
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterView('all_matches')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterView === 'all_matches'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/70'
                }`}
              >
                All Ranked Matches
              </button>
              <button
                type="button"
                onClick={() => setFilterView('top_matches')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterView === 'top_matches'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white border border-slate-200/70'
                }`}
              >
                Score 80%+ Only
              </button>
            </div>
          </div>

          {/* Secondary Matches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {otherMatches.map((item) => {
              const doc = item.doctor;
              return (
                <div
                  key={doc.id}
                  id={`matched-doctor-card-${doc.id}`}
                  className="liquid-glass-card rounded-3xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Head */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-white">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50/90 px-2 py-0.5 rounded-full border border-blue-100">
                            {doc.specialization}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.matchScore >= 85
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.matchScore}% Match
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 mt-1.5 truncate font-display">
                          {doc.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{doc.hospitalAffiliation}</p>
                      </div>
                    </div>

                    {/* Why recommended rationale */}
                    <div className="mt-3.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50 space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Match Rationale:
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium line-clamp-2 leading-relaxed">
                        {item.reasons.join(' • ')}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 bg-white/70 p-2 rounded-xl border border-slate-200/40">
                        <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span><strong>{doc.experienceYears}</strong> yrs exp</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 bg-white/70 p-2 rounded-xl border border-slate-200/40 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{doc.rating}</span>
                        <span className="text-slate-400 font-normal">({doc.reviewCount})</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-200/60 flex items-center justify-between gap-2 backdrop-blur-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Fee</div>
                      <div className="text-lg font-black text-slate-900">${doc.consultationFee}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewDoctorProfile(doc)}
                        className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        id={`book-doctor-matched-${doc.id}`}
                        onClick={() => handleBookMatchedDoctor(doc)}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Slot</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
