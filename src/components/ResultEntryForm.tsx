import React, { useState, useEffect } from 'react';
import type { LimsRequest, TbResults, HivResults, HaematologyResults, ChemistryResults } from '../types';
import { FlaskConical, Award, BookOpen, Printer } from 'lucide-react';

interface ResultEntryFormProps {
  request: LimsRequest;
  onSubmit: (results: any) => void;
  onCancel: () => void;
}

export default function ResultEntryForm({ request, onSubmit, onCancel }: ResultEntryFormProps) {
  // Shared state
  const [labSerialNumber, setLabSerialNumber] = useState(`LAB-${request.type.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');
  const [performedBy, setPerformedBy] = useState('John Mogha');

  // ==========================================
  // TB RESULTS STATE
  // ==========================================
  const [macroscopic, setMacroscopic] = useState<TbResults['macroscopicExamination']>('Muco-purulent');
  const [macroscopicOther, setMacroscopicOther] = useState('');

  // Microscopy
  const [microscopyDate, setMicroscopyDate] = useState(new Date().toISOString().split('T')[0]);
  const [microResult1, setMicroResult1] = useState<'Negative' | 'Positive' | 'Not Done'>('Not Done');
  const [microGrading1, setMicroGrading1] = useState<TbResults['microscopySamples'][0]['grading']>('1+');
  const [microActual1, setMicroActual1] = useState('');
  const [microResult2, setMicroResult2] = useState<'Negative' | 'Positive' | 'Not Done'>('Not Done');
  const [microGrading2, setMicroGrading2] = useState<TbResults['microscopySamples'][0]['grading']>('1+');
  const [microActual2, setMicroActual2] = useState('');
  const [examinedBy, setExaminedBy] = useState('John Mogha');

  // GeneXpert
  const [geneXpertDate, setGeneXpertDate] = useState(new Date().toISOString().split('T')[0]);
  const [geneXpertResult, setGeneXpertResult] = useState<TbResults['geneXpertResult']>('MTB not detected');
  const [geneXpertType, setGeneXpertType] = useState<'Xpert Ultra' | 'Truenat'>('Xpert Ultra');

  // Reflex (XDR)
  const [rifResistantDetected, setRifResistantDetected] = useState(false);
  const [showXdrSection, setShowXdrSection] = useState(false);
  const [xdrDate, setXdrDate] = useState(new Date().toISOString().split('T')[0]);
  const [resIsoniazid, setResIsoniazid] = useState<'Resistant' | 'Susceptible' | 'Not Done'>('Not Done');
  const [resEthionamide, setResEthionamide] = useState<'Resistant' | 'Susceptible' | 'Not Done'>('Not Done');
  const [resMoxifloxacin, setResMoxifloxacin] = useState<'Resistant' | 'Susceptible' | 'Not Done'>('Not Done');
  const [resLevofloxacin, setResLevofloxacin] = useState<'Resistant' | 'Susceptible' | 'Not Done'>('Not Done');

  // Urine LAM
  const [urineLamDate, setUrineLamDate] = useState(new Date().toISOString().split('T')[0]);
  const [urineLamResult, setUrineLamResult] = useState<TbResults['urineLamResult']>('Not Done');

  const [reviewedBy, setReviewedBy] = useState('Dr. Ruth Phiri');
  const [reviewedDate, setReviewedDate] = useState(new Date().toISOString().split('T')[0]);

  // ==========================================
  // HIV RESULTS STATE
  // ==========================================
  const [dateProcessed, setDateProcessed] = useState(new Date().toISOString().split('T')[0]);

  // EID specific
  const [eidDnaPcrResult, setEidDnaPcrResult] = useState<HivResults['eidDnaPcrResult']>('Negative');

  // VL specific
  const [vlValueType, setVlValueType] = useState<HivResults['viralLoadValueType']>('Numerical');
  const [vlCopies, setVlCopies] = useState('1000');
  const [vlLog, setVlLog] = useState('3.00');

  // ==========================================
  // HAEMATOLOGY RESULTS STATE
  // ==========================================
  const [wbc, setWbc] = useState('7.2');
  const [rbc, setRbc] = useState('4.5');
  const [hb, setHb] = useState('13.5');
  const [hct, setHct] = useState('40.2');
  const [mcv, setMcv] = useState('88.5');
  const [mch, setMch] = useState('29.8');
  const [mchc, setMchc] = useState('33.4');
  const [plt, setPlt] = useState('245');
  const [neut, setNeut] = useState('60');
  const [lymph, setLymph] = useState('32');
  const [haemInterpretation, setHaemInterpretation] = useState('');

  const [malariaSmear, setMalariaSmear] = useState<'Negative' | 'P. falciparum' | 'P. vivax' | 'P. malariae' | 'P. ovale' | 'Mixed'>('Negative');
  const [malariaParasitaemia, setMalariaParasitaemia] = useState('');
  const [mrdtResult, setMrdtResult] = useState<'Negative' | 'Positive' | 'Invalid'>('Negative');
  const [mrdtAntigen, setMrdtAntigen] = useState<'HRP2 (P. falciparum)' | 'pLDH (Pan)'>('HRP2 (P. falciparum)');

  // ==========================================
  // CHEMISTRY RESULTS STATE
  // ==========================================
  // KFT
  const [urea, setUrea] = useState('5.4');
  const [creatinine, setCreatinine] = useState('85');
  const [egfr, setEgfr] = useState('95');
  const [sodium, setSodium] = useState('140');
  const [potassium, setPotassium] = useState('4.2');
  const [chloride, setChloride] = useState('102');
  // LFT
  const [alt, setAlt] = useState('25');
  const [ast, setAst] = useState('30');
  const [alp, setAlp] = useState('75');
  const [ggt, setGgt] = useState('28');
  const [totalBilirubin, setTotalBilirubin] = useState('12');
  const [directBilirubin, setDirectBilirubin] = useState('3');
  const [totalProtein, setTotalProtein] = useState('72');
  const [albumin, setAlbumin] = useState('42');
  // Lipids
  const [chol, setChol] = useState('4.8');
  const [ldl, setLdl] = useState('2.8');
  const [hdl, setHdl] = useState('1.4');
  const [trig, setTrig] = useState('1.3');
  // H. pylori
  const [hpMethod, setHpMethod] = useState<'Rapid Antigen (Stool)' | 'Serology (IgG)'>('Rapid Antigen (Stool)');
  const [hpResult, setHpResult] = useState<'Positive' | 'Negative' | 'Invalid'>('Negative');


  // ==========================================
  // SMART AUTOMATIONS
  // ==========================================
  useEffect(() => {
    if (request.type !== 'TB') return;
    if (geneXpertResult === 'RIF resistant detected') {
      setRifResistantDetected(true);
      setShowXdrSection(true);
      if (resIsoniazid === 'Not Done') setResIsoniazid('Susceptible');
      if (resEthionamide === 'Not Done') setResEthionamide('Susceptible');
      if (resMoxifloxacin === 'Not Done') setResMoxifloxacin('Susceptible');
      if (resLevofloxacin === 'Not Done') setResLevofloxacin('Susceptible');
    } else {
      setRifResistantDetected(false);
      if (geneXpertResult !== 'MTB detected') {
        setShowXdrSection(false);
        setResIsoniazid('Not Done');
        setResEthionamide('Not Done');
        setResMoxifloxacin('Not Done');
        setResLevofloxacin('Not Done');
      }
    }
  }, [geneXpertResult, request.type, resEthionamide, resIsoniazid, resLevofloxacin, resMoxifloxacin]);

  useEffect(() => {
    if (request.type !== 'HIV') return;
    if (vlValueType === 'Undetectable') {
      setVlLog('0.00');
      setVlCopies('');
    } else {
      const copiesNum = parseFloat(vlCopies);
      if (!isNaN(copiesNum) && copiesNum > 0) {
        setVlLog(Math.log10(copiesNum).toFixed(2));
      } else {
        setVlLog('0.00');
      }
    }
  }, [vlCopies, vlValueType, request.type]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (request.type === 'TB') {
      const tbResults: TbResults = {
        labSerialNumber,
        dateReceived,
        macroscopicExamination: macroscopic,
        macroscopicOther: macroscopic === 'Other' ? macroscopicOther : undefined,
        microscopyDate,
        microscopySamples: [
          {
            sampleNum: 1,
            result: microResult1,
            grading: microResult1 === 'Positive' ? microGrading1 : undefined,
            actualNumber: microResult1 === 'Positive' && microGrading1 === 'Actual number' ? parseInt(microActual1) : undefined,
            examinedBy
          },
          {
            sampleNum: 2,
            result: microResult2,
            grading: microResult2 === 'Positive' ? microGrading2 : undefined,
            actualNumber: microResult2 === 'Positive' && microGrading2 === 'Actual number' ? parseInt(microActual2) : undefined,
            examinedBy
          }
        ],
        geneXpertDate,
        geneXpertType,
        geneXpertResult,
        geneXpertPerformedBy: performedBy,
        reflexDate: showXdrSection ? xdrDate : undefined,
        reflexResults: showXdrSection ? [
          { drug: 'Isoniazid', result: resIsoniazid, performedBy },
          { drug: 'Ethionamide', result: resEthionamide, performedBy },
          { drug: 'Moxifloxacin', result: resMoxifloxacin, performedBy },
          { drug: 'Levofloxacin', result: resLevofloxacin, performedBy }
        ] : undefined,
        urineLamDate,
        urineLamResult,
        urineLamPerformedBy: performedBy,
        comment,
        reviewedBy,
        reviewedDate
      };
      onSubmit(tbResults);
    } else if (request.type === 'HIV') {
      const hivResults: HivResults = {
        labSerialNumber,
        dateReceived,
        dateProcessed,
        eidDnaPcrResult: request.sub_type === 'EID' ? eidDnaPcrResult : undefined,
        viralLoadValueType: request.sub_type === 'Viral Load' ? vlValueType : undefined,
        viralLoadCopies: request.sub_type === 'Viral Load' && vlValueType === 'Numerical' ? parseInt(vlCopies) : undefined,
        viralLoadLogValue: request.sub_type === 'Viral Load' && vlValueType === 'Numerical' ? parseFloat(vlLog) : undefined,
        performedBy,
        comment
      };
      onSubmit(hivResults);
    } else if (request.type === 'Haematology') {
      const haemResults: HaematologyResults = {
        labSerialNumber,
        dateReceived,
        performedBy,
        fbc: request.request_details.tests.fbc ? {
          wbc: wbc ? parseFloat(wbc) : undefined,
          rbc: rbc ? parseFloat(rbc) : undefined,
          haemoglobin: hb ? parseFloat(hb) : undefined,
          haematocrit: hct ? parseFloat(hct) : undefined,
          mcv: mcv ? parseFloat(mcv) : undefined,
          mch: mch ? parseFloat(mch) : undefined,
          mchc: mchc ? parseFloat(mchc) : undefined,
          platelets: plt ? parseInt(plt) : undefined,
          neutrophils: neut ? parseFloat(neut) : undefined,
          lymphocytes: lymph ? parseFloat(lymph) : undefined,
          interpretation: haemInterpretation || undefined
        } : undefined,
        malariaSmear: request.request_details.tests.thinBloodSmear ? malariaSmear : undefined,
        malariaParasitaemia: request.request_details.tests.thinBloodSmear && malariaSmear !== 'Negative' ? malariaParasitaemia : undefined,
        mrdtResult: request.request_details.tests.mrdt ? mrdtResult : undefined,
        mrdtAntigen: request.request_details.tests.mrdt && mrdtResult === 'Positive' ? mrdtAntigen : undefined,
        comment
      };
      onSubmit(haemResults);
    } else if (request.type === 'Chemistry') {
      const chemResults: ChemistryResults = {
        labSerialNumber,
        dateReceived,
        performedBy,
        kft: request.request_details.tests.kft ? {
          urea: urea ? parseFloat(urea) : undefined,
          creatinine: creatinine ? parseFloat(creatinine) : undefined,
          egfr: egfr ? parseFloat(egfr) : undefined,
          sodiumNa: sodium ? parseFloat(sodium) : undefined,
          potassiumK: potassium ? parseFloat(potassium) : undefined,
          chloride: chloride ? parseFloat(chloride) : undefined
        } : undefined,
        lft: request.request_details.tests.lft ? {
          alt: alt ? parseFloat(alt) : undefined,
          ast: ast ? parseFloat(ast) : undefined,
          alp: alp ? parseFloat(alp) : undefined,
          ggt: ggt ? parseFloat(ggt) : undefined,
          totalBilirubin: totalBilirubin ? parseFloat(totalBilirubin) : undefined,
          directBilirubin: directBilirubin ? parseFloat(directBilirubin) : undefined,
          totalProtein: totalProtein ? parseFloat(totalProtein) : undefined,
          albumin: albumin ? parseFloat(albumin) : undefined
        } : undefined,
        lipids: request.request_details.tests.lipidProfile ? {
          totalCholesterol: chol ? parseFloat(chol) : undefined,
          ldl: ldl ? parseFloat(ldl) : undefined,
          hdl: hdl ? parseFloat(hdl) : undefined,
          triglycerides: trig ? parseFloat(trig) : undefined
        } : undefined,
        hpylori: request.request_details.tests.hpylori ? {
          method: hpMethod,
          result: hpResult
        } : undefined,
        comment
      };
      onSubmit(chemResults);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="lims-form-container fade-in">
      <div className={`form-header-bar ${request.type.toLowerCase()}-theme`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h2>Upload Laboratory Results</h2>
            <div className="patient-meta">
              <span>Patient: <strong>{request.patient_name}</strong></span>
              <span>ID: <strong>{request.patient_id}</strong></span>
              <span>Request ID: <strong>{request.id}</strong></span>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Printer size={15} /> Print View
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="lims-form">

        {/* Specimen Receipt Logs */}
        <div className="form-section">
          <h3 className="section-title">
            <FlaskConical size={18} />
            <span>1. Specimen Receipt Logs</span>
          </h3>

          <div className="form-grid">
            <div className="input-group">
              <label>Laboratory Serial Number</label>
              <input type="text" value={labSerialNumber} onChange={e => setLabSerialNumber(e.target.value)} required />
            </div>

            <div className="input-group">
              <label>Date Sample Received</label>
              <input type="date" value={dateReceived} onChange={e => setDateReceived(e.target.value)} required />
            </div>

            <div className="input-group">
              <label>Analyst / Tech Email</label>
              <input type="text" value={performedBy} onChange={e => setPerformedBy(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* ==========================================
            TB RESULT ENTRY FIELDS
            ========================================== */}
        {request.type === 'TB' && (
          <>
            <div className="form-section">
              <h4 className="section-title-sub">Macroscopic Examination</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>Appearance of Sputum</label>
                  <select value={macroscopic} onChange={e => setMacroscopic(e.target.value as any)}>
                    <option value="Muco-purulent">Muco-purulent</option>
                    <option value="Blood-stained">Blood-stained</option>
                    <option value="Saliva">Saliva</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {macroscopic === 'Other' && (
                  <div className="input-group">
                    <label>Specify Appearance</label>
                    <input type="text" placeholder="Specify macroscopic appearance" value={macroscopicOther} onChange={e => setMacroscopicOther(e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h4 className="section-title-sub">Ziehl-Neelsen / Fluorescence Microscopy</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>Microscopy Analysis Date</label>
                  <input type="date" value={microscopyDate} onChange={e => setMicroscopyDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Examined By</label>
                  <input type="text" value={examinedBy} onChange={e => setExaminedBy(e.target.value)} />
                </div>

                <div className="micro-row full-width" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="sample-label" style={{ minWidth: 120, fontWeight: 600 }}>Sputum Sample 1</div>
                    <div className="sample-inputs" style={{ display: 'flex', gap: 10, flex: 1 }}>
                      <select value={microResult1} onChange={e => setMicroResult1(e.target.value as any)} style={{ flex: 1 }}>
                        <option value="Not Done">Not Done</option>
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                      {microResult1 === 'Positive' && (
                        <select value={microGrading1} onChange={e => setMicroGrading1(e.target.value as any)} style={{ flex: 1 }}>
                          <option value="1+">1+</option>
                          <option value="2+">2+</option>
                          <option value="3+">3+</option>
                          <option value="Actual number">Actual number</option>
                        </select>
                      )}
                      {microResult1 === 'Positive' && microGrading1 === 'Actual number' && (
                        <input type="number" placeholder="Enter actual count" value={microActual1} onChange={e => setMicroActual1(e.target.value)} style={{ flex: 1 }} />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div className="sample-label" style={{ minWidth: 120, fontWeight: 600 }}>Sputum Sample 2</div>
                    <div className="sample-inputs" style={{ display: 'flex', gap: 10, flex: 1 }}>
                      <select value={microResult2} onChange={e => setMicroResult2(e.target.value as any)} style={{ flex: 1 }}>
                        <option value="Not Done">Not Done</option>
                        <option value="Negative">Negative</option>
                        <option value="Positive">Positive</option>
                      </select>
                      {microResult2 === 'Positive' && (
                        <select value={microGrading2} onChange={e => setMicroGrading2(e.target.value as any)} style={{ flex: 1 }}>
                          <option value="1+">1+</option>
                          <option value="2+">2+</option>
                          <option value="3+">3+</option>
                          <option value="Actual number">Actual number</option>
                        </select>
                      )}
                      {microResult2 === 'Positive' && microGrading2 === 'Actual number' && (
                        <input type="number" placeholder="Enter actual count" value={microActual2} onChange={e => setMicroActual2(e.target.value)} style={{ flex: 1 }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 className="section-title-sub">GeneXpert / Truenat Assay</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>GeneXpert Analysis Date</label>
                  <input type="date" value={geneXpertDate} onChange={e => setGeneXpertDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Assay Platform</label>
                  <select value={geneXpertType} onChange={e => setGeneXpertType(e.target.value as any)}>
                    <option value="Xpert Ultra">Xpert Ultra</option>
                    <option value="Truenat">Truenat</option>
                  </select>
                </div>
                <div className="input-group full-width">
                  <label>GeneXpert Result</label>
                  <select value={geneXpertResult} onChange={e => setGeneXpertResult(e.target.value as any)}>
                    <option value="MTB not detected">MTB not detected</option>
                    <option value="MTB detected">MTB detected (Rifampicin resistance NOT detected)</option>
                    <option value="RIF resistant detected">MTB detected (RIF RESISTANCE DETECTED)</option>
                    <option value="Error">Error</option>
                  </select>
                </div>
              </div>

              {rifResistantDetected && (
                <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, color: '#ef4444', fontWeight: 600, fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  ⚠️ RIF RESISTANCE DETECTED: Automated reflex testing for second-line drugs (XDR) initiated.
                </div>
              )}
            </div>

            {showXdrSection && (
              <div className="form-section reflex-xdr-section" style={{ borderLeft: '3px solid #ef4444', paddingLeft: 16 }}>
                <h4 className="section-title-sub" style={{ color: '#ef4444' }}>Second-Line Drug Susceptibility Reflex Assay (XDR)</h4>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Reflex Testing Date</label>
                    <input type="date" value={xdrDate} onChange={e => setXdrDate(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Isoniazid (INH)</label>
                    <select value={resIsoniazid} onChange={e => setResIsoniazid(e.target.value as any)}>
                      <option value="Not Done">Not Done</option>
                      <option value="Susceptible">Susceptible</option>
                      <option value="Resistant">Resistant</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Ethionamide (Eto)</label>
                    <select value={resEthionamide} onChange={e => setResEthionamide(e.target.value as any)}>
                      <option value="Not Done">Not Done</option>
                      <option value="Susceptible">Susceptible</option>
                      <option value="Resistant">Resistant</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Moxifloxacin (Mfx)</label>
                    <select value={resMoxifloxacin} onChange={e => setResMoxifloxacin(e.target.value as any)}>
                      <option value="Not Done">Not Done</option>
                      <option value="Susceptible">Susceptible</option>
                      <option value="Resistant">Resistant</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Levofloxacin (Lfx)</label>
                    <select value={resLevofloxacin} onChange={e => setResLevofloxacin(e.target.value as any)}>
                      <option value="Not Done">Not Done</option>
                      <option value="Susceptible">Susceptible</option>
                      <option value="Resistant">Resistant</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="form-section">
              <h4 className="section-title-sub">Urine Lipoarabinomannan (Urine LAM)</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>Urine LAM Analysis Date</label>
                  <input type="date" value={urineLamDate} onChange={e => setUrineLamDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Urine LAM Result</label>
                  <select value={urineLamResult} onChange={e => setUrineLamResult(e.target.value as any)}>
                    <option value="Not Done">Not Done</option>
                    <option value="Negative">Negative</option>
                    <option value="Positive">Positive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4 className="section-title-sub">Result Verification & Sign-off</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>Reviewed / Validated By</label>
                  <input type="text" value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Verification Date</label>
                  <input type="date" value={reviewedDate} onChange={e => setReviewedDate(e.target.value)} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==========================================
            HIV RESULT ENTRY FIELDS
            ========================================== */}
        {request.type === 'HIV' && (
          <div className="form-section">
            <h3 className="section-title"><Award size={18} /><span>2. HIV Test Results</span></h3>

            <div className="form-grid" style={{ marginBottom: 20 }}>
              <div className="input-group">
                <label>Date Processed</label>
                <input type="date" value={dateProcessed} onChange={e => setDateProcessed(e.target.value)} required />
              </div>
            </div>

            {request.sub_type === 'EID' ? (
              <div className="form-grid">
                <div className="input-group full-width">
                  <label>DNA-PCR Result</label>
                  <select value={eidDnaPcrResult} onChange={e => setEidDnaPcrResult(e.target.value as any)}>
                    <option value="Negative">Negative</option>
                    <option value="Positive">Positive</option>
                    <option value="Inconclusive">Inconclusive</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="input-group">
                  <label>Viral Load Result Type</label>
                  <select value={vlValueType} onChange={e => setVlValueType(e.target.value as any)}>
                    <option value="Numerical">Numerical Value</option>
                    <option value="Undetectable">Undetectable (&lt; 20 copies/mL)</option>
                  </select>
                </div>
                {vlValueType === 'Numerical' ? (
                  <>
                    <div className="input-group">
                      <label>Viral Load copies/mL</label>
                      <input type="number" value={vlCopies} onChange={e => setVlCopies(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>Calculated Log10</label>
                      <input type="text" value={vlLog} readOnly />
                    </div>
                  </>
                ) : (
                  <div className="input-group" style={{ display: 'flex', alignItems: 'center', color: '#10b981', fontWeight: 600, fontSize: '.9rem', padding: '10px 0 0 10px' }}>
                    🧬 Viral Load is Undetectable (calculated log value is 0.00).
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            HAEMATOLOGY RESULT ENTRY FIELDS
            ========================================== */}
        {request.type === 'Haematology' && (
          <>
            {request.request_details.tests.fbc && (
              <div className="form-section">
                <h4 className="section-title-sub">Full Blood Count (FBC) Parameters</h4>
                <div className="form-grid">
                  <div className="input-group">
                    <label>WBC (10^9 /L)</label>
                    <input type="number" step="0.1" value={wbc} onChange={e => setWbc(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>RBC (10^12 /L)</label>
                    <input type="number" step="0.01" value={rbc} onChange={e => setRbc(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Haemoglobin (g/dL)</label>
                    <input type="number" step="0.1" value={hb} onChange={e => setHb(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Haematocrit (%)</label>
                    <input type="number" step="0.1" value={hct} onChange={e => setHct(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>MCV (fL)</label>
                    <input type="number" step="0.1" value={mcv} onChange={e => setMcv(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>MCH (pg)</label>
                    <input type="number" step="0.1" value={mch} onChange={e => setMch(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>MCHC (g/dL)</label>
                    <input type="number" step="0.1" value={mchc} onChange={e => setMchc(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Platelets (10^9 /L)</label>
                    <input type="number" value={plt} onChange={e => setPlt(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Neutrophils (%)</label>
                    <input type="number" step="0.1" value={neut} onChange={e => setNeut(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Lymphocytes (%)</label>
                    <input type="number" step="0.1" value={lymph} onChange={e => setLymph(e.target.value)} />
                  </div>
                  <div className="input-group full-width">
                    <label>Haematological Interpretation</label>
                    <input type="text" placeholder="e.g. Mild microcytic hypochromic anaemia" value={haemInterpretation} onChange={e => setHaemInterpretation(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {(request.request_details.tests.thinBloodSmear || request.request_details.tests.mrdt) && (
              <div className="form-section">
                <h4 className="section-title-sub">Malaria Screening Results</h4>
                <div className="form-grid">
                  {request.request_details.tests.thinBloodSmear && (
                    <>
                      <div className="input-group">
                        <label>Thin Blood Smear Smear</label>
                        <select value={malariaSmear} onChange={e => setMalariaSmear(e.target.value as any)}>
                          <option value="Negative">Negative</option>
                          <option value="P. falciparum">P. falciparum</option>
                          <option value="P. vivax">P. vivax</option>
                          <option value="Mixed">Mixed infection</option>
                        </select>
                      </div>
                      {malariaSmear !== 'Negative' && (
                        <div className="input-group">
                          <label>Parasitaemia Density (e.g. 1+, 2+, Count)</label>
                          <input type="text" value={malariaParasitaemia} onChange={e => setMalariaParasitaemia(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}

                  {request.request_details.tests.mrdt && (
                    <>
                      <div className="input-group">
                        <label>Malaria RDT Result</label>
                        <select value={mrdtResult} onChange={e => setMrdtResult(e.target.value as any)}>
                          <option value="Negative">Negative</option>
                          <option value="Positive">Positive</option>
                          <option value="Invalid">Invalid</option>
                        </select>
                      </div>
                      {mrdtResult === 'Positive' && (
                        <div className="input-group">
                          <label>Detected Antigen</label>
                          <select value={mrdtAntigen} onChange={e => setMrdtAntigen(e.target.value as any)}>
                            <option value="HRP2 (P. falciparum)">HRP2 (P. falciparum)</option>
                            <option value="pLDH (Pan)">pLDH (Pan)</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ==========================================
            CHEMISTRY RESULT ENTRY FIELDS
            ========================================== */}
        {request.type === 'Chemistry' && (
          <>
            {request.request_details.tests.kft && (
              <div className="form-section">
                <h4 className="section-title-sub">Kidney Function Panels (KFT)</h4>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Urea (mmol/L)</label>
                    <input type="number" step="0.1" value={urea} onChange={e => setUrea(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Creatinine (µmol/L)</label>
                    <input type="number" value={creatinine} onChange={e => setCreatinine(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>eGFR (mL/min/1.73m²)</label>
                    <input type="number" value={egfr} onChange={e => setEgfr(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Sodium (Na⁺) (mmol/L)</label>
                    <input type="number" value={sodium} onChange={e => setSodium(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Potassium (K⁺) (mmol/L)</label>
                    <input type="number" step="0.1" value={potassium} onChange={e => setPotassium(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Chloride (Cl⁻) (mmol/L)</label>
                    <input type="number" value={chloride} onChange={e => setChloride(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {request.request_details.tests.lft && (
              <div className="form-section">
                <h4 className="section-title-sub">Liver Function Panels (LFT)</h4>
                <div className="form-grid">
                  <div className="input-group">
                    <label>ALT (SGPT) (U/L)</label>
                    <input type="number" value={alt} onChange={e => setAlt(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>AST (SGOT) (U/L)</label>
                    <input type="number" value={ast} onChange={e => setAst(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Alkaline Phosphatase (ALP) (U/L)</label>
                    <input type="number" value={alp} onChange={e => setAlp(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>GGT (U/L)</label>
                    <input type="number" value={ggt} onChange={e => setGgt(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Total Bilirubin (µmol/L)</label>
                    <input type="number" value={totalBilirubin} onChange={e => setTotalBilirubin(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Direct Bilirubin (µmol/L)</label>
                    <input type="number" value={directBilirubin} onChange={e => setDirectBilirubin(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Total Protein (g/L)</label>
                    <input type="number" value={totalProtein} onChange={e => setTotalProtein(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Albumin (g/L)</label>
                    <input type="number" value={albumin} onChange={e => setAlbumin(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {request.request_details.tests.lipidProfile && (
              <div className="form-section">
                <h4 className="section-title-sub">Lipid Profile Panels</h4>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Total Cholesterol (mmol/L)</label>
                    <input type="number" step="0.1" value={chol} onChange={e => setChol(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>LDL Cholesterol (mmol/L)</label>
                    <input type="number" step="0.1" value={ldl} onChange={e => setLdl(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>HDL Cholesterol (mmol/L)</label>
                    <input type="number" step="0.1" value={hdl} onChange={e => setHdl(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Triglycerides (mmol/L)</label>
                    <input type="number" step="0.1" value={trig} onChange={e => setTrig(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {request.request_details.tests.hpylori && (
              <div className="form-section">
                <h4 className="section-title-sub">H. pylori Screening</h4>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Method</label>
                    <select value={hpMethod} onChange={e => setHpMethod(e.target.value as any)}>
                      <option value="Rapid Antigen (Stool)">Rapid Antigen (Stool)</option>
                      <option value="Serology (IgG)">Serology (IgG)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Result</label>
                    <select value={hpResult} onChange={e => setHpResult(e.target.value as any)}>
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                      <option value="Invalid">Invalid</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="form-section">
          <h3 className="section-title">
            <BookOpen size={18} />
            <span>Comment & Notes</span>
          </h3>
          <div className="input-group full-width">
            <textarea
              rows={3}
              placeholder="Enter lab observations, recommendations, or note sample quality issues."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={`btn-primary ${request.type.toLowerCase()}-theme`}>
            Submit Lab Results
          </button>
        </div>

      </form>
    </div>
  );
}
