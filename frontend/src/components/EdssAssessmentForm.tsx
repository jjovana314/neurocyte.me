import { EDSS_FSS_FIELDS } from '../constants/edss';
import type { EdssFormState } from '../utils/edssForm';

interface Props {
  value: EdssFormState;
  onChange: (value: EdssFormState) => void;
  idPrefix: string;
}

export default function EdssAssessmentForm({ value, onChange, idPrefix }: Props) {
  function update<K extends keyof EdssFormState>(key: K, fieldValue: EdssFormState[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <div className="edss-form">
      <label className="checkbox-label edss-toggle">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => update('enabled', e.target.checked)}
        />
        Record an EDSS assessment
      </label>

      {value.enabled && (
        <div className="edss-fields">
          <div className="edss-fss-grid">
            {EDSS_FSS_FIELDS.map((field) => (
              <div className="form-group" key={field.key}>
                <label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</label>
                <select
                  id={`${idPrefix}-${field.key}`}
                  value={value[field.key]}
                  onChange={(e) => update(field.key, Number(e.target.value))}
                >
                  {Array.from({ length: field.max + 1 }, (_, grade) => grade).map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor={`${idPrefix}-walking-distance`}>
              Unassisted walking distance (meters)
            </label>
            <input
              id={`${idPrefix}-walking-distance`}
              type="number"
              min={0}
              value={value.unassistedWalkingDistanceMeters}
              onChange={(e) => update('unassistedWalkingDistanceMeters', e.target.value)}
              placeholder="e.g. 500"
            />
          </div>

          <div className="edss-ambulation-flags">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={value.requiresUnilateralAid}
                onChange={(e) => update('requiresUnilateralAid', e.target.checked)}
              />
              Requires unilateral aid
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={value.requiresBilateralAid}
                onChange={(e) => update('requiresBilateralAid', e.target.checked)}
              />
              Requires bilateral aid
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={value.wheelchairBound}
                onChange={(e) => update('wheelchairBound', e.target.checked)}
              />
              Wheelchair-bound
            </label>
          </div>

          <p className="hint">
            The total EDSS score is derived from these values on the server when saved.
          </p>
        </div>
      )}
    </div>
  );
}
