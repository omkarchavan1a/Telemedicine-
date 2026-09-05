import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  Users,
  Star,
  CheckCircle2,
  Calendar,
  Percent,
  Activity,
} from 'lucide-react';

export const DoctorAnalytics: React.FC = () => {
  const { appointments, currentUser, doctors, authDoctor, platformConfig } = useApp();

  const doc =
    authDoctor ||
    doctors.find(
      (d) =>
        d.id === currentUser.id ||
        d.email.toLowerCase() === currentUser.email.toLowerCase() ||
        d.name.toLowerCase().includes(currentUser.name.toLowerCase().split(',')[0])
    ) ||
    doctors[0];

  const docAppointments = useMemo(() => {
    return appointments.filter(
      (a) =>
        a.doctorId === doc.id ||
        a.doctorName.toLowerCase().includes(doc.name.toLowerCase().split(',')[0])
    );
  }, [appointments, doc]);

  const completed = docAppointments.filter((a) => a.status === 'completed');
  const grossRevenue = docAppointments
    .filter((a) => a.status === 'completed' || a.status === 'scheduled')
    .reduce((sum, a) => sum + a.amount, 0);

  const platformFee = Math.round(grossRevenue * (platformConfig.platformCommissionPercent / 100));
  const netEarnings = grossRevenue - platformFee;

  // Calculate real utilization based on doctor's schedule
  const utilizationRate = useMemo(() => {
    const [startH, startM] = (doc.availableHours?.start || '09:00').split(':').map(Number);
    const [endH, endM] = (doc.availableHours?.end || '17:00').split(':').map(Number);
    const duration = doc.slotDurationMinutes || 30;
    const dailyMinutes = Math.max(60, endH * 60 + endM - (startH * 60 + startM));
    const slotsPerDay = Math.floor(dailyMinutes / duration);
    const weeklySlots = slotsPerDay * Math.max(1, doc.availableDays.length);
    const monthlyCapacity = weeklySlots * 4;
    if (monthlyCapacity === 0) return 0;
    return Math.min(100, Math.round((docAppointments.length / monthlyCapacity) * 100));
  }, [doc, docAppointments]);

  // Compute real monthly trends by analyzing actual appointment dates
  const monthlyData = useMemo(() => {
    // Build last 6 calendar months
    const months: { [key: string]: { label: string; consultations: number; earnings: number } } = {};
    const now = new Date();
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const fullFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = {
        label: fullFormatter.format(d),
        consultations: 0,
        earnings: 0,
      };
    }

    docAppointments.forEach((a) => {
      if (a.status === 'cancelled') return;
      const key = a.date.slice(0, 7); // 'YYYY-MM'
      if (months[key]) {
        months[key].consultations += 1;
        months[key].earnings += Math.round(a.amount * (1 - platformConfig.platformCommissionPercent / 100));
      }
    });

    return Object.values(months);
  }, [docAppointments, platformConfig.platformCommissionPercent]);

  const maxVal = Math.max(5, ...monthlyData.map((d) => d.consultations));

  // Unique patients seen
  const uniquePatients = new Set(docAppointments.map((a) => a.patientId)).size;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Practitioner Performance & Earnings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Live practice analytics for {doc.name} ({doc.specialization} · {doc.hospitalAffiliation}).
        </p>

        {/* 3 Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Net Doctor Earnings (Disbursed)</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
              ${netEarnings.toLocaleString()}.00
            </div>
            <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Calculated net after {platformConfig.platformCommissionPercent}% platform fee</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Doctor Utilization Rate</div>
            <div className="text-2xl font-extrabold text-blue-600 mt-0.5">
              {utilizationRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {docAppointments.length} bookings against {doc.availableDays.length} clinic days/wk
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Aggregate Rating</div>
            <div className="text-2xl font-extrabold text-amber-500 mt-0.5 flex items-center gap-1">
              <span>{doc.rating.toFixed(1)}</span>
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{doc.reviewCount} verified patient ratings</div>
          </div>
        </div>
      </div>

      {/* Monthly Consultation Volume Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Monthly Consultation Volume & Net Doctor Payout
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {uniquePatients} Total Unique Patients Consulted
          </span>
        </div>

        <div className="grid grid-cols-6 gap-3 pt-4 items-end h-52 border-b border-slate-100 pb-4">
          {monthlyData.map((d) => {
            const heightPercent = d.consultations > 0 ? Math.max(12, (d.consultations / maxVal) * 100) : 4;
            return (
              <div key={d.label} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[11px] font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  ${d.earnings}
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[44px] rounded-t-xl transition-all shadow-xs ${
                    d.consultations > 0
                      ? 'bg-blue-600 group-hover:bg-blue-700'
                      : 'bg-slate-200 group-hover:bg-slate-300'
                  }`}
                />
                <span className="text-[11px] text-slate-600 font-semibold text-center whitespace-nowrap">
                  {d.label.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {d.consultations} calls
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
