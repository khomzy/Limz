import type { FormEvent } from 'react';
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  FlaskConical,
  HeartPulse,
  History,
  LockKeyhole,
  Menu,
  Network,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react';
import careTeamImage from '../assets/medicy-care-team.webp';
import './PublicSite.css';

interface PublicSiteProps {
  showLogin: boolean;
  facilityId: string;
  username: string;
  password: string;
  rememberMe: boolean;
  loading: boolean;
  loginError: string;
  onShowLogin: () => void;
  onHideLogin: () => void;
  onFacilityIdChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onLogin: (event: FormEvent) => void;
}

const benefits = [
  {
    icon: History,
    title: 'One continuous patient history',
    text: 'Find previous requests and results in seconds, without searching shelves or moving paper files between departments.',
  },
  {
    icon: FlaskConical,
    title: 'A clear sample-to-result trail',
    text: 'Follow every request from collection and laboratory receipt through testing, validation and clinical review.',
  },
  {
    icon: ShieldCheck,
    title: 'Fewer avoidable errors',
    text: 'Structured TB, HIV, haematology and chemistry workflows reduce missing fields, duplicate entries and illegible handwriting.',
  },
  {
    icon: Network,
    title: 'Clinical and laboratory teams connected',
    text: 'Clinicians can see when results are ready while laboratory teams work from one organised diagnostic queue.',
  },
  {
    icon: ClipboardCheck,
    title: 'Faster programme reporting',
    text: 'Consistent digital records make quality checks, service monitoring and programme reporting easier to prepare.',
  },
  {
    icon: LockKeyhole,
    title: 'Access designed around roles',
    text: 'TB, HIV, clinical and laboratory workspaces keep each team focused on the information and actions they need.',
  },
];

