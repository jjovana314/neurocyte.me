import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddPatientForm from './AddPatientForm';
import {
  addFamilyHistory,
  addMedicalHistory,
  createPatient,
  importNcsStudiesCsv,
} from '../api/patients';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import type { FamilyHistory, Patient, PatientHistory } from '../api/types';

vi.mock('../api/patients', () => ({
  createPatient: vi.fn(),
  addMedicalHistory: vi.fn(),
  addFamilyHistory: vi.fn(),
  importNcsStudiesCsv: vi.fn(),
}));

const mockCreatePatient = vi.mocked(createPatient);
const mockAddMedicalHistory = vi.mocked(addMedicalHistory);
const mockAddFamilyHistory = vi.mocked(addFamilyHistory);
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
const mockCreatedFamilyHistory: FamilyHistory = {
  id: 1,
  patientId: 99,
  diseaseType: 'Parkinson',
  relation: 'Mother',
  severity: 'moderate',
  notes: '',
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
  mockAddFamilyHistory.mockReset();
  mockImportNcsStudiesCsv.mockReset();
});

describe('AddPatientForm family history', () => {
  it('does not add family history when the disclosure is left closed', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AddPatientForm />);

    await fillRequiredPatientFields(user);
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    await waitFor(() => expect(mockCreatePatient).toHaveBeenCalledTimes(1));
    expect(mockAddFamilyHistory).not.toHaveBeenCalled();
  });

  it('adds family history for the newly created patient once the disclosure is filled in', async () => {
    mockAddFamilyHistory.mockResolvedValue(mockCreatedFamilyHistory);
    const user = userEvent.setup();
    renderWithQueryClient(<AddPatientForm />);

    await fillRequiredPatientFields(user);
    await user.click(screen.getByRole('button', { name: /record family history/i }));
    await user.selectOptions(screen.getByLabelText(/disease/i), 'Parkinson');
    await user.type(screen.getByLabelText(/relation/i), 'Mother');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    await waitFor(() => expect(mockAddFamilyHistory).toHaveBeenCalledTimes(1));
    expect(mockAddFamilyHistory).toHaveBeenCalledWith(99, {
      diseaseType: 'Parkinson',
      relation: 'Mother',
      severity: 'moderate',
      notes: undefined,
    });
  });

  it('collapses the family history disclosure after a successful submit', async () => {
    mockAddFamilyHistory.mockResolvedValue(mockCreatedFamilyHistory);
    const user = userEvent.setup();
    renderWithQueryClient(<AddPatientForm />);

    await fillRequiredPatientFields(user);
    await user.click(screen.getByRole('button', { name: /record family history/i }));
    await user.selectOptions(screen.getByLabelText(/disease/i), 'Parkinson');
    await user.type(screen.getByLabelText(/relation/i), 'Mother');
    await user.click(screen.getByRole('button', { name: /create patient/i }));

    await screen.findByText(/patient created successfully/i);

    expect(screen.queryByLabelText(/relation/i)).not.toBeInTheDocument();
  });
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
