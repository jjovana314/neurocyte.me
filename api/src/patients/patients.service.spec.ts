import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { EdssAssesment } from './entities/edss-assesment.entity';
import { MigraineLog } from './entities/migraine-log.entity';
import {
  SeizureLog,
  OnsetVector,
  MotorFeature,
  SeizureTrigger,
} from './entities/seizure-log.entity';
import { NcsStudy, NcsStudyType } from './entities/ncs-study.entity';
import { User } from 'src/auth/entites/user.entity';
import { PinoLogger } from 'nestjs-pino';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { CALCULATOR_SERVICE_NAME } from 'src/calculator-client/generated/calculator';

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
    const mockDoctor = { id: doctorId, role: { id: 1, name: 'Doctor' } } as any;
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
  });

  describe('getDoctorPatients', () => {
    it('should request the migraineLogs and seizureLogs relations for the doctor patient list', async () => {
      const doctorId = 1;
      mockPatientRepository.find.mockResolvedValue([
        {
          id: 5,
          doctorId,
          migraineLogs: [{ id: 1, painSeverity: 7 }],
          seizureLogs: [{ id: 1, onsetVector: OnsetVector.GENERALIZED }],
        },
      ]);

      const result = await service.getDoctorPatients(doctorId, 'Doctor');

      expect(mockPatientRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(['migraineLogs', 'seizureLogs']),
        }),
      );
      expect(result[0].migraineLogs).toEqual([{ id: 1, painSeverity: 7 }]);
      expect(result[0].seizureLogs).toEqual([
        { id: 1, onsetVector: OnsetVector.GENERALIZED },
      ]);
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
