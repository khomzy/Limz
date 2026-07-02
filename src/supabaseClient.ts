import { createClient } from '@supabase/supabase-js';
import type { LimsRequest, LimsStatus, UserSession, UserRole, TestType, TbResults, HivResults, TbLimsRequest, HivLimsRequest } from './types';

// Read Supabase environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Determine if we should use real Supabase
const useRealSupabase = supabaseUrl && supabaseAnonKey;

// Real Supabase Client
export const supabase = useRealSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// ==========================================
// PRE-SEEDED TEST DATA FOR DEMO MODE
// ==========================================
const SEED_REQUESTS: LimsRequest[] = [
  {
    id: 'req-tb-001',
    type: 'TB',
    sub_type: 'GeneXpert Ultra',
    status: 'Completed',
    clinician_email: 'tb@zg.com',
    patient_name: 'Modester Silence',
    patient_id: 'BT/TBU/2026/89',
    patient_phone: '0995393202',
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
    clinician_email: 'clinitian@zg.com',
    patient_name: 'Mervis Banda',
    patient_id: 'ZA-99281-91',
    patient_phone: '0999876543',
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
      currentArtRegimen: '5A', // e.g. TDF/3TC/EFV
      collectorSurname: 'Moyo',
      collectorFirstName: 'Limbani',
      collectorPhone: '0998112233',
      htcProviderId: 'HTC-992'
    },
    results: {}
  } as HivLimsRequest,
  {
    id: 'req-hiv-003',
    type: 'HIV',
    sub_type: 'EID',
    status: 'Pending Sample',
    clinician_email: 'clinitian@zg.com',
    patient_name: 'Exposed Child Phiri',
    patient_id: 'EC-7728-EID',
    patient_phone: '0999123456',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patient_details: {
      surname: 'Phiri',
      firstName: 'Exposed Child',
      patientId: 'EC-7728-EID',
      dateOfBirth: '2026-05-15',
      genderPregBf: 'Male', // Child
      phone: '0999123456'
    },
    request_details: {
      testType: 'EID',
      eidReason: 'EID initial',
      motherSurname: 'Phiri',
      motherFirstName: 'Gift',
      uniqueChildId: 'EC-7728'
    },
    sample_details: {
      dateDrawn: '2026-07-02',
      sampleType: 'DBS',
      collectorSurname: 'Chirwa',
      collectorFirstName: 'Grace',
      collectorPhone: '0888998877',
      htcProviderId: 'HTC-104'
    },
    results: {}
  } as HivLimsRequest
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

  // 1. Authenticate user
  async login(email: string, password: string): Promise<UserSession> {
    const formattedEmail = email.toLowerCase().trim();

    let demoSession: UserSession | null = null;

    // Check predefined hardcoded credentials for demo metadata mapping
    if (formattedEmail === 'moghajoh@gmail.com' && password === 'ruth11') {
      demoSession = {
        email: formattedEmail,
        role: 'lab',
        name: 'John Mogha',
        facility: 'Zingwangwa Lab'
      };
    } else if (formattedEmail === 'clinitian@zg.com' && password === '12345678') {
      demoSession = {
        email: formattedEmail,
        role: 'clinician',
        name: 'General Clinician',
        facility: 'Zingwangwa Community Hospital'
      };
    } else if (formattedEmail === 'tb@zg.com' && password === '12345678') {
      demoSession = {
        email: formattedEmail,
        role: 'tb',
        name: 'TB Department',
        facility: 'Zingwangwa TBU'
      };
    }

    if (useRealSupabase && supabase) {
      // Attempt real Supabase Auth - this is REQUIRED to establish a session for RLS policies
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formattedEmail,
        password
      });

      if (error) {
        // If we have a demo session but Supabase fails, it might be because the user hasn't created the demo accounts in Supabase yet.
        // However, RLS will fail if we don't have a session.
        if (demoSession) {
          console.warn('Supabase Auth failed for demo account. RLS policies may block database access.', error.message);
          return demoSession;
        }
        throw new Error(error.message);
      }

      if (data.user) {
        // If it's a demo account, use the demo metadata but prefer actual user_metadata if present
        if (demoSession) {
          return {
            ...demoSession,
            name: data.user.user_metadata?.full_name || demoSession.name,
            facility: data.user.user_metadata?.facility || demoSession.facility
          };
        }

        // Map role for other users based on metadata or email
        let role: UserRole = 'clinician';
        if (formattedEmail.includes('lab') || formattedEmail === 'moghajoh@gmail.com') {
          role = 'lab';
        } else if (formattedEmail.includes('tb')) {
          role = 'tb';
        }

        return {
          email: formattedEmail,
          role,
          name: data.user.user_metadata?.full_name || 'Medical Practitioner',
          facility: data.user.user_metadata?.facility || 'Zingwangwa Hospital'
        };
      }
    }

    // Fallback for local storage mode
    if (demoSession) {
      return demoSession;
    }

    throw new Error('Invalid email or password. Please use the preconfigured hospital login credentials.');
  },

  // 2. Fetch requests (with status/role filters)
  async getRequests(role: UserRole, email: string): Promise<LimsRequest[]> {
    if (useRealSupabase && supabase) {
      let query = supabase.from('lims_requests').select('*');
      
      // If clinician or tb, restrict to their specific requests or department
      if (role === 'clinician') {
        query = query.or(`clinician_email.eq.${email},clinician_email.like.%zg.com`);
      } else if (role === 'tb') {
        query = query.eq('clinician_email', email);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as LimsRequest[];
    } else {
      // LocalStorage Fallback
      initializeLocalStorage();
      const raw = localStorage.getItem('lims_requests');
      const all: LimsRequest[] = raw ? JSON.parse(raw) : [];
      
      // Sort by creation time desc
      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (role === 'lab') {
        return all;
      } else if (role === 'tb') {
        return all.filter(r => r.clinician_email === 'tb@zg.com');
      } else {
        // General clinician sees clinician and general zg.com requests
        return all.filter(r => r.clinician_email === 'clinitian@zg.com' || r.clinician_email.endsWith('zg.com'));
      }
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
    sampleDetails: any
  ): Promise<LimsRequest> {
    const newRequest: Partial<LimsRequest> = {
      type,
      sub_type: subType,
      status: 'Pending Sample',
      clinician_email: clinicianEmail,
      patient_name: patientName,
      patient_id: patientId,
      patient_phone: patientPhone,
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

  // 4. Update request status (Lab Technicians receiving or analyzing samples)
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

  // 5. Upload test results (Lab Technicians completing the test)
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
      const isTb = updatedRecord.type === 'TB';
      let summary = '';
      if (isTb) {
        const tbRes = updatedRecord.results as TbResults;
        const xpert = tbRes.geneXpertResult;
        const micro = tbRes.microscopySamples?.[0]?.result;
        const lam = tbRes.urineLamResult;
        summary = xpert 
          ? `GeneXpert: ${xpert}` 
          : (micro ? `Microscopy: ${micro}` : (lam ? `Urine LAM: ${lam}` : 'Results Available'));
      } else {
        const hivRes = updatedRecord.results as HivResults;
        const vl = hivRes.viralLoadValueType === 'Undetectable' 
          ? 'Undetectable' 
          : (hivRes.viralLoadCopies !== undefined ? `${hivRes.viralLoadCopies} copies/ml` : '');
        const eid = hivRes.eidDnaPcrResult;
        summary = vl ? `Viral Load: ${vl}` : (eid ? `EID DNA-PCR: ${eid}` : 'Results Available');
      }

      const clinicianName = isTb ? 'TB Department' : 'General Clinician';
      const smsText = `Zingwangwa LIMS: Results for patient ${updatedRecord.patient_name} (ID: ${updatedRecord.patient_id || 'N/A'}) are ready. Test: ${updatedRecord.sub_type}. Result: ${summary}. Requested by: ${clinicianName}.`;
      
      // Fire visual simulator callback
      if (onSmsTrigger) {
        onSmsTrigger({
          to: updatedRecord.patient_phone,
          patientName: updatedRecord.patient_name,
          text: smsText
        });
      }

      // Run real AfricasTalking SMS endpoint in background if configured
      this.sendRealSms(updatedRecord.patient_phone, smsText).catch(e => console.log('AT API Call (Skipped/Prod only):', e.message));
    }

    return updatedRecord;
  },

  // Simulated method showing how the actual AfricasTalking SMS API integration works
  async sendRealSms(phone: string, text: string) {
    const username = import.meta.env.VITE_AFRICASTALKING_USERNAME;
    const apiKey = import.meta.env.VITE_AFRICASTALKING_API_KEY;

    if (!username || !apiKey) {
      return; // Run in sandbox/simulation mode if keys are not present
    }

    try {
      const response = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'apiKey': apiKey
        },
        body: new URLSearchParams({
          username: username,
          to: phone,
          message: text
        })
      });
      return await response.json();
    } catch (err) {
      console.warn('Failed to call AfricasTalking SMS API directly', err);
    }
  }
};
