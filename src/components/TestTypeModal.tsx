import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';

type Department = 'Molecular' | 'Haematology' | 'Chemistry';
type MolecularSubType = 'TB' | 'HIV';

interface TestTypeModalProps {
  onSelect: (type: 'TB' | 'HIV' | 'Haematology' | 'Chemistry') => void;
  onClose: () => void;
  allowedTypes?: Array<'TB' | 'HIV' | 'Haematology' | 'Chemistry'>;
}

export default function TestTypeModal({ onSelect, onClose, allowedTypes = ['TB', 'HIV', 'Haematology', 'Chemistry'] }: TestTypeModalProps) {
  const [dept, setDept] = useState<Department | null>(null);

  const departments: Array<{
    id: Department;
    emoji: string;
    label: string;
    sublabel: string;
    color: string;
    tests: string[];
  }> = [
    {
      id: 'Molecular',
      emoji: '🧬',
      label: 'Molecular',
      sublabel: 'GeneXpert · HIV Viral Load · EID',
      color: '#3b82f6',
      tests: ['TB / GeneXpert', 'HIV Viral Load', 'Early Infant Diagnosis (EID)'],
    },
    {
      id: 'Haematology',
      emoji: '🩸',
      label: 'Haematology',
      sublabel: 'FBC · Blood Smear · mRDT',
      color: '#ef4444',
      tests: ['Full Blood Count (FBC)', 'Thin Blood Smear', 'Malaria RDT (mRDT)'],
    },
    {
      id: 'Chemistry',
      emoji: '⚗️',
      label: 'Chemistry',
      sublabel: 'KFT · LFT · Lipid Profile · H. pylori',
      color: '#f59e0b',
      tests: ['Kidney Function Test', 'Liver Function Test', 'Lipid Profile', 'H. pylori'],
    },
  ];

  const visibleDepartments = departments.filter(d => {
    if (d.id === 'Molecular') return allowedTypes.includes('TB') || allowedTypes.includes('HIV');
    return allowedTypes.includes(d.id);
  });

  const handleDeptSelect = (d: Department) => {
    if (d === 'Haematology') { onSelect('Haematology'); return; }
    if (d === 'Chemistry')   { onSelect('Chemistry'); return; }
    setDept(d); // Molecular: show sub-picker
  };

  const molecularSubOptions: Array<{ id: MolecularSubType; emoji: string; label: string; desc: string; color: string }> = [
    { id: 'TB',  emoji: '🫁', label: 'TB / GeneXpert',  desc: 'GeneXpert Ultra, ZN Microscopy, Urine LAM, DST', color: '#10b981' },
    { id: 'HIV', emoji: '🔴', label: 'HIV VL / EID',   desc: 'Viral Load quantification, Early Infant Diagnosis', color: '#8b5cf6' },
  ];
  const molecularSubs = molecularSubOptions.filter(item => allowedTypes.includes(item.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel test-type-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Select Department</h2>
            <p>{dept ? 'Choose the specific test type' : 'Which lab department is this request for?'}</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close department picker"><X size={18} /></button>
        </div>

        {/* Dept picker */}
        {!dept && (
          <div className="dept-grid">
            {visibleDepartments.map(d => (
              <button key={d.id} className="dept-card" onClick={() => handleDeptSelect(d.id)}
                style={{ '--dept-color': d.color } as React.CSSProperties}>
                <div className="dept-emoji">{d.emoji}</div>
                <div className="dept-info">
                  <span className="dept-name">{d.label}</span>
                  <span className="dept-sub">{d.sublabel}</span>
                  <ul className="dept-tests">
                    {d.tests.map(t => <li key={t}>{t}</li>)}
                  </ul>
                </div>
                <ChevronRight className="dept-arrow" size={18} />
              </button>
            ))}
          </div>
        )}

        {/* Molecular sub-picker */}
        {dept === 'Molecular' && (
          <div className="sub-pick-wrap">
            <button className="back-link" onClick={() => setDept(null)}>← Back to departments</button>
            <div className="dept-grid">
              {molecularSubs.map(s => (
                <button key={s.id} className="dept-card sub" onClick={() => onSelect(s.id)}
                  style={{ '--dept-color': s.color } as React.CSSProperties}>
                  <div className="dept-emoji">{s.emoji}</div>
                  <div className="dept-info">
                    <span className="dept-name">{s.label}</span>
                    <span className="dept-sub">{s.desc}</span>
                  </div>
                  <ChevronRight className="dept-arrow" size={18} />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
