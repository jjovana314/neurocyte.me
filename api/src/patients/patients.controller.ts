import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { RolesGuard } from './decorators/roles.guard';
import { PatientsService } from './patients.service';
import {
  CreatePatientDto,
  CreatePatientHistoryDto,
  CreateFamilyHistoryDto,
  CreateMigraineLogDto,
  CreateSeizureLogDto,
  ImportCsvResponseDto,
  UpdatePatientNotesDto,
  CreateNcsStudyDto,
} from './dtos';
import { SearchPatientDto } from './dtos/search-patient.dto';
import { PatientSearchResult } from './interfaces/search-result.interface';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { EdssAssesment } from './entities/edss-assesment.entity';
import { MigraineLog } from './entities/migraine-log.entity';
import { SeizureLog } from './entities/seizure-log.entity';
import { NcsStudy } from './entities/ncs-study.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtUser } from 'src/auth/classes/jwt-user.class';
import { MultipartFile } from 'src/common/multipart-file';

@Controller('patients')
@UseGuards(AuthGuard('jwt'))
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPatient(
    @CurrentUser() user: JwtUser,
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<Patient> {
    return this.patientsService.createPatient(user.id, createPatientDto);
  }

  @Get('export/csv')
  @UseGuards(RolesGuard)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="patient_export.csv"')
  async exportCsv(@CurrentUser() user: JwtUser): Promise<string> {
    return this.patientsService.exportPatientDataCsv(user.id, user.role.name);
  }

  @Get(':id/export/pdf')
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
      user.role.name,
    );
    return new StreamableFile(buffer);
  }

  @Post('import/csv')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentUser() user: JwtUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'csv', fallbackToMimetype: true }),
        ],
      }),
    )
    file: MultipartFile,
  ): Promise<ImportCsvResponseDto> {
    return this.patientsService.importCsvData(user.id, file.buffer);
  }

  @Get('search')
  async searchPatients(
    @CurrentUser() user: JwtUser,
    @Query('query') query: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('sortBy') sortBy: string,
    @Query('order') order: 'ASC' | 'DESC',
  ): Promise<PatientSearchResult> {
    const searchPatientDto: SearchPatientDto = {
      query,
      options: {
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        sortBy,
        order,
      },
    };
    return this.patientsService.search(
      user.id,
      user.role.name,
      searchPatientDto,
    );
  }

  @Get(':id')
  async getPatient(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<Patient> {
    return this.patientsService.getPatient(user.id, parseInt(patientId, 10));
  }

  /**
   * Update patient notes, optionally recording a new EDSS assessment in the same request
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
      body,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePatient(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<void> {
    return this.patientsService.deletePatient(user.id, parseInt(patientId, 10));
  }

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

  /**
   * Get a patient's EDSS assessment history. Assessments themselves are
   * recorded via createPatient/updatePatientNotes, not a dedicated endpoint.
   */
  @Get(':id/edss')
  async getPatientEdssAssessments(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<EdssAssesment[]> {
    return this.patientsService.getPatientEdssAssessments(
      user.id,
      parseInt(patientId, 10),
    );
  }

  /**
   * Add a migraine log entry for a patient
   */
  @Post(':id/migraines')
  @HttpCode(HttpStatus.CREATED)
  async addMigraineLog(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
    @Body() createMigraineLogDto: CreateMigraineLogDto,
  ): Promise<MigraineLog> {
    createMigraineLogDto.patientId = parseInt(patientId, 10);
    return this.patientsService.addMigraineLog(user.id, createMigraineLogDto);
  }

  /**
   * Get a patient's migraine log history
   */
  @Get(':id/migraines')
  async getPatientMigraineLogs(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<MigraineLog[]> {
    return this.patientsService.getPatientMigraineLogs(
      user.id,
      parseInt(patientId, 10),
    );
  }

  /**
   * Add a seizure log entry for a patient
   */
  @Post(':id/seizures')
  @HttpCode(HttpStatus.CREATED)
  async addSeizureLog(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
    @Body() createSeizureLogDto: CreateSeizureLogDto,
  ): Promise<SeizureLog> {
    createSeizureLogDto.patientId = parseInt(patientId, 10);
    return this.patientsService.addSeizureLog(user.id, createSeizureLogDto);
  }

  /**
   * Get a patient's seizure log history
   */
  @Get(':id/seizures')
  async getPatientSeizureLogs(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<SeizureLog[]> {
    return this.patientsService.getPatientSeizureLogs(
      user.id,
      parseInt(patientId, 10),
    );
  }

  /**
   * Get a patient's nerve conduction study history
   */
  @Get(':id/ncs-studies')
  async getPatientNcsStudies(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
  ): Promise<NcsStudy[]> {
    return this.patientsService.getPatientNcsStudies(
      user.id,
      parseInt(patientId, 10),
    );
  }

  @Post(':id/ncs-studies/import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async importNcsStudies(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: 'csv', fallbackToMimetype: true }),
        ],
      }),
    )
    file: MultipartFile,
  ): Promise<ImportCsvResponseDto> {
    return this.patientsService.importNcsStudiesCsv(
      user.id,
      parseInt(patientId, 10),
      file.buffer,
    );
  }

  /**
   * 
   * @param user user ID
   * @param patientId patient ID
   * @param createNcsStudy NCS data
   * @returns updated patient information
   */
  @Post(':id/ncs-studies')
  @HttpCode(HttpStatus.CREATED)
  @HttpCode(HttpStatus.OK)
  async addNcsStudy(
    @CurrentUser() user: JwtUser,
    @Param('id') patientId: string,
    @Body() createNcsStudy: CreateNcsStudyDto,
  ): Promise<Patient> {
    return this.patientsService.createNcsStudy(
      user.id,
      parseInt(patientId, 10),
      createNcsStudy,
    );
  }
}
