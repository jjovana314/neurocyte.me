import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatient } from '../api/patients';
import { getErrorMessage } from '../api/errors';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function AddPatientForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createPatient({
        name,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        email: email || undefined,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setName('');
      setDateOfBirth('');
      setGender('');
      setPhone('');
      setEmail('');
      setNotes('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setSuccess(false);
    mutation.mutate();
  }

  return (
    <div className="form-container">
      <h3>Create New Patient</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patient-name">Patient name*</label>
          <input
            id="patient-name"
            type="text"
            value={name}
            required={true}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="patient-dob">Date of birth*</label>
          <input
            id="patient-dob"
            type="date"
            value={dateOfBirth}
            required={true}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="patient-gender">Gender*</label>
          <select
            id="patient-gender"
            value={gender}
            required={true}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">— Select —</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="patient-phone">Phone</label>
          <input
            id="patient-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 000 0000"
          />
        </div>
        <div className="form-group">
          <label htmlFor="patient-email">Email</label>
          <input
            id="patient-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="patient@example.com"
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
          <p className="form-error">{getErrorMessage(mutation.error)}</p>
        )}
        {success && <p className="form-success">Patient created successfully.</p>}
        <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create Patient'}
        </button>
      </form>
    </div>
  );
}
