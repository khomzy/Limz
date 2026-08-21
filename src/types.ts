export type LimsStatus = 'Pending Sample' | 'Sample Received' | 'Testing' | 'Completed';
export type TestType = 'TB' | 'HIV' | 'Haematology' | 'Chemistry';
export type LimsDepartment = 'Molecular' | 'Haematology' | 'Chemistry';
export type UserRole = 'lab' | 'clinician' | 'tb' | 'hiv';

export interface UserSession {
  email: string;
  role: UserRole;
  name: string;
  facility: string;
  facilityId: string;
  userId?: string;
}

// ─── TB Types ────────────────────────────────────────────────────────────────

export interface TbPatientDetails {
  fullName: string;
  age: number;
  gender: 'Male' | 'Female';
  villageStreet: string;
  district: string;
  telephone: string;
  reasonForExamination: 'Diagnosis' | 'Follow up';
  followUpMonths?: '2 months' | '5 months' | '6 months';
  districtTbRegNo?: string;
  hivStatus: 'Positive' | 'Negative' | 'Unknown/Not tested';
  tbTreatmentHistory: 'New' | 'Previously treated';
  sourceOfReferral: 'OPD' | 'In patients/Wards' | 'community' | 'PPMx site' | 'TB clinic' | 'Under five' | 'Other';
  sourceOfReferralOther?: string;
}

export interface TbRequestDetails {
  examinations: {
    microscopy: boolean;
    slitSkinSmear: boolean;
    xpertUltra: boolean;
    trunat: boolean;
    urineLam: boolean;
    reflexTestingXdr: boolean;
    other: boolean;
  };
  otherTestSpecify?: string;
  indicationsXpertUltra?: {
    presumptiveDrTb: boolean;
    hospitalized: boolean;
    hivPositive: boolean;
    children: boolean;
    prisoner: boolean;
    minorXminer: boolean;
    other: boolean;
    otherSpecify?: string;
  };
  indicationsUrineLam?: {
    cd4LessThan200: boolean;
    ahdStage4: boolean;
    criticallyIll: boolean;
    other: boolean;
    otherSpecify?: string;
  };
}

export interface TbSampleDetails {
  sampleType: 'Sputum' | 'Stool' | 'Other';
  sampleTypeOther?: string;
  dateCollected: string;
  timeCollected: string;
  recollectionDueToRejection: boolean;
  requestorName: string;
  requestorPhone: string;
  dateRequested: string;
  clinicianName?: string;
  clinicianPhone?: string;
  notifyClinicianSms?: boolean;
}

export interface TbResults {
  labSerialNumber: string;
  dateReceived: string;
  macroscopicExamination: 'Muco-purulent' | 'Blood-stained' | 'Saliva' | 'Other';
  macroscopicOther?: string;
  microscopyDate?: string;
  microscopySamples: Array<{
    sampleNum: 1 | 2;
    result: 'Negative' | 'Positive' | 'Not Done';
    grading?: '3+' | '2+' | '1+' | 'Actual number';
    actualNumber?: number;
    slitSkinSmearResult?: string;
    examinedBy: string;
  }>;
  geneXpertDate?: string;
  geneXpertType?: 'Xpert Ultra' | 'Truenat';
  geneXpertResult?: 'MTB not detected' | 'MTB detected' | 'MTB detected Trace' | 'RIF resistant not detected' | 'RIF resistant detected' | 'RIF resistant indeterminate/Trace' | 'No result' | 'Error' | 'Invalid';
  geneXpertPerformedBy?: string;
  reflexDate?: string;
  reflexResults?: Array<{
    drug: 'Isoniazid' | 'Ethionamide' | 'Moxifloxacin' | 'Levofloxacin';
    result: 'Resistant' | 'Susceptible' | 'Not Done';
    performedBy: string;
  }>;
  urineLamDate?: string;
  urineLamResult?: 'Negative' | 'Positive' | 'Not Done';
  urineLamPerformedBy?: string;
  comment?: string;
  reviewedBy: string;
  reviewedDate: string;
}

// ─── HIV Types ────────────────────────────────────────────────────────────────

export interface HivPatientDetails {
  surname: string;
  firstName: string;
  patientId: string;
  dateOfBirth: string;
  genderPregBf: 'Male' | 'Female Non-Preg/Bf' | 'Female Pregnant' | 'Female Breastfeeding';
  phone: string;
}

export interface HivRequestDetails {
  testType: 'EID' | 'Viral Load';
  eidReason?: 'EID initial' | 'Confirmatory DNA-PCR' | 'Confirmatory rapid test' | 'Tie-breaker';
  viralLoadReason?: 'Routine' | 'Targeted' | 'Follow-up after high VL' | 'Repeat';
  motherSurname?: string;
  motherFirstName?: string;
  uniqueChildId?: string;
}

export interface HivSampleDetails {
  dateDrawn: string;
  timeDrawn?: string;
  dateSeparated?: string;
  timeSeparated?: string;
  artInitiationDate?: string;
  sampleType: 'DBS' | 'Plasma';
  currentArtRegimen?: string;
  collectorSurname: string;
  collectorFirstName: string;
  collectorPhone: string;
  htcProviderId: string;
  clinicianName?: string;
  clinicianPhone?: string;
  notifyClinicianSms?: boolean;
}

export interface HivResults {
  labSerialNumber: string;
  dateReceived: string;
  dateProcessed: string;
  eidDnaPcrResult?: 'Positive' | 'Negative' | 'Inconclusive';
  viralLoadValueType?: 'Undetectable' | 'Numerical';
  viralLoadCopies?: number;
  viralLoadLogValue?: number;
  performedBy: string;
  comment?: string;
}

// ─── Haematology Types ────────────────────────────────────────────────────────

