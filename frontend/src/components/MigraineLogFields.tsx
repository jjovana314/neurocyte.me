import { nowDateTimeLocalString } from '../utils/dateLimits';
import type { MigraineLogFormState } from '../utils/migraineLogForm';

type MigraineLogFieldsValue = Omit<MigraineLogFormState, 'enabled'>;

interface Props {
  value: MigraineLogFieldsValue;
  onChange: (value: MigraineLogFieldsValue) => void;
  idPrefix: string;
}

export default function MigraineLogFields({ value, onChange, idPrefix }: Props) {
  function update<K extends keyof MigraineLogFieldsValue>(
    key: K,
    fieldValue: MigraineLogFieldsValue[K],
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-occurredAt`}>Occurred at*</label>
          <input
            id={`${idPrefix}-occurredAt`}
            type="datetime-local"
            value={value.occurredAt}
            max={nowDateTimeLocalString()}
            required
            onChange={(e) => update('occurredAt', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-duration`}>Duration (minutes)</label>
          <input
            id={`${idPrefix}-duration`}
            type="number"
            min={0}
            value={value.durationMinutes}
            onChange={(e) => update('durationMinutes', e.target.value)}
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
            value={value.painSeverity}
            required
            onChange={(e) => update('painSeverity', Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-medication`}>Medication taken</label>
          <input
            id={`${idPrefix}-medication`}
            type="text"
            value={value.medicationTaken}
            onChange={(e) => update('medicationTaken', e.target.value)}
            placeholder="e.g. Sumatriptan 50mg"
          />
        </div>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={value.auraPresent}
          onChange={(e) => update('auraPresent', e.target.checked)}
        />
        Aura present
      </label>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-triggers`}>Triggers</label>
        <input
          id={`${idPrefix}-triggers`}
          type="text"
          value={value.triggers}
          onChange={(e) => update('triggers', e.target.value)}
          placeholder="e.g. Lack of sleep, bright light"
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-symptoms`}>Symptoms</label>
        <input
          id={`${idPrefix}-symptoms`}
          type="text"
          value={value.symptoms}
          onChange={(e) => update('symptoms', e.target.value)}
          placeholder="e.g. Nausea, photophobia"
        />
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-notes`}>Notes</label>
        <textarea
          id={`${idPrefix}-notes`}
          rows={2}
          value={value.notes}
          onChange={(e) => update('notes', e.target.value)}
        />
      </div>
    </>
  );
}
