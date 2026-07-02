import React, { useState, useEffect } from 'react';
import type { LimsRequest, TbResults, HivResults } from '../types';
import { FlaskConical, Award, BookOpen, Calculator, Check, AlertTriangle } from 'lucide-react';

interface ResultEntryFormProps {
  request: LimsRequest;
  onSubmit: (results: TbResults | HivResults) => void;
  onCancel: () => void;
}

export default function ResultEntryForm({ request, onSubmit, onCancel }: ResultEntryFormProps) {
  const isTb = request.type === 'TB';

  // Shared state
  const [labSerialNumber, setLabSerialNumber] = useState(`LAB-${request.type}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');

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
  const [geneXpertPerformedBy] = useState('John Mogha');

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
  const [urineLamPerformedBy] = useState('John Mogha');

  const [reviewedBy, setReviewedBy] = useState('Dr. Ruth Phiri');
  const [reviewedDate, setReviewedDate] = useState(new Date().toISOString().split('T')[0]);

  // ==========================================
  // HIV RESULTS STATE
  // ==========================================
  const [dateProcessed, setDateProcessed] = useState(new Date().toISOString().split('T')[0]);
  const [performedBy, setPerformedBy] = useState('John Mogha');
  
  // EID specific
  const [eidDnaPcrResult, setEidDnaPcrResult] = useState<HivResults['eidDnaPcrResult']>('Negative');
  
  // VL specific
  const [vlValueType, setVlValueType] = useState<HivResults['viralLoadValueType']>('Numerical');
  const [vlCopies, setVlCopies] = useState('1000');
  const [vlLog, setVlLog] = useState('3.00');

  // ==========================================
  // SMART AUTOMATIONS
  // ==========================================
  // 1. TB: Detect if RIF resistance is selected and auto-expand and highlight XDR Section
  useEffect(() => {
    if (!isTb) return;
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
  }, [geneXpertResult, isTb]);

  // 2. HIV: Auto-calculate Log copies when numerical count changes
  useEffect(() => {
    if (isTb) return;
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
  }, [vlCopies, vlValueType, isTb]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isTb) {
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
        geneXpertPerformedBy,
        reflexDate: showXdrSection ? xdrDate : undefined,
        reflexResults: showXdrSection ? [
          { drug: 'Isoniazid', result: resIsoniazid, performedBy: geneXpertPerformedBy },
          { drug: 'Ethionamide', result: resEthionamide, performedBy: geneXpertPerformedBy },
          { drug: 'Moxifloxacin', result: resMoxifloxacin, performedBy: geneXpertPerformedBy },
          { drug: 'Levofloxacin', result: resLevofloxacin, performedBy: geneXpertPerformedBy }
        ] : undefined,
        urineLamDate,
        urineLamResult,
        urineLamPerformedBy,
        comment,
        reviewedBy,
        reviewedDate
      };
      onSubmit(tbResults);
    } else {
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
    }
  };

  return (
    <div className="lims-form-container fade-in">
      <div className={`form-header-bar ${isTb ? 'tb-theme' : 'hiv-theme'}`}>
        <h2>Upload Laboratory Results</h2>
        <div className="patient-meta">
          <span>Patient: <strong>{request.patient_name}</strong></span>
          <span>ID: <strong>{request.patient_id}</strong></span>
          <span>Request ID: <strong>{request.id}</strong></span>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="lims-form">
        
        {/* Core Sample Receipt Data */}
        <div className="form-section">
          <h3 className="section-title">
            <FlaskConical size={18} className={isTb ? 'tb-icon' : 'hiv-icon'} />
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

            {isTb ? (
              <>
                <div className="input-group">
                  <label>Macroscopic Appearance</label>
                  <select value={macroscopic} onChange={e => setMacroscopic(e.target.value as any)}>
                    <option value="Muco-purulent">Muco-purulent</option>
                    <option value="Blood-stained">Blood-stained</option>
                    <option value="Saliva">Saliva</option>
                    <option value="Other">Other Appearance</option>
                  </select>
                </div>
                {macroscopic === 'Other' && (
                  <div className="input-group animate-slide-in">
                    <label>Specify Appearance</label>
                    <input type="text" value={macroscopicOther} onChange={e => setMacroscopicOther(e.target.value)} />
                  </div>
                )}
              </>
            ) : (
              <div className="input-group">
                <label>Date Processed</label>
                <input type="date" value={dateProcessed} onChange={e => setDateProcessed(e.target.value)} required />
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            TB RESULT ENTRY FIELDS
            ========================================== */}
        {isTb && (
          <>
            {/* Microscopy results */}
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

                {/* Sample 1 */}
                <div className="micro-row full-width">
                  <div className="sample-label">Sputum Sample 1</div>
                  <div className="sample-inputs">
                    <select value={microResult1} onChange={e => setMicroResult1(e.target.value as any)}>
                      <option value="Not Done">Not Done</option>
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </select>

                    {microResult1 === 'Positive' && (
                      <div className="positive-grading-box animate-slide-in">
                        <select value={microGrading1} onChange={e => setMicroGrading1(e.target.value as any)}>
                          <option value="1+">1+</option>
                          <option value="2+">2+</option>
                          <option value="3+">3+</option>
                          <option value="Actual number">Actual number</option>
                        </select>
                        {microGrading1 === 'Actual number' && (
                          <input type="number" placeholder="Count" value={microActual1} onChange={e => setMicroActual1(e.target.value)} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sample 2 */}
                <div className="micro-row full-width">
                  <div className="sample-label">Sputum Sample 2</div>
                  <div className="sample-inputs">
                    <select value={microResult2} onChange={e => setMicroResult2(e.target.value as any)}>
                      <option value="Not Done">Not Done</option>
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </select>

                    {microResult2 === 'Positive' && (
                      <div className="positive-grading-box animate-slide-in">
                        <select value={microGrading2} onChange={e => setMicroGrading2(e.target.value as any)}>
                          <option value="1+">1+</option>
                          <option value="2+">2+</option>
                          <option value="3+">3+</option>
                          <option value="Actual number">Actual number</option>
                        </select>
                        {microGrading2 === 'Actual number' && (
                          <input type="number" placeholder="Count" value={microActual2} onChange={e => setMicroActual2(e.target.value)} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* GeneXpert / Truenat results */}
            <div className="form-section">
              <h4 className="section-title-sub">GeneXpert / Truenat Assay</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>Assay Date</label>
                  <input type="date" value={geneXpertDate} onChange={e => setGeneXpertDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Assay Technology</label>
                  <div className="toggle-pill-group">
                    <button type="button" className={`toggle-pill ${geneXpertType === 'Xpert Ultra' ? 'active' : ''}`} onClick={() => setGeneXpertType('Xpert Ultra')}>Xpert Ultra</button>
                    <button type="button" className={`toggle-pill ${geneXpertType === 'Truenat' ? 'active' : ''}`} onClick={() => setGeneXpertType('Truenat')}>Truenat</button>
                  </div>
                </div>
                <div className="input-group full-width">
                  <label>Assay Result</label>
                  <select 
                    value={geneXpertResult} 
                    onChange={e => setGeneXpertResult(e.target.value as any)}
                    className={geneXpertResult?.includes('RIF resistant detected') ? 'select-danger' : (geneXpertResult?.includes('detected') ? 'select-warning' : '')}
                  >
                    <option value="MTB not detected">MTB not detected</option>
                    <option value="MTB detected">MTB detected (Rifampicin resistance NOT detected)</option>
                    <option value="MTB detected Trace">MTB detected Trace (Rifampicin resistance Indeterminate/Trace)</option>
                    <option value="RIF resistant detected">🚨 MTB detected (RIF RESISTANCE DETECTED)</option>
                    <option value="No result">No result</option>
                    <option value="Error">Error</option>
                    <option value="Invalid">Invalid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reflex Test XDR (Triggered or Manual Expand) */}
            <div className={`form-section reflex-section ${rifResistantDetected ? 'highlighted' : ''}`}>
              <div className="section-header-row">
                <h4 className="section-title-sub">Reflex Testing results (XDR)</h4>
                {!rifResistantDetected && (
                  <button type="button" className="btn-small-toggle" onClick={() => setShowXdrSection(!showXdrSection)}>
                    {showXdrSection ? 'Hide XDR' : 'Manually Enter XDR'}
                  </button>
                )}
              </div>

              {rifResistantDetected && (
                <div className="alert-message danger">
                  <AlertTriangle size={16} />
                  <span>Rifampicin Resistance detected. Reflex XDR testing is clinically mandated.</span>
                </div>
              )}

              {showXdrSection && (
                <div className="form-grid animate-slide-in">
                  <div className="input-group">
                    <label>Reflex Testing Date</label>
                    <input type="date" value={xdrDate} onChange={e => setXdrDate(e.target.value)} />
                  </div>
                  <div style={{ display: 'none' }}></div> {/* spacer */}

                  <div className="drug-row">
                    <span className="drug-label">Isoniazid (INH)</span>
                    <div className="pill-selector">
                      {['Not Done', 'Susceptible', 'Resistant'].map(res => (
                        <button type="button" key={res} className={`pill-opt ${resIsoniazid === res ? 'active' : ''}`} onClick={() => setResIsoniazid(res as any)}>
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="drug-row">
                    <span className="drug-label">Ethionamide (ETH)</span>
                    <div className="pill-selector">
                      {['Not Done', 'Susceptible', 'Resistant'].map(res => (
                        <button type="button" key={res} className={`pill-opt ${resEthionamide === res ? 'active' : ''}`} onClick={() => setResEthionamide(res as any)}>
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="drug-row">
                    <span className="drug-label">Moxifloxacin (MXF)</span>
                    <div className="pill-selector">
                      {['Not Done', 'Susceptible', 'Resistant'].map(res => (
                        <button type="button" key={res} className={`pill-opt ${resMoxifloxacin === res ? 'active' : ''}`} onClick={() => setResMoxifloxacin(res as any)}>
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="drug-row">
                    <span className="drug-label">Levofloxacin (LFX)</span>
                    <div className="pill-selector">
                      {['Not Done', 'Susceptible', 'Resistant'].map(res => (
                        <button type="button" key={res} className={`pill-opt ${resLevofloxacin === res ? 'active' : ''}`} onClick={() => setResLevofloxacin(res as any)}>
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Urine LAM */}
            {request.type === 'TB' && request.request_details.examinations?.urineLam && (
              <div className="form-section animate-slide-in">
                <h4 className="section-title-sub">Urine LAM Assay</h4>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Urine LAM Run Date</label>
                    <input type="date" value={urineLamDate} onChange={e => setUrineLamDate(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Urine LAM Result</label>
                    <select 
                      value={urineLamResult} 
                      onChange={e => setUrineLamResult(e.target.value as any)}
                      className={urineLamResult === 'Positive' ? 'select-warning' : ''}
                    >
                      <option value="Not Done">Not Done</option>
                      <option value="Negative">Negative</option>
                      <option value="Positive">Positive</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Review Info */}
            <div className="form-section">
              <h4 className="section-title-sub">Review & Sign Off</h4>
              <div className="form-grid">
                <div className="input-group">
                  <label>Results Reviewed By</label>
                  <input type="text" value={reviewedBy} onChange={e => setReviewedBy(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Review Date</label>
                  <input type="date" value={reviewedDate} onChange={e => setReviewedDate(e.target.value)} required />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==========================================
            HIV RESULT ENTRY FIELDS
            ========================================== */}
        {!isTb && (
          <div className="form-section">
            <h3 className="section-title">
              <Award size={18} className="hiv-icon" />
              <span>2. HIV Test Results Entry</span>
            </h3>

            {request.sub_type === 'EID' ? (
              /* EID Results */
              <div className="form-grid animate-slide-in">
                <div className="input-group full-width">
                  <label>DNA-PCR Result</label>
                  <div className="radio-pill-group">
                    <label className={`radio-pill ${eidDnaPcrResult === 'Negative' ? 'active' : ''}`}>
                      <input type="radio" value="Negative" checked={eidDnaPcrResult === 'Negative'} onChange={() => setEidDnaPcrResult('Negative')} />
                      Negative
                    </label>
                    <label className={`radio-pill ${eidDnaPcrResult === 'Positive' ? 'active alert-danger-pill' : ''}`}>
                      <input type="radio" value="Positive" checked={eidDnaPcrResult === 'Positive'} onChange={() => setEidDnaPcrResult('Positive')} />
                      Positive
                    </label>
                    <label className={`radio-pill ${eidDnaPcrResult === 'Inconclusive' ? 'active alert-warning-pill' : ''}`}>
                      <input type="radio" value="Inconclusive" checked={eidDnaPcrResult === 'Inconclusive'} onChange={() => setEidDnaPcrResult('Inconclusive')} />
                      Inconclusive
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              /* Viral Load Results */
              <div className="form-grid animate-slide-in">
                <div className="input-group full-width">
                  <label>Viral Load Measurement</label>
                  <div className="toggle-pill-group">
                    <button 
                      type="button" 
                      className={`toggle-pill ${vlValueType === 'Numerical' ? 'active' : ''}`}
                      onClick={() => setVlValueType('Numerical')}
                    >
                      Numerical Copy Count
                    </button>
                    <button 
                      type="button" 
                      className={`toggle-pill ${vlValueType === 'Undetectable' ? 'active' : ''}`}
                      onClick={() => setVlValueType('Undetectable')}
                    >
                      Target Not Detected (&lt; 20 copies)
                    </button>
                  </div>
                </div>

                {vlValueType === 'Numerical' ? (
                  <>
                    <div className="input-group animate-slide-in">
                      <label>VL Copy Count (copies/mL)</label>
                      <input 
                        type="number" 
                        value={vlCopies} 
                        onChange={e => setVlCopies(e.target.value)} 
                        required={vlValueType === 'Numerical'}
                      />
                    </div>
                    <div className="input-group calculator-read-only animate-slide-in">
                      <label>
                        <Calculator size={14} style={{ marginRight: '6px' }} />
                        Calculated Log10 Value
                      </label>
                      <input type="text" value={vlLog} readOnly className="read-only-input" />
                    </div>
                  </>
                ) : (
                  <div className="full-width alert-message success animate-slide-in">
                    <Check size={16} />
                    <span>Viral Load suppressed: target undetectable. Clinician will be alerted.</span>
                  </div>
                )}
              </div>
            )}

            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Test Performed By</label>
                <input type="text" value={performedBy} onChange={e => setPerformedBy(e.target.value)} required />
              </div>
            </div>
          </div>
        )}

        {/* Global comment field */}
        <div className="form-section">
          <h3 className="section-title">
            <BookOpen size={18} className={isTb ? 'tb-icon' : 'hiv-icon'} />
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

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={`btn-primary ${isTb ? 'tb-theme' : 'hiv-theme'}`}>
            Submit Lab Results
          </button>
        </div>

      </form>
    </div>
  );
}
