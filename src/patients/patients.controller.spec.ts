import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

describe('PatientsController', () => {
  let controller: PatientsController;
  let patientsService: PatientsService;

  const mockPatientsService = {
    createPatient: jest.fn(),
    getDoctorPatients: jest.fn(),
    getPatient: jest.fn(),
    updatePatientNotes: jest.fn(),
    deletePatient: jest.fn(),
    addPatientHistory: jest.fn(),
    getPatientMedicalHistory: jest.fn(),
    addFamilyHistory: jest.fn(),
    getPatientFamilyHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: PatientsService, useValue: mockPatientsService },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    patientsService = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call patientsService.createPatient on createPatient', async () => {
    const req = { user: { id: 1 } };
    const createPatientDto = { notes: 'Test' };
    const mockPatient = { id: 1, doctorId: 1, ...createPatientDto } as any;

    mockPatientsService.createPatient.mockResolvedValue(mockPatient);
    await controller.createPatient(req, createPatientDto);

    expect(mockPatientsService.createPatient).toHaveBeenCalledWith(1, createPatientDto);
  });
});
