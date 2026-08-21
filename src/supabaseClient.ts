import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { LimsRequest, LimsStatus, UserSession, UserRole, TestType, TbResults, HivResults, TbLimsRequest, HivLimsRequest, HaematologyLimsRequest, ChemistryLimsRequest, HaematologyResults, ChemistryResults } from './types';

// Read Supabase environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const useRealSupabase = Boolean(supabaseUrl && supabaseAnonKey);
const REMEMBER_ME_KEY = 'medicy_remember_me';
const DEMO_SESSION_KEY = 'medicy_demo_session';

const authStorage = {
  getItem(key: string) {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    const durable = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    const destination = durable ? localStorage : sessionStorage;
    const other = durable ? sessionStorage : localStorage;
    destination.setItem(key, value);
    other.removeItem(key);
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = useRealSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const DEMO_FACILITY_ID = 'ZCH001';
const DEMO_ACCOUNTS: Record<string, { password: string; session: UserSession }> = {
  'moghajoh@gmail.com': {
    password: 'ruth11',
    session: { email: 'moghajoh@gmail.com', role: 'lab', name: 'John Mogha', facility: 'Zingwangwa Community Hospital', facilityId: DEMO_FACILITY_ID },
  },
  'tb@zg.com': {
    password: '12345678',
    session: { email: 'tb@zg.com', role: 'tb', name: 'TB Clinician', facility: 'Zingwangwa Community Hospital', facilityId: DEMO_FACILITY_ID },
  },
  'clinitian@zg.com': {
    password: '12345678',
    session: { email: 'clinitian@zg.com', role: 'hiv', name: 'HIV Clinician', facility: 'Zingwangwa Community Hospital', facilityId: DEMO_FACILITY_ID },
  },
  'clinical@zg.com': {
    password: '12345678',
    session: { email: 'clinical@zg.com', role: 'clinician', name: 'General Clinician', facility: 'Zingwangwa Community Hospital', facilityId: DEMO_FACILITY_ID },
  },
};

const USERNAME_ALIASES: Record<string, string> = {
  lab: 'moghajoh@gmail.com',
  tb: 'tb@zg.com',
  hiv: 'clinitian@zg.com',
  clinician: 'clinical@zg.com',
};

const isUserRole = (value: unknown): value is UserRole =>
  value === 'lab' || value === 'clinician' || value === 'tb' || value === 'hiv';

const sessionFromSupabaseUser = (user: User): UserSession => {
  const fallbackDemo = DEMO_ACCOUNTS[user.email?.toLowerCase() || '']?.session;
  const role = user.app_metadata?.role ?? fallbackDemo?.role;
  const facilityId = user.app_metadata?.facility_id ?? fallbackDemo?.facilityId;

  if (!isUserRole(role) || typeof facilityId !== 'string' || !facilityId.trim()) {
    throw new Error('This account is not assigned to a Medicy facility and role. Contact your facility administrator.');
  }

  return {
    email: user.email || fallbackDemo?.email || '',
    role,
    facilityId: facilityId.toUpperCase(),
    facility: user.app_metadata?.facility_name || user.user_metadata?.facility_name || user.user_metadata?.facility || fallbackDemo?.facility || 'Medicy Partner Facility',
    name: user.user_metadata?.full_name || fallbackDemo?.name || 'Medical Practitioner',
    userId: user.id,
  };
};


// ==========================================
// PRE-SEEDED TEST DATA FOR DEMO MODE
// ==========================================
const SEED_REQUESTS: LimsRequest[] = [
  {
    id: 'req-tb-001',
    type: 'TB',
    sub_type: 'GeneXpert Ultra',
    status: 'Completed',
    department: 'Molecular',
    clinician_email: 'tb@zg.com',
    patient_name: 'Modester Silence',
    patient_id: 'BT/TBU/2026/89',
    patient_phone: '0995393202',
    facility: 'Zingwangwa Community Hospital',
    facility_id: DEMO_FACILITY_ID,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    results_uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    results_uploaded_by: 'moghajoh@gmail.com',
    patient_details: {
      fullName: 'Modester Silence',
      age: 43,
      gender: 'Female',
      villageStreet: 'Manja near msika',
      district: 'BT',
      telephone: '0995393202',
      reasonForExamination: 'Diagnosis',
      hivStatus: 'Negative',
      tbTreatmentHistory: 'New',
      sourceOfReferral: 'OPD'
    },
    request_details: {
      examinations: {
        microscopy: false,
        slitSkinSmear: false,
        xpertUltra: true,
        trunat: false,
        urineLam: false,
        reflexTestingXdr: false,
        other: false
      },
      indicationsXpertUltra: {
        presumptiveDrTb: true,
        hospitalized: false,
        hivPositive: false,
        children: false,
        prisoner: false,
        minorXminer: false,
        other: false
      }
    },
    sample_details: {
      sampleType: 'Sputum',
      dateCollected: '2026-06-29',
      timeCollected: '10:00',
      recollectionDueToRejection: false,
      requestorName: 'M. Kumba',
      requestorPhone: '0888234567',
      dateRequested: '2026-06-29'
    },
    results: {
      labSerialNumber: 'LAB-TB-4491',
      dateReceived: '2026-06-29',
      macroscopicExamination: 'Muco-purulent',
      geneXpertDate: '2026-06-30',
      geneXpertType: 'Xpert Ultra',
      geneXpertResult: 'MTB detected',
      geneXpertPerformedBy: 'John Mogha',
      comment: 'Sample processed successfully. MTB positive, RIF resistance not detected.',
      reviewedBy: 'Dr. Ruth Phiri',
      reviewedDate: '2026-06-30'
    }
  } as TbLimsRequest,
  {
    id: 'req-hiv-002',
    type: 'HIV',
    sub_type: 'Viral Load',
    status: 'Testing',
    department: 'Molecular',
    clinician_email: 'clinitian@zg.com',
    patient_name: 'Mervis Banda',
    patient_id: 'ZA-99281-91',
    patient_phone: '0999876543',
    facility: 'Zingwangwa Community Hospital',
    facility_id: DEMO_FACILITY_ID,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    patient_details: {
      surname: 'Banda',
      firstName: 'Mervis',
      patientId: 'ZA-99281-91',
      dateOfBirth: '1998-05-12',
      genderPregBf: 'Female Pregnant',
      phone: '0999876543'
    },
    request_details: {
      testType: 'Viral Load',
      viralLoadReason: 'Routine'
    },
    sample_details: {
      dateDrawn: '2026-07-01',
      sampleType: 'Plasma',
      currentArtRegimen: '5A',
      collectorSurname: 'Moyo',
      collectorFirstName: 'Limbani',
      collectorPhone: '0998112233',
      htcProviderId: 'HTC-992'
    },
    results: {}
  } as HivLimsRequest,
  {
    id: 'req-haem-001',
    type: 'Haematology',
    sub_type: 'FBC',
    status: 'Pending Sample',
    department: 'Haematology',
    clinician_email: 'clinical@zg.com',
    patient_name: 'Pachalo Phiri',
    patient_id: 'BT/HAEM/2026/04',
    patient_phone: '0888123456',
    facility: 'Zingwangwa Community Hospital',
    facility_id: DEMO_FACILITY_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient_details: {
      fullName: 'Pachalo Phiri',
      age: 28,
      gender: 'Male',
      telephone: '0888123456',
      ward: 'OPD'
    },
    request_details: {
      tests: { fbc: true, thinBloodSmear: false, mrdt: false, other: false }
    },
    sample_details: {
      sampleType: 'EDTA Whole Blood',
      dateCollected: new Date().toISOString().split('T')[0],
      timeCollected: '08:30'
    },
    results: {}
  } as HaematologyLimsRequest,
  {
    id: 'req-chem-001',
    type: 'Chemistry',
    sub_type: 'KFT + LFT',
    status: 'Pending Sample',
    department: 'Chemistry',
    clinician_email: 'clinical@zg.com',
    patient_name: 'Grace Chunga',
    patient_id: 'BT/CHEM/2026/18',
    patient_phone: '0999778899',
    facility: 'Zingwangwa Community Hospital',
    facility_id: DEMO_FACILITY_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient_details: {
      fullName: 'Grace Chunga',
      age: 52,
      gender: 'Female',
      telephone: '0999778899',
      ward: 'Ward 2A'
    },
    request_details: {
      tests: { kft: true, lft: true, lipidProfile: false, hpylori: false, other: false }
    },
    sample_details: {
      sampleType: 'Serum',
      dateCollected: new Date().toISOString().split('T')[0],
      timeCollected: '09:15'
    },
    results: {}
  } as ChemistryLimsRequest
];

// Seed storage helper
const initializeLocalStorage = () => {
  if (!localStorage.getItem('lims_requests')) {
    localStorage.setItem('lims_requests', JSON.stringify(SEED_REQUESTS));
  }
};

// ==========================================
// UNIFIED LIMS DATABASE SERVICE
// ==========================================
export const LimsDbService = {
  // Check if real Supabase configuration is present
  isRealSupabase(): boolean {
    return !!useRealSupabase;
  },

  setRememberMe(remember: boolean) {
    if (remember) localStorage.setItem(REMEMBER_ME_KEY, 'true');
    else localStorage.removeItem(REMEMBER_ME_KEY);
  },

  async restoreSession(): Promise<UserSession | null> {
    if (useRealSupabase && supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session?.user ? sessionFromSupabaseUser(data.session.user) : null;
    }

    const stored = localStorage.getItem(DEMO_SESSION_KEY) ?? sessionStorage.getItem(DEMO_SESSION_KEY);
    return stored ? JSON.parse(stored) as UserSession : null;
  },

  async login(facilityId: string, username: string, password: string, rememberMe: boolean): Promise<UserSession> {
    const normalizedFacilityId = facilityId.trim().toUpperCase();
    const normalizedUsername = username.toLowerCase().trim();
    const email = USERNAME_ALIASES[normalizedUsername] || normalizedUsername;

    if (!normalizedFacilityId) throw new Error('Facility ID is required.');
    this.setRememberMe(rememberMe);

    if (useRealSupabase && supabase) {
      if (!email.includes('@')) throw new Error('Enter the username or work email issued by your facility.');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('The facility ID, username or password is incorrect.');
      if (!data.user) throw new Error('Medicy could not open this account. Please try again.');

      const userSession = sessionFromSupabaseUser(data.user);
      if (userSession.facilityId !== normalizedFacilityId) {
        await supabase.auth.signOut();
        throw new Error('This account does not belong to the facility ID entered.');
      }
      return userSession;
    }

    const account = DEMO_ACCOUNTS[email];
    if (!account || account.password !== password || account.session.facilityId !== normalizedFacilityId) {
      throw new Error('The facility ID, username or password is incorrect.');
    }

    const destination = rememberMe ? localStorage : sessionStorage;
    const other = rememberMe ? sessionStorage : localStorage;
    destination.setItem(DEMO_SESSION_KEY, JSON.stringify(account.session));
    other.removeItem(DEMO_SESSION_KEY);
    return account.session;
  },

  async logout(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(DEMO_SESSION_KEY);
    sessionStorage.removeItem(DEMO_SESSION_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  },

  // 2. Fetch requests (with status/role filters)
  async getRequests(userSession: UserSession): Promise<LimsRequest[]> {
    const { role, email, facilityId } = userSession;
    if (useRealSupabase && supabase) {
      let query = supabase.from('lims_requests').select('*').eq('facility_id', facilityId);

      if (role === 'tb') query = query.eq('type', 'TB');
      else if (role === 'hiv') query = query.eq('type', 'HIV');
      else if (role === 'clinician') query = query.eq('clinician_email', email);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as LimsRequest[];
    } else {
      initializeLocalStorage();
      const raw = localStorage.getItem('lims_requests');
      const all: LimsRequest[] = raw ? JSON.parse(raw) : [];

      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const facilityRequests = all.filter(r => (r.facility_id || DEMO_FACILITY_ID) === facilityId);
      if (role === 'lab') return facilityRequests;
      if (role === 'tb') return facilityRequests.filter(r => r.type === 'TB');
      if (role === 'hiv') return facilityRequests.filter(r => r.type === 'HIV');
      return facilityRequests.filter(r => r.clinician_email === email);
    }
  },

  // 3. Submit a new test request (Clinician/TB)
  async createRequest(
    type: TestType,
    subType: string,
    clinicianEmail: string,
    patientName: string,
    patientId: string,
    patientPhone: string,
    patientDetails: any,
    requestDetails: any,
    sampleDetails: any,
    userSession: UserSession,
  ): Promise<LimsRequest> {
    // Map TestType to appropriate LimsDepartment
    let department: 'Molecular' | 'Haematology' | 'Chemistry' = 'Molecular';
    if (type === 'Haematology') department = 'Haematology';
    else if (type === 'Chemistry') department = 'Chemistry';

    const newRequest: any = {
      type,
      sub_type: subType,
      status: 'Pending Sample',
      department,
      clinician_email: clinicianEmail,
      patient_name: patientName,
      patient_id: patientId,
      patient_phone: patientPhone,
      facility: userSession.facility,
      facility_id: userSession.facilityId,
      created_by: userSession.userId,
      patient_details: patientDetails,
      request_details: requestDetails,
      sample_details: sampleDetails,
      results: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (useRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('lims_requests')
        .insert([newRequest])
        .select()
        .single();
      if (error) throw error;
      return data as LimsRequest;
    } else {
      initializeLocalStorage();
      const raw = localStorage.getItem('lims_requests');
      const all: LimsRequest[] = raw ? JSON.parse(raw) : [];

      const created: LimsRequest = {
        ...newRequest,
        id: 'req-' + Math.random().toString(36).substr(2, 9)
      } as LimsRequest;

      all.push(created);
      localStorage.setItem('lims_requests', JSON.stringify(all));
      return created;
    }
  },

  // 4. Update request status
  async updateStatus(id: string, status: LimsStatus): Promise<LimsRequest> {
    if (useRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('lims_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LimsRequest;
    } else {
      initializeLocalStorage();
      const raw = localStorage.getItem('lims_requests');
      const all: LimsRequest[] = raw ? JSON.parse(raw) : [];

      const index = all.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Request not found');

      all[index].status = status;
      all[index].updated_at = new Date().toISOString();

      localStorage.setItem('lims_requests', JSON.stringify(all));
      return all[index];
    }
  },

  // 5. Upload test results (supporting dynamic facility rebranding in SMS)
  async uploadResults(
    id: string,
    results: any,
    technicianEmail: string,
    onSmsTrigger?: (smsDetails: { to: string; patientName: string; text: string }) => void
  ): Promise<LimsRequest> {
    const updatePayload = {
      status: 'Completed' as LimsStatus,
      results,
      results_uploaded_at: new Date().toISOString(),
      results_uploaded_by: technicianEmail,
      updated_at: new Date().toISOString()
    };

    let updatedRecord: LimsRequest;

    if (useRealSupabase && supabase) {
      const { data, error } = await supabase
        .from('lims_requests')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      updatedRecord = data as LimsRequest;
    } else {
      initializeLocalStorage();
      const raw = localStorage.getItem('lims_requests');
      const all: LimsRequest[] = raw ? JSON.parse(raw) : [];

      const index = all.findIndex(r => r.id === id);
      if (index === -1) throw new Error('Request not found');

      all[index] = {
        ...all[index],
        ...updatePayload
      } as any;

      localStorage.setItem('lims_requests', JSON.stringify(all));
      updatedRecord = all[index];
    }

    // Trigger SMS Notification Logic
    if (updatedRecord.patient_phone) {
      let summary = '';
      if (updatedRecord.type === 'TB') {
        const tbRes = updatedRecord.results as TbResults;
        summary = tbRes.geneXpertResult || 'Microscopy/Urine LAM result completed';
      } else if (updatedRecord.type === 'HIV') {
        const hivRes = updatedRecord.results as HivResults;
        summary = hivRes.viralLoadValueType === 'Undetectable'
          ? 'Undetectable'
          : (hivRes.viralLoadCopies !== undefined ? `${hivRes.viralLoadCopies} copies/ml` : 'DNA-PCR complete');
      } else if (updatedRecord.type === 'Haematology') {
        const haemRes = updatedRecord.results as HaematologyResults;
        const hbVal = haemRes.fbc?.haemoglobin ? `Hb ${haemRes.fbc.haemoglobin} g/dL` : '';
        const mrdtVal = haemRes.mrdtResult ? `mRDT ${haemRes.mrdtResult}` : '';
        summary = [hbVal, mrdtVal].filter(Boolean).join(', ') || 'FBC/Malaria Complete';
      } else if (updatedRecord.type === 'Chemistry') {
        const chemRes = updatedRecord.results as ChemistryResults;
        const ureaVal = chemRes.kft?.urea ? `Urea ${chemRes.kft.urea}` : '';
        const altVal = chemRes.lft?.alt ? `ALT ${chemRes.lft.alt}` : '';
        summary = [ureaVal, altVal].filter(Boolean).join(', ') || 'KFT/LFT Complete';
      }

      // Rebranded hospital name comes dynamically from facility or default
      const hospitalName = updatedRecord.facility || 'Medicy Partner Laboratory';
      const smsText = `Medicy notification: Results for patient ${updatedRecord.patient_name} (ID: ${updatedRecord.patient_id || 'N/A'}) are ready at ${hospitalName}. Test: ${updatedRecord.sub_type}. Result summary: ${summary}.`;

      // Fire visual simulator callback
      if (onSmsTrigger) {
        onSmsTrigger({
          to: updatedRecord.patient_phone,
          patientName: updatedRecord.patient_name,
          text: smsText
        });
      }

      this.sendResultSms(updatedRecord.patient_phone, smsText, updatedRecord.id).catch(error => {
        console.warn('Result SMS delivery was not completed:', error instanceof Error ? error.message : error);
      });
    }

    return updatedRecord;
  },

  async sendResultSms(phone: string, text: string, requestId: string) {
    if (!supabase) return;
    const { error } = await supabase.functions.invoke('send-result-sms', {
      body: { phone, text, requestId },
    });
    if (error) throw error;
  }
};
