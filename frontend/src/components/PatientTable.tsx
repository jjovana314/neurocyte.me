import { useEffect, useState } from 'react';
import axios from 'axios';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deletePatient, exportCsv, exportPatientPdf, searchPatients } from '../api/patients';
import ExpandedRow from './ExpandedRow';
import React from 'react';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type SortableColumn = 'id' | 'name' | 'createdAt';

const SORT_COLUMNS: { key: SortableColumn; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'createdAt', label: 'Created' },
];

async function parseExportError(err: unknown): Promise<string> {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data instanceof Blob) {
      try {
        const json = JSON.parse(await data.text());
        return typeof json.message === 'string' ? json.message : 'Export failed';
      } catch {
        return 'Export failed';
      }
    }
    if (typeof data?.message === 'string') return data.message;
  }
  return 'Export failed';
}

interface Props {
  role?: string;
}

export default function PatientTable({ role }: Props) {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState<number | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [csvExportError, setCsvExportError] = useState<string | null>(null);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortableColumn>('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');

  const [patientToDelete, setPatientToDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['patients', debouncedSearch, page, sortBy, order],
    queryFn: () =>
      searchPatients({
        query: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        order,
      }),
    placeholderData: keepPreviousData,
  });

  function handleSort(column: SortableColumn) {
    if (sortBy === column) {
      setOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setOrder('ASC');
    }
    setPage(1);
  }

  const deleteMutation = useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setPatientToDelete(null); // Zatvori modal nakon uspešnog brisanja
    },
  });

  async function handleExportCsv() {
    setCsvExportError(null);
    setExportingCsv(true);
    try {
      await exportCsv();
    } catch (err) {
      setCsvExportError(await parseExportError(err));
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleExportPdf(patientId: number) {
    setPdfExportError(null);
    setExportingPdf(patientId);
    try {
      await exportPatientPdf(patientId);
    } catch (err) {
      setPdfExportError(await parseExportError(err));
    } finally {
      setExportingPdf(null);
    }
  }

  function confirmDelete() {
    if (patientToDelete) {
      deleteMutation.mutate(patientToDelete.id);
    }
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (isLoading) return <p className="status-msg">Loading patients…</p>;
  if (error) return <p className="status-msg error">Failed to load patients.</p>;

  const list = data?.patients ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="table-toolbar">
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email or phone."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="patient-count">
            {total} patient{total !== 1 ? 's' : ''}
            {isFetching && !isLoading ? '…' : ''}
          </span>
        </div>
        <div className="export-csv-wrap">
          <button
            className="btn btn-secondary"
            onClick={handleExportCsv}
            disabled={exportingCsv || total === 0}
          >
            {exportingCsv ? 'Exporting…' : 'Export all CSV'}
          </button>
          {csvExportError && <p className="status-msg error">{csvExportError}</p>}
        </div>
      </div>

      {list.length === 0 ? (
        <p className="status-msg">No patients found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              {SORT_COLUMNS.map(({ key, label }) => (
                <th key={key} style={key === 'id' ? { width: 64 } : undefined}>
                  <button
                    type="button"
                    className="sortable-th"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <span className="sort-icon">
                      {sortBy === key ? (order === 'ASC' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              ))}
              <th>Notes</th>
              <th>Medical History</th>
              <th>Family History</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((patient) => (
              <React.Fragment key={patient.id}>
                <tr
                  className={`patient-row${expandedId === patient.id ? ' expanded' : ''}`}
                  onClick={() => toggleExpand(patient.id)}
                >
                  <td className="expand-cell">
                    <span className="expand-icon">{expandedId === patient.id ? '▾' : '▸'}</span>
                  </td>
                  <td className="muted">#{patient.id}</td>
                  <td>{patient.name || <span className="muted">—</span>}</td>
                  <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
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
                    {role !== 'Support Engineer' && (
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={deleteMutation.isPending}
                        onClick={() => setPatientToDelete({ id: patient.id, name: patient.name })}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === patient.id && (
                  <tr className="expanded-tr">
                    <td colSpan={8} style={{ padding: 0 }}>
                      <ExpandedRow patient={patient} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span className="pagination-status">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-sm btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
      {pdfExportError && <p className="status-msg error">{pdfExportError}</p>}

{patientToDelete && (
        <div
          className="modal-backdrop"
          onClick={() => setPatientToDelete(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              maxWidth: '450px',
              width: '90%',
              position: 'relative',
              border: 'none'
            }}
          >
            <h3 style={{ marginTop: 0, color: '#333' }}>Delete Patient</h3>
            <p style={{ margin: '15px 0', color: '#555' }}>
              Are you sure you want to delete{' '}
              <strong>{patientToDelete.name || `#${patientToDelete.id}`}</strong>?
            </p>
            <p className="modal-warning" style={{ color: '#d9534f', fontSize: '0.9em', fontWeight: 'bold' }}>
              This action cannot be undone.
            </p>
            <div
              className="modal-actions"
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '25px',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setPatientToDelete(null)}
                disabled={deleteMutation.isPending}
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#d9534f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}