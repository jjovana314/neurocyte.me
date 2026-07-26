import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPatient } from '../api/patients';
import { getErrorMessage } from '../api/errors';
import EdssAssessmentForm from './EdssAssessmentForm';
import Disclosure from './Disclosure';
import MigraineLogFields from './MigraineLogFields';
import SeizureLogFields from './SeizureLogFields';
import {
  EMPTY_EDSS_FORM_STATE,
  edssFormStateToInput,
  type EdssFormState,
} from '../utils/edssForm';
import {
  EMPTY_MIGRAINE_LOG_FORM_STATE,
  migraineLogFormStateToInput,
  type MigraineLogFormState,
} from '../utils/migraineLogForm';
import {
  EMPTY_SEIZURE_LOG_FORM_STATE,
  seizureLogFormStateToInput,
  type SeizureLogFormState,
} from '../utils/seizureLogForm';
import { todayDateString } from '../utils/dateLimits';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function AddPatientForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [edssForm, setEdssForm] = useState<EdssFormState>(EMPTY_EDSS_FORM_STATE);
  const [migraineLogForm, setMigraineLogForm] = useState<MigraineLogFormState>(
    EMPTY_MIGRAINE_LOG_FORM_STATE,
  );
  const [seizureLogForm, setSeizureLogForm] = useState<SeizureLogFormState>(
    EMPTY_SEIZURE_LOG_FORM_STATE,
  );
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createPatient({
        name,
        dateOfBirth: dateOfBirth,
        gender: gender,
        phone: phone || undefined,
        email: email || undefined,
        notes,
        edss: edssFormStateToInput(edssForm),
        migraineLog: migraineLogFormStateToInput(migraineLogForm),
        seizureLog: seizureLogFormStateToInput(seizureLogForm),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setName('');
      setDateOfBirth('');
      setGender('');
      setPhone('');
      setEmail('');
      setNotes('');
      setEdssForm(EMPTY_EDSS_FORM_STATE);
      setMigraineLogForm(EMPTY_MIGRAINE_LOG_FORM_STATE);
      setSeizureLogForm(EMPTY_SEIZURE_LOG_FORM_STATE);
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
      <h3>Add New Patient</h3>
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
            max={todayDateString()}
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
        <EdssAssessmentForm value={edssForm} onChange={setEdssForm} idPrefix="add-patient" />
        <Disclosure
          label="Record a migraine log"
          open={migraineLogForm.enabled}
          onToggle={(open) => setMigraineLogForm({ ...migraineLogForm, enabled: open })}
        >
          <MigraineLogFields
            value={migraineLogForm}
            onChange={(fields) => setMigraineLogForm({ ...migraineLogForm, ...fields })}
            idPrefix="add-patient-migraine"
          />
        </Disclosure>
        <Disclosure
          label="Record a seizure log"
          open={seizureLogForm.enabled}
          onToggle={(open) => setSeizureLogForm({ ...seizureLogForm, enabled: open })}
        >
          <SeizureLogFields
            value={seizureLogForm}
            onChange={(fields) => setSeizureLogForm({ ...seizureLogForm, ...fields })}
            idPrefix="add-patient-seizure"
          />
        </Disclosure>
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
