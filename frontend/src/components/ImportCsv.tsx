import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importCsv } from '../api/patients';
import type { ImportCsvResponse } from '../api/types';

export default function ImportCsv() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportCsvResponse | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => importCsv(file),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    mutation.mutate(file);
  }

  return (
    <div className="form-container">
      <h3>Import Patients from CSV</h3>
      <p className="hint">
        The CSV must match the export format: Patient Notes, Patient Created At, Patient Updated
        At, Disorder, Description, Diagnosis Date, Severity, Medications, History Recorded At,
        Family Disease Type, Family Relation, Family Severity, Family Notes, Family Recorded At.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="csv-file">CSV file</label>
          <input id="csv-file" ref={fileRef} type="file" accept=".csv,text/csv" />
        </div>
        {mutation.error && (
          <p className="form-error">{(mutation.error as Error).message}</p>
        )}
        <button
          className="btn btn-primary"
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Importing…' : 'Import'}
        </button>
      </form>

      {result && (
        <div className="import-result">
          <p>
            <strong>{result.imported}</strong> patient(s) imported,{' '}
            <strong>{result.skipped}</strong> row(s) skipped.
          </p>
          {result.errors.length > 0 && (
            <>
              <p className="form-error">{result.errors.length} error(s):</p>
              <ul className="error-list">
                {result.errors.map((err, i) => (
                  <li key={i}>
                    Row {err.row}: {err.reason}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
