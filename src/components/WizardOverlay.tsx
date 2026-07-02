import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface WizardStep {
  title: string;
  subtitle?: string;
  fields: React.ReactNode;
  requiredCheck?: () => string[];
}

interface WizardOverlayProps {
  steps: WizardStep[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onSubmit: () => void;
  isLastStep: boolean;
  accentColor?: 'tb' | 'hiv' | 'lab';
  title: string;
  onStepRequiredCheck?: () => string[];
}

const ACCENT = {
  tb:  { color: '#10b981', glow: 'rgba(16,185,129,.25)', dark: '#064e3b' },
  hiv: { color: '#ec4899', glow: 'rgba(236,72,153,.25)', dark: '#831843' },
  lab: { color: '#3b82f6', glow: 'rgba(59,130,246,.25)',  dark: '#1e3a8a' },
};

export default function WizardOverlay({
  steps, currentStep, onNext, onBack, onClose, onSubmit,
  isLastStep, accentColor = 'tb', title, onStepRequiredCheck
}: WizardOverlayProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [warningFields, setWarningFields] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const acc = ACCENT[accentColor];
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Scroll content to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === 'Escape') { onBack(); }
      if (e.key === 'Enter' && tag !== 'TEXTAREA' && tag !== 'BUTTON') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleNext = () => {
    const missing = onStepRequiredCheck ? onStepRequiredCheck() : [];
    if (missing.length > 0) {
      setWarningFields(missing);
      setShowWarning(true);
      return;
    }
    if (isLastStep) onSubmit();
    else onNext();
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .wiz-overlay {
          position: fixed; inset: 0; z-index: 8000;
          background: radial-gradient(ellipse at 30% 20%, #0a1628 0%, #04070e 70%);
          display: flex; flex-direction: column;
          animation: wizFadeIn .2s ease-out;
        }
        @keyframes wizFadeIn { from { opacity: 0; } to { opacity: 1; } }

        .wiz-topbar {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 32px;
          border-bottom: 1px solid rgba(255,255,255,.07);
          flex-shrink: 0;
        }
        .wiz-top-title {
          font-family: 'Outfit', sans-serif;
          font-size: .92rem; font-weight: 700; color: #f1f5f9;
          flex: 1;
          display: flex; align-items: center; gap: 10px;
        }
        .wiz-top-badge {
          font-size: .72rem; font-weight: 700;
          padding: 3px 10px; border-radius: 99px;
          color: #fff;
        }
        .wiz-step-count {
          font-size: .82rem; font-weight: 600;
          color: #475569;
          white-space: nowrap;
        }
        .wiz-close-btn {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.09);
          color: #94a3b8; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .18s; flex-shrink: 0;
        }
        .wiz-close-btn:hover { background: rgba(244,63,94,.15); color: #f43f5e; }

        .wiz-progress-bar {
          height: 3px;
          background: rgba(255,255,255,.05);
          flex-shrink: 0;
        }
        .wiz-progress-fill {
          height: 100%;
          transition: width .4s cubic-bezier(.16,1,.3,1);
          border-radius: 0 99px 99px 0;
        }

        .wiz-body {
          flex: 1; overflow-y: auto;
          display: flex; flex-direction: column; align-items: center;
          padding: 48px 24px 120px;
          scroll-behavior: smooth;
        }
        .wiz-step-header {
          text-align: center;
          max-width: 560px; width: 100%;
          margin-bottom: 36px;
          animation: wizStepIn .28s cubic-bezier(.16,1,.3,1);
        }
        @keyframes wizStepIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wiz-step-num {
          display: inline-flex;
          width: 40px; height: 40px; border-radius: 50%;
          align-items: center; justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-size: .9rem; font-weight: 800;
          color: #fff; margin-bottom: 16px;
        }
        .wiz-step-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem; font-weight: 800;
          color: #f8fafc; line-height: 1.2;
          margin-bottom: 10px;
          letter-spacing: -.5px;
        }
        .wiz-step-sub {
          font-size: .92rem; color: #64748b; line-height: 1.6;
        }
        .wiz-fields {
          max-width: 560px; width: 100%;
          animation: wizStepIn .28s cubic-bezier(.16,1,.3,1);
        }
        /* Make inputs larger in wizard mode */
        .wiz-fields .input-group label {
          font-size: .9rem; color: #94a3b8; margin-bottom: 10px;
        }
        .wiz-fields input[type="text"],
        .wiz-fields input[type="number"],
        .wiz-fields input[type="tel"],
        .wiz-fields input[type="date"],
        .wiz-fields input[type="time"],
        .wiz-fields select,
        .wiz-fields textarea {
          background: rgba(255,255,255,.06) !important;
          border-color: rgba(255,255,255,.12) !important;
          color: #f1f5f9 !important;
          font-size: 1.05rem !important;
          padding: 14px 16px !important;
          border-radius: 10px !important;
        }
        .wiz-fields input::placeholder { color: #475569 !important; }
        .wiz-fields input:focus,
        .wiz-fields select:focus,
        .wiz-fields textarea:focus {
          border-color: var(--wiz-accent, #10b981) !important;
          box-shadow: 0 0 0 3px var(--wiz-glow, rgba(16,185,129,.2)) !important;
          background: rgba(255,255,255,.08) !important;
        }
        .wiz-fields .toggle-pill-group {
          background: rgba(255,255,255,.05);
          border-color: rgba(255,255,255,.08);
        }
        .wiz-fields .toggle-pill { color: #94a3b8; }
        .wiz-fields .toggle-pill.active { background: var(--wiz-accent, #10b981); color: #fff; }
        .wiz-fields .input-group { margin-bottom: 20px; }

        /* Bottom nav bar */
        .wiz-bottom {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
          background: rgba(4,7,14,.95);
          border-top: 1px solid rgba(255,255,255,.07);
          backdrop-filter: blur(12px);
          z-index: 10;
        }
        .wiz-back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 22px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 10px;
          color: #94a3b8;
          font-size: .9rem; font-weight: 600;
          cursor: pointer; transition: all .18s;
          font-family: 'Inter', sans-serif;
        }
        .wiz-back-btn:hover { background: rgba(255,255,255,.1); color: #f1f5f9; }
        .wiz-back-btn:disabled { opacity: .3; cursor: not-allowed; }
        .wiz-next-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 28px;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: .95rem; font-weight: 700;
          cursor: pointer; transition: all .2s;
          font-family: 'Inter', sans-serif;
          letter-spacing: .1px;
          box-shadow: 0 4px 16px var(--wiz-glow, rgba(16,185,129,.3));
        }
        .wiz-next-btn:hover { transform: translateY(-1px); }

        /* Step dots */
        .wiz-dots {
          display: flex; align-items: center; gap: 6px;
        }
        .wiz-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,.15);
          transition: all .3s;
        }
        .wiz-dot.active {
          width: 20px;
          border-radius: 99px;
        }

        /* Warning dialog */
        .wiz-warning-overlay {
          position: fixed; inset: 0; z-index: 9500;
          background: rgba(0,0,0,.6);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          animation: wizFadeIn .15s ease-out;
        }
        .wiz-warning-card {
          background: #0f172a;
          border: 1px solid rgba(245,158,11,.25);
          border-radius: 16px;
          padding: 28px;
          max-width: 400px; width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,.6);
          animation: wizStepIn .2s ease-out;
        }
        .wiz-warning-icon { font-size: 2rem; margin-bottom: 12px; }
        .wiz-warning-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem; font-weight: 700;
          color: #fbbf24; margin-bottom: 8px;
        }
        .wiz-warning-body {
          font-size: .85rem; color: #94a3b8;
          line-height: 1.6; margin-bottom: 20px;
        }
        .wiz-warning-fields {
          background: rgba(245,158,11,.08);
          border: 1px solid rgba(245,158,11,.15);
          border-radius: 8px; padding: 10px 14px;
          margin-bottom: 18px;
        }
        .wiz-warning-fields ul {
          list-style: none; padding: 0;
          font-size: .82rem; color: #fcd34d;
        }
        .wiz-warning-fields ul li::before { content: "• "; }
        .wiz-warning-actions { display: flex; gap: 10px; }
        .wiz-warn-back {
          flex: 1; padding: 10px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 8px; color: #94a3b8;
          font-size: .85rem; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
        }
        .wiz-warn-continue {
          flex: 1; padding: 10px;
          background: rgba(245,158,11,.15);
          border: 1px solid rgba(245,158,11,.3);
          border-radius: 8px; color: #fbbf24;
          font-size: .85rem; font-weight: 700;
          cursor: pointer; font-family: 'Inter', sans-serif;
        }

        @media (max-width: 600px) {
          .wiz-topbar  { padding: 12px 16px; }
          .wiz-body    { padding: 32px 16px 100px; }
          .wiz-bottom  { padding: 12px 16px; }
          .wiz-step-title { font-size: 1.5rem; }
        }
      `}} />

      <div className="wiz-overlay" style={{ '--wiz-accent': acc.color, '--wiz-glow': acc.glow } as React.CSSProperties}>

        {/* Top bar */}
        <div className="wiz-topbar">
          <div className="wiz-top-title">
            <span className="wiz-top-badge" style={{ background: acc.dark }}>
              {accentColor === 'tb' ? '🧬 TB' : accentColor === 'hiv' ? '🩸 HIV' : '🔬 Lab'}
            </span>
            {title}
          </div>
          <span className="wiz-step-count">Step {currentStep + 1} of {steps.length}</span>
          <button className="wiz-close-btn" onClick={onClose} aria-label="Exit wizard">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="wiz-progress-bar">
          <div className="wiz-progress-fill" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${acc.dark}, ${acc.color})` }} />
        </div>

        {/* Body */}
        <div className="wiz-body" ref={contentRef}>
          <div className="wiz-step-header">
            <div className="wiz-step-num" style={{ background: `linear-gradient(135deg, ${acc.dark}, ${acc.color})` }}>
              {currentStep + 1}
            </div>
            <div className="wiz-step-title">{step.title}</div>
            {step.subtitle && <div className="wiz-step-sub">{step.subtitle}</div>}
          </div>
          <div className="wiz-fields">
            {step.fields}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="wiz-bottom">
          <button
            className="wiz-back-btn"
            onClick={currentStep === 0 ? onClose : onBack}
            disabled={false}
          >
            <ChevronLeft size={16} />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>

          <div className="wiz-dots">
            {steps.map((_, i) => (
              <div key={i} className={`wiz-dot ${i === currentStep ? 'active' : ''}`}
                style={i === currentStep ? { background: acc.color } : {}}
              />
            ))}
          </div>

          <button
            className="wiz-next-btn"
            onClick={handleNext}
            style={{ background: `linear-gradient(135deg, ${acc.dark}, ${acc.color})` }}
          >
            {isLastStep ? (
              <><Check size={16} /> Submit Request</>
            ) : (
              <>Next <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>

      {/* Warning dialog */}
      {showWarning && (
        <div className="wiz-warning-overlay">
          <div className="wiz-warning-card">
            <div className="wiz-warning-icon">⚠️</div>
            <div className="wiz-warning-title">Some fields are empty</div>
            <div className="wiz-warning-body">
              The following fields were left blank. You can go back to fill them or continue anyway.
            </div>
            {warningFields.length > 0 && (
              <div className="wiz-warning-fields">
                <ul>{warningFields.map((f, i) => <li key={i}>{f}</li>)}</ul>
              </div>
            )}
            <div className="wiz-warning-actions">
              <button className="wiz-warn-back" onClick={() => setShowWarning(false)}>Go Back &amp; Fill</button>
              <button className="wiz-warn-continue" onClick={() => {
                setShowWarning(false);
                if (isLastStep) onSubmit(); else onNext();
              }}>Continue Anyway</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
