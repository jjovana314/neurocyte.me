import { Test, TestingModule } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import { PdfExportController } from './pdf-export.controller';
import { PatientPdfExportService } from './patient-pdf-export.service';
import { UserService } from 'src/user/user.service';
import { JwtUser, JwtUserRole } from 'src/auth/classes/jwt-user.class';
import { RoleEnum } from 'src/auth/enums/role.enum';

describe('PdfExportController', () => {
  let controller: PdfExportController;

  const mockPatientPdfExportService = {
    exportPatientPdf: jest.fn(),
  };

  // RolesGuard is resolved when the controller is instantiated.
  const mockUserService = {
    findUserById: jest.fn(),
  };

  const mockUser: JwtUser = Object.assign(new JwtUser(), {
    id: 1,
    email: 'doctor@test.com',
    role: Object.assign(new JwtUserRole(), { id: 1, name: RoleEnum.DOCTOR }),
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfExportController],
      providers: [
        {
          provide: PatientPdfExportService,
          useValue: mockPatientPdfExportService,
        },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<PdfExportController>(PdfExportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportPatientPdf', () => {
    it('should call patientPdfExportService.exportPatientPdf with user id, parsed patient id and role', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake-pdf-content');
      mockPatientPdfExportService.exportPatientPdf.mockResolvedValue(pdfBuffer);

      await controller.exportPatientPdf(mockUser, 10);

      expect(mockPatientPdfExportService.exportPatientPdf).toHaveBeenCalledWith(
        1,
        10,
        RoleEnum.DOCTOR,
      );
    });

    it('should return a StreamableFile instance', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake-pdf-content');
      mockPatientPdfExportService.exportPatientPdf.mockResolvedValue(pdfBuffer);

      const result = await controller.exportPatientPdf(mockUser, 10);

      expect(result).toBeInstanceOf(StreamableFile);
    });
  });
});
