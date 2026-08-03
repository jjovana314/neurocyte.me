import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addNcsStudy } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import NcsStudyFields from './NcsStudyFields';
import { EMPTY_NCS_STUDY_FORM_STATE, ncsStudyFormStateToInput } from '../utils/ncsStudyForm';

interface Props {
  patientId: number;
  idPrefix: string;
  onDone?: () => void;
}

export default function NcsStudyForm({ patientId, idPrefix, onDone }: Props) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(EMPTY_NCS_STUDY_FORM_STATE);

  const mutation = useMutation({
    mutationFn: () => addNcsStudy(patientId, ncsStudyFormStateToInput(fields)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setFields(EMPTY_NCS_STUDY_FORM_STATE);
      onDone?.();
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="ncs-study-form">
      <NcsStudyFields value={fields} onChange={setFields} idPrefix={idPrefix} />
      {mutation.error && <p className="form-error">{getErrorMessage(mutation.error)}</p>}
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Calculating…' : 'Add NCS study'}
        </button>
      </div>
    </form>
  );
}
