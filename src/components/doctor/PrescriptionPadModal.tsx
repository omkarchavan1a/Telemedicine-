import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, PrescriptionMedication } from '../../types';
import {
  X,
  Stethoscope,
  Plus,
  Trash2,
  FileCheck,
  ShieldCheck,
  Calendar,
  User,
  Heart,
  Pill,
} from 'lucide-react';

interface PrescriptionPadModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PrescriptionPadModal: React.FC<PrescriptionPadModalProps> = ({
  appointment,
  onClose,
  onSuccess,
}) => {
  const { issuePrescription, patientProfile, currentUser, doctors, authDoctor } = useApp();

  // Issuing doctor: signed-in doctor first, then appointment's doctor (strict, no cross-doctor fallback)
  const doc =
    authDoctor ||
    doctors.find((d) => d.id === appointment?.doctorId) ||
    (currentUser.email
      ? doctors.find((d) => d.email.toLowerCase() === currentUser.email.toLowerCase())
      : undefined);

  const [diagnosis, setDiagnosis] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [medications, setMedications] = useState<PrescriptionMedication[]>([
    {
      id: 'm-1',
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
    },
  ]);

  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  if (!appointment) return null;
  if (!doc) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
        <div className="bg-white rounded-3xl p-8 max-w-md text-center space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Doctor profile not found</h2>
          <p className="text-xs text-slate-500">Your session is not linked to a registered doctor profile.</p>
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-200 rounded-xl text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const addMedicationRow = () => {
    const newMed: PrescriptionMedication = {
      id: `med-${Date.now()}`,
      name: '',
      dosage: '',
      frequency: '1 - 0 - 1 (Twice daily after meals)',
      duration: '7 Days',
      instructions: 'Take after meals with water',
    };
    setMedications([...medications, newMed]);
  };

  const updateMedication = (id: string, field: keyof PrescriptionMedication, value: string) => {
    setMedications(
      medications.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeMedication = (id: string) => {
    if (medications.length <= 1) {
      setSubmitError('Prescription must contain at least one medication.');
      return;
    }
    setMedications(medications.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!diagnosis.trim()) {
      setSubmitError('Please enter a clinical diagnosis.');
      return;
    }

    const hasEmptyName = medications.some((m) => !m.name.trim());
    if (hasEmptyName) {
      setSubmitError('Please provide medication names for all prescribed drugs.');
      return;
    }

    // Derive patient age from date of birth when available
    let patientAge = 0;
    if (patientProfile.dateOfBirth) {
      const dob = new Date(patientProfile.dateOfBirth);
      if (!Number.isNaN(dob.getTime())) {
        patientAge = Math.max(0, new Date().getFullYear() - dob.getFullYear());
      }
    }

    try {
      issuePrescription({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        patientAge,
        patientGender: patientProfile.gender || '',
        patientBloodGroup: patientProfile.bloodGroup || '',
        doctorId: doc.id,
        doctorName: doc.name,
        doctorSpecialization: doc.specialization,
        doctorRegNo: doc.regNumber,
        diagnosis: diagnosis.trim(),
        vitals: { bp, pulse, temp, weight },
        medications: medications.filter((m) => m.name.trim()),
        advice,
        followUpDate,
        doctorSignature: `${doc.name} (Digital Sign-off Verified · Reg #${doc.regNumber})`,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to issue prescription.');
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div
        id="prescription-pad-modal-container"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
      >
        {/* Prescription Header styled as official clinic letterhead */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{doc.name}</h2>
                <p className="text-xs text-blue-300">{doc.specialization} · {doc.hospitalAffiliation}</p>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono text-right">
              <div>Reg No: <strong className="text-slate-200">{doc.regNumber}</strong></div>
              <div>Date: <strong className="text-slate-200">{new Date().toISOString().split('T')[0]}</strong></div>
            </div>
          </div>

          {/* Patient Meta Strip */}
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
            <div>
              <span className="text-slate-500">Patient:</span>{' '}
              <strong className="text-white">{appointment.patientName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Age/Gender:</span>{' '}
              <strong className="text-white">{patientProfile.gender || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Blood Group:</span>{' '}
              <strong className="text-rose-400 font-bold">{patientProfile.bloodGroup || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Apt ID:</span>{' '}
              <strong className="font-mono text-slate-300">{appointment.id}</strong>
            </div>
          </div>
        </div>

        {/* Prescription Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {submitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {submitError}
            </div>
          )}
          {/* Clinical Vitals Strip */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Clinical Recorded Vitals
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block mb-0.5">Blood Pressure</span>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Pulse Rate</span>
                <input
                  type="text"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Temperature</span>
                <input
                  type="text"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Body Weight</span>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Clinical Diagnosis */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Provisional / Final Diagnosis *
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Essential Hypertension, Acute Bronchitis..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Prescription Medications (Rx) Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-blue-600" />
                Prescribed Medications (Rx)
              </label>
              <button
                type="button"
                onClick={addMedicationRow}
                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Drug</span>
              </button>
            </div>

            <div className="space-y-3">
              {medications.map((med, index) => (
                <div
                  key={med.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">#{index + 1} Medication</span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(med.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Drug & Brand Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Amoxicillin 500mg, Telmisartan 40mg"
                        value={med.name}
                        onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Dosage / Strength</span>
                      <input
                        type="text"
                        placeholder="e.g. 500 mg, 1 Tablet"
                        value={med.dosage}
                        onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Frequency & Timing</span>
                      <input
                        type="text"
                        placeholder="e.g. 1 - 0 - 1 (Twice daily after food)"
                        value={med.frequency}
                        onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-0.5">Course Duration</span>
                      <input
                        type="text"
                        placeholder="e.g. 5 Days, 30 Days"
                        value={med.duration}
                        onChange={(e) => updateMedication(med.id, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Specific Administration Advice</span>
                    <input
                      type="text"
                      placeholder="e.g. Take with plenty of water; do not take on empty stomach"
                      value={med.instructions}
                      onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Advice & Follow-Up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lifestyle & Dietary Advice
              </label>
              <textarea
                rows={2}
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>
          </div>

          {/* Digital Signature Seal Preview */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <strong>Cryptographic Doctor Sign-Off</strong>
                <p className="text-[11px] text-emerald-700 font-mono">
                  Sign-off seal: {doc.name} (License #{doc.regNumber})
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-200 text-emerald-800 rounded-full font-bold text-[10px]">
              AUTHENTICATED
            </span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="sign-and-issue-rx-btn"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Digitally Sign & Issue Prescription</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
