import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { JwtUser, JwtUserRole } from 'src/auth/classes/jwt-user.class';
import { MultipartFile } from 'src/common/classes/multipart-file.class';

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
  };

  const mockUser: JwtUser = Object.assign(new JwtUser(), {
    id: 1,
    email: 'doctor@test.com',
    role: Object.assign(new JwtUserRole(), { id: 1, name: 'doctor' }),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [{ provide: PatientsService, useValue: mockPatientsService }],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPatient', () => {
    it('should call patientsService.createPatient with user id and dto', async () => {
      const dto = { notes: 'Test' };
      const mockPatient = { id: 1, doctorId: 1, ...dto } as any;
      mockPatientsService.createPatient.mockResolvedValue(mockPatient);

      const result = await controller.createPatient(mockUser, dto);

      expect(mockPatientsService.createPatient).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(mockPatient);
    });
  });

  describe('getMyPatients', () => {
    it('should call patientsService.getDoctorPatients with user id', async () => {
      const mockPatients = [{ id: 1 }, { id: 2 }] as any[];
      mockPatientsService.getDoctorPatients.mockResolvedValue(mockPatients);

      const result = await controller.getMyPatients(mockUser);

      expect(mockPatientsService.getDoctorPatients).toHaveBeenCalledWith(1);
      expect(result).toBe(mockPatients);
    });
  });

  describe('exportCsv', () => {
    it('should call patientsService.exportPatientDataCsv with user id', async () => {
      mockPatientsService.exportPatientDataCsv.mockResolvedValue('csv-content');

      const result = await controller.exportCsv(mockUser);

      expect(mockPatientsService.exportPatientDataCsv).toHaveBeenCalledWith(1);
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
    it('should call patientsService.updatePatientNotes with user id, patient id and notes', async () => {
      const mockPatient = { id: 5, notes: 'Updated' } as any;
      mockPatientsService.updatePatientNotes.mockResolvedValue(mockPatient);

      const result = await controller.updatePatientNotes(mockUser, '5', {
        notes: 'Updated',
      });

      expect(mockPatientsService.updatePatientNotes).toHaveBeenCalledWith(
        1,
        5,
        'Updated',
      );
      expect(result).toBe(mockPatient);
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

  describe('exportPatientPdf', () => {
    it('should call patientsService.exportPatientPdf with user id and parsed patient id', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake-pdf-content');
      mockPatientsService.exportPatientPdf.mockResolvedValue(pdfBuffer);

      const result = await controller.exportPatientPdf(mockUser, '10');

      expect(mockPatientsService.exportPatientPdf).toHaveBeenCalledWith(1, 10);
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
