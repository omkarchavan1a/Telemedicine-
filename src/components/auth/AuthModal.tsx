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
  Clock,
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
    requestPasswordReset,
    doctors,
  } = useApp();

  // Active state within modal
  const [activeRole, setActiveRole] = useState<'doctor' | 'admin'>(authModalRole);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Synchronize when modal opens with new defaults
  React.useEffect(() => {
    setActiveRole(authModalRole);
    setActiveTab(authModalTab === 'register' ? 'register' : 'login');
    setError(null);
    setSuccessMsg(null);
    setRequiresCaptcha(false);
    setCaptchaVerified(false);
    setLockRemaining(0);
  }, [authModalOpen, authModalRole, authModalTab]);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Security Challenge States
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [lockRemaining, setLockRemaining] = useState<number>(0);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Password reset state
  const [resetEmail, setResetEmail] = useState('');

  // Doctor Registration state
  const [doctorForm, setDoctorForm] = useState<DoctorRegistrationInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'Cardiology',
    regNumber: '',
    hospitalAffiliation: 'TeleDoc Virtual Health Network',
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

  // Timer countdown for active lockout
  React.useEffect(() => {
    if (lockRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockRemaining((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockRemaining]);

  if (!authModalOpen) return null;

  // Real-time password complexity checker for registration
  const computePasswordRules = (pass: string) => ({
    length: pass.length >= 8 && pass.length <= 72,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass),
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const captchaToken = captchaVerified ? 'turnstile_token_mock_verified' : undefined;
      const res =
        activeRole === 'doctor'
          ? await doctorLogin(loginEmail, loginPassword, captchaToken)
          : await adminLogin(loginEmail, loginPassword, captchaToken);

      setLoading(false);

      if (!res.success) {
        if (res.requiresCaptcha) {
          setRequiresCaptcha(true);
        }
        if (res.locked && res.remainingSeconds) {
          setLockRemaining(res.remainingSeconds);
        }
        setError(res.error || 'Incorrect email or password.');
      } else {
        setRequiresCaptcha(false);
        setCaptchaVerified(false);
        setLockRemaining(0);
      }
    } catch {
      setLoading(false);
      setError('Incorrect email or password.');
    }
  };

  const handleDoctorRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (doctorForm.password !== doctorConfirmPass) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }
    if (!doctorAgreed) {
      setError('Please certify your medical license validity to complete registration.');
      return;
    }

    setLoading(true);
    try {
      const payload: DoctorRegistrationInput = {
        ...doctorForm,
        name: doctorForm.name.trim(),
        email: doctorForm.email.trim(),
        regNumber: doctorForm.regNumber.trim(),
        hospitalAffiliation: doctorForm.hospitalAffiliation?.trim() || 'TeleDoc Virtual Health Network',
        qualifications: doctorForm.qualifications?.trim() || 'MBBS, MD',
        phone: doctorForm.phone?.trim() || '+1 (555) 019-2834',
        experienceYears: Number(doctorForm.experienceYears) || 5,
        consultationFee: Number(doctorForm.consultationFee) || 75,
        bio: doctorForm.bio?.trim() || `Licensed specialist in ${doctorForm.specialization} providing patient-first telemedicine consultations.`,
      };

      const res = await doctorRegister(payload);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Doctor registration could not be completed. Please review your entries.');
      } else {
        setSuccessMsg('Registration verified! Redirecting to doctor console...');
      }
    } catch {
      setLoading(false);
      setError('Registration could not be completed. Please verify your details.');
    }
  };

  const handleAdminRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (adminForm.password !== adminConfirmPass) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }
    if (!adminAgreed) {
      setError('Please confirm authorized administrative status.');
      return;
    }

    setLoading(true);
    try {
      const payload: AdminRegistrationInput = {
        ...adminForm,
        name: adminForm.name.trim(),
        email: adminForm.email.trim(),
        phone: adminForm.phone?.trim() || '+1 (555) 000-8811',
        adminPasscode: adminForm.adminPasscode.trim(),
        department: adminForm.department?.trim() || 'Medical Board & Clinical Operations',
      };

      const res = await adminRegister(payload);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Admin registration failed.');
      } else {
        setSuccessMsg('Admin credentials created! Redirecting to governance dashboard...');
      }
    } catch {
      setLoading(false);
      setError('Admin registration could not be completed.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await requestPasswordReset(resetEmail);
    setLoading(false);
    setSuccessMsg(res.message);
  };

  const doctorPassRules = computePasswordRules(doctorForm.password);
  const adminPassRules = computePasswordRules(adminForm.password);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="security-auth-modal"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Header */}
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
                  {activeRole === 'doctor' ? 'Healthcare Provider Portal' : 'Administrative Console'}
                </h3>
                <p className="text-xs text-white/80">
                  {activeRole === 'doctor'
                    ? 'Restricted to licensed practitioners and clinical specialists'
                    : 'Platform administration and governance'}
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

          {/* Role Switcher Pill */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-black/20 rounded-2xl border border-white/15">
            <button
              type="button"
              id="auth-role-select-doctor"
              onClick={() => {
                setActiveRole('doctor');
                setError(null);
                setSuccessMsg(null);
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
                setSuccessMsg(null);
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

        {/* Patient Notice */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <p>
            Patients can book consultations and access health records directly without signing in to this portal.
          </p>
        </div>

        {/* Multi-Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'login'
                ? activeRole === 'doctor'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="auth-tab-register"
            onClick={() => {
              setActiveTab('register');
              setError(null);
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'register'
                ? activeRole === 'doctor'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Register {activeRole === 'doctor' ? 'Doctor' : 'Admin'}</span>
          </button>

          <button
            type="button"
            id="auth-tab-forgot"
            onClick={() => {
              setActiveTab('forgot');
              setError(null);
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'forgot'
                ? activeRole === 'doctor'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Reset Password</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {/* Lockout Notification Banner */}
          {lockRemaining > 0 && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Too many unsuccessful attempts</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Access is temporarily restricted. Please try again later or reset your password.
                </p>
              </div>
            </div>
          )}

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

          {/* TAB 1: SIGN IN */}
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
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
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

                {/* CAPTCHA Challenge Widget (Pillar 2: Triggered after >=3 failed attempts) */}
                {requiresCaptcha && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={captchaVerified}
                        onChange={(e) => setCaptchaVerified(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">Security Verification</p>
                        <p className="text-[10px] text-slate-500">Please confirm to proceed</p>
                      </div>
                    </label>
                    <ShieldCheck className={`w-5 h-5 ${captchaVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Remember this device</span>
                  </label>
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
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        Sign In to {activeRole === 'doctor' ? 'Doctor Portal' : 'Admin Portal'}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: REGISTRATION */}
          {activeTab === 'register' && (
            <div>
              {activeRole === 'doctor' ? (
                <form onSubmit={handleDoctorRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900">
                    <p className="font-bold mb-0.5">Doctor Onboarding Registration</p>
                    <p className="text-blue-800 text-[11px]">
                      Complete registration to submit provider credentials and join the telemedicine clinical network.
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
                          value={doctorForm.name}
                          onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                          placeholder="Dr. Jane Smith"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Professional Email *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={doctorForm.email}
                          onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                          placeholder="jane.smith@hospital.org"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Medical License Number *</label>
                      <input
                        type="text"
                        required
                        value={doctorForm.regNumber}
                        onChange={(e) => setDoctorForm({ ...doctorForm, regNumber: e.target.value })}
                        placeholder="MD-88392-US"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Specialization *</label>
                      <select
                        value={doctorForm.specialization}
                        onChange={(e) =>
                          setDoctorForm({
                            ...doctorForm,
                            specialization: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                      >
                        <option value="Cardiology">Cardiology</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Dermatology">Dermatology</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Psychiatry">Psychiatry</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation (Optional)</label>
                      <input
                        type="text"
                        value={doctorForm.hospitalAffiliation || ''}
                        onChange={(e) => setDoctorForm({ ...doctorForm, hospitalAffiliation: e.target.value })}
                        placeholder="TeleDoc Virtual Health Network"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone (Optional)</label>
                      <input
                        type="tel"
                        value={doctorForm.phone || ''}
                        onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                        placeholder="+1 (555) 019-2834"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Password & Complexity Meter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                      <input
                        type="password"
                        required
                        value={doctorForm.password}
                        onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                        placeholder="At least 8 chars..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        value={doctorConfirmPass}
                        onChange={(e) => setDoctorConfirmPass(e.target.value)}
                        placeholder="Repeat password..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Real-Time Password Policy Checklist */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                    <p className="font-bold text-slate-700 mb-1">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <span className={doctorPassRules.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {doctorPassRules.length ? '✓' : '○'} 8 to 72 characters
                      </span>
                      <span className={doctorPassRules.hasUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {doctorPassRules.hasUpper ? '✓' : '○'} Uppercase letter (A-Z)
                      </span>
                      <span className={doctorPassRules.hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {doctorPassRules.hasLower ? '✓' : '○'} Lowercase letter (a-z)
                      </span>
                      <span className={doctorPassRules.hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {doctorPassRules.hasNumber ? '✓' : '○'} At least 1 number (0-9)
                      </span>
                      <span className={doctorPassRules.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {doctorPassRules.hasSpecial ? '✓' : '○'} 1 special character (!@#$)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      id="doctor-agreed"
                      checked={doctorAgreed}
                      onChange={(e) => setDoctorAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="doctor-agreed" className="text-slate-600 text-[11px] leading-tight cursor-pointer">
                      I certify under penalty of perjury that I hold an active, unencumbered medical license to practice medicine in my declared jurisdiction.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? 'Registering...' : 'Register Doctor Profile'}
                  </button>
                </form>
              ) : (
                /* Admin Registration Form */
                <form onSubmit={handleAdminRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-purple-900">
                    <p className="font-bold mb-0.5">Administrator Registration</p>
                    <p className="text-purple-800 text-[11px]">
                      Register administrative personnel to oversee clinical operations and compliance.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Admin Full Name *</label>
                      <input
                        type="text"
                        required
                        value={adminForm.name}
                        onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                        placeholder="Alex Vance"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Email *</label>
                      <input
                        type="email"
                        required
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        placeholder="alex.vance@teledoc.med"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Organization Passcode *
                    </label>
                    <input
                      type="password"
                      required
                      value={adminForm.adminPasscode}
                      onChange={(e) => setAdminForm({ ...adminForm, adminPasscode: e.target.value })}
                      placeholder="Enter organization passcode"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password *</label>
                      <input
                        type="password"
                        required
                        value={adminForm.password}
                        onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Admin Password *</label>
                      <input
                        type="password"
                        required
                        value={adminConfirmPass}
                        onChange={(e) => setAdminConfirmPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Real-Time Password Policy Checklist */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                    <p className="font-bold text-slate-700 mb-1">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <span className={adminPassRules.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {adminPassRules.length ? '✓' : '○'} 8 to 72 characters
                      </span>
                      <span className={adminPassRules.hasUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {adminPassRules.hasUpper ? '✓' : '○'} Uppercase letter (A-Z)
                      </span>
                      <span className={adminPassRules.hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {adminPassRules.hasLower ? '✓' : '○'} Lowercase letter (a-z)
                      </span>
                      <span className={adminPassRules.hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {adminPassRules.hasNumber ? '✓' : '○'} At least 1 number (0-9)
                      </span>
                      <span className={adminPassRules.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                        {adminPassRules.hasSpecial ? '✓' : '○'} 1 special character
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-xs">
                    <input
                      type="checkbox"
                      id="admin-agreed"
                      checked={adminAgreed}
                      onChange={(e) => setAdminAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="admin-agreed" className="text-slate-600 text-[11px] leading-tight cursor-pointer">
                      I confirm that I am authorized administrative personnel handling confidential provider and patient data.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? 'Registering...' : 'Register Administrator'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Password Reset</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Enter your registered account email. If that email is registered with us, instructions to reset your password will be sent.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Account Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@organization.med"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? 'Submitting...' : 'Send Password Reset Link'}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>TeleDoc Healthcare System</span>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
