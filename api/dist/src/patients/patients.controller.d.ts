import { StreamableFile } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto, CreatePatientHistoryDto, CreateFamilyHistoryDto, ImportCsvResponseDto, UpdatePatientNotesDto } from './dtos';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { JwtUser } from 'src/auth/classes/jwt-user.class';
import { MultipartFile } from 'src/common/classes/multipart-file.class';
export declare class PatientsController {
    private readonly patientsService;
    constructor(patientsService: PatientsService);
    createPatient(user: JwtUser, createPatientDto: CreatePatientDto): Promise<Patient>;
    getMyPatients(user: JwtUser): Promise<Patient[]>;
    exportCsv(user: JwtUser): Promise<string>;
    exportPatientPdf(user: JwtUser, patientId: string): Promise<StreamableFile>;
    importCsv(user: JwtUser, file: MultipartFile): Promise<ImportCsvResponseDto>;
    getPatient(user: JwtUser, patientId: string): Promise<Patient>;
    updatePatientNotes(user: JwtUser, patientId: string, body: UpdatePatientNotesDto): Promise<Patient>;
    deletePatient(user: JwtUser, patientId: string): Promise<void>;
    addPatientHistory(user: JwtUser, patientId: string, createHistoryDto: CreatePatientHistoryDto): Promise<PatientHistory>;
    getPatientHistory(user: JwtUser, patientId: string): Promise<PatientHistory[]>;
    addFamilyHistory(user: JwtUser, patientId: string, createFamilyHistoryDto: CreateFamilyHistoryDto): Promise<FamilyHistory>;
    getPatientFamilyHistory(user: JwtUser, patientId: string): Promise<FamilyHistory[]>;
}
