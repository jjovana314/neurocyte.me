import type { TycType } from '../api/types';
import type { TouretteSyndromeFormState } from '../utils/touretteSyndromeForm';
import {
  SEVERITY_SCALE_TOURETTE_MAX,
  TOURETTE_SCALE_MIN,
  TOURETTE_TRIGGER_OPTIONS,
  TYC_TYPE_OPTIONS,
  URGE_LEVEN_TOURETTE_SCALE_MAX,
} from '../constants/tourette';

type TouretteSyndromeFieldsValue = Omit<TouretteSyndromeFormState, 'enabled'>;

interface Props {
  value: TouretteSyndromeFieldsValue;
  onChange: (value: TouretteSyndromeFieldsValue) => void;
  idPrefix: string;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function TouretteSyndromeFields({ value, onChange, idPrefix }: Props) {
  function update<K extends keyof TouretteSyndromeFieldsValue>(
    key: K,
    fieldValue: TouretteSyndromeFieldsValue[K],
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  const urgeScaleLabel = `(${TOURETTE_SCALE_MIN}-${URGE_LEVEN_TOURETTE_SCALE_MAX})`;
  const severityScaleLabel =`(${TOURETTE_SCALE_MIN}-${SEVERITY_SCALE_TOURETTE_MAX})`; 

  return (
    <>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-tycType`}>Tic type*</label>
        <select
          id={`${idPrefix}-tycType`}
          value={value.tycType}
          required
          onChange={(e) => update('tycType', e.target.value as TycType)}
        >
          {TYC_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-severityScale`}>Severity {severityScaleLabel}*</label>
          <input
            id={`${idPrefix}-severityScale`}
            type="number"
            min={TOURETTE_SCALE_MIN}
            max={SEVERITY_SCALE_TOURETTE_MAX}
            value={value.severityScale}
            required
            onChange={(e) => update('severityScale', Number(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-premonitoryUrgeLevel`}>
            Premonitory urge {urgeScaleLabel}*
          </label>
          <input
            id={`${idPrefix}-premonitoryUrgeLevel`}
            type="number"
            min={TOURETTE_SCALE_MIN}
            max={URGE_LEVEN_TOURETTE_SCALE_MAX}
            value={value.premonitoryUrgeLevel}
            required
            onChange={(e) => update('premonitoryUrgeLevel', Number(e.target.value))}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Triggers</label>
        <div className="checkbox-flags">
          {TOURETTE_TRIGGER_OPTIONS.map((opt) => (
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
        <label htmlFor={`${idPrefix}-medication`}>Medication taken</label>
        <input
          id={`${idPrefix}-medication`}
          type="text"
          value={value.medicationTaken}
          onChange={(e) => update('medicationTaken', e.target.value)}
          placeholder="e.g. Aripiprazole 5mg"
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
