import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatient } from '../api/patients';

export default function AddPatientForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createPatient({ name, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setName('');
      setNotes('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    mutation.mutate();
  }

  return (
    <div className="form-container">
      <h3>Create New Patient</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patient-name">Patient name</label>
          <input
            id="patient-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="patient-notes">Notes</label>
          <textarea
            id="patient-notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Initial notes about this patient"
          />
        </div>
        {mutation.error && (
          <p className="form-error">
            {(mutation.error as Error).message}
          </p>
        )}
        {success && <p className="form-success">Patient created successfully.</p>}
        <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create Patient'}
        </button>
      </form>
    </div>
  );
}
