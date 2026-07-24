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

  describe('createPatient', () => {
    const doctorId = 1;
    const mockDoctor = { id: doctorId, role: { id: 1, name: 'Doctor' } } as any;
    const baseCreateDto = {
      notes: 'Test patient',
      name: 'Test Name',
      gender: 'F',
      dateOfBirth: '24.01.1999.',
    };
    const zeroEdss = {
      pyramidalSystem: 0,
      cerebellarSystem: 0,
      brainstemSystem: 0,
      sensorySystem: 0,
      bowelBladderSystem: 0,
      visualSystem: 0,
      mentalSystem: 0,
    };

    beforeEach(() => {
      mockUserRepository.findOne.mockResolvedValue(mockDoctor);
      mockPatientRepository.save.mockImplementation((p) =>
        Promise.resolve({ id: 42, ...p }),
      );
      mockEdssAssessmentRepository.save.mockImplementation((a) =>
        Promise.resolve({ id: 1, ...a }),
      );
    });

    it('should create patient when doctor is valid', async () => {
      const result = await service.createPatient(doctorId, baseCreateDto);
      expect(result).toEqual(
        expect.objectContaining({ notes: 'Test patient' }),
      );
    });

    it('should not create an EDSS assessment when none is provided', async () => {
      await service.createPatient(doctorId, baseCreateDto);

      expect(mockEdssAssessmentRepository.save).not.toHaveBeenCalled();
    });

    it('should derive and persist an EDSS assessment linked to the new patient', async () => {
      await service.createPatient(doctorId, {
        ...baseCreateDto,
        edss: { ...zeroEdss, pyramidalSystem: 3 },
      });

      expect(mockEdssAssessmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 42,
          pyramidalSystem: 3,
          totalScore: 3.0,
        }),
      );
    });

    it('should reject an invalid EDSS assessment and not create the patient at all', async () => {
      await expect(
        service.createPatient(doctorId, {
          ...baseCreateDto,
          edss: { ...zeroEdss, pyramidalSystem: 99 },
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPatientRepository.save).not.toHaveBeenCalled();
      expect(mockEdssAssessmentRepository.save).not.toHaveBeenCalled();
    });

    describe('EDSS scoring bands derived from FSS combinations (fully ambulatory)', () => {
      it.each([
        ['all FS at grade 0', {}, 0.0],
        ['a single FS at grade 1', { sensorySystem: 1 }, 1.0],
        ['two FS at grade 1', { sensorySystem: 1, visualSystem: 1 }, 1.5],
        ['a single FS at grade 2', { cerebellarSystem: 2 }, 2.0],
        ['two FS at grade 2', { cerebellarSystem: 2, sensorySystem: 2 }, 2.5],
        ['a single FS at grade 3', { pyramidalSystem: 3 }, 3.0],
        [
          'three FS at grade 2',
          { pyramidalSystem: 2, cerebellarSystem: 2, sensorySystem: 2 },
          3.0,
        ],
        ['two FS at grade 3', { pyramidalSystem: 3, cerebellarSystem: 3 }, 3.5],
        [
          'five FS at grade 2',
          {
            pyramidalSystem: 2,
            cerebellarSystem: 2,
            brainstemSystem: 2,
            sensorySystem: 2,
            bowelBladderSystem: 2,
          },
          3.5,
        ],
        [
          'three FS at grade 3',
          {
            pyramidalSystem: 3,
            cerebellarSystem: 3,
            brainstemSystem: 3,
          },
          4.0,
        ],
        ['a single FS at grade 4', { pyramidalSystem: 4 }, 4.0],
        ['two FS at grade 4', { pyramidalSystem: 4, cerebellarSystem: 4 }, 4.5],
      ])('should score %s as %s', async (_desc, overrides, expected) => {
        await service.createPatient(doctorId, {
          ...baseCreateDto,
          edss: { ...zeroEdss, ...overrides },
        });

        expect(mockEdssAssessmentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ totalScore: expected }),
        );
      });
    });

    describe('EDSS scoring bands derived from ambulation metrics', () => {
      it.each([
        [
          'unaided distance of 1000m (no impairment)',
          { unassistedWalkingDistanceMeters: 1000 },
          0.0,
        ],
        [
          'unaided distance just above the 500m threshold',
          { unassistedWalkingDistanceMeters: 501 },
          0.0,
        ],
        [
          'unaided distance of 500m',
          { unassistedWalkingDistanceMeters: 500 },
          4.0,
        ],
        [
          'unaided distance of 300m',
          { unassistedWalkingDistanceMeters: 300 },
          4.5,
        ],
        [
          'unaided distance of 200m',
          { unassistedWalkingDistanceMeters: 200 },
          5.0,
        ],
        [
          'unaided distance of 100m',
          { unassistedWalkingDistanceMeters: 100 },
          5.5,
        ],
        [
          'unaided distance of 20m',
          { unassistedWalkingDistanceMeters: 20 },
          5.5,
        ],
        ['requiring a unilateral aid', { requiresUnilateralAid: true }, 6.0],
        ['requiring a bilateral aid', { requiresBilateralAid: true }, 6.5],
        ['being wheelchair-bound', { wheelchairBound: true }, 7.0],
      ])('should score %s as %s', async (_desc, overrides, expected) => {
        await service.createPatient(doctorId, {
          ...baseCreateDto,
          edss: { ...zeroEdss, ...overrides },
        });

        expect(mockEdssAssessmentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ totalScore: expected }),
        );
      });

      it('should use the more severe of the FSS-derived and ambulation-derived scores', async () => {
        await service.createPatient(doctorId, {
          ...baseCreateDto,
          edss: { ...zeroEdss, mentalSystem: 2, wheelchairBound: true },
        });

        expect(mockEdssAssessmentRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ totalScore: 7.0 }),
        );
      });
    });
  });

  describe('updatePatientNotes', () => {
    const doctorId = 1;
    const patientId = 5;
    const zeroEdss = {
      pyramidalSystem: 0,
      cerebellarSystem: 0,
      brainstemSystem: 0,
      sensorySystem: 0,
      bowelBladderSystem: 0,
      visualSystem: 0,
      mentalSystem: 0,
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
        notes: 'old notes',
      });
      mockPatientRepository.save.mockImplementation((p) => Promise.resolve(p));
      mockEdssAssessmentRepository.save.mockImplementation((a) =>
        Promise.resolve({ id: 1, ...a }),
      );
    });

    it('should update notes without creating an EDSS assessment when none is provided', async () => {
      const result = await service.updatePatientNotes(doctorId, patientId, {
        notes: 'Updated',
      });

      expect(result.notes).toBe('Updated');
      expect(mockEdssAssessmentRepository.save).not.toHaveBeenCalled();
    });

    it('should derive and persist an EDSS assessment linked to the patient', async () => {
      await service.updatePatientNotes(doctorId, patientId, {
        notes: 'Updated',
        edss: { ...zeroEdss, requiresBilateralAid: true },
      });

      expect(mockEdssAssessmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ patientId, totalScore: 6.5 }),
      );
    });

    it('should reject an invalid EDSS assessment and not update the patient at all', async () => {
      await expect(
        service.updatePatientNotes(doctorId, patientId, {
          notes: 'Updated',
          edss: { ...zeroEdss, pyramidalSystem: 99 },
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPatientRepository.save).not.toHaveBeenCalled();
      expect(mockEdssAssessmentRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePatientNotes(doctorId, patientId, { notes: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.updatePatientNotes(doctorId, patientId, { notes: 'x' }),
      ).rejects.toThrow(ForbiddenException);
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
