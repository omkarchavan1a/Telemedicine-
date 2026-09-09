import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorRegistrationInput, AdminRegistrationInput, PatientRegistrationInput } from '../../types';
import { JpgAvatarUploader } from '../common/JpgAvatarUploader';
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
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  Clock,
  Key,
  RefreshCw,
  Check,
  Sparkles,
  Copy,
  Inbox,
  Send,
  ExternalLink,
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
    patientRegister,
    requestPasswordReset,
    resetPasswordWithOldPassword,
    doctors,
    currentUser,
    patientProfile,
    setCurrentRole,
    setCurrentTab,
  } = useApp();

  // Active state within modal
  const [activeRole, setActiveRole] = useState<'patient' | 'doctor' | 'admin'>(authModalRole);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Synchronize when modal opens with new defaults
  React.useEffect(() => {
    setActiveRole(authModalRole);
    setActiveTab(authModalTab === 'register' ? 'register' : authModalTab === 'forgot' ? 'forgot' : 'login');
    setError(null);
    setSuccessMsg(null);
    setRequiresCaptcha(false);
    setCaptchaVerified(false);
    setLockRemaining(0);
    // Pre-fill email if available (favoring user Gmail)
    if (!resetEmail) {
      setResetEmail(currentUser?.email || patientProfile?.email || 'oomkarchavan@gmail.com');
    }
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

  // Password reset state (Gmail/Email + Old Password + New Password)
  const [resetEmail, setResetEmail] = useState('');
  const [resetOldPassword, setResetOldPassword] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetOldPassword, setShowResetOldPassword] = useState(false);
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetMode, setResetMode] = useState<'with_old_password' | 'email_link'>('with_old_password');
  const [gmailDeliveryResult, setGmailDeliveryResult] = useState<{
    tempPassword: string;
    resetToken: string;
    dispatchedTo: string;
    deliveryTime: string;
  } | null>(null);
  const [copiedTempPass, setCopiedTempPass] = useState(false);

  // Doctor Registration state
  const [doctorForm, setDoctorForm] = useState<DoctorRegistrationInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    avatar: '',
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

  // Patient Registration state
  const [patientForm, setPatientForm] = useState<PatientRegistrationInput>({
    name: '',
    email: '',
    password: '',
    phone: '',
    avatar: '',
    dateOfBirth: '1995-06-15',
    gender: 'Female',
    bloodGroup: 'O+',
  });
  const [patientConfirmPass, setPatientConfirmPass] = useState('');

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

    if (activeRole === 'patient') {
      setLoading(true);
      setCurrentRole('patient');
      setCurrentTab('doctors');
      setLoading(false);
      closeAuthModal();
      return;
    }

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
        avatar: doctorForm.avatar,
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
        setSuccessMsg('Registration submitted! Your profile is pending administrative approval and will appear to patients once approved by Platform Administration.');
      }
    } catch {
      setLoading(false);
      setError('Registration could not be completed. Please verify your details.');
    }
  };

  const handlePatientRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (patientForm.password && patientConfirmPass && patientForm.password !== patientConfirmPass) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    setLoading(true);
    try {
      const res = await patientRegister(patientForm);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Patient registration failed. Please review your entries.');
      } else {
        setSuccessMsg('Patient profile created successfully! Display picture saved.');
        setTimeout(() => {
          closeAuthModal();
        }, 1200);
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred during patient registration.');
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
    setSuccessMsg(null);
    setGmailDeliveryResult(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your Gmail or registered account email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      setLoading(false);

      if (!res.success) {
        setError(res.message || 'Unable to dispatch password to Gmail.');
      } else {
        setSuccessMsg(res.message);
        if (res.tempPassword && res.dispatchedTo) {
          setGmailDeliveryResult({
            tempPassword: res.tempPassword,
            resetToken: res.resetToken || 'RST-9821-TOKEN',
            dispatchedTo: res.dispatchedTo,
            deliveryTime: res.deliveryTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred while sending password to Gmail.');
    }
  };

  const handleCopyTempPassword = (pass: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(pass);
      setCopiedTempPass(true);
      setTimeout(() => setCopiedTempPass(false), 3000);
    }
  };

  const computePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score++;
    if (score === 0) return { score: 10, label: 'Very Weak', color: 'bg-slate-300', text: 'text-slate-500' };
    if (score === 1) return { score: 25, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-600' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-600' };
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500', text: 'text-blue-600' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const resetPassRules = computePasswordRules(resetNewPassword);
  const resetPassStrength = computePasswordStrength(resetNewPassword);

  const handleResetWithOldPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your registered Gmail or email address.');
      return;
    }

    if (!resetOldPassword) {
      setError('Please enter your current/old password.');
      return;
    }

    if (!resetNewPassword) {
      setError('Please enter your new password.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setError('New passwords do not match. Please verify both password entries.');
      return;
    }

    if (resetOldPassword === resetNewPassword) {
      setError('New password must be different from your current old password.');
      return;
    }

    if (
      !resetPassRules.length ||
      !resetPassRules.hasUpper ||
      !resetPassRules.hasLower ||
      !resetPassRules.hasNumber ||
      !resetPassRules.hasSpecial
    ) {
      setError(
        'New password must meet all complexity requirements (8+ characters, uppercase, lowercase, number, and special character).'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordWithOldPassword(cleanEmail, resetOldPassword, resetNewPassword);
      setLoading(false);

      if (!res.success) {
        setError(res.error || 'Password reset failed. Please verify your old password.');
      } else {
        setSuccessMsg(res.message || 'Password reset successfully! Your new password has been set and is now active.');
        setLoginEmail(cleanEmail);
        setLoginPassword(resetNewPassword);
        setResetOldPassword('');
        setResetNewPassword('');
        setResetConfirmPassword('');
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred while resetting password.');
    }
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
            activeRole === 'patient'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-900'
              : activeRole === 'doctor'
              ? 'bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900'
              : 'bg-gradient-to-r from-purple-800 via-purple-900 to-slate-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                {activeRole === 'patient' ? (
                  <User className="w-5 h-5 text-emerald-200" />
                ) : activeRole === 'doctor' ? (
                  <Stethoscope className="w-5 h-5 text-blue-200" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-purple-200" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {activeRole === 'patient'
                    ? 'Patient Account & Profile'
                    : activeRole === 'doctor'
                    ? 'Healthcare Provider Portal'
                    : 'Administrative Console'}
                </h3>
                <p className="text-xs text-white/80">
                  {activeRole === 'patient'
                    ? 'Register with your JPG photo to book doctors & access health records'
                    : activeRole === 'doctor'
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

          {/* Role Switcher Pill - 3 Roles: Patient, Doctor, Platform Admin */}
          <div className="mt-5 grid grid-cols-3 p-1 bg-black/20 rounded-2xl border border-white/15 gap-1">
            <button
              type="button"
              id="auth-role-select-patient"
              onClick={() => {
                setActiveRole('patient');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === 'patient'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient</span>
            </button>

            <button
              type="button"
              id="auth-role-select-doctor"
              onClick={() => {
                setActiveRole('doctor');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === 'doctor'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor</span>
            </button>

            <button
              type="button"
              id="auth-role-select-admin"
              onClick={() => {
                setActiveRole('admin');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeRole === 'admin'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Informational Sub-Banner */}
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <p>
            {activeRole === 'patient'
              ? 'Patients can register with a JPG display picture and view verified doctor credentials.'
              : activeRole === 'doctor'
              ? 'Doctors can upload an official JPG headshot during registration for verified patient trust.'
              : 'Administrative login requires strict multi-tier credential verification.'}
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
                ? activeRole === 'patient'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : activeRole === 'doctor'
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
                ? activeRole === 'patient'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : activeRole === 'doctor'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>
              Register {activeRole === 'patient' ? 'Patient' : activeRole === 'doctor' ? 'Doctor' : 'Admin'}
            </span>
          </button>

          <button
            type="button"
            id="auth-tab-forgot"
            onClick={() => {
              setActiveTab('forgot');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-3 px-4 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'forgot'
                ? activeRole === 'patient'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-bold'
                  : activeRole === 'doctor'
                  ? 'border-blue-600 text-blue-700 bg-white font-bold'
                  : 'border-purple-600 text-purple-700 bg-white font-bold'
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
              {activeRole === 'patient' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-900">
                    <div className="flex items-center gap-3">
                      {patientProfile?.avatar ? (
                        <img
                          src={patientProfile.avatar}
                          alt="Patient"
                          className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-base">
                          {patientProfile?.name ? patientProfile.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-emerald-950">
                          {patientProfile?.name ? `Welcome back, ${patientProfile.name}` : 'Welcome, Patient'}
                        </p>
                        <p className="text-emerald-700 text-xs mt-0.5">
                          {patientProfile?.email || 'Access consultations, appointments, and prescriptions'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Patient Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          id="auth-patient-login-email"
                          value={loginEmail || patientProfile?.email || ''}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="e.g. sarah.jenkins@example.com"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="auth-patient-login-password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
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

                    <button
                      type="submit"
                      id="auth-patient-continue-btn"
                      className="w-full py-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Continue to Patient Portal</span>
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="text-xs text-emerald-700 font-semibold hover:underline"
                      >
                        New patient? Register with your JPG picture →
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
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
              )}
            </div>
          )}

          {/* TAB 2: REGISTRATION */}
          {activeTab === 'register' && (
            <div>
              {activeRole === 'patient' ? (
                <form onSubmit={handlePatientRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs text-emerald-900">
                    <p className="font-bold mb-0.5">Patient Account Registration</p>
                    <p className="text-emerald-800 text-[11px]">
                      Create your patient profile and upload your JPG display picture to consult verified doctors and access digital records.
                    </p>
                  </div>

                  {/* Patient JPG Avatar Upload */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Patient Display Picture (JPG)
                    </label>
                    <JpgAvatarUploader
                      currentAvatar={patientForm.avatar}
                      userName={patientForm.name || 'Patient'}
                      onAvatarChange={(avatarUrl) => setPatientForm((prev) => ({ ...prev, avatar: avatarUrl }))}
                      label="Upload Patient Profile Picture (JPG only)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          id="auth-patient-name"
                          value={patientForm.name}
                          onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                          placeholder="e.g. Sarah Jenkins"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          id="auth-patient-email"
                          value={patientForm.email}
                          onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                          placeholder="sarah.jenkins@example.com"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={patientForm.phone || ''}
                        onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                        placeholder="+1 (555) 234-5678"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={patientForm.dateOfBirth || ''}
                        onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                      <select
                        value={patientForm.bloodGroup || 'O+'}
                        onChange={(e) => setPatientForm({ ...patientForm, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                      >
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Create Password (Optional)</label>
                      <input
                        type="password"
                        value={patientForm.password || ''}
                        onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                        placeholder="At least 6 characters..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                      <input
                        type="password"
                        value={patientConfirmPass}
                        onChange={(e) => setPatientConfirmPass(e.target.value)}
                        placeholder="Repeat password..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="auth-patient-register-btn"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{loading ? 'Registering Patient...' : 'Complete Patient Registration'}</span>
                  </button>
                </form>
              ) : activeRole === 'doctor' ? (
                <form onSubmit={handleDoctorRegisterSubmit} className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-900">
                    <p className="font-bold mb-0.5">Doctor Onboarding Registration</p>
                    <p className="text-blue-800 text-[11px]">
                      Complete registration to submit provider credentials and join the telemedicine clinical network.
                    </p>
                  </div>

                  {/* Doctor JPG Avatar Upload */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Doctor Profile Picture (JPG)
                    </label>
                    <JpgAvatarUploader
                      currentAvatar={doctorForm.avatar}
                      userName={doctorForm.name || 'Doctor'}
                      onAvatarChange={(avatarUrl) => setDoctorForm((prev) => ({ ...prev, avatar: avatarUrl }))}
                      label="Upload Official Doctor Headshot (JPG only)"
                    />
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

                  <div className="p-3 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <strong className="font-semibold text-amber-950">Mandatory Admin Verification:</strong> Upon registration, your profile is submitted to Platform Administration with <span className="font-semibold text-amber-950">"pending"</span> status. Once approved by the administrator, your profile and consultation slots will become visible to all patients.
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting Application...' : 'Submit Profile for Admin Approval'}
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

          {/* TAB 3: RESET & SET NEW PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-2xl text-xs text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-extrabold text-blue-900">Reset & Set New Password</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Reset your password by providing your registered Gmail or email, verifying your current old password, and setting your new secure password.
                </p>

                {/* Reset Mode Toggle Pills */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-blue-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode('with_old_password');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                      resetMode === 'with_old_password'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Reset with Old Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetMode('email_link');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                      resetMode === 'email_link'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>Forgot Old Password? Email Link</span>
                  </button>
                </div>
              </div>

              {resetMode === 'with_old_password' ? (
                <div>
                  {/* Quick Demo Autofill Chips */}
                  <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Quick Test Accounts (Autofill Email & Old Pass)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail('dr.mehta@teledoc.med');
                          setResetOldPassword('Doctor@2026!');
                          setError(null);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>🩺 Dr. Mehta</span>
                        <span className="text-[10px] text-slate-400">(Doctor@2026!)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail('admin@teledoc.med');
                          setResetOldPassword('Admin@2026!');
                          setError(null);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-slate-200 hover:border-purple-300 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>🛡️ Admin</span>
                        <span className="text-[10px] text-slate-400">(Admin@2026!)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail('anjali.sharma@example.com');
                          setResetOldPassword('Patient@2026!');
                          setError(null);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>👤 Patient Anjali</span>
                        <span className="text-[10px] text-slate-400">(Patient@2026!)</span>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleResetWithOldPasswordSubmit} className="space-y-4">
                    {/* 1. Gmail / Account Email */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Gmail / Registered Account Email
                        </label>
                        <span className="text-[10px] text-slate-500">Google Gmail or Organization Email</span>
                      </div>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          id="reset-password-email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="e.g. oomkarchavan@gmail.com or name@organization.med"
                          className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-colors"
                        />
                      </div>
                    </div>

                    {/* 2. Old / Current Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current / Old Password
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showResetOldPassword ? 'text' : 'password'}
                          id="reset-password-old"
                          required
                          value={resetOldPassword}
                          onChange={(e) => setResetOldPassword(e.target.value)}
                          placeholder="Enter your existing old password"
                          className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetOldPassword(!showResetOldPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showResetOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 3. New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          New Password Set
                        </label>
                        {resetNewPassword && (
                          <span className={`text-[10px] font-bold ${resetPassStrength.text}`}>
                            Strength: {resetPassStrength.label}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showResetNewPassword ? 'text' : 'password'}
                          id="reset-password-new"
                          required
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="Create strong new password"
                          className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Password Strength Meter Bar */}
                      {resetNewPassword && (
                        <div className="mt-1.5 space-y-1.5">
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${resetPassStrength.color}`}
                              style={{ width: `${resetPassStrength.score}%` }}
                            />
                          </div>

                          {/* Rule checklist */}
                          <div className="grid grid-cols-2 gap-1 text-[10px]">
                            <span
                              className={`flex items-center gap-1 ${
                                resetPassRules.length ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> 8–72 characters
                            </span>
                            <span
                              className={`flex items-center gap-1 ${
                                resetPassRules.hasUpper ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Uppercase letter (A-Z)
                            </span>
                            <span
                              className={`flex items-center gap-1 ${
                                resetPassRules.hasLower ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Lowercase letter (a-z)
                            </span>
                            <span
                              className={`flex items-center gap-1 ${
                                resetPassRules.hasNumber && resetPassRules.hasSpecial
                                  ? 'text-emerald-700 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" /> Number & symbol (@, #, !)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Confirm New Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Confirm New Password
                        </label>
                        {resetConfirmPassword && (
                          <span
                            className={`text-[10px] font-bold ${
                              resetNewPassword === resetConfirmPassword ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {resetNewPassword === resetConfirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showResetConfirmPassword ? 'text' : 'password'}
                          id="reset-password-confirm"
                          required
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password to confirm"
                          className={`w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white text-slate-800 transition-colors ${
                            resetConfirmPassword && resetNewPassword !== resetConfirmPassword
                              ? 'border-rose-300 focus:ring-rose-500'
                              : 'border-slate-200 focus:ring-blue-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      id="reset-password-submit-btn"
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying & Setting New Password...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Set New Password & Update Account</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Post-Success Sign In action */}
                  {successMsg && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Ready to sign in with your new password?</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        Sign In Now →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* GMAIL PASSWORD & RESET LINK DELIVERY */
                <div className="space-y-4">
                  {/* Informational Context */}
                  <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-[10px]">
                      G
                    </div>
                    <div>
                      <p className="font-bold text-red-900 mb-0.5">
                        Send Password Directly to Your Gmail Inbox
                      </p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Forgot your old password? Enter your Gmail address below. We will immediately generate a temporary recovery password and dispatch it directly to your Gmail inbox with a 1-click password update link.
                      </p>
                    </div>
                  </div>

                  {/* If email has NOT been dispatched yet or user wants to send to another email */}
                  {!gmailDeliveryResult ? (
                    <div className="space-y-3">
                      <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Your Gmail or Registered Account Email
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="email"
                              id="reset-gmail-input"
                              required
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="e.g. oomkarchavan@gmail.com"
                              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:bg-white text-slate-800 font-medium transition-colors"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            We will send a temporary password and 1-click reset access to this address.
                          </span>
                        </div>

                        <button
                          type="submit"
                          id="send-gmail-password-btn"
                          disabled={loading}
                          className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Dispatching Password to Gmail...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send Password & Reset Link to Gmail</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* LIVE GMAIL INBOX MESSAGE SIMULATION */
                    <div className="space-y-3">
                      {/* Gmail Delivery Header Alert */}
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs flex items-center justify-between text-emerald-800 font-medium">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Password successfully dispatched to your Gmail: <strong className="underline">{gmailDeliveryResult.dispatchedTo}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                          Delivered {gmailDeliveryResult.deliveryTime}
                        </span>
                      </div>

                      {/* Google Gmail Inbox Card Preview */}
                      <div className="bg-white border-2 border-red-200/90 rounded-2xl shadow-md overflow-hidden text-xs">
                        {/* Gmail Card Top Bar */}
                        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center font-black text-xs text-white">
                              M
                            </div>
                            <span className="font-bold text-xs tracking-tight">Gmail • Incoming TeleDoc Security Message</span>
                          </div>
                          <a
                            href="https://mail.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                          >
                            <span>Open Gmail</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Email Details Header */}
                        <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-900 text-sm">
                              Your TeleDoc Password Reset & Temporary Credentials
                            </span>
                            <span className="text-[10px] text-slate-500">{gmailDeliveryResult.deliveryTime}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3">
                            <span><strong>From:</strong> TeleDoc Security &lt;security@teledoc.med&gt;</span>
                            <span><strong>To:</strong> {gmailDeliveryResult.dispatchedTo}</span>
                          </div>
                        </div>

                        {/* Email Content Body */}
                        <div className="p-4 space-y-3.5 bg-white">
                          <p className="text-slate-700 text-xs leading-relaxed">
                            Hello, we received a request to access your TeleDoc account without your old password. A secure temporary password has been automatically generated and is now active for your account:
                          </p>

                          {/* Temporary Password Highlight Box */}
                          <div className="p-3.5 bg-gradient-to-r from-red-50 via-slate-50 to-amber-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 block">
                                Temporary Password (Active on Account)
                              </span>
                              <span className="font-mono text-base font-black text-slate-900 tracking-wider select-all">
                                {gmailDeliveryResult.tempPassword}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Valid for immediate sign-in or to set a new password.
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopyTempPassword(gmailDeliveryResult.tempPassword)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer ${
                                copiedTempPass
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
                              }`}
                            >
                              {copiedTempPass ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Password</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Action Buttons inside Gmail card */}
                          <div className="pt-1 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 block">
                              What would you like to do next?
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* 1. Set New Password (automatically pre-fills old pass with temp password!) */}
                              <button
                                type="button"
                                id="apply-gmail-temp-pass-btn"
                                onClick={() => {
                                  setResetMode('with_old_password');
                                  setResetEmail(gmailDeliveryResult.dispatchedTo);
                                  setResetOldPassword(gmailDeliveryResult.tempPassword);
                                  setResetNewPassword('');
                                  setResetConfirmPassword('');
                                  setError(null);
                                  setSuccessMsg(
                                    `Temporary password from your Gmail (${gmailDeliveryResult.dispatchedTo}) has been filled as your Current Password. Now enter your desired new password below!`
                                  );
                                }}
                                className="py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Set My Own New Password →</span>
                              </button>

                              {/* 2. Direct Sign In */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('login');
                                  setLoginEmail(gmailDeliveryResult.dispatchedTo);
                                  setLoginPassword(gmailDeliveryResult.tempPassword);
                                  setError(null);
                                  setSuccessMsg(
                                    `Credentials filled! Click "Sign In" to access your account with the password sent to your Gmail.`
                                  );
                                }}
                                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Sign In With This Password</span>
                              </button>
                            </div>
                          </div>

                          {/* Security Footer Details */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>Audit Security Token: {gmailDeliveryResult.resetToken}</span>
                            <span>Bcrypt encrypted • HIPAA/GDPR compliant</span>
                          </div>
                        </div>
                      </div>

                      {/* Option to send another or change email */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setGmailDeliveryResult(null);
                            setError(null);
                            setSuccessMsg(null);
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                        >
                          Send to a different Gmail address
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const res = await requestPasswordReset(gmailDeliveryResult.dispatchedTo);
                            if (res.success && res.tempPassword) {
                              setGmailDeliveryResult({
                                tempPassword: res.tempPassword,
                                resetToken: res.resetToken || '',
                                dispatchedTo: gmailDeliveryResult.dispatchedTo,
                                deliveryTime: res.deliveryTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              });
                              setSuccessMsg('A new temporary password has been dispatched to your Gmail!');
                            }
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Generate & Send Another Password</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Back */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  ← Back to Sign In
                </button>
                <span className="text-[11px] text-slate-400">
                  Protected with salted Bcrypt cryptography
                </span>
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
