import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type {
  ChemistryResults,
  HaematologyResults,
  HivResults,
  LimsRequest,
  LimsStatus,
  TbResults,
  TestType,
  UserRole,
  UserSession,
} from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const usernameDomain = import.meta.env.VITE_MEDICY_USERNAME_DOMAIN || '';
const useRealSupabase = Boolean(supabaseUrl && supabaseAnonKey);
const REMEMBER_ME_KEY = 'medicy_remember_me';

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

const isUserRole = (value: unknown): value is UserRole =>
  value === 'lab' || value === 'clinician' || value === 'tb' || value === 'hiv';

const sessionFromSupabaseUser = (user: User): UserSession => {
  const role = user.app_metadata?.role;
  const facilityId = user.app_metadata?.facility_id;

  if (!isUserRole(role) || typeof facilityId !== 'string' || !facilityId.trim()) {
    throw new Error('This account is not assigned to a Medicy facility and role. Contact your facility administrator.');
  }

  return {
    email: user.email || '',
    role,
    facilityId: facilityId.toUpperCase(),
    facility: user.app_metadata?.facility_name || user.user_metadata?.facility_name || 'Medicy Partner Facility',
    name: user.user_metadata?.full_name || 'Medical Practitioner',
    userId: user.id,
  };
};

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Medicy is not connected to its secure data service. Contact the system administrator.');
  }
  return supabase;
};

const resolveLoginEmail = (username: string) => {
  const normalized = username.toLowerCase().trim();
  if (normalized.includes('@')) return normalized;
  if (!usernameDomain) {
    throw new Error('Enter the work email issued by your facility administrator.');
  }
  return `${normalized}@${usernameDomain}`;
};

export const LimsDbService = {
  isRealSupabase(): boolean {
    return useRealSupabase;
  },

  setRememberMe(remember: boolean) {
    if (remember) localStorage.setItem(REMEMBER_ME_KEY, 'true');
    else localStorage.removeItem(REMEMBER_ME_KEY);
  },

  async restoreSession(): Promise<UserSession | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session?.user ? sessionFromSupabaseUser(data.session.user) : null;
  },

  async login(facilityId: string, username: string, password: string, rememberMe: boolean): Promise<UserSession> {
    const client = requireSupabase();
    const normalizedFacilityId = facilityId.trim().toUpperCase();
    const email = resolveLoginEmail(username);
    if (!normalizedFacilityId) throw new Error('Facility ID is required.');

    this.setRememberMe(rememberMe);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw new Error('The facility ID, username or password is incorrect.');
    if (!data.user) throw new Error('Medicy could not open this account. Please try again.');

    const userSession = sessionFromSupabaseUser(data.user);
    if (userSession.facilityId !== normalizedFacilityId) {
      await client.auth.signOut();
      throw new Error('This account does not belong to the facility ID entered.');
    }
    return userSession;
  },

  async logout(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(REMEMBER_ME_KEY);
  },

  async getRequests(userSession: UserSession): Promise<LimsRequest[]> {
    const client = requireSupabase();
    const { role, email, facilityId } = userSession;
    let query = client.from('lims_requests').select('*').eq('facility_id', facilityId);

    if (role === 'tb') query = query.eq('type', 'TB');
    else if (role === 'hiv') query = query.eq('type', 'HIV');
    else if (role === 'clinician') query = query.eq('clinician_email', email);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as LimsRequest[];
  },

  async createRequest(
    type: TestType,
    subType: string,
    clinicianEmail: string,
    patientName: string,
    patientId: string,
    patientPhone: string,
    patientDetails: unknown,
    requestDetails: unknown,
    sampleDetails: unknown,
    userSession: UserSession,
  ): Promise<LimsRequest> {
    const client = requireSupabase();
    const department = type === 'Haematology' ? 'Haematology' : type === 'Chemistry' ? 'Chemistry' : 'Molecular';
    const newRequest = {
      type,
      sub_type: subType,
      status: 'Pending Sample' as LimsStatus,
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
    };

    const { data, error } = await client.from('lims_requests').insert([newRequest]).select().single();
    if (error) throw error;
    return data as LimsRequest;
  },

  async updateStatus(id: string, status: LimsStatus): Promise<LimsRequest> {
    const client = requireSupabase();
    const { data, error } = await client
      .from('lims_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as LimsRequest;
  },

  async uploadResults(
    id: string,
    results: unknown,
    technicianEmail: string,
    onSmsTrigger?: (smsDetails: { to: string; patientName: string; text: string }) => void,
  ): Promise<LimsRequest> {
    const client = requireSupabase();
    const updatePayload = {
      status: 'Completed' as LimsStatus,
      results,
      results_uploaded_at: new Date().toISOString(),
      results_uploaded_by: technicianEmail,
    };
    const { data, error } = await client
      .from('lims_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    const updatedRecord = data as LimsRequest;
    if (updatedRecord.patient_phone) {
      const summary = this.resultSummary(updatedRecord);
      const hospitalName = updatedRecord.facility || 'Medicy Partner Laboratory';
      const smsText = `Medicy notification: Results for ${updatedRecord.patient_name} (${updatedRecord.patient_id || 'no ID'}) are ready at ${hospitalName}. Test: ${updatedRecord.sub_type}. Summary: ${summary}.`;
      onSmsTrigger?.({ to: updatedRecord.patient_phone, patientName: updatedRecord.patient_name, text: smsText });
      this.sendResultSms(updatedRecord.patient_phone, smsText, updatedRecord.id).catch(error => {
        console.warn('Result SMS delivery was not completed:', error instanceof Error ? error.message : error);
      });
    }
    return updatedRecord;
  },

  resultSummary(request: LimsRequest): string {
    if (request.type === 'TB') {
      return (request.results as TbResults).geneXpertResult || 'TB result completed';
    }
    if (request.type === 'HIV') {
      const results = request.results as HivResults;
      if (results.viralLoadValueType === 'Undetectable') return 'Viral load undetectable';
      if (results.viralLoadCopies !== undefined) return `${results.viralLoadCopies} copies/mL`;
      return 'HIV result completed';
    }
    if (request.type === 'Haematology') {
      const results = request.results as HaematologyResults;
      return results.mrdtResult ? `mRDT ${results.mrdtResult}` : 'Haematology result completed';
    }
    const results = request.results as ChemistryResults;
    return results.hpylori?.result ? `H. pylori ${results.hpylori.result}` : 'Chemistry result completed';
  },

  async sendResultSms(phone: string, text: string, requestId: string) {
    const client = requireSupabase();
    const { error } = await client.functions.invoke('send-result-sms', {
      body: { phone, text, requestId },
    });
    if (error) throw error;
  },
};
