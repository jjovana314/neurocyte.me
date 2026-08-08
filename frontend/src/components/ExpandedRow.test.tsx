import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpandedRow from './ExpandedRow';
import { addMedicalHistory, importNcsStudiesCsv, updatePatient } from '../api/patients';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import type { Patient, PatientHistory } from '../api/types';

vi.mock('../api/patients', () => ({
  addMedicalHistory: vi.fn(),
  updatePatient: vi.fn(),
  importNcsStudiesCsv: vi.fn(),
}));

const mockAddMedicalHistory = vi.mocked(addMedicalHistory);
const mockUpdatePatient = vi.mocked(updatePatient);
const mockImportNcsStudiesCsv = vi.mocked(importNcsStudiesCsv);

const mockPatient: Patient = {
  id: 7,
  doctorId: 1,
  name: 'Jane Doe',
  dateOfBirth: '1990-01-01',
  gender: 'Female',
  phone: null,
  email: null,
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  medicalHistory: [],
  familyHistory: [],
  edssAssessments: [],
  migraineLogs: [],
  seizureLogs: [],
  ncsStudies: [],
};

const mockCreatedHistory: PatientHistory = {
  id: 1,
  patientId: 7,
  disorder: 'Migraine',
  description: '',
  diagnosisDate: null,
  severity: 'moderate',
  medications: '',
  recordedAt: new Date().toISOString(),
};

beforeEach(() => {
  mockAddMedicalHistory.mockReset();
  mockUpdatePatient.mockReset();
  mockImportNcsStudiesCsv.mockReset();
});

describe('ExpandedRow medical history', () => {
  it('shows an empty state and an "Add medical history" button when there is none', () => {
    renderWithQueryClient(<ExpandedRow patient={mockPatient} />);

    expect(screen.getByText(/no medical history recorded/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add medical history/i })).toBeInTheDocument();
  });

  it('reveals the add-history form when the trigger button is clicked', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ExpandedRow patient={mockPatient} />);

    await user.click(screen.getByRole('button', { name: /add medical history/i }));

    expect(screen.getByLabelText(/disorder/i)).toBeInTheDocument();
  });

  it('submits a new medical history entry for this patient and re-hides the form', async () => {
    mockAddMedicalHistory.mockResolvedValue(mockCreatedHistory);
    const user = userEvent.setup();
    renderWithQueryClient(<ExpandedRow patient={mockPatient} />);

    await user.click(screen.getByRole('button', { name: /add medical history/i }));
    await user.type(screen.getByLabelText(/disorder/i), 'Migraine');
    await user.click(screen.getByRole('button', { name: /add medical history/i }));

    await waitFor(() => expect(mockAddMedicalHistory).toHaveBeenCalledTimes(1));
    expect(mockAddMedicalHistory).toHaveBeenCalledWith(7, {
      disorder: 'Migraine',
      description: undefined,
      diagnosisDate: undefined,
      severity: 'moderate',
      medications: undefined,
    });

    await waitFor(() => expect(screen.queryByLabelText(/disorder/i)).not.toBeInTheDocument());
  });

  it('renders existing medical history entries in the table', () => {
    const patientWithHistory: Patient = {
      ...mockPatient,
      medicalHistory: [mockCreatedHistory],
    };
    renderWithQueryClient(<ExpandedRow patient={patientWithHistory} />);

    expect(screen.getByText('Migraine')).toBeInTheDocument();
    expect(screen.queryByText(/no medical history recorded/i)).not.toBeInTheDocument();
  });
});
