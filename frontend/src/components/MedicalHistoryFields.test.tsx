import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MedicalHistoryFields from './MedicalHistoryFields';
import { EMPTY_MEDICAL_HISTORY_FORM_STATE, type MedicalHistoryFormState } from '../utils/medicalHistoryForm';

type FieldsValue = Omit<MedicalHistoryFormState, 'enabled'>;

// MedicalHistoryFields is a controlled component (value/onChange), so the
// test drives it through a small stateful harness, mirroring how it's used
// inside MedicalHistoryForm/AddPatientForm.
function Harness({ onChange }: { onChange: (value: FieldsValue) => void }) {
  const [value, setValue] = useState<FieldsValue>(EMPTY_MEDICAL_HISTORY_FORM_STATE);
  return (
    <MedicalHistoryFields
      value={value}
      idPrefix="test"
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('MedicalHistoryFields', () => {
  it('marks the disorder field as required and defaults severity to moderate', () => {
    render(<Harness onChange={vi.fn()} />);

    expect(screen.getByLabelText(/disorder/i)).toBeRequired();
    expect(screen.getByLabelText(/severity/i)).toHaveValue('moderate');
  });

  it('reports typed disorder text through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByLabelText(/disorder/i), 'Migraine');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ disorder: 'Migraine' }),
    );
  });

  it('reports a severity selection through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(/severity/i), 'severe');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ severity: 'severe' }),
    );
  });

  it('reports typed description text through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByLabelText(/description/i), 'Relapsing-remitting');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ description: 'Relapsing-remitting' }),
    );
  });

  it('handles multiple changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByLabelText(/disorder/i), 'Migraine');
    await user.selectOptions(screen.getByLabelText(/severity/i), 'severe');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ disorder: 'Migraine', severity: 'severe' }),
    );
  });

  it('displays error message when input is invalid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByLabelText(/description/i), 'Invalid input');

    expect(screen.getByText(/Invalid input/)).toBeInTheDocument();
  });

  it('handles complex scenarios', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.type(screen.getByLabelText(/disorder/i), 'Migraine');
    await user.selectOptions(screen.getByLabelText(/severity/i), 'severe');

    await user.type(screen.getByLabelText(/description/i), 'Relapsing-remitting');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        disorder: 'Migraine',
        severity: 'severe',
        description: 'Relapsing-remitting',
      }),
    );
  });
});
