import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { errorHandler } from './decorators/validatieon-decorator';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory, DiseaseType } from './entities/family-history.entity';
import { User } from 'src/auth/entites/user.entity';
import {
  CreatePatientDto,
  CreatePatientHistoryDto,
  CreateFamilyHistoryDto,
  ImportCsvResponseDto,
} from './dtos';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private patientRepository: Repository<Patient>,
    @InjectRepository(PatientHistory)
    private patientHistoryRepository: Repository<PatientHistory>,
    @InjectRepository(FamilyHistory)
    private familyHistoryRepository: Repository<FamilyHistory>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly logger: PinoLogger,
  ) {}

  @errorHandler
  async createPatient(
    doctorId: number,
    createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    // Verify doctor exists and has appropriate role
    const doctor = await this.userRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }

    // Check if user is a doctor (role check)
    if (!doctor.role || doctor.role.name !== 'doctor') {
      this.logger.warn(
        `User ${doctorId} attempted to create patient without doctor role`,
      );
      throw new ForbiddenException('Only doctors can create patient records');
    }

    // Create new patient record without storing name
    const patient = new Patient();
    patient.doctorId = doctorId;
    patient.notes = createPatientDto.notes || '';

    const savedPatient = await this.patientRepository.save(patient);
    this.logger.info(
      `Patient record ${savedPatient.id} created by doctor ${doctorId}`,
    );

    return savedPatient;
  }

  @errorHandler
  async addPatientHistory(
    doctorId: number,
    createHistoryDto: CreatePatientHistoryDto,
  ): Promise<PatientHistory> {
    // Verify patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: createHistoryDto.patientId },
    });
    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createHistoryDto.patientId} not found`,
      );
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${createHistoryDto.patientId} created by doctor ${patient.doctorId}`,
      );
      throw new ForbiddenException(
        'You can only add history to patients you created',
      );
    }

    // errorHandler required fields
    if (!createHistoryDto.disorder) {
      throw new BadRequestException('Disorder field is required');
    }

    const history = new PatientHistory();
    history.patientId = createHistoryDto.patientId;
    history.disorder = createHistoryDto.disorder;
    history.description = createHistoryDto.description || '';
    history.diagnosisDate = createHistoryDto.diagnosisDate || null;
    history.severity = createHistoryDto.severity || 'moderate';
    history.medications = createHistoryDto.medications || '';

    const savedHistory = await this.patientHistoryRepository.save(history);
    this.logger.info(
      `History record added to patient ${createHistoryDto.patientId}: ${createHistoryDto.disorder}`,
    );

    return savedHistory;
  }

  @errorHandler
  async addFamilyHistory(
    doctorId: number,
    createFamilyHistoryDto: CreateFamilyHistoryDto,
  ): Promise<FamilyHistory> {
    // Verify patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: createFamilyHistoryDto.patientId },
    });
    if (!patient) {
      throw new NotFoundException(
        `Patient with ID ${createFamilyHistoryDto.patientId} not found`,
      );
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${createFamilyHistoryDto.patientId}`,
      );
      throw new ForbiddenException(
        'You can only add family history to patients you created',
      );
    }

    // errorHandler required fields
    if (!createFamilyHistoryDto.diseaseType) {
      throw new BadRequestException('Disease type is required');
    }
    if (!createFamilyHistoryDto.relation) {
      throw new BadRequestException(
        'Relation is required (e.g., Mother, Father, Sibling)',
      );
    }

    const familyHistory = new FamilyHistory();
    familyHistory.patientId = createFamilyHistoryDto.patientId;
    familyHistory.diseaseType = createFamilyHistoryDto.diseaseType;
    familyHistory.relation = createFamilyHistoryDto.relation;
    familyHistory.severity = createFamilyHistoryDto.severity || 'moderate';
    familyHistory.notes = createFamilyHistoryDto.notes || '';

    const savedFamilyHistory =
      await this.familyHistoryRepository.save(familyHistory);
    this.logger.info(
      `Family history added to patient ${createFamilyHistoryDto.patientId}: ${createFamilyHistoryDto.diseaseType}`,
    );

    return savedFamilyHistory;
  }

  @errorHandler
  async getPatient(doctorId: number, patientId: number): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['medicalHistory', 'familyHistory', 'doctor'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${patientId} created by doctor ${patient.doctorId}`,
      );
      throw new ForbiddenException('You can only view patients you created');
    }

    return patient;
  }

  @errorHandler
  async getDoctorPatients(doctorId: number): Promise<Patient[]> {
    const patients = await this.patientRepository.find({
      where: { doctorId },
      relations: ['medicalHistory', 'familyHistory'],
      order: { createdAt: 'DESC' },
    });

    this.logger.info(
      `Retrieved ${patients.length} patients for doctor ${doctorId}`,
    );
    return patients;
  }

  @errorHandler
  async getPatientMedicalHistory(
    doctorId: number,
    patientId: number,
  ): Promise<PatientHistory[]> {
    // Verify permissions first
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (patient.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only view history for patients you created',
      );
    }

    const history = await this.patientHistoryRepository.find({
      where: { patientId },
      order: { recordedAt: 'DESC' },
    });

    return history;
  }

  @errorHandler
  async getPatientFamilyHistory(
    doctorId: number,
    patientId: number,
  ): Promise<FamilyHistory[]> {
    // Verify permissions first
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (patient.doctorId !== doctorId) {
      throw new ForbiddenException(
        'You can only view family history for patients you created',
      );
    }

    const familyHistory = await this.familyHistoryRepository.find({
      where: { patientId },
      order: { recordedAt: 'DESC' },
    });

    return familyHistory;
  }

  @errorHandler
  async updatePatientNotes(
    doctorId: number,
    patientId: number,
    notes: string,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (patient.doctorId !== doctorId) {
      throw new ForbiddenException('You can only update patients you created');
    }

    patient.notes = notes;
    const updatedPatient = await this.patientRepository.save(patient);
    this.logger.info(
      `Patient ${patientId} notes updated by doctor ${doctorId}`,
    );

    return updatedPatient;
  }

  @errorHandler
  async deletePatient(doctorId: number, patientId: number): Promise<void> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (patient.doctorId !== doctorId) {
      throw new ForbiddenException('You can only delete patients you created');
    }

    // Delete associated histories (cascade handled by database, but explicit for clarity)
    await this.patientHistoryRepository.delete({ patientId });
    await this.familyHistoryRepository.delete({ patientId });
    await this.patientRepository.delete({ id: patientId });

    this.logger.info(`Patient ${patientId} deleted by doctor ${doctorId}`);
  }

  @errorHandler
  async exportPatientDataCsv(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const patients = await this.patientRepository.find({
      relations: ['medicalHistory', 'familyHistory'],
    });

    const csvHeader: string[] = [];
    csvHeader.push(
      [
        'Patient Notes',
        'Patient Created At',
        'Patient Updated At',
        'Disorder',
        'Disorder Description',
        'Diagnosis Date',
        'Severity',
        'Medications',
        'History Recorded At',
        'Family Disease Type',
        'Family Relation',
        'Family Severity',
        'Family Notes',
        'Family Recorded At',
      ].join(','),
    );

    for (const patient of patients) {
      const medicalRows = patient.medicalHistory ?? [];
      const familyRows = patient.familyHistory ?? [];
      const maxRows = Math.max(medicalRows.length, familyRows.length, 1);

      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const medicalRow = medicalRows[rowIndex];
        const familyRow = familyRows[rowIndex];

        const row = [
          rowIndex === 0 ? patient.notes : '',
          rowIndex === 0 ? patient.createdAt : '',
          rowIndex === 0 ? patient.updatedAt : '',
          medicalRow?.disorder ?? '',
          medicalRow?.description ?? '',
          medicalRow?.diagnosisDate ?? '',
          medicalRow?.severity ?? '',
          medicalRow?.medications ?? '',
          medicalRow?.recordedAt ?? '',
          familyRow?.diseaseType ?? '',
          familyRow?.relation ?? '',
          medicalRow?.severity ?? '',
          familyRow?.notes ?? '',
          medicalRow?.recordedAt ?? '',
        ].map((v) => this.checkCsvFieldOrEscape(v));
        csvHeader.push(row.join(','));
      }
    }

    this.logger.info(
      `Patient data exported to CSV by user ${userId} (role: ${user.role.name})`,
    );
    return [csvHeader.join(','), ...csvHeader].join('\n');
  }

  private checkCsvFieldOrEscape(value: string | Date): string {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async importCsvData(
    doctorId: number,
    fileBuffer: Buffer,
  ): Promise<ImportCsvResponseDto> {
    const lines = fileBuffer
      .toString('utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return {
        imported: 0,
        skipped: 0,
        errors: [{ row: 0, reason: 'CSV file is empty or has no data rows' }],
      };
    }

    // Skip header row
    const dataRows = lines.slice(1);
    const result = new ImportCsvResponseDto();
    result.imported = 0;
    result.skipped = 0;
    result.errors = [];

    let currentPatient: Patient | null = null;

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = i + 2; // 1-indexed; row 1 is the header
      const cols = this.parseCsvLine(dataRows[i]);

      const notes = cols[0] ?? '';
      const disorder = cols[3] ?? '';
      const description = cols[4] ?? '';
      const diagnosisDate = cols[5] ?? '';
      const severity = cols[6] ?? '';
      const medications = cols[7] ?? '';
      const familyDisease = cols[9] ?? '';
      const relation = cols[10] ?? '';
      const familySeverity = cols[11] ?? '';
      const familyNotes = cols[12] ?? '';

      // A non-empty notes column signals the start of a new patient record
      if (notes) {
        try {
          const patient = new Patient();
          patient.doctorId = doctorId;
          patient.notes = notes;
          currentPatient = await this.patientRepository.save(patient);
          result.imported++;
        } catch (err) {
          result.skipped++;
          result.errors.push({
            row: rowNum,
            reason: `Failed to create patient: ${(err as Error).message}`,
          });
          currentPatient = null;
        }
      }

      // Rows with no notes and no active patient cannot be associated
      if (!currentPatient) {
        if (!notes) {
          result.errors.push({
            row: rowNum,
            reason:
              'Row skipped: no active patient context (notes column is empty)',
          });
          result.skipped++;
        }
        continue;
      }

      // Import medical history when disorder is present
      if (disorder) {
        try {
          const history = new PatientHistory();
          history.patientId = currentPatient.id;
          history.disorder = disorder;
          history.description = description || '';
          history.diagnosisDate = diagnosisDate || null;
          history.severity = severity || 'moderate';
          history.medications = medications || '';
          await this.patientHistoryRepository.save(history);
        } catch (err) {
          result.errors.push({
            row: rowNum,
            reason: `Failed to import medical history (disorder: ${disorder}): ${(err as Error).message}`,
          });
        }
      }

      // Import family history when both required fields are present
      if (familyDisease && relation) {
        try {
          const fh = new FamilyHistory();
          fh.patientId = currentPatient.id;
          fh.diseaseType = familyDisease as DiseaseType;
          fh.relation = relation;
          fh.severity = familySeverity || 'moderate';
          fh.notes = familyNotes || '';
          await this.familyHistoryRepository.save(fh);
        } catch (err) {
          result.errors.push({
            row: rowNum,
            reason: `Failed to import family history (disease: ${familyDisease}): ${(err as Error).message}`,
          });
        }
      }
    }

    this.logger.info(
      `CSV import by doctor ${doctorId}: ${result.imported} patients imported, ${result.skipped} rows skipped, ${result.errors.length} errors`,
    );
    return result;
  }

  private parseCsvLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          fields.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    return fields;
  }
}
