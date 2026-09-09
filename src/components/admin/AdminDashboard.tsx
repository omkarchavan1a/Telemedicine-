import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DoctorProfile, Appointment } from '../../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Settings,
  ListOrdered,
  Percent,
  Calendar,
  Building,
  RotateCcw,
  Clock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    doctors,
    updateDoctorStatus,
    appointments,
    cancelAppointment,
    updateAppointmentStatus,
    prescriptions,
    auditLogs,
    platformConfig,
    updatePlatformConfig,
    currentTab,
    setCurrentTab,
    setCurrentRole,
    authAdmin,
    updateAdminProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'reports' | 'doctors' | 'disputes' | 'config' | 'audit'
  >(() => {
    if (currentTab === 'admin-doctors') return 'doctors';
    if (currentTab === 'admin-appointments') return 'disputes';
    if (currentTab === 'admin-config') return 'config';
    if (currentTab === 'admin-audit') return 'audit';
    return 'reports';
  });

  React.useEffect(() => {
    if (currentTab === 'admin-doctors') setActiveTab('doctors');
    else if (currentTab === 'admin-appointments') setActiveTab('disputes');
    else if (currentTab === 'admin-config') setActiveTab('config');
    else if (currentTab === 'admin-audit') setActiveTab('audit');
    else if (currentTab === 'admin-analytics') setActiveTab('reports');
  }, [currentTab]);

  const handleTabChange = (tab: 'reports' | 'doctors' | 'disputes' | 'config' | 'audit') => {
    setActiveTab(tab);
    if (tab === 'reports') setCurrentTab('admin-analytics');
    else if (tab === 'doctors') setCurrentTab('admin-doctors');
    else if (tab === 'disputes') setCurrentTab('admin-appointments');
    else if (tab === 'config') setCurrentTab('admin-config');
    else if (tab === 'audit') setCurrentTab('admin-audit');
  };

  // Selected sub-report in Analytics tab
  const [selectedReport, setSelectedReport] = useState<
    'consultations' | 'doctors' | 'revenue' | 'patients' | 'prescriptions' | 'disputes'
  >('consultations');

  // Config form state
  const [cancellationHours, setCancellationHours] = useState(platformConfig.cancellationWindowHours);
  const [commissionPercent, setCommissionPercent] = useState(platformConfig.platformCommissionPercent);
  const [minFee, setMinFee] = useState(platformConfig.minFeeLimit);
  const [maxFee, setMaxFee] = useState(platformConfig.maxFeeLimit);
  const [configSaved, setConfigSaved] = useState(false);
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<'all' | 'pending' | 'approved' | 'suspended'>('all');
  const [approvalNotice, setApprovalNotice] = useState<{ message: string; docName: string } | null>(null);

  // Platform KPIs
  const totalConsultations = appointments.length;
  const completedConsultations = appointments.filter((a) => a.status === 'completed').length;
  const cancelledConsultations = appointments.filter((a) => a.status === 'cancelled').length;
  const activeDoctorsCount = doctors.filter((d) => d.status === 'approved').length;
  const pendingDoctors = doctors.filter((d) => d.status === 'pending');
  const suspendedDoctors = doctors.filter((d) => d.status === 'suspended');

  const grossRevenue = appointments
    .filter((a) => a.paymentStatus === 'paid' || a.status === 'completed')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalRefunds = appointments
    .filter((a) => a.paymentStatus === 'refunded' || a.status === 'cancelled')
    .reduce((sum, a) => sum + a.amount, 0);

  const netPlatformRevenue = Math.round(grossRevenue * (platformConfig.platformCommissionPercent / 100));

  // CSV Exporter helper function
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [configError, setConfigError] = useState('');
  const [showAdminProfileEdit, setShowAdminProfileEdit] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminProfileSaved, setAdminProfileSaved] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError('');
    try {
      updatePlatformConfig({
        cancellationWindowHours: Number(cancellationHours),
        platformCommissionPercent: Number(commissionPercent),
        minFeeLimit: Number(minFee),
        maxFeeLimit: Number(maxFee),
      });
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Configuration save failed.');
      return;
    }
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Authority & Executive Reporting
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Platform Oversight Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Full platform governance, provider credential verifications, dispute resolution, and auditable financial rollups.
            </p>
          </div>

          {/* Pending Applications Badge */}
          {pendingDoctors.length > 0 && (
            <div
              onClick={() => handleTabChange('doctors')}
              className="cursor-pointer bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 rounded-2xl flex items-center gap-3 hover:bg-amber-500/30 transition-colors"
            >
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
              <div className="text-xs">
                <div className="font-bold text-amber-300">
                  {pendingDoctors.length} Onboarding Review{pendingDoctors.length > 1 ? 's' : ''}
                </div>
                <div className="text-slate-400 text-[11px]">Pending medical license audit</div>
              </div>
            </div>
          )}
        </div>

        {/* 5 Top-Level KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Total Consultations</div>
            <div className="text-2xl font-extrabold text-white mt-1">{totalConsultations}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>{completedConsultations} completed</span>
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Gross Platform Volume</div>
            <div className="text-2xl font-extrabold text-white mt-1">${grossRevenue}.00</div>
            <div className="text-[11px] text-slate-400 mt-1">Direct booking fees</div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Platform Net Revenue</div>
            <div className="text-2xl font-extrabold text-purple-300 mt-1">${netPlatformRevenue}.00</div>
            <div className="text-[11px] text-purple-400 mt-1">{platformConfig.platformCommissionPercent}% platform commission</div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Active Practitioners</div>
            <div className="text-2xl font-extrabold text-white mt-1">{activeDoctorsCount}</div>
            <div className="text-[11px] text-blue-400 mt-1">{doctors.length} registered</div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 col-span-2 lg:col-span-1">
            <div className="text-xs text-slate-400 font-medium">Refunds & Disputes</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-1">${totalRefunds}.00</div>
            <div className="text-[11px] text-rose-300 mt-1">{cancelledConsultations} cancelled</div>
          </div>
        </div>
      </div>

      {/* Administrator Profile Card */}
      {authAdmin && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-lg shrink-0">
                {(authAdmin.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                  Signed-in Administrator
                </div>
                <h2 className="text-base font-extrabold text-slate-900 truncate">{authAdmin.name}</h2>
                <p className="text-xs text-slate-500 truncate">{authAdmin.email} · {authAdmin.phone || 'No phone on file'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAdminName(authAdmin.name);
                setAdminPhone(authAdmin.phone);
                setShowAdminProfileEdit(!showAdminProfileEdit);
              }}
              className="px-4 py-2 border border-slate-200 hover:border-purple-400 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-700 bg-slate-50 hover:bg-purple-50/50 transition-colors shrink-0"
            >
              {showAdminProfileEdit ? 'Hide Profile Editor' : 'Edit My Profile'}
            </button>
          </div>

          {showAdminProfileEdit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateAdminProfile({ name: adminName, phone: adminPhone });
                setAdminProfileSaved(true);
                setTimeout(() => {
                  setAdminProfileSaved(false);
                  setShowAdminProfileEdit(false);
                }, 1500);
              }}
              className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors"
                >
                  {adminProfileSaved ? 'Profile Saved!' : 'Save Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Main Admin Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          id="admin-tab-reports"
          onClick={() => handleTabChange('reports')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reports'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics & Reports Suite</span>
        </button>

        <button
          id="admin-tab-doctors"
          onClick={() => handleTabChange('doctors')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'doctors'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Doctor Management & Onboarding</span>
          {pendingDoctors.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingDoctors.length}
            </span>
          )}
        </button>

        <button
          id="admin-tab-disputes"
          onClick={() => handleTabChange('disputes')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'disputes'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>All Appointments & Dispute Authority</span>
        </button>

        <button
          id="admin-tab-config"
          onClick={() => handleTabChange('config')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'config'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Platform Settings</span>
        </button>

        <button
          id="admin-tab-audit"
          onClick={() => handleTabChange('audit')}
          className={`px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: REPORTS SUITE (Module 3 of Admin Module) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Sub-report Selector Pill Row */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'consultations', label: 'Consultation Report' },
                { id: 'doctors', label: 'Doctor Performance & Utilization' },
                { id: 'revenue', label: 'Revenue & Commission' },
                { id: 'patients', label: 'Patient Activity & Retention' },
                { id: 'prescriptions', label: 'Prescription Report' },
                { id: 'disputes', label: 'Dispute & Refund Log' },
              ].map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReport(rep.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedReport === rep.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {rep.label}
                </button>
              ))}
            </div>
          </div>

          {/* Report 1: Consultation Report */}
          {selectedReport === 'consultations' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Platform Consultation Volume & Completion Status
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total consultations: {totalConsultations} · Completed: {completedConsultations} · Cancelled: {cancelledConsultations}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const headers = ['Appointment ID', 'Patient', 'Doctor', 'Date', 'Slot', 'Status', 'Duration Sec', 'Amount'];
                    const rows = appointments.map((a) => [
                      a.id,
                      a.patientName,
                      a.doctorName,
                      a.date,
                      a.timeSlot,
                      a.status,
                      a.callDurationSeconds || 0,
                      `$${a.amount}`,
                    ]);
                    downloadCSV('consultation_report_2026', headers, rows);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Doctor</th>
                      <th className="py-2.5 px-3">Date & Slot</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Call Length</th>
                      <th className="py-2.5 px-3 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-mono font-medium text-slate-500">{a.id}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{a.patientName}</td>
                        <td className="py-3 px-3 text-slate-700">{a.doctorName}</td>
                        <td className="py-3 px-3 text-slate-600">{a.date} · {a.timeSlot}</td>
                        <td className="py-3 px-3 capitalize">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              a.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : a.status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {a.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {a.callDurationSeconds ? `${Math.floor(a.callDurationSeconds / 60)}m ${a.callDurationSeconds % 60}s` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">${a.amount}.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report 2: Doctor Performance & Utilization Report */}
          {selectedReport === 'doctors' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Practitioner Workload, Utilization Rate & Reviews
                  </h3>
                  <p className="text-xs text-slate-500">
                    Booked clinic slots vs offered weekly slots per physician (FR-8.2).
                  </p>
                </div>
                <button
                  onClick={() => {
                    const headers = ['Doctor Name', 'Specialization', 'Rating', 'Reviews', 'Fee', 'Status', 'Calculated Utilization'];
                    const rows = doctors.map((d) => {
                      const docApts = appointments.filter((a) => a.doctorId === d.id);
                      const [startH, startM] = (d.availableHours?.start || '09:00').split(':').map(Number);
                      const [endH, endM] = (d.availableHours?.end || '17:00').split(':').map(Number);
                      const duration = d.slotDurationMinutes || 30;
                      const dailySlots = Math.floor(Math.max(60, (endH * 60 + endM) - (startH * 60 + startM)) / duration);
                      const monthlyCapacity = dailySlots * Math.max(1, d.availableDays.length) * 4;
                      const utilRate = monthlyCapacity > 0 ? Math.min(100, Math.round((docApts.length / monthlyCapacity) * 100)) : 0;
                      return [
                        d.name,
                        d.specialization,
                        d.rating,
                        d.reviewCount,
                        `$${d.consultationFee}`,
                        d.status,
                        `${utilRate}%`,
                      ];
                    });
                    downloadCSV('doctor_performance_report', headers, rows);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3">Doctor</th>
                      <th className="py-2.5 px-3">Specialty</th>
                      <th className="py-2.5 px-3">Rating</th>
                      <th className="py-2.5 px-3">Assigned Visits</th>
                      <th className="py-2.5 px-3">Utilization Rate</th>
                      <th className="py-2.5 px-3">Consult Fee</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctors.map((doc) => {
                      const docApts = appointments.filter((a) => a.doctorId === doc.id);
                      const [startH, startM] = (doc.availableHours?.start || '09:00').split(':').map(Number);
                      const [endH, endM] = (doc.availableHours?.end || '17:00').split(':').map(Number);
                      const duration = doc.slotDurationMinutes || 30;
                      const dailySlots = Math.floor(Math.max(60, (endH * 60 + endM) - (startH * 60 + startM)) / duration);
                      const monthlyCapacity = dailySlots * Math.max(1, doc.availableDays.length) * 4;
                      const utilRate = monthlyCapacity > 0 ? Math.min(100, Math.round((docApts.length / monthlyCapacity) * 100)) : 0;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{doc.name}</div>
                            <div className="text-[10px] text-slate-400">{doc.regNumber}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium">{doc.specialization}</td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-amber-600">{doc.rating} ★</span>{' '}
                            <span className="text-slate-400">({doc.reviewCount})</span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">{docApts.length}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${utilRate}%` }} />
                              </div>
                              <span className="font-semibold text-slate-700">{utilRate}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">${doc.consultationFee}.00</td>
                          <td className="py-3 px-3 capitalize">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                doc.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : doc.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report 3: Revenue & Commission Breakdown */}
          {selectedReport === 'revenue' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Gross Revenue, Platform Cut ({platformConfig.platformCommissionPercent}%), and Net Doctor Payouts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated in real-time across paid transactions.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const headers = ['Transaction ID', 'Doctor', 'Amount', `Platform Cut (${platformConfig.platformCommissionPercent}%)`, 'Doctor Net Payout', 'Status'];
                    const rows = appointments.map((a) => {
                      const cut = Math.round(a.amount * (platformConfig.platformCommissionPercent / 100));
                      return [
                        a.transactionId,
                        a.doctorName,
                        `$${a.amount}`,
                        `$${cut}`,
                        `$${a.amount - cut}`,
                        a.paymentStatus,
                      ];
                    });
                    downloadCSV('revenue_commission_report', headers, rows);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Total Paid Volume</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">${grossRevenue}.00</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <span className="text-xs text-purple-700 font-medium">Platform Commission ({platformConfig.platformCommissionPercent}%)</span>
                  <div className="text-xl font-extrabold text-purple-900 mt-1">${netPlatformRevenue}.00</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-medium">Net Doctor Disbursements</span>
                  <div className="text-xl font-extrabold text-emerald-900 mt-1">${grossRevenue - netPlatformRevenue}.00</div>
                </div>
              </div>
            </div>
          )}

          {/* Report 4: Patient Activity & Retention */}
          {selectedReport === 'patients' && (() => {
            const patientIds = appointments.map((a) => a.patientId);
            const uniquePatientsCount = new Set(patientIds).size;
            const patientCounts: Record<string, number> = {};
            patientIds.forEach((id) => {
              patientCounts[id] = (patientCounts[id] || 0) + 1;
            });
            const repeatPatients = Object.values(patientCounts).filter((c) => c > 1).length;
            const repeatRate = uniquePatientsCount > 0 ? Math.round((repeatPatients / uniquePatientsCount) * 100) : 0;
            const nonCancelled = appointments.filter((a) => a.status !== 'cancelled').length;
            const completionRate = nonCancelled > 0 ? Math.round((completedConsultations / nonCancelled) * 100) : 100;

            const durations = appointments
              .map((a) => a.callDurationSeconds || 0)
              .filter((s) => s > 0);
            const avgSec = durations.length > 0 ? Math.round(durations.reduce((s, v) => s + v, 0) / durations.length) : 0;
            const avgMins = Math.floor(avgSec / 60);
            const avgRemainingSec = avgSec % 60;

            return (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Patient Activity & Retention Metrics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-medium">Repeat Booking Rate</span>
                    <div className="text-2xl font-extrabold text-blue-600 mt-1">{repeatRate}%</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {repeatPatients} of {uniquePatientsCount} patients booked &gt; 1 consultation
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-medium">Avg Completed Call Duration</span>
                    <div className="text-2xl font-extrabold text-slate-900 mt-1">
                      {durations.length > 0 ? `${avgMins}m ${avgRemainingSec}s` : '15m (Est)'}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Calculated across {durations.length} completed telemedicine video sessions
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 font-medium">Consultation Completion Rate</span>
                    <div className="text-2xl font-extrabold text-emerald-600 mt-1">{completionRate}%</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {completedConsultations} completed of {nonCancelled} non-cancelled appointments
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Report 5: Prescription Report */}
          {selectedReport === 'prescriptions' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  Clinical Prescriptions Issued Across Platform ({prescriptions.length})
                </h3>
                <button
                  onClick={() => {
                    const headers = ['Prescription ID', 'Patient', 'Doctor', 'Diagnosis', 'Medications Count', 'Date Issued'];
                    const rows = prescriptions.map((p) => [
                      p.id,
                      p.patientName,
                      p.doctorName,
                      p.diagnosis,
                      p.medications.length,
                      p.issuedAt,
                    ]);
                    downloadCSV('prescriptions_aggregate_report', headers, rows);
                  }}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between font-bold">
                      <span className="font-mono text-slate-800">{rx.id}</span>
                      <span className="text-slate-400 font-normal">{new Date(rx.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Patient:</strong> {rx.patientName} · <strong>Doctor:</strong> {rx.doctorName}
                    </div>
                    <div className="text-slate-800 font-semibold">
                      Diagnosis: {rx.diagnosis}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Medications: {rx.medications.map((m) => m.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report 6: Dispute & Refund Log */}
          {selectedReport === 'disputes' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Dispute & Refund Log (Admin Audit)
              </h3>
              <div className="space-y-3 text-xs">
                {appointments
                  .filter((a) => a.paymentStatus === 'refunded' || a.status === 'cancelled')
                  .map((apt) => (
                    <div key={apt.id} className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-1">
                      <div className="flex justify-between font-bold text-rose-900">
                        <span>Appointment {apt.id}</span>
                        <span>Refunded ${apt.amount}.00</span>
                      </div>
                      <div className="text-slate-600">
                        Patient: {apt.patientName} · Doctor: {apt.doctorName}
                      </div>
                      <p className="text-rose-700 italic">
                        Reason: {apt.cancellationReason || 'Admin manual refund override.'}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOCTOR ONBOARDING & VERIFICATION (Module 2 of Admin Module) */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Clinical Credential Governance
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                Doctor Credential Verification & Onboarding Authority
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mandatory administrative approval: Only approved doctors appear in patient searches, symptom matcher, and booking slots.
              </p>
            </div>

            {/* Quick Stat Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                Total: <span className="font-bold text-slate-900">{doctors.length}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                pendingDoctors.length > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Approval: {pendingDoctors.length}</span>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Live to Patients: {activeDoctorsCount}</span>
              </div>
            </div>
          </div>

          {/* Action Success / Notification Banner */}
          {approvalNotice && (
            <div className="p-4 bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="font-bold">{approvalNotice.message}</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Patients can now discover {approvalNotice.docName} in the doctor directory and book telemedicine appointments.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRole('patient');
                    setCurrentTab('doctors');
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>View in Patient Directory →</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalNotice(null)}
                  className="text-emerald-700 hover:text-emerald-950 px-2 py-1 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Priority Pending Verification Queue Banner */}
          {pendingDoctors.length > 0 && (
            <div className="p-5 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border-2 border-amber-300 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                  <h3 className="text-sm font-extrabold text-amber-950">
                    Pending Credential Verification Queue ({pendingDoctors.length} applicant{pendingDoctors.length > 1 ? 's' : ''})
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-200/90 px-3 py-1 rounded-full border border-amber-300">
                  Hidden from Public Directory Until Approved
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                The practitioners listed below have registered and certified their medical license. Review their credentials and grant approval to immediately publish them to the patient directory:
              </p>

              <div className="space-y-3 pt-1">
                {pendingDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    id={`pending-review-card-${doc.id}`}
                    className="p-4 bg-white rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-300 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-slate-900">{doc.name}</h4>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md">
                            {doc.specialization}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-extrabold uppercase text-[10px] rounded-full border border-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-700" /> Pending Admin Approval
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Medical License Reg: <strong className="font-mono text-slate-900 font-bold">{doc.regNumber}</strong> · Hospital: <span className="font-medium text-slate-800">{doc.hospitalAffiliation}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Qualifications: {doc.qualifications.join(', ')} · {doc.experienceYears} yrs experience · Consultation Fee: ${doc.consultationFee}
                        </div>
                        {doc.bio && (
                          <div className="text-slate-500 italic text-[11px] line-clamp-1">
                            "{doc.bio}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        id={`approve-pending-${doc.id}`}
                        onClick={() => {
                          updateDoctorStatus(doc.id, 'approved');
                          setApprovalNotice({
                            message: `Dr. ${doc.name} approved! Their profile is now live and published to all patients.`,
                            docName: doc.name,
                          });
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs hover:scale-105"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Publish to Patients</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateDoctorStatus(doc.id, 'suspended');
                          setApprovalNotice({
                            message: `Dr. ${doc.name}'s registration application was rejected.`,
                            docName: doc.name,
                          });
                        }}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setDoctorStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  doctorStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Practitioners ({doctors.length})
              </button>
              <button
                type="button"
                onClick={() => setDoctorStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  doctorStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <span>Pending Approvals</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  doctorStatusFilter === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {pendingDoctors.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDoctorStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  doctorStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Approved & Live ({activeDoctorsCount})
              </button>
              <button
                type="button"
                onClick={() => setDoctorStatusFilter('suspended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  doctorStatusFilter === 'suspended'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Suspended ({suspendedDoctors.length})
              </button>
            </div>
          </div>

          {/* List of Doctors */}
          <div className="space-y-4">
            {doctors
              .filter((doc) => {
                if (doctorStatusFilter === 'pending') return doc.status === 'pending';
                if (doctorStatusFilter === 'approved') return doc.status === 'approved';
                if (doctorStatusFilter === 'suspended') return doc.status === 'suspended';
                return true;
              })
              .map((doc) => (
              <div
                key={doc.id}
                id={`admin-doc-${doc.id}`}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  doc.status === 'pending'
                    ? 'bg-amber-50/50 border-amber-300'
                    : doc.status === 'approved'
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={doc.avatar}
                    alt={doc.name}
                    className={`w-14 h-14 rounded-2xl object-cover ring-1 shrink-0 ${
                      doc.status === 'approved' ? 'ring-emerald-200' : 'ring-amber-200'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-slate-900">{doc.name}</h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md">
                        {doc.specialization}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          doc.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {doc.status === 'approved'
                          ? 'Approved (Visible to Patients)'
                          : doc.status === 'pending'
                          ? 'Pending Admin Verification'
                          : 'Suspended (Hidden)'}
                      </span>
                    </div>

                    <div className="text-slate-500">
                      Medical License Reg: <strong className="font-mono text-slate-800">{doc.regNumber}</strong> · {doc.hospitalAffiliation}
                    </div>

                    <div className="text-slate-600">
                      Qualifications: {doc.qualifications.join(', ')} ({doc.experienceYears} yrs experience) · Fee: ${doc.consultationFee}
                    </div>
                  </div>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {doc.status === 'pending' && (
                    <>
                      <button
                        id={`approve-doc-${doc.id}`}
                        onClick={() => {
                          updateDoctorStatus(doc.id, 'approved');
                          setApprovalNotice({
                            message: `Dr. ${doc.name} approved! Their profile is now live and published to all patients.`,
                            docName: doc.name,
                          });
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Activate</span>
                      </button>
                      <button
                        onClick={() => {
                          updateDoctorStatus(doc.id, 'suspended');
                          setApprovalNotice({
                            message: `Dr. ${doc.name}'s application was set to suspended.`,
                            docName: doc.name,
                          });
                        }}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {doc.status === 'approved' && (
                    <button
                      onClick={() => {
                        updateDoctorStatus(doc.id, 'suspended');
                        setApprovalNotice({
                          message: `Dr. ${doc.name} suspended. Profile is now hidden from patient directory.`,
                          docName: doc.name,
                        });
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Suspend Account
                    </button>
                  )}

                  {doc.status === 'suspended' && (
                    <button
                      onClick={() => {
                        updateDoctorStatus(doc.id, 'approved');
                        setApprovalNotice({
                          message: `Dr. ${doc.name} re-instated! Their profile is visible to patients again.`,
                          docName: doc.name,
                        });
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Re-Instate Account
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ALL APPOINTMENTS & DISPUTE AUTHORITY */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Universal Appointment Ledger & Dispute Override
              </h2>
              <p className="text-xs text-slate-500">
                Admin authority to intervene, cancel, or refund disputed appointments.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-200 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{apt.id}</span>
                    <span className="font-semibold text-slate-900">{apt.patientName}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold text-blue-700">{apt.doctorName}</span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-[11px]">
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Slot: {apt.date} at {apt.timeSlot} · Fee: ${apt.amount} · Payment: {apt.paymentStatus} ({apt.transactionId})
                  </div>
                  {apt.cancellationReason && (
                    <p className="text-rose-600 bg-rose-50 p-1.5 rounded-lg inline-block">
                      Cancellation Reason: {apt.cancellationReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {apt.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Enter admin dispute override cancellation reason:');
                        if (reason) {
                          try {
                            cancelAppointment(apt.id, reason, 'admin');
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Cancellation failed.');
                          }
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-xs"
                    >
                      Admin Force Refund
                    </button>
                  )}
                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PLATFORM CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Platform-Wide Parameter Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Controls cancellation refund policies, commission rates, and fee caps.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            {configError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                {configError}
              </div>
            )}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Refund Cancellation Window (Hours Prior)
              </label>
              <input
                type="number"
                min="1"
                max="48"
                value={cancellationHours}
                onChange={(e) => setCancellationHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Patients cancelling at least this many hours before the slot receive automatic 100% refund.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Platform Commission Fee (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Percentage retained by platform on completed consultations (currently {commissionPercent}%).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Minimum Fee Limit ($)
                </label>
                <input
                  type="number"
                  value={minFee}
                  onChange={(e) => setMinFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Maximum Fee Limit ($)
                </label>
                <input
                  type="number"
                  value={maxFee}
                  onChange={(e) => setMaxFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition-colors"
              >
                {configSaved ? 'Parameters Updated!' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: IMMUTABLE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Immutable System Audit Logs
              </h2>
              <p className="text-xs text-slate-500">
                Chronological record of clinical sign-offs, doctor approvals, and administrative overrides.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor</th>
                  <th className="py-2.5 px-3">Event Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {log.actorEmail} ({log.actorRole})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{log.target}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
