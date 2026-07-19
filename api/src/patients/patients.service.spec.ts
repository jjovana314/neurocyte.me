import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { EdssAssesment } from './entities/edss-assesment.entity';
import { User } from 'src/auth/entites/user.entity';
import { PinoLogger } from 'nestjs-pino';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

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

  const mockEdssAssessmentRepository = {
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
        {
          provide: getRepositoryToken(EdssAssesment),
          useValue: mockEdssAssessmentRepository,
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
    const createPatientDto = {
      notes: 'Test patient',
      name: 'Test Name',
      gender: 'F',
      dateOfBirth: '24.01.1999.',
    };
    const mockDoctor = { id: doctorId, role: { id: 1, name: 'Doctor' } } as any;
    const mockPatient = { id: 1, doctorId, ...createPatientDto } as any;

    mockUserRepository.findOne.mockResolvedValue(mockDoctor);
    mockPatientRepository.save.mockResolvedValue(mockPatient);

    const result = await service.createPatient(doctorId, createPatientDto);
    expect(result).toEqual(mockPatient);
  });

  describe('addEdssAssessment', () => {
    const doctorId = 1;
    const patientId = 5;
    const validDto = {
      patientId,
      pyramidalSystem: 3,
      cerebellarSystem: 0,
      brainstemSystem: 0,
      sensorySystem: 0,
      bowelBladderSystem: 0,
      visualSystem: 0,
      mentalSystem: 0,
    };

    it('should derive totalScore server-side and persist the assessment', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockEdssAssessmentRepository.save.mockImplementation((a) =>
        Promise.resolve({ id: 1, ...a }),
      );

      const result = await service.addEdssAssessment(doctorId, validDto);

      expect(result.totalScore).toBe(3.0);
      expect(mockEdssAssessmentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addEdssAssessment(doctorId, validDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.addEdssAssessment(doctorId, validDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when a FSS grade is out of bounds', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });

      await expect(
        service.addEdssAssessment(doctorId, {
          ...validDto,
          pyramidalSystem: 7,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should let ambulation impairment override a low FSS-derived score', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockEdssAssessmentRepository.save.mockImplementation((a) =>
        Promise.resolve({ id: 1, ...a }),
      );

      const result = await service.addEdssAssessment(doctorId, {
        ...validDto,
        pyramidalSystem: 1,
        requiresBilateralAid: true,
      });

      expect(result.totalScore).toBe(6.5);
    });
  });

  describe('getPatientEdssAssessments', () => {
    const doctorId = 1;
    const patientId = 5;

    it('should return the assessment history ordered by most recent', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      const mockAssessments = [{ id: 1, totalScore: 2.0 }];
      mockEdssAssessmentRepository.find.mockResolvedValue(mockAssessments);

      const result = await service.getPatientEdssAssessments(
        doctorId,
        patientId,
      );

      expect(result).toEqual(mockAssessments);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPatientEdssAssessments(doctorId, patientId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.getPatientEdssAssessments(doctorId, patientId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('exportPatientPdf', () => {
    const doctorId = 1;
    const patientId = 10;

    const mockDoctor = {
      id: doctorId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@hospital.com',
      role: { name: 'Doctor' },
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

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        'Doctor',
      );

      expect(result).toBeInstanceOf(Buffer);
      // PDF files start with the %PDF magic bytes
      expect(result.slice(0, 4).toString()).toBe('%PDF');
    });

    it('should throw NotFoundException when doctor does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.exportPatientPdf(doctorId, patientId, 'Doctor'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.exportPatientPdf(doctorId, patientId, 'Doctor'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        doctorId: 999,
      });

      await expect(
        service.exportPatientPdf(doctorId, patientId, 'Doctor'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle patient with no medical or family history', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.findOne.mockResolvedValue({
        ...mockPatient,
        medicalHistory: [],
        familyHistory: [],
      });

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        'Doctor',
      );

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

      const result = await service.exportPatientPdf(
        doctorId,
        patientId,
        'Doctor',
      );

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
