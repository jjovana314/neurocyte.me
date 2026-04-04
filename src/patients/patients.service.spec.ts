import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { User } from 'src/auth/entites/user.entity';
import { PinoLogger } from 'nestjs-pino';

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
        { provide: getRepositoryToken(Patient), useValue: mockPatientRepository },
        { provide: getRepositoryToken(PatientHistory), useValue: mockPatientHistoryRepository },
        { provide: getRepositoryToken(FamilyHistory), useValue: mockFamilyHistoryRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
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
});
