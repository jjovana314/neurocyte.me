import { SEVERITY_OPTIONS } from '../constants/medicalHistory';
import { DISEASE_TYPE_OPTIONS, RELATION_SUGGESTIONS } from '../constants/familyHistory';
import type { FamilyHistoryFormState } from '../utils/familyHistoryForm';

type FamilyHistoryFieldsValue = Omit<FamilyHistoryFormState, 'enabled'>;

interface Props {
  value: FamilyHistoryFieldsValue;
  onChange: (value: FamilyHistoryFieldsValue) => void;
  idPrefix: string;
}

export default function FamilyHistoryFields({ value, onChange, idPrefix }: Props) {
  function update<K extends keyof FamilyHistoryFieldsValue>(
    key: K,
    fieldValue: FamilyHistoryFieldsValue[K],
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-diseaseType`}>Disease*</label>
          <select
            id={`${idPrefix}-diseaseType`}
            value={value.diseaseType}
            required
            onChange={(e) => update('diseaseType', e.target.value)}
          >
            <option value="">— Select —</option>
            {DISEASE_TYPE_OPTIONS.map((disease) => (
              <option key={disease} value={disease}>
                {disease}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-relation`}>Relation*</label>
          <input
            id={`${idPrefix}-relation`}
            type="text"
            list={`${idPrefix}-relation-options`}
            value={value.relation}
            required
            onChange={(e) => update('relation', e.target.value)}
            placeholder="e.g. Mother"
          />
          <datalist id={`${idPrefix}-relation-options`}>
            {RELATION_SUGGESTIONS.map((relation) => (
              <option key={relation} value={relation} />
            ))}
          </datalist>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-severity`}>Severity</label>
        <select
          id={`${idPrefix}-severity`}
          value={value.severity}
          onChange={(e) => update('severity', e.target.value)}
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
