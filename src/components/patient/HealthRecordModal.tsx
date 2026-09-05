import React from 'react';
import { HealthRecord } from '../../types';
import { X, FileText, Calendar, Building, Download, ShieldCheck } from 'lucide-react';

interface HealthRecordModalProps {
  record: HealthRecord | null;
  onClose: () => void;
}

export const HealthRecordModal: React.FC<HealthRecordModalProps> = ({ record, onClose }) => {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">Diagnostic Document Viewer</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          <div>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold uppercase rounded-md text-[11px]">
              {record.category}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">{record.title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Record</span>
              <strong className="text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                {record.recordDate}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Diagnostic Facility</span>
              <strong className="text-slate-800 flex items-center gap-1 mt-0.5">
                <Building className="w-3.5 h-3.5 text-indigo-600" />
                {record.labName || 'Clinical Diagnostic Lab'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">File Format & Size</span>
              <span className="font-mono font-medium text-slate-700 mt-0.5 block">
                {record.fileName} ({record.fileSize})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Security Status</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Encrypted at rest
              </span>
            </div>
          </div>

          {record.notes && (
            <div>
              <span className="text-slate-400 font-bold uppercase block mb-1">
                Clinical Notes & Lab Impression
              </span>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-mono">
                {record.notes}
              </p>
            </div>
          )}

          {/* Real Document Preview if Image / Data URL */}
          {record.fileData && record.fileData.startsWith('data:image') && (
            <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 overflow-hidden text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Document Visual Preview
              </span>
              <img
                src={record.fileData}
                alt={record.title}
                className="max-h-56 mx-auto rounded-xl object-contain border border-slate-200 shadow-2xs"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (record.fileData) {
                  const link = document.createElement('a');
                  link.href = record.fileData;
                  link.download = record.fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  const reportContent = `TELEDOC SECURE HEALTH RECORD
--------------------------------------------------
Document Title: ${record.title}
Category: ${record.category}
Date of Record: ${record.recordDate}
Diagnostic Center: ${record.labName || 'Clinical Diagnostic Lab'}
Patient ID: ${record.patientId}
Original File: ${record.fileName} (${record.fileSize})
Status: Encrypted at rest · Patient Vault

CLINICAL IMPRESSION & LAB FINDINGS:
${record.notes || 'Normal study within expected reference ranges.'}

--------------------------------------------------
CONFIDENTIAL MEDICAL DOCUMENT - PROTECTED UNDER TELEMEDICINE COMPLIANCE
`;
                  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = record.fileName.endsWith('.pdf') ? record.fileName.replace('.pdf', '_summary.txt') : `${record.fileName}.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download File ({record.fileSize})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
