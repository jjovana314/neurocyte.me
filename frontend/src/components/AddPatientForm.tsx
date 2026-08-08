import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMedicalHistory, createPatient, importNcsStudiesCsv } from '../api/patients';
import type { ImportCsvResponse } from '../api/types';
import { getErrorMessage } from '../api/errors';
import EdssAssessmentForm from './EdssAssessmentForm';
import Disclosure from './Disclosure';
import MedicalHistoryFields from './MedicalHistoryFields';
import MigraineLogFields from './MigraineLogFields';
import SeizureLogFields from './SeizureLogFields';
import NcsCsvImportResult from './NcsCsvImportResult';
import {
  EMPTY_EDSS_FORM_STATE,
  edssFormStateToInput,
  type EdssFormState,
} from '../utils/edssForm';
import {
  EMPTY_MEDICAL_HISTORY_FORM_STATE,
  medicalHistoryFormStateToInput,
  type MedicalHistoryFormState,
} from '../utils/medicalHistoryForm';
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
import { NCS_CSV_IMPORT_HINT } from '../constants/ncs';

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
  const [medicalHistoryForm, setMedicalHistoryForm] = useState<MedicalHistoryFormState>(
    EMPTY_MEDICAL_HISTORY_FORM_STATE,
  );
  const [migraineLogForm, setMigraineLogForm] = useState<MigraineLogFormState>(
    EMPTY_MIGRAINE_LOG_FORM_STATE,
  );
  const [seizureLogForm, setSeizureLogForm] = useState<SeizureLogFormState>(
    EMPTY_SEIZURE_LOG_FORM_STATE,
  );
  const [success, setSuccess] = useState(false);
  const ncsFileRef = useRef<HTMLInputElement>(null);
  const [ncsImportResult, setNcsImportResult] = useState<ImportCsvResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const patient = await createPatient({
        name,
        dateOfBirth: dateOfBirth,
        gender: gender,
        phone: phone || undefined,
        email: email || undefined,
        notes,
        edss: edssFormStateToInput(edssForm),
        migraineLog: migraineLogFormStateToInput(migraineLogForm),
        seizureLog: seizureLogFormStateToInput(seizureLogForm),
      });
      const medicalHistoryInput = medicalHistoryFormStateToInput(medicalHistoryForm);
      if (medicalHistoryInput) {
        await addMedicalHistory(patient.id, medicalHistoryInput);
      }
      const ncsFile = ncsFileRef.current?.files?.[0];
      const ncsResult = ncsFile ? await importNcsStudiesCsv(patient.id, ncsFile) : null;
      return { patient, ncsResult };
    },
    onSuccess: ({ ncsResult }) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setName('');
      setDateOfBirth('');
      setGender('');
      setPhone('');
      setEmail('');
      setNotes('');
      setEdssForm(EMPTY_EDSS_FORM_STATE);
      setMedicalHistoryForm(EMPTY_MEDICAL_HISTORY_FORM_STATE);
      setMigraineLogForm(EMPTY_MIGRAINE_LOG_FORM_STATE);
      setSeizureLogForm(EMPTY_SEIZURE_LOG_FORM_STATE);
      if (ncsFileRef.current) ncsFileRef.current.value = '';
      setNcsImportResult(ncsResult);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setSuccess(false);
    setNcsImportResult(null);
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
          label="Record medical history"
          open={medicalHistoryForm.enabled}
          onToggle={(open) => setMedicalHistoryForm({ ...medicalHistoryForm, enabled: open })}
        >
          <MedicalHistoryFields
            value={medicalHistoryForm}
            onChange={(fields) => setMedicalHistoryForm({ ...medicalHistoryForm, ...fields })}
            idPrefix="add-patient-medical-history"
          />
        </Disclosure>
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
        <div className="form-group">
          <label htmlFor="add-patient-ncs-file">Nerve conduction study results (CSV)</label>
          <input id="add-patient-ncs-file" ref={ncsFileRef} type="file" accept=".csv,text/csv" />
          <p className="hint">{NCS_CSV_IMPORT_HINT}</p>
        </div>
        {mutation.error && (
          <p className="form-error">{getErrorMessage(mutation.error)}</p>
        )}
        {success && <p className="form-success">Patient created successfully.</p>}
        {ncsImportResult && <NcsCsvImportResult result={ncsImportResult} />}
        <button className="btn btn-primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creating…' : 'Create Patient'}
        </button>
      </form>
    </div>
  );
}
