import { useEffect } from 'react';

interface TestTypeModalProps {
  onSelect: (type: 'TB' | 'HIV') => void;
  onClose: () => void;
}

export default function TestTypeModal({ onSelect, onClose }: TestTypeModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .tmt-overlay {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(8,12,20,0.82);
          backdrop-filter: blur(8px) saturate(140%);
          -webkit-backdrop-filter: blur(8px) saturate(140%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: tmtFadeIn .22s ease-out;
        }
        @keyframes tmtFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .tmt-card {
          width: 100%; max-width: 500px;
          background: rgba(15,23,42,.95);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 40px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05) inset;
          animation: tmtSlideUp .28s cubic-bezier(.16,1,.3,1);
        }
        @keyframes tmtSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tmt-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 28px;
        }
        .tmt-title { font-family: 'Outfit', sans-serif; font-size: 1.45rem; font-weight: 800; color: #f1f5f9; margin-bottom: 4px; }
        .tmt-sub   { font-size: .88rem; color: #64748b; }
        .tmt-close {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1);
          color: #94a3b8; font-size: 1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .18s; flex-shrink: 0;
        }
        .tmt-close:hover { background: rgba(244,63,94,.15); color: #f43f5e; border-color: rgba(244,63,94,.3); }
        .tmt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .tmt-option {
          padding: 28px 20px 24px;
          border-radius: 16px;
          border: 2px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.03);
          cursor: pointer;
          text-align: center;
          transition: all .22s cubic-bezier(.16,1,.3,1);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .tmt-option:hover { transform: translateY(-3px); }
        .tmt-option.tb:hover { border-color: #10b981; background: rgba(16,185,129,.08); box-shadow: 0 8px 32px rgba(16,185,129,.2); }
        .tmt-option.hiv:hover { border-color: #ec4899; background: rgba(236,72,153,.08); box-shadow: 0 8px 32px rgba(236,72,153,.2); }
        .tmt-icon {
          width: 64px; height: 64px; border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem;
        }
        .tmt-option.tb  .tmt-icon { background: linear-gradient(135deg,#064e3b,#0f766e); }
        .tmt-option.hiv .tmt-icon { background: linear-gradient(135deg,#831843,#7c3aed); }
        .tmt-opt-title { font-family: 'Outfit', sans-serif; font-size: 1.1rem; font-weight: 800; color: #f1f5f9; }
        .tmt-option.tb  .tmt-opt-title { color: #6ee7b7; }
        .tmt-option.hiv .tmt-opt-title { color: #f9a8d4; }
        .tmt-opt-desc { font-size: .75rem; color: #64748b; line-height: 1.5; }
        .tmt-opt-arrow {
          margin-top: 4px;
          font-size: .8rem; font-weight: 700;
          opacity: 0;
          transform: translateY(4px);
          transition: all .2s;
        }
        .tmt-option.tb  .tmt-opt-arrow { color: #10b981; }
        .tmt-option.hiv .tmt-opt-arrow { color: #ec4899; }
        .tmt-option:hover .tmt-opt-arrow { opacity: 1; transform: translateY(0); }
        @media (max-width: 480px) {
          .tmt-grid { grid-template-columns: 1fr; }
          .tmt-card { padding: 24px; }
        }
      `}} />
      <div className="tmt-overlay" onClick={onClose}>
        <div className="tmt-card" onClick={e => e.stopPropagation()}>
          <div className="tmt-header">
            <div>
              <div className="tmt-title">Register New Case</div>
              <div className="tmt-sub">Select the diagnostic test type to begin</div>
            </div>
            <button className="tmt-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div className="tmt-grid">
            <button className="tmt-option tb" onClick={() => onSelect('TB')} id="select-tb">
              <div className="tmt-icon">🧬</div>
              <div className="tmt-opt-title">TB Diagnosis</div>
              <div className="tmt-opt-desc">GeneXpert Ultra, Microscopy, Urine LAM, XDR Reflex Testing</div>
              <div className="tmt-opt-arrow">Begin TB Form →</div>
            </button>
            <button className="tmt-option hiv" onClick={() => onSelect('HIV')} id="select-hiv">
              <div className="tmt-icon">🩸</div>
              <div className="tmt-opt-title">HIV EID / VL</div>
              <div className="tmt-opt-desc">Early Infant Diagnosis, Viral Load Monitoring</div>
              <div className="tmt-opt-arrow">Begin HIV Form →</div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
