import type { LimsRequest } from '../types';
import { Cable, CheckCircle2, Database, ServerCog, ShieldCheck } from 'lucide-react';

interface LabEquipmentDashboardProps {
  requests: LimsRequest[];
}

export default function LabEquipmentDashboard({ requests }: LabEquipmentDashboardProps) {
  const activeSamples = requests.filter(request =>
    request.status === 'Sample Received' || request.status === 'Testing'
  );

  return (
    <section className="equipment-dashboard fade-in" aria-labelledby="equipment-heading">
      <div className="equipment-dashboard-header">
        <div>
          <h2 id="equipment-heading">Equipment connectivity</h2>
          <p>Medicy secure laboratory connector status</p>
        </div>
        <span className="equipment-secure-badge"><ShieldCheck size={15} /> Server-side only</span>
      </div>

      <div className="equipment-summary-grid">
        <article>
          <span className="equipment-summary-icon"><Database size={20} /></span>
          <div><strong>{activeSamples.length}</strong><small>samples ready for an analyzer</small></div>
        </article>
        <article>
          <span className="equipment-summary-icon"><Cable size={20} /></span>
          <div><strong>ASTM / HL7</strong><small>supported through a facility connector</small></div>
        </article>
        <article>
          <span className="equipment-summary-icon"><CheckCircle2 size={20} /></span>
          <div><strong>Protected</strong><small>no analyzer address is exposed in the browser</small></div>
        </article>
      </div>

      <div className="equipment-setup-card">
        <span><ServerCog size={28} /></span>
        <div>
          <h3>Facility connector configuration required</h3>
          <p>
            Analyzer connections must run through a Medicy Connector installed inside the hospital network. Connection addresses, ports and vendor credentials are configured on that protected service—not in this public web application.
          </p>
          <p className="equipment-setup-note">Contact your Afrisoft implementation administrator to commission or review an equipment interface.</p>
        </div>
      </div>
    </section>
  );
}
