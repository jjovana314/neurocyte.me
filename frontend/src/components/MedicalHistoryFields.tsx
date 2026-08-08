import { todayDateString } from '../utils/dateLimits';
import { SEVERITY_OPTIONS } from '../constants/medicalHistory';
import type { MedicalHistoryFormState } from '../utils/medicalHistoryForm';

type MedicalHistoryFieldsValue = Omit<MedicalHistoryFormState, 'enabled'>;

interface Props {
  value: MedicalHistoryFieldsValue;
  onChange: (value: MedicalHistoryFieldsValue) => void;
  idPrefix: string;
}

export default function MedicalHistoryFields({ value, onChange, idPrefix }: Props) {
  function update<K extends keyof MedicalHistoryFieldsValue>(
    key: K,
    fieldValue: MedicalHistoryFieldsValue[K],
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-disorder`}>Disorder*</label>
          <input
            id={`${idPrefix}-disorder`}
            type="text"
            value={value.disorder}
            required
            onChange={(e) => update('disorder', e.target.value)}
            placeholder="e.g. Multiple sclerosis"
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-diagnosisDate`}>Diagnosis date</label>
          <input
            id={`${idPrefix}-diagnosisDate`}
            type="date"
            value={value.diagnosisDate}
            max={todayDateString()}
            onChange={(e) => update('diagnosisDate', e.target.value)}
          />
        </div>
      </div>
      <div className="form-row">
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
          <label htmlFor={`${idPrefix}-medications`}>Medications</label>
          <input
            id={`${idPrefix}-medications`}
            type="text"
            value={value.medications}
            onChange={(e) => update('medications', e.target.value)}
            placeholder="e.g. Interferon beta-1a"
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`${idPrefix}-description`}>Description</label>
        <textarea
          id={`${idPrefix}-description`}
          rows={2}
          value={value.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>
    </>
  );
}
