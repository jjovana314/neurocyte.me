import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FamilyHistoryForm from './FamilyHistoryForm';
import { addFamilyHistory } from '../api/patients';
import { renderWithQueryClient } from '../test/renderWithQueryClient';

vi.mock('../api/patients', () => ({
  addFamilyHistory: vi.fn(),
}));

const mockAddFamilyHistory = vi.mocked(addFamilyHistory);

beforeEach(() => {
  mockAddFamilyHistory.mockReset();
});

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(screen.getByLabelText(/disease/i), 'Stroke');
  await user.type(screen.getByLabelText(/relation/i), 'Father');
}

describe('FamilyHistoryForm', () => {
  it('submits the entered family history and calls onDone on success', async () => {
    mockAddFamilyHistory.mockResolvedValue({
      id: 1,
      patientId: 42,
      diseaseType: 'Stroke',
      relation: 'Father',
      severity: 'moderate',
      notes: '',
      recordedAt: new Date().toISOString(),
    });
    const onDone = vi.fn();
    const user = userEvent.setup();

    renderWithQueryClient(<FamilyHistoryForm patientId={42} idPrefix="test" onDone={onDone} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /add family history/i }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));

    expect(mockAddFamilyHistory).toHaveBeenCalledWith(42, {
      diseaseType: 'Stroke',
      relation: 'Father',
      severity: 'moderate',
      notes: undefined,
    });
  });

  it('does not call the API when the required fields are empty', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<FamilyHistoryForm patientId={42} idPrefix="test" />);

    await user.click(screen.getByRole('button', { name: /add family history/i }));

    expect(mockAddFamilyHistory).not.toHaveBeenCalled();
  });

  it('offers only the disease types the backend accepts', () => {
    renderWithQueryClient(<FamilyHistoryForm patientId={42} idPrefix="test" />);

    const options = Array.from(
      (screen.getByLabelText(/disease/i) as HTMLSelectElement).options,
    ).map((o) => o.value);

    expect(options).toEqual([
      '',
      'Alzheimer',
      'Parkinson',
      'Stroke',
      'Epilepsy',
      'Brain Tumor',
      'Multiple Sclerosis',
    ]);
  });

  it('shows an error message and does not call onDone when the request fails', async () => {
    mockAddFamilyHistory.mockRejectedValue(new Error('network error'));
    const onDone = vi.fn();
    const user = userEvent.setup();

    renderWithQueryClient(<FamilyHistoryForm patientId={42} idPrefix="test" onDone={onDone} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /add family history/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
