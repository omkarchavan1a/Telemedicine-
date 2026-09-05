import React from 'react';
import { useApp } from '../../context/AppContext';
import { Stethoscope, ShieldCheck, Lock, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

interface SecurityCheckpointProps {
  requiredRole: 'doctor' | 'admin';
}

export const SecurityCheckpoint: React.FC<SecurityCheckpointProps> = ({ requiredRole }) => {
  const { openAuthModal, setCurrentRole } = useApp();

  const isDoctor = requiredRole === 'doctor';

  return (
    <div className="max-w-2xl mx-auto my-10 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
      {/* Icon Badge */}
      <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xs border">
        {isDoctor ? (
          <div className="w-full h-full rounded-2xl bg-blue-50 border-blue-200 text-blue-600 flex items-center justify-center">
            <Stethoscope className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-full h-full rounded-2xl bg-purple-50 border-purple-200 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
        )}
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 border">
        <Lock className="w-3.5 h-3.5" />
        <span>{isDoctor ? 'Doctor Provider Authentication Required' : 'Administrative Clearance Gate'}</span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
        {isDoctor ? 'Healthcare Provider Security Verification' : 'Administrative Governance Portal'}
      </h2>

      <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
        {isDoctor
          ? 'To access patient consultation queues, interactive video examination rooms, and official e-prescription pads, healthcare providers must authenticate their medical credentials.'
          : 'Administrative oversight over financial commission reporting, doctor onboarding credential verifications, and dispute arbitration requires verified admin clearance.'}
      </p>

      {/* Security Pillars Checklist */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left text-xs text-slate-700 max-w-md mx-auto mb-6 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDoctor ? 'text-blue-600' : 'text-purple-600'}`} />
          <span>HIPAA & SOC-2 Compliant Role-Based Access Control</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDoctor ? 'text-blue-600' : 'text-purple-600'}`} />
          <span>Encrypted Clinical Session & Audit Log Tracking</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isDoctor ? 'text-blue-600' : 'text-purple-600'}`} />
          <span>Self-service Registration with Medical Verification Form</span>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          id="checkpoint-login-btn"
          onClick={() => openAuthModal(requiredRole, 'login')}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 ${
            isDoctor ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security Sign In ({isDoctor ? 'Doctor' : 'Admin'})</span>
        </button>

        <button
          type="button"
          id="checkpoint-register-btn"
          onClick={() => openAuthModal(requiredRole, 'register')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <span>New {isDoctor ? 'Doctor' : 'Admin'}? Register Here</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        <button
          type="button"
          id="checkpoint-return-patient-btn"
          onClick={() => setCurrentRole('patient')}
          className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 font-medium"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Return to Open Patient Portal (No Login Required)</span>
        </button>
      </div>
    </div>
  );
};
