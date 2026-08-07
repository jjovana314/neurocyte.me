import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { ClientGrpc } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { firstValueFrom } from 'rxjs';
import { errorHandler } from './decorators/error-handler-decorator';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory, DiseaseType } from './entities/family-history.entity';
import { EdssAssesment } from './entities/edss-assesment.entity';
import { MigraineLog } from './entities/migraine-log.entity';
import {
  SeizureLog,
  OnsetVector,
  MotorFeature,
  SeizureTrigger,
} from './entities/seizure-log.entity';
import { NcsStudy, NcsStudyType } from './entities/ncs-study.entity';
import { User } from 'src/auth/entites/user.entity';
import PDFDocument from 'pdfkit';
import {
  CreatePatientDto,
  CreatePatientHistoryDto,
  CreateFamilyHistoryDto,
  CreateMigraineLogDto,
  CreateSeizureLogDto,
  CreateNcsStudyDto,
  EdssAssessmentDataDto,
  ImportCsvResponseDto,
  UpdatePatientNotesDto,
} from './dtos';
import { maskString } from './utils/masking';
import {
  CALCULATOR_SERVICE_NAME,
  CalculatorServiceClient,
  NcsResponse,
  StudyType as GrpcStudyType,
} from 'src/calculator-client/generated/calculator';
import {
  PatientCreateForbiddenException,
  UserNotFoundException,
  PatientNotFoundException,
  AccessToPatientForbiddenException,
} from 'src/common/exceptions';
import { dateValidation } from './utils/validation';
import { SearchPatientDto } from './dtos/search-patient.dto';
import { PatientSearchResult } from './interfaces/search-result.interface';

@Injectable()
export class PatientsService implements OnModuleInit {
  private calculatorService: CalculatorServiceClient;

  constructor(
    @InjectRepository(Patient) private patientRepository: Repository<Patient>,
    @InjectRepository(PatientHistory)
    private patientHistoryRepository: Repository<PatientHistory>,
    @InjectRepository(FamilyHistory)
    private familyHistoryRepository: Repository<FamilyHistory>,
    @InjectRepository(EdssAssesment)
    private edssAssessmentRepository: Repository<EdssAssesment>,
    @InjectRepository(MigraineLog)
    private migraineLogRepository: Repository<MigraineLog>,
    @InjectRepository(SeizureLog)
    private seizureLogRepository: Repository<SeizureLog>,
    @InjectRepository(NcsStudy)
    private ncsStudyRepository: Repository<NcsStudy>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly logger: PinoLogger,
    @Inject('CALCULATOR_PACKAGE') private readonly calculatorClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.calculatorService =
      this.calculatorClient.getService<CalculatorServiceClient>(
        CALCULATOR_SERVICE_NAME,
      );
  }

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
    const dateOfBirth = dateValidation(
      createPatientDto.dateOfBirth,
      'dateOfBirth',
    );

    // Build (and validate) any embedded initial records before saving the
    // patient, so an invalid one fails before persisting anything.
    const edssAssessment = createPatientDto.edss
      ? await this.buildEdssAssessment(createPatientDto.edss)
      : undefined;
    const migraineLog = createPatientDto.migraineLog
      ? this.buildMigraineLog(createPatientDto.migraineLog)
      : undefined;
    const seizureLog = createPatientDto.seizureLog
      ? this.buildSeizureLog(createPatientDto.seizureLog)
      : undefined;

    const patient = new Patient();
    patient.doctor = doctor;
    patient.name = createPatientDto.name;
    patient.dateOfBirth = dateOfBirth;
    patient.gender = createPatientDto.gender;
    patient.phone = createPatientDto.phone || null;
    patient.email = createPatientDto.email || null;
    patient.notes = createPatientDto.notes;

    const savedPatient = await this.patientRepository.save(patient);
    this.logger.info(
      `Patient record ${savedPatient.id} created by doctor ${doctorId}`,
    );

