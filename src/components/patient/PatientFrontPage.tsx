import React from 'react';
import { useApp } from '../../context/AppContext';
import { getIntakeProgress, isIntakeComplete } from '../../lib/patientIntake';
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  FileText,
  HeartPulse,
  ShieldCheck,
  Lock,
  Stethoscope,
  Video,
  Brain,
  Baby,
  Bone,
  Sparkles,
  Activity,
  Syringe,
  Eye,
  CheckCircle2,
} from 'lucide-react';

const SPECIALTIES: { name: string; blurb: string; Icon: React.ElementType }[] = [
  { name: 'General Medicine', blurb: 'Everyday illness, infections & preventive care', Icon: Stethoscope },
  { name: 'Cardiology', blurb: 'Heart health, BP & cardiac follow-ups', Icon: HeartPulse },
  { name: 'Pediatrics', blurb: 'Child health, growth & vaccinations', Icon: Baby },
  { name: 'Dermatology', blurb: 'Skin, hair & allergy concerns', Icon: Sparkles },
  { name: 'Neurology', blurb: 'Migraine, nerves & sleep disorders', Icon: Brain },
  { name: 'Orthopedics', blurb: 'Joints, bones & sports injuries', Icon: Bone },
  { name: 'Psychiatry', blurb: 'Mind health, anxiety & wellness', Icon: Activity },
];

const STEPS = [
  {
    n: '1',
    title: 'Patient Information & Medical Intake',
    desc: 'Tell us who you are, emergency contacts, allergies, conditions and medications. This becomes your verified intake record.',
    tab: 'profile',
    cta: 'Start Medical Intake',
  },
  {
    n: '2',
    title: 'Find Your Doctor & Book',
    desc: 'Get matched by symptoms or browse verified specialists. Reserve a slot with 5-minute secure Card/UPI payment.',
    tab: 'doctors',
    cta: 'Find Doctors',
  },
  {
    n: '3',
    title: 'Consult & Get Prescription',
    desc: 'Meet on secure video, receive a signed digital prescription, reminders and follow-up care in one place.',
    tab: 'appointments',
    cta: 'My Consultations',
  },
];

