import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './decorators/roles.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto, CreatePatientHistoryDto, CreateFamilyHistoryDto } from './dtos';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Create a new patient record
   * POST /patients
   * Only doctors can create patients
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @Request() req,
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    return this.patientsService.createPatient(req.user.id, createPatientDto);
  }

  /**
   * Get all patients created by the authenticated doctor
   * GET /patients/my-patients
   */
  @Get('my-patients')
  async getMyPatients(@Request() req): Promise<Patient[]> {
    return this.patientsService.getDoctorPatients(req.user.id);
  }

  /**
   * Export all patient data as a CSV file
   * GET /patients/export/csv
   * Only doctors and researchers can export
   */
  @Get('export/csv')
  @Roles('doctor', 'researcher')
  @UseGuards(RolesGuard)
  async exportCsv(
    @Request() req,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.patientsService.exportPatientDataCsv(req.user.id);
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="patient_export.csv"',
    });
    res.send(csv);
  }

  /**
   * Get a specific patient record
   * GET /patients/:id
   * Only the doctor who created the patient can view it
   */
  @Get(':id')
  async getPatient(
    @Request() req,
    @Param('id') patientId: string,
  ): Promise<Patient> {
    return this.patientsService.getPatient(req.user.id, parseInt(patientId, 10));
  }

  /**
   * Update patient notes
   * PUT /patients/:id
   */
  @Put(':id')
  async updatePatientNotes(
    @Request() req,
    @Param('id') patientId: string,
    @Body() body: { notes: string },
  ): Promise<Patient> {
    return this.patientsService.updatePatientNotes(req.user.id, parseInt(patientId, 10), body.notes);
  }

  /**
   * Delete a patient record
   * DELETE /patients/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePatient(
    @Request() req,
    @Param('id') patientId: string,
  ): Promise<void> {
    return this.patientsService.deletePatient(req.user.id, parseInt(patientId, 10));
  }

  /**
   * Add medical history to a patient
   * POST /patients/:id/history
   */
  @Post(':id/history')
  @HttpCode(HttpStatus.CREATED)
  async addPatientHistory(
    @Request() req,
    @Param('id') patientId: string,
    @Body() createHistoryDto: CreatePatientHistoryDto,
  ): Promise<PatientHistory> {
    createHistoryDto.patientId = parseInt(patientId, 10);
    return this.patientsService.addPatientHistory(req.user.id, createHistoryDto);
  }

  /**
   * Get patient medical history
   * GET /patients/:id/history
   */
  @Get(':id/history')
  async getPatientHistory(
    @Request() req,
    @Param('id') patientId: string,
  ): Promise<PatientHistory[]> {
    return this.patientsService.getPatientMedicalHistory(req.user.id, parseInt(patientId, 10));
  }

  /**
   * Add family history to a patient
   * POST /patients/:id/family-history
   * Family history includes neurological diseases like Alzheimer's, Parkinson's, etc.
   */
  @Post(':id/family-history')
  @HttpCode(HttpStatus.CREATED)
  async addFamilyHistory(
    @Request() req,
    @Param('id') patientId: string,
    @Body() createFamilyHistoryDto: CreateFamilyHistoryDto,
  ): Promise<FamilyHistory> {
    createFamilyHistoryDto.patientId = parseInt(patientId, 10);
    return this.patientsService.addFamilyHistory(req.user.id, createFamilyHistoryDto);
  }

  /**
   * Get patient family history
   * GET /patients/:id/family-history
   */
  @Get(':id/family-history')
  async getPatientFamilyHistory(
    @Request() req,
    @Param('id') patientId: string,
  ): Promise<FamilyHistory[]> {
    return this.patientsService.getPatientFamilyHistory(req.user.id, parseInt(patientId, 10));
  }

}
