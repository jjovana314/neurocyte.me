import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMigraineLog } from '../api/patients';
import { getErrorMessage } from '../api/errors';

interface Props {
  patientId: number;
  idPrefix: string;
  onDone?: () => void;
}

export default function MigraineLogForm({ patientId, idPrefix, onDone }: Props) {
  const queryClient = useQueryClient();
  const [occurredAt, setOccurredAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [painSeverity, setPainSeverity] = useState(5);
  const [auraPresent, setAuraPresent] = useState(false);
  const [triggers, setTriggers] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicationTaken, setMedicationTaken] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      addMigraineLog(patientId, {
        occurredAt: new Date(occurredAt).toISOString(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        painSeverity,
        auraPresent,
        triggers: triggers || undefined,
        symptoms: symptoms || undefined,
        medicationTaken: medicationTaken || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setOccurredAt('');
      setDurationMinutes('');
      setPainSeverity(5);
      setAuraPresent(false);
      setTriggers('');
      setSymptoms('');
      setMedicationTaken('');
      setNotes('');
      onDone?.();
    },
  });

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="migraine-log-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-occurredAt`}>Occurred at*</label>
          <input
            id={`${idPrefix}-occurredAt`}
            type="datetime-local"
            value={occurredAt}
            required
            onChange={(e) => setOccurredAt(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-duration`}>Duration (minutes)</label>
          <input
            id={`${idPrefix}-duration`}
            type="number"
            min={0}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            placeholder="e.g. 90"
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-painSeverity`}>Pain severity (1-10)*</label>
          <input
            id={`${idPrefix}-painSeverity`}
            type="number"
            min={1}
            max={10}
            value={painSeverity}
            required
            onChange={(e) => setPainSeverity(Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-medication`}>Medication taken</label>
          <input
            id={`${idPrefix}-medication`}
            type="text"
            value={medicationTaken}
            onChange={(e) => setMedicationTaken(e.target.value)}
            placeholder="e.g. Sumatriptan 50mg"
          />
        </div>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={auraPresent}
          onChange={(e) => setAuraPresent(e.target.checked)}
        />
        Aura present
      </label>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-triggers`}>Triggers</label>
        <input
          id={`${idPrefix}-triggers`}
          type="text"
          value={triggers}
          onChange={(e) => setTriggers(e.target.value)}
          placeholder="e.g. Lack of sleep, bright light"
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-symptoms`}>Symptoms</label>
        <input
          id={`${idPrefix}-symptoms`}
          type="text"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. Nausea, photophobia"
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-notes`}>Notes</label>
        <textarea
          id={`${idPrefix}-notes`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {mutation.error && <p className="form-error">{getErrorMessage(mutation.error)}</p>}
      <div className="edit-actions">
        <button className="btn btn-primary btn-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Add migraine log'}
        </button>
      </div>
    </form>
  );
}
