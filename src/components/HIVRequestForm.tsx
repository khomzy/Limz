import React, { useState, useEffect } from 'react';
import type { HivPatientDetails, HivRequestDetails, HivSampleDetails } from '../types';
import { User, Activity, UserCheck, Heart, AlertCircle, Layers } from 'lucide-react';
import WizardOverlay from './WizardOverlay';

interface HIVRequestFormProps {
  onSubmit: (subType: string, patientName: string, patientId: string, phone: string, patientDetails: HivPatientDetails, requestDetails: HivRequestDetails, sampleDetails: HivSampleDetails) => void;
  onCancel: () => void;
}

const ART_REGIMENS_PAEDIATRIC = ['0P', '2P', '4P', '9P', '11P', '14P', '15P', '16P'];
const ART_REGIMENS_ADULT = ['0A', '2A', '4A', '5A', '6A', '7A', '8A', '9A', '10A', '11A', '12A', '13A', '14A', '15A', 'NS'];

export default function HIVRequestForm({ onSubmit, onCancel }: HIVRequestFormProps) {
  // ── Demographics ──────────────────────────────────────────────────────
  const [surname, setSurname]             = useState('');
  const [firstName, setFirstName]         = useState('');
  const [patientId, setPatientId]         = useState('');
  const [dateOfBirth, setDateOfBirth]     = useState('');
  const [genderPregBf, setGenderPregBf]   = useState<HivPatientDetails['genderPregBf']>('Female Non-Preg/Bf');
  const [phone, setPhone]                 = useState('');
  const [ageMonths, setAgeMonths]         = useState<number | null>(null);

  // ── Test Type ─────────────────────────────────────────────────────────
  const [testType, setTestType]           = useState<'EID' | 'Viral Load'>('Viral Load');

  // ── EID Specifics ─────────────────────────────────────────────────────
  const [eidReason, setEidReason]         = useState<HivRequestDetails['eidReason']>('EID initial');
  const [motherSurname, setMotherSurname] = useState('');
  const [motherFirstName, setMotherFirstName] = useState('');
  const [uniqueChildId, setUniqueChildId] = useState('');

  // ── Viral Load Specifics ──────────────────────────────────────────────
  const [viralLoadReason, setViralLoadReason] = useState<HivRequestDetails['viralLoadReason']>('Routine');
  const [artInitiationDate, setArtInitiationDate] = useState('');
  const [sampleType, setSampleType]       = useState<'DBS' | 'Plasma'>('Plasma');
  const [currentArtRegimen, setCurrentArtRegimen] = useState('5A');

  // ── Collector / Clinician ─────────────────────────────────────────────
  const [dateDrawn, setDateDrawn]         = useState(new Date().toISOString().split('T')[0]);
  const [collectorSurname, setCollectorSurname] = useState('');
  const [collectorFirstName, setCollectorFirstName] = useState('');
  const [collectorPhone, setCollectorPhone] = useState('');
  const [htcProviderId, setHtcProviderId] = useState('');
  const [clinicianName, setClinicianName] = useState('');
  const [clinicianPhone, setClinicianPhone] = useState('');
  const [notifyClinicianSms, setNotifyClinicianSms] = useState(true);

  // ── UI State ──────────────────────────────────────────────────────────
  const [errors, setErrors]               = useState<string[]>([]);
  const [wizardMode, setWizardMode]       = useState<boolean>(() => {
    return localStorage.getItem('lims_hiv_mode') === 'wizard';
  });
  const [wizardStep, setWizardStep]       = useState(0);

  const toggleMode = () => {
    const next = !wizardMode;
    setWizardMode(next);
    localStorage.setItem('lims_hiv_mode', next ? 'wizard' : 'form');
    setWizardStep(0);
  };

  // ── Smart automations ─────────────────────────────────────────────────
  useEffect(() => {
    if (!dateOfBirth) return;
    const dob = new Date(dateOfBirth);
    const now = new Date();
    let m = (now.getFullYear() - dob.getFullYear()) * 12;
    m -= dob.getMonth();
    m += now.getMonth();
    if (now.getDate() < dob.getDate()) m--;
    const mo = Math.max(0, m);
    setAgeMonths(mo);
    if (mo < 24) { setTestType('EID'); setSampleType('DBS'); }
    else          { setTestType('Viral Load'); setSampleType('Plasma'); }
  }, [dateOfBirth]);

  // ── Submit logic ──────────────────────────────────────────────────────
  const doSubmit = () => {
    const newErrors: string[] = [];
    if (!surname.trim())    newErrors.push('Patient Surname is required.');
    if (!firstName.trim())  newErrors.push('Patient First Name is required.');
    if (!patientId.trim())  newErrors.push('Patient ID / ART Number is required.');
    if (!dateOfBirth)       newErrors.push('Date of Birth is required.');
    if (!phone.trim())      newErrors.push('Patient/Guardian phone number is required.');
    if (testType === 'EID' && !uniqueChildId.trim()) newErrors.push('Unique Child ID is required for EID.');
    if (newErrors.length > 0) { setErrors(newErrors); return; }
    setErrors([]);

    const patientDetails: HivPatientDetails = { surname, firstName, patientId, dateOfBirth, genderPregBf, phone };
    const requestDetails: HivRequestDetails = {
      testType,
      eidReason:       testType === 'EID'        ? eidReason       : undefined,
      viralLoadReason: testType === 'Viral Load'  ? viralLoadReason : undefined,
      motherSurname:   testType === 'EID'        ? motherSurname   : undefined,
      motherFirstName: testType === 'EID'        ? motherFirstName : undefined,
      uniqueChildId:   testType === 'EID'        ? uniqueChildId   : undefined
    };
    const sampleDetails: HivSampleDetails = {
      dateDrawn, sampleType,
      artInitiationDate: testType === 'Viral Load' ? artInitiationDate : undefined,
      currentArtRegimen: testType === 'Viral Load' ? currentArtRegimen : undefined,
      collectorSurname:   collectorSurname   || clinicianName,
      collectorFirstName: collectorFirstName || '',
      collectorPhone:     collectorPhone     || clinicianPhone,
      htcProviderId,
      clinicianName:      clinicianName      || undefined,
      clinicianPhone:     clinicianPhone     || undefined,
      notifyClinicianSms
    } as any;

    onSubmit(testType, `${firstName} ${surname}`, patientId, phone, patientDetails, requestDetails, sampleDetails);
  };

  const handleFormSubmit = (e: React.FormEvent) => { e.preventDefault(); doSubmit(); };

  // ── Wizard step definitions ───────────────────────────────────────────
  const STEP_NAME = {
    title: 'Patient Name',
    subtitle: "Enter the patient's first name and surname",
    requiredCheck: () => {
      const m: string[] = [];
      if (!firstName.trim()) m.push('First Name');
      if (!surname.trim())   m.push('Surname');
      return m;
    },
    fields: (
      <>
        <div className="input-group">
          <label>First Name <span className="req">*</span></label>
          <input type="text" placeholder="e.g. Chisomo" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus />
        </div>
        <div className="input-group">
          <label>Surname <span className="req">*</span></label>
          <input type="text" placeholder="e.g. Phiri" value={surname} onChange={e => setSurname(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Patient ID / ART Number <span className="req">*</span></label>
          <input type="text" placeholder="e.g. ZA-99281-91" value={patientId} onChange={e => setPatientId(e.target.value)} />
        </div>
      </>
    )
  };

  const STEP_DOB_GENDER = {
    title: 'Date of Birth & Gender',
    subtitle: 'Used to auto-suggest EID vs Viral Load test type',
    requiredCheck: () => {
      const m: string[] = [];
      if (!dateOfBirth) m.push('Date of Birth');
      return m;
    },
    fields: (
      <>
        <div className="input-group">
          <label>Date of Birth <span className="req">*</span></label>
          <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          {ageMonths !== null && (
            <span className="input-feedback-alert">
              Age: {ageMonths < 24 ? `${ageMonths} months (infant — EID recommended)` : `${Math.floor(ageMonths / 12)} years`}
            </span>
          )}
        </div>
        <div className="input-group">
          <label>Gender / Pregnancy Status</label>
          <div className="radio-pill-group">
            {(['Male', 'Female Non-Preg/Bf', 'Female Pregnant', 'Female Breastfeeding'] as const).map(v => (
              <label key={v} className={`radio-pill ${genderPregBf === v ? 'active' : ''}`}>
                <input type="radio" name="wiz-gender" value={v} checked={genderPregBf === v} onChange={() => setGenderPregBf(v)} />
                {v === 'Male' ? 'Male' : v === 'Female Non-Preg/Bf' ? 'Female (Non-Preg)' : v === 'Female Pregnant' ? 'Pregnant' : 'Breastfeeding'}
              </label>
            ))}
          </div>
        </div>
      </>
    )
  };

  const STEP_CONTACT = {
    title: 'Patient Contact',
    subtitle: 'Phone number for SMS result notifications',
    requiredCheck: () => {
      const m: string[] = [];
      if (!phone.trim()) m.push('Phone Number');
      return m;
    },
    fields: (
      <>
        <div className="input-group">
          <label>Patient / Guardian Phone <span className="req">*</span></label>
          <input type="tel" placeholder="e.g. 0999876543" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
          <span className="input-help">Results SMS will be sent to this number via AfricasTalking</span>
        </div>
      </>
    )
  };

  const STEP_TEST_TYPE = {
    title: 'Test Type',
    subtitle: 'Select EID (infants under 24 months) or Viral Load (adults)',
    requiredCheck: () => [],
    fields: (
      <>
        <div className="test-type-toggle">
          <button type="button"
            className={`test-toggle-btn ${testType === 'EID' ? 'active EID' : ''}`}
            onClick={() => { setTestType('EID'); setSampleType('DBS'); }}>
            🧒 Early Infant Diagnosis (EID)
            {ageMonths !== null && ageMonths < 24 && <span className="auto-suggest-tag">Recommended for age</span>}
          </button>
          <button type="button"
            className={`test-toggle-btn ${testType === 'Viral Load' ? 'active VL' : ''}`}
            onClick={() => { setTestType('Viral Load'); setSampleType('Plasma'); }}>
            📊 Viral Load (VL)
            {ageMonths !== null && ageMonths >= 24 && <span className="auto-suggest-tag">Recommended for age</span>}
          </button>
        </div>

        {testType === 'EID' ? (
          <div className="form-sub-section eid-border animate-slide-in">
            <h4>EID Details</h4>
            <div className="form-grid">
              <div className="input-group full-width">
                <label>Reason for EID</label>
                <select value={eidReason} onChange={e => setEidReason(e.target.value as any)}>
                  <option value="EID initial">EID Initial (6 weeks / 12 months)</option>
                  <option value="Confirmatory DNA-PCR">Confirmatory after positive DNA-PCR</option>
                  <option value="Confirmatory rapid test">Confirmatory after positive rapid test</option>
                  <option value="Tie-breaker">Tie-breaker (inconclusive rapid tests)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Mother's Surname</label>
                <input type="text" placeholder="Mother's surname" value={motherSurname} onChange={e => setMotherSurname(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Mother's First Name</label>
                <input type="text" placeholder="Mother's first name" value={motherFirstName} onChange={e => setMotherFirstName(e.target.value)} />
              </div>
              <div className="input-group full-width">
                <label>Unique Child ID (Exposed Child Card) <span className="req">*</span></label>
                <input type="text" placeholder="e.g. EC-7728-EID" value={uniqueChildId} onChange={e => setUniqueChildId(e.target.value)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="form-sub-section vl-border animate-slide-in">
            <h4>Viral Load Details</h4>
            <div className="form-grid">
              <div className="input-group full-width">
                <label>Reason for VL</label>
                <select value={viralLoadReason} onChange={e => setViralLoadReason(e.target.value as any)}>
                  <option value="Routine">Routine monitoring</option>
                  <option value="Targeted">Targeted (suspected treatment failure)</option>
                  <option value="Follow-up after high VL">Follow-up after high VL</option>
                  <option value="Repeat">Repeat (previous sample rejected)</option>
                </select>
              </div>
              <div className="input-group">
                <label>ART Initiation Date</label>
                <input type="date" value={artInitiationDate} onChange={e => setArtInitiationDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Sample Type</label>
                <div className="toggle-pill-group">
                  <button type="button" className={`toggle-pill ${sampleType === 'Plasma' ? 'active' : ''}`} onClick={() => setSampleType('Plasma')}>Plasma</button>
                  <button type="button" className={`toggle-pill ${sampleType === 'DBS' ? 'active' : ''}`} onClick={() => setSampleType('DBS')}>DBS</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  };

  const STEP_REGIMEN = {
    title: 'ART Regimen',
    subtitle: testType === 'EID' ? 'Skip if not applicable (EID)' : 'Select the patient\'s current ART regimen',
    requiredCheck: () => [],
    fields: (
      <div className="input-group">
        <label>Current ART Regimen</label>
        <div className="art-regimen-box">
          <div className="regimen-header">Paediatric Regimens (P)</div>
          <div className="regimen-grid">
            {ART_REGIMENS_PAEDIATRIC.map(reg => (
              <button type="button" key={reg}
                className={`regimen-btn paediatric ${currentArtRegimen === reg ? 'selected' : ''}`}
                onClick={() => setCurrentArtRegimen(reg)}>{reg}</button>
            ))}
          </div>
          <div className="regimen-header" style={{ marginTop: 12 }}>Adult Regimens (A)</div>
          <div className="regimen-grid">
            {ART_REGIMENS_ADULT.map(reg => (
              <button type="button" key={reg}
                className={`regimen-btn adult ${currentArtRegimen === reg ? 'selected' : ''}`}
                onClick={() => setCurrentArtRegimen(reg)}>{reg}</button>
            ))}
          </div>
        </div>
      </div>
    )
  };

  const STEP_SAMPLE = {
    title: 'Sample Collection',
    subtitle: 'When was the sample drawn and by whom?',
    requiredCheck: () => [],
    fields: (
      <>
        <div className="input-group">
          <label>Date Sample Drawn</label>
          <input type="date" value={dateDrawn} onChange={e => setDateDrawn(e.target.value)} />
        </div>
        <div className="input-group">
          <label>HTC Provider / Collector ID</label>
          <input type="text" placeholder="e.g. HTC-992" value={htcProviderId} onChange={e => setHtcProviderId(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Collector First Name</label>
          <input type="text" placeholder="e.g. Limbani" value={collectorFirstName} onChange={e => setCollectorFirstName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Collector Surname</label>
          <input type="text" placeholder="e.g. Moyo" value={collectorSurname} onChange={e => setCollectorSurname(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Collector Phone</label>
          <input type="tel" placeholder="e.g. 0999876543" value={collectorPhone} onChange={e => setCollectorPhone(e.target.value)} />
        </div>
      </>
    )
  };

  const STEP_CLINICIAN = {
    title: 'Clinician & Notification',
    subtitle: 'Who is requesting this test and how should they be notified?',
    requiredCheck: () => [],
    fields: (
      <>
        <div className="input-group">
          <label>Clinician / Requestor Full Name</label>
          <input type="text" placeholder="e.g. Dr. Chisomo Banda" value={clinicianName} onChange={e => setClinicianName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Clinician Phone Number</label>
          <input type="tel" placeholder="e.g. 0888234567" value={clinicianPhone} onChange={e => setClinicianPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', background: notifyClinicianSms ? 'rgba(236,72,153,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${notifyClinicianSms ? 'rgba(236,72,153,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 10, transition: 'all .2s' }}>
            <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#ec4899', marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '.9rem', marginBottom: 3 }}>📱 Notify clinician via SMS</div>
              <div style={{ fontSize: '.78rem', color: '#64748b' }}>An SMS will be sent to the clinician phone when results are uploaded via AfricasTalking.</div>
            </div>
          </label>
        </div>
      </>
    )
  };

  const wizardSteps = [STEP_NAME, STEP_DOB_GENDER, STEP_CONTACT, STEP_TEST_TYPE, STEP_REGIMEN, STEP_SAMPLE, STEP_CLINICIAN];

  // ── WIZARD MODE ───────────────────────────────────────────────────────
  if (wizardMode) {
    return (
      <WizardOverlay
        steps={wizardSteps}
        currentStep={wizardStep}
        onNext={() => setWizardStep(s => s + 1)}
        onBack={() => {
          if (wizardStep === 0) { setWizardMode(false); localStorage.setItem('lims_hiv_mode', 'form'); }
          else setWizardStep(s => s - 1);
        }}
        onClose={() => { setWizardMode(false); localStorage.setItem('lims_hiv_mode', 'form'); onCancel(); }}
        onSubmit={doSubmit}
        isLastStep={wizardStep === wizardSteps.length - 1}
        accentColor="hiv"
        title="HIV EID / Viral Load Request"
        onStepRequiredCheck={wizardSteps[wizardStep].requiredCheck}
      />
    );
  }

  // ── FORM MODE ─────────────────────────────────────────────────────────
  return (
    <div className="lims-form-container fade-in">
      <div className="form-header-bar hiv-theme">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🩺</span>
            <div>
              <h2 style={{ margin: 0 }}>HIV EID / Viral Load Requisition</h2>
              <p>Zingwangwa Community Hospital · Ministry of Health Malawi</p>
            </div>
          </div>
        </div>
        <span className="badge">HIV EID / VL</span>
      </div>

      {errors.length > 0 && (
        <div className="form-errors-box">
          <div className="error-title"><AlertCircle size={18} /><span>Please resolve before submitting:</span></div>
          <ul>{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="lims-form">

        {/* Section 1: Patient Identification */}
        <div className="form-section">
          <h3 className="section-title"><User size={18} className="hiv-icon" /><span>1. Patient Identification</span></h3>
          <div className="form-grid">
            <div className="input-group">
              <label>First Name <span className="req">*</span></label>
              <input type="text" placeholder="Enter first name" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Surname <span className="req">*</span></label>
              <input type="text" placeholder="Enter surname" value={surname} onChange={e => setSurname(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Patient ID / ART Number <span className="req">*</span></label>
              <input type="text" placeholder="e.g. ZA-99281-91" value={patientId} onChange={e => setPatientId(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Date of Birth <span className="req">*</span></label>
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required />
              {ageMonths !== null && (
                <span className="input-feedback-alert">
                  Age: {ageMonths < 24 ? `${ageMonths} months (infant)` : `${Math.floor(ageMonths / 12)} years`}
                </span>
              )}
            </div>
            <div className="input-group full-width">
              <label>Gender / Pregnancy Status <span className="req">*</span></label>
              <div className="radio-pill-group">
                {(['Male', 'Female Non-Preg/Bf', 'Female Pregnant', 'Female Breastfeeding'] as const).map(v => (
                  <label key={v} className={`radio-pill ${genderPregBf === v ? 'active' : ''}`}>
                    <input type="radio" name="gender" value={v} checked={genderPregBf === v} onChange={() => setGenderPregBf(v)} />
                    {v === 'Male' ? 'Male' : v === 'Female Non-Preg/Bf' ? 'Female (Non-Preg/BF)' : v === 'Female Pregnant' ? 'Pregnant' : 'Breastfeeding'}
                  </label>
                ))}
              </div>
            </div>
            <div className="input-group full-width">
              <label>Patient / Guardian Phone <span className="req">*</span></label>
              <input type="tel" placeholder="e.g. 0999876543" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+]/g, ''))} required />
              <span className="input-help">AfricasTalking SMS results will be sent to this number.</span>
            </div>
          </div>
        </div>

        {/* Section 2: Test Specification */}
        <div className="form-section">
          <h3 className="section-title"><Activity size={18} className="hiv-icon" /><span>2. Test Specification &amp; Indications</span></h3>

          <div className="test-type-toggle">
            <button type="button"
              className={`test-toggle-btn ${testType === 'EID' ? 'active EID' : ''}`}
              onClick={() => { setTestType('EID'); setSampleType('DBS'); }}>
              Early Infant Diagnosis (EID)
              {ageMonths !== null && ageMonths < 24 && <span className="auto-suggest-tag">Recommended for Age</span>}
            </button>
            <button type="button"
              className={`test-toggle-btn ${testType === 'Viral Load' ? 'active VL' : ''}`}
              onClick={() => { setTestType('Viral Load'); setSampleType('Plasma'); }}>
              Viral Load (VL)
              {ageMonths !== null && ageMonths >= 24 && <span className="auto-suggest-tag">Recommended for Age</span>}
            </button>
          </div>

          {testType === 'EID' ? (
            <div className="form-sub-section eid-border animate-slide-in">
              <h4>EID Indication &amp; Specimen Details</h4>
              <div className="form-grid">
                <div className="input-group full-width">
                  <label>Reason for EID Test <span className="req">*</span></label>
                  <select value={eidReason} onChange={e => setEidReason(e.target.value as any)}>
                    <option value="EID initial">EID Initial (6 weeks / 12 months)</option>
                    <option value="Confirmatory DNA-PCR">Confirmatory after positive DNA-PCR</option>
                    <option value="Confirmatory rapid test">Confirmatory after positive rapid test</option>
                    <option value="Tie-breaker">Tie-breaker (inconclusive rapid tests)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Mother's Surname</label>
                  <input type="text" placeholder="Mother's surname" value={motherSurname} onChange={e => setMotherSurname(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Mother's First Name</label>
                  <input type="text" placeholder="Mother's first name" value={motherFirstName} onChange={e => setMotherFirstName(e.target.value)} />
                </div>
                <div className="input-group full-width">
                  <label>Unique Child ID (Exposed Child Card) <span className="req">*</span></label>
                  <input type="text" placeholder="e.g. EC-7728-EID" value={uniqueChildId} onChange={e => setUniqueChildId(e.target.value)} required={testType === 'EID'} />
                </div>
              </div>
            </div>
          ) : (
            <div className="form-sub-section vl-border animate-slide-in">
              <h4>Viral Load Indication &amp; Regimen</h4>
              <div className="form-grid">
                <div className="input-group full-width">
                  <label>Reason for Viral Load Test <span className="req">*</span></label>
                  <select value={viralLoadReason} onChange={e => setViralLoadReason(e.target.value as any)}>
                    <option value="Routine">Routine monitoring</option>
                    <option value="Targeted">Targeted (suspected treatment failure)</option>
                    <option value="Follow-up after high VL">Follow-up after high VL</option>
                    <option value="Repeat">Repeat (previous sample rejected/lost)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>ART Initiation Date</label>
                  <input type="date" value={artInitiationDate} onChange={e => setArtInitiationDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Sample Type</label>
                  <div className="toggle-pill-group">
                    <button type="button" className={`toggle-pill ${sampleType === 'Plasma' ? 'active' : ''}`} onClick={() => setSampleType('Plasma')}>Plasma</button>
                    <button type="button" className={`toggle-pill ${sampleType === 'DBS' ? 'active' : ''}`} onClick={() => setSampleType('DBS')}>DBS (Dried Blood Spot)</button>
                  </div>
                </div>
                <div className="input-group full-width">
                  <label>Current ART Regimen <span className="req">*</span></label>
                  <div className="art-regimen-box">
                    <div className="regimen-header">Paediatric Regimens (P)</div>
                    <div className="regimen-grid">
                      {ART_REGIMENS_PAEDIATRIC.map(reg => (
                        <button type="button" key={reg} className={`regimen-btn paediatric ${currentArtRegimen === reg ? 'selected' : ''}`} onClick={() => setCurrentArtRegimen(reg)}>{reg}</button>
                      ))}
                    </div>
                    <div className="regimen-header" style={{ marginTop: 12 }}>Adult Regimens (A)</div>
                    <div className="regimen-grid">
                      {ART_REGIMENS_ADULT.map(reg => (
                        <button type="button" key={reg} className={`regimen-btn adult ${currentArtRegimen === reg ? 'selected' : ''}`} onClick={() => setCurrentArtRegimen(reg)}>{reg}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Specimen & Collector */}
        <div className="form-section">
          <h3 className="section-title"><UserCheck size={18} className="hiv-icon" /><span>3. Specimen Collection Details</span></h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Date Sample Drawn <span className="req">*</span></label>
              <input type="date" value={dateDrawn} onChange={e => setDateDrawn(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>HTC Provider / Collector ID</label>
              <input type="text" placeholder="e.g. HTC-992" value={htcProviderId} onChange={e => setHtcProviderId(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Collector First Name</label>
              <input type="text" placeholder="e.g. Limbani" value={collectorFirstName} onChange={e => setCollectorFirstName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Collector Surname</label>
              <input type="text" placeholder="e.g. Moyo" value={collectorSurname} onChange={e => setCollectorSurname(e.target.value)} />
            </div>
            <div className="input-group full-width">
              <label>Collector Phone</label>
              <input type="tel" placeholder="e.g. 0999876543" value={collectorPhone} onChange={e => setCollectorPhone(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Section 4: Clinician & Notification */}
        <div className="form-section">
          <h3 className="section-title"><Heart size={18} className="hiv-icon" /><span>4. Clinician &amp; Notification</span></h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Clinician / Requestor Name</label>
              <input type="text" placeholder="e.g. Dr. Chisomo Banda" value={clinicianName} onChange={e => setClinicianName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Clinician Phone</label>
              <input type="tel" placeholder="e.g. 0888234567" value={clinicianPhone} onChange={e => setClinicianPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
            </div>
            <div className="input-group full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#ec4899' }} />
                <span>📱 Notify clinician via SMS when results are ready</span>
              </label>
              <span className="input-help">An SMS will be sent to the clinician phone number above when results are uploaded.</span>
            </div>
          </div>
        </div>

        {/* Actions + mode toggle */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-secondary" onClick={toggleMode} title="Switch to focused step-by-step entry mode">
            <Layers size={15} />
            Focus Mode
          </button>
          <button type="submit" className="btn-primary hiv-theme">
            <Heart size={16} />
            Generate LIMS Request
          </button>
        </div>
      </form>
    </div>
  );
}
