import { useState } from 'react';
import type { ChemistryPatientDetails, ChemistryRequestDetails, ChemistrySampleDetails } from '../types';
import { User, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import WizardOverlay from './WizardOverlay';

interface ChemistryRequestFormProps {
  onSubmit: (
    subType: string, patientName: string, patientId: string, phone: string,
    patientDetails: ChemistryPatientDetails,
    requestDetails: ChemistryRequestDetails,
    sampleDetails: ChemistrySampleDetails
  ) => void;
  onCancel: () => void;
  facility?: string;
}

export default function ChemistryRequestForm({ onSubmit, onCancel, facility = 'Medicy Partner Facility' }: ChemistryRequestFormProps) {
  // ── Patient ───────────────────────────────────────────────────────────────
  const [fullName, setFullName]           = useState('');
  const [age, setAge]                     = useState('');
  const [gender, setGender]               = useState<'Male' | 'Female'>('Female');
  const [dateOfBirth, setDateOfBirth]     = useState('');
  const [telephone, setTelephone]         = useState('');
  const [ward, setWard]                   = useState('');
  const [fastingStatus, setFastingStatus] = useState<ChemistryPatientDetails['fastingStatus']>('Unknown');

  // ── Tests ─────────────────────────────────────────────────────────────────
  const [testKft, setTestKft]             = useState(false);
  const [testLft, setTestLft]             = useState(false);
  const [testLipids, setTestLipids]       = useState(false);
  const [testHpylori, setTestHpylori]     = useState(false);
  const [testOther, setTestOther]         = useState(false);
  const [otherSpecify, setOtherSpecify]   = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');

  // ── Sample ────────────────────────────────────────────────────────────────
  const [sampleType, setSampleType]       = useState<ChemistrySampleDetails['sampleType']>('Serum');
  const [dateCollected, setDateCollected] = useState(new Date().toISOString().split('T')[0]);
  const [timeCollected, setTimeCollected] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  // ── Clinician ─────────────────────────────────────────────────────────────
  const [clinicianName, setClinicianName]           = useState('');
  const [clinicianPhone, setClinicianPhone]         = useState('');
  const [notifyClinicianSms, setNotifyClinicianSms] = useState(true);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [errors, setErrors]         = useState<string[]>([]);
  const [wizardMode, setWizardMode] = useState<boolean>(() =>
    localStorage.getItem('lims_chem_mode') === 'wizard'
  );
  const [wizardStep, setWizardStep] = useState(0);

  const toggleMode = () => {
    const next = !wizardMode;
    setWizardMode(next);
    localStorage.setItem('lims_chem_mode', next ? 'wizard' : 'form');
    setWizardStep(0);
  };

  const getSubtypeSummary = () => {
    const s: string[] = [];
    if (testKft)    s.push('KFT');
    if (testLft)    s.push('LFT');
    if (testLipids) s.push('Lipid Profile');
    if (testHpylori) s.push('H. pylori');
    if (testOther)  s.push(otherSpecify || 'Other');
    return s.join(' + ') || 'Chemistry';
  };

  const doSubmit = () => {
    const errs: string[] = [];
    if (!fullName.trim())   errs.push('Patient Full Name is required.');
    if (!age.trim())        errs.push('Age is required.');
    if (!telephone.trim())  errs.push('Patient phone is required.');
    const anyTest = testKft || testLft || testLipids || testHpylori || testOther;
    if (!anyTest) errs.push('Please select at least one test.');
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    const patientDetails: ChemistryPatientDetails = {
      fullName, age: parseInt(age), gender,
      dateOfBirth: dateOfBirth || undefined,
      telephone, ward: ward || undefined,
      fastingStatus
    };
    const requestDetails: ChemistryRequestDetails = {
      tests: { kft: testKft, lft: testLft, lipidProfile: testLipids, hpylori: testHpylori, other: testOther },
      otherTestSpecify: testOther ? otherSpecify : undefined,
      clinicalNotes: clinicalNotes || undefined
    };
    const sampleDetails: ChemistrySampleDetails = {
      sampleType, dateCollected, timeCollected,
      clinicianName: clinicianName || undefined,
      clinicianPhone: clinicianPhone || undefined,
      notifyClinicianSms
    };

    const patientId = `CHEM-${telephone.slice(-4)}-${age}`;
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
            <input type="text" placeholder="e.g. James Mwenda" value={fullName}
              onChange={e => setFullName(e.target.value)} autoFocus />
          </div>
          <div className="input-group">
            <label>Ward / Location</label>
            <input type="text" placeholder="e.g. Male Ward, OPD" value={ward}
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
          <div className="input-group">
            <label>Fasting Status</label>
            <div className="toggle-pill-group">
              {(['Fasting', 'Non-Fasting', 'Unknown'] as const).map(s => (
                <button key={s} type="button"
                  className={`toggle-pill ${fastingStatus === s ? 'active' : ''}`}
                  onClick={() => setFastingStatus(s)}>{s}</button>
              ))}
            </div>
            <span className="input-help">Important for Lipid Profile and glucose tests</span>
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
      subtitle: 'Select chemistry panels for this patient',
      requiredCheck: () => {
        const any = testKft || testLft || testLipids || testHpylori || testOther;
        return any ? [] : ['At least one test must be selected'];
      },
      fields: (
        <div className="exam-selection-box">
          <label className="checkbox-card">
            <input type="checkbox" checked={testKft} onChange={e => setTestKft(e.target.checked)} />
            <div className="card-content">
              <span className="title">Kidney Function Test (KFT)</span>
              <span className="desc">Urea, Creatinine, eGFR, Na⁺, K⁺, Cl⁻</span>
            </div>
          </label>
          <label className="checkbox-card">
            <input type="checkbox" checked={testLft} onChange={e => setTestLft(e.target.checked)} />
            <div className="card-content">
              <span className="title">Liver Function Test (LFT)</span>
              <span className="desc">ALT, AST, ALP, GGT, Bilirubin, Albumin, Total Protein</span>
            </div>
          </label>
          <label className="checkbox-card">
            <input type="checkbox" checked={testLipids} onChange={e => setTestLipids(e.target.checked)} />
            <div className="card-content">
              <span className="title">Lipid Profile</span>
              <span className="desc">Total Cholesterol, LDL, HDL, Triglycerides</span>
            </div>
          </label>
          <label className="checkbox-card">
            <input type="checkbox" checked={testHpylori} onChange={e => setTestHpylori(e.target.checked)} />
            <div className="card-content">
              <span className="title">H. pylori</span>
              <span className="desc">Rapid antigen (stool) or serology (IgG)</span>
            </div>
          </label>
          <label className="checkbox-card">
            <input type="checkbox" checked={testOther} onChange={e => setTestOther(e.target.checked)} />
            <div className="card-content">
              <span className="title">Other Test</span>
              <input type="text" placeholder="Specify test" disabled={!testOther} value={otherSpecify}
                onChange={e => setOtherSpecify(e.target.value)} className="card-input" />
            </div>
          </label>
          <div className="input-group" style={{ gridColumn: '1/-1', marginTop: 4 }}>
            <label>Clinical Notes / Indication</label>
            <textarea placeholder="e.g. Known diabetic on metformin, assess renal function..." value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)} rows={2}
              style={{ width: '100%', borderRadius: 8, padding: '10px 12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: 'inherit', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
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
              <option value="Serum">Serum</option>
              <option value="Plasma">Plasma (EDTA/Heparin)</option>
              <option value="Whole Blood">Whole Blood</option>
              <option value="Stool">Stool (H. pylori)</option>
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
            <input type="text" placeholder="e.g. Dr. Phiri" value={clinicianName}
              onChange={e => setClinicianName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Clinician Phone</label>
            <input type="tel" placeholder="e.g. 0888234567" value={clinicianPhone}
              onChange={e => setClinicianPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', background: notifyClinicianSms ? 'rgba(245,158,11,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${notifyClinicianSms ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 10, transition: 'all .2s' }}>
              <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#f59e0b', marginTop: 2 }} />
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
          if (wizardStep === 0) { setWizardMode(false); localStorage.setItem('lims_chem_mode', 'form'); }
          else setWizardStep(s => s - 1);
        }}
        onClose={() => { setWizardMode(false); localStorage.setItem('lims_chem_mode', 'form'); onCancel(); }}
        onSubmit={doSubmit}
        isLastStep={wizardStep === wizardSteps.length - 1}
        accentColor="chem"
        title="Chemistry Request"
        onStepRequiredCheck={wizardSteps[wizardStep].requiredCheck}
      />
    );
  }

  return (
    <div className="lims-form-container fade-in">
      <div className="form-header-bar chem-theme">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.5rem' }}>⚗️</span>
          <div>
            <h2 style={{ margin: 0 }}>Clinical Chemistry Request</h2>
            <p>{facility} · Medicy · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
        <span className="badge chem">CHEMISTRY</span>
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
          <h3 className="section-title"><User size={18} className="chem-icon" /><span>1. Patient Details</span></h3>
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
              <input type="text" placeholder="e.g. Male Ward, OPD" value={ward} onChange={e => setWard(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Fasting Status</label>
              <div className="toggle-pill-group">
                {(['Fasting', 'Non-Fasting', 'Unknown'] as const).map(s => (
                  <button key={s} type="button" className={`toggle-pill ${fastingStatus === s ? 'active' : ''}`}
                    onClick={() => setFastingStatus(s)}>{s}</button>
                ))}
              </div>
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
              <input type="checkbox" checked={testKft} onChange={e => setTestKft(e.target.checked)} />
              <div className="card-content"><span className="title">Kidney Function Test (KFT)</span><span className="desc">Urea, Creatinine, eGFR, Electrolytes (Na⁺, K⁺, Cl⁻)</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={testLft} onChange={e => setTestLft(e.target.checked)} />
              <div className="card-content"><span className="title">Liver Function Test (LFT)</span><span className="desc">ALT, AST, ALP, GGT, Bilirubin, Albumin, Total Protein</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={testLipids} onChange={e => setTestLipids(e.target.checked)} />
              <div className="card-content"><span className="title">Lipid Profile</span><span className="desc">Total Cholesterol, LDL, HDL, Triglycerides</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={testHpylori} onChange={e => setTestHpylori(e.target.checked)} />
              <div className="card-content"><span className="title">H. pylori</span><span className="desc">Rapid antigen (stool) or serology IgG</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={testOther} onChange={e => setTestOther(e.target.checked)} />
              <div className="card-content"><span className="title">Other Test</span>
                <input type="text" placeholder="Specify test" disabled={!testOther} value={otherSpecify}
                  onChange={e => setOtherSpecify(e.target.value)} className="card-input" />
              </div>
            </label>
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Clinical Notes / Indication</label>
            <textarea placeholder="e.g. Known diabetic on metformin, check renal function..." value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)} rows={2}
              style={{ width: '100%', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(0,0,0,.15)', fontFamily: 'inherit', resize: 'vertical' }} />
          </div>
        </div>

        {/* Section 3 */}
        <div className="form-section">
          <h3 className="section-title"><span>3. Sample &amp; Clinician</span></h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Sample Type</label>
              <select value={sampleType} onChange={e => setSampleType(e.target.value as any)}>
                <option value="Serum">Serum</option>
                <option value="Plasma">Plasma (EDTA/Heparin)</option>
                <option value="Whole Blood">Whole Blood</option>
                <option value="Stool">Stool (H. pylori)</option>
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
              <input type="text" placeholder="e.g. Dr. Phiri" value={clinicianName} onChange={e => setClinicianName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Clinician Phone</label>
              <input type="tel" placeholder="e.g. 0888234567" value={clinicianPhone}
                onChange={e => setClinicianPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
            </div>
            <div className="input-group full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#f59e0b' }} />
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
          <button type="submit" className="btn-primary chem-theme">
            <CheckCircle2 size={16} /> Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
