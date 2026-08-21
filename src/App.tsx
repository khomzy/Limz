import { useState, useEffect, useRef } from 'react';
import type { LimsRequest, UserSession, TestType } from './types';
import { LimsDbService, supabase } from './supabaseClient';
import TBRequestForm from './components/TBRequestForm';
import HIVRequestForm from './components/HIVRequestForm';
import HaematologyRequestForm from './components/HaematologyRequestForm';
import ChemistryRequestForm from './components/ChemistryRequestForm';
import ResultEntryForm from './components/ResultEntryForm';
import SmsSimulator from './components/SmsSimulator';
import TestTypeModal from './components/TestTypeModal';
import LabEquipmentDashboard from './components/LabEquipmentDashboard';
import PublicSite from './components/PublicSite';
import {
  LogOut,
  Plus,
  FileText,
  FlaskConical,
  CheckCircle2,
  ClipboardList,
  Search,
  Clock,
  Inbox,
  Printer,
  Cpu
} from 'lucide-react';
import './App.css';

export default function App() {
  const [session, setSession]           = useState<UserSession | null>(null);
  const [showLogin, setShowLogin]       = useState(false);
  const [facilityIdInput, setFacilityIdInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe]     = useState(false);
  const [loginError, setLoginError]     = useState('');
  const [loading, setLoading]           = useState(false);

  const [requests, setRequests]                   = useState<LimsRequest[]>([]);
  const [searchQuery, setSearchQuery]             = useState('');
  const [activeForm, setActiveForm]               = useState<'none'|'tb-request'|'hiv-request'|'haematology-request'|'chemistry-request'|'result-entry'>('none');
  const [selectedRequest, setSelectedRequest]     = useState<LimsRequest | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [showTestTypeModal, setShowTestTypeModal] = useState(false);
  const [showEquipmentHub, setShowEquipmentHub]   = useState(false);

  // Department filter for lab queue
  const [activeDeptFilter, setActiveDeptFilter] = useState<'All' | 'Molecular' | 'Haematology' | 'Chemistry'>('All');

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
      const data = await LimsDbService.getRequests(userSession);
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
  useEffect(() => {
    let active = true;
    LimsDbService.restoreSession()
      .then(restored => {
        if (!active || !restored) return;
        setSession(restored);
        loadRequests(restored);
      })
      .catch(error => console.warn('Stored Medicy session could not be restored:', error));
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      setLoading(true);
      const userSession = await LimsDbService.login(facilityIdInput, usernameInput, passwordInput, rememberMe);
      setSession(userSession);
      setShowLogin(false);
      await loadRequests(userSession);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await LimsDbService.logout();
    setSession(null);
    setRequests([]);
    setFacilityIdInput('');
    setUsernameInput('');
    setPasswordInput('');
    setRememberMe(false);
    setActiveForm('none');
    setSelectedRequest(null);
    setShowEquipmentHub(false);
  };

  // ── Clinician actions ─────────────────────────────────────────────────────
  const handleRequestSubmit = async (
    subType: string, patientName: string, patientId: string, phone: string,
    patientDetails: any, requestDetails: any, sampleDetails: any
  ) => {
    if (!session) return;
    try {
      setLoading(true);
      let testType: TestType = 'TB';
      if (activeForm === 'hiv-request') testType = 'HIV';
      else if (activeForm === 'haematology-request') testType = 'Haematology';
      else if (activeForm === 'chemistry-request') testType = 'Chemistry';

      const isAllowed = session.role === 'lab'
        || (session.role === 'tb' && testType === 'TB')
        || (session.role === 'hiv' && testType === 'HIV')
        || (session.role === 'clinician' && (testType === 'Haematology' || testType === 'Chemistry'));
      if (!isAllowed) throw new Error('This test workflow is not available for your assigned role.');

      await LimsDbService.createRequest(
        testType, subType, session.email, patientName, patientId, phone,
        patientDetails, requestDetails, sampleDetails, session
      );

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

  const handleResultSubmit = async (results: any) => {
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

  // ── Derived data filters ──────────────────────────────────────────────────
  const filteredRequests = requests.filter(r => {
    // 1. Department filter
    if (session?.role === 'lab' && activeDeptFilter !== 'All') {
      if (r.department !== activeDeptFilter) return false;
    }

    // 2. Search query filter
    const q = searchQuery.toLowerCase().trim();
    return !q || r.patient_name.toLowerCase().includes(q) ||
      (r.patient_id && r.patient_id.toLowerCase().includes(q)) ||
      r.status.toLowerCase().includes(q) ||
      r.sub_type.toLowerCase().includes(q) ||
      r.type.toLowerCase().includes(q);
  });

  const statTotal     = requests.length;
  const statPending   = requests.filter(r => r.status === 'Pending Sample').length;
  const statTesting   = requests.filter(r => r.status === 'Testing' || r.status === 'Sample Received').length;
  const statCompleted = requests.filter(r => r.status === 'Completed').length;

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleNewRequest = () => {
    if (!session) return;
    if (session.role === 'tb') setActiveForm('tb-request');
    else if (session.role === 'hiv') setActiveForm('hiv-request');
    else setShowTestTypeModal(true);
  };

  const roleLabel = session?.role === 'lab' ? 'Laboratory'
    : session?.role === 'tb' ? 'TB programme'
    : session?.role === 'hiv' ? 'HIV programme'
    : 'Clinical';
  const dashboardTitle = session?.role === 'tb' ? 'TB diagnostic workflow'
    : session?.role === 'hiv' ? 'HIV viral load & EID workflow'
    : session?.role === 'lab' ? 'Laboratory operations'
    : 'Clinical diagnostics';

  // ── PUBLIC WEBSITE / LOGIN ─────────────────────────────────────────────────
  if (!session) {
    return (
      <PublicSite
        showLogin={showLogin}
        facilityId={facilityIdInput}
        username={usernameInput}
        password={passwordInput}
        rememberMe={rememberMe}
        loading={loading}
        loginError={loginError}
        onShowLogin={() => { setLoginError(''); setShowLogin(true); }}
        onHideLogin={() => setShowLogin(false)}
        onFacilityIdChange={setFacilityIdInput}
        onUsernameChange={setUsernameInput}
        onPasswordChange={setPasswordInput}
        onRememberMeChange={setRememberMe}
        onLogin={handleLogin}
      />
    );
  }

  // ── MAIN DASHBOARD ────────────────────────────────────────────────────────
  return (
    <div className="lims-app-wrapper">

      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo-mark">🔬</div>
          <div className="navbar-brand-text">
            <span className="brand-name">Medicy</span>
            <span className="brand-sub">{session.facility}</span>
          </div>
          <span className="brand-badge">{roleLabel}</span>
        </div>

        <div className="navbar-right">
          {session.role === 'lab' && (
            <button
              className="btn-secondary"
              onClick={() => setShowEquipmentHub(!showEquipmentHub)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: showEquipmentHub ? '1px solid #3b82f6' : undefined }}
            >
              <Cpu size={14} />
              {showEquipmentHub ? 'View Queue' : 'Equipment Connect'}
            </button>
          )}

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

        {/* Test type picker modal */}
        {showTestTypeModal && (
          <TestTypeModal
            allowedTypes={session.role === 'clinician' ? ['Haematology', 'Chemistry'] : undefined}
            onSelect={(type) => {
              setShowTestTypeModal(false);
              if (type === 'TB') setActiveForm('tb-request');
              else if (type === 'HIV') setActiveForm('hiv-request');
              else if (type === 'Haematology') setActiveForm('haematology-request');
              else if (type === 'Chemistry') setActiveForm('chemistry-request');
            }}
            onClose={() => setShowTestTypeModal(false)}
          />
        )}

        {/* Overlay forms */}
        {activeForm === 'tb-request' && (
          <TBRequestForm facility={session.facility} onSubmit={handleRequestSubmit} onCancel={() => setActiveForm('none')} />
        )}
        {activeForm === 'hiv-request' && (
          <HIVRequestForm facility={session.facility} onSubmit={handleRequestSubmit} onCancel={() => setActiveForm('none')} />
        )}
        {activeForm === 'haematology-request' && (
          <HaematologyRequestForm facility={session.facility} onSubmit={handleRequestSubmit} onCancel={() => setActiveForm('none')} />
        )}
        {activeForm === 'chemistry-request' && (
          <ChemistryRequestForm facility={session.facility} onSubmit={handleRequestSubmit} onCancel={() => setActiveForm('none')} />
        )}
        {activeForm === 'result-entry' && selectedRequest && (
          <ResultEntryForm
            request={selectedRequest}
            onSubmit={handleResultSubmit}
            onCancel={() => { setActiveForm('none'); setSelectedRequest(null); }}
          />
        )}

        {/* Main dashboard view */}
        {activeForm === 'none' && (
          <div className="dashboard-main fade-in">

            {/* Hero header */}
            <div className="dashboard-hero">
              <div className="dashboard-hero-text">
                <h1>{dashboardTitle}</h1>
                <p>Welcome, <strong>{session.name}</strong>. {session.facility} diagnostic records are ready.</p>
              </div>

              <div className="action-grid">
                {session.role === 'lab' ? (
                  <button id="register-case" className="btn-primary" onClick={handleNewRequest}>
                    <Plus size={16} />
                    Register New Case
                  </button>
                ) : (
                  <button id="new-request" className="btn-primary" onClick={handleNewRequest}>
                    <Plus size={16} />
                    {session.role === 'tb' ? 'Request TB Test' : session.role === 'hiv' ? 'Request HIV VL / EID' : 'Order Diagnostics'}
                  </button>
                )}
              </div>
            </div>

            {/* Equipment Hub View Mode */}
            {session.role === 'lab' && showEquipmentHub ? (
              <LabEquipmentDashboard requests={requests} />
            ) : (
              <>
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

                {/* Department filter tabs (Lab role only) */}
                {session.role === 'lab' && (
                  <div className="dept-filter-tabs">
                    {(['All', 'Molecular', 'Haematology', 'Chemistry'] as const).map(tab => (
                      <button
                        key={tab}
                        className={`dept-tab-btn ${activeDeptFilter === tab ? 'active' : ''}`}
                        onClick={() => setActiveDeptFilter(tab)}
                      >
                        {tab === 'Molecular' ? '🧬 Molecular' : tab === 'Haematology' ? '🩸 Haematology' : tab === 'Chemistry' ? '⚗️ Chemistry' : '🌍 All'}
                      </button>
                    ))}
                  </div>
                )}

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
                        : 'Submit a new test request to get started.'}
                    </p>
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
                              <div className={`test-badge-type ${req.type}`}>{req.type === 'Haematology' ? 'HAEM' : req.type === 'Chemistry' ? 'CHEM' : req.type}</div>
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--cli-border)', paddingBottom: 12 }}>
                                <div className="rp-header" style={{ border: 'none', margin: 0, padding: 0 }}>
                                  <FileText size={16} />
                                  Medicy Laboratory Diagnostic Report
                                </div>
                                <button
                                  className="btn-secondary"
                                  onClick={() => window.print()}
                                  style={{ padding: '6px 12px', fontSize: '.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <Printer size={14} /> Print Report
                                </button>
                              </div>

                              {req.type === 'TB' && (
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
                                  <div className="preview-item">
                                    <label>Microscopy Smear 1</label>
                                    <span>{req.results.microscopySamples?.[0]?.result || 'Not Done'}</span>
                                  </div>
                                  <div className="preview-item" style={{ gridColumn: '1/-1' }}>
                                    <label>Clinical Comments</label>
                                    <span>{req.results.comment || '—'}</span>
                                  </div>
                                  <div className="preview-item">
                                    <label>Performed By</label>
                                    <span>{req.results.geneXpertPerformedBy || '—'}</span>
                                  </div>
                                </div>
                              )}

                              {req.type === 'HIV' && (
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
                                    <div className="preview-item">
                                      <label>Viral Load copies/mL</label>
                                      <span className={req.results.viralLoadValueType === 'Undetectable' ? 'alert-neg' : 'alert-pos'}>
                                        {req.results.viralLoadValueType === 'Undetectable'
                                          ? 'Target Undetectable (< 20 copies)'
                                          : `${req.results.viralLoadCopies?.toLocaleString()} copies/mL`}
                                      </span>
                                    </div>
                                  )}
                                  <div className="preview-item" style={{ gridColumn: '1/-1' }}>
                                    <label>Clinical Comments</label>
                                    <span>{req.results.comment || '—'}</span>
                                  </div>
                                </div>
                              )}

                              {req.type === 'Haematology' && (
                                <div className="preview-grid">
                                  <div className="preview-item">
                                    <label>Lab Serial No.</label>
                                    <span>{req.results.labSerialNumber}</span>
                                  </div>
                                  <div className="preview-item">
                                    <label>Date Received</label>
                                    <span>{req.results.dateReceived ? new Date(req.results.dateReceived).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
                                  </div>

                                  {req.results.fbc && (
                                    <div className="preview-item" style={{ gridColumn: '1/-1', marginTop: 12 }}>
                                      <label style={{ fontSize: '.8rem', color: 'var(--lab-text-title)', fontWeight: 700, marginBottom: 8 }}>FBC Parameters</label>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, background: 'rgba(255,255,255,.02)', padding: 12, borderRadius: 8, border: '1px solid var(--cli-border)' }}>
                                        <div>WBC: <strong>{req.results.fbc.wbc}</strong> 10^9/L</div>
                                        <div>RBC: <strong>{req.results.fbc.rbc}</strong> 10^12/L</div>
                                        <div>Hb: <strong style={{ color: (req.results.fbc.haemoglobin !== undefined && req.results.fbc.haemoglobin < 11.5) ? '#f43f5e' : 'inherit' }}>{req.results.fbc.haemoglobin} g/dL</strong></div>
                                        <div>Platelets: <strong>{req.results.fbc.platelets}</strong> 10^9/L</div>
                                        <div>HCT: <strong>{req.results.fbc.haematocrit}%</strong></div>
                                      </div>
                                      {req.results.fbc.interpretation && (
                                        <div style={{ marginTop: 8, fontSize: '.8rem', color: '#93c5fd' }}>
                                          Interpretation: <em>{req.results.fbc.interpretation}</em>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {req.results.malariaSmear && (
                                    <div className="preview-item">
                                      <label>Thin Blood Smear (Malaria)</label>
                                      <span className={req.results.malariaSmear !== 'Negative' ? 'alert-pos' : 'alert-neg'}>
                                        {req.results.malariaSmear}
                                        {req.results.malariaParasitaemia && ` (${req.results.malariaParasitaemia})`}
                                      </span>
                                    </div>
                                  )}

                                  {req.results.mrdtResult && (
                                    <div className="preview-item">
                                      <label>mRDT Result</label>
                                      <span className={req.results.mrdtResult === 'Positive' ? 'alert-pos' : 'alert-neg'}>
                                        {req.results.mrdtResult}
                                        {req.results.mrdtAntigen && ` (${req.results.mrdtAntigen})`}
                                      </span>
                                    </div>
                                  )}

                                  <div className="preview-item" style={{ gridColumn: '1/-1' }}>
                                    <label>Clinical Comments</label>
                                    <span>{req.results.comment || '—'}</span>
                                  </div>
                                </div>
                              )}

                              {req.type === 'Chemistry' && (
                                <div className="preview-grid">
                                  <div className="preview-item">
                                    <label>Lab Serial No.</label>
                                    <span>{req.results.labSerialNumber}</span>
                                  </div>
                                  <div className="preview-item">
                                    <label>Date Received</label>
                                    <span>{req.results.dateReceived ? new Date(req.results.dateReceived).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</span>
                                  </div>

                                  {req.results.kft && (
                                    <div className="preview-item" style={{ gridColumn: '1/-1', marginTop: 12 }}>
                                      <label style={{ fontSize: '.8rem', color: 'var(--lab-text-title)', fontWeight: 700, marginBottom: 8 }}>Renal Function Test (KFT)</label>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, background: 'rgba(255,255,255,.02)', padding: 12, borderRadius: 8, border: '1px solid var(--cli-border)' }}>
                                        <div>Urea: <strong>{req.results.kft.urea} mmol/L</strong></div>
                                        <div>Creatinine: <strong style={{ color: (req.results.kft.creatinine !== undefined && req.results.kft.creatinine > 110) ? '#f43f5e' : 'inherit' }}>{req.results.kft.creatinine} µmol/L</strong></div>
                                        <div>eGFR: <strong>{req.results.kft.egfr} mL/min</strong></div>
                                        <div>Sodium: <strong>{req.results.kft.sodiumNa} mmol/L</strong></div>
                                        <div>Potassium: <strong>{req.results.kft.potassiumK} mmol/L</strong></div>
                                      </div>
                                    </div>
                                  )}

                                  {req.results.lft && (
                                    <div className="preview-item" style={{ gridColumn: '1/-1', marginTop: 12 }}>
                                      <label style={{ fontSize: '.8rem', color: 'var(--lab-text-title)', fontWeight: 700, marginBottom: 8 }}>Liver Function Test (LFT)</label>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, background: 'rgba(255,255,255,.02)', padding: 12, borderRadius: 8, border: '1px solid var(--cli-border)' }}>
                                        <div>ALT: <strong>{req.results.lft.alt} U/L</strong></div>
                                        <div>AST: <strong>{req.results.lft.ast} U/L</strong></div>
                                        <div>ALP: <strong>{req.results.lft.alp} U/L</strong></div>
                                        <div>Total Protein: <strong>{req.results.lft.totalProtein} g/L</strong></div>
                                        <div>Albumin: <strong>{req.results.lft.albumin} g/L</strong></div>
                                      </div>
                                    </div>
                                  )}

                                  {req.results.lipids && (
                                    <div className="preview-item" style={{ gridColumn: '1/-1', marginTop: 12 }}>
                                      <label style={{ fontSize: '.8rem', color: 'var(--lab-text-title)', fontWeight: 700, marginBottom: 8 }}>Lipid Profile</label>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, background: 'rgba(255,255,255,.02)', padding: 12, borderRadius: 8, border: '1px solid var(--cli-border)' }}>
                                        <div>Total Chol: <strong>{req.results.lipids.totalCholesterol} mmol/L</strong></div>
                                        <div>LDL: <strong>{req.results.lipids.ldl} mmol/L</strong></div>
                                        <div>HDL: <strong>{req.results.lipids.hdl} mmol/L</strong></div>
                                        <div>Triglycerides: <strong>{req.results.lipids.triglycerides} mmol/L</strong></div>
                                      </div>
                                    </div>
                                  )}

                                  {req.results.hpylori && (
                                    <div className="preview-item">
                                      <label>H. pylori Assay</label>
                                      <span className={req.results.hpylori.result === 'Positive' ? 'alert-pos' : 'alert-neg'}>
                                        {req.results.hpylori.result} ({req.results.hpylori.method})
                                      </span>
                                    </div>
                                  )}

                                  <div className="preview-item" style={{ gridColumn: '1/-1' }}>
                                    <label>Clinical Comments</label>
                                    <span>{req.results.comment || '—'}</span>
                                  </div>
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: 20, marginTop: 16, borderTop: '1px dashed var(--cli-border)', paddingTop: 12, fontSize: '.78rem', color: 'var(--cli-text-muted)' }}>
                                <span>Report generated on: {new Date().toLocaleString()}</span>
                                <span>Source: Medicy Diagnostic Network</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

          </div>
        )}
      </div>

      {/* SMS Simulator */}
      <SmsSimulator sms={smsDetails} onClose={() => setSmsDetails(null)} />
    </div>
  );
}
