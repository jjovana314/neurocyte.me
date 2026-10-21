import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMigraineLog } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import MigraineLogFields from './MigraineLogFields';
import { EMPTY_MIGRAINE_LOG_FORM_STATE, migraineLogFormStateToInput } from '../utils/migraineLogForm';

interface Props {
  patientId: number;
  idPrefix: string;
  onDone?: () => void;
  onCancel?: () => void;
}

export default function MigraineLogForm({ patientId, idPrefix, onDone, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(EMPTY_MIGRAINE_LOG_FORM_STATE);

  const mutation = useMutation({
    mutationFn: () =>
      addMigraineLog(
        patientId,
        migraineLogFormStateToInput({ ...fields, enabled: true })!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setFields(EMPTY_MIGRAINE_LOG_FORM_STATE);
      onDone?.();
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  function handleCancel() {
    setFields(EMPTY_MIGRAINE_LOG_FORM_STATE);
    mutation.reset();
    onCancel?.();
  }

  return (
    <form onSubmit={handleSubmit} className="migraine-log-form">
      <MigraineLogFields
        value={fields}
        onChange={(f) => setFields((prev) => ({ ...prev, ...f }))}
        idPrefix={idPrefix}
      />
      {mutation.error && <p className="form-error">{getErrorMessage(mutation.error)}</p>}
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Add migraine log'}
        </button>
        <button
          className="btn btn-sm"
          type="button"
          onClick={handleCancel}
          disabled={mutation.isPending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
