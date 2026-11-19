import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { errorHandler } from '../decorators/error-handler-decorator';
import { Patient } from '../entities/patient.entity';
import { PatientHistory } from '../entities/patient-history.entity';
import { FamilyHistory } from '../entities/family-history.entity';
import { SeizureLog } from '../entities/seizure-log.entity';
import { TouretteSyndrome } from '../entities/tourette-syndrome.entity';
import { User } from 'src/user/entities/user.entity';
import { RoleEnum } from 'src/auth/enums/role.enum';
import {
  UserNotFoundException,
  PatientNotFoundException,
  AccessToPatientForbiddenException,
} from 'src/common/exceptions';
import { maskString } from '../utils/masking';
import { formatToTitleCase } from '../utils/format-to-title-case';
import { PatientPdfDocument } from './patient-pdf-document';

const FOOTER_TEXT = 'Confidential – For authorized medical personnel only';

interface PatientRecords {
  medicalHistory: PatientHistory[];
  familyHistory: FamilyHistory[];
  seizureLogs: SeizureLog[];
  touretteSyndrome: TouretteSyndrome[];
}

@Injectable()
export class PatientPdfExportService {
  constructor(
    @InjectRepository(Patient) private patientRepository: Repository<Patient>,
    @InjectRepository(PatientHistory)
    private patientHistoryRepository: Repository<PatientHistory>,
    @InjectRepository(FamilyHistory)
    private familyHistoryRepository: Repository<FamilyHistory>,
    @InjectRepository(SeizureLog)
    private seizureLogRepository: Repository<SeizureLog>,
    @InjectRepository(TouretteSyndrome)
    private touretteSyndromeRepository: Repository<TouretteSyndrome>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly logger: PinoLogger,
  ) {}

  @errorHandler
  async exportPatientPdf(
    doctorId: number,
    patientId: number,
    roleName: string,
  ): Promise<Buffer> {
    const isSupportEngineer = roleName === RoleEnum.SUPPORT_ENGINEER;

    const doctor = await this.findDoctor(doctorId);
    const patient = await this.findAccessiblePatient(
      doctorId,
      patientId,
      isSupportEngineer,
    );
    const records = await this.findPatientRecords(patientId);

    const pdf = new PatientPdfDocument().addTitle(
      'Patient Report',
      `Generated: ${new Date().toLocaleString()}`,
    );

    const sections: Array<(pdf: PatientPdfDocument) => void> = [
      (p) => this.addPatientInfo(p, patient, doctor, isSupportEngineer),
      (p) => this.addMedicalHistory(p, records.medicalHistory),
      (p) => this.addFamilyHistory(p, records.familyHistory),
      (p) => this.addSeizureLogs(p, records.seizureLogs),
      (p) => this.addTouretteSyndrome(p, records.touretteSyndrome),
    ];
    sections.forEach((addSection, index) => {
      addSection(pdf);
      if (index < sections.length - 1) pdf.addSpacing();
    });

    const buffer = await pdf.addFooterToAllPages(FOOTER_TEXT).toBuffer();

    this.logger.info(`Patient ${patientId} PDF exported by doctor ${doctorId}`);
    return buffer;
  }

  // - Data access

  private async findDoctor(doctorId: number): Promise<User> {
    const doctor = await this.userRepository.findOne({
      where: { id: doctorId },
      relations: ['role'],
    });
    if (!doctor) {
      throw new UserNotFoundException(doctorId);
    }
    return doctor;
  }

