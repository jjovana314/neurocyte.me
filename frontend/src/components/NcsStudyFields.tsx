import type { NcsStudyType } from '../api/types';
import type { NcsStudyFormState } from '../utils/ncsStudyForm';
import { NCS_NERVE_OPTIONS, NCS_STUDY_TYPE_OPTIONS } from '../constants/ncs';

interface Props {
  value: NcsStudyFormState;
  onChange: (value: NcsStudyFormState) => void;
  idPrefix: string;
}

export default function NcsStudyFields({ value, onChange, idPrefix }: Props) {
  function update<K extends keyof NcsStudyFormState>(
    key: K,
    fieldValue: NcsStudyFormState[K],
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-nerveName`}>Nerve*</label>
          <input
            id={`${idPrefix}-nerveName`}
            type="text"
            list={`${idPrefix}-nerve-options`}
            value={value.nerveName}
            required
            onChange={(e) => update('nerveName', e.target.value)}
            placeholder="e.g. Median"
          />
          <datalist id={`${idPrefix}-nerve-options`}>
            {NCS_NERVE_OPTIONS.map((nerve) => (
              <option key={nerve} value={nerve} />
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-studyType`}>Study type*</label>
          <select
            id={`${idPrefix}-studyType`}
            value={value.studyType}
            onChange={(e) => update('studyType', e.target.value as NcsStudyType)}
          >
            {NCS_STUDY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-distance`}>Distance (mm)*</label>
          <input
            id={`${idPrefix}-distance`}
            type="number"
            min={0}
            step="any"
            value={value.distanceMm}
            required
            onChange={(e) => update('distanceMm', e.target.value)}
            placeholder="e.g. 200"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${idPrefix}-distalLatency`}>Distal latency (ms)*</label>
          <input
            id={`${idPrefix}-distalLatency`}
            type="number"
            min={0}
            step="any"
            value={value.distalLatencyMs}
            required
            onChange={(e) => update('distalLatencyMs', e.target.value)}
            placeholder="e.g. 3.2"
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-distalAmplitude`}>
            Distal amplitude ({value.studyType === 'MOTOR' ? 'mV' : 'uV'})*
          </label>
          <input
            id={`${idPrefix}-distalAmplitude`}
            type="number"
            min={0}
            step="any"
            value={value.distalAmplitude}
            required
            onChange={(e) => update('distalAmplitude', e.target.value)}
            placeholder="e.g. 8.5"
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${idPrefix}-distalDuration`}>Distal duration (ms)</label>
          <input
            id={`${idPrefix}-distalDuration`}
            type="number"
            min={0}
            step="any"
            value={value.distalDurationMs}
            onChange={(e) => update('distalDurationMs', e.target.value)}
          />
        </div>
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={value.includeProximalSite}
          onChange={(e) => update('includeProximalSite', e.target.checked)}
        />
        Include proximal site (needed for conduction velocity)
      </label>

      {value.includeProximalSite && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor={`${idPrefix}-proximalLatency`}>Proximal latency (ms)*</label>
            <input
              id={`${idPrefix}-proximalLatency`}
              type="number"
              min={0}
              step="any"
              value={value.proximalLatencyMs}
              required={value.includeProximalSite}
              onChange={(e) => update('proximalLatencyMs', e.target.value)}
              placeholder="e.g. 7.1"
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${idPrefix}-proximalAmplitude`}>
              Proximal amplitude ({value.studyType === 'MOTOR' ? 'mV' : 'uV'})*
            </label>
            <input
              id={`${idPrefix}-proximalAmplitude`}
              type="number"
              min={0}
              step="any"
              value={value.proximalAmplitude}
              required={value.includeProximalSite}
              onChange={(e) => update('proximalAmplitude', e.target.value)}
              placeholder="e.g. 7.9"
            />
          </div>
          <div className="form-group">
            <label htmlFor={`${idPrefix}-proximalDuration`}>Proximal duration (ms)</label>
            <input
              id={`${idPrefix}-proximalDuration`}
              type="number"
              min={0}
              step="any"
              value={value.proximalDurationMs}
              onChange={(e) => update('proximalDurationMs', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor={`${idPrefix}-skinTemp`}>Skin temperature (°C)</label>
        <input
          id={`${idPrefix}-skinTemp`}
          type="number"
          step="any"
          value={value.skinTemperatureCelsius}
          onChange={(e) => update('skinTemperatureCelsius', e.target.value)}
          placeholder="e.g. 32"
        />
      </div>
    </>
  );
}
