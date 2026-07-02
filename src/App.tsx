import { useState, useEffect, useRef } from 'react';
import type { LimsRequest, UserSession, TbResults, HivResults } from './types';
import { LimsDbService, supabase } from './supabaseClient';
import TBRequestForm from './components/TBRequestForm';
import HIVRequestForm from './components/HIVRequestForm';
import ResultEntryForm from './components/ResultEntryForm';
import SmsSimulator from './components/SmsSimulator';
import TestTypeModal from './components/TestTypeModal';
import {
  LogOut,
  Plus,
  FileText,
  FlaskConical,
  Activity,
  CheckCircle2,
  ClipboardList,
  Search,
  AlertCircle,
  Microscope,
  HeartPulse,
  Clock,
  Inbox,
} from 'lucide-react';
import './App.css';

export default function App() {
  const [session, setSession]           = useState<UserSession | null>(null);
  const [emailInput, setEmailInput]     = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError]     = useState('');
  const [loading, setLoading]           = useState(false);

  const [requests, setRequests]                   = useState<LimsRequest[]>([]);
  const [searchQuery, setSearchQuery]             = useState('');
  const [activeForm, setActiveForm]               = useState<'none'|'tb-request'|'hiv-request'|'result-entry'>('none');
  const [selectedRequest, setSelectedRequest]     = useState<LimsRequest | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [showTestTypeModal, setShowTestTypeModal] = useState(false);

  const [smsDetails, setSmsDetails] = useState<{ to: string; patientName: string; text: string } | null>(null);

  // ── Theme sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.className = '';
    if (session) {
      if (session.role === 'lab')           document.body.classList.add('lab-mode');
      else if (session.role === 'tb')       document.body.classList.add('tb-mode');
      else                                  document.body.classList.add('clinician-mode');
    } else {
      document.body.classList.add('clinician-mode');
    }
  }, [session]);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadRequests = async (userSession: UserSession) => {
    try {
      setLoading(true);
      const data = await LimsDbService.getRequests(userSession.role, userSession.email);
      setRequests(data);
    } catch (err: any) {
      console.error('Error loading requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Real-time Supabase subscription ───────────────────────────────────────
  const sessionRef = useRef<UserSession | null>(null);
  useEffect(() => { sessionRef.current = session; }, [session]);

  useEffect(() => {
    if (!session || !supabase) return;
    const channel = supabase
      .channel('lims-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lims_requests' }, () => {
        if (sessionRef.current) loadRequests(sessionRef.current);
      })
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.email]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const userSession = await LimsDbService.login(emailInput, passwordInput);
      setSession(userSession);
      loadRequests(userSession);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setRequests([]);
    setEmailInput('');
    setPasswordInput('');
    setActiveForm('none');
    setSelectedRequest(null);
  };

  // ── Clinician actions ─────────────────────────────────────────────────────
  const handleRequestSubmit = async (
    subType: string, patientName: string, patientId: string, phone: string,
    patientDetails: any, requestDetails: any, sampleDetails: any
  ) => {
    if (!session) return;
    try {
      setLoading(true);
      const testType = session.role === 'tb' ? 'TB' : 'HIV';
      await LimsDbService.createRequest(testType, subType, session.email, patientName, patientId, phone, patientDetails, requestDetails, sampleDetails);
      setActiveForm('none');
      loadRequests(session);
    } catch (err: any) {
      alert('Error creating LIMS request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Lab actions ───────────────────────────────────────────────────────────
  const handleReceiveSample = async (id: string) => {
    if (!session) return;
    try { setLoading(true); await LimsDbService.updateStatus(id, 'Sample Received'); loadRequests(session); }
    catch (err: any) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleStartTesting = async (id: string) => {
    if (!session) return;
    try { setLoading(true); await LimsDbService.updateStatus(id, 'Testing'); loadRequests(session); }
    catch (err: any) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleOpenResultsForm = (req: LimsRequest) => {
    setSelectedRequest(req);
    setActiveForm('result-entry');
  };

  const handleResultSubmit = async (results: TbResults | HivResults) => {
    if (!session || !selectedRequest) return;
    try {
      setLoading(true);
      await LimsDbService.uploadResults(selectedRequest.id, results, session.email, (smsInfo) => setSmsDetails(smsInfo));
      setActiveForm('none');
      setSelectedRequest(null);
      loadRequests(session);
    } catch (err: any) {
      alert('Error uploading results: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredRequests = requests.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    return !q || r.patient_name.toLowerCase().includes(q) ||
      (r.patient_id && r.patient_id.toLowerCase().includes(q)) ||
      r.status.toLowerCase().includes(q) ||
      r.sub_type.toLowerCase().includes(q);
  });

  const statTotal     = requests.length;
  const statPending   = requests.filter(r => r.status === 'Pending Sample').length;
  const statTesting   = requests.filter(r => r.status === 'Testing' || r.status === 'Sample Received').length;
  const statCompleted = requests.filter(r => r.status === 'Completed').length;

  // ── Initials helper ───────────────────────────────────────────────────────
  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // ── LOGIN PAGE ────────────────────────────────────────────────────────────
  if (!session) {
    return (
      <div className="login-container">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
        <div className="login-grid" />

        <div className="login-card fade-in">
          <div className="login-logo">
            <div className="login-logo-icon">🔬</div>
            <h1>Zingwangwa <span>LIMS</span></h1>
          </div>
          <span className="login-subtitle">
            Lab Information Management System · Zingwangwa Community Hospital
          </span>

          {loginError && (
            <div className="login-error-msg">
              <AlertCircle size={15} />
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>Hospital Email Address</label>
              <input
                type="email"
                id="login-email"
                placeholder="e.g. clinitian@zg.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label>Security Password</label>
              <input
                type="password"
                id="login-password"
                placeholder="Enter your password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Quick-fill demo logins */}
          <div className="seed-logins-box">
            <h4>Quick Demonstration Logins</h4>
            <div className="seed-login-item">
              <span className="role-label">
                <HeartPulse size={14} style={{color:'#14b8a6'}} />
                General Clinician
                <em>clinitian@zg.com</em>
              </span>
              <button id="fill-clinician" onClick={() => { setEmailInput('clinitian@zg.com'); setPasswordInput('12345678'); }}>Fill</button>
            </div>
            <div className="seed-login-item">
              <span className="role-label">
                <Activity size={14} style={{color:'#10b981'}} />
                TB Clinician
                <em>tb@zg.com</em>
              </span>
              <button id="fill-tb" onClick={() => { setEmailInput('tb@zg.com'); setPasswordInput('12345678'); }}>Fill</button>
            </div>
            <div className="seed-login-item">
              <span className="role-label">
                <Microscope size={14} style={{color:'#3b82f6'}} />
                Laboratory Tech
                <em>moghajoh@gmail.com</em>
              </span>
              <button id="fill-lab" onClick={() => { setEmailInput('moghajoh@gmail.com'); setPasswordInput('ruth11'); }}>Fill</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN DASHBOARD ────────────────────────────────────────────────────────
  return (
    <div className="lims-app-wrapper">

      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo-mark">🔬</div>
          <div className="navbar-brand-text">
            <span className="brand-name">Zingwangwa Hospital LIMS</span>
            <span className="brand-sub">Diagnostic Information System</span>
          </div>
          <span className="brand-badge">{session.role} portal</span>
        </div>

        <div className="navbar-right">
          <div className="user-chip">
            <div className="user-avatar">{initials(session.name)}</div>
            <div className="user-info-block">
              <span className="u-name">{session.name}</span>
              <span className="u-facility">{session.facility}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} id="logout-btn">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-container">

        {/* ─── Test type picker modal ──────────────────────────── */}
        {showTestTypeModal && (
          <TestTypeModal
            onSelect={(type) => {
              setShowTestTypeModal(false);
              setActiveForm(type === 'TB' ? 'tb-request' : 'hiv-request');
            }}
            onClose={() => setShowTestTypeModal(false)}
          />
        )}

      {/* ─── Overlay forms ──────────────────────────────────────── */}
        {activeForm === 'tb-request' && (
          <TBRequestForm onSubmit={handleRequestSubmit} onCancel={() => setActiveForm('none')} />
        )}
        {activeForm === 'hiv-request' && (
          <HIVRequestForm onSubmit={handleRequestSubmit} onCancel={() => setActiveForm('none')} />
        )}
        {activeForm === 'result-entry' && selectedRequest && (
          <ResultEntryForm
            request={selectedRequest}
            onSubmit={handleResultSubmit}
            onCancel={() => { setActiveForm('none'); setSelectedRequest(null); }}
          />
        )}

        {/* ─── Main dashboard view ────────────────────────────────── */}
        {activeForm === 'none' && (
          <div className="dashboard-main fade-in">

            {/* Hero header */}
            <div className="dashboard-hero">
              <div className="dashboard-hero-text">
                <h1>Zingwangwa Diagnostics Portal</h1>
                <p>Welcome back, <strong>{session.name}</strong>. Real-time lab connectivity.</p>
              </div>

              <div className="action-grid">
                {session.role === 'lab' ? (
                  <button id="register-case" className="btn-primary" onClick={() => setShowTestTypeModal(true)}>
                    <Plus size={16} />
                    Register New Case
                  </button>
                ) : session.role === 'tb' ? (
                  <button id="new-tb-request" className="btn-primary tb-theme" onClick={() => setShowTestTypeModal(true)}>
                    <Plus size={16} />
                    Request TB Test
                  </button>
                ) : (
                  <button id="new-hiv-request" className="btn-primary hiv-theme" onClick={() => setShowTestTypeModal(true)}>
                    <Plus size={16} />
                    Request HIV VL / EID
                  </button>
                )}
              </div>
            </div>

            {/* Stats grid */}
            <div className="stats-grid stagger">
              <div className="stat-card total fade-in">
                <div className="stat-icon"><ClipboardList size={22} /></div>
                <div className="stat-body">
                  <span className="label">Total Records</span>
                  <span className="value">{statTotal}</span>
                </div>
              </div>
              <div className="stat-card pending fade-in">
                <div className="stat-icon"><Clock size={22} /></div>
                <div className="stat-body">
                  <span className="label">Pending Samples</span>
                  <span className="value">{statPending}</span>
                </div>
              </div>
              <div className="stat-card active fade-in">
                <div className="stat-icon"><FlaskConical size={22} /></div>
                <div className="stat-body">
                  <span className="label">Active Analysis</span>
                  <span className="value">{statTesting}</span>
                </div>
              </div>
              <div className="stat-card done fade-in">
                <div className="stat-icon"><CheckCircle2 size={22} /></div>
                <div className="stat-body">
                  <span className="label">Results Delivered</span>
                  <span className="value">{statCompleted}</span>
                </div>
              </div>
            </div>

            {/* Queue header */}
            <div className="queue-header-row">
              <h3>
                Diagnostic Registry &amp; Queue
                {filteredRequests.length > 0 && (
                  <span style={{ fontWeight: 400, fontSize: '.85rem', color: 'var(--cli-text-muted)', marginLeft: 10 }}>
                    {filteredRequests.length} record{filteredRequests.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <div className="search-box">
                <span className="search-icon"><Search size={15} /></span>
                <input
                  id="queue-search"
                  type="text"
                  placeholder="Patient, ID, test type, status…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Queue list */}
            {loading ? (
              <div className="global-loader-box">
                <div className="loader-spinner" />
                <span>Loading registry records…</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="empty-state fade-in">
                <div className="empty-state-icon">
                  <Inbox size={34} />
                </div>
                <h3>{searchQuery ? 'No matching records found' : 'No diagnostic requests yet'}</h3>
                <p>
                  {searchQuery
                    ? 'Try adjusting your search query or clearing the filter.'
                    : 'Submit a new TB or HIV test request to get started.'}
                </p>
                {!searchQuery && session.role !== 'lab' && (
                  <button
                    className={`btn-primary ${session.role === 'tb' ? 'tb-theme' : 'hiv-theme'}`}
                    style={{ marginTop: 8 }}
                    onClick={() => setActiveForm(session.role === 'tb' ? 'tb-request' : 'hiv-request')}
                  >
                    <Plus size={15} />
                    Create First Request
                  </button>
                )}
              </div>
            ) : (
              <div className="queue-list">
                {filteredRequests.map(req => {
                  const isCompleted = req.status === 'Completed';
                  const isExpanded  = expandedRequestId === req.id;

                  return (
                    <div key={req.id} className="queue-wrapper-card">
                      <div className={`queue-card type-${req.type}`}>
                        <div className="card-left">
                          <div className={`test-badge-type ${req.type}`}>{req.type}</div>
                          <div className="patient-info-summary">
                            <h4>{req.patient_name}</h4>
                            <div className="meta-row">
                              <span className="meta-item">ID: <strong>{req.patient_id || 'N/A'}</strong></span>
                              <span className="meta-dot" />
                              <span className="meta-item">Test: <strong>{req.sub_type}</strong></span>
                              <span className="meta-dot" />
                              <span className="meta-item">
                                <strong>{new Date(req.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="card-right">
                          <span className={`status-indicator ${req.status.replace(/ /g, '-')}`}>
                            {req.status}
                          </span>

                          {session.role === 'lab' ? (
                            <div className="lab-action-group">
                              {req.status === 'Pending Sample' && (
                                <button id={`receive-${req.id}`} className="btn-action-small receive" onClick={() => handleReceiveSample(req.id)}>
                                  Receive Sample
                                </button>
                              )}
                              {req.status === 'Sample Received' && (
                                <button id={`start-test-${req.id}`} className="btn-action-small test" onClick={() => handleStartTesting(req.id)}>
                                  Start Test
                                </button>
                              )}
                              {req.status === 'Testing' && (
                                <button id={`upload-${req.id}`} className="btn-action-small results" onClick={() => handleOpenResultsForm(req)}>
                                  Upload Results
                                </button>
                              )}
                              {isCompleted && (
                                <button id={`view-lab-${req.id}`} className="btn-action-small view" onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}>
                                  {isExpanded ? 'Hide' : 'View Results'}
                                </button>
                              )}
                            </div>
                          ) : (
                            isCompleted && (
                              <button id={`view-cli-${req.id}`} className="btn-action-small view" onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}>
                                {isExpanded ? 'Hide' : 'Check Results'}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Expandable results panel */}
                      {isCompleted && isExpanded && (
                        <div className="results-preview-card">
                          <div className="rp-header">
                            <FileText size={16} />
                            Laboratory Diagnostic Report
                          </div>

                          {req.type === 'TB' ? (
                            <div className="preview-grid">
                              <div className="preview-item">
                                <label>Lab Serial No.</label>
                                <span>{req.results.labSerialNumber}</span>
                              </div>
                              <div className="preview-item">
                                <label>Macroscopic Appearance</label>
                                <span>{req.results.macroscopicExamination}</span>
                              </div>

                              {req.results.geneXpertResult && (
                                <div className="preview-item">
                                  <label>GeneXpert Ultra Result</label>
                                  <span className={req.results.geneXpertResult?.includes('detected') && !req.results.geneXpertResult?.includes('not') ? 'alert-pos' : 'alert-neg'}>
                                    {req.results.geneXpertResult}
                                  </span>
                                </div>
                              )}

                              {req.results.microscopySamples?.[0]?.result && req.results.microscopySamples[0].result !== 'Not Done' && (
                                <div className="preview-item">
                                  <label>ZN Microscopy Smear 1</label>
                                  <span className={req.results.microscopySamples[0].result === 'Positive' ? 'alert-pos' : 'alert-neg'}>
                                    {req.results.microscopySamples[0].result}
                                    {req.results.microscopySamples[0].grading && ` (${req.results.microscopySamples[0].grading})`}
                                  </span>
                                </div>
                              )}

                              {req.results.urineLamResult && req.results.urineLamResult !== 'Not Done' && (
                                <div className="preview-item">
                                  <label>Urine LAM Result</label>
                                  <span className={req.results.urineLamResult === 'Positive' ? 'alert-pos' : 'alert-neg'}>
                                    {req.results.urineLamResult}
                                  </span>
                                </div>
                              )}

                              {req.results.reflexResults && (
                                <div className="preview-item" style={{ gridColumn: '1/-1' }}>
                                  <label>Reflex XDR Drug Resistance Panel</label>
                                  <div style={{ marginTop: 6 }}>
                                    {req.results.reflexResults.map((ref: any, i: number) => (
                                      <span key={i} className={`drug-tag ${ref.result === 'Resistant' ? 'resistant' : 'sensitive'}`}>
                                        {ref.drug}: {ref.result}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="preview-item" style={{ gridColumn: '1/-1' }}>
                                <label>Clinical Comments</label>
                                <span>{req.results.comment || '—'}</span>
                              </div>
                              <div className="preview-item">
                                <label>Reviewed By</label>
                                <span>{req.results.reviewedBy}</span>
                              </div>
                              <div className="preview-item">
                                <label>Report Signed</label>
                                <span>{req.results.reviewedDate ? new Date(req.results.reviewedDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="preview-grid">
                              <div className="preview-item">
                                <label>Lab Serial No.</label>
                                <span>{req.results.labSerialNumber}</span>
                              </div>
                              <div className="preview-item">
                                <label>Date Processed</label>
                                <span>{req.results.dateProcessed ? new Date(req.results.dateProcessed).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
                              </div>

                              {req.sub_type === 'EID' ? (
                                <div className="preview-item">
                                  <label>Infant DNA-PCR Result</label>
                                  <span className={req.results.eidDnaPcrResult === 'Positive' ? 'alert-pos' : 'alert-neg'}>
                                    {req.results.eidDnaPcrResult}
                                  </span>
                                </div>
                              ) : (
                                <>
                                  <div className="preview-item">
                                    <label>Viral Load copies/mL</label>
                                    <span className={req.results.viralLoadValueType === 'Undetectable' ? 'alert-neg' : 'alert-pos'}>
                                      {req.results.viralLoadValueType === 'Undetectable'
                                        ? 'Target Undetectable (< 20 copies)'
                                        : `${req.results.viralLoadCopies?.toLocaleString()} copies/mL`}
                                    </span>
                                  </div>
                                  {req.results.viralLoadValueType === 'Numerical' && (
                                    <div className="preview-item">
                                      <label>Log₁₀ copies</label>
                                      <span>{req.results.viralLoadLogValue}</span>
                                    </div>
                                  )}
                                </>
                              )}

                              <div className="preview-item" style={{ gridColumn: '1/-1' }}>
                                <label>Clinical Comments</label>
                                <span>{req.results.comment || '—'}</span>
                              </div>
                              <div className="preview-item">
                                <label>Performed By</label>
                                <span>{req.results.performedBy}</span>
                              </div>
                              <div className="preview-item">
                                <label>Status</label>
                                <span style={{ color: '#059669', fontWeight: 700 }}>✓ Approved &amp; SMS Dispatched</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* SMS Simulator */}
      <SmsSimulator sms={smsDetails} onClose={() => setSmsDetails(null)} />
    </div>
  );
}
