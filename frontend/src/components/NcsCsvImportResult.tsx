import type { ImportCsvResponse } from '../api/types';

interface Props {
  result: ImportCsvResponse;
}

export default function NcsCsvImportResult({ result }: Props) {
  return (
    <div className="import-result">
      <p>
        <strong>{result.imported}</strong> NCS {result.imported === 1 ? 'study' : 'studies'} imported,{' '}
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
  );
}
