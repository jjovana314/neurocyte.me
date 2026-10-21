import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addSeizureLog } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import SeizureLogFields from './SeizureLogFields';
import { EMPTY_SEIZURE_LOG_FORM_STATE, seizureLogFormStateToInput } from '../utils/seizureLogForm';

interface Props {
  patientId: number;
  idPrefix: string;
  onDone?: () => void;
  onCancel?: () => void;
}

export default function SeizureLogForm({ patientId, idPrefix, onDone, onCancel }: Props) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(EMPTY_SEIZURE_LOG_FORM_STATE);

  const mutation = useMutation({
    mutationFn: () =>
      addSeizureLog(
        patientId,
        seizureLogFormStateToInput({ ...fields, enabled: true })!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setFields(EMPTY_SEIZURE_LOG_FORM_STATE);
      onDone?.();
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  function handleCancel() {
    setFields(EMPTY_SEIZURE_LOG_FORM_STATE);
    mutation.reset();
    onCancel?.();
  }

  return (
    <form onSubmit={handleSubmit} className="seizure-log-form">
      <SeizureLogFields
        value={fields}
        onChange={(f) => setFields((prev) => ({ ...prev, ...f }))}
        idPrefix={idPrefix}
      />
      {mutation.error && <p className="form-error">{getErrorMessage(mutation.error)}</p>}
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Add seizure log'}
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
