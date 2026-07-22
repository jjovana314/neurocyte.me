import {
  Injectable,
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
import { EdssAssesment } from './entities/edss-assesment.entity';
import { User } from 'src/auth/entites/user.entity';
import PDFDocument from 'pdfkit';
import {
  CreatePatientDto,
  CreatePatientHistoryDto,
  CreateFamilyHistoryDto,
  EdssAssessmentDataDto,
  ImportCsvResponseDto,
  UpdatePatientNotesDto,
} from './dtos';
import { maskString } from './utils/masking';
import { calculateEdssScore } from './utils/edss-calculator';
import {
  PatientCreateForbiddenException,
  UserNotFoundException,
  PatientNotFoundException,
  AccessToPatientForbiddenException,
} from 'src/common/exceptions';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private patientRepository: Repository<Patient>,
    @InjectRepository(PatientHistory)
    private patientHistoryRepository: Repository<PatientHistory>,
    @InjectRepository(FamilyHistory)
    private familyHistoryRepository: Repository<FamilyHistory>,
    @InjectRepository(EdssAssesment)
    private edssAssessmentRepository: Repository<EdssAssesment>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly logger: PinoLogger,
  ) {}

  @errorHandler
  async createPatient(
    doctorId: number,
    createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    // Verify doctor exists and has appropriate role

    const doctor = await this.findUserById(doctorId);
    // Check if user is a doctor (role check)
    if (!doctor.role || doctor.role.id !== 1) {
      // this is not good approach, we need to check role based on ID, not name
      this.logger.warn(
        `User ${doctorId} attempted to create patient without doctor role`,
      );
      throw new PatientCreateForbiddenException();
    }
    // add validation for patients

    const patient = new Patient();
    patient.doctor = doctor;
    patient.name = createPatientDto.name;
    patient.dateOfBirth = createPatientDto.dateOfBirth;
    patient.gender = createPatientDto.gender;
    patient.phone = createPatientDto.phone || null;
    patient.email = createPatientDto.email || null;
    patient.notes = createPatientDto.notes;

    // Build (and validate) the EDSS assessment before saving the patient, so
    // an invalid assessment doesn't leave an orphan patient record behind.
    const edssAssessment = createPatientDto.edss
      ? this.buildEdssAssessment(createPatientDto.edss)
      : null;

    const savedPatient = await this.patientRepository.save(patient);
    this.logger.info(
      `Patient record ${savedPatient.id} created by doctor ${doctorId}`,
    );

    if (edssAssessment) {
      edssAssessment.patientId = savedPatient.id;
      await this.edssAssessmentRepository.save(edssAssessment);
    }

    return savedPatient;
  }

  async findUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
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
      throw new PatientNotFoundException(createHistoryDto.patientId);
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${createHistoryDto.patientId} created by doctor ${patient.doctorId}`,
      );
      throw new AccessToPatientForbiddenException();
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
      throw new PatientNotFoundException(createFamilyHistoryDto.patientId);
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${createFamilyHistoryDto.patientId}`,
      );
      throw new AccessToPatientForbiddenException();
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
      throw new AccessToPatientForbiddenException();
    }

    return patient;
  }

  @errorHandler
  async getDoctorPatients(
    doctorId: number,
    roleName: string,
  ): Promise<Patient[]> {
    const patients = await this.patientRepository.find({
      where: roleName === 'Support Engineer' ? {} : { doctorId },
      relations: ['medicalHistory', 'familyHistory'],
      order: { createdAt: 'DESC' },
    });

    this.logger.info(
      `Retrieved ${patients.length} patients for user ${doctorId} (role: ${roleName})`,
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
      throw new PatientNotFoundException(patientId);
    }

    if (patient.doctorId !== doctorId) {
      throw new AccessToPatientForbiddenException();
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
      throw new PatientNotFoundException(patientId);
    }

    if (patient.doctorId !== doctorId) {
      throw new AccessToPatientForbiddenException();
    }

    const familyHistory = await this.familyHistoryRepository.find({
      where: { patientId },
      order: { recordedAt: 'DESC' },
    });

    return familyHistory;
  }

  // Validates the raw FSS grades and derives the composite score - the
  // client never supplies totalScore directly. Building this before any
  // patient save means an invalid assessment fails before persisting
  // anything.
  private buildEdssAssessment(data: EdssAssessmentDataDto): EdssAssesment {
    const ambulation = {
      unassistedWalkingDistanceMeters: data.unassistedWalkingDistanceMeters,
      requiresUnilateralAid: data.requiresUnilateralAid || false,
      requiresBilateralAid: data.requiresBilateralAid || false,
      wheelchairBound: data.wheelchairBound || false,
    };

    const totalScore = calculateEdssScore(
      {
        pyramidalSystem: data.pyramidalSystem,
        cerebellarSystem: data.cerebellarSystem,
        brainstemSystem: data.brainstemSystem,
        sensorySystem: data.sensorySystem,
        bowelBladderSystem: data.bowelBladderSystem,
        visualSystem: data.visualSystem,
        mentalSystem: data.mentalSystem,
      },
      ambulation,
    );

    const assessment = new EdssAssesment();
    assessment.pyramidalSystem = data.pyramidalSystem;
    assessment.cerebellarSystem = data.cerebellarSystem;
    assessment.brainstemSystem = data.brainstemSystem;
    assessment.sensorySystem = data.sensorySystem;
    assessment.bowelBladderSystem = data.bowelBladderSystem;
    assessment.visualSystem = data.visualSystem;
    assessment.mentalSystem = data.mentalSystem;
    assessment.unassistedWalkingDistanceMeters =
      ambulation.unassistedWalkingDistanceMeters ?? null;
    assessment.requiresUnilateralAid = ambulation.requiresUnilateralAid;
    assessment.requiresBilateralAid = ambulation.requiresBilateralAid;
    assessment.wheelchairBound = ambulation.wheelchairBound;
    assessment.totalScore = totalScore;

    return assessment;
  }

  async getPatientEdssAssessments(
    doctorId: number,
    patientId: number,
  ): Promise<EdssAssesment[]> {
    // Verify permissions first
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(patientId);
    }

    if (patient.doctorId !== doctorId) {
      throw new AccessToPatientForbiddenException();
    }

    return this.edssAssessmentRepository.find({
      where: { patientId },
      order: { assessedAt: 'DESC' },
    });
  }

  @errorHandler
  async updatePatientNotes(
    doctorId: number,
    patientId: number,
    updatePatientDto: UpdatePatientNotesDto,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(patientId);
    }

    if (patient.doctorId !== doctorId) {
      throw new AccessToPatientForbiddenException();
    }

    // Build (and validate) the EDSS assessment before saving, so an invalid
    // assessment doesn't get the notes update to partially apply.
    const edssAssessment = updatePatientDto.edss
      ? this.buildEdssAssessment(updatePatientDto.edss)
      : null;

    patient.notes = updatePatientDto.notes;
    const updatedPatient = await this.patientRepository.save(patient);
    this.logger.info(
      `Patient ${patientId} notes updated by doctor ${doctorId}`,
    );

    if (edssAssessment) {
      edssAssessment.patientId = patientId;
      await this.edssAssessmentRepository.save(edssAssessment);
    }

    return updatedPatient;
  }

  @errorHandler
  async deletePatient(doctorId: number, patientId: number): Promise<void> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(patientId);
    }

    if (patient.doctorId !== doctorId) {
      throw new AccessToPatientForbiddenException();
    }

    // Delete associated histories (cascade handled by database, but explicit for clarity)
    await this.patientHistoryRepository.delete({ patientId });
    await this.familyHistoryRepository.delete({ patientId });
    await this.patientRepository.delete({ id: patientId });

    this.logger.info(`Patient ${patientId} deleted by doctor ${doctorId}`);
  }

  @errorHandler
  async exportPatientDataCsv(
    userId: number,
    roleName: string,
  ): Promise<string> {
    const qb = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.medicalHistory', 'medicalHistory')
      .leftJoinAndSelect('patient.familyHistory', 'familyHistory');

    if (roleName === 'Doctor') {
      qb.where('patient.doctorId = :userId', { userId });
    }
    const patients = await qb.getMany();
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
        const isFirstRow = rowIndex === 0;

        const dataMap = {
          notes: isFirstRow ? patient.notes : '',
          createdAt: isFirstRow ? patient.createdAt : '',
          updatedAt: isFirstRow ? patient.updatedAt : '',
          disorder: medicalRow?.disorder,
          description: medicalRow?.description,
          diagnosisDate: medicalRow?.diagnosisDate,
          medSeverity: medicalRow?.severity,
          medications: medicalRow?.medications,
          medRecordedAt: medicalRow?.recordedAt,
          familyDiseaseType: familyRow?.diseaseType,
          familyRelation: familyRow?.relation,
          familySeverity: familyRow?.severity,
          familyNotes: familyRow?.notes,
          familyRecordedAt: familyRow?.recordedAt,
        };

        const row = Object.values(dataMap).map((v) =>
          this.checkCsvFieldOrEscape(v ?? ''),
        );

        csvHeader.push(row.join(','));
      }
    }

    const result = csvHeader.join('\n');

    this.logger.info(`CSV exported by user ${userId} (role: ${roleName})`);
    return result;
  }

  private checkCsvFieldOrEscape(value: string | Date): string {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  @errorHandler
  async exportPatientPdf(
    doctorId: number,
    patientId: number,
    roleName: string,
  ): Promise<Buffer> {
    const doctor = await this.userRepository.findOne({
      where: { id: doctorId },
      relations: ['role'],
    });
    if (!doctor) {
      throw new UserNotFoundException(doctorId);
    }

    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: ['medicalHistory', 'familyHistory', 'doctor'],
    });
    if (!patient) {
      throw new PatientNotFoundException(patientId);
    }
    if (roleName !== 'Support Engineer' && patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to export PDF for patient ${patientId} created by doctor ${patient.doctorId}`,
      );
      throw new AccessToPatientForbiddenException();
    }

    const isSupportEngineer = roleName === 'Support Engineer';

    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // ─ Header
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Patient Report', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);

      // ─ Patient Info
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Patient Information');
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#cccccc')
        .stroke();
      doc.moveDown(0.5);

      const doctorFullName = `${doctor.firstName} ${doctor.lastName}`;
      doc.fontSize(11).font('Helvetica');

      const infoRows: [string, string][] = [
        ['Patient ID', String(patient.id)],
        [
          'Patient Name',
          isSupportEngineer ? maskString(patient.name) : patient.name || 'N/A',
        ],
        ['Date of Birth', patient.dateOfBirth || 'N/A'],
        ['Gender', patient.gender || 'N/A'],
        [
          'Phone',
          isSupportEngineer
            ? maskString(patient.phone)
            : patient.phone || 'N/A',
        ],
        [
          'Email',
          isSupportEngineer
            ? maskString(patient.email)
            : patient.email || 'N/A',
        ],
        ['Attending Doctor', doctorFullName],
        ['Doctor Email', doctor.email],
        ['Notes', patient.notes || 'None'],
        ['Created At', patient.createdAt.toLocaleString()],
        ['Last Updated', patient.updatedAt.toLocaleString()],
      ];

      for (const [label, patientData] of infoRows) {
        doc
          .font('Helvetica-Bold')
          .text(`${label}: `, { continued: true })
          .font('Helvetica')
          .text(patientData);
      }
      doc.moveDown(1);

      // ─ Medical History
      doc.fontSize(14).font('Helvetica-Bold').text('Medical History');
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#cccccc')
        .stroke();
      doc.moveDown(0.5);

      const medicalHistory = patient.medicalHistory ?? [];
      if (medicalHistory.length === 0) {
        doc.fontSize(11).font('Helvetica').text('No medical history recorded.');
      } else {
        for (const [index, record] of medicalHistory.entries()) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${record.disorder}`);
          doc.fontSize(11).font('Helvetica');
          doc.text(`   Description: ${record.description || 'N/A'}`);
          doc.text(`   Diagnosis Date: ${record.diagnosisDate || 'N/A'}`);
          doc.text(`   Severity: ${record.severity || 'N/A'}`);
          doc.text(`   Medications: ${record.medications || 'N/A'}`);
          doc.text(`   Recorded At: ${record.recordedAt.toLocaleString()}`);
          doc.moveDown(0.5);
        }
      }
      doc.moveDown(1);

      // ─ Family History
      doc.fontSize(14).font('Helvetica-Bold').text('Family History');
      doc
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#cccccc')
        .stroke();
      doc.moveDown(0.5);

      const familyHistory = patient.familyHistory ?? [];
      if (familyHistory.length === 0) {
        doc.fontSize(11).font('Helvetica').text('No family history recorded.');
      } else {
        for (const [index, record] of familyHistory.entries()) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${record.diseaseType} (${record.relation})`);
          doc.fontSize(11).font('Helvetica');
          doc.text(`   Severity: ${record.severity || 'N/A'}`);
          doc.text(`   Notes: ${record.notes || 'N/A'}`);
          doc.text(`   Recorded At: ${record.recordedAt.toLocaleString()}`);
          doc.moveDown(0.5);
        }
      }

      // ─ Footer
      doc
        .fontSize(9)
        .fillColor('#888888')
        .text(
          'Confidential – For authorized medical personnel only',
          50,
          doc.page.height - 50,
          {
            align: 'center',
            width: doc.page.width - 100,
          },
        );

      doc.end();
    });

    this.logger.info(`Patient ${patientId} PDF exported by doctor ${doctorId}`);
    return pdfBuffer;
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

    const doctor = await this.findUserById(doctorId);

    // Skip header row
    const dataRows = lines.slice(1);
    const result = new ImportCsvResponseDto();
    result.imported = 0;
    result.skipped = 0;
    result.errors = [];

    let currentPatient: Patient | null = null;

    for (const [i, row] of dataRows.entries()) {
      const rowNum = i + 2;
      const fields = this.parseCsvRow(row);

      if (fields.notes) {
        currentPatient = await this.savePatientFromRow(
          doctor,
          rowNum,
          fields,
          result,
        );
      }

      if (!currentPatient) {
        if (!fields.notes) {
          result.errors.push({
            row: rowNum,
            reason:
              'Row skipped: no active patient context (notes column is empty)',
          });
          result.skipped++;
        }
        continue;
      }

      if (fields.disorder) {
        await this.saveMedicalHistoryFromRow(
          currentPatient.id,
          rowNum,
          fields,
          result,
        );
      }

      if (fields.familyDisease && fields.relation) {
        await this.saveFamilyHistoryFromRow(
          currentPatient.id,
          rowNum,
          fields,
          result,
        );
      }
    }

    this.logger.info(
      `CSV import by doctor ${doctorId}: ${result.imported} patients imported, ${result.skipped} rows skipped, ${result.errors.length} errors`,
    );
    return result;
  }

  private parseCsvRow(line: string) {
    const cols = this.parseCsvLine(line);
    return {
      notes: cols[0] ?? '',
      disorder: cols[3] ?? '',
      description: cols[4] ?? '',
      diagnosisDate: cols[5] ?? '',
      severity: cols[6] ?? '',
      medications: cols[7] ?? '',
      familyDisease: cols[9] ?? '',
      relation: cols[10] ?? '',
      familySeverity: cols[11] ?? '',
      familyNotes: cols[12] ?? '',
    };
  }

  private async savePatientFromRow(
    doctor: User,
    rowNum: number,
    fields: ReturnType<PatientsService['parseCsvRow']>,
    result: ImportCsvResponseDto,
  ): Promise<Patient | null> {
    try {
      const patient = new Patient();
      patient.doctor = doctor;
      patient.notes = fields.notes;
      const saved = await this.patientRepository.save(patient);
      result.imported++;
      return saved;
    } catch (err) {
      result.skipped++;
      result.errors.push({
        row: rowNum,
        reason: `Failed to create patient: ${(err as Error).message}`,
      });
      return null; // todo throw an error
    }
  }

  private async saveMedicalHistoryFromRow(
    patientId: number,
    rowNum: number,
    fields: ReturnType<PatientsService['parseCsvRow']>,
    result: ImportCsvResponseDto,
  ): Promise<void> {
    try {
      const history = new PatientHistory();
      history.patientId = patientId;
      history.disorder = fields.disorder;
      history.description = fields.description || '';
      history.diagnosisDate = fields.diagnosisDate || null;
      history.severity = fields.severity || 'moderate';
      history.medications = fields.medications || '';
      await this.patientHistoryRepository.save(history);
    } catch (err) {
      result.errors.push({
        row: rowNum,
        reason: `Failed to import medical history (disorder: ${fields.disorder}): ${(err as Error).message}`,
      });
    }
  }

  private async saveFamilyHistoryFromRow(
    patientId: number,
    rowNum: number,
    fields: ReturnType<PatientsService['parseCsvRow']>,
    result: ImportCsvResponseDto,
  ): Promise<void> {
    try {
      const fh = new FamilyHistory();
      fh.patientId = patientId;
      fh.diseaseType = fields.familyDisease as DiseaseType;
      fh.relation = fields.relation;
      fh.severity = fields.familySeverity || 'moderate';
      fh.notes = fields.familyNotes || '';
      await this.familyHistoryRepository.save(fh);
    } catch (err) {
      result.errors.push({
        row: rowNum,
        reason: `Failed to import family history (disease: ${fields.familyDisease}): ${(err as Error).message}`,
      });
    }
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
