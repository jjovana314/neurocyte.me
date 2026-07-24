import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Patient } from '../api/types';
import { updatePatient } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import { EDSS_FSS_FIELDS } from '../constants/edss';
import EdssAssessmentForm from './EdssAssessmentForm';
import {
  EMPTY_EDSS_FORM_STATE,
  edssFormStateToInput,
  type EdssFormState,
} from '../utils/edssForm';

interface Props {
  patient: Patient;
}

function ambulationSummary(assessment: Patient['edssAssessments'][number]): string {
  if (assessment.wheelchairBound) return 'Wheelchair-bound';
  if (assessment.requiresBilateralAid) return 'Bilateral aid';
  if (assessment.requiresUnilateralAid) return 'Unilateral aid';
  if (assessment.unassistedWalkingDistanceMeters != null) {
    return `${assessment.unassistedWalkingDistanceMeters}m unaided`;
  }
  return '—';
}

export default function ExpandedRow({ patient }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(patient.notes ?? '');
  const [edssForm, setEdssForm] = useState<EdssFormState>(EMPTY_EDSS_FORM_STATE);

  const mutation = useMutation({
    mutationFn: () =>
      updatePatient(patient.id, {
        notes,
        edss: edssFormStateToInput(edssForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setEdssForm(EMPTY_EDSS_FORM_STATE);
      setEditing(false);
    },
  });

  function startEditing() {
    setNotes(patient.notes ?? '');
    setEdssForm(EMPTY_EDSS_FORM_STATE);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  const medical = patient.medicalHistory ?? [];
  const family = patient.familyHistory ?? [];
  const edssAssessments = [...(patient.edssAssessments ?? [])].sort(
    (a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime(),
  );

  const hasDemographics = patient.dateOfBirth || patient.gender || patient.phone || patient.email;

  return (
    <div className="expanded-row" onClick={(e) => e.stopPropagation()}>
      <div className="expanded-toolbar">
        {!editing && (
          <button className="btn btn-sm" onClick={startEditing}>
            Edit notes / Add EDSS assessment
          </button>
        )}
      </div>

      {editing && (
        <div className="expanded-section">
          <h4>Edit Patient</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor={`edit-notes-${patient.id}`}>Notes</label>
              <textarea
                id={`edit-notes-${patient.id}`}
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <EdssAssessmentForm
              value={edssForm}
              onChange={setEdssForm}
              idPrefix={`edit-${patient.id}`}
            />
            {mutation.error && (
              <p className="form-error">{getErrorMessage(mutation.error)}</p>
            )}
            <div className="edit-actions">
              <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                className="btn"
                type="button"
                onClick={cancelEditing}
                disabled={mutation.isPending}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
        <h4>EDSS Assessments</h4>
        {edssAssessments.length === 0 ? (
          <p className="empty-note">No EDSS assessments recorded.</p>
        ) : (
          <div className="table-scroll">
            <table className="inner-table">
              <thead>
                <tr>
                  <th>Date</th>
                  {EDSS_FSS_FIELDS.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  <th>Ambulation</th>
                  <th>Total EDSS</th>
                </tr>
              </thead>
              <tbody>
                {edssAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{new Date(assessment.assessedAt).toLocaleDateString()}</td>
                    {EDSS_FSS_FIELDS.map((field) => (
                      <td key={field.key}>{assessment[field.key]}</td>
                    ))}
                    <td>{ambulationSummary(assessment)}</td>
                    <td>
                      <span className="edss-score-badge">{assessment.totalScore.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
