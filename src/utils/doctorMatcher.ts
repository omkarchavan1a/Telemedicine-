import { DoctorProfile, PatientIntakeData, DoctorRecommendationMatch } from '../types';

export interface SymptomOption {
  id: string;
  label: string;
  category: string;
  suggestedSpecialty: 'Cardiology' | 'Pediatrics' | 'Dermatology' | 'General Medicine' | 'Neurology' | 'Orthopedics' | 'Psychiatry';
  isRedFlag?: boolean;
}

export const COMMON_SYMPTOM_OPTIONS: SymptomOption[] = [
  {
    id: 'chest_pain',
    label: 'Chest Pain / Palpitations / Shortness of Breath',
    category: 'Cardiovascular',
    suggestedSpecialty: 'Cardiology',
    isRedFlag: true,
  },
  {
    id: 'high_bp',
    label: 'High Blood Pressure / Hypertension Check',
    category: 'Cardiovascular',
    suggestedSpecialty: 'Cardiology',
  },
  {
    id: 'pediatric_fever',
    label: 'Child High Fever / Pediatric Cold & Cough (< 16 yrs)',
    category: 'Pediatric',
    suggestedSpecialty: 'Pediatrics',
  },
  {
    id: 'pediatric_growth',
    label: 'Child Development / Nutrition / Vaccination',
    category: 'Pediatric',
    suggestedSpecialty: 'Pediatrics',
  },
  {
    id: 'skin_rash',
    label: 'Skin Rash / Itching / Eczema / Hives',
    category: 'Dermatology',
    suggestedSpecialty: 'Dermatology',
  },
  {
    id: 'acne_hairloss',
    label: 'Acne / Psoriasis / Hair Fall / Mole Examination',
    category: 'Dermatology',
    suggestedSpecialty: 'Dermatology',
  },
  {
    id: 'migraine_headache',
    label: 'Severe Throbbing Headache / Migraine / Aura',
    category: 'Neurological',
    suggestedSpecialty: 'Neurology',
  },
  {
    id: 'dizziness_numbness',
    label: 'Dizziness / Vertigo / Tingling or Numbness',
    category: 'Neurological',
    suggestedSpecialty: 'Neurology',
  },
  {
    id: 'joint_knee_pain',
    label: 'Knee / Hip / Shoulder Joint Pain or Stiffness',
    category: 'Orthopedic',
    suggestedSpecialty: 'Orthopedics',
  },
  {
    id: 'back_spine_pain',
    label: 'Lower Back Ache / Sciatica / Posture Strain',
    category: 'Orthopedic',
    suggestedSpecialty: 'Orthopedics',
  },
  {
    id: 'anxiety_stress',
    label: 'Anxiety / Panic Symptoms / Work Stress / Burnout',
    category: 'Mental Health',
    suggestedSpecialty: 'Psychiatry',
  },
  {
    id: 'depression_insomnia',
    label: 'Persistent Low Mood / Sleep Disturbance / Insomnia',
    category: 'Mental Health',
    suggestedSpecialty: 'Psychiatry',
  },
  {
    id: 'viral_flu_fever',
    label: 'Seasonal Flu / Viral Fever / Sore Throat / Fatigue',
    category: 'General',
    suggestedSpecialty: 'General Medicine',
  },
  {
    id: 'stomach_acidity',
    label: 'Acid Reflux / Indigestion / Abdominal Cramps',
    category: 'General',
    suggestedSpecialty: 'General Medicine',
  },
  {
    id: 'diabetes_routine',
    label: 'Type 2 Diabetes Review / Routine Blood Panel Consult',
    category: 'General',
    suggestedSpecialty: 'General Medicine',
  },
];

/**
 * Checks if the symptoms selected or described contain high-urgency red flags
 */
export function checkRedFlagEmergency(intake: PatientIntakeData): { isEmergency: boolean; warning?: string } {
  const hasChestPain = intake.selectedSymptomTags.includes('chest_pain');
  const text = (intake.primaryConcern + ' ' + intake.symptomsDescription).toLowerCase();
  const emergencyKeywords = ['crushing chest', 'cannot breathe', 'severe chest', 'stroke', 'unconscious', 'paralysis', 'chest pain'];

  const matchedKeyword = emergencyKeywords.find((k) => text.includes(k));
  if (intake.severity === 'Acute / Severe' && (hasChestPain || matchedKeyword)) {
    return {
      isEmergency: true,
      warning:
        'Red Flag Clinical Warning: Acute chest distress or sudden respiratory difficulty requires immediate emergency care. Please dial 911 / 112 or visit your nearest emergency emergency room right away.',
    };
  }

  return { isEmergency: false };
}

