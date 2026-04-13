import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileTypeValidator,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './decorators/roles.guard';
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  CreatePatientHistoryDto,
  CreateFamilyHistoryDto,
  ImportCsvResponseDto,
  UpdatePatientNotesDto,
} from './dtos';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/classes/jwt-user.class';
import { MultipartFile } from 'src/common/classes/multipart-file.class';

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
    @CurrentUser() user: JwtUser,
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    return this.patientsService.createPatient(user.id, createPatientDto);
  }

  /**
   * Get all patients created by the authenticated doctor
   * GET /patients/my-patients
   */
  @Get('my-patients')
  async getMyPatients(@CurrentUser() user: JwtUser): Promise<Patient[]> {
    return this.patientsService.getDoctorPatients(user.id);
  }

  /**
   * Export all patient data as a CSV file
   * GET /patients/export/csv
   * Only doctors and researchers can export
   */
  @Get('export/csv')
  @Roles('doctor', 'researcher')
  @UseGuards(RolesGuard)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="patient_export.csv"')
  async exportCsv(@CurrentUser() user: JwtUser): Promise<string> {
    return this.patientsService.exportPatientDataCsv(user.id);
  }

  /**
   * Export a single patient's full data as a PDF file
   * GET /patients/:id/export/pdf
   * Only doctors can export
   */
  @Get(':id/export/pdf')
  @Roles('doctor')
  @UseGuards(RolesGuard)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="patient-report.pdf"')
  async exportPatientPdf(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<StreamableFile> {
    const buffer = await this.patientsService.exportPatientPdf(
      user.id,
      parseInt(patientId, 10),
    );
    return new StreamableFile(buffer);
  }

  /**
   * Import patient data from a CSV file
   * POST /patients/import/csv
   * Only doctors can import
   */
  @Post('import/csv')
  @HttpCode(HttpStatus.OK)
  @Roles('doctor')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentUser() user: JwtUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'text/csv' })],
      }),
    )
    file: MultipartFile,
  ): Promise<ImportCsvResponseDto> {
    return this.patientsService.importCsvData(user.id, file.buffer);
  }

  /**
   * Get a specific patient record
   * GET /patients/:id
   * Only the doctor who created the patient can view it
   */
  @Get(':id')
  async getPatient(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<Patient> {
    return this.patientsService.getPatient(user.id, parseInt(patientId, 10));
  }

  /**
   * Update patient notes
   * PUT /patients/:id
   */
  @Put(':id')
  async updatePatientNotes(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
    @Body() body: UpdatePatientNotesDto,
  ): Promise<Patient> {
    return this.patientsService.updatePatientNotes(
      user.id,
      parseInt(patientId, 10),
      body.notes,
    );
  }

  /**
   * Delete a patient record
   * DELETE /patients/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePatient(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<void> {
    return this.patientsService.deletePatient(user.id, parseInt(patientId, 10));
  }

  /**
   * Add medical history to a patient
   * POST /patients/:id/history
   */
  @Post(':id/history')
  @HttpCode(HttpStatus.CREATED)
  async addPatientHistory(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
    @Body() createHistoryDto: CreatePatientHistoryDto,
  ): Promise<PatientHistory> {
    createHistoryDto.patientId = parseInt(patientId, 10);
    return this.patientsService.addPatientHistory(user.id, createHistoryDto);
  }

  /**
   * Get patient medical history
   * GET /patients/:id/history
   */
  @Get(':id/history')
  async getPatientHistory(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<PatientHistory[]> {
    return this.patientsService.getPatientMedicalHistory(
      user.id,
      parseInt(patientId, 10),
    );
  }

  /**
   * Add family history to a patient
   * POST /patients/:id/family-history
   */
  @Post(':id/family-history')
  @HttpCode(HttpStatus.CREATED)
  async addFamilyHistory(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
    @Body() createFamilyHistoryDto: CreateFamilyHistoryDto,
  ): Promise<FamilyHistory> {
    createFamilyHistoryDto.patientId = parseInt(patientId, 10);
    return this.patientsService.addFamilyHistory(
      user.id,
      createFamilyHistoryDto,
    );
  }

  /**
   * Get patient family history
   * GET /patients/:id/family-history
   */
  @Get(':id/family-history')
  async getPatientFamilyHistory(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<FamilyHistory[]> {
    return this.patientsService.getPatientFamilyHistory(
      user.id,
      parseInt(patientId, 10),
    );
  }
}
