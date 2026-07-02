import React, { useState, useEffect } from 'react';
import type { TbPatientDetails, TbRequestDetails, TbSampleDetails } from '../types';
import { User, ClipboardList, Activity, FlaskConical, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import WizardOverlay from './WizardOverlay';

interface TBRequestFormProps {
  onSubmit: (subType: string, patientName: string, patientId: string, phone: string, patientDetails: TbPatientDetails, requestDetails: TbRequestDetails, sampleDetails: TbSampleDetails) => void;
  onCancel: () => void;
}

export default function TBRequestForm({ onSubmit, onCancel }: TBRequestFormProps) {
  // ── Patient demographics ────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');
  const [villageStreet, setVillageStreet] = useState('');
  const [district, setDistrict] = useState('BT');
  const [telephone, setTelephone] = useState('');
  const [reasonForExamination, setReasonForExamination] = useState<'Diagnosis' | 'Follow up'>('Diagnosis');
  const [followUpMonths, setFollowUpMonths] = useState<'2 months' | '5 months' | '6 months'>('2 months');
  const [districtTbRegNo, setDistrictTbRegNo] = useState('');
  const [hivStatus, setHivStatus] = useState<'Positive' | 'Negative' | 'Unknown/Not tested'>('Unknown/Not tested');
  const [tbTreatmentHistory, setTbTreatmentHistory] = useState<'New' | 'Previously treated'>('New');
  const [sourceOfReferral, setSourceOfReferral] = useState<TbPatientDetails['sourceOfReferral']>('OPD');
  const [sourceOfReferralOther, setSourceOfReferralOther] = useState('');

  // ── Examinations ────────────────────────────────────────────────────────
  const [examMicroscopy, setExamMicroscopy] = useState(false);
  const [examSlitSkinSmear, setExamSlitSkinSmear] = useState(false);
  const [examXpertUltra, setExamXpertUltra] = useState(true);
  const [examTrunat] = useState(false);
  const [examUrineLam, setExamUrineLam] = useState(false);
  const [examReflexTestingXdr, setExamReflexTestingXdr] = useState(false);
  const [examOther, setExamOther] = useState(false);
  const [otherTestSpecify, setOtherTestSpecify] = useState('');

  // ── Indications ─────────────────────────────────────────────────────────
  const [indXpertPresumptive, setIndXpertPresumptive] = useState(true);
  const [indXpertHospitalized, setIndXpertHospitalized] = useState(false);
  const [indXpertHivPositive, setIndXpertHivPositive] = useState(false);
  const [indXpertChildren, setIndXpertChildren] = useState(false);
  const [indXpertPrisoner, setIndXpertPrisoner] = useState(false);
  const [indXpertMinor, setIndXpertMinor] = useState(false);
  const [indXpertOther, setIndXpertOther] = useState(false);
  const [indXpertOtherSpecify, setIndXpertOtherSpecify] = useState('');

  const [indLamCd4, setIndLamCd4] = useState(false);
  const [indLamAhd, setIndLamAhd] = useState(false);
  const [indLamCriticallyIll, setIndLamCriticallyIll] = useState(false);
  const [indLamOther, setIndLamOther] = useState(false);
  const [indLamOtherSpecify, setIndLamOtherSpecify] = useState('');

  // ── Sample details ──────────────────────────────────────────────────────
  const [sampleType, setSampleType] = useState<'Sputum' | 'Stool' | 'Other'>('Sputum');
  const [sampleTypeOther, setSampleTypeOther] = useState('');
  const [dateCollected, setDateCollected] = useState(new Date().toISOString().split('T')[0]);
  const [timeCollected, setTimeCollected] = useState(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [recollection, setRecollection] = useState(false);

  // ── Clinician / Requestor ───────────────────────────────────────────────
  const [requestorName, setRequestorName] = useState('');
  const [requestorPhone, setRequestorPhone] = useState('');
  const [clinicianName, setClinicianName] = useState('');
  const [clinicianPhone, setClinicianPhone] = useState('');
  const [notifyClinicianSms, setNotifyClinicianSms] = useState(true);

  // ── UI state ────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<string[]>([]);
  const [wizardMode, setWizardMode] = useState<boolean>(() => {
    return localStorage.getItem('lims_tb_mode') === 'wizard';
  });
  const [wizardStep, setWizardStep] = useState(0);

  const toggleMode = () => {
    const next = !wizardMode;
    setWizardMode(next);
    localStorage.setItem('lims_tb_mode', next ? 'wizard' : 'form');
    setWizardStep(0);
  };

  // ── Smart automations ───────────────────────────────────────────────────
  useEffect(() => {
    if (hivStatus === 'Positive') {
      setIndXpertHivPositive(true);
    } else {
      setIndXpertHivPositive(false);
      setIndLamCd4(false); setIndLamAhd(false);
      setIndLamCriticallyIll(false); setIndLamOther(false);
      setExamUrineLam(false);
    }
  }, [hivStatus]);

  useEffect(() => {
    const n = parseInt(age);
    setIndXpertChildren(!isNaN(n) && n < 15);
  }, [age]);

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getSubtypeSummary = () => {
    const s: string[] = [];
    if (examXpertUltra) s.push(examReflexTestingXdr ? 'GeneXpert (Ultra + XDR)' : 'GeneXpert Ultra');
    if (examUrineLam)   s.push('Urine LAM');
    if (examMicroscopy) s.push('Microscopy');
    if (examTrunat)     s.push('Truenat');
    if (examSlitSkinSmear) s.push('Slit-Skin Smear');
    if (examOther)      s.push(otherTestSpecify || 'Other TB');
    return s.join(' + ') || 'TB Diagnosis';
  };

  const doSubmit = () => {
    const newErrors: string[] = [];
    if (!fullName.trim()) newErrors.push('Patient Full Name is required.');
    if (!age.trim())      newErrors.push('Patient Age is required.');
    if (!telephone.trim()) newErrors.push('Patient phone number is required.');
    const anyExam = examMicroscopy || examSlitSkinSmear || examXpertUltra || examTrunat || examUrineLam || examReflexTestingXdr || examOther;
    if (!anyExam) newErrors.push('Please select at least one examination.');

    if (newErrors.length > 0) { setErrors(newErrors); return; }
    setErrors([]);
    buildAndSubmit();
  };

  const buildAndSubmit = () => {
    const patientDetails: TbPatientDetails = {
      fullName, age: parseInt(age), gender, villageStreet, district, telephone,
      reasonForExamination,
      followUpMonths: reasonForExamination === 'Follow up' ? followUpMonths : undefined,
      districtTbRegNo: reasonForExamination === 'Follow up' ? districtTbRegNo : undefined,
      hivStatus, tbTreatmentHistory, sourceOfReferral,
      sourceOfReferralOther: sourceOfReferral === 'Other' ? sourceOfReferralOther : undefined
    };
    const requestDetails: TbRequestDetails = {
      examinations: { microscopy: examMicroscopy, slitSkinSmear: examSlitSkinSmear, xpertUltra: examXpertUltra, trunat: examTrunat, urineLam: examUrineLam, reflexTestingXdr: examReflexTestingXdr, other: examOther },
      otherTestSpecify: examOther ? otherTestSpecify : undefined,
      indicationsXpertUltra: examXpertUltra ? { presumptiveDrTb: indXpertPresumptive, hospitalized: indXpertHospitalized, hivPositive: indXpertHivPositive, children: indXpertChildren, prisoner: indXpertPrisoner, minorXminer: indXpertMinor, other: indXpertOther, otherSpecify: indXpertOther ? indXpertOtherSpecify : undefined } : undefined,
      indicationsUrineLam: examUrineLam ? { cd4LessThan200: indLamCd4, ahdStage4: indLamAhd, criticallyIll: indLamCriticallyIll, other: indLamOther, otherSpecify: indLamOther ? indLamOtherSpecify : undefined } : undefined
    };
    const sampleDetails: TbSampleDetails = {
      sampleType, sampleTypeOther: sampleType === 'Other' ? sampleTypeOther : undefined,
      dateCollected, timeCollected,
      recollectionDueToRejection: recollection,
      requestorName: clinicianName || requestorName,
      requestorPhone: clinicianPhone || requestorPhone,
      dateRequested: new Date().toISOString().split('T')[0],
      clinicianName: clinicianName || undefined,
      clinicianPhone: clinicianPhone || undefined,
      notifyClinicianSms
    } as any;

    const idNumber = districtTbRegNo || `TB-${telephone.slice(-4)}-${age}`;
    onSubmit(getSubtypeSummary(), fullName, idNumber, telephone, patientDetails, requestDetails, sampleDetails);
  };

  const handleFormSubmit = (e: React.FormEvent) => { e.preventDefault(); doSubmit(); };

  // ── Wizard step definitions ─────────────────────────────────────────────
  const STEP_PATIENT_NAME = {
    title: 'Patient Name',
    subtitle: 'Enter the patient\u2019s full name and TB register number (if known)',
    requiredCheck: () => { const m: string[] = []; if (!fullName.trim()) m.push('Patient Full Name'); return m; },
    fields: (
      <>
        <div className="input-group">
          <label>Patient's Full Name <span className="req">*</span></label>
          <input type="text" placeholder="e.g. Modester Silence" value={fullName} onChange={e => setFullName(e.target.value)} autoFocus />
        </div>
        <div className="input-group">
          <label>District TB Register No. (if follow-up)</label>
          <input type="text" placeholder="e.g. BT/TBU/2026/89" value={districtTbRegNo} onChange={e => setDistrictTbRegNo(e.target.value)} />
        </div>
      </>
    )
  };

  const STEP_DEMOGRAPHICS = {
    title: 'Age & Location',
    subtitle: 'Patient age, gender and home location',
    requiredCheck: () => { const m: string[] = []; if (!age.trim()) m.push('Age'); return m; },
    fields: (
      <>
        <div className="input-group">
          <label>Age <span className="req">*</span></label>
          <input type="number" placeholder="Age in years" value={age} onChange={e => setAge(e.target.value)} min="0" max="120" />
        </div>
        <div className="input-group">
          <label>Gender</label>
          <div className="toggle-pill-group">
            <button type="button" className={`toggle-pill ${gender === 'Female' ? 'active' : ''}`} onClick={() => setGender('Female')}>Female</button>
            <button type="button" className={`toggle-pill ${gender === 'Male' ? 'active' : ''}`} onClick={() => setGender('Male')}>Male</button>
          </div>
        </div>
        <div className="input-group">
          <label>District</label>
          <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. BT" />
        </div>
        <div className="input-group">
          <label>Village / Street</label>
          <input type="text" placeholder="e.g. Manja near msika" value={villageStreet} onChange={e => setVillageStreet(e.target.value)} />
        </div>
      </>
    )
  };

  const STEP_CLINICAL = {
    title: 'Clinical Details',
    subtitle: 'HIV status, treatment history and contact phone for SMS results',
    requiredCheck: () => { const m: string[] = []; if (!telephone.trim()) m.push('Patient/Guardian Phone'); return m; },
    fields: (
      <>
        <div className="input-group">
          <label>Patient / Guardian Phone <span className="req">*</span></label>
          <input type="tel" placeholder="e.g. 0995393202" value={telephone} onChange={e => setTelephone(e.target.value.replace(/[^0-9+]/g, ''))} />
          <span className="input-help">Results SMS will be sent to this number via AfricasTalking</span>
        </div>
        <div className="input-group">
          <label>HIV Status</label>
          <select value={hivStatus} onChange={e => setHivStatus(e.target.value as any)} className={hivStatus === 'Positive' ? 'select-warning' : ''}>
            <option value="Unknown/Not tested">Unknown / Not Tested</option>
            <option value="Negative">Negative</option>
            <option value="Positive">🔵 Positive</option>
          </select>
        </div>
        <div className="input-group">
          <label>TB Treatment History</label>
          <div className="toggle-pill-group">
            <button type="button" className={`toggle-pill ${tbTreatmentHistory === 'New' ? 'active' : ''}`} onClick={() => setTbTreatmentHistory('New')}>New Patient</button>
            <button type="button" className={`toggle-pill ${tbTreatmentHistory === 'Previously treated' ? 'active' : ''}`} onClick={() => setTbTreatmentHistory('Previously treated')}>Previously Treated</button>
          </div>
        </div>
      </>
    )
  };

  const STEP_REASON = {
    title: 'Reason for Test',
    subtitle: 'Why is this patient being tested?',
    requiredCheck: () => [],
    fields: (
      <>
        <div className="input-group">
          <label>Reason for Examination</label>
          <div className="toggle-pill-group">
            <button type="button" className={`toggle-pill ${reasonForExamination === 'Diagnosis' ? 'active' : ''}`} onClick={() => setReasonForExamination('Diagnosis')}>Diagnosis</button>
            <button type="button" className={`toggle-pill ${reasonForExamination === 'Follow up' ? 'active' : ''}`} onClick={() => setReasonForExamination('Follow up')}>Follow up</button>
          </div>
        </div>
        {reasonForExamination === 'Follow up' && (
          <div className="input-group">
            <label>Follow-up Duration</label>
            <select value={followUpMonths} onChange={e => setFollowUpMonths(e.target.value as any)}>
              <option value="2 months">2 Months</option>
              <option value="5 months">5 Months</option>
              <option value="6 months">6 Months</option>
            </select>
          </div>
        )}
        <div className="input-group">
          <label>Source of Referral</label>
          <select value={sourceOfReferral} onChange={e => setSourceOfReferral(e.target.value as any)}>
            <option value="OPD">OPD</option>
            <option value="In patients/Wards">In-Patients / Wards</option>
            <option value="community">Community</option>
            <option value="PPMx site">PPMx Site</option>
            <option value="TB clinic">TB Clinic</option>
            <option value="Under five">Under Five Clinic</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {sourceOfReferral === 'Other' && (
          <div className="input-group">
            <label>Specify Other Source</label>
            <input type="text" value={sourceOfReferralOther} onChange={e => setSourceOfReferralOther(e.target.value)} />
          </div>
        )}
      </>
    )
  };

  const STEP_EXAMS = {
    title: 'Tests Requested',
    subtitle: 'Select the laboratory examinations for this patient',
    requiredCheck: () => {
      const anyExam = examMicroscopy || examSlitSkinSmear || examXpertUltra || examTrunat || examUrineLam || examReflexTestingXdr || examOther;
      return anyExam ? [] : ['At least one examination must be selected'];
    },
    fields: (
      <div className="exam-selection-box">
        <label className="checkbox-card">
          <input type="checkbox" checked={examXpertUltra} onChange={e => setExamXpertUltra(e.target.checked)} />
          <div className="card-content"><span className="title">GeneXpert Ultra / Truenat</span><span className="desc">Molecular MTB + Rifampicin resistance (Standard of Care)</span></div>
        </label>
        <label className="checkbox-card">
          <input type="checkbox" checked={examReflexTestingXdr} onChange={e => setExamReflexTestingXdr(e.target.checked)} />
          <div className="card-content"><span className="title">Reflex XDR Testing</span><span className="desc">Fluoroquinolones, Isoniazid, Ethionamide resistance panel</span></div>
        </label>
        <label className={`checkbox-card ${hivStatus !== 'Positive' ? 'card-disabled' : ''}`}>
          <input type="checkbox" checked={examUrineLam} disabled={hivStatus !== 'Positive'} onChange={e => setExamUrineLam(e.target.checked)} />
          <div className="card-content"><span className="title">Urine LAM</span><span className="desc">HIV Positive only — AHD, CD4 &lt;200 or critically ill</span></div>
        </label>
        <label className="checkbox-card">
          <input type="checkbox" checked={examMicroscopy} onChange={e => setExamMicroscopy(e.target.checked)} />
          <div className="card-content"><span className="title">Microscopy (Smear)</span><span className="desc">Ziehl-Neelsen / Fluorescence grading</span></div>
        </label>
        <label className="checkbox-card">
          <input type="checkbox" checked={examSlitSkinSmear} onChange={e => setExamSlitSkinSmear(e.target.checked)} />
          <div className="card-content"><span className="title">Slit-Skin Smear (SSS)</span><span className="desc">Dermal smears for Leprosy diagnosis</span></div>
        </label>
        <label className="checkbox-card">
          <input type="checkbox" checked={examOther} onChange={e => setExamOther(e.target.checked)} />
          <div className="card-content">
            <span className="title">Other Diagnostics</span>
            <input type="text" placeholder="Specify test" disabled={!examOther} value={otherTestSpecify} onChange={e => setOtherTestSpecify(e.target.value)} className="card-input" />
          </div>
        </label>
        {examXpertUltra && (
          <div className="indications-sub-section animate-slide-in" style={{ gridColumn: '1/-1' }}>
            <h4>Indications for Xpert Ultra:</h4>
            <div className="checkbox-grid">
              {[['indXpertPresumptive', indXpertPresumptive, setIndXpertPresumptive, 'Presumptive DR-TB'],
                ['indXpertHospitalized', indXpertHospitalized, setIndXpertHospitalized, 'Hospitalized'],
                ['indXpertHivPositive', indXpertHivPositive, setIndXpertHivPositive, 'HIV Positive'],
                ['indXpertChildren', indXpertChildren, setIndXpertChildren, 'Child (<15 years)'],
                ['indXpertPrisoner', indXpertPrisoner, setIndXpertPrisoner, 'Prisoner'],
                ['indXpertMinor', indXpertMinor, setIndXpertMinor, 'Minor / Ex-miner'],
                ['indXpertOther', indXpertOther, setIndXpertOther, 'Others']
              ].map(([, val, setter, label]: any) => (
                <label key={label as string} className="checkbox-label">
                  <input type="checkbox" checked={val as boolean} onChange={e => (setter as any)(e.target.checked)} />
                  <span>{label as string}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  };

  const STEP_SAMPLE = {
    title: 'Sample Details',
    subtitle: 'Specimen type and collection information',
    requiredCheck: () => [],
    fields: (
      <>
        <div className="input-group">
          <label>Type of Sample</label>
          <select value={sampleType} onChange={e => setSampleType(e.target.value as any)}>
            <option value="Sputum">Sputum</option>
            <option value="Stool">Stool</option>
            <option value="Other">Other Sample</option>
          </select>
        </div>
        {sampleType === 'Other' && (
          <div className="input-group">
            <label>Specify Sample Type</label>
            <input type="text" value={sampleTypeOther} onChange={e => setSampleTypeOther(e.target.value)} />
          </div>
        )}
        <div className="input-group">
          <label>Date Collected</label>
          <input type="date" value={dateCollected} onChange={e => setDateCollected(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Time Collected</label>
          <input type="time" value={timeCollected} onChange={e => setTimeCollected(e.target.value)} />
        </div>
        <label className="checkbox-container-custom">
          <input type="checkbox" checked={recollection} onChange={e => setRecollection(e.target.checked)} />
          <span>Recollection Due to Rejection?</span>
        </label>
      </>
    )
  };

  const STEP_CLINICIAN = {
    title: 'Clinician & Notification',
    subtitle: 'Requesting clinician details and SMS notification preference',
    requiredCheck: () => [],
    fields: (
      <>
        <div className="input-group">
          <label>Clinician / Requestor Full Name <span className="req">*</span></label>
          <input type="text" placeholder="e.g. Dr. M. Kumba" value={clinicianName} onChange={e => setClinicianName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Clinician Phone Number</label>
          <input type="tel" placeholder="e.g. 0888234567" value={clinicianPhone} onChange={e => setClinicianPhone(e.target.value.replace(/[^0-9+]/g, ''))} />
        </div>
        <div className="input-group">
          <label>Sample Requestor Name (on form)</label>
          <input type="text" placeholder="e.g. M. Kumba" value={requestorName} onChange={e => setRequestorName(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Requestor Phone</label>
          <input type="tel" placeholder="e.g. 0995393202" value={requestorPhone} onChange={e => setRequestorPhone(e.target.value)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', background: notifyClinicianSms ? 'rgba(16,185,129,.08)' : 'rgba(255,255,255,.03)', border: `1px solid ${notifyClinicianSms ? 'rgba(16,185,129,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 10, transition: 'all .2s' }}>
            <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#10b981', marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '.9rem', marginBottom: 3 }}>📱 Notify clinician via SMS</div>
              <div style={{ fontSize: '.78rem', color: '#64748b' }}>When results are uploaded, an SMS will be sent to the clinician phone number above via AfricasTalking.</div>
            </div>
          </label>
        </div>
      </>
    )
  };

  const wizardSteps = [STEP_PATIENT_NAME, STEP_DEMOGRAPHICS, STEP_CLINICAL, STEP_REASON, STEP_EXAMS, STEP_SAMPLE, STEP_CLINICIAN];

  // ── WIZARD MODE ────────────────────────────────────────────────────────
  if (wizardMode) {
    return (
      <WizardOverlay
        steps={wizardSteps}
        currentStep={wizardStep}
        onNext={() => setWizardStep(s => s + 1)}
        onBack={() => { if (wizardStep === 0) { setWizardMode(false); localStorage.setItem('lims_tb_mode', 'form'); } else setWizardStep(s => s - 1); }}
        onClose={() => { setWizardMode(false); localStorage.setItem('lims_tb_mode', 'form'); onCancel(); }}
        onSubmit={doSubmit}
        isLastStep={wizardStep === wizardSteps.length - 1}
        accentColor="tb"
        title="TB Diagnosis Request"
        onStepRequiredCheck={wizardSteps[wizardStep].requiredCheck}
      />
    );
  }

  // ── FORM MODE ──────────────────────────────────────────────────────────
  return (
    <div className="lims-form-container fade-in">
      <div className="form-header-bar tb-theme">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🧬</span>
            <div>
              <h2 style={{ margin: 0 }}>TB Laboratory Request</h2>
              <p>Zingwangwa Community Hospital · Ministry of Health Malawi</p>
            </div>
          </div>
        </div>
        <span className="badge">TB DIAGNOSIS</span>
      </div>

      {errors.length > 0 && (
        <div className="form-errors-box">
          <div className="error-title"><AlertCircle size={18} /><span>Please resolve before submitting:</span></div>
          <ul>{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="lims-form">

        {/* Section 1: Patient */}
        <div className="form-section">
          <h3 className="section-title"><User size={18} className="tb-icon" /><span>1. Patient Demographics</span></h3>
          <div className="form-grid">
            <div className="input-group full-width">
              <label>Patient's Full Name <span className="req">*</span></label>
              <input type="text" placeholder="Enter full name" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Age <span className="req">*</span></label>
              <input type="number" placeholder="Age in years" value={age} onChange={e => setAge(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <div className="toggle-pill-group">
                <button type="button" className={`toggle-pill ${gender === 'Female' ? 'active' : ''}`} onClick={() => setGender('Female')}>Female</button>
                <button type="button" className={`toggle-pill ${gender === 'Male' ? 'active' : ''}`} onClick={() => setGender('Male')}>Male</button>
              </div>
            </div>
            <div className="input-group">
              <label>District</label>
              <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. BT" />
            </div>
            <div className="input-group">
              <label>Village / Street</label>
              <input type="text" placeholder="e.g. Manja near msika" value={villageStreet} onChange={e => setVillageStreet(e.target.value)} />
            </div>
            <div className="input-group full-width">
              <label>Patient / Guardian Phone <span className="req">*</span></label>
              <input type="tel" placeholder="e.g. 0995393202" value={telephone} onChange={e => setTelephone(e.target.value.replace(/[^0-9+]/g, ''))} required />
              <span className="input-help">Results SMS via AfricasTalking will be routed to this number.</span>
            </div>
          </div>
        </div>

        {/* Section 2: Clinical */}
        <div className="form-section">
          <h3 className="section-title"><Activity size={18} className="tb-icon" /><span>2. Clinical History &amp; Reason</span></h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Reason for Examination</label>
              <div className="toggle-pill-group">
                <button type="button" className={`toggle-pill ${reasonForExamination === 'Diagnosis' ? 'active' : ''}`} onClick={() => setReasonForExamination('Diagnosis')}>Diagnosis</button>
                <button type="button" className={`toggle-pill ${reasonForExamination === 'Follow up' ? 'active' : ''}`} onClick={() => setReasonForExamination('Follow up')}>Follow up</button>
              </div>
            </div>
            {reasonForExamination === 'Follow up' ? (
              <>
                <div className="input-group animate-slide-in">
                  <label>Follow-up Duration</label>
                  <select value={followUpMonths} onChange={e => setFollowUpMonths(e.target.value as any)}>
                    <option value="2 months">2 Months</option>
                    <option value="5 months">5 Months</option>
                    <option value="6 months">6 Months</option>
                  </select>
                </div>
                <div className="input-group animate-slide-in">
                  <label>District TB Register No.</label>
                  <input type="text" placeholder="e.g. BT/TBU/2026/89" value={districtTbRegNo} onChange={e => setDistrictTbRegNo(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="input-group">
                <label>TB Treatment History</label>
                <div className="toggle-pill-group">
                  <button type="button" className={`toggle-pill ${tbTreatmentHistory === 'New' ? 'active' : ''}`} onClick={() => setTbTreatmentHistory('New')}>New Patient</button>
                  <button type="button" className={`toggle-pill ${tbTreatmentHistory === 'Previously treated' ? 'active' : ''}`} onClick={() => setTbTreatmentHistory('Previously treated')}>Previously Treated</button>
                </div>
              </div>
            )}
            <div className="input-group">
              <label>HIV Status</label>
              <select value={hivStatus} onChange={e => setHivStatus(e.target.value as any)} className={hivStatus === 'Positive' ? 'select-warning' : ''}>
                <option value="Unknown/Not tested">Unknown / Not Tested</option>
                <option value="Negative">Negative</option>
                <option value="Positive">🔵 Positive</option>
              </select>
            </div>
            <div className="input-group">
              <label>Source of Referral</label>
              <select value={sourceOfReferral} onChange={e => setSourceOfReferral(e.target.value as any)}>
                <option value="OPD">OPD</option>
                <option value="In patients/Wards">In-Patients / Wards</option>
                <option value="community">Community</option>
                <option value="PPMx site">PPMx Site</option>
                <option value="TB clinic">TB Clinic</option>
                <option value="Under five">Under Five Clinic</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {sourceOfReferral === 'Other' && (
              <div className="input-group full-width animate-slide-in">
                <label>Specify Other Source</label>
                <input type="text" value={sourceOfReferralOther} onChange={e => setSourceOfReferralOther(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Exams */}
        <div className="form-section">
          <h3 className="section-title"><FlaskConical size={18} className="tb-icon" /><span>3. Examinations Requested</span></h3>
          <div className="exam-selection-box">
            <label className="checkbox-card">
              <input type="checkbox" checked={examXpertUltra} onChange={e => setExamXpertUltra(e.target.checked)} />
              <div className="card-content"><span className="title">GeneXpert Ultra / Truenat</span><span className="desc">Molecular MTB + Rifampicin resistance</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={examReflexTestingXdr} onChange={e => setExamReflexTestingXdr(e.target.checked)} />
              <div className="card-content"><span className="title">Reflex XDR Testing</span><span className="desc">Extended drug resistance panel</span></div>
            </label>
            <label className={`checkbox-card ${hivStatus !== 'Positive' ? 'card-disabled' : ''}`}>
              <input type="checkbox" checked={examUrineLam} disabled={hivStatus !== 'Positive'} onChange={e => setExamUrineLam(e.target.checked)} />
              <div className="card-content"><span className="title">Urine LAM</span><span className="desc">HIV Positive only</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={examMicroscopy} onChange={e => setExamMicroscopy(e.target.checked)} />
              <div className="card-content"><span className="title">Microscopy (Smear)</span><span className="desc">ZN / Fluorescence grading</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={examSlitSkinSmear} onChange={e => setExamSlitSkinSmear(e.target.checked)} />
              <div className="card-content"><span className="title">Slit-Skin Smear</span><span className="desc">Leprosy diagnosis</span></div>
            </label>
            <label className="checkbox-card">
              <input type="checkbox" checked={examOther} onChange={e => setExamOther(e.target.checked)} />
              <div className="card-content"><span className="title">Other</span>
                <input type="text" placeholder="Specify test" disabled={!examOther} value={otherTestSpecify} onChange={e => setOtherTestSpecify(e.target.value)} className="card-input" />
              </div>
            </label>
          </div>
          {examXpertUltra && (
            <div className="indications-sub-section animate-slide-in">
              <h4>Indications for Xpert Ultra:</h4>
              <div className="checkbox-grid">
                <label className="checkbox-label"><input type="checkbox" checked={indXpertPresumptive} onChange={e => setIndXpertPresumptive(e.target.checked)} /><span>Presumptive DR-TB</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indXpertHospitalized} onChange={e => setIndXpertHospitalized(e.target.checked)} /><span>Hospitalized</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indXpertHivPositive} onChange={e => setIndXpertHivPositive(e.target.checked)} /><span>HIV Positive <span className="auto-tagged">(Auto)</span></span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indXpertChildren} onChange={e => setIndXpertChildren(e.target.checked)} /><span>Child &lt;15 yrs <span className="auto-tagged">(Auto)</span></span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indXpertPrisoner} onChange={e => setIndXpertPrisoner(e.target.checked)} /><span>Prisoner</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indXpertMinor} onChange={e => setIndXpertMinor(e.target.checked)} /><span>Minor / Ex-miner</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indXpertOther} onChange={e => setIndXpertOther(e.target.checked)} /><span>Others</span></label>
                {indXpertOther && <input type="text" placeholder="Specify" value={indXpertOtherSpecify} onChange={e => setIndXpertOtherSpecify(e.target.value)} style={{ border:'1px solid #cbd5e1', borderRadius:6, padding:'6px 10px', fontSize:'.85rem', marginTop:4 }} />}
              </div>
            </div>
          )}
          {examUrineLam && hivStatus === 'Positive' && (
            <div className="indications-sub-section warning-border animate-slide-in">
              <h4>Indications for Urine LAM (HIV Positive):</h4>
              <div className="checkbox-grid">
                <label className="checkbox-label"><input type="checkbox" checked={indLamCd4} onChange={e => setIndLamCd4(e.target.checked)} /><span>CD4 &lt; 200 cells/µL</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indLamAhd} onChange={e => setIndLamAhd(e.target.checked)} /><span>AHD (WHO) Stage 4</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indLamCriticallyIll} onChange={e => setIndLamCriticallyIll(e.target.checked)} /><span>Critically Ill</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={indLamOther} onChange={e => setIndLamOther(e.target.checked)} /><span>Others</span></label>
                {indLamOther && <input type="text" placeholder="Specify" value={indLamOtherSpecify} onChange={e => setIndLamOtherSpecify(e.target.value)} style={{ border:'1px solid #cbd5e1', borderRadius:6, padding:'6px 10px', fontSize:'.85rem', marginTop:4 }} />}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Sample */}
        <div className="form-section">
          <h3 className="section-title"><ClipboardList size={18} className="tb-icon" /><span>4. Specimen &amp; Requestor</span></h3>
          <div className="form-grid">
            <div className="input-group">
              <label>Type of Sample</label>
              <select value={sampleType} onChange={e => setSampleType(e.target.value as any)}>
                <option value="Sputum">Sputum</option>
                <option value="Stool">Stool</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {sampleType === 'Other' && (
              <div className="input-group animate-slide-in">
                <label>Specify Sample Type</label>
                <input type="text" value={sampleTypeOther} onChange={e => setSampleTypeOther(e.target.value)} />
              </div>
            )}
            <div className="input-group">
              <label>Date Collected</label>
              <input type="date" value={dateCollected} onChange={e => setDateCollected(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Time Collected</label>
              <input type="time" value={timeCollected} onChange={e => setTimeCollected(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="checkbox-container-custom">
                <input type="checkbox" checked={recollection} onChange={e => setRecollection(e.target.checked)} />
                <span>Recollection Due to Rejection?</span>
              </label>
            </div>
            <div className="input-group">
              <label>Clinician / Requestor Name <span className="req">*</span></label>
              <input type="text" value={clinicianName} onChange={e => setClinicianName(e.target.value)} placeholder="e.g. Dr. M. Kumba" />
            </div>
            <div className="input-group">
              <label>Clinician Phone</label>
              <input type="tel" value={clinicianPhone} onChange={e => setClinicianPhone(e.target.value)} placeholder="e.g. 0888234567" />
            </div>
            <div className="input-group full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={notifyClinicianSms} onChange={e => setNotifyClinicianSms(e.target.checked)} style={{ width:18, height:18, accentColor:'#10b981' }} />
                <span>📱 Notify clinician via SMS when results are ready</span>
              </label>
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
          <button type="submit" className="btn-primary tb-theme">
            <CheckCircle2 size={16} />
            Generate LIMS Request
          </button>
        </div>

      </form>
    </div>
  );
}