    if (edssAssessment) {
      edssAssessment.patientId = savedPatient.id;
      await this.edssAssessmentRepository.save(edssAssessment);
    }

    if (migraineLog) {
      migraineLog.patientId = savedPatient.id;
      await this.migraineLogRepository.save(migraineLog);
      this.logger.info(`Migraine log added to patient ${savedPatient.id}`);
    }

    if (seizureLog) {
      seizureLog.patientId = savedPatient.id;
      await this.seizureLogRepository.save(seizureLog);
      this.logger.info(`Seizure log added to patient ${savedPatient.id}`);
    }

    return savedPatient;
  }

  // Free-text search bar: matches a single query term against name, email
  // and phone with OR semantics (any field matching is a hit), scoped to
  // the requesting doctor's own patients unless they're a Support Engineer.
  @errorHandler
  async search(
    doctorId: number,
    roleName: string,
    searchPatient: SearchPatientDto,
  ): Promise<PatientSearchResult> {
    const page =
      searchPatient.options?.page && searchPatient.options.page > 0
        ? searchPatient.options.page
        : 1;
    const pageSize =
      searchPatient.options?.pageSize && searchPatient.options.pageSize > 0
        ? searchPatient.options.pageSize
        : 20;

    const qb = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.medicalHistory', 'medicalHistory')
      .leftJoinAndSelect('patient.familyHistory', 'familyHistory')
      .leftJoinAndSelect('patient.edssAssessments', 'edssAssessments')
      .leftJoinAndSelect('patient.migraineLogs', 'migraineLogs')
      .leftJoinAndSelect('patient.seizureLogs', 'seizureLogs')
      .leftJoinAndSelect('patient.ncsStudies', 'ncsStudies');

    if (roleName !== 'Support Engineer') {
      qb.andWhere('patient.doctorId = :doctorId', { doctorId });
    }

    const term = searchPatient.query?.trim();
    if (term) {
      qb.andWhere(
        new Brackets((qb2) => {
          qb2
            .where('patient.name LIKE :term', { term: `%${term}%` })
            .orWhere('patient.email LIKE :term', { term: `%${term}%` })
            .orWhere('patient.phone LIKE :term', { term: `%${term}%` });

          const numericId = Number(term);
          if (Number.isInteger(numericId)) {
            qb2.orWhere('patient.id = :id', { id: numericId });
          }
        }),
      );
    }

    const sortColumn = this.resolveSearchSortColumn(
      searchPatient.options?.sortBy,
    );
    const sortOrder = searchPatient.options?.order === 'ASC' ? 'ASC' : 'DESC';

    const [patients, total] = await qb
      .orderBy(`patient.${sortColumn}`, sortOrder)
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    this.logger.info(
      `Patient search by user ${doctorId} (role: ${roleName}): "${term ?? ''}" matched ${total} result(s)`,
    );

    return { patients, total };
  }

  // orderBy() takes a raw column name, so the sort field must come from an
  // allowlist rather than being interpolated directly from user input.
  private resolveSearchSortColumn(sort?: string): string {
    const allowedColumns = [
      'name',
      'email',
      'createdAt',
      'updatedAt',
      'dateOfBirth',
    ];
    return sort && allowedColumns.includes(sort) ? sort : 'createdAt';
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
  async addMigraineLog(
    doctorId: number,
    createMigraineLogDto: CreateMigraineLogDto,
  ): Promise<MigraineLog> {
    // Verify patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: createMigraineLogDto.patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(createMigraineLogDto.patientId);
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${createMigraineLogDto.patientId} created by doctor ${patient.doctorId}`,
      );
      throw new AccessToPatientForbiddenException();
    }

    const migraineLog = this.buildMigraineLog(createMigraineLogDto);
    migraineLog.patientId = createMigraineLogDto.patientId;

    const savedMigraineLog = await this.migraineLogRepository.save(migraineLog);
    this.logger.info(
      `Migraine log added to patient ${createMigraineLogDto.patientId}`,
    );

    return savedMigraineLog;
  }

  @errorHandler
  async getPatientMigraineLogs(
    doctorId: number,
    patientId: number,
  ): Promise<MigraineLog[]> {
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

    return this.migraineLogRepository.find({
      where: { patientId },
      order: { occurredAt: 'DESC' },
    });
  }

  @errorHandler
  async addSeizureLog(
    doctorId: number,
    createSeizureLogDto: CreateSeizureLogDto,
  ): Promise<SeizureLog> {
    // Verify patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: createSeizureLogDto.patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(createSeizureLogDto.patientId);
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${createSeizureLogDto.patientId} created by doctor ${patient.doctorId}`,
      );
      throw new AccessToPatientForbiddenException();
    }

    const seizureLog = this.buildSeizureLog(createSeizureLogDto);
    seizureLog.patientId = createSeizureLogDto.patientId;

    const savedSeizureLog = await this.seizureLogRepository.save(seizureLog);
    this.logger.info(
      `Seizure log added to patient ${createSeizureLogDto.patientId}`,
    );

    return savedSeizureLog;
  }

  @errorHandler
  async getPatientSeizureLogs(
    doctorId: number,
    patientId: number,
  ): Promise<SeizureLog[]> {
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

    return this.seizureLogRepository.find({
      where: { patientId },
      order: { ictusStart: 'DESC' },
    });
  }

  @errorHandler
  async addNcsStudy(
    doctorId: number,
    createNcsStudyDto: CreateNcsStudyDto,
  ): Promise<NcsStudy> {
    // Verify patient exists
    const patient = await this.patientRepository.findOne({
      where: { id: createNcsStudyDto.patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(createNcsStudyDto.patientId);
    }

    // Verify that the requester is the doctor who created this patient
    if (patient.doctorId !== doctorId) {
      this.logger.warn(
        `Doctor ${doctorId} attempted to access patient ${createNcsStudyDto.patientId} created by doctor ${patient.doctorId}`,
      );
      throw new AccessToPatientForbiddenException();
    }

    const ncsStudy = await this.buildNcsStudy(createNcsStudyDto);
    ncsStudy.patientId = createNcsStudyDto.patientId;

    const savedNcsStudy = await this.ncsStudyRepository.save(ncsStudy);
    this.logger.info(
      `NCS study (${createNcsStudyDto.nerveName}) added to patient ${createNcsStudyDto.patientId}`,
    );

    return savedNcsStudy;
  }

  @errorHandler
  async getPatientNcsStudies(
    doctorId: number,
    patientId: number,
  ): Promise<NcsStudy[]> {
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

    return this.ncsStudyRepository.find({
      where: { patientId },
      order: { recordedAt: 'DESC' },
    });
  }

  // Each CSV row is sent through the same calculator path as a manually
  // entered study - rows that fail validation or calculation are recorded
  // as errors rather than aborting the whole import.
  @errorHandler
  async importNcsStudiesCsv(
    doctorId: number,
    patientId: number,
    fileBuffer: Buffer,
  ): Promise<ImportCsvResponseDto> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
    });
    if (!patient) {
      throw new PatientNotFoundException(patientId);
    }
    if (patient.doctorId !== doctorId) {
      throw new AccessToPatientForbiddenException();
    }

    const lines = fileBuffer
      .toString('utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const result = new ImportCsvResponseDto();
    result.imported = 0;
    result.skipped = 0;
    result.errors = [];

    if (lines.length < 2) {
      result.errors.push({
        row: 0,
        reason: 'CSV file is empty or has no data rows',
      });
      return result;
    }

    const dataRows = lines.slice(1);

    for (const [i, row] of dataRows.entries()) {
      const rowNum = i + 2;
      const dto = this.parseNcsStudyCsvRow(row);
      if (!dto) {
        result.skipped++;
        result.errors.push({
          row: rowNum,
          reason:
            'Missing or invalid required field(s): nerveName, studyType (MOTOR/SENSORY), distanceMm, distalLatencyMs, distalAmplitude',
        });
        continue;
      }

      try {
        const ncsStudy = await this.buildNcsStudy(dto);
        ncsStudy.patientId = patientId;
        await this.ncsStudyRepository.save(ncsStudy);
        result.imported++;
      } catch (err) {
        result.skipped++;
        result.errors.push({
          row: rowNum,
          reason: `Failed to import NCS study (nerve: ${dto.nerveName}): ${(err as Error).message}`,
        });
      }
    }

    this.logger.info(
      `NCS CSV import for patient ${patientId} by doctor ${doctorId}: ${result.imported} studies imported, ${result.skipped} rows skipped`,
    );

    return result;
  }

  // Expected columns (header row is skipped, not validated by name):
  // nerveName,studyType,distanceMm,distalLatencyMs,distalAmplitude,
  // distalDurationMs,proximalLatencyMs,proximalAmplitude,proximalDurationMs,
  // skinTemperatureCelsius
  private parseNcsStudyCsvRow(
    line: string,
  ): Omit<CreateNcsStudyDto, 'patientId'> | null {
    const cols = this.parseCsvLine(line);
    const nerveName = cols[0]?.trim() ?? '';
    const studyTypeRaw = cols[1]?.trim().toUpperCase() ?? '';
    const distanceMm = parseFloat(cols[2]);
    const distalLatencyMs = parseFloat(cols[3]);
    const distalAmplitude = parseFloat(cols[4]);

    if (
      !nerveName ||
      (studyTypeRaw !== NcsStudyType.MOTOR &&
        studyTypeRaw !== NcsStudyType.SENSORY) ||
      isNaN(distanceMm) ||
      isNaN(distalLatencyMs) ||
      isNaN(distalAmplitude)
    ) {
      return null;
    }

    const distalDurationMs = parseFloat(cols[5]);
    const proximalLatencyMs = parseFloat(cols[6]);
    const proximalAmplitude = parseFloat(cols[7]);
    const proximalDurationMs = parseFloat(cols[8]);
    const skinTemperatureCelsius = parseFloat(cols[9]);

    const dto: Omit<CreateNcsStudyDto, 'patientId'> = {
      nerveName,
      studyType: studyTypeRaw as NcsStudyType,
      distanceMm,
      distalSite: {
        latencyMs: distalLatencyMs,
        amplitude: distalAmplitude,
        durationMs: isNaN(distalDurationMs) ? undefined : distalDurationMs,
      },
    };

    if (!isNaN(proximalLatencyMs) && !isNaN(proximalAmplitude)) {
      dto.proximalSite = {
        latencyMs: proximalLatencyMs,
        amplitude: proximalAmplitude,
        durationMs: isNaN(proximalDurationMs) ? undefined : proximalDurationMs,
      };
    }

    if (!isNaN(skinTemperatureCelsius)) {
      dto.skinTemperatureCelsius = skinTemperatureCelsius;
    }

    return dto;
  }

  // Sends the raw electrophysiological measurements to the calculator
  // service and stores both the input and the derived diagnostic result -
  // the client never supplies the derived fields directly.
  private async buildNcsStudy(
    dto: Omit<CreateNcsStudyDto, 'patientId'>,
  ): Promise<NcsStudy> {
    const grpcStudyType =
      dto.studyType === NcsStudyType.MOTOR
        ? GrpcStudyType.MOTOR
        : GrpcStudyType.SENSORY;

    let response: NcsResponse;

    // todo: fix this, add error handler and parser for errors from other service
    try {
      response = await firstValueFrom(
        this.calculatorService.calculateNcs({
          nerveName: dto.nerveName,
          studyType: grpcStudyType,
          distanceMm: dto.distanceMm,
          distalSite: {
            latencyMs: dto.distalSite.latencyMs,
            amplitude: dto.distalSite.amplitude,
            durationMs: dto.distalSite.durationMs,
          },
          proximalSite: dto.proximalSite
            ? {
                latencyMs: dto.proximalSite.latencyMs,
                amplitude: dto.proximalSite.amplitude,
                durationMs: dto.proximalSite.durationMs,
              }
            : undefined,
          skinTemperatureCelsius: dto.skinTemperatureCelsius,
        }),
      );
    } catch (error) {
      if (error?.code === GrpcStatus.INVALID_ARGUMENT) {
        throw new BadRequestException(error.details);
      }
      throw error;
    }

    const ncsStudy = new NcsStudy();
    ncsStudy.nerveName = dto.nerveName;
    ncsStudy.studyType = dto.studyType;
    ncsStudy.distanceMm = dto.distanceMm;
    ncsStudy.distalLatencyMs = dto.distalSite.latencyMs;
    ncsStudy.distalAmplitude = dto.distalSite.amplitude;
    ncsStudy.distalDurationMs = dto.distalSite.durationMs ?? null;
    ncsStudy.proximalLatencyMs = dto.proximalSite?.latencyMs ?? null;
    ncsStudy.proximalAmplitude = dto.proximalSite?.amplitude ?? null;
    ncsStudy.proximalDurationMs = dto.proximalSite?.durationMs ?? null;
    ncsStudy.skinTemperatureCelsius = dto.skinTemperatureCelsius ?? null;
    ncsStudy.conductionVelocityMPerS = response.conductionVelocityMPerS ?? null;
    ncsStudy.amplitudeDropPercent = response.amplitudeDropPercent ?? null;
    ncsStudy.temporalDispersionPercent =
      response.temporalDispersionPercent ?? null;
    ncsStudy.isNormal = response.isNormal;
    ncsStudy.axonalLoss = response.axonalLoss;
    ncsStudy.demyelination = response.demyelination;
    ncsStudy.conductionBlock = response.conductionBlock;
    ncsStudy.diagnosticSummary = response.diagnosticSummary;

    return ncsStudy;
  }

  @errorHandler
  async getPatient(doctorId: number, patientId: number): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id: patientId },
      relations: [
        'medicalHistory',
        'familyHistory',
        'edssAssessments',
        'migraineLogs',
        'seizureLogs',
        'ncsStudies',
        'doctor',
      ],
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
  private async buildEdssAssessment(
    data: EdssAssessmentDataDto,
  ): Promise<EdssAssesment> {
    const ambulation = {
      unassistedWalkingDistanceMeters: data.unassistedWalkingDistanceMeters,
      requiresUnilateralAid: data.requiresUnilateralAid || false,
      requiresBilateralAid: data.requiresBilateralAid || false,
      wheelchairBound: data.wheelchairBound || false,
    };

    let totalScore: number;

    // todo: fix this, add error handler and parser for errors from other service
    try {
      const response = await firstValueFrom(
        this.calculatorService.calculateEdss({
          pyramidalSystem: data.pyramidalSystem,
          cerebellarSystem: data.cerebellarSystem,
          brainstemSystem: data.brainstemSystem,
          sensorySystem: data.sensorySystem,
          bowelBladderSystem: data.bowelBladderSystem,
          visualSystem: data.visualSystem,
          mentalSystem: data.mentalSystem,
          ...ambulation,
        }),
      );
      totalScore = response.totalScore;
    } catch (error) {
      if (error?.code === GrpcStatus.INVALID_ARGUMENT) {
        throw new BadRequestException(error.details);
      }
      throw error;
    }

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

  // Validates and constructs a migraine log entry without persisting it or
  // touching patientId, so it can be validated before a patient save
  // (createPatient) or attached to an existing patient (addMigraineLog).
  private buildMigraineLog(
    dto: Omit<CreateMigraineLogDto, 'patientId'>,
  ): MigraineLog {
    const date = dateValidation(dto.occurredAt, 'occurredAt', true);
    if (
      dto.painSeverity == null ||
      !Number.isInteger(dto.painSeverity) ||
      dto.painSeverity < 1 ||
      dto.painSeverity > 10
    ) {
      throw new BadRequestException(
        'Pain severity is required and must be an integer between 1 and 10',
      );
    }

    const migraineLog = new MigraineLog();
    migraineLog.occurredAt = date;
    migraineLog.durationMinutes = dto.durationMinutes ?? null;
    migraineLog.painSeverity = dto.painSeverity;
    migraineLog.auraPresent = dto.auraPresent || false;
    migraineLog.triggers = dto.triggers || '';
    migraineLog.symptoms = dto.symptoms || '';
    migraineLog.medicationTaken = dto.medicationTaken || '';
    migraineLog.notes = dto.notes || '';

    return migraineLog;
  }

  // Validates and constructs a seizure log entry without persisting it or
  // touching patientId, so it can be validated before a patient save
  // (createPatient) or attached to an existing patient (addSeizureLog).
  private buildSeizureLog(
    dto: Omit<CreateSeizureLogDto, 'patientId'>,
  ): SeizureLog {
    if (!Object.values(OnsetVector).includes(dto.onsetVector)) {
      throw new BadRequestException(
        'onsetVector is required and must be one of FOCAL_AWARE, FOCAL_IMPAIRED_AWARENESS, GENERALIZED',
      );
    }
    if (!dto.ictusStart || !dto.ictusEnd) {
      throw new BadRequestException('ictusStart and ictusEnd are required');
    }

    const ictusStart = new Date(dto.ictusStart);
    const ictusEnd = new Date(dto.ictusEnd);
    if (
      Number.isNaN(ictusStart.getTime()) ||
      Number.isNaN(ictusEnd.getTime())
    ) {
      throw new BadRequestException(
        'ictusStart and ictusEnd must be valid dates',
      );
    }
    if (ictusStart.getTime() > Date.now() || ictusEnd.getTime() > Date.now()) {
      throw new BadRequestException(
        'ictusStart and ictusEnd cannot be in the future',
      );
    }
    if (ictusEnd.getTime() < ictusStart.getTime()) {
      throw new BadRequestException('ictusEnd must not be before ictusStart');
    }

    const motorFeatures = dto.motorFeatures || [];
    if (motorFeatures.some((f) => !Object.values(MotorFeature).includes(f))) {
      throw new BadRequestException(
        'motorFeatures may only contain TONIC, CLONIC, ATONIC, AUTOMATISMS',
      );
    }

    const triggers = dto.triggers || [];
    if (triggers.some((t) => !Object.values(SeizureTrigger).includes(t))) {
      throw new BadRequestException(
        'triggers may only contain SLEEP_DEPRIVATION, MISSED_DOSE, HIGH_STRESS, ILLNESS',
      );
    }

    if (
      dto.postictalDurationMinutes != null &&
      (!Number.isInteger(dto.postictalDurationMinutes) ||
        dto.postictalDurationMinutes < 0)
    ) {
      throw new BadRequestException(
        'postictalDurationMinutes must be a non-negative integer',
      );
    }

    const seizureLog = new SeizureLog();
    seizureLog.onsetVector = dto.onsetVector;
    seizureLog.motorFeatures = motorFeatures;
    seizureLog.ictusStart = ictusStart;
    seizureLog.ictusEnd = ictusEnd;
    seizureLog.ictusDurationSeconds = Math.round(
      (ictusEnd.getTime() - ictusStart.getTime()) / 1000,
    );
    seizureLog.postictalDurationMinutes = dto.postictalDurationMinutes ?? null;
    seizureLog.triggers = triggers;
    seizureLog.notes = dto.notes || '';

    return seizureLog;
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
    // assessment doesn't let the notes update partially apply.
    const edssAssessment = updatePatientDto.edss
      ? await this.buildEdssAssessment(updatePatientDto.edss)
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
    await this.migraineLogRepository.delete({ patientId });
    await this.seizureLogRepository.delete({ patientId });
    await this.ncsStudyRepository.delete({ patientId });
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
        [
          'Date of Birth',
          patient.dateOfBirth ? patient.dateOfBirth.toDateString() : 'N/A',
        ],
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
