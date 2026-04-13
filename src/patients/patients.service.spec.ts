import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { User } from 'src/auth/entites/user.entity';
import { PinoLogger } from 'nestjs-pino';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;

  const mockPatientRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockPatientHistoryRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockFamilyHistoryRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: mockPatientRepository,
        },
        {
          provide: getRepositoryToken(PatientHistory),
          useValue: mockPatientHistoryRepository,
        },
        {
          provide: getRepositoryToken(FamilyHistory),
          useValue: mockFamilyHistoryRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create patient when doctor is valid', async () => {
    const doctorId = 1;
    const createPatientDto = { notes: 'Test patient' };
    const mockDoctor = { id: doctorId, role: { name: 'doctor' } } as any;
    const mockPatient = { id: 1, doctorId, ...createPatientDto } as any;

    mockUserRepository.findOne.mockResolvedValue(mockDoctor);
    mockPatientRepository.save.mockResolvedValue(mockPatient);

    const result = await service.createPatient(doctorId, createPatientDto);
    expect(result).toEqual(mockPatient);
  });

  describe('exportPatientPdf', () => {
    const doctorId = 1;
    const patientId = 10;

    const mockDoctor = {
      id: doctorId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@hospital.com',
      role: { name: 'doctor' },
    } as any;

    const mockPatient = {
      id: patientId,
      doctorId,
      name: 'John Doe',
      notes: 'Patient notes',
      createdAt: new Date('2025-01-01T10:00:00Z'),
      updatedAt: new Date('2025-06-01T10:00:00Z'),
      medicalHistory: [
        {
          id: 1,
          disorder: 'Epilepsy',
          description: 'Focal seizures',
          diagnosisDate: '2024-03-15',
          severity: 'moderate',
          medications: 'Levetiracetam',
          recordedAt: new Date('2024-03-15T08:00:00Z'),
        },
      ],
      familyHistory: [
        {
          id: 1,
          diseaseType: 'Alzheimer',
          relation: 'Mother',
          severity: 'severe',
          notes: 'Diagnosed at 70',
          recordedAt: new Date('2024-03-15T08:00:00Z'),
        },
      ],
    } as any;

    it('should return a Buffer containing a PDF', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(mockPatient);

      const result = await service.exportPatientPdf(doctorId, patientId);

      expect(result).toBeInstanceOf(Buffer);
      // PDF files start with the %PDF magic bytes
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should throw NotFoundException when doctor does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.exportPatientPdf(doctorId, patientId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not a doctor', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockDoctor,
        role: { name: 'researcher' },
      });

      await expect(
        service.exportPatientPdf(doctorId, patientId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.exportPatientPdf(doctorId, patientId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        doctorId: 999,
      });

      await expect(
        service.exportPatientPdf(doctorId, patientId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle patient with no medical or family history', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        medicalHistory: [],
        familyHistory: [],
      });

      const result = await service.exportPatientPdf(doctorId, patientId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should handle patient with null name and notes gracefully', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        name: null,
        notes: null,
        medicalHistory: [],
        familyHistory: [],
      });

      const result = await service.exportPatientPdf(doctorId, patientId);

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
