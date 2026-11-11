import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TouretteSyndrome } from '../api/types';
import { addTouretteSyndrome, updateTouretteSyndrome } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import TouretteSyndromeFields from './TouretteSyndromeFields';
import {
  EMPTY_TOURETTE_SYNDROME_FORM_STATE,
  touretteSyndromeFormStateToInput,
  touretteSyndromeFormStateToUpdate,
  touretteSyndromeToFormState,
} from '../utils/touretteSyndromeForm';

interface Props {
  patientId: number;
  idPrefix: string;
  /** When given, the form edits this record instead of creating a new one. */
  record?: TouretteSyndrome;
  onDone?: () => void;
  onCancel?: () => void;
}

export default function TouretteSyndromeForm({
  patientId,
  idPrefix,
  record,
  onDone,
  onCancel,
}: Props) {
  const queryClient = useQueryClient();
  const initialState = record
    ? touretteSyndromeToFormState(record)
    : EMPTY_TOURETTE_SYNDROME_FORM_STATE;
  const [fields, setFields] = useState(initialState);

  const mutation = useMutation({
    mutationFn: () =>
      record
        ? updateTouretteSyndrome(patientId, record.id, touretteSyndromeFormStateToUpdate(fields))
        : addTouretteSyndrome(
            patientId,
            touretteSyndromeFormStateToInput({ ...fields, enabled: true })!,
          ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setFields(initialState);
      onDone?.();
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  function handleCancel() {
    setFields(initialState);
    mutation.reset();
    onCancel?.();
  }

  const submitLabel = record ? 'Save changes' : 'Add Tourette record';

  return (
    <form onSubmit={handleSubmit} className="tourette-syndrome-form">
      <TouretteSyndromeFields
        value={fields}
        onChange={(f) => setFields((prev) => ({ ...prev, ...f }))}
        idPrefix={idPrefix}
      />
      {mutation.error && <p className="form-error">{getErrorMessage(mutation.error)}</p>}
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : submitLabel}
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
