import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorRegistrationInput, AdminRegistrationInput } from '../../types';
import {
  X,
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  Award,
  DollarSign,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalRole,
    authModalTab,
    closeAuthModal,
    doctorLogin,
    adminLogin,
    doctorRegister,
    adminRegister,
    doctors,
  } = useApp();

  // Active state within modal
  const [activeRole, setActiveRole] = useState<'doctor' | 'admin'>(authModalRole);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalTab);

  // Synchronize when modal opens with new defaults
  React.useEffect(() => {
    setActiveRole(authModalRole);
    setActiveTab(authModalTab);
    setError(null);
    setSuccessMsg(null);
  }, [authModalOpen, authModalRole, authModalTab]);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Doctor Registration state
  const [doctorForm, setDoctorForm] = useState<DoctorRegistrationInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'Cardiology',
    regNumber: '',
    hospitalAffiliation: '',
    experienceYears: 5,
    consultationFee: 75,
    qualifications: 'MBBS, MD',
    bio: '',
  });
  const [doctorConfirmPass, setDoctorConfirmPass] = useState('');
  const [doctorAgreed, setDoctorAgreed] = useState(false);

  // Admin Registration state
  const [adminForm, setAdminForm] = useState<AdminRegistrationInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    adminPasscode: '',
    department: 'Medical Board & Clinical Operations',
  });
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [adminAgreed, setAdminAgreed] = useState(false);

  if (!authModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      if (activeRole === 'doctor') {
        const res = doctorLogin(loginEmail, loginPassword);
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Failed to authenticate doctor credentials.');
        }
      } else {
        const res = adminLogin(loginEmail, loginPassword);
        setLoading(false);
        if (!res.success) {
          setError(res.error || 'Failed to authenticate administrator credentials.');
        }
      }
    }, 400);
  };

  const handleDoctorRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!doctorForm.name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!doctorForm.email.includes('@')) {
      setError('Please enter a valid medical email address.');
      return;
    }
    if (!doctorForm.regNumber.trim()) {
      setError('Medical license / registration number is required.');
      return;
    }
    if (doctorForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (doctorForm.password !== doctorConfirmPass) {
      setError('Passwords do not match.');
      return;
    }
    if (!doctorAgreed) {
      setError('You must certify your medical license validity.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = doctorRegister(doctorForm);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Doctor registration failed.');
      } else {
        setSuccessMsg('Registration verified! Redirecting to doctor console...');
      }
    }, 500);
  };

  const handleAdminRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminForm.name.trim()) {
      setError('Please provide administrative personnel name.');
      return;
    }
    if (!adminForm.email.includes('@')) {
      setError('Please enter a valid administrative work email.');
      return;
    }
    if (!adminForm.adminPasscode.trim()) {
      setError('Administrative security passcode is required.');
      return;
    }
    if (adminForm.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (adminForm.password !== adminConfirmPass) {
      setError('Passwords do not match.');
      return;
    }
    if (!adminAgreed) {
      setError('You must confirm authorized administrative status.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = adminRegister(adminForm);
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Admin registration failed.');
      } else {
        setSuccessMsg('Admin credentials created! Redirecting to governance dashboard...');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="security-auth-modal"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header with Security Branding */}
        <div
          className={`p-6 text-white transition-colors ${
            activeRole === 'doctor'
              ? 'bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900'
              : 'bg-gradient-to-r from-purple-800 via-purple-900 to-slate-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                {activeRole === 'doctor' ? (
                  <Stethoscope className="w-5 h-5 text-blue-200" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-purple-200" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {activeRole === 'doctor' ? 'Healthcare Provider Portal' : 'Administrative Governance Gate'}
                </h3>
                <p className="text-xs text-white/80">
                  {activeRole === 'doctor'
                    ? 'Restricted to licensed practitioners and clinical specialists'
                    : 'System oversight, dispute handling, and provider auditing'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="close-auth-modal-btn"
              onClick={closeAuthModal}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role Pill Switcher (Doctor vs Admin) */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-black/20 rounded-2xl border border-white/15">
            <button
              type="button"
              id="auth-role-select-doctor"
              onClick={() => {
                setActiveRole('doctor');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeRole === 'doctor'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor / Specialist</span>
            </button>

            <button
              type="button"
              id="auth-role-select-admin"
              onClick={() => {
                setActiveRole('admin');
                setError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeRole === 'admin'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Admin</span>
            </button>
          </div>
        </div>

        {/* Notice that patients do not need login */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-5 py-2.5 flex items-center gap-2.5 text-xs text-emerald-900">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <p>
            <strong>Note for Patients:</strong> Patient access is instant & open. No login or registration is required to browse doctors or book consultations.
          </p>
        </div>

        {/* Main Tab Bar: Security Login vs Registration */}
        <div className="flex border-b border-slate-200 bg-slate-50/70">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? activeRole === 'doctor'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security Sign In</span>
          </button>

          <button
            type="button"
            id="auth-tab-register"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? activeRole === 'doctor'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>New {activeRole === 'doctor' ? 'Doctor' : 'Admin'} Registration</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {/* Error / Success feedback banners */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {activeRole === 'doctor' ? 'Doctor Work Email' : 'Administrative Email'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      id="auth-login-email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={
                        activeRole === 'doctor' ? 'e.g. dr.mehta@teledoc.med' : 'e.g. admin@teledoc.med'
                      }
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <span className="text-[11px] text-slate-400">Default: doctor123 / admin123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      id="auth-login-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember this session</span>
                  </label>
                  <span className="text-slate-400 text-[11px]">256-Bit Encrypted Gate</span>
                </div>

                <button
                  type="submit"
                  id="auth-login-submit-btn"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold text-xs text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                    activeRole === 'doctor'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {loading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Authenticate & Enter {activeRole === 'doctor' ? 'Doctor Console' : 'Admin Authority'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTRATION (BASIC FORM FOR REGISTRATION) */}
          {activeTab === 'register' && (
            <div>
              {activeRole === 'doctor' ? (
                /* Basic Doctor Registration Form */
                <form onSubmit={handleDoctorRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900">
                    <p className="font-bold mb-0.5">Doctor Onboarding Registration</p>
                    <p className="text-blue-800 text-[11px]">
                      Complete this basic registration form to receive your provider credentials and open your virtual consultation office.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          id="doc-reg-name"
                          value={doctorForm.name}
                          onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                          placeholder="Dr. Eleanor Vance, MD"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Medical Work Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          id="doc-reg-email"
                          value={doctorForm.email}
                          onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                          placeholder="e.g. dr.vance@clinic.org"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Medical Specialization *</label>
                      <select
                        id="doc-reg-specialization"
                        value={doctorForm.specialization}
                        onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                      >
                        <option value="Cardiology">Cardiology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Psychiatry">Psychiatry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">License / Reg Number *</label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          id="doc-reg-number"
                          value={doctorForm.regNumber}
                          onChange={(e) => setDoctorForm({ ...doctorForm, regNumber: e.target.value })}
                          placeholder="MED-REG-991823"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          id="doc-reg-hospital"
                          value={doctorForm.hospitalAffiliation}
                          onChange={(e) => setDoctorForm({ ...doctorForm, hospitalAffiliation: e.target.value })}
                          placeholder="City General Hospital"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          id="doc-reg-phone"
                          value={doctorForm.phone}
                          onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                          placeholder="+1 (555) 234-5678"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        id="doc-reg-experience"
                        value={doctorForm.experienceYears}
                        onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Fee ($ USD)</label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="number"
                          min="20"
                          max="500"
                          id="doc-reg-fee"
                          value={doctorForm.consultationFee}
                          onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: parseInt(e.target.value) || 50 })}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Medical Degrees & Qualifications</label>
                    <input
                      type="text"
                      id="doc-reg-qualifications"
                      value={doctorForm.qualifications}
                      onChange={(e) => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                      placeholder="MBBS, MD (Internal Medicine), FACC"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Biography / Practice Focus</label>
                    <textarea
                      rows={2}
                      id="doc-reg-bio"
                      value={doctorForm.bio}
                      onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                      placeholder="Dedicated specialist offering patient-first remote consultations, preventive care, and personalized therapy plans."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Password fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          id="doc-reg-password"
                          value={doctorForm.password}
                          onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          id="doc-reg-confirm-password"
                          value={doctorConfirmPass}
                          onChange={(e) => setDoctorConfirmPass(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={doctorAgreed}
                        onChange={(e) => setDoctorAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        I certify that I hold an active and valid medical license, compliant with jurisdictional telemedicine regulations.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="doc-register-submit-btn"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Registering Doctor Profile...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete Doctor Registration & Enter Console</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Basic Admin Registration Form */
                <form onSubmit={handleAdminRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs text-purple-900">
                    <p className="font-bold mb-0.5">Authorized Administrative Enrollment</p>
                    <p className="text-purple-800 text-[11px]">
                      Enroll trusted platform operators, clinical directors, or compliance officers with secure credentials.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        id="admin-reg-name"
                        value={adminForm.name}
                        onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                        placeholder="e.g. Dr. Marcus Vance, Chief Medical Officer"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official Work Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          id="admin-reg-email"
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                          placeholder="governance@teledoc.med"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          id="admin-reg-phone"
                          value={adminForm.phone}
                          onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                          placeholder="+1 (555) 990-1122"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Department</label>
                    <select
                      id="admin-reg-department"
                      value={adminForm.department}
                      onChange={(e) => setAdminForm({ ...adminForm, department: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                    >
                      <option value="Medical Board & Clinical Operations">Medical Board & Clinical Operations</option>
                      <option value="Credentialing & Compliance Oversight">Credentialing & Compliance Oversight</option>
                      <option value="Platform IT & Security Engineering">Platform IT & Security Engineering</option>
                      <option value="Finance & Dispute Resolution Authority">Finance & Dispute Resolution Authority</option>
                    </select>
                  </div>

                  {/* Admin Passcode */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Platform Security Passcode *</label>
                      <span className="text-[11px] text-purple-600 font-semibold cursor-pointer hover:underline" onClick={() => setAdminForm({ ...adminForm, adminPasscode: 'TELEDOC-ADMIN-2026' })}>
                        Use Demo Passcode: TELEDOC-ADMIN-2026
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        id="admin-reg-passcode"
                        value={adminForm.adminPasscode}
                        onChange={(e) => setAdminForm({ ...adminForm, adminPasscode: e.target.value })}
                        placeholder="Enter master authorization passcode"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Create Admin Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          id="admin-reg-password"
                          value={adminForm.password}
                          onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Admin Password *</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          id="admin-reg-confirm-password"
                          value={adminConfirmPass}
                          onChange={(e) => setAdminConfirmPass(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={adminAgreed}
                        onChange={(e) => setAdminAgreed(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span>
                        I confirm that I am authorized administrative personnel handling confidential provider and patient data.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    id="admin-register-submit-btn"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Enrolling Admin Account...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Enroll Administrator & Access Governance</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>TeleDoc HIPAA & SOC-2 Compliant Security Framework</span>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
