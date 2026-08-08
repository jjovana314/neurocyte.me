import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MedicalHistoryForm from './MedicalHistoryForm';
import { addMedicalHistory } from '../api/patients';
import { renderWithQueryClient } from '../test/renderWithQueryClient';

vi.mock('../api/patients', () => ({
  addMedicalHistory: vi.fn(),
}));

const mockAddMedicalHistory = vi.mocked(addMedicalHistory);

beforeEach(() => {
  mockAddMedicalHistory.mockReset();
});

describe('MedicalHistoryForm', () => {
  it('submits the entered history and calls onDone on success', async () => {
    mockAddMedicalHistory.mockResolvedValue({
      id: 1,
      patientId: 42,
      disorder: 'Migraine',
      description: '',
      diagnosisDate: null,
      severity: 'moderate',
      medications: '',
      recordedAt: new Date().toISOString(),
    });
    const onDone = vi.fn();
    const user = userEvent.setup();

    renderWithQueryClient(
      <MedicalHistoryForm patientId={42} idPrefix="test" onDone={onDone} />,
    );

    await user.type(screen.getByLabelText(/disorder/i), 'Migraine');
    await user.click(screen.getByRole('button', { name: /add medical history/i }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));

    expect(mockAddMedicalHistory).toHaveBeenCalledWith(42, {
      disorder: 'Migraine',
      description: undefined,
      diagnosisDate: undefined,
      severity: 'moderate',
      medications: undefined,
    });
  });

  it('does not call the API when the required disorder field is empty', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<MedicalHistoryForm patientId={42} idPrefix="test" />);

    await user.click(screen.getByRole('button', { name: /add medical history/i }));

    expect(mockAddMedicalHistory).not.toHaveBeenCalled();
  });

  it('shows an error message and does not call onDone when the request fails', async () => {
    mockAddMedicalHistory.mockRejectedValue(new Error('network error'));
    const onDone = vi.fn();
    const user = userEvent.setup();

    renderWithQueryClient(
      <MedicalHistoryForm patientId={42} idPrefix="test" onDone={onDone} />,
    );

    await user.type(screen.getByLabelText(/disorder/i), 'Migraine');
    await user.click(screen.getByRole('button', { name: /add medical history/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });
});
