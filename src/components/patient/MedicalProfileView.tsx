import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JpgAvatarUploader } from '../common/JpgAvatarUploader';
import {
  User,
  ShieldCheck,
  AlertCircle,
  Pill,
  Heart,
  Phone,
  Save,
  Check,
  Plus,
  X,
  Camera,
  KeyRound,
  Lock,
} from 'lucide-react';

export const MedicalProfileView: React.FC = () => {
  const { patientProfile, updatePatientProfile, openAuthModal } = useApp();

  const [dateOfBirth, setDateOfBirth] = useState(patientProfile.dateOfBirth);
  const [gender, setGender] = useState(patientProfile.gender);
  const [bloodGroup, setBloodGroup] = useState(patientProfile.bloodGroup);
  const [allergies, setAllergies] = useState<string[]>(patientProfile.allergies);
  const [newAllergy, setNewAllergy] = useState('');
  const [chronicConditions, setChronicConditions] = useState<string[]>(patientProfile.chronicConditions);
  const [newCondition, setNewCondition] = useState('');
  const [currentMedications, setCurrentMedications] = useState<string[]>(patientProfile.currentMedications);
  const [newMedication, setNewMedication] = useState('');
  const [pastSurgeries, setPastSurgeries] = useState<string[]>(patientProfile.pastSurgeries);
  const [newSurgery, setNewSurgery] = useState('');
  const [familyHistory, setFamilyHistory] = useState(patientProfile.familyHistory);
  const [emergencyContact, setEmergencyContact] = useState(patientProfile.emergencyContact);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatientProfile({
      dateOfBirth,
      gender,
      bloodGroup,
      allergies,
      chronicConditions,
      currentMedications,
      pastSurgeries,
      familyHistory,
      emergencyContact,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const addTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string,
    setVal: (v: string) => void
  ) => {
    if (val.trim() && !list.includes(val.trim())) {
      setList([...list, val.trim()]);
      setVal('');
    }
  };

  const removeTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={patientProfile.avatar}
                alt={patientProfile.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setShowAvatarEdit(!showAvatarEdit)}
                title="Change display picture (JPG)"
                className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-full shadow-xs transition-transform hover:scale-110"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Patient Intake Record
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">{patientProfile.name}</h1>
              <p className="text-xs text-slate-500">
                {patientProfile.email} · {patientProfile.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAvatarEdit(!showAvatarEdit)}
              className="px-3 py-2 border border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/50 flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showAvatarEdit ? 'Hide DP Uploader' : 'Change DP (JPG)'}</span>
            </button>

            <button
              form="medical-intake-form"
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved Successfully</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Update Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expandable JPG Avatar Uploader */}
        {showAvatarEdit && (
          <div className="pt-4 border-t border-slate-100 mt-2 bg-slate-50/60 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                Upload Patient Display Picture (JPG format only)
              </h4>
              <button
                type="button"
                onClick={() => setShowAvatarEdit(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <JpgAvatarUploader
              currentAvatar={patientProfile.avatar}
              userName={patientProfile.name}
              onAvatarChange={(newAvatar) => {
                updatePatientProfile({ avatar: newAvatar });
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 2500);
              }}
              label="Choose or drop a JPG photo to update your display picture"
            />
          </div>
        )}
      </div>

      {/* Structured Medical Intake Form */}
      <form id="medical-intake-form" onSubmit={handleSave} className="space-y-6">
        {/* Core Demographics & Blood Group */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Basic Demographics & Blood Group
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Biological Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Drug & Environmental Allergies */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Known Allergies (Medications & Environmental)
          </h3>
          <p className="text-xs text-slate-500">
            Doctors will see this flag in bold red during video consultations and prescription issuance.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {allergies.map((allergy, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => removeTag(allergies, setAllergies, idx)}
                  className="hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Add an allergy (e.g. Penicillin, Peanuts, Aspirin)..."
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(allergies, setAllergies, newAllergy, setNewAllergy);
                }
              }}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => addTag(allergies, setAllergies, newAllergy, setNewAllergy)}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Chronic Conditions & Current Medications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chronic Conditions */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Chronic Conditions
            </h3>

            <div className="flex flex-wrap gap-2 pt-1 min-h-[40px]">
              {chronicConditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-full text-xs font-semibold"
                >
                  {cond}
                  <button
                    type="button"
                    onClick={() => removeTag(chronicConditions, setChronicConditions, idx)}
                    className="hover:text-rose-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="e.g. Hypertension, Asthma, Type 2 Diabetes..."
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(chronicConditions, setChronicConditions, newCondition, setNewCondition);
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addTag(chronicConditions, setChronicConditions, newCondition, setNewCondition)}
                className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Current Medications */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              Current Medications
            </h3>

            <div className="flex flex-wrap gap-2 pt-1 min-h-[40px]">
              {currentMedications.map((med, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-semibold"
                >
                  {med}
                  <button
                    type="button"
                    onClick={() => removeTag(currentMedications, setCurrentMedications, idx)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="e.g. Metformin 500mg, Atorvastatin 10mg..."
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(currentMedications, setCurrentMedications, newMedication, setNewMedication);
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addTag(currentMedications, setCurrentMedications, newMedication, setNewMedication)}
                className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Past Surgeries & Family History */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
            Surgical History & Family Background
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Past Surgeries & Hospitalizations
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {pastSurgeries.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeTag(pastSurgeries, setPastSurgeries, idx)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Appendectomy (2018), Knee Arthroscopy (2021)..."
                  value={newSurgery}
                  onChange={(e) => setNewSurgery(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addTag(pastSurgeries, setPastSurgeries, newSurgery, setNewSurgery)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Add Surgery
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Family Medical History
              </label>
              <textarea
                rows={2}
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                placeholder="e.g. Family history of heart disease, diabetes, or cancer..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600" />
            Emergency Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={emergencyContact.name}
                onChange={(e) =>
                  setEmergencyContact({ ...emergencyContact, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Relationship</label>
              <input
                type="text"
                value={emergencyContact.relation}
                onChange={(e) =>
                  setEmergencyContact({ ...emergencyContact, relation: e.target.value })
                }
                placeholder="Spouse, Parent, Sibling"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={emergencyContact.phone}
                onChange={(e) =>
                  setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Account Security & Password Credentials */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Account Security & Password
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your login credentials, verify existing password, and set new passwords securely.
              </p>
            </div>
            <button
              type="button"
              id="patient-reset-password-btn"
              onClick={() => openAuthModal('patient', 'forgot')}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset / Change Password</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="block text-[11px] font-semibold text-slate-500">Registered Account Gmail/Email</span>
              <span className="font-bold text-slate-800 text-sm">{patientProfile.email || 'oomkarchavan@gmail.com'}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-semibold text-slate-500">Password Encryption</span>
                <span className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Bcrypt Hash (Cost 10)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
