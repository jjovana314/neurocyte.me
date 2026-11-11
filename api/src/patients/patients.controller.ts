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
  ParseIntPipe,
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
import { CreateTouretteSyndromeDto } from './dtos/create-tourette-syndrome.dto';
import { UpdateTouretteSyndromeDto } from './dtos/update-tourette-syndrome.dto';

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
    @Param('id', ParseIntPipe) patientId: number,
  ): Promise<StreamableFile> {
    const buffer = await this.patientsService.exportPatientPdf(
      user.id,
      patientId,
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

  /**
   * Update patient notes, optionally recording a new EDSS assessment in the same request
   */
  @Put(':id')
  async updatePatientNotes(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) patientId: number,
    @Body() body: UpdatePatientNotesDto,
  ): Promise<Patient> {
    return this.patientsService.updatePatientNotes(
      user.id,
      patientId,
      body,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePatient(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) patientId: number,
  ): Promise<void> {
    return this.patientsService.deletePatient(user.id, patientId);
  }

  @Post('history')
  @HttpCode(HttpStatus.CREATED)
  async addPatientHistory(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
    @Body() createHistoryDto: CreatePatientHistoryDto,
  ): Promise<PatientHistory> {
    createHistoryDto.patientId = patientId;
    return this.patientsService.addPatientHistory(user.id, createHistoryDto);
  }

  /**
   * Get patient medical history
   */
  @Get('history')
  async getPatientHistory(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
  ): Promise<PatientHistory[]> {
    return this.patientsService.getPatientMedicalHistory(
      user.id,
      patientId,
    );
  }

  /**
   * Add family history to a patient
   */
  @Post('family-history')
  @HttpCode(HttpStatus.CREATED)
  async addFamilyHistory(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
    @Body() createFamilyHistoryDto: CreateFamilyHistoryDto,
  ): Promise<FamilyHistory> {
    createFamilyHistoryDto.patientId = patientId;
    return this.patientsService.addFamilyHistory(
      user.id,
      createFamilyHistoryDto,
    );
  }

  /**
   * Get patient family history
   */
  @Get('family-history')
  async getPatientFamilyHistory(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
  ): Promise<FamilyHistory[]> {
    return this.patientsService.getPatientFamilyHistory(
      user.id,
      patientId,
    );
  }

  /**
   * Get a patient's EDSS assessment history. Assessments themselves are
   * recorded via createPatient/updatePatientNotes, not a dedicated endpoint.
   */
  @Get('edss')
  async getPatientEdssAssessments(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
  ): Promise<EdssAssesment[]> {
    return this.patientsService.getPatientEdssAssessments(
      user.id,
      patientId,
    );
  }

  /**
   * Add a migraine log entry for a patient
   */
  @Post('migraines')
  @HttpCode(HttpStatus.CREATED)
  async addMigraineLog(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
    @Body() createMigraineLogDto: CreateMigraineLogDto,
  ): Promise<MigraineLog> {
    createMigraineLogDto.patientId = patientId;
    return this.patientsService.addMigraineLog(user.id, createMigraineLogDto);
  }

  /**
   * Get a patient's migraine log history
   */
  @Get('migraines')
  async getPatientMigraineLogs(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
  ): Promise<MigraineLog[]> {
    return this.patientsService.getPatientMigraineLogs(
      user.id,
      patientId,
    );
  }

  /**
   * Add a seizure log entry for a patient
   */
  @Post('seizures')
  @HttpCode(HttpStatus.CREATED)
  async addSeizureLog(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
    @Body() createSeizureLogDto: CreateSeizureLogDto,
  ): Promise<SeizureLog> {
    createSeizureLogDto.patientId = patientId;
    return this.patientsService.addSeizureLog(user.id, createSeizureLogDto);
  }

  /**
   * Get a patient's seizure log history
   */
  @Get('seizures')
  async getPatientSeizureLogs(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
  ): Promise<SeizureLog[]> {
    return this.patientsService.getPatientSeizureLogs(
      user.id,
      patientId,
    );
  }

  /**
   * Get a patient's nerve conduction study history
   */
  @Get('ncs-studies')
  async getPatientNcsStudies(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
  ): Promise<NcsStudy[]> {
    return this.patientsService.getPatientNcsStudies(
      user.id,
      patientId,
    );
  }

  @Post('ncs-studies/import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async importNcsStudies(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
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
      patientId,
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
  @Post('ncs-studies')
  @HttpCode(HttpStatus.CREATED)
  async addNcsStudy(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
    @Body() createNcsStudy: CreateNcsStudyDto,
  ): Promise<Patient> {
    return this.patientsService.createNcsStudy(
      user.id,
      patientId,
      createNcsStudy,
    );
  }

  /**
   * Create tourette syndrom information for patient
   *
   * */
  @Post('tourette-syndrome')
  @HttpCode(HttpStatus.CREATED)
  async addTouretteSyndrome(
    @CurrentUser() user: JwtUser,
    @Query('patientId', ParseIntPipe) patientId: number,
    @Body() createTouretteSyndrome: CreateTouretteSyndromeDto,
  ): Promise<Patient> {
    return this.patientsService.createTouretteSyndrome(
      user.id,
      patientId,
      createTouretteSyndrome,
    );
  }

  @Put('tourette-syndrome/:id')
  @HttpCode(HttpStatus.OK)
  async updateTouretteSyndrome(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('patientId', ParseIntPipe) patientId: number,
    @Body() updateData: UpdateTouretteSyndromeDto,
  ): Promise<Patient> {
    return this.patientsService.updateTouretteSyndrome(
      user.id,
      patientId,
      id,
      updateData,
    );
  }

  @Get(':id')
  async getPatient(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) patientId: number,
  ): Promise<Patient> {
    return this.patientsService.getPatient(user.id, patientId);
  }
}