  private async findAccessiblePatient(
    doctorId: number,
    patientId: number,
    isSupportEngineer: boolean,
  ): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(patientId);
    }
    if (!isSupportEngineer && patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to export PDF for patient ${patientId} created by doctor ${patient.doctorId}`,
      );
      throw new AccessToPatientForbiddenException();
    }
    return patient;
  }

  private async findPatientRecords(patientId: number): Promise<PatientRecords> {
    const byRecordedAtDesc = {
      where: { patientId },
      order: { recordedAt: 'DESC' as const },
    };
    const [medicalHistory, familyHistory, seizureLogs, touretteSyndrome] =
      await Promise.all([
        this.patientHistoryRepository.find(byRecordedAtDesc),
        this.familyHistoryRepository.find(byRecordedAtDesc),
        this.seizureLogRepository.find({
          where: { patientId },
          order: { ictusStart: 'DESC' },
        }),
        this.touretteSyndromeRepository.find(byRecordedAtDesc),
      ]);
    return { medicalHistory, familyHistory, seizureLogs, touretteSyndrome };
  }

  // - Sections

  private addPatientInfo(
    pdf: PatientPdfDocument,
    patient: Patient,
    doctor: User,
    isSupportEngineer: boolean,
  ): void {
    const sensitive = (value: string) =>
      isSupportEngineer ? maskString(value) : value || 'N/A';

    pdf.addInfoSection('Patient Information', [
      ['Patient ID', String(patient.id)],
      ['Patient Name', sensitive(patient.name)],
      ['Date of Birth', patient.dateOfBirth?.toDateString() || 'N/A'],
      ['Gender', patient.gender || 'N/A'],
      ['Phone', sensitive(patient.phone)],
      ['Email', sensitive(patient.email)],
      ['Attending Doctor', `${doctor.firstName} ${doctor.lastName}`],
      ['Doctor Email', doctor.email],
      ['Notes', patient.notes || 'None'],
      ['Created At', patient.createdAt?.toLocaleString() ?? 'N/A'],
      ['Last Updated', patient.updatedAt?.toLocaleString() ?? 'N/A'],
    ]);
  }

  private addMedicalHistory(
    pdf: PatientPdfDocument,
    records: PatientHistory[],
  ): void {
    pdf.addRecordSection('Medical History', records, {
      emptyMessage: 'No medical history recorded.',
      title: (r) => r.disorder,
      fields: (r) => [
        ['Description', r.description || 'N/A'],
        ['Diagnosis Date', r.diagnosisDate || 'N/A'],
        ['Severity', r.severity || 'N/A'],
        ['Medications', r.medications || 'N/A'],
        ['Recorded At', r.recordedAt?.toLocaleString() ?? 'N/A'],
      ],
    });
  }

  private addFamilyHistory(
    pdf: PatientPdfDocument,
    records: FamilyHistory[],
  ): void {
    pdf.addRecordSection('Family History', records, {
      emptyMessage: 'No family history recorded.',
      title: (r) => `${r.diseaseType} (${r.relation})`,
      fields: (r) => [
        ['Severity', r.severity || 'N/A'],
        ['Notes', r.notes || 'N/A'],
        ['Recorded At', r.recordedAt?.toLocaleString() ?? 'N/A'],
      ],
    });
  }

  private addSeizureLogs(pdf: PatientPdfDocument, records: SeizureLog[]): void {
    pdf.addRecordSection('Seizure Logs', records, {
      emptyMessage: 'No seizure logs recorded.',
      title: (r) => formatToTitleCase(r.onsetVector),
      fields: (r) => [
        ['Ictus Start', r.ictusStart?.toLocaleString() ?? 'N/A'],
        ['Ictus End', r.ictusEnd?.toLocaleString() ?? 'N/A'],
        ['Duration', `${r.ictusDurationSeconds} seconds`],
        [
          'Postictal Duration',
          r.postictalDurationMinutes != null
            ? `${r.postictalDurationMinutes} minutes`
            : 'N/A',
        ],
        [
          'Motor Features',
          r.motorFeatures?.length
            ? r.motorFeatures.map(formatToTitleCase).join(', ')
            : 'None',
        ],
        [
          'Triggers',
          r.triggers?.length
            ? r.triggers.map(formatToTitleCase).join(', ')
            : 'None',
        ],
        ['Notes', r.notes || 'N/A'],
        ['Recorded At', r.recordedAt?.toLocaleString() ?? 'N/A'],
      ],
    });
  }

  private addTouretteSyndrome(
    pdf: PatientPdfDocument,
    records: TouretteSyndrome[],
  ): void {
    pdf.addRecordSection('Tourette syndrome', records, {
      emptyMessage: 'No tourette syndrome recorded.',
      title: (r) => formatToTitleCase(r.tycType),
      fields: (r) => [
        ['Severity', String(r.severityScale)],
        ['Premonitory urge', String(r.premonitoryUrgeLevel)],
        [
          'Triggers',
          r.triggers?.length
            ? r.triggers.map(formatToTitleCase).join(', ')
            : 'None',
        ],
        ['Medication taken', r.medicationTaken || 'None'],
        ['Notes', r.notes || 'N/A'],
        ['Recorded At', r.recordedAt?.toLocaleString() ?? 'N/A'],
      ],
    });
  }
}
