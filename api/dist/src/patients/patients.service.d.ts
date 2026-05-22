import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { User } from 'src/auth/entites/user.entity';
import { CreatePatientDto, CreatePatientHistoryDto, CreateFamilyHistoryDto, ImportCsvResponseDto } from './dtos';
export declare class PatientsService {
    private patientRepository;
    private patientHistoryRepository;
    private familyHistoryRepository;
    private userRepository;
    private readonly logger;
    constructor(patientRepository: Repository<Patient>, patientHistoryRepository: Repository<PatientHistory>, familyHistoryRepository: Repository<FamilyHistory>, userRepository: Repository<User>, logger: PinoLogger);
    createPatient(doctorId: number, createPatientDto: CreatePatientDto): Promise<Patient>;
    addPatientHistory(doctorId: number, createHistoryDto: CreatePatientHistoryDto): Promise<PatientHistory>;
    addFamilyHistory(doctorId: number, createFamilyHistoryDto: CreateFamilyHistoryDto): Promise<FamilyHistory>;
    getPatient(doctorId: number, patientId: number): Promise<Patient>;
    getDoctorPatients(doctorId: number): Promise<Patient[]>;
    getPatientMedicalHistory(doctorId: number, patientId: number): Promise<PatientHistory[]>;
    getPatientFamilyHistory(doctorId: number, patientId: number): Promise<FamilyHistory[]>;
    updatePatientNotes(doctorId: number, patientId: number, notes: string): Promise<Patient>;
    deletePatient(doctorId: number, patientId: number): Promise<void>;
    exportPatientDataCsv(userId: number): Promise<string>;
    private checkCsvFieldOrEscape;
    exportPatientPdf(doctorId: number, patientId: number): Promise<Buffer>;
    importCsvData(doctorId: number, fileBuffer: Buffer): Promise<ImportCsvResponseDto>;
    private parseCsvLine;
}
