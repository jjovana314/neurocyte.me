import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpandedRow from './ExpandedRow';
import {
  addMedicalHistory,
  addTouretteSyndrome,
  importNcsStudiesCsv,
  updatePatient,
  updateTouretteSyndrome,
} from '../api/patients';
import { renderWithQueryClient } from '../test/renderWithQueryClient';
import type { Patient, PatientHistory, TouretteSyndrome } from '../api/types';

vi.mock('../api/patients', () => ({
  addMedicalHistory: vi.fn(),
  updatePatient: vi.fn(),
  importNcsStudiesCsv: vi.fn(),
  addTouretteSyndrome: vi.fn(),
  updateTouretteSyndrome: vi.fn(),
}));

const mockAddMedicalHistory = vi.mocked(addMedicalHistory);
const mockUpdatePatient = vi.mocked(updatePatient);
const mockImportNcsStudiesCsv = vi.mocked(importNcsStudiesCsv);
const mockAddTouretteSyndrome = vi.mocked(addTouretteSyndrome);
const mockUpdateTouretteSyndrome = vi.mocked(updateTouretteSyndrome);

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
  touretteSyndrom: [],
};

const mockTouretteRecord: TouretteSyndrome = {
  id: 3,
  patientId: 7,
  tycType: 'MOTOR_COMPLEX',
  recordedAt: new Date().toISOString(),
  severityScale: 5,
  premonitoryUrgeLevel: 3,
  triggers: ['FATIGUE'],
  notes: 'worse at school',
  medicationTaken: null,
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
  mockAddTouretteSyndrome.mockReset().mockResolvedValue(mockPatient);
  mockUpdateTouretteSyndrome.mockReset().mockResolvedValue(mockPatient);
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

  it('hides the form and discards typed values when cancelled', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ExpandedRow patient={mockPatient} />);

    await user.click(screen.getByRole('button', { name: /add medical history/i }));
    await user.type(screen.getByLabelText(/disorder/i), 'Migraine');
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(screen.queryByLabelText(/disorder/i)).not.toBeInTheDocument();
    expect(mockAddMedicalHistory).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /add medical history/i }));
    expect(screen.getByLabelText(/disorder/i)).toHaveValue('');
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

describe('ExpandedRow Tourette syndrome', () => {
  it('shows an empty state when there are no Tourette records', () => {
    renderWithQueryClient(<ExpandedRow patient={mockPatient} />);

    expect(screen.getByText(/no tourette syndrome records/i)).toBeInTheDocument();
  });

  it('adds a new Tourette record for this patient', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ExpandedRow patient={mockPatient} />);

    await user.click(screen.getByRole('button', { name: /add tourette record/i }));
    await user.selectOptions(screen.getByLabelText(/tic type/i), 'VOCAL_SIMPLE');
    await user.click(screen.getByRole('button', { name: /add tourette record/i }));

    await waitFor(() => expect(mockAddTouretteSyndrome).toHaveBeenCalledTimes(1));
    expect(mockAddTouretteSyndrome).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ tycType: 'VOCAL_SIMPLE', triggers: [] }),
    );
    await waitFor(() => expect(screen.queryByLabelText(/tic type/i)).not.toBeInTheDocument());
  });

  it('renders existing records and edits one with its current values prefilled', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <ExpandedRow patient={{ ...mockPatient, touretteSyndrom: [mockTouretteRecord] }} />,
    );

    expect(screen.getByText('Motor - complex')).toBeInTheDocument();
    expect(screen.getByText('worse at school')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(screen.getByLabelText(/tic type/i)).toHaveValue('MOTOR_COMPLEX');
    expect(screen.getByLabelText(/^fatigue$/i)).toBeChecked();

    await user.clear(screen.getByLabelText(/^severity/i));
    await user.type(screen.getByLabelText(/^severity/i), '8');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mockUpdateTouretteSyndrome).toHaveBeenCalledTimes(1));
    expect(mockUpdateTouretteSyndrome).toHaveBeenCalledWith(7, 3, {
      tycType: 'MOTOR_COMPLEX',
      severityScale: 8,
      premonitoryUrgeLevel: 3,
      triggers: ['FATIGUE'],
      medicationTaken: '',
      notes: 'worse at school',
    });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument(),
    );
  });
});
