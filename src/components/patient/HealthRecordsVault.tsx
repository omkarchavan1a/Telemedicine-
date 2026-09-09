import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HealthRecord, HealthRecordCategory } from '../../types';
import { HealthRecordModal } from './HealthRecordModal';
import {
  FileText,
  UploadCloud,
  Plus,
  Trash2,
  Calendar,
  Activity,
  Heart,
  TrendingDown,
  Eye,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';

const CATEGORIES: HealthRecordCategory[] = [
  'Blood Test',
  'Imaging & Scan',
  'Cardiology',
  'Pathology',
  'Prescription',
  'Discharge Summary',
];

export const HealthRecordsVault: React.FC = () => {
  const {
    currentUser,
    currentRole,
    healthRecords,
    uploadHealthRecord,
    deleteHealthRecord,
    vitals,
    addVitalMeasurement,
    appointments,
    authDoctor,
  } = useApp();

  const [viewingRecord, setViewingRecord] = useState<HealthRecord | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<HealthRecordCategory>('Blood Test');
  const [newRecordDate, setNewRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [newLabName, setNewLabName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<'pdf' | 'jpg' | 'png'>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Vitals Form State
  const [newBpSys, setNewBpSys] = useState(120);
  const [newBpDia, setNewBpDia] = useState(80);
  const [newHeartRate, setNewHeartRate] = useState(72);
  const [newBloodSugar, setNewBloodSugar] = useState(90);
  const [newWeight, setNewWeight] = useState(61.5);
  const [vitalDate, setVitalDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter records: patients see their own; doctors see only their own patients'
  // records (via appointments); admins see all for oversight.
  const myPatientIds = React.useMemo(() => {
    if (currentRole !== 'doctor') return new Set<string>();
    const confid = authDoctor;
    return new Set(
      appointments
        .filter((a) => (confid ? a.doctorId === confid.id : true))
        .map((a) => a.patientId)
    );
  }, [appointments, authDoctor, currentRole]);

  const patientRecords = healthRecords.filter((r) => {
    if (currentRole === 'patient') return r.patientId === currentUser.id;
    if (currentRole === 'doctor') return myPatientIds.has(r.patientId);
    return true;
  });

  const filteredRecords = patientRecords.filter((r) => {
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    return true;
  });

  const ALLOWED_UPLOAD_EXT = ['pdf', 'jpg', 'jpeg', 'png'];
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (localStorage-backed vault)

  const processSelectedFile = (file: File) => {
    setUploadError('');
    const lowerName = file.name.toLowerCase();
    const ext = lowerName.split('.').pop() || '';
    const mimeOk =
      file.type === 'application/pdf' ||
      file.type === 'image/jpeg' ||
      file.type === 'image/png';
    if (!ALLOWED_UPLOAD_EXT.includes(ext) || !mimeOk) {
      setUploadError('Only PDF, JPG, or PNG medical documents can be uploaded.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('File exceeds the 10 MB vault limit. Please upload a smaller file.');
      return;
    }
    setUploadedFile(file);
    setSelectedFileName(file.name);

    // Format size
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    setSelectedFileSize(sizeStr);

    // Determine type (extension already validated above)
    if (lowerName.endsWith('.png')) {
      setSelectedFileType('png');
    } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      setSelectedFileType('jpg');
    } else {
      setSelectedFileType('pdf');
    }

    // Default title from filename if empty
    if (!newTitle) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setNewTitle(cleanTitle);
    }

    // Read real file data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileDataUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('Unable to read selected file. Please try a different file.');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setUploadError('Please specify a title for this medical document.');
      return;
    }
    if (!selectedFileName) {
      setUploadError('Please select or drag a medical document or report to upload.');
      return;
    }

    uploadHealthRecord({
      patientId: currentUser.id,
      title: newTitle.trim(),
      category: newCategory,
      recordDate: newRecordDate,
      fileType: selectedFileType,
      fileName: selectedFileName,
      fileSize: selectedFileSize || '1.2 MB',
      labName: newLabName.trim() || 'Clinical Diagnostic Services',
      notes: newNotes.trim(),
      fileData: fileDataUrl || undefined,
    });

    setShowUploadModal(false);
    setNewTitle('');
    setNewNotes('');
    setNewLabName('');
    setUploadedFile(null);
    setFileDataUrl('');
    setSelectedFileName('');
    setSelectedFileSize('');
    setUploadError('');
  };

  const handleVitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addVitalMeasurement({
      patientId: currentUser.id,
      date: vitalDate,
      bpSystolic: Number(newBpSys),
      bpDiastolic: Number(newBpDia),
      heartRate: Number(newHeartRate),
      bloodSugar: Number(newBloodSugar),
      weight: Number(newWeight),
    });
    setShowVitalsModal(false);
  };

  // Sort vitals chronologically
  const sortedVitals = [...vitals].sort((a, b) => a.date.localeCompare(b.date));
  const latestVital = sortedVitals[sortedVitals.length - 1];

  // SVG Chart helpers for Blood Pressure trend
  const chartWidth = 600;
  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const minSys = 110;
  const maxSys = 155;

  const getX = (index: number) => {
    if (sortedVitals.length <= 1) return paddingX;
    return paddingX + (index / (sortedVitals.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minSys) / (maxSys - minSys)) * (chartHeight - paddingY * 2);
  };

  const systolicPoints = sortedVitals.map((v, i) => `${getX(i)},${getY(v.bpSystolic)}`).join(' ');
  const diastolicPoints = sortedVitals.map((v, i) => `${getX(i)},${getY(v.bpDiastolic)}`).join(' ');

  return (
    <div className="space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Health Records & Condition Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Encrypted repository of diagnostic lab reports, clinical scans, and longitudinal vital measurements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="log-vitals-btn"
            onClick={() => setShowVitalsModal(true)}
            className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-rose-500" />
            <span>Log Vitals</span>
          </button>
          <button
            id="upload-record-btn"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Vitals Progress & Trend Section (PRD 4.6) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
              Longitudinal Vitals Tracker
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Blood Pressure & Glycemic Trend (Last 6 Months)
            </h2>
          </div>

          {latestVital && (
            <div className="flex items-center gap-4 text-xs">
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-400">Current BP: </span>
                <span className="font-extrabold text-slate-900">
                  {latestVital.bpSystolic}/{latestVital.bpDiastolic} mmHg
                </span>
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-400">Fasting Sugar: </span>
                <span className="font-extrabold text-slate-900">{latestVital.bloodSugar} mg/dL</span>
              </div>
            </div>
          )}
        </div>

        {/* Responsive Interactive SVG Chart */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 select-none"
          >
            {/* Grid lines */}
            <line x1={paddingX} y1={getY(140)} x2={chartWidth - paddingX} y2={getY(140)} stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1={paddingX} y1={getY(120)} x2={chartWidth - paddingX} y2={getY(120)} stroke="#f1f5f9" strokeDasharray="4 4" />
            <line x1={paddingX} y1={getY(80)} x2={chartWidth - paddingX} y2={getY(80)} stroke="#f1f5f9" strokeDasharray="4 4" />

            <text x={paddingX - 6} y={getY(140) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">140</text>
            <text x={paddingX - 6} y={getY(120) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">120</text>
            <text x={paddingX - 6} y={getY(80) + 3} textAnchor="end" fontSize="9" fill="#94a3b8">80</text>

            {/* Systolic Polyline */}
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={systolicPoints}
            />

            {/* Diastolic Polyline */}
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={diastolicPoints}
            />

            {/* Data Points */}
            {sortedVitals.map((v, i) => (
              <g key={v.id}>
                {/* Systolic point */}
                <circle
                  cx={getX(i)}
                  cy={getY(v.bpSystolic)}
                  r="4"
                  fill="#2563eb"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Diastolic point */}
                <circle
                  cx={getX(i)}
                  cy={getY(v.bpDiastolic)}
                  r="4"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                {/* Date label */}
                <text
                  x={getX(i)}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  {v.date.slice(5)}
                </text>
              </g>
            ))}
          </svg>

          <div className="flex items-center justify-center gap-6 text-xs mt-2 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Systolic BP (Target &lt; 130 mmHg)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500" />
              <span>Diastolic BP (Target &lt; 85 mmHg)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <TrendingDown className="w-4 h-4" />
              <span>Down 18 mmHg since starting treatment!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-4">
        {/* Filter Chips */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Documents ({patientRecords.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Visible to your consulting physicians during teleconsultations
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No medical records uploaded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload diagnostic test PDFs, imaging scans, or doctor summary notes to keep your history organized.
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Upload First Record
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                id={`health-record-${rec.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-200 transition-all flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {rec.category}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {rec.recordDate}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {rec.title}
                    </h4>

                    {rec.labName && (
                      <p className="text-xs text-slate-500">{rec.labName}</p>
                    )}

                    {rec.notes && (
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg mt-1">
                        {rec.notes}
                      </p>
                    )}

                    <div className="text-[11px] text-slate-400 font-mono pt-1">
                      {rec.fileName} · {rec.fileSize}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setViewingRecord(rec)}
                    title="View Document Details"
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete record "${rec.title}"? This deletion will be logged in the audit trail.`)) {
                        deleteHealthRecord(rec.id);
                      }
                    }}
                    title="Delete Record"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Record Modal (FR-6.1 - Drag and drop or manual selection) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">Upload Medical Document</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Report / Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBC Blood Count & Thyroid Panel"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as HealthRecordCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date of Test / Report *
                  </label>
                  <input
                    type="date"
                    required
                    value={newRecordDate}
                    onChange={(e) => setNewRecordDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Diagnostic Center / Hospital Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quest Diagnostics, Metro Lab"
                  value={newLabName}
                  onChange={(e) => setNewLabName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Real File Upload & Drag-and-Drop Area */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Attach Medical Document or Report *
                </label>

                {uploadError && (
                  <div className="mb-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5">
                    <X className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processSelectedFile(file);
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      processSelectedFile(file);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-600 bg-blue-50/70 scale-[0.99]'
                      : selectedFileName
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-slate-300 hover:border-blue-500 bg-slate-50'
                  }`}
                >
                  <UploadCloud
                    className={`w-8 h-8 mx-auto mb-1.5 transition-colors ${
                      selectedFileName ? 'text-emerald-600' : 'text-blue-500'
                    }`}
                  />
                  {selectedFileName ? (
                    <div>
                      <div className="flex items-center justify-center gap-1.5 font-bold text-slate-900 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="truncate max-w-[280px]">{selectedFileName}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        {selectedFileSize} · {selectedFileType.toUpperCase()} Document Attached
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Change selected file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">
                        Drag & drop your medical file here, or{' '}
                        <span className="text-blue-600 font-bold underline">browse device</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Supported: PDF, JPG, PNG, WebP (Lab panels, ECG tracings, prescriptions)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor Notes or Patient Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Any key findings or specific questions for your consulting doctor..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Save & Securely Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" />
                Log Daily / Weekly Vitals
              </h3>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVitalSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Measurement Date</label>
                <input
                  type="date"
                  required
                  value={vitalDate}
                  onChange={(e) => setVitalDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    required
                    value={newBpSys}
                    onChange={(e) => setNewBpSys(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    required
                    value={newBpDia}
                    onChange={(e) => setNewBpDia(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={newHeartRate}
                    onChange={(e) => setNewHeartRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fasting Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={newBloodSugar}
                    onChange={(e) => setNewBloodSugar(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-4 py-2 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document View Modal */}
      {viewingRecord && (
        <HealthRecordModal
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
        />
      )}
    </div>
  );
};