export interface HaematologyPatientDetails {
  fullName: string;
  age: number;
  gender: 'Male' | 'Female';
  dateOfBirth?: string;
  telephone: string;
  ward?: string;
}

export interface HaematologyRequestDetails {
  tests: {
    fbc: boolean;
    thinBloodSmear: boolean;
    mrdt: boolean;
    other: boolean;
  };
  otherTestSpecify?: string;
  clinicalNotes?: string;
}

export interface HaematologySampleDetails {
  sampleType: 'EDTA Whole Blood' | 'Capillary Blood' | 'Other';
  dateCollected: string;
  timeCollected: string;
  clinicianName?: string;
  clinicianPhone?: string;
  notifyClinicianSms?: boolean;
}

export interface HaematologyResults {
  labSerialNumber: string;
  dateReceived: string;
  performedBy: string;
  // FBC results
  fbc?: {
    wbc?: number;          // ×10⁹/L
    rbc?: number;          // ×10¹²/L
    haemoglobin?: number;  // g/dL
    haematocrit?: number;  // %
    mcv?: number;          // fL
    mch?: number;          // pg
    mchc?: number;         // g/dL
    platelets?: number;    // ×10⁹/L
    neutrophils?: number;  // %
    lymphocytes?: number;  // %
    interpretation?: string;
  };
  // Malaria results
  malariaSmear?: 'Negative' | 'P. falciparum' | 'P. vivax' | 'P. malariae' | 'P. ovale' | 'Mixed';
  malariaParasitaemia?: string;
  mrdtResult?: 'Negative' | 'Positive' | 'Invalid';
  mrdtAntigen?: 'HRP2 (P. falciparum)' | 'pLDH (Pan)';
  comment?: string;
  reviewedBy?: string;
}

// ─── Chemistry Types ──────────────────────────────────────────────────────────

export interface ChemistryPatientDetails {
  fullName: string;
  age: number;
  gender: 'Male' | 'Female';
  dateOfBirth?: string;
  telephone: string;
  ward?: string;
  fastingStatus?: 'Fasting' | 'Non-Fasting' | 'Unknown';
}

export interface ChemistryRequestDetails {
  tests: {
    kft: boolean;          // Kidney Function Test
    lft: boolean;          // Liver Function Test
    lipidProfile: boolean;
    hpylori: boolean;
    other: boolean;
  };
  otherTestSpecify?: string;
  clinicalNotes?: string;
}

export interface ChemistrySampleDetails {
  sampleType: 'Serum' | 'Plasma' | 'Whole Blood' | 'Stool' | 'Other';
  dateCollected: string;
  timeCollected: string;
  clinicianName?: string;
  clinicianPhone?: string;
  notifyClinicianSms?: boolean;
}

export interface ChemistryResults {
  labSerialNumber: string;
  dateReceived: string;
  performedBy: string;
  // Kidney Function Test
  kft?: {
    urea?: number;         // mmol/L
    creatinine?: number;   // µmol/L
    egfr?: number;         // mL/min/1.73m²
    sodiumNa?: number;     // mmol/L
    potassiumK?: number;   // mmol/L
    chloride?: number;     // mmol/L
  };
  // Liver Function Test
  lft?: {
    alt?: number;          // U/L
    ast?: number;          // U/L
    alp?: number;          // U/L
    ggt?: number;          // U/L
    totalBilirubin?: number;  // µmol/L
    directBilirubin?: number; // µmol/L
    totalProtein?: number;    // g/L
    albumin?: number;         // g/L
  };
  // Lipid Profile
  lipids?: {
    totalCholesterol?: number; // mmol/L
    ldl?: number;              // mmol/L
    hdl?: number;              // mmol/L
    triglycerides?: number;    // mmol/L
  };
  // H. pylori
  hpylori?: {
    method: 'Rapid Antigen (Stool)' | 'Serology (IgG)';
    result: 'Positive' | 'Negative' | 'Invalid';
  };
  comment?: string;
  reviewedBy?: string;
}

// ─── Request Union Types ──────────────────────────────────────────────────────

interface BaseLimsRequest {
  id: string;
  status: LimsStatus;
  department: LimsDepartment;
  clinician_email: string;
  patient_name: string;
  patient_id?: string;
  patient_phone?: string;
  facility?: string;
  facility_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  results_uploaded_at?: string;
  results_uploaded_by?: string;
}

export interface TbLimsRequest extends BaseLimsRequest {
  type: 'TB';
  sub_type: string;
  department: 'Molecular';
  patient_details: TbPatientDetails;
  request_details: TbRequestDetails;
  sample_details: TbSampleDetails;
  results: TbResults | Record<string, never>;
}

export interface HivLimsRequest extends BaseLimsRequest {
  type: 'HIV';
  sub_type: string;
  department: 'Molecular';
  patient_details: HivPatientDetails;
  request_details: HivRequestDetails;
  sample_details: HivSampleDetails;
  results: HivResults | Record<string, never>;
}

export interface HaematologyLimsRequest extends BaseLimsRequest {
  type: 'Haematology';
  sub_type: string;
  department: 'Haematology';
  patient_details: HaematologyPatientDetails;
  request_details: HaematologyRequestDetails;
  sample_details: HaematologySampleDetails;
  results: HaematologyResults | Record<string, never>;
}

export interface ChemistryLimsRequest extends BaseLimsRequest {
  type: 'Chemistry';
  sub_type: string;
  department: 'Chemistry';
  patient_details: ChemistryPatientDetails;
  request_details: ChemistryRequestDetails;
  sample_details: ChemistrySampleDetails;
  results: ChemistryResults | Record<string, never>;
}

export type LimsRequest = TbLimsRequest | HivLimsRequest | HaematologyLimsRequest | ChemistryLimsRequest;
