import type { Patient } from '../api/types';

interface Props {
  patient: Patient;
}

export default function ExpandedRow({ patient }: Props) {
  const medical = patient.medicalHistory ?? [];
  const family = patient.familyHistory ?? [];

  return (
    <div className="expanded-row">
      <div className="expanded-section">
        <h4>Medical History</h4>
        {medical.length === 0 ? (
          <p className="empty-note">No medical history recorded.</p>
        ) : (
          <table className="inner-table">
            <thead>
              <tr>
                <th>Disorder</th>
                <th>Description</th>
                <th>Diagnosis Date</th>
                <th>Severity</th>
                <th>Medications</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {medical.map((h) => (
                <tr key={h.id}>
                  <td>{h.disorder}</td>
                  <td>{h.description || '—'}</td>
                  <td>{h.diagnosisDate || '—'}</td>
                  <td>
                    <span className={`severity-badge severity-${h.severity}`}>{h.severity}</span>
                  </td>
                  <td>{h.medications || '—'}</td>
                  <td>{new Date(h.recordedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="expanded-section">
        <h4>Family History</h4>
        {family.length === 0 ? (
          <p className="empty-note">No family history recorded.</p>
        ) : (
          <table className="inner-table">
            <thead>
              <tr>
                <th>Disease</th>
                <th>Relation</th>
                <th>Severity</th>
                <th>Notes</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {family.map((f) => (
                <tr key={f.id}>
                  <td>{f.diseaseType}</td>
                  <td>{f.relation}</td>
                  <td>
                    <span className={`severity-badge severity-${f.severity}`}>{f.severity}</span>
                  </td>
                  <td>{f.notes || '—'}</td>
                  <td>{new Date(f.recordedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
