import { nowDateTimeLocalString } from '../utils/dateLimits';
import type { OnsetVector } from '../api/types';
import type { SeizureLogFormState } from '../utils/seizureLogForm';
import {
  MOTOR_FEATURE_OPTIONS,
  ONSET_VECTOR_OPTIONS,
  SEIZURE_TRIGGER_OPTIONS,
} from '../constants/seizure';

type SeizureLogFieldsValue = Omit<SeizureLogFormState, 'enabled'>;

interface Props {
  value: SeizureLogFieldsValue;
  onChange: (value: SeizureLogFieldsValue) => void;
  idPrefix: string;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function SeizureLogFields({ value, onChange, idPrefix }: Props) {
  function update<K extends keyof SeizureLogFieldsValue>(
    key: K,
    fieldValue: SeizureLogFieldsValue[K],
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-ictusStart`}>Ictus start*</label>
          <input
            id={`${idPrefix}-ictusStart`}
            type="datetime-local"
            value={value.ictusStart}
            max={nowDateTimeLocalString()}
            required
            onChange={(e) => update('ictusStart', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-ictusEnd`}>Ictus end*</label>
          <input
            id={`${idPrefix}-ictusEnd`}
            type="datetime-local"
            value={value.ictusEnd}
            max={nowDateTimeLocalString()}
            required
            onChange={(e) => update('ictusEnd', e.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-onsetVector`}>Onset*</label>
          <select
            id={`${idPrefix}-onsetVector`}
            value={value.onsetVector}
            onChange={(e) => update('onsetVector', e.target.value as OnsetVector)}
          >
            {ONSET_VECTOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-postictal`}>Postictal duration (minutes)</label>
          <input
            id={`${idPrefix}-postictal`}
            type="number"
            min={0}
            value={value.postictalDurationMinutes}
            onChange={(e) => update('postictalDurationMinutes', e.target.value)}
            placeholder="e.g. 20"
          />
        </div>
      </div>
      <div className="form-group">
        <label>Motor features</label>
        <div className="checkbox-flags">
          {MOTOR_FEATURE_OPTIONS.map((opt) => (
            <label key={opt.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={value.motorFeatures.includes(opt.value)}
                onChange={() => update('motorFeatures', toggle(value.motorFeatures, opt.value))}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Triggers</label>
        <div className="checkbox-flags">
          {SEIZURE_TRIGGER_OPTIONS.map((opt) => (
            <label key={opt.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={value.triggers.includes(opt.value)}
                onChange={() => update('triggers', toggle(value.triggers, opt.value))}
              />
              {opt.label}
            </label>
          ))}
        </div>
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
