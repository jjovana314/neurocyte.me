import type { Patient } from '../api/types';

interface Props {
  patient: Patient;
}

export default function ExpandedRow({ patient }: Props) {
  const medical = patient.medicalHistory ?? [];
  const family = patient.familyHistory ?? [];

  const hasDemographics = patient.dateOfBirth || patient.gender || patient.phone || patient.email;

  return (
    <div className="expanded-row">
      {hasDemographics && (
        <div className="expanded-section">
          <h4>Demographics</h4>
          <dl className="demographics-list">
            {patient.dateOfBirth && (
              <>
                <dt>Date of birth</dt>
                <dd>{new Date(patient.dateOfBirth).toLocaleDateString()}</dd>
              </>
            )}
            {patient.gender && (
              <>
                <dt>Gender</dt>
                <dd>{patient.gender}</dd>
              </>
            )}
            {patient.phone && (
              <>
                <dt>Phone</dt>
                <dd>{patient.phone}</dd>
              </>
            )}
            {patient.email && (
              <>
                <dt>Email</dt>
                <dd>{patient.email}</dd>
              </>
            )}
          </dl>
        </div>
      )}
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
