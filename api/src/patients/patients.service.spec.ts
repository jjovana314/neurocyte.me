import { Test, TestingModule } from '@nestjs/testing';
import { Brackets } from 'typeorm';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory, DiseaseType } from './entities/family-history.entity';
import { EdssAssesment } from './entities/edss-assesment.entity';
import { MigraineLog } from './entities/migraine-log.entity';
import { SeizureLog } from './entities/seizure-log.entity';
import {
  OnsetVector,
  MotorFeature,
  SeizureTrigger,
} from './enums/seizureEnums';
import { NcsStudy, NcsStudyType } from './entities/ncs-study.entity';
import { TouretteSyndrome } from './entities/tourette-syndrome.entity';
import { TycType } from './enums/touretteTycType';
import { TouretteTrigger } from './enums/touretteTrigger';
import { User } from 'src/user/entities/user.entity';
import { PinoLogger } from 'nestjs-pino';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { CALCULATOR_SERVICE_NAME } from 'src/calculator-client/generated/calculator';
import { RoleEnum } from 'src/auth/enums/role.enum';
import { MedicalRecordFactory } from './factories/medical-record.factory';
import { UserNotFoundException } from 'src/common/exceptions';

describe('PatientsService', () => {
  let service: PatientsService;

  const mockPatientRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
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

  const mockMigraineLogRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockSeizureLogRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockNcsStudyRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockTouretteSyndromeRepository = {
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

  // Stands in for the generated gRPC client's CalculatorService stub.
  // Scoring math lives entirely in calculator/edss_calculator.py now (tested
  // there, not here), so tests configure calculateEdss's emitted value/error
  // per case and only assert on PatientsService's orchestration - that it
  // sends the right request shape and persists whatever score comes back.
  const mockCalculatorServiceClient = {
    calculateEdss: jest.fn(),
    calculateNcs: jest.fn(),
  };

  const mockCalculatorClientGrpc = {
    getService: jest.fn().mockReturnValue(mockCalculatorServiceClient),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        MedicalRecordFactory,
        {
          provide: 'CALCULATOR_PACKAGE',
          useValue: mockCalculatorClientGrpc,
        },
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
        {
          provide: getRepositoryToken(MigraineLog),
          useValue: mockMigraineLogRepository,
        },
        {
          provide: getRepositoryToken(SeizureLog),
          useValue: mockSeizureLogRepository,
        },
        {
          provide: getRepositoryToken(NcsStudy),
          useValue: mockNcsStudyRepository,
        },
        {
          provide: getRepositoryToken(TouretteSyndrome),
          useValue: mockTouretteSyndromeRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
    await module.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(mockCalculatorClientGrpc.getService).toHaveBeenCalledWith(
      CALCULATOR_SERVICE_NAME,
    );
  });

  describe('createPatient', () => {
    const doctorId = 1;
    const mockDoctor = {
      id: doctorId,
      role: { id: 1, name: RoleEnum.DOCTOR },
    } as any;
    const baseCreateDto = {
      notes: 'Test patient',
      name: 'Test Name',
      gender: 'F',
      dateOfBirth: '1999-01-24',
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
      mockMigraineLogRepository.save.mockImplementation((m) =>
        Promise.resolve({ id: 1, ...m }),
      );
      mockSeizureLogRepository.save.mockImplementation((s) =>
        Promise.resolve({ id: 1, ...s }),
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

    it('should throw BadRequestException when dateOfBirth is in the future', async () => {
      await expect(
        service.createPatient(doctorId, {
          ...baseCreateDto,
          dateOfBirth: '2099-01-01',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPatientRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when dateOfBirth is not a valid date', async () => {
      await expect(
        service.createPatient(doctorId, {
          ...baseCreateDto,
          dateOfBirth: 'not-a-date',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPatientRepository.save).not.toHaveBeenCalled();
    });

    it('should derive and persist an EDSS assessment linked to the new patient', async () => {
      mockCalculatorServiceClient.calculateEdss.mockReturnValueOnce(
        of({ totalScore: 3.0 }),
      );

      await service.createPatient(doctorId, {
        ...baseCreateDto,
        edss: { ...zeroEdss, pyramidalSystem: 3 },
      });

      expect(mockCalculatorServiceClient.calculateEdss).toHaveBeenCalledWith(
        expect.objectContaining({
          ...zeroEdss,
          pyramidalSystem: 3,
          requiresUnilateralAid: false,
          requiresBilateralAid: false,
          wheelchairBound: false,
        }),
      );
      expect(mockEdssAssessmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 42,
          pyramidalSystem: 3,
          totalScore: 3.0,
        }),
      );
    });

    it('should not create a migraine or seizure log when none is provided', async () => {
      await service.createPatient(doctorId, baseCreateDto);

      expect(mockMigraineLogRepository.save).not.toHaveBeenCalled();
      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should derive and persist a migraine log linked to the new patient', async () => {
      await service.createPatient(doctorId, {
        ...baseCreateDto,
        migraineLog: {
          occurredAt: '2026-07-20T10:00:00Z',
          painSeverity: 7,
        },
      });

      expect(mockMigraineLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ patientId: 42, painSeverity: 7 }),
      );
    });

    it('should reject an invalid migraine log and not create the patient at all', async () => {
      await expect(
        service.createPatient(doctorId, {
          ...baseCreateDto,
          migraineLog: {
            occurredAt: '2026-07-20T10:00:00Z',
            painSeverity: 99,
          },
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPatientRepository.save).not.toHaveBeenCalled();
      expect(mockMigraineLogRepository.save).not.toHaveBeenCalled();
    });

    it('should derive and persist a seizure log linked to the new patient', async () => {
      await service.createPatient(doctorId, {
        ...baseCreateDto,
        seizureLog: {
          onsetVector: OnsetVector.GENERALIZED,
          ictusStart: '2026-07-20T10:00:00Z',
          ictusEnd: '2026-07-20T10:02:30Z',
        },
      });

      expect(mockSeizureLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: 42,
          onsetVector: OnsetVector.GENERALIZED,
          ictusDurationSeconds: 150,
        }),
      );
    });

    it('should reject an invalid seizure log and not create the patient at all', async () => {
      await expect(
        service.createPatient(doctorId, {
          ...baseCreateDto,
          seizureLog: {
            onsetVector: OnsetVector.GENERALIZED,
            ictusStart: '2026-07-20T10:02:30Z',
            ictusEnd: '2026-07-20T10:00:00Z',
          },
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPatientRepository.save).not.toHaveBeenCalled();
      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should create patient, migraine log, and seizure log together in one call', async () => {
      const result = await service.createPatient(doctorId, {
        ...baseCreateDto,
        migraineLog: {
          occurredAt: '2026-07-20T10:00:00Z',
          painSeverity: 7,
        },
        seizureLog: {
          onsetVector: OnsetVector.FOCAL_AWARE,
          ictusStart: '2026-07-20T09:00:00Z',
          ictusEnd: '2026-07-20T09:01:00Z',
        },
      });

      expect(result).toEqual(expect.objectContaining({ id: 42 }));
      expect(mockMigraineLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ patientId: 42 }),
      );
      expect(mockSeizureLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ patientId: 42 }),
      );
    });

    it('should reject an invalid EDSS assessment and not create the patient at all', async () => {
      mockCalculatorServiceClient.calculateEdss.mockReturnValueOnce(
        throwError(() => ({
          code: GrpcStatus.INVALID_ARGUMENT,
          details: 'pyramidalSystem must be an integer between 0 and 6',
        })),
      );

      await expect(
        service.createPatient(doctorId, {
          ...baseCreateDto,
          edss: { ...zeroEdss, pyramidalSystem: 99 },
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockPatientRepository.save).not.toHaveBeenCalled();
      expect(mockEdssAssessmentRepository.save).not.toHaveBeenCalled();
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
      mockCalculatorServiceClient.calculateEdss.mockReturnValueOnce(
        of({ totalScore: 6.5 }),
      );

      await service.updatePatientNotes(doctorId, patientId, {
        notes: 'Updated',
        edss: { ...zeroEdss, requiresBilateralAid: true },
      });

      expect(mockEdssAssessmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ patientId, totalScore: 6.5 }),
      );
    });

    it('should reject an invalid EDSS assessment and not update the patient at all', async () => {
      mockCalculatorServiceClient.calculateEdss.mockReturnValueOnce(
        throwError(() => ({
          code: GrpcStatus.INVALID_ARGUMENT,
          details: 'pyramidalSystem must be an integer between 0 and 6',
        })),
      );

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

  describe('addMigraineLog', () => {
    const doctorId = 1;
    const patientId = 5;
    const baseDto = {
      patientId,
      occurredAt: '2026-07-20T10:00:00Z',
      painSeverity: 7,
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockMigraineLogRepository.save.mockImplementation((m) =>
        Promise.resolve({ id: 1, ...m }),
      );
    });

    it('should create a migraine log for a patient owned by the doctor', async () => {
      const result = await service.addMigraineLog(doctorId, baseDto);

      expect(mockMigraineLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ patientId, painSeverity: 7 }),
      );
      expect(result).toEqual(expect.objectContaining({ painSeverity: 7 }));
    });

    it('should apply default values for optional fields when omitted', async () => {
      await service.addMigraineLog(doctorId, baseDto);

      expect(mockMigraineLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          durationMinutes: null,
          auraPresent: false,
          triggers: '',
          symptoms: '',
          medicationTaken: '',
          notes: '',
        }),
      );
    });

    it('should persist provided optional fields instead of defaults', async () => {
      const fullDto = {
        ...baseDto,
        durationMinutes: 45,
        auraPresent: true,
        triggers: 'lack of sleep',
        symptoms: 'nausea',
        medicationTaken: 'ibuprofen',
        notes: 'occurred after work',
      };

      await service.addMigraineLog(doctorId, fullDto);

      expect(mockMigraineLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...fullDto,
          occurredAt: new Date(fullDto.occurredAt),
        }),
      );
    });

    it.each([1, 10])(
      'should accept a boundary painSeverity of %s',
      async (painSeverity) => {
        await service.addMigraineLog(doctorId, { ...baseDto, painSeverity });

        expect(mockMigraineLogRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ painSeverity }),
        );
      },
    );

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.addMigraineLog(doctorId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(service.addMigraineLog(doctorId, baseDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when occurredAt is missing', async () => {
      await expect(
        service.addMigraineLog(doctorId, { ...baseDto, occurredAt: '' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockMigraineLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when occurredAt is not a valid date', async () => {
      await expect(
        service.addMigraineLog(doctorId, {
          ...baseDto,
          occurredAt: 'not-a-date',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockMigraineLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when occurredAt is in the future', async () => {
      await expect(
        service.addMigraineLog(doctorId, {
          ...baseDto,
          occurredAt: '2099-01-01T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockMigraineLogRepository.save).not.toHaveBeenCalled();
    });

    it.each([0, 11, 1.5, null, undefined])(
      'should throw BadRequestException for an out-of-range painSeverity of %s',
      async (painSeverity) => {
        await expect(
          service.addMigraineLog(doctorId, {
            ...baseDto,
            painSeverity: painSeverity as any,
          }),
        ).rejects.toThrow(BadRequestException);

        expect(mockMigraineLogRepository.save).not.toHaveBeenCalled();
      },
    );
  });

  describe('addFamilyHistory', () => {
    const doctorId = 1;
    const patientId = 5;
    const baseDto = {
      patientId,
      diseaseType: DiseaseType.PARKINSON,
      relation: 'Mother',
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockFamilyHistoryRepository.save.mockImplementation((f) =>
        Promise.resolve({ id: 1, ...f }),
      );
    });

    it('should create a family history record for a patient owned by the doctor', async () => {
      const result = await service.addFamilyHistory(doctorId, baseDto);

      expect(mockFamilyHistoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId,
          diseaseType: DiseaseType.PARKINSON,
          relation: 'Mother',
        }),
      );
      expect(result).toEqual(expect.objectContaining({ id: 1 }));
    });

    it('should apply default values for optional fields when omitted', async () => {
      await service.addFamilyHistory(doctorId, baseDto);

      expect(mockFamilyHistoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'moderate', notes: '' }),
      );
    });

    it('should persist provided optional fields instead of defaults', async () => {
      await service.addFamilyHistory(doctorId, {
        ...baseDto,
        severity: 'severe',
        notes: 'Diagnosed at 60',
      });

      expect(mockFamilyHistoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'severe',
          notes: 'Diagnosed at 60',
        }),
      );
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.addFamilyHistory(doctorId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFamilyHistoryRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(service.addFamilyHistory(doctorId, baseDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockFamilyHistoryRepository.save).not.toHaveBeenCalled();
    });

    it.each([
      ['diseaseType is missing', { diseaseType: undefined }],
      ['diseaseType is not a known disease', { diseaseType: 'Flu' }],
      ['relation is missing', { relation: '' }],
    ])('should throw BadRequestException when %s', async (_label, override) => {
      await expect(
        service.addFamilyHistory(doctorId, {
          ...baseDto,
          ...override,
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(mockFamilyHistoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getPatientMigraineLogs', () => {
    const doctorId = 1;
    const patientId = 5;

    it('should return the migraine log history ordered by most recent', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      const mockLogs = [{ id: 1, painSeverity: 6 }];
      mockMigraineLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getPatientMigraineLogs(doctorId, patientId);

      expect(result).toEqual(mockLogs);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPatientMigraineLogs(doctorId, patientId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.getPatientMigraineLogs(doctorId, patientId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addSeizureLog', () => {
    const doctorId = 1;
    const patientId = 5;
    const baseDto = {
      patientId,
      onsetVector: OnsetVector.GENERALIZED,
      ictusStart: '2026-07-20T10:00:00Z',
      ictusEnd: '2026-07-20T10:02:30Z',
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockSeizureLogRepository.save.mockImplementation((s) =>
        Promise.resolve({ id: 1, ...s }),
      );
    });

    it('should create a seizure log for a patient owned by the doctor', async () => {
      const result = await service.addSeizureLog(doctorId, baseDto);

      expect(mockSeizureLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId,
          onsetVector: OnsetVector.GENERALIZED,
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ onsetVector: OnsetVector.GENERALIZED }),
      );
    });

    it('should derive ictusDurationSeconds from ictusStart and ictusEnd', async () => {
      await service.addSeizureLog(doctorId, baseDto);

      expect(mockSeizureLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ ictusDurationSeconds: 150 }),
      );
    });

    it('should apply default values for optional fields when omitted', async () => {
      await service.addSeizureLog(doctorId, baseDto);

      expect(mockSeizureLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          motorFeatures: [],
          triggers: [],
          postictalDurationMinutes: null,
          notes: '',
        }),
      );
    });

    it('should persist provided motor features and triggers', async () => {
      const fullDto = {
        ...baseDto,
        motorFeatures: [MotorFeature.TONIC, MotorFeature.CLONIC],
        triggers: [SeizureTrigger.SLEEP_DEPRIVATION, SeizureTrigger.ILLNESS],
        postictalDurationMinutes: 20,
        notes: 'witnessed by spouse',
      };

      await service.addSeizureLog(doctorId, fullDto);

      expect(mockSeizureLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          motorFeatures: [MotorFeature.TONIC, MotorFeature.CLONIC],
          triggers: [SeizureTrigger.SLEEP_DEPRIVATION, SeizureTrigger.ILLNESS],
          postictalDurationMinutes: 20,
          notes: 'witnessed by spouse',
        }),
      );
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.addSeizureLog(doctorId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(service.addSeizureLog(doctorId, baseDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when onsetVector is missing or invalid', async () => {
      await expect(
        service.addSeizureLog(doctorId, {
          ...baseDto,
          onsetVector: 'NOT_A_REAL_VECTOR' as any,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when ictusStart or ictusEnd is missing', async () => {
      await expect(
        service.addSeizureLog(doctorId, { ...baseDto, ictusEnd: '' }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when ictusEnd is before ictusStart', async () => {
      await expect(
        service.addSeizureLog(doctorId, {
          ...baseDto,
          ictusStart: '2026-07-20T10:02:30Z',
          ictusEnd: '2026-07-20T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when ictusStart or ictusEnd is not a valid date', async () => {
      await expect(
        service.addSeizureLog(doctorId, {
          ...baseDto,
          ictusStart: 'not-a-date',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when ictusStart is in the future', async () => {
      await expect(
        service.addSeizureLog(doctorId, {
          ...baseDto,
          ictusStart: '2099-01-01T10:00:00Z',
          ictusEnd: '2099-01-01T10:02:30Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when ictusEnd is in the future', async () => {
      await expect(
        service.addSeizureLog(doctorId, {
          ...baseDto,
          ictusEnd: '2099-01-01T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for an unknown motor feature', async () => {
      await expect(
        service.addSeizureLog(doctorId, {
          ...baseDto,
          motorFeatures: ['NOT_A_FEATURE' as any],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for an unknown trigger', async () => {
      await expect(
        service.addSeizureLog(doctorId, {
          ...baseDto,
          triggers: ['NOT_A_TRIGGER' as any],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
    });

    it.each([-1, 1.5])(
      'should throw BadRequestException for an invalid postictalDurationMinutes of %s',
      async (postictalDurationMinutes) => {
        await expect(
          service.addSeizureLog(doctorId, {
            ...baseDto,
            postictalDurationMinutes,
          }),
        ).rejects.toThrow(BadRequestException);

        expect(mockSeizureLogRepository.save).not.toHaveBeenCalled();
      },
    );
  });

  describe('getPatientSeizureLogs', () => {
    const doctorId = 1;
    const patientId = 5;

    it('should return the seizure log history ordered by most recent ictus', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      const mockLogs = [{ id: 1, onsetVector: OnsetVector.GENERALIZED }];
      mockSeizureLogRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getPatientSeizureLogs(doctorId, patientId);

      expect(result).toEqual(mockLogs);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPatientSeizureLogs(doctorId, patientId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.getPatientSeizureLogs(doctorId, patientId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addNcsStudy', () => {
    const doctorId = 1;
    const patientId = 5;
    const baseDto = {
      patientId,
      nerveName: 'Median',
      studyType: NcsStudyType.MOTOR,
      distanceMm: 200,
      distalSite: { latencyMs: 3.2, amplitude: 8.5 },
    };
    const mockCalcResult = {
      nerveName: 'Median',
      conductionVelocityMPerS: 55.5,
      amplitudeDropPercent: 10,
      temporalDispersionPercent: 5,
      isNormal: true,
      axonalLoss: false,
      demyelination: false,
      conductionBlock: false,
      diagnosticSummary: 'Normal MOTOR conduction parameters for Median nerve.',
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockCalculatorServiceClient.calculateNcs.mockReturnValue(
        of(mockCalcResult),
      );
      mockNcsStudyRepository.save.mockImplementation((s) =>
        Promise.resolve({ id: 1, ...s }),
      );
    });

    it('should send the measurements to the calculator and persist the derived result', async () => {
      const result = await service.addNcsStudy(doctorId, baseDto);

      expect(mockCalculatorServiceClient.calculateNcs).toHaveBeenCalledWith(
        expect.objectContaining({
          nerveName: 'Median',
          studyType: 1, // GrpcStudyType.MOTOR
          distanceMm: 200,
          distalSite: { latencyMs: 3.2, amplitude: 8.5, durationMs: undefined },
        }),
      );
      expect(mockNcsStudyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId,
          nerveName: 'Median',
          conductionVelocityMPerS: 55.5,
          isNormal: true,
        }),
      );
      expect(result).toEqual(expect.objectContaining({ nerveName: 'Median' }));
    });

    it('should include the proximal site and skin temperature when provided', async () => {
      await service.addNcsStudy(doctorId, {
        ...baseDto,
        proximalSite: { latencyMs: 7.1, amplitude: 7.9, durationMs: 6 },
        skinTemperatureCelsius: 28,
      });

      expect(mockCalculatorServiceClient.calculateNcs).toHaveBeenCalledWith(
        expect.objectContaining({
          proximalSite: { latencyMs: 7.1, amplitude: 7.9, durationMs: 6 },
          skinTemperatureCelsius: 28,
        }),
      );
      expect(mockNcsStudyRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          proximalLatencyMs: 7.1,
          proximalAmplitude: 7.9,
          proximalDurationMs: 6,
          skinTemperatureCelsius: 28,
        }),
      );
    });

    it('should map SENSORY study type to the corresponding gRPC enum value', async () => {
      await service.addNcsStudy(doctorId, {
        ...baseDto,
        studyType: NcsStudyType.SENSORY,
      });

      expect(mockCalculatorServiceClient.calculateNcs).toHaveBeenCalledWith(
        expect.objectContaining({ studyType: 2 }), // GrpcStudyType.SENSORY
      );
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.addNcsStudy(doctorId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockNcsStudyRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(service.addNcsStudy(doctorId, baseDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should surface calculator INVALID_ARGUMENT errors as BadRequestException and not persist', async () => {
      mockCalculatorServiceClient.calculateNcs.mockReturnValueOnce(
        throwError(() => ({
          code: GrpcStatus.INVALID_ARGUMENT,
          details: 'Conduction distance_mm must be strictly positive.',
        })),
      );

      await expect(
        service.addNcsStudy(doctorId, { ...baseDto, distanceMm: -1 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockNcsStudyRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getPatientNcsStudies', () => {
    const doctorId = 1;
    const patientId = 5;

    it('should return the NCS study history ordered by most recent', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      const mockStudies = [{ id: 1, nerveName: 'Median' }];
      mockNcsStudyRepository.find.mockResolvedValue(mockStudies);

      const result = await service.getPatientNcsStudies(doctorId, patientId);

      expect(result).toEqual(mockStudies);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getPatientNcsStudies(doctorId, patientId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.getPatientNcsStudies(doctorId, patientId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('importNcsStudiesCsv', () => {
    const doctorId = 1;
    const patientId = 5;
    const header =
      'nerveName,studyType,distanceMm,distalLatencyMs,distalAmplitude,distalDurationMs,proximalLatencyMs,proximalAmplitude,proximalDurationMs,skinTemperatureCelsius';
    const mockCalcResult = {
      nerveName: 'Median',
      conductionVelocityMPerS: 55.5,
      amplitudeDropPercent: 10,
      temporalDispersionPercent: 5,
      isNormal: true,
      axonalLoss: false,
      demyelination: false,
      conductionBlock: false,
      diagnosticSummary: 'Normal MOTOR conduction parameters for Median nerve.',
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockCalculatorServiceClient.calculateNcs.mockReturnValue(
        of(mockCalcResult),
      );
      mockNcsStudyRepository.save.mockImplementation((s) =>
        Promise.resolve({ id: 1, ...s }),
      );
    });

    it('should import every valid row and report the count', async () => {
      const csv = Buffer.from(
        `${header}\nMedian,MOTOR,200,3.2,8.5,,,,,\nUlnar,SENSORY,140,2.1,15,,,,,`,
      );

      const result = await service.importNcsStudiesCsv(
        doctorId,
        patientId,
        csv,
      );

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);
      expect(mockNcsStudyRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should parse optional proximal site and skin temperature columns', async () => {
      const csv = Buffer.from(
        `${header}\nMedian,MOTOR,200,3.2,8.5,4,7.1,7.9,6,28`,
      );

      await service.importNcsStudiesCsv(doctorId, patientId, csv);

      expect(mockCalculatorServiceClient.calculateNcs).toHaveBeenCalledWith(
        expect.objectContaining({
          distalSite: { latencyMs: 3.2, amplitude: 8.5, durationMs: 4 },
          proximalSite: { latencyMs: 7.1, amplitude: 7.9, durationMs: 6 },
          skinTemperatureCelsius: 28,
        }),
      );
    });

    it('should skip rows missing required fields and record an error', async () => {
      const csv = Buffer.from(`${header}\n,MOTOR,200,3.2,8.5,,,,,`);

      const result = await service.importNcsStudiesCsv(
        doctorId,
        patientId,
        csv,
      );

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual([expect.objectContaining({ row: 2 })]);
      expect(mockNcsStudyRepository.save).not.toHaveBeenCalled();
    });

    it('should record calculator errors per row without aborting the import', async () => {
      mockCalculatorServiceClient.calculateNcs
        .mockReturnValueOnce(
          throwError(() => ({
            code: GrpcStatus.INVALID_ARGUMENT,
            details: 'Conduction distance_mm must be strictly positive.',
          })),
        )
        .mockReturnValueOnce(of(mockCalcResult));
      const csv = Buffer.from(
        `${header}\nMedian,MOTOR,-1,3.2,8.5,,,,,\nUlnar,SENSORY,140,2.1,15,,,,,`,
      );

      const result = await service.importNcsStudiesCsv(
        doctorId,
        patientId,
        csv,
      );

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual([expect.objectContaining({ row: 2 })]);
    });

    it('should report an error for an empty CSV file', async () => {
      const result = await service.importNcsStudiesCsv(
        doctorId,
        patientId,
        Buffer.from(header),
      );

      expect(result.imported).toBe(0);
      expect(result.errors).toEqual([expect.objectContaining({ row: 0 })]);
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.importNcsStudiesCsv(doctorId, patientId, Buffer.from(header)),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.importNcsStudiesCsv(doctorId, patientId, Buffer.from(header)),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPatient', () => {
    it('should request the migraineLogs and seizureLogs relations when fetching a patient', async () => {
      const doctorId = 1;
      const patientId = 5;
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
        migraineLogs: [{ id: 1, painSeverity: 7 }],
        seizureLogs: [{ id: 1, onsetVector: OnsetVector.GENERALIZED }],
      });

      const result = await service.getPatient(doctorId, patientId);

      expect(mockPatientRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['migraineLogs', 'seizureLogs']),
        }),
      );
      expect(result.migraineLogs).toEqual([{ id: 1, painSeverity: 7 }]);
      expect(result.seizureLogs).toEqual([
        { id: 1, onsetVector: OnsetVector.GENERALIZED },
      ]);
    });

    it('should throw NotFoundException when the patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.getPatient(1, 404)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException and log a warning when another doctor owns the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({ id: 5, doctorId: 2 });

      await expect(service.getPatient(1, 5)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Doctor 1 attempted to access patient 5'),
      );
    });
  });

  describe('findUserById', () => {
    it('should return the user with their role loaded', async () => {
      const user = { id: 3, firstName: 'Jane', role: { name: 'DOCTOR' } };
      mockUserRepository.findOne.mockResolvedValue(user);

      await expect(service.findUserById(3)).resolves.toBe(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 3 },
        relations: ['role'],
      });
    });

    it('should throw UserNotFoundException when the user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const promise = service.findUserById(99);
      await expect(promise).rejects.toThrow(UserNotFoundException);
      await expect(promise).rejects.toThrow('User with ID 99 not found');
    });
  });

  describe('findPatientRecords', () => {
    const patientId = 7;
    const medicalHistory = [{ id: 1, disorder: 'Epilepsy' }];
    const familyHistory = [{ id: 2, relation: 'Mother' }];
    const seizureLogs = [{ id: 3, onsetVector: OnsetVector.FOCAL_AWARE }];
    const touretteSyndrome = [{ id: 4, tycType: TycType.MOTOR_SIMPLE }];

    beforeEach(() => {
      mockPatientHistoryRepository.find.mockResolvedValue(medicalHistory);
      mockFamilyHistoryRepository.find.mockResolvedValue(familyHistory);
      mockSeizureLogRepository.find.mockResolvedValue(seizureLogs);
      mockTouretteSyndromeRepository.find.mockResolvedValue(touretteSyndrome);
    });

    it('should return every record type keyed by section', async () => {
      await expect(service.findPatientRecords(patientId)).resolves.toEqual({
        medicalHistory,
        familyHistory,
        seizureLogs,
        touretteSyndrome,
      });
    });

    it('should order history and tourette records by recordedAt, newest first', async () => {
      await service.findPatientRecords(patientId);

      const byRecordedAtDesc = {
        where: { patientId },
        order: { recordedAt: 'DESC' },
      };
      expect(mockPatientHistoryRepository.find).toHaveBeenCalledWith(
        byRecordedAtDesc,
      );
      expect(mockFamilyHistoryRepository.find).toHaveBeenCalledWith(
        byRecordedAtDesc,
      );
      expect(mockTouretteSyndromeRepository.find).toHaveBeenCalledWith(
        byRecordedAtDesc,
      );
    });

    it('should order seizure logs by ictusStart, newest first', async () => {
      await service.findPatientRecords(patientId);

      expect(mockSeizureLogRepository.find).toHaveBeenCalledWith({
        where: { patientId },
        order: { ictusStart: 'DESC' },
      });
    });

    it('should return empty arrays when the patient has no records', async () => {
      mockPatientHistoryRepository.find.mockResolvedValue([]);
      mockFamilyHistoryRepository.find.mockResolvedValue([]);
      mockSeizureLogRepository.find.mockResolvedValue([]);
      mockTouretteSyndromeRepository.find.mockResolvedValue([]);

      await expect(service.findPatientRecords(patientId)).resolves.toEqual({
        medicalHistory: [],
        familyHistory: [],
        seizureLogs: [],
        touretteSyndrome: [],
      });
    });

    it('should reject when any repository query fails', async () => {
      mockSeizureLogRepository.find.mockRejectedValue(new Error('db down'));

      await expect(service.findPatientRecords(patientId)).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('search', () => {
    let mockQueryBuilder: {
      leftJoinAndSelect: jest.Mock;
      andWhere: jest.Mock;
      orderBy: jest.Mock;
      skip: jest.Mock;
      take: jest.Mock;
      getManyAndCount: jest.Mock;
    };

    const getBracketsWhereFactory = (): ((qb: any) => any) => {
      const call = mockQueryBuilder.andWhere.mock.calls.find(
        ([arg]) => arg instanceof Brackets,
      );
      expect(call).toBeDefined();
      return (call![0] as Brackets).whereFactory;
    };

    beforeEach(() => {
      mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      mockPatientRepository.createQueryBuilder = jest
        .fn()
        .mockReturnValue(mockQueryBuilder);
    });

    it('scopes results to the doctor unless the caller is a Support Engineer', async () => {
      await service.search(1, RoleEnum.DOCTOR, {});

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'patient.doctorId = :doctorId',
        { doctorId: 1 },
      );
    });

    it('does not scope by doctor for a Support Engineer', async () => {
      await service.search(1, RoleEnum.SUPPORT_ENGINEER, {});

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'patient.doctorId = :doctorId',
        expect.anything(),
      );
    });

    it('ORs the search term across name, email and phone', async () => {
      await service.search(1, RoleEnum.DOCTOR, { query: 'jane' });

      const whereFactory = getBracketsWhereFactory();
      const innerQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };
      whereFactory(innerQb);

      expect(innerQb.where).toHaveBeenCalledWith('patient.name LIKE :term', {
        term: '%jane%',
      });
      expect(innerQb.orWhere).toHaveBeenCalledWith('patient.email LIKE :term', {
        term: '%jane%',
      });
      expect(innerQb.orWhere).toHaveBeenCalledWith('patient.phone LIKE :term', {
        term: '%jane%',
      });
    });

    it('requires a record of every selected type (AND)', async () => {
      await service.search(1, RoleEnum.DOCTOR, {
        recordTypes: ['edssAssessments', 'migraineLogs', 'ncsStudies'],
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'edssAssessments.id IS NOT NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'migraineLogs.id IS NOT NULL',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'ncsStudies.id IS NOT NULL',
      );
    });

    it('combines the record type filter with the text search', async () => {
      await service.search(1, RoleEnum.DOCTOR, {
        query: 'jane',
        recordTypes: ['touretteSyndrom'],
      });

      getBracketsWhereFactory();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'touretteSyndrom.id IS NOT NULL',
      );
    });

    it('ignores duplicate record types', async () => {
      await service.search(1, RoleEnum.DOCTOR, {
        recordTypes: ['seizureLogs', 'seizureLogs'],
      });

      const seizureCalls = mockQueryBuilder.andWhere.mock.calls.filter(
        ([arg]) => arg === 'seizureLogs.id IS NOT NULL',
      );
      expect(seizureCalls).toHaveLength(1);
    });

    it('rejects unknown record types instead of interpolating them into SQL', async () => {
      await expect(
        service.search(1, RoleEnum.DOCTOR, {
          recordTypes: ['edssAssessments', 'patient.id = 1 OR 1'],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryBuilder.getManyAndCount).not.toHaveBeenCalled();
    });

    it('adds no record type filter when none are selected', async () => {
      await service.search(1, RoleEnum.DOCTOR, { recordTypes: [] });

      const recordTypeCalls = mockQueryBuilder.andWhere.mock.calls.filter(
        ([arg]) => typeof arg === 'string' && arg.endsWith('.id IS NOT NULL'),
      );
      expect(recordTypeCalls).toHaveLength(0);
    });

    it('also matches by id when the query term is numeric', async () => {
      await service.search(1, RoleEnum.DOCTOR, { query: '42' });

      const whereFactory = getBracketsWhereFactory();
      const innerQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };
      whereFactory(innerQb);

      expect(innerQb.orWhere).toHaveBeenCalledWith('patient.id = :id', {
        id: 42,
      });
    });

    it('does not add a search clause when no query term is given', async () => {
      await service.search(1, RoleEnum.DOCTOR, {});

      const bracketsCall = mockQueryBuilder.andWhere.mock.calls.find(
        ([arg]) => arg instanceof Brackets,
      );
      expect(bracketsCall).toBeUndefined();
    });

    it('paginates using defaults when no options are given', async () => {
      await service.search(1, RoleEnum.DOCTOR, {});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('applies the requested page and pageSize', async () => {
      await service.search(1, RoleEnum.DOCTOR, {
        options: { page: 3, pageSize: 10 } as any,
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('falls back to createdAt when the requested sort column is not allowlisted', async () => {
      await service.search(1, RoleEnum.DOCTOR, {
        options: { sortBy: 'notAColumn' } as any,
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'patient.createdAt',
        'DESC',
      );
    });

    it('sorts by the requested column and order when valid', async () => {
      await service.search(1, RoleEnum.DOCTOR, {
        options: { sortBy: 'name', order: 'ASC' } as any,
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'patient.name',
        'ASC',
      );
    });

    it('returns the patients and total count from the query', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[{ id: 7 }], 1]);

      const result = await service.search(1, RoleEnum.DOCTOR, {});

      expect(result).toEqual({ patients: [{ id: 7 }], total: 1 });
    });
  });

  describe('deletePatient', () => {
    const doctorId = 1;
    const patientId = 5;

    it('should delete the patient and cascade-delete their migraine and seizure logs', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });

      await service.deletePatient(doctorId, patientId);

      expect(mockMigraineLogRepository.delete).toHaveBeenCalledWith({
        patientId,
      });
      expect(mockSeizureLogRepository.delete).toHaveBeenCalledWith({
        patientId,
      });
      expect(mockPatientRepository.delete).toHaveBeenCalledWith({
        id: patientId,
      });
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePatient(doctorId, patientId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockMigraineLogRepository.delete).not.toHaveBeenCalled();
      expect(mockSeizureLogRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(service.deletePatient(doctorId, patientId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockMigraineLogRepository.delete).not.toHaveBeenCalled();
      expect(mockSeizureLogRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('createTouretteSyndrome', () => {
    const doctorId = 1;
    const patientId = 5;
    const baseDto = {
      tycType: TycType.MOTOR_COMPLEX,
      severityScale: 6,
      premonitoryUrgeLevel: 4,
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockTouretteSyndromeRepository.save.mockImplementation((t) =>
        Promise.resolve({ id: 1, ...t }),
      );
    });

    it('should create a tourette syndrome record linked to the patient', async () => {
      await service.createTouretteSyndrome(doctorId, patientId, baseDto);

      expect(mockTouretteSyndromeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId,
          tycType: TycType.MOTOR_COMPLEX,
          triggers: [],
        }),
      );
    });

    it('should persist provided triggers', async () => {
      await service.createTouretteSyndrome(doctorId, patientId, {
        ...baseDto,
        triggers: [TouretteTrigger.STRESS, TouretteTrigger.FATIGUE],
      });

      expect(mockTouretteSyndromeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          triggers: [TouretteTrigger.STRESS, TouretteTrigger.FATIGUE],
        }),
      );
    });

    it('should throw NotFoundException when patient does not exist', async () => {
      mockPatientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createTouretteSyndrome(doctorId, patientId, baseDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockTouretteSyndromeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when doctor does not own the patient', async () => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId: 999,
      });

      await expect(
        service.createTouretteSyndrome(doctorId, patientId, baseDto),
      ).rejects.toThrow(ForbiddenException);
      expect(mockTouretteSyndromeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when tycType is missing or invalid', async () => {
      await expect(
        service.createTouretteSyndrome(doctorId, patientId, {
          ...baseDto,
          tycType: undefined,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createTouretteSyndrome(doctorId, patientId, {
          ...baseDto,
          tycType: 'MOTOR' as TycType,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockTouretteSyndromeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for an unknown trigger', async () => {
      await expect(
        service.createTouretteSyndrome(doctorId, patientId, {
          ...baseDto,
          triggers: ['CAFFEINE' as TouretteTrigger],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockTouretteSyndromeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateTouretteSyndrome', () => {
    const doctorId = 1;
    const patientId = 5;
    const touretteId = 3;
    const existing = {
      id: touretteId,
      patientId,
      tycType: TycType.MOTOR_SIMPLE,
      severityScale: 4,
      premonitoryUrgeLevel: 2,
      triggers: [],
    };

    beforeEach(() => {
      mockPatientRepository.findOne.mockResolvedValue({
        id: patientId,
        doctorId,
      });
      mockTouretteSyndromeRepository.findOne.mockResolvedValue({ ...existing });
      mockTouretteSyndromeRepository.save.mockImplementation((t) =>
        Promise.resolve(t),
      );
    });

    it('should only look up the record within the given patient', async () => {
      await service.updateTouretteSyndrome(doctorId, patientId, touretteId, {
        severityScale: 7,
      });

      expect(mockTouretteSyndromeRepository.findOne).toHaveBeenCalledWith({
        where: { id: touretteId, patientId },
      });
    });

    it('should allow a partial update without tycType', async () => {
      await service.updateTouretteSyndrome(doctorId, patientId, touretteId, {
        severityScale: 7,
      });

      expect(mockTouretteSyndromeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tycType: TycType.MOTOR_SIMPLE,
          severityScale: 7,
        }),
      );
    });

    it('should throw NotFoundException when the record does not belong to the patient', async () => {
      mockTouretteSyndromeRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateTouretteSyndrome(doctorId, patientId, touretteId, {
          severityScale: 7,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(mockTouretteSyndromeRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for an invalid tycType', async () => {
      await expect(
        service.updateTouretteSyndrome(doctorId, patientId, touretteId, {
          tycType: 'MOTOR' as TycType,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockTouretteSyndromeRepository.save).not.toHaveBeenCalled();
    });
  });
});