export const PatientFrontPage: React.FC = () => {
  const { currentUser, patientProfile, doctors, appointments, healthRecords, setCurrentTab } = useApp();

  const approvedDoctors = doctors.filter((d) => d.status === 'approved');
  const specialtiesCount = new Set(approvedDoctors.map((d) => d.specialization)).size;
  const progress = getIntakeProgress(patientProfile);
  const intakeDone = isIntakeComplete(patientProfile);

  const upcoming = appointments
    .filter(
      (a) =>
        (a.patientId === currentUser.id || a.patientEmail === currentUser.email) &&
        (a.status === 'scheduled' || a.status === 'in_waiting_room' || a.status === 'in_consultation')
    )
    .sort((a, b) => `${a.date} ${a.timeSlot}`.localeCompare(`${b.date} ${b.timeSlot}`))[0];

  const firstName = patientProfile.name ? patientProfile.name.split(' ')[0] : currentUser.name !== 'Guest' ? currentUser.name.split(' ')[0] : null;

  return (
    <div className="space-y-6">
      {/* Hero: all key details + ordered journey */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xs">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/15 rounded-full text-[11px] font-bold uppercase tracking-wider text-blue-200">
              <Syringe className="w-3.5 h-3.5" />
              Virtual Care Front Desk
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              {firstName ? `Namaste, ${firstName}.` : 'Your health journey starts here.'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              TeleDoc walks you through every step in order — first your patient information and medical
              intake, then doctor consultations with secure payment, video visits, prescriptions and health
              records. Nothing to figure out on your own.
            </p>
          </div>

          {/* Ordered 3-step path */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {STEPS.map((s, i) => {
              const locked = i > 0 && !intakeDone;
              return (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => setCurrentTab(s.tab)}
                  className={`text-left p-4 rounded-2xl border transition-all group ${
                    i === 0 && !intakeDone
                      ? 'bg-emerald-500/15 border-emerald-400/40 hover:bg-emerald-500/25'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        i === 0 && !intakeDone ? 'bg-emerald-400 text-slate-950' : 'bg-white/15 text-white'
                      }`}
                    >
                      {s.n}
                    </span>
                    {locked && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 border border-amber-300/30 px-2 py-0.5 rounded-full">
                        After intake
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 text-sm font-bold">{s.title}</div>
                  <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">{s.desc}</p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-300 group-hover:gap-2 transition-all">
                    {s.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Intake progress */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <ClipboardList className="w-5 h-5 text-emerald-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Medical intake progress</span>
                  <span className="text-emerald-300">{progress.done}/{progress.total} · {progress.percent}%</span>
                </div>
                <div className="mt-1.5 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${intakeDone ? 'bg-emerald-400' : 'bg-blue-400'}`}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            </div>
            {!intakeDone ? (
              <button
                type="button"
                onClick={() => setCurrentTab('profile')}
                className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shrink-0"
              >
                Complete Intake First
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-400/15 border border-emerald-300/40 text-emerald-200 rounded-xl text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" /> Intake Complete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Continue care: next appointment */}
      {upcoming && (
        <div className="liquid-glass-card rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Up next in your care</div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {upcoming.doctorName} · {upcoming.date} at {upcoming.timeSlot}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('appointments')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            View Consultations
          </button>
        </div>
      )}

      {/* Platform at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Verified Doctors', value: String(approvedDoctors.length), Icon: Stethoscope, tint: 'text-blue-600 bg-blue-50 border-blue-200/70' },
          { label: 'Specialties Covered', value: String(specialtiesCount), Icon: HeartPulse, tint: 'text-rose-600 bg-rose-50 border-rose-200/70' },
          { label: 'My Consultations', value: String(appointments.filter((a) => a.patientId === currentUser.id || a.patientEmail === currentUser.email).length), Icon: Calendar, tint: 'text-indigo-600 bg-indigo-50 border-indigo-200/70' },
          { label: 'Health Records Stored', value: String(healthRecords.filter((r) => r.patientId === currentUser.id).length), Icon: FileText, tint: 'text-emerald-600 bg-emerald-50 border-emerald-200/70' },
        ].map((s) => (
          <div key={s.label} className="liquid-glass-card rounded-2xl p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.tint}`}>
              <s.Icon className="w-4 h-4" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">{s.value}</div>
            <div className="text-[11px] font-semibold text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Specialties */}
      <div className="liquid-glass rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Care by specialty</h2>
            <p className="text-xs text-slate-500 mt-0.5">Every department follows the same path: intake first, then consultation.</p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentTab('doctors')}
            className="text-xs font-bold text-blue-700 hover:underline shrink-0 inline-flex items-center gap-1"
          >
            All doctors <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {SPECIALTIES.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => setCurrentTab('doctors')}
              className="text-left p-4 rounded-2xl bg-white/70 border border-slate-200/70 hover:border-blue-300 hover:bg-white transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <s.Icon className="w-4 h-4" />
              </div>
              <div className="mt-2 text-sm font-bold text-slate-900">{s.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.blurb}</div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCurrentTab('doctors')}
            className="text-left p-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div className="mt-2 text-sm font-bold">Not sure where to start?</div>
            <div className="text-[11px] text-slate-300 mt-0.5">Describe symptoms — we match the right specialist.</div>
          </button>
        </div>
      </div>

      {/* Trust strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { Icon: ShieldCheck, title: 'Verified Licenses', desc: 'Every doctor passes admin credential review before appearing.' },
          { Icon: Lock, title: 'Private by Design', desc: 'AES-256 vault, HIPAA-aligned handling of your records.' },
          { Icon: FileText, title: 'Signed Prescriptions', desc: 'Digitally signed Rx with dosage, duration and follow-ups.' },
        ].map((t) => (
          <div key={t.title} className="flex items-start gap-3 p-4 rounded-2xl bg-white/70 border border-slate-200/70">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0">
              <t.Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{t.title}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