export default function PublicSite({
  showLogin,
  facilityId,
  username,
  password,
  rememberMe,
  loading,
  loginError,
  onShowLogin,
  onHideLogin,
  onFacilityIdChange,
  onUsernameChange,
  onPasswordChange,
  onRememberMeChange,
  onLogin,
}: PublicSiteProps) {
  return (
    <main className="public-site">
      <header className="public-nav">
        <a className="medicy-brand" href="#top" aria-label="Medicy home">
          <span className="medicy-mark"><Activity size={23} /></span>
          <span>
            <strong>medicy</strong>
            <small>by Afrisoft</small>
          </span>
        </a>
        <nav className="public-nav-links" aria-label="Main navigation">
          <a href="#how-it-helps">How it helps</a>
          <a href="#why-medicy">Why Medicy</a>
          <a href="#hospitals">For hospitals</a>
        </nav>
        <button className="public-login-button" onClick={onShowLogin}>
          Log in <ArrowRight size={16} />
        </button>
        <Menu className="public-menu-icon" aria-hidden="true" />
      </header>

      <section className="public-hero" id="top">
        <div className="public-hero-copy">
          <div className="public-eyebrow"><span /> Built for healthcare teams in Malawi</div>
          <h1>Patient and laboratory information that moves with care.</h1>
          <p>
            Medicy connects clinicians, programme teams and laboratories in one secure workflow—so staff can spend less time following paper and more time supporting patients.
          </p>
          <div className="public-hero-actions">
            <button className="public-primary-cta" onClick={onShowLogin}>
              Enter Medicy <ArrowRight size={18} />
            </button>
            <a className="public-secondary-cta" href="#hospitals">Bring Medicy to your hospital</a>
          </div>
          <div className="public-trust-row">
            <span><Check size={15} /> TB and HIV programme workflows</span>
            <span><Check size={15} /> Clinical–laboratory coordination</span>
            <span><Check size={15} /> Role-based access</span>
          </div>
        </div>
        <div className="public-hero-visual">
          <img src={careTeamImage} alt="Malawian medical personnel collaborating with a digital clinical system" />
          <div className="hero-status-card hero-status-top">
            <span className="status-icon"><FlaskConical size={18} /></span>
            <span><small>Laboratory workflow</small><strong>Sample received</strong></span>
            <Check size={17} />
          </div>
          <div className="hero-status-card hero-status-bottom">
            <span className="status-icon pink"><HeartPulse size={18} /></span>
            <span><small>Clinical team</small><strong>Result ready for review</strong></span>
          </div>
        </div>
      </section>

      <section className="public-proof-strip" aria-label="Medicy workflow areas">
        <span>TB</span><span>HIV VL &amp; EID</span><span>Haematology</span><span>Chemistry</span><span>Laboratory operations</span>
      </section>

      <section className="public-section public-help" id="how-it-helps">
        <div className="public-section-heading">
          <span>How Medicy helps</span>
          <h2>A shared view from the consultation room to the laboratory bench.</h2>
          <p>Purpose-built workflows keep the right clinical context, specimen details, testing steps and validated results together.</p>
        </div>
        <div className="workflow-steps">
          <article><span>01</span><Stethoscope size={25} /><h3>Request</h3><p>Clinicians capture complete, programme-specific patient and test information.</p></article>
          <div className="workflow-connector" />
          <article><span>02</span><FlaskConical size={25} /><h3>Process</h3><p>Laboratory teams receive, test and track specimens in an organised queue.</p></article>
          <div className="workflow-connector" />
          <article><span>03</span><ClipboardCheck size={25} /><h3>Review</h3><p>Validated results return to the requesting care team with a clear audit trail.</p></article>
        </div>
      </section>

      <section className="public-section public-benefits" id="why-medicy">
        <div className="public-section-heading compact">
          <span>Digital instead of paper-bound</span>
          <h2>Patient history should be usable, not buried in a file room.</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <span className="benefit-icon"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hospital-callout" id="hospitals">
        <div>
          <span className="hospital-callout-icon"><Building2 size={27} /></span>
          <p className="callout-label">An invitation to hospitals</p>
          <h2>Give your teams a clearer way to coordinate diagnosis and care.</h2>
          <p>
            Hospitals and diagnostic facilities across Malawi are invited to adopt Medicy and move beyond fragmented paper tracking. Afrisoft can support facility onboarding, workflow configuration and staff orientation.
          </p>
        </div>
        <a
          className="public-primary-cta light"
          href="mailto:ngowelak@gmail.com?subject=Medicy%20for%20our%20hospital&body=Hello%20Afrisoft%2C%0A%0AWe%20would%20like%20to%20learn%20more%20about%20Medicy%20for%20our%20hospital.%0A%0AFacility%20name%3A%0AContact%20name%3A%0APhone%20number%3A%0A%0AThank%20you."
        >
          Talk to Afrisoft <ArrowRight size={18} />
        </a>
      </section>

      <footer className="public-footer">
        <a className="medicy-brand footer-brand" href="#top">
          <span className="medicy-mark"><Activity size={23} /></span>
          <span><strong>medicy</strong><small>by Afrisoft</small></span>
        </a>
        <p>Medicy is developed by Afrisoft, a technology startup in Malawi.</p>
        <span>© {new Date().getFullYear()} Afrisoft. All rights reserved.</span>
      </footer>

      {showLogin && (
        <div className="medicy-login-overlay" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) onHideLogin();
        }}>
          <section className="medicy-login-panel" role="dialog" aria-modal="true" aria-labelledby="login-title">
            <button className="medicy-login-close" onClick={onHideLogin} aria-label="Close login"><X size={19} /></button>
            <div className="login-panel-brand"><span className="medicy-mark"><Activity size={22} /></span></div>
            <p className="login-panel-kicker">Secure facility access</p>
            <h2 id="login-title">Log in to Medicy</h2>
            <p className="login-panel-intro">Use the credentials issued by your facility administrator.</p>

            {loginError && <div className="medicy-login-error" role="alert">{loginError}</div>}

            <form onSubmit={onLogin} className="medicy-login-form">
              <label htmlFor="facility-id">Facility ID</label>
              <input
                id="facility-id"
                name="facilityId"
                value={facilityId}
                onChange={event => onFacilityIdChange(event.target.value.toUpperCase())}
                placeholder="e.g. ZCH001"
                autoComplete="organization"
                autoFocus
                required
              />

              <label htmlFor="login-username">User name</label>
              <input
                id="login-username"
                name="username"
                value={username}
                onChange={event => onUsernameChange(event.target.value)}
                placeholder="Your username or work email"
                autoComplete="username"
                required
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={event => onPasswordChange(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              <label className="remember-login">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={event => onRememberMeChange(event.target.checked)}
                />
                <span><strong>Keep me logged in</strong><small>Use only on a private, trusted device.</small></span>
              </label>

              <button type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Log in securely'} {!loading && <ArrowRight size={17} />}
              </button>
            </form>
            <p className="login-support">Need access? Contact your facility Medicy administrator.</p>
          </section>
        </div>
      )}
    </main>
  );
}
