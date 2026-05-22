import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePatient, exportCsv, exportPatientPdf, getMyPatients } from '../api/patients';
import ExpandedRow from './ExpandedRow';

export default function PatientTable() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState<number | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  const { data: patients, isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn: getMyPatients,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  });

  async function handleExportCsv() {
    setExportingCsv(true);
    try {
      await exportCsv();
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleExportPdf(patientId: number) {
    setExportingPdf(patientId);
    try {
      await exportPatientPdf(patientId);
    } finally {
      setExportingPdf(null);
    }
  }

  function handleDelete(patientId: number, name: string) {
    if (!window.confirm(`Delete patient "${name || `#${patientId}`}"? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(patientId);
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (isLoading) return <p className="status-msg">Loading patients…</p>;
  if (error) return <p className="status-msg error">Failed to load patients.</p>;

  const list = patients ?? [];

  return (
    <div>
      <div className="table-toolbar">
        <span className="patient-count">{list.length} patient{list.length !== 1 ? 's' : ''}</span>
        <button
          className="btn btn-secondary"
          onClick={handleExportCsv}
          disabled={exportingCsv || list.length === 0}
        >
          {exportingCsv ? 'Exporting…' : 'Export all CSV'}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="status-msg">No patients found. Create one using the Add Patient tab.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th>Name</th>
              <th>Notes</th>
              <th>Medical History</th>
              <th>Family History</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((patient) => (
              <>
                <tr
                  key={patient.id}
                  className={`patient-row${expandedId === patient.id ? ' expanded' : ''}`}
                  onClick={() => toggleExpand(patient.id)}
                >
                  <td className="expand-cell">
                    <span className="expand-icon">{expandedId === patient.id ? '▾' : '▸'}</span>
                  </td>
                  <td>{patient.name || <span className="muted">—</span>}</td>
                  <td className="notes-cell">
                    {patient.notes ? (
                      <span title={patient.notes}>
                        {patient.notes.length > 60
                          ? `${patient.notes.slice(0, 60)}…`
                          : patient.notes}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>{(patient.medicalHistory ?? []).length} record(s)</td>
                  <td>{(patient.familyHistory ?? []).length} record(s)</td>
                  <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
                  <td
                    className="actions-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-sm"
                      disabled={exportingPdf === patient.id}
                      onClick={() => handleExportPdf(patient.id)}
                    >
                      {exportingPdf === patient.id ? '…' : 'PDF'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(patient.id, patient.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
                {expandedId === patient.id && (
                  <tr key={`${patient.id}-expanded`} className="expanded-tr">
                    <td colSpan={7} style={{ padding: 0 }}>
                      <ExpandedRow patient={patient} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
