import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { User } from 'src/auth/entites/user.entity';
import { CreatePatientDto, CreatePatientHistoryDto, CreateFamilyHistoryDto } from './dtos';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient) private patientRepository: Repository<Patient>,
    @InjectRepository(PatientHistory) private patientHistoryRepository: Repository<PatientHistory>,
    @InjectRepository(FamilyHistory) private familyHistoryRepository: Repository<FamilyHistory>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Create a new patient record
   * Only doctors with 'create_patient' permission can create patients
   * Patient records do not contain patient names for privacy
   * @param doctorId - The ID of the doctor creating the patient record
   * @param createPatientDto - Patient creation data
   * @returns Created patient record
   */
  async createPatient(doctorId: number, createPatientDto: CreatePatientDto): Promise<Patient> {
    try {
      // Verify doctor exists and has appropriate role
      const doctor = await this.userRepository.findOne({ where: { id: doctorId } });
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
      }

      // Check if user is a doctor (role check)
      if (!doctor.role || doctor.role.name !== 'doctor') {
        this.logger.warn(`User ${doctorId} attempted to create patient without doctor role`);
        throw new ForbiddenException('Only doctors can create patient records');
      }

      // Create new patient record without storing name
      const patient = new Patient();
      patient.doctorId = doctorId;
      patient.notes = createPatientDto.notes || '';

      const savedPatient = await this.patientRepository.save(patient);
      this.logger.info(`Patient record ${savedPatient.id} created by doctor ${doctorId}`);

      return savedPatient;
    } catch (error) {
      this.logger.error(`Error creating patient: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add medical history entry for a patient
   * Only the doctor who created the patient can add history
   * @param doctorId - Doctor ID requesting the action
   * @param createHistoryDto - History data to add
   * @returns Created history record
   */
  async addPatientHistory(doctorId: number, createHistoryDto: CreatePatientHistoryDto): Promise<PatientHistory> {
    try {
      // Verify patient exists
      const patient = await this.patientRepository.findOne({ where: { id: createHistoryDto.patientId } });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${createHistoryDto.patientId} not found`);
      }

      // Verify that the requester is the doctor who created this patient
      if (patient.doctorId !== doctorId) {
        this.logger.warn(`Doctor ${doctorId} attempted to access patient ${createHistoryDto.patientId} created by doctor ${patient.doctorId}`);
        throw new ForbiddenException('You can only add history to patients you created');
      }

      // Validate required fields
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
      this.logger.info(`History record added to patient ${createHistoryDto.patientId}: ${createHistoryDto.disorder}`);

      return savedHistory;
    } catch (error) {
      this.logger.error(`Error adding patient history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add family history entry for a patient
   * Records hereditary neurological and other diseases
   * Only the doctor who created the patient can add family history
   * @param doctorId - Doctor ID requesting the action
   * @param createFamilyHistoryDto - Family history data to add
   * @returns Created family history record
   */
  async addFamilyHistory(doctorId: number, createFamilyHistoryDto: CreateFamilyHistoryDto): Promise<FamilyHistory> {
    try {
      // Verify patient exists
      const patient = await this.patientRepository.findOne({ where: { id: createFamilyHistoryDto.patientId } });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${createFamilyHistoryDto.patientId} not found`);
      }

      // Verify that the requester is the doctor who created this patient
      if (patient.doctorId !== doctorId) {
        this.logger.warn(`Doctor ${doctorId} attempted to access patient ${createFamilyHistoryDto.patientId}`);
        throw new ForbiddenException('You can only add family history to patients you created');
      }

      // Validate required fields
      if (!createFamilyHistoryDto.diseaseType) {
        throw new BadRequestException('Disease type is required');
      }
      if (!createFamilyHistoryDto.relation) {
        throw new BadRequestException('Relation is required (e.g., Mother, Father, Sibling)');
      }

      const familyHistory = new FamilyHistory();
      familyHistory.patientId = createFamilyHistoryDto.patientId;
      familyHistory.diseaseType = createFamilyHistoryDto.diseaseType;
      familyHistory.relation = createFamilyHistoryDto.relation;
      familyHistory.severity = createFamilyHistoryDto.severity || 'moderate';
      familyHistory.notes = createFamilyHistoryDto.notes || '';

      const savedFamilyHistory = await this.familyHistoryRepository.save(familyHistory);
      this.logger.info(`Family history added to patient ${createFamilyHistoryDto.patientId}: ${createFamilyHistoryDto.diseaseType}`);

      return savedFamilyHistory;
    } catch (error) {
      this.logger.error(`Error adding family history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get patient record with all associated data
   * Only the doctor who created the patient can view it
   * @param doctorId - Doctor ID requesting the action
   * @param patientId - Patient ID to retrieve
   * @returns Patient record with history and family history
   */
  async getPatient(doctorId: number, patientId: number): Promise<Patient> {
    try {
      const patient = await this.patientRepository.findOne({
        where: { id: patientId },
        relations: ['medicalHistory', 'familyHistory', 'doctor'],
      });

      if (!patient) {
        throw new NotFoundException(`Patient with ID ${patientId} not found`);
      }

      // Verify that the requester is the doctor who created this patient
      if (patient.doctorId !== doctorId) {
        this.logger.warn(`Doctor ${doctorId} attempted to access patient ${patientId} created by doctor ${patient.doctorId}`);
        throw new ForbiddenException('You can only view patients you created');
      }

      return patient;
    } catch (error) {
      this.logger.error(`Error retrieving patient: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all patients created by a specific doctor
   * @param doctorId - Doctor ID
   * @returns Array of patient records
   */
  async getDoctorPatients(doctorId: number): Promise<Patient[]> {
    try {
      const patients = await this.patientRepository.find({
        where: { doctorId },
        relations: ['medicalHistory', 'familyHistory'],
        order: { createdAt: 'DESC' },
      });

      this.logger.info(`Retrieved ${patients.length} patients for doctor ${doctorId}`);
      return patients;
    } catch (error) {
      this.logger.error(`Error retrieving doctor patients: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get medical history for a patient
   * Only the doctor who created the patient can view it
   * @param doctorId - Doctor ID requesting the action
   * @param patientId - Patient ID
   * @returns Array of history records
   */
  async getPatientMedicalHistory(doctorId: number, patientId: number): Promise<PatientHistory[]> {
    try {
      // Verify permissions first
      const patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${patientId} not found`);
      }

      if (patient.doctorId !== doctorId) {
        throw new ForbiddenException('You can only view history for patients you created');
      }

      const history = await this.patientHistoryRepository.find({
        where: { patientId },
        order: { recordedAt: 'DESC' },
      });

      return history;
    } catch (error) {
      this.logger.error(`Error retrieving patient history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get family history for a patient
   * Only the doctor who created the patient can view it
   * @param doctorId - Doctor ID requesting the action
   * @param patientId - Patient ID
   * @returns Array of family history records
   */
  async getPatientFamilyHistory(doctorId: number, patientId: number): Promise<FamilyHistory[]> {
    try {
      // Verify permissions first
      const patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${patientId} not found`);
      }

      if (patient.doctorId !== doctorId) {
        throw new ForbiddenException('You can only view family history for patients you created');
      }

      const familyHistory = await this.familyHistoryRepository.find({
        where: { patientId },
        order: { recordedAt: 'DESC' },
      });

      return familyHistory;
    } catch (error) {
      this.logger.error(`Error retrieving family history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update patient notes
   * Only the doctor who created the patient can update it
   * @param doctorId - Doctor ID requesting the action
   * @param patientId - Patient ID to update
   * @param notes - Updated notes
   * @returns Updated patient record
   */
  async updatePatientNotes(doctorId: number, patientId: number, notes: string): Promise<Patient> {
    try {
      const patient = await this.patientRepository.findOne({ where: { id: patientId } });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${patientId} not found`);
      }

      if (patient.doctorId !== doctorId) {
        throw new ForbiddenException('You can only update patients you created');
      }

      patient.notes = notes;
      const updatedPatient = await this.patientRepository.save(patient);
      this.logger.info(`Patient ${patientId} notes updated by doctor ${doctorId}`);

      return updatedPatient;
    } catch (error) {
      this.logger.error(`Error updating patient notes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a patient record and all associated data
   * Only the doctor who created the patient can delete it
   * @param doctorId - Doctor ID requesting the action
   * @param patientId - Patient ID to delete
   */
  async deletePatient(doctorId: number, patientId: number): Promise<void> {
    try {
      const patient = await this.patientRepository.findOne({ where: { id: patientId } });
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
    } catch (error) {
      this.logger.error(`Error deleting patient: ${error.message}`);
      throw error;
    }
  }
}
