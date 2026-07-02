export type LimsStatus = 'Pending Sample' | 'Sample Received' | 'Testing' | 'Completed';
export type TestType = 'TB' | 'HIV';
export type UserRole = 'lab' | 'clinician' | 'tb';

export interface UserSession {
  email: string;
  role: UserRole;
  name: string;
  facility: string;
}

// TB Patient Details Form fields (Image 1)
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

// HIV Patient Details Form fields (Image 2)
export interface HivPatientDetails {
  surname: string;
  firstName: string;
  patientId: string; // e.g. ART Number
  dateOfBirth: string;
  genderPregBf: 'Male' | 'Female Non-Preg/Bf' | 'Female Pregnant' | 'Female Breastfeeding';
  phone: string;
}

// TB Request details (Image 1)
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

// HIV Request details (Image 2)
export interface HivRequestDetails {
  testType: 'EID' | 'Viral Load';
  eidReason?: 'EID initial' | 'Confirmatory DNA-PCR' | 'Confirmatory rapid test' | 'Tie-breaker';
  viralLoadReason?: 'Routine' | 'Targeted' | 'Follow-up after high VL' | 'Repeat';
  motherSurname?: string;
  motherFirstName?: string;
  uniqueChildId?: string;
}

// TB Sample Details (Image 1)
export interface TbSampleDetails {
  sampleType: 'Sputum' | 'Stool' | 'Other';
  sampleTypeOther?: string;
  dateCollected: string;
  timeCollected: string;
  recollectionDueToRejection: boolean;
  requestorName: string;
  requestorPhone: string;
  dateRequested: string;
}

// HIV Sample Details (Image 2)
export interface HivSampleDetails {
  dateDrawn: string;
  timeDrawn?: string;
  dateSeparated?: string;
  timeSeparated?: string;
  artInitiationDate?: string;
  sampleType: 'DBS' | 'Plasma';
  currentArtRegimen?: string; // OP, 2P, 4P, 9P, 11P, 14P, 15P, 16P, 0A, 2A, 4A, 5A, 6A, 7A, 8A, 9A, 10A, 11A, 12A, 13A, 14A, 15A, NS
  collectorSurname: string;
  collectorFirstName: string;
  collectorPhone: string;
  htcProviderId: string;
}

// TB Lab Results Form fields (Image 1)
export interface TbResults {
  labSerialNumber: string;
  dateReceived: string;
  macroscopicExamination: 'Muco-purulent' | 'Blood-stained' | 'Saliva' | 'Other';
  macroscopicOther?: string;
  
  // Microscopy details
  microscopyDate?: string;
  microscopySamples: Array<{
    sampleNum: 1 | 2;
    result: 'Negative' | 'Positive' | 'Not Done';
    grading?: '3+' | '2+' | '1+' | 'Actual number';
    actualNumber?: number;
    slitSkinSmearResult?: string;
    examinedBy: string;
  }>;

  // GeneXpert / Truenat details
  geneXpertDate?: string;
  geneXpertType?: 'Xpert Ultra' | 'Truenat';
  geneXpertResult?: 'MTB not detected' | 'MTB detected' | 'MTB detected Trace' | 'RIF resistant not detected' | 'RIF resistant detected' | 'RIF resistant indeterminate/Trace' | 'No result' | 'Error' | 'Invalid';
  geneXpertPerformedBy?: string;

  // Reflex test results (XDR)
  reflexDate?: string;
  reflexResults?: Array<{
    drug: 'Isoniazid' | 'Ethionamide' | 'Moxifloxacin' | 'Levofloxacin';
    result: 'Resistant' | 'Susceptible' | 'Not Done';
    performedBy: string;
  }>;

  // Urine LAM details
  urineLamDate?: string;
  urineLamResult?: 'Negative' | 'Positive' | 'Not Done';
  urineLamPerformedBy?: string;

  comment?: string;
  reviewedBy: string;
  reviewedDate: string;
}

// HIV Lab Results Form fields (Image 2)
export interface HivResults {
  labSerialNumber: string;
  dateReceived: string;
  dateProcessed: string;
  
  // EID results
  eidDnaPcrResult?: 'Positive' | 'Negative' | 'Inconclusive';
  
  // Viral Load results
  viralLoadValueType?: 'Undetectable' | 'Numerical';
  viralLoadCopies?: number; // Copies/mL
  viralLoadLogValue?: number; // Log copies
  
  performedBy: string;
  comment?: string;
}

// Discriminated union types for TB and HIV Requests
export interface TbLimsRequest {
  id: string;
  type: 'TB';
  sub_type: string;
  status: LimsStatus;
  clinician_email: string;
  patient_name: string;
  patient_id?: string;
  patient_phone?: string;
  
  patient_details: TbPatientDetails;
  request_details: TbRequestDetails;
  sample_details: TbSampleDetails;
  results: TbResults | Record<string, never>;
  
  created_at: string;
  updated_at: string;
  results_uploaded_at?: string;
  results_uploaded_by?: string;
}

export interface HivLimsRequest {
  id: string;
  type: 'HIV';
  sub_type: string;
  status: LimsStatus;
  clinician_email: string;
  patient_name: string;
  patient_id?: string;
  patient_phone?: string;
  
  patient_details: HivPatientDetails;
  request_details: HivRequestDetails;
  sample_details: HivSampleDetails;
  results: HivResults | Record<string, never>;
  
  created_at: string;
  updated_at: string;
  results_uploaded_at?: string;
  results_uploaded_by?: string;
}

export type LimsRequest = TbLimsRequest | HivLimsRequest;
