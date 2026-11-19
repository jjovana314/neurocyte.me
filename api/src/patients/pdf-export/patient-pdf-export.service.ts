import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { errorHandler } from '../decorators/error-handler-decorator';
import { Patient } from '../entities/patient.entity';
import { PatientHistory } from '../entities/patient-history.entity';
import { FamilyHistory } from '../entities/family-history.entity';
import { SeizureLog } from '../entities/seizure-log.entity';
import { TouretteSyndrome } from '../entities/tourette-syndrome.entity';
import { User } from 'src/user/entities/user.entity';
import { RoleEnum } from 'src/auth/enums/role.enum';
import { maskString } from '../utils/masking';
import { formatToTitleCase } from '../utils/format-to-title-case';
import { PatientPdfDocument } from './patient-pdf-document';
import { PatientsService } from '../patients.service';

const FOOTER_TEXT = 'Confidential – For authorized medical personnel only';

@Injectable()
export class PatientPdfExportService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly patientsService: PatientsService,
  ) {}

  @errorHandler
  async exportPatientPdf(
    doctorId: number,
    patientId: number,
    roleName: string,
  ): Promise<Buffer> {
    const isSupportEngineer = roleName === RoleEnum.SUPPORT_ENGINEER;

    const doctor = await this.patientsService.findUserById(doctorId);
    const patient = await this.patientsService.getPatient(doctorId, patientId);
    const records = await this.patientsService.findPatientRecords(patientId);

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