/**
 * Matches approved doctors based on patient intake details
 */
export function matchDoctorsToPatient(
  intake: PatientIntakeData,
  doctors: DoctorProfile[]
): DoctorRecommendationMatch[] {
  const approvedDoctors = doctors.filter((d) => d.status === 'approved');
  if (approvedDoctors.length === 0) return [];

  // Determine target primary specialties from selected symptom tags
  const matchedSpecialties = new Set<string>();
  COMMON_SYMPTOM_OPTIONS.forEach((opt) => {
    if (intake.selectedSymptomTags.includes(opt.id)) {
      matchedSpecialties.add(opt.suggestedSpecialty);
    }
  });

  // Age-specific logic
  const isChild = intake.age > 0 && intake.age < 16;
  if (isChild) {
    matchedSpecialties.add('Pediatrics');
  }

  // Keywords from user's entered concern & description
  const queryWords = `${intake.primaryConcern} ${intake.symptomsDescription} ${intake.existingConditions.join(' ')}`
    .toLowerCase()
    .split(/[\s,.-]+/)
    .filter((w) => w.length > 3);

  // Score each doctor
  const scored = approvedDoctors.map((doc) => {
    let score = 50; // baseline
    const reasons: string[] = [];

    // 1. Specialty matching (Heavy Weight: up to 40 pts)
    if (isChild && doc.specialization === 'Pediatrics') {
      score += 38;
      reasons.push(`Top Pediatric Specialist: Highly recommended for child patients (Age ${intake.age}).`);
    } else if (matchedSpecialties.has(doc.specialization)) {
      score += 35;
      reasons.push(`Direct Specialty Match: Board-certified in ${doc.specialization} for your reported symptoms.`);
    } else if (doc.specialization === 'General Medicine') {
      // General Medicine is a versatile fallback
      score += 20;
      reasons.push('General Physician: Experienced with multi-system symptoms and triage care.');
    } else if (isChild && doc.specialization !== 'Pediatrics') {
      score -= 15;
    }

    // 2. Keyword relevance in bio, hospital, qualifications (Up to 15 pts)
    const docText = `${doc.bio} ${doc.hospitalAffiliation} ${doc.qualifications.join(' ')} ${doc.specialization}`.toLowerCase();
    let keywordHits = 0;
    queryWords.forEach((word) => {
      if (docText.includes(word)) {
        keywordHits++;
      }
    });
    if (keywordHits > 0) {
      const bonus = Math.min(keywordHits * 3, 15);
      score += bonus;
      reasons.push(`Clinical Context Match: Physician profile aligns with your described symptoms.`);
    }

    // 3. Patient Priority Preference
    if (intake.priorityPreference === 'budget_friendly') {
      if (doc.consultationFee <= 75) {
        score += 15;
        reasons.push(`Budget-Friendly: Competitive consultation fee of $${doc.consultationFee}.`);
      } else if (doc.consultationFee > 100) {
        score -= 8;
      }
    } else if (intake.priorityPreference === 'best_clinical_match') {
      if (doc.rating >= 4.9) {
        score += 12;
        reasons.push(`Exemplary Patient Rating: ${doc.rating} ★ (${doc.reviewCount} reviews).`);
      }
      if (doc.experienceYears >= 10) {
        score += 8;
        reasons.push(`Senior Practitioner: ${doc.experienceYears}+ years of clinical hospital practice.`);
      }
    } else if (intake.priorityPreference === 'earliest_slot') {
      // Bonus if doctor has available days upcoming
      score += 10;
      reasons.push('Quick Consult: Available for early scheduling this week.');
    }

    // Quality baseline
    score += (doc.rating - 4.0) * 10; // e.g. 4.9 -> +9 pts
    score += Math.min(doc.experienceYears, 15) * 0.5; // up to +7.5 pts

    // Clamp score between 60 and 99
    const clampedScore = Math.min(99, Math.max(60, Math.round(score)));

    // Categorize match level
    let matchLevel: DoctorRecommendationMatch['matchLevel'] = 'Recommended';
    if (clampedScore >= 92) {
      matchLevel = 'Optimal Match';
    } else if (clampedScore >= 80) {
      matchLevel = 'High Match';
    }

    return {
      doctor: doc,
      matchScore: clampedScore,
      matchLevel,
      recommendedSpecialty: doc.specialization,
      reasons: reasons.slice(0, 3), // top 3 most relevant reasons
      isTopRecommendation: false,
    };
  });

  // Sort descending by matchScore, then rating
  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.doctor.rating - a.doctor.rating;
  });

  if (scored.length > 0) {
    scored[0].isTopRecommendation = true;
  }

  return scored;
}
