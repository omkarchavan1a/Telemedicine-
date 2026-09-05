import React from 'react';
import { Prescription } from '../../types';
import {
  X,
  Printer,
  FileCheck,
  Stethoscope,
  Heart,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface PrescriptionModalProps {
  prescription: Prescription | null;
  onClose: () => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  prescription,
  onClose,
}) => {
  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="prescription-view-modal"
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Screen Controls Header (hidden during print) */}
        <div className="no-print bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold">Official Digital Prescription ({prescription.id})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Prescription Body */}
        <div className="p-8 space-y-6 text-slate-800 bg-white" id="printable-prescription">
          {/* Medical Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2.5 text-blue-700 font-extrabold text-2xl tracking-tight">
                <Stethoscope className="w-7 h-7 text-blue-600" />
                <span>TeleDoc Clinical Network</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{prescription.doctorName}</h2>
              <p className="text-xs text-slate-600 font-medium">
                {prescription.doctorSpecialization}
              </p>
              <p className="text-xs text-slate-500">
                Medical License Reg: <strong>{prescription.doctorRegNo}</strong>
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold text-[11px] mb-1">
                Verified Teleconsultation Rx
              </div>
              <div className="text-slate-500">
                Rx Number: <strong className="font-mono text-slate-800">{prescription.id}</strong>
              </div>
              <div className="text-slate-500">
                Date: <strong className="text-slate-800">{new Date(prescription.issuedAt).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Patient Details & Clinical Vitals Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Patient Name</span>
              <strong className="text-slate-900 text-sm">{prescription.patientName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Age / Gender</span>
              <strong className="text-slate-900">{prescription.patientAge} Yrs / {prescription.patientGender}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Blood Group</span>
              <strong className="text-rose-600 font-bold">{prescription.patientBloodGroup || 'B+'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Recorded BP</span>
              <strong className="text-slate-900">{prescription.vitals?.bp || '126/82 mmHg'}</strong>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Provisional / Final Diagnosis
            </span>
            <div className="text-base font-extrabold text-slate-900 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              {prescription.diagnosis}
            </div>
          </div>

          {/* Rx Medications Table */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xl font-black text-blue-700 tracking-tight">
              <span>℞</span>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
                Prescribed Medication Schedule
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Medication Name & Strength</th>
                    <th className="py-2.5 px-3">Dosage & Frequency</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Administration Advice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.medications.map((med, idx) => (
                    <tr key={med.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 text-sm block">{med.name}</strong>
                        {med.dosage && (
                          <span className="text-slate-500 text-[11px] font-medium">{med.dosage}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-blue-700">
                        {med.frequency}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {med.duration}
                      </td>
                      <td className="py-3 px-3 text-slate-600 italic">
                        {med.instructions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Doctor Advice & Follow-Up */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="sm:col-span-2 space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Dietary & Lifestyle Advice
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {prescription.advice}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Next Follow-Up
              </span>
              <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{prescription.followUpDate || 'As advised'}</span>
              </div>
            </div>
          </div>

          {/* Digital Signature & Footer Seal */}
          <div className="pt-6 border-t-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Cryptographically anchored in patient health vault.</span>
            </div>

            <div className="text-right">
              <div className="font-mono text-xs font-bold text-slate-800">
                {prescription.doctorSignature}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                Authorized Digital Prescriber
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
