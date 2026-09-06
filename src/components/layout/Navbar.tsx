import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Activity,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  Video,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  Calendar,
  FileText,
  Clock,
  Lock,
  LogOut,
  UserPlus,
} from 'lucide-react';

interface NavbarProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = (props) => {
  const {
    currentUser,
    currentRole,
    setCurrentRole,
    appointments,
    setActiveVideoAppointment,
    resetToDefaults,
    currentTab: ctxCurrentTab,
    setCurrentTab: ctxSetCurrentTab,
    authDoctor,
    authAdmin,
    openAuthModal,
    logoutProvider,
  } = useApp();

  const currentTab = props.currentTab ?? ctxCurrentTab;
  const setCurrentTab = props.setCurrentTab ?? ctxSetCurrentTab;

  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Check if there is any active or waiting room appointment
  const waitingOrActiveApt = appointments.find(
    (a) => a.status === 'in_waiting_room' || a.status === 'in_consultation'
  );

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'patient':
        return {
          label: 'Patient Portal',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: UserCheck,
        };
      case 'doctor':
        return {
          label: 'Doctor Console',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Stethoscope,
        };
      case 'admin':
        return {
          label: 'Admin Authority',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: ShieldCheck,
        };
    }
  };

  const currentBadge = getRoleBadge(currentRole);
  const CurrentBadgeIcon = currentBadge.icon;

  return (
    <header className="sticky top-0 z-40 liquid-glass border-b border-white/80 shadow-xs backdrop-blur-xl transition-all">
      {/* Emergency Disclaimer Banner */}
      <div className="bg-amber-50/80 backdrop-blur-xs border-b border-amber-200/60 px-4 py-1 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] sm:text-xs">
            <strong>Telemedicine Notice:</strong> TeleDoc is for routine outpatient teleconsultations. In medical emergencies, immediately dial <strong>911 / 112</strong>.
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              id="brand-logo"
              onClick={() => setCurrentTab('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:shadow-md group-hover:scale-105 transition-all">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
                  Tele<span className="text-blue-600">Doc</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                  Virtual Care
                </span>
              </div>
            </div>

            {/* Live Consultation Notification Pill if any */}
            {waitingOrActiveApt && (
              <button
                id="active-call-quick-pill"
                onClick={() => setActiveVideoAppointment(waitingOrActiveApt)}
                className="hidden md:flex items-center gap-2 px-3 py-1 bg-rose-50/90 text-rose-700 border border-rose-200 rounded-full text-xs font-bold hover:bg-rose-100 transition-all shadow-xs animate-pulse"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <Video className="w-3.5 h-3.5" />
                <span>Call Ready: {waitingOrActiveApt.doctorName}</span>
              </button>
            )}
          </div>

          {/* Bento-Segmented Navigation Links */}
          <nav className="hidden lg:flex items-center bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60 backdrop-blur-md shadow-inner gap-0.5">
            {currentRole === 'patient' && (
              <>
                <button
                  id="nav-patient-doctors"
                  onClick={() => setCurrentTab('doctors')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'doctors'
                      ? 'bg-white text-blue-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Find Doctors
                </button>
                <button
                  id="nav-patient-appointments"
                  onClick={() => setCurrentTab('appointments')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'appointments'
                      ? 'bg-white text-blue-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>My Consultations</span>
                </button>
                <button
                  id="nav-patient-records"
                  onClick={() => setCurrentTab('records')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'records'
                      ? 'bg-white text-blue-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Health Records</span>
                </button>
                <button
                  id="nav-patient-profile"
                  onClick={() => setCurrentTab('profile')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'profile'
                      ? 'bg-white text-blue-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Medical Intake
                </button>
              </>
            )}

            {currentRole === 'doctor' && (
              <>
                <button
                  id="nav-doctor-dashboard"
                  onClick={() => setCurrentTab('doctor-queue')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'doctor-queue'
                      ? 'bg-white text-blue-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Consultation Queue</span>
                </button>
                <button
                  id="nav-doctor-availability"
                  onClick={() => setCurrentTab('doctor-availability')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    currentTab === 'doctor-availability'
                      ? 'bg-white text-blue-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule & Slots</span>
                </button>
                <button
                  id="nav-doctor-analytics"
                  onClick={() => setCurrentTab('doctor-analytics')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'doctor-analytics'
                      ? 'bg-white text-blue-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Performance & Earnings
                </button>
              </>
            )}

            {currentRole === 'admin' && (
              <>
                <button
                  id="nav-admin-dashboard"
                  onClick={() => setCurrentTab('admin-analytics')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'admin-analytics'
                      ? 'bg-white text-purple-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Analytics
                </button>
                <button
                  id="nav-admin-doctors"
                  onClick={() => setCurrentTab('admin-doctors')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'admin-doctors'
                      ? 'bg-white text-purple-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Doctor Approvals
                </button>
                <button
                  id="nav-admin-appointments"
                  onClick={() => setCurrentTab('admin-appointments')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'admin-appointments'
                      ? 'bg-white text-purple-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Bookings & Disputes
                </button>
                <button
                  id="nav-admin-config"
                  onClick={() => setCurrentTab('admin-config')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'admin-config'
                      ? 'bg-white text-purple-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Platform Config
                </button>
                <button
                  id="nav-admin-audit"
                  onClick={() => setCurrentTab('admin-audit')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentTab === 'admin-audit'
                      ? 'bg-white text-purple-700 shadow-xs border border-white/90'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  Audit Logs
                </button>
              </>
            )}
          </nav>

          {/* User Role Switcher & Profile dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Direct Provider Login/Register Button for Patients */}
            {currentRole === 'patient' ? (
              <button
                type="button"
                id="provider-access-nav-btn"
                onClick={() => openAuthModal('doctor', 'login')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-all border border-slate-700/60"
              >
                <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                <span>Provider Portal</span>
              </button>
            ) : (
              <button
                type="button"
                id="provider-logout-nav-btn"
                onClick={logoutProvider}
                title="End provider session and return to patient view"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/80 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}

            {/* Quick Role Switcher Button */}
            <div className="relative">
              <button
                id="role-switcher-btn"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs backdrop-blur-md ${currentBadge.color}`}
              >
                <CurrentBadgeIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{currentBadge.label}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {showRoleMenu && (
                <div
                  id="role-menu-dropdown"
                  className="absolute right-0 mt-2 w-80 liquid-glass rounded-2xl shadow-2xl border border-white/90 py-2 z-50 text-slate-800 backdrop-blur-2xl"
                >
                  <div className="px-4 py-2 border-b border-slate-100/80">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Portal
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Switch between Patient, Doctor, and Administrative views
                    </p>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* Patient Option */}
                    <button
                      id="switch-to-patient"
                      onClick={() => {
                        setCurrentRole('patient');
                        setCurrentTab('doctors');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                        currentRole === 'patient'
                          ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900">Patient Portal</div>
                          <div className="text-[11px] text-slate-500">Open Directory · No Sign In Required</div>
                        </div>
                      </div>
                      {currentRole === 'patient' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </button>

                    {/* Doctor Option */}
                    <button
                      id="switch-to-doctor"
                      onClick={() => {
                        setShowRoleMenu(false);
                        if (authDoctor) {
                          setCurrentRole('doctor');
                          setCurrentTab('doctor-queue');
                        } else {
                          openAuthModal('doctor', 'login');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                        currentRole === 'doctor'
                          ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>Doctor Console</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {authDoctor ? `${authDoctor.name} (Signed In)` : 'Sign In or Register'}
                          </div>
                        </div>
                      </div>
                      {authDoctor ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          Sign In
                        </span>
                      )}
                    </button>

                    {/* Admin Option */}
                    <button
                      id="switch-to-admin"
                      onClick={() => {
                        setShowRoleMenu(false);
                        if (authAdmin) {
                          setCurrentRole('admin');
                          setCurrentTab('admin-analytics');
                        } else {
                          openAuthModal('admin', 'login');
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                        currentRole === 'admin'
                          ? 'bg-purple-50 text-purple-800 font-semibold border border-purple-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>Admin Authority</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {authAdmin ? `${authAdmin.name} (Signed In)` : 'Sign In or Register'}
                          </div>
                        </div>
                      </div>
                      {authAdmin ? (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md">
                          Sign In
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Registration Shortcuts Footer in Dropdown */}
                  <div className="px-3 pt-2 pb-1 border-t border-slate-100 bg-slate-50/50 mt-1">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">New Provider Registration:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        id="dropdown-register-doc"
                        onClick={() => {
                          setShowRoleMenu(false);
                          openAuthModal('doctor', 'register');
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-200 hover:border-blue-500 rounded-lg text-[11px] font-semibold text-blue-700 text-center transition-colors shadow-2xs"
                      >
                        + Register Doctor
                      </button>
                      <button
                        type="button"
                        id="dropdown-register-admin"
                        onClick={() => {
                          setShowRoleMenu(false);
                          openAuthModal('admin', 'register');
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-200 hover:border-purple-500 rounded-lg text-[11px] font-semibold text-purple-700 text-center transition-colors shadow-2xs"
                      >
                        + Register Admin
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200/80">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-2xs"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">{currentUser.role}</div>
              </div>
            </div>

            {/* Reset Demo Data Pill */}
            <button
              id="reset-demo-btn"
              onClick={() => {
                if (window.confirm('Reset all demo appointments, records, and mock data to initial defaults?')) {
                  resetToDefaults();
                }
              }}
              title="Reset application to clean initial seed data"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-slate-100 text-xs no-scrollbar">
          {currentRole === 'patient' && (
            <>
              <button
                onClick={() => setCurrentTab('doctors')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'doctors' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Find Doctors
              </button>
              <button
                onClick={() => setCurrentTab('appointments')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'appointments' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                My Consultations
              </button>
              <button
                onClick={() => setCurrentTab('records')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'records' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Health Records
              </button>
              <button
                onClick={() => setCurrentTab('profile')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Medical Profile
              </button>
            </>
          )}

          {currentRole === 'doctor' && (
            <>
              <button
                onClick={() => setCurrentTab('doctor-queue')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'doctor-queue' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Queue
              </button>
              <button
                onClick={() => setCurrentTab('doctor-availability')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'doctor-availability' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Schedule & Slots
              </button>
              <button
                onClick={() => setCurrentTab('doctor-analytics')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'doctor-analytics' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Earnings
              </button>
            </>
          )}

          {currentRole === 'admin' && (
            <>
              <button
                onClick={() => setCurrentTab('admin-analytics')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'admin-analytics' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setCurrentTab('admin-doctors')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'admin-doctors' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Approvals
              </button>
              <button
                onClick={() => setCurrentTab('admin-appointments')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'admin-appointments' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Disputes
              </button>
              <button
                onClick={() => setCurrentTab('admin-config')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'admin-config' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Config
              </button>
              <button
                onClick={() => setCurrentTab('admin-audit')}
                className={`px-3 py-1 rounded-lg shrink-0 ${
                  currentTab === 'admin-audit' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Audit
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
