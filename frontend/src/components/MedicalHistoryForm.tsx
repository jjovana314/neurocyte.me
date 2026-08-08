import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMedicalHistory } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import MedicalHistoryFields from './MedicalHistoryFields';
import {
  EMPTY_MEDICAL_HISTORY_FORM_STATE,
  medicalHistoryFormStateToInput,
} from '../utils/medicalHistoryForm';

interface Props {
  patientId: number;
  idPrefix: string;
  onDone?: () => void;
}

export default function MedicalHistoryForm({ patientId, idPrefix, onDone }: Props) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(EMPTY_MEDICAL_HISTORY_FORM_STATE);

  const mutation = useMutation({
    mutationFn: () =>
      addMedicalHistory(
        patientId,
        medicalHistoryFormStateToInput({ ...fields, enabled: true })!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setFields(EMPTY_MEDICAL_HISTORY_FORM_STATE);
      onDone?.();
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="medical-history-form">
      <MedicalHistoryFields
        value={fields}
        onChange={(f) => setFields((prev) => ({ ...prev, ...f }))}
        idPrefix={idPrefix}
      />
      {mutation.error && <p className="form-error">{getErrorMessage(mutation.error)}</p>}
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Add medical history'}
        </button>
      </div>
    </form>
  );
}
