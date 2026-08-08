import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddPatientForm from './AddPatientForm';
import { addMedicalHistory, createPatient, importNcsStudiesCsv } from '../api/patients';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import type { Patient, PatientHistory } from '../api/types';

vi.mock('../api/patients', () => ({
  createPatient: vi.fn(),
  addMedicalHistory: vi.fn(),
  importNcsStudiesCsv: vi.fn(),
}));

const mockCreatePatient = vi.mocked(createPatient);
const mockAddMedicalHistory = vi.mocked(addMedicalHistory);
const mockImportNcsStudiesCsv = vi.mocked(importNcsStudiesCsv);

const mockCreatedPatient = { id: 99 } as Patient;
const mockCreatedHistory: PatientHistory = {
  id: 1,
  patientId: 99,
  disorder: 'Multiple sclerosis',
  description: '',
  diagnosisDate: null,
  severity: 'moderate',
  medications: '',
  recordedAt: new Date().toISOString(),
};

async function fillRequiredPatientFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/patient name/i), 'Jane Doe');
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
  await user.selectOptions(screen.getByLabelText(/gender/i), 'Female');
}

beforeEach(() => {
  mockCreatePatient.mockReset().mockResolvedValue(mockCreatedPatient);
  mockAddMedicalHistory.mockReset();
  mockImportNcsStudiesCsv.mockReset();
});

describe('AddPatientForm medical history', () => {
  it('does not add medical history when the disclosure is left closed', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddPatientForm />);

    await fillRequiredPatientFields(user);
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    await waitFor(() => expect(mockCreatePatient).toHaveBeenCalledTimes(1));
    expect(mockAddMedicalHistory).not.toHaveBeenCalled();
  });

  it('adds medical history for the newly created patient once the disclosure is filled in', async () => {
    mockAddMedicalHistory.mockResolvedValue(mockCreatedHistory);
    const user = userEvent.setup();
    renderWithQueryClient(<AddPatientForm />);

    await fillRequiredPatientFields(user);
    await user.click(screen.getByRole('button', { name: /record medical history/i }));
    await user.type(screen.getByLabelText(/disorder/i), 'Multiple sclerosis');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    await waitFor(() => expect(mockAddMedicalHistory).toHaveBeenCalledTimes(1));
    expect(mockAddMedicalHistory).toHaveBeenCalledWith(99, {
      disorder: 'Multiple sclerosis',
      description: undefined,
      diagnosisDate: undefined,
      severity: 'moderate',
      medications: undefined,
    });
  });

  it('collapses the medical history disclosure after a successful submit', async () => {
    mockAddMedicalHistory.mockResolvedValue(mockCreatedHistory);
    const user = userEvent.setup();
    renderWithQueryClient(<AddPatientForm />);

    await fillRequiredPatientFields(user);
    await user.click(screen.getByRole('button', { name: /record medical history/i }));
    await user.type(screen.getByLabelText(/disorder/i), 'Multiple sclerosis');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    await screen.findByText(/patient created successfully/i);

    expect(screen.queryByLabelText(/disorder/i)).not.toBeInTheDocument();
  });
});
