import { useState } from 'react';
import type { HaematologyPatientDetails, HaematologyRequestDetails, HaematologySampleDetails } from '../types';
import { User, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import WizardOverlay from './WizardOverlay';

interface HaematologyRequestFormProps {
  onSubmit: (
    subType: string, patientName: string, patientId: string, phone: string,
    patientDetails: HaematologyPatientDetails,
    requestDetails: HaematologyRequestDetails,
    sampleDetails: HaematologySampleDetails
  ) => void;
  onCancel: () => void;
  facility?: string;
}

export default function HaematologyRequestForm({ onSubmit, onCancel, facility = 'Medicy Partner Facility' }: HaematologyRequestFormProps) {
  // ── Patient ───────────────────────────────────────────────────────────────
  const [fullName, setFullName]       = useState('');
  const [age, setAge]                 = useState('');
  const [gender, setGender]           = useState<'Male' | 'Female'>('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [telephone, setTelephone]     = useState('');
  const [ward, setWard]               = useState('');

  // ── Tests ─────────────────────────────────────────────────────────────────
  const [testFbc, setTestFbc]             = useState(false);
  const [testSmear, setTestSmear]         = useState(false);
  const [testMrdt, setTestMrdt]           = useState(false);
  const [testOther, setTestOther]         = useState(false);
  const [otherSpecify, setOtherSpecify]   = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // ── Sample ────────────────────────────────────────────────────────────────
  const [sampleType, setSampleType]       = useState<HaematologySampleDetails['sampleType']>('EDTA Whole Blood');
  const [dateCollected, setDateCollected] = useState(new Date().toISOString().split('T')[0]);
  const [timeCollected, setTimeCollected] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  // ── Clinician ─────────────────────────────────────────────────────────────
  const [clinicianName, setClinicianName]       = useState('');
  const [clinicianPhone, setClinicianPhone]     = useState('');
  const [notifyClinicianSms, setNotifyClinicianSms] = useState(true);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [errors, setErrors]     = useState<string[]>([]);
  const [wizardMode, setWizardMode] = useState<boolean>(() =>
    localStorage.getItem('lims_haem_mode') === 'wizard'
  );
  const [wizardStep, setWizardStep] = useState(0);

  const toggleMode = () => {
    const next = !wizardMode;
    setWizardMode(next);
    localStorage.setItem('lims_haem_mode', next ? 'wizard' : 'form');
    setWizardStep(0);
  };

  const getSubtypeSummary = () => {
    const s: string[] = [];
    if (testFbc)   s.push('FBC');
    if (testSmear) s.push('Blood Smear');
    if (testMrdt)  s.push('mRDT');
    if (testOther) s.push(otherSpecify || 'Other');
    return s.join(' + ') || 'Haematology';
  };

  const doSubmit = () => {
    const errs: string[] = [];
    if (!fullName.trim()) errs.push('Patient Full Name is required.');
    if (!age.trim())      errs.push('Age is required.');
    if (!telephone.trim()) errs.push('Patient phone is required.');
    const anyTest = testFbc || testSmear || testMrdt || testOther;
    if (!anyTest) errs.push('Please select at least one test.');
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    const patientDetails: HaematologyPatientDetails = {
      fullName, age: parseInt(age), gender, dateOfBirth: dateOfBirth || undefined,
      telephone, ward: ward || undefined
    };
    const requestDetails: HaematologyRequestDetails = {
      tests: { fbc: testFbc, thinBloodSmear: testSmear, mrdt: testMrdt, other: testOther },
      otherTestSpecify: testOther ? otherSpecify : undefined,
      clinicalNotes: clinicalNotes || undefined
    };
    const sampleDetails: HaematologySampleDetails = {
      sampleType, dateCollected, timeCollected,
      clinicianName: clinicianName || undefined,
      clinicianPhone: clinicianPhone || undefined,
      notifyClinicianSms
    };

    const patientId = `HAEM-${telephone.slice(-4)}-${age}`;
    onSubmit(getSubtypeSummary(), fullName, patientId, telephone, patientDetails, requestDetails, sampleDetails);
  };

  // ── Wizard steps ──────────────────────────────────────────────────────────
  const wizardSteps = [
    {
      title: 'Patient Name',
      subtitle: "Enter the patient's full name",
      requiredCheck: () => fullName.trim() ? [] : ['Patient Full Name'],
      fields: (
        <>
          <div className="input-group">
            <label>Full Name <span className="req">*</span></label>
            <input type="text" placeholder="e.g. Grace Mwale" value={fullName}
              onChange={e => setFullName(e.target.value)} autoFocus />
          </div>
          <div className="input-group">
            <label>Ward / Location</label>
            <input type="text" placeholder="e.g. Female Ward, OPD" value={ward}
              onChange={e => setWard(e.target.value)} />
          </div>
        </>
      )
    },
    {
      title: 'Age & Gender',
      subtitle: 'Patient demographics',
      requiredCheck: () => age.trim() ? [] : ['Age'],
      fields: (
        <>
          <div className="input-group">
            <label>Age <span className="req">*</span></label>
            <input type="number" placeholder="Age in years" value={age}
              onChange={e => setAge(e.target.value)} min="0" max="120" />
          </div>
          <div className="input-group">
            <label>Gender</label>
            <div className="toggle-pill-group">
              <button type="button" className={`toggle-pill ${gender === 'Female' ? 'active' : ''}`} onClick={() => setGender('Female')}>Female</button>
              <button type="button" className={`toggle-pill ${gender === 'Male' ? 'active' : ''}`} onClick={() => setGender('Male')}>Male</button>
            </div>
          </div>
          <div className="input-group">
            <label>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          </div>
        </>
      )
    },
    {
      title: 'Contact Phone',
      subtitle: 'Phone for SMS result notifications',
      requiredCheck: () => telephone.trim() ? [] : ['Phone Number'],
      fields: (
        <div className="input-group">
          <label>Patient / Guardian Phone <span className="req">*</span></label>
          <input type="tel" placeholder="e.g. 0999876543" value={telephone}
            onChange={e => setTelephone(e.target.value.replace(/[^0-9+]/g, ''))} />
          <span className="input-help">Results SMS will be sent here via AfricasTalking</span>
        </div>
      )
    },
    {
      title: 'Tests Requested',
      subtitle: 'Select haematology tests for this patient',
      requiredCheck: () => {
        const any = testFbc || testSmear || testMrdt || testOther;
        return any ? [] : ['At least one test must be selected'];
      },
      fields: (
        <div className="exam-selection-box">
          <label className="checkbox-card">
            <input type="checkbox" checked={testFbc} onChange={e => setTestFbc(e.target.checked)} />
            <div className="card-content">
              <span className="title">Full Blood Count (FBC)</span>
              <span className="desc">WBC, RBC, Haemoglobin, Platelets, differential</span>
            </div>
          </label>
          <label className="checkbox-card">
            <input type="checkbox" checked={testSmear} onChange={e => setTestSmear(e.target.checked)} />
            <div className="card-content">
              <span className="title">Thin Blood Smear</span>
              <span className="desc">Malaria parasitaemia screening — species & density</span>
            </div>
          </label>
          <label className="checkbox-card">
            <input type="checkbox" checked={testMrdt} onChange={e => setTestMrdt(e.target.checked)} />
            <div className="card-content">
              <span className="title">mRDT (Malaria Rapid Test)</span>
              <span className="desc">HRP2/pLDH rapid antigen detection</span>
            </div>
          </label>
          <label className="checkbox-card">
            <input type="checkbox" checked={testOther} onChange={e => setTestOther(e.target.checked)} />
            <div className="card-content">
              <span className="title">Other</span>
              <input type="text" placeholder="Specify test" disabled={!testOther} value={otherSpecify}
                onChange={e => setOtherSpecify(e.target.value)} className="card-input" />
            </div>
          </label>
          {(testSmear || testMrdt) && (
            <div className="input-group" style={{ gridColumn: '1/-1', marginTop: 8 }}>
              <label>Clinical Notes / Symptoms</label>
              <textarea placeholder="e.g. Fever 39°C for 3 days, chills, rigors..." value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)} rows={2}
                style={{ width: '100%', borderRadius: 8, padding: '10px 12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: 'inherit', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Sample Details',
      subtitle: 'Specimen type and collection time',
      requiredCheck: () => [],
      fields: (
        <>
          <div className="input-group">
            <label>Sample Type</label>
            <select value={sampleType} onChange={e => setSampleType(e.target.value as any)}>
              <option value="EDTA Whole Blood">EDTA Whole Blood</option>
              <option value="Capillary Blood">Capillary Blood</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label>Date Collected</label>
            <input type="date" value={dateCollected} onChange={e => setDateCollected(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Time Collected</label>
            <input type="time" value={timeCollected} onChange={e => setTimeCollected(e.target.value)} />
          </div>
        </>
      )
    },
    {
      title: 'Clinician & Notification',
      subtitle: 'Who is requesting and how to notify them',
      requiredCheck: () => [],
      fields: (
        <>
          <div className="input-group">
            <label>Clinician / Requestor Name</label>
            <input type="text" placeholder="e.g. Dr. Chisomo Banda" value={clinicianName}
              onChange={e => setClinicianName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Clinician Phone</label>
            <input type="tel" placeholder="e.g. 0888234567" value={clinicianPhone}
              onChange={e => setClinicianPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', background: notifyClinicianSms ? 'rgba(239,68,68,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${notifyClinicianSms ? 'rgba(239,68,68,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 10, transition: 'all .2s' }}>
              <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#ef4444', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '.9rem', marginBottom: 3 }}>📱 Notify clinician via SMS</div>
                <div style={{ fontSize: '.78rem', color: '#64748b' }}>An SMS will be sent when results are uploaded via AfricasTalking.</div>
              </div>
            </label>
          </div>
        </>
      )
    }
  ];

  if (wizardMode) {
    return (
      <WizardOverlay
        steps={wizardSteps}
        currentStep={wizardStep}
        onNext={() => setWizardStep(s => s + 1)}
        onBack={() => {
          if (wizardStep === 0) { setWizardMode(false); localStorage.setItem('lims_haem_mode', 'form'); }
          else setWizardStep(s => s - 1);
        }}
        onClose={() => { setWizardMode(false); localStorage.setItem('lims_haem_mode', 'form'); onCancel(); }}
        onSubmit={doSubmit}
        isLastStep={wizardStep === wizardSteps.length - 1}
        accentColor="haem"
        title="Haematology Request"
        onStepRequiredCheck={wizardSteps[wizardStep].requiredCheck}
      />
    );
  }

  return (
    <div className="lims-form-container fade-in">
      <div className="form-header-bar haem-theme">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>🩸</span>
          <div>
            <h2 style={{ margin: 0 }}>Haematology Request</h2>
            <p>{facility} · Medicy · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <span className="badge haem">HAEMATOLOGY</span>
      </div>

      {errors.length > 0 && (
        <div className="form-errors-box">
          <div className="error-title"><AlertCircle size={18} /><span>Please resolve before submitting:</span></div>
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); doSubmit(); }} className="lims-form">

        {/* Section 1 */}
        <div className="form-section">
          <h3 className="section-title"><User size={18} className="haem-icon" /><span>1. Patient Details</span></h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Full Name <span className="req">*</span></label>
              <input type="text" placeholder="Enter full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Age <span className="req">*</span></label>
              <input type="number" placeholder="Years" value={age} onChange={e => setAge(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <div className="toggle-pill-group">
                <button type="button" className={`toggle-pill ${gender === 'Female' ? 'active' : ''}`} onClick={() => setGender('Female')}>Female</button>
                <button type="button" className={`toggle-pill ${gender === 'Male' ? 'active' : ''}`} onClick={() => setGender('Male')}>Male</button>
              </div>
            </div>
            <div className="input-group">
              <label>Date of Birth</label>
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Ward / Location</label>
              <input type="text" placeholder="e.g. Female Ward, OPD" value={ward} onChange={e => setWard(e.target.value)} />
            </div>
            <div className="input-group full-width">
              <label>Patient / Guardian Phone <span className="req">*</span></label>
              <input type="tel" placeholder="e.g. 0999876543" value={telephone}
                onChange={e => setTelephone(e.target.value.replace(/[^0-9+]/g, ''))} required />
              <span className="input-help">AfricasTalking SMS results will be sent to this number.</span>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="form-section">
          <h3 className="section-title"><span>2. Tests Requested</span></h3>
          <div className="exam-selection-box">
            <label className="checkbox-card">
              <input type="checkbox" checked={testFbc} onChange={e => setTestFbc(e.target.checked)} />
              <div className="card-content"><span className="title">Full Blood Count (FBC)</span><span className="desc">WBC, RBC, Haemoglobin, Platelets, differential count</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={testSmear} onChange={e => setTestSmear(e.target.checked)} />
              <div className="card-content"><span className="title">Thin Blood Smear</span><span className="desc">Malaria parasitaemia — species & density grading</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={testMrdt} onChange={e => setTestMrdt(e.target.checked)} />
              <div className="card-content"><span className="title">mRDT (Malaria Rapid Test)</span><span className="desc">HRP2/pLDH rapid antigen detection</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={testOther} onChange={e => setTestOther(e.target.checked)} />
              <div className="card-content"><span className="title">Other Test</span>
                <input type="text" placeholder="Specify test" disabled={!testOther} value={otherSpecify}
                  onChange={e => setOtherSpecify(e.target.value)} className="card-input" />
              </div>
            </label>
          </div>
          {(testSmear || testMrdt) && (
            <div className="input-group" style={{ marginTop: 12 }}>
              <label>Clinical Notes / Symptoms</label>
              <textarea placeholder="e.g. Fever 39°C for 3 days, chills, rigors..." value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)} rows={2}
                style={{ width: '100%', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(0,0,0,.15)', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
          )}
        </div>

        {/* Section 3 */}
        <div className="form-section">
          <h3 className="section-title"><span>3. Sample &amp; Clinician</span></h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Sample Type</label>
              <select value={sampleType} onChange={e => setSampleType(e.target.value as any)}>
                <option value="EDTA Whole Blood">EDTA Whole Blood</option>
                <option value="Capillary Blood">Capillary Blood</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="input-group">
              <label>Date Collected</label>
              <input type="date" value={dateCollected} onChange={e => setDateCollected(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Time Collected</label>
              <input type="time" value={timeCollected} onChange={e => setTimeCollected(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Clinician / Requestor Name</label>
              <input type="text" placeholder="e.g. Dr. Banda" value={clinicianName} onChange={e => setClinicianName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Clinician Phone</label>
              <input type="tel" placeholder="e.g. 0888234567" value={clinicianPhone}
                onChange={e => setClinicianPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
            </div>
            <div className="input-group full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#ef4444' }} />
                <span>📱 Notify clinician via SMS when results are ready</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-secondary" onClick={toggleMode} title="Focus mode">
            <Layers size={15} /> Focus Mode
          </button>
          <button type="submit" className="btn-primary haem-theme">
            <CheckCircle2 size={16} /> Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
