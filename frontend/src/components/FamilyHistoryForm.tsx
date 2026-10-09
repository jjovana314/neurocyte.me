import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFamilyHistory } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import FamilyHistoryFields from './FamilyHistoryFields';
import {
  EMPTY_FAMILY_HISTORY_FORM_STATE,
  familyHistoryFormStateToInput,
} from '../utils/familyHistoryForm';

interface Props {
  patientId: number;
  idPrefix: string;
  onDone?: () => void;
}

export default function FamilyHistoryForm({ patientId, idPrefix, onDone }: Props) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(EMPTY_FAMILY_HISTORY_FORM_STATE);

  const mutation = useMutation({
    mutationFn: () =>
      addFamilyHistory(
        patientId,
        familyHistoryFormStateToInput({ ...fields, enabled: true })!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setFields(EMPTY_FAMILY_HISTORY_FORM_STATE);
      onDone?.();
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="medical-history-form">
      <FamilyHistoryFields
        value={fields}
        onChange={(f) => setFields((prev) => ({ ...prev, ...f }))}
        idPrefix={idPrefix}
      />
      {mutation.error && <p className="form-error">{getErrorMessage(mutation.error)}</p>}
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Add family history'}
        </button>
      </div>
    </form>
  );
}
