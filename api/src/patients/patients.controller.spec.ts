import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { UserService } from 'src/user/user.service';
import { JwtUser, JwtUserRole } from 'src/auth/classes/jwt-user.class';
import { MultipartFile } from 'src/common/multipart-file';

describe('PatientsController', () => {
  let controller: PatientsController;

  const mockPatientsService = {
    createPatient: jest.fn(),
    getDoctorPatients: jest.fn(),
    exportPatientDataCsv: jest.fn(),
    exportPatientPdf: jest.fn(),
    importCsvData: jest.fn(),
    getPatient: jest.fn(),
    updatePatientNotes: jest.fn(),
    deletePatient: jest.fn(),
    addPatientHistory: jest.fn(),
    getPatientMedicalHistory: jest.fn(),
    addFamilyHistory: jest.fn(),
    getPatientFamilyHistory: jest.fn(),
    getPatientEdssAssessments: jest.fn(),
    addMigraineLog: jest.fn(),
    getPatientMigraineLogs: jest.fn(),
    addSeizureLog: jest.fn(),
    getPatientSeizureLogs: jest.fn(),
    addNcsStudy: jest.fn(),
    getPatientNcsStudies: jest.fn(),
  };

  const mockUserService = {
    findUserById: jest.fn(),
  };

  const mockUser: JwtUser = Object.assign(new JwtUser(), {
    id: 1,
    email: 'doctor@test.com',
    role: Object.assign(new JwtUserRole(), { id: 1, name: 'Doctor' }),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUserService.findUserById.mockResolvedValue({
      id: 1,
      email: 'doctor@test.com',
      role: { id: 1, name: 'Doctor' },
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: PatientsService, useValue: mockPatientsService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPatient', () => {
    it('should call patientsService.createPatient with user id and dto', async () => {
      const dto = {
        notes: 'Test patient',
        name: 'Test Name',
        gender: 'F',
        dateOfBirth: '24.01.1999.',
      };
      const mockPatient = { id: 1, doctorId: 1, ...dto } as any;
      mockPatientsService.createPatient.mockResolvedValue(mockPatient);

      const result = await controller.createPatient(mockUser, dto);

      expect(mockPatientsService.createPatient).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(mockPatient);
    });

    it('should forward an edss payload through to the service unchanged', async () => {
      const dto = {
        notes: 'Test patient',
        name: 'Test Name',
        gender: 'F',
        dateOfBirth: '24.01.1999.',
        edss: {
          pyramidalSystem: 2,
          cerebellarSystem: 0,
          brainstemSystem: 0,
          sensorySystem: 0,
          bowelBladderSystem: 0,
          visualSystem: 0,
          mentalSystem: 0,
        },
      };
      const mockPatient = { id: 1, doctorId: 1, ...dto } as any;
      mockPatientsService.createPatient.mockResolvedValue(mockPatient);

      const result = await controller.createPatient(mockUser, dto);

      expect(mockPatientsService.createPatient).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(mockPatient);
    });

    it('should propagate BadRequestException thrown by the service for an invalid edss payload', async () => {
      mockPatientsService.createPatient.mockRejectedValue(
        new BadRequestException(
          'pyramidalSystem must be an integer between 0 and 6',
        ),
      );

      await expect(
        controller.createPatient(mockUser, {
          notes: 'Test patient',
          name: 'Test Name',
          gender: 'F',
          dateOfBirth: '24.01.1999.',
          edss: { pyramidalSystem: 99 },
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMyPatients', () => {
    it('should call patientsService.getDoctorPatients with user id', async () => {
      const mockPatients = [{ id: 1 }, { id: 2 }] as any[];
      mockPatientsService.getDoctorPatients.mockResolvedValue(mockPatients);

      const result = await controller.getMyPatients(mockUser);

      expect(mockPatientsService.getDoctorPatients).toHaveBeenCalledWith(
        1,
        'Doctor',
      );
      expect(result).toBe(mockPatients);
    });
  });

  describe('exportCsv', () => {
    it('should call patientsService.exportPatientDataCsv with user id and role name', async () => {
      mockPatientsService.exportPatientDataCsv.mockResolvedValue('csv-content');

      const result = await controller.exportCsv(mockUser);

      expect(mockPatientsService.exportPatientDataCsv).toHaveBeenCalledWith(
        1,
        'Doctor',
      );
      expect(result).toBe('csv-content');
    });
  });

  describe('importCsv', () => {
    it('should call patientsService.importCsvData with user id and file buffer', async () => {
      const buffer = Buffer.from('col1,col2\nval1,val2');
      const file = Object.assign(new MultipartFile(), {
        fieldname: 'file',
        originalname: 'patients.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer,
        size: buffer.length,
      });
      const mockResponse = { imported: 1, skipped: 0, errors: [] };
      mockPatientsService.importCsvData.mockResolvedValue(mockResponse);

      const result = await controller.importCsv(mockUser, file);

      expect(mockPatientsService.importCsvData).toHaveBeenCalledWith(1, buffer);
      expect(result).toBe(mockResponse);
    });
  });

  describe('getPatient', () => {
    it('should call patientsService.getPatient with user id and parsed patient id', async () => {
      const mockPatient = { id: 5 } as any;
      mockPatientsService.getPatient.mockResolvedValue(mockPatient);

      const result = await controller.getPatient(mockUser, '5');

      expect(mockPatientsService.getPatient).toHaveBeenCalledWith(1, 5);
      expect(result).toBe(mockPatient);
    });
  });

  describe('updatePatientNotes', () => {
    it('should call patientsService.updatePatientNotes with user id, patient id and body', async () => {
      const body = { notes: 'Updated' };
      const mockPatient = { id: 5, notes: 'Updated' } as any;
      mockPatientsService.updatePatientNotes.mockResolvedValue(mockPatient);

      const result = await controller.updatePatientNotes(mockUser, '5', body);

      expect(mockPatientsService.updatePatientNotes).toHaveBeenCalledWith(
        1,
        5,
        body,
      );
      expect(result).toBe(mockPatient);
    });

    it('should forward an edss payload through to the service unchanged', async () => {
      const body = {
        notes: 'Updated',
        edss: {
          pyramidalSystem: 2,
          cerebellarSystem: 0,
          brainstemSystem: 0,
          sensorySystem: 0,
          bowelBladderSystem: 0,
          visualSystem: 0,
          mentalSystem: 0,
        },
      };
      const mockPatient = { id: 5, notes: 'Updated' } as any;
      mockPatientsService.updatePatientNotes.mockResolvedValue(mockPatient);

      const result = await controller.updatePatientNotes(mockUser, '5', body);

      expect(mockPatientsService.updatePatientNotes).toHaveBeenCalledWith(
        1,
        5,
        body,
      );
      expect(result).toBe(mockPatient);
    });

    it('should propagate BadRequestException thrown by the service for an invalid edss payload', async () => {
      mockPatientsService.updatePatientNotes.mockRejectedValue(
        new BadRequestException(
          'pyramidalSystem must be an integer between 0 and 6',
        ),
      );

      await expect(
        controller.updatePatientNotes(mockUser, '5', {
          notes: 'Updated',
          edss: { pyramidalSystem: 99 },
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deletePatient', () => {
    it('should call patientsService.deletePatient with user id and patient id', async () => {
      mockPatientsService.deletePatient.mockResolvedValue(undefined);

      await controller.deletePatient(mockUser, '5');

      expect(mockPatientsService.deletePatient).toHaveBeenCalledWith(1, 5);
    });
  });

  describe('addPatientHistory', () => {
    it('should call patientsService.addPatientHistory with user id and dto', async () => {
      const dto = { disorder: 'Epilepsy', patientId: 0 } as any;
      const mockHistory = { id: 1, patientId: 5, disorder: 'Epilepsy' } as any;
      mockPatientsService.addPatientHistory.mockResolvedValue(mockHistory);

      const result = await controller.addPatientHistory(mockUser, '5', dto);

      expect(mockPatientsService.addPatientHistory).toHaveBeenCalledWith(1, {
        ...dto,
        patientId: 5,
      });
      expect(result).toBe(mockHistory);
    });
  });

  describe('getPatientHistory', () => {
    it('should call patientsService.getPatientMedicalHistory with user id and patient id', async () => {
      const mockHistory = [{ id: 1 }] as any[];
      mockPatientsService.getPatientMedicalHistory.mockResolvedValue(
        mockHistory,
      );

      const result = await controller.getPatientHistory(mockUser, '5');

      expect(mockPatientsService.getPatientMedicalHistory).toHaveBeenCalledWith(
        1,
        5,
      );
      expect(result).toBe(mockHistory);
    });
  });

  describe('addFamilyHistory', () => {
    it('should call patientsService.addFamilyHistory with user id and dto', async () => {
      const dto = {
        diseaseType: 'Alzheimer',
        relation: 'Mother',
        patientId: 0,
      } as any;
      const mockFamilyHistory = { id: 1, patientId: 5 } as any;
      mockPatientsService.addFamilyHistory.mockResolvedValue(mockFamilyHistory);

      const result = await controller.addFamilyHistory(mockUser, '5', dto);

      expect(mockPatientsService.addFamilyHistory).toHaveBeenCalledWith(1, {
        ...dto,
        patientId: 5,
      });
      expect(result).toBe(mockFamilyHistory);
    });
  });

  describe('getPatientFamilyHistory', () => {
    it('should call patientsService.getPatientFamilyHistory with user id and patient id', async () => {
      const mockFamilyHistory = [{ id: 1 }] as any[];
      mockPatientsService.getPatientFamilyHistory.mockResolvedValue(
        mockFamilyHistory,
      );

      const result = await controller.getPatientFamilyHistory(mockUser, '5');

      expect(mockPatientsService.getPatientFamilyHistory).toHaveBeenCalledWith(
        1,
        5,
      );
      expect(result).toBe(mockFamilyHistory);
    });
  });

  describe('getPatientEdssAssessments', () => {
    it('should call patientsService.getPatientEdssAssessments with user id and patient id', async () => {
      const mockAssessments = [{ id: 1, totalScore: 2.0 }] as any[];
      mockPatientsService.getPatientEdssAssessments.mockResolvedValue(
        mockAssessments,
      );

      const result = await controller.getPatientEdssAssessments(mockUser, '5');

      expect(
        mockPatientsService.getPatientEdssAssessments,
      ).toHaveBeenCalledWith(1, 5);
      expect(result).toBe(mockAssessments);
    });

    it('should return an empty array when the patient has no assessments yet', async () => {
      mockPatientsService.getPatientEdssAssessments.mockResolvedValue([]);

      const result = await controller.getPatientEdssAssessments(mockUser, '5');

      expect(result).toEqual([]);
    });

    it('should propagate NotFoundException thrown by the service', async () => {
      mockPatientsService.getPatientEdssAssessments.mockRejectedValue(
        new NotFoundException('Patient with ID 5 not found'),
      );

      await expect(
        controller.getPatientEdssAssessments(mockUser, '5'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMigraineLog', () => {
    it('should call patientsService.addMigraineLog with user id and dto', async () => {
      const dto = {
        occurredAt: '2026-07-20T10:00:00Z',
        painSeverity: 7,
        patientId: 0,
      } as any;
      const mockLog = { id: 1, patientId: 5, painSeverity: 7 } as any;
      mockPatientsService.addMigraineLog.mockResolvedValue(mockLog);

      const result = await controller.addMigraineLog(mockUser, '5', dto);

      expect(mockPatientsService.addMigraineLog).toHaveBeenCalledWith(1, {
        ...dto,
        patientId: 5,
      });
      expect(result).toBe(mockLog);
    });

    it('should propagate BadRequestException thrown by the service for an invalid payload', async () => {
      mockPatientsService.addMigraineLog.mockRejectedValue(
        new BadRequestException(
          'Pain severity is required and must be an integer between 1 and 10',
        ),
      );

      await expect(
        controller.addMigraineLog(mockUser, '5', {
          occurredAt: '2026-07-20T10:00:00Z',
          painSeverity: 99,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPatientMigraineLogs', () => {
    it('should call patientsService.getPatientMigraineLogs with user id and patient id', async () => {
      const mockLogs = [{ id: 1, painSeverity: 6 }] as any[];
      mockPatientsService.getPatientMigraineLogs.mockResolvedValue(mockLogs);

      const result = await controller.getPatientMigraineLogs(mockUser, '5');

      expect(mockPatientsService.getPatientMigraineLogs).toHaveBeenCalledWith(
        1,
        5,
      );
      expect(result).toBe(mockLogs);
    });

    it('should return an empty array when the patient has no migraine logs yet', async () => {
      mockPatientsService.getPatientMigraineLogs.mockResolvedValue([]);

      const result = await controller.getPatientMigraineLogs(mockUser, '5');

      expect(result).toEqual([]);
    });
  });

  describe('addSeizureLog', () => {
    it('should call patientsService.addSeizureLog with user id and dto', async () => {
      const dto = {
        onsetVector: 'GENERALIZED',
        ictusStart: '2026-07-20T10:00:00Z',
        ictusEnd: '2026-07-20T10:02:00Z',
        patientId: 0,
      } as any;
      const mockLog = {
        id: 1,
        patientId: 5,
        onsetVector: 'GENERALIZED',
      } as any;
      mockPatientsService.addSeizureLog.mockResolvedValue(mockLog);

      const result = await controller.addSeizureLog(mockUser, '5', dto);

      expect(mockPatientsService.addSeizureLog).toHaveBeenCalledWith(1, {
        ...dto,
        patientId: 5,
      });
      expect(result).toBe(mockLog);
    });

    it('should propagate BadRequestException thrown by the service for an invalid payload', async () => {
      mockPatientsService.addSeizureLog.mockRejectedValue(
        new BadRequestException('ictusEnd must not be before ictusStart'),
      );

      await expect(
        controller.addSeizureLog(mockUser, '5', {
          onsetVector: 'GENERALIZED',
          ictusStart: '2026-07-20T10:02:00Z',
          ictusEnd: '2026-07-20T10:00:00Z',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPatientSeizureLogs', () => {
    it('should call patientsService.getPatientSeizureLogs with user id and patient id', async () => {
      const mockLogs = [{ id: 1, onsetVector: 'GENERALIZED' }] as any[];
      mockPatientsService.getPatientSeizureLogs.mockResolvedValue(mockLogs);

      const result = await controller.getPatientSeizureLogs(mockUser, '5');

      expect(mockPatientsService.getPatientSeizureLogs).toHaveBeenCalledWith(
        1,
        5,
      );
      expect(result).toBe(mockLogs);
    });

    it('should return an empty array when the patient has no seizure logs yet', async () => {
      mockPatientsService.getPatientSeizureLogs.mockResolvedValue([]);

      const result = await controller.getPatientSeizureLogs(mockUser, '5');

      expect(result).toEqual([]);
    });
  });

  describe('addNcsStudy', () => {
    it('should call patientsService.addNcsStudy with user id and dto', async () => {
      const dto = {
        nerveName: 'Median',
        studyType: 'MOTOR',
        distanceMm: 200,
        distalSite: { latencyMs: 3.2, amplitude: 8.5 },
        patientId: 0,
      } as any;
      const mockStudy = {
        id: 1,
        patientId: 5,
        nerveName: 'Median',
      } as any;
      mockPatientsService.addNcsStudy.mockResolvedValue(mockStudy);

      const result = await controller.addNcsStudy(mockUser, '5', dto);

      expect(mockPatientsService.addNcsStudy).toHaveBeenCalledWith(1, {
        ...dto,
        patientId: 5,
      });
      expect(result).toBe(mockStudy);
    });

    it('should propagate BadRequestException thrown by the service for an invalid payload', async () => {
      mockPatientsService.addNcsStudy.mockRejectedValue(
        new BadRequestException(
          'Conduction distance_mm must be strictly positive.',
        ),
      );

      await expect(
        controller.addNcsStudy(mockUser, '5', {
          nerveName: 'Median',
          studyType: 'MOTOR',
          distanceMm: -1,
          distalSite: { latencyMs: 3.2, amplitude: 8.5 },
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPatientNcsStudies', () => {
    it('should call patientsService.getPatientNcsStudies with user id and patient id', async () => {
      const mockStudies = [{ id: 1, nerveName: 'Median' }] as any[];
      mockPatientsService.getPatientNcsStudies.mockResolvedValue(mockStudies);

      const result = await controller.getPatientNcsStudies(mockUser, '5');

      expect(mockPatientsService.getPatientNcsStudies).toHaveBeenCalledWith(
        1,
        5,
      );
      expect(result).toBe(mockStudies);
    });

    it('should return an empty array when the patient has no NCS studies yet', async () => {
      mockPatientsService.getPatientNcsStudies.mockResolvedValue([]);

      const result = await controller.getPatientNcsStudies(mockUser, '5');

      expect(result).toEqual([]);
    });
  });

  describe('exportPatientPdf', () => {
    it('should call patientsService.exportPatientPdf with user id and parsed patient id', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake-pdf-content');
      mockPatientsService.exportPatientPdf.mockResolvedValue(pdfBuffer);

      const result = await controller.exportPatientPdf(mockUser, '10');

      expect(mockPatientsService.exportPatientPdf).toHaveBeenCalledWith(
        1,
        10,
        'Doctor',
      );
      // StreamableFile wraps the buffer
      expect(result).toBeDefined();
    });

    it('should return a StreamableFile instance', async () => {
      const { StreamableFile } = await import('@nestjs/common');
      const pdfBuffer = Buffer.from('%PDF-1.4 fake-pdf-content');
      mockPatientsService.exportPatientPdf.mockResolvedValue(pdfBuffer);

      const result = await controller.exportPatientPdf(mockUser, '10');

      expect(result).toBeInstanceOf(StreamableFile);
    });
  });
});
