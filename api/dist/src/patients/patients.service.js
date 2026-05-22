"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nestjs_pino_1 = require("nestjs-pino");
const validatieon_decorator_1 = require("./decorators/validatieon-decorator");
const patient_entity_1 = require("./entities/patient.entity");
const patient_history_entity_1 = require("./entities/patient-history.entity");
const family_history_entity_1 = require("./entities/family-history.entity");
const user_entity_1 = require("../auth/entites/user.entity");
const pdfkit_1 = __importDefault(require("pdfkit"));
const dtos_1 = require("./dtos");
let PatientsService = class PatientsService {
    constructor(patientRepository, patientHistoryRepository, familyHistoryRepository, userRepository, logger) {
        this.patientRepository = patientRepository;
        this.patientHistoryRepository = patientHistoryRepository;
        this.familyHistoryRepository = familyHistoryRepository;
        this.userRepository = userRepository;
        this.logger = logger;
    }
    async createPatient(doctorId, createPatientDto) {
        const doctor = await this.userRepository.findOne({
            where: { id: doctorId },
            relations: ['role'],
        });
        this.logger.info(`Doctor: ${JSON.stringify(doctor)}`);
        if (!doctor) {
            throw new common_1.NotFoundException(`Doctor with ID ${doctorId} not found`);
        }
        if (!doctor.role || doctor.role.id !== 1) {
            this.logger.warn(`User ${doctorId} attempted to create patient without doctor role`);
            throw new common_1.ForbiddenException('Only doctors can create patient records');
        }
        const patient = new patient_entity_1.Patient();
        patient.doctorId = doctorId;
        patient.name = createPatientDto.name || '';
        patient.notes = createPatientDto.notes || '';
        const savedPatient = await this.patientRepository.save(patient);
        this.logger.info(`Patient record ${savedPatient.id} created by doctor ${doctorId}`);
        return savedPatient;
    }
    async addPatientHistory(doctorId, createHistoryDto) {
        const patient = await this.patientRepository.findOne({
            where: { id: createHistoryDto.patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${createHistoryDto.patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            this.logger.warn(`Doctor ${doctorId} attempted to access patient ${createHistoryDto.patientId} created by doctor ${patient.doctorId}`);
            throw new common_1.ForbiddenException('You can only add history to patients you created');
        }
        if (!createHistoryDto.disorder) {
            throw new common_1.BadRequestException('Disorder field is required');
        }
        const history = new patient_history_entity_1.PatientHistory();
        history.patientId = createHistoryDto.patientId;
        history.disorder = createHistoryDto.disorder;
        history.description = createHistoryDto.description || '';
        history.diagnosisDate = createHistoryDto.diagnosisDate || null;
        history.severity = createHistoryDto.severity || 'moderate';
        history.medications = createHistoryDto.medications || '';
        const savedHistory = await this.patientHistoryRepository.save(history);
        this.logger.info(`History record added to patient ${createHistoryDto.patientId}: ${createHistoryDto.disorder}`);
        return savedHistory;
    }
    async addFamilyHistory(doctorId, createFamilyHistoryDto) {
        const patient = await this.patientRepository.findOne({
            where: { id: createFamilyHistoryDto.patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${createFamilyHistoryDto.patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            this.logger.warn(`Doctor ${doctorId} attempted to access patient ${createFamilyHistoryDto.patientId}`);
            throw new common_1.ForbiddenException('You can only add family history to patients you created');
        }
        if (!createFamilyHistoryDto.diseaseType) {
            throw new common_1.BadRequestException('Disease type is required');
        }
        if (!createFamilyHistoryDto.relation) {
            throw new common_1.BadRequestException('Relation is required (e.g., Mother, Father, Sibling)');
        }
        const familyHistory = new family_history_entity_1.FamilyHistory();
        familyHistory.patientId = createFamilyHistoryDto.patientId;
        familyHistory.diseaseType = createFamilyHistoryDto.diseaseType;
        familyHistory.relation = createFamilyHistoryDto.relation;
        familyHistory.severity = createFamilyHistoryDto.severity || 'moderate';
        familyHistory.notes = createFamilyHistoryDto.notes || '';
        const savedFamilyHistory = await this.familyHistoryRepository.save(familyHistory);
        this.logger.info(`Family history added to patient ${createFamilyHistoryDto.patientId}: ${createFamilyHistoryDto.diseaseType}`);
        return savedFamilyHistory;
    }
    async getPatient(doctorId, patientId) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
            relations: ['medicalHistory', 'familyHistory', 'doctor'],
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            this.logger.warn(`Doctor ${doctorId} attempted to access patient ${patientId} created by doctor ${patient.doctorId}`);
            throw new common_1.ForbiddenException('You can only view patients you created');
        }
        return patient;
    }
    async getDoctorPatients(doctorId) {
        const patients = await this.patientRepository.find({
            where: { doctorId },
            relations: ['medicalHistory', 'familyHistory'],
            order: { createdAt: 'DESC' },
        });
        this.logger.info(`Retrieved ${patients.length} patients for doctor ${doctorId}`);
        return patients;
    }
    async getPatientMedicalHistory(doctorId, patientId) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            throw new common_1.ForbiddenException('You can only view history for patients you created');
        }
        const history = await this.patientHistoryRepository.find({
            where: { patientId },
            order: { recordedAt: 'DESC' },
        });
        return history;
    }
    async getPatientFamilyHistory(doctorId, patientId) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            throw new common_1.ForbiddenException('You can only view family history for patients you created');
        }
        const familyHistory = await this.familyHistoryRepository.find({
            where: { patientId },
            order: { recordedAt: 'DESC' },
        });
        return familyHistory;
    }
    async updatePatientNotes(doctorId, patientId, notes) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            throw new common_1.ForbiddenException('You can only update patients you created');
        }
        patient.notes = notes;
        const updatedPatient = await this.patientRepository.save(patient);
        this.logger.info(`Patient ${patientId} notes updated by doctor ${doctorId}`);
        return updatedPatient;
    }
    async deletePatient(doctorId, patientId) {
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            throw new common_1.ForbiddenException('You can only delete patients you created');
        }
        await this.patientHistoryRepository.delete({ patientId });
        await this.familyHistoryRepository.delete({ patientId });
        await this.patientRepository.delete({ id: patientId });
        this.logger.info(`Patient ${patientId} deleted by doctor ${doctorId}`);
    }
    async exportPatientDataCsv(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const patients = await this.patientRepository.find({
            relations: ['medicalHistory', 'familyHistory'],
        });
        const csvHeader = [];
        csvHeader.push([
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
        ].join(','));
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
        this.logger.info(`Patient data exported to CSV by user ${userId} (role: ${user.role.name})`);
        return [csvHeader.join(','), ...csvHeader].join('\n');
    }
    checkCsvFieldOrEscape(value) {
        if (value == null)
            return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }
    async exportPatientPdf(doctorId, patientId) {
        const doctor = await this.userRepository.findOne({
            where: { id: doctorId },
            relations: ['role'],
        });
        if (!doctor) {
            throw new common_1.NotFoundException(`Doctor with ID ${doctorId} not found`);
        }
        const patient = await this.patientRepository.findOne({
            where: { id: patientId },
            relations: ['medicalHistory', 'familyHistory', 'doctor'],
        });
        if (!patient) {
            throw new common_1.NotFoundException(`Patient with ID ${patientId} not found`);
        }
        if (patient.doctorId !== doctorId) {
            this.logger.warn(`Doctor ${doctorId} attempted to export PDF for patient ${patientId} created by doctor ${patient.doctorId}`);
            throw new common_1.ForbiddenException('You can only export records for patients you created');
        }
        const doc = new pdfkit_1.default({ margin: 50 });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        const pdfBuffer = await new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
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
            const infoRows = [
                ['Patient ID', String(patient.id)],
                ['Patient Name', patient.name || 'N/A'],
                ['Attending Doctor', doctorFullName],
                ['Doctor Email', doctor.email],
                ['Notes', patient.notes || 'None'],
                ['Created At', patient.createdAt.toLocaleString()],
                ['Last Updated', patient.updatedAt.toLocaleString()],
            ];
            for (const [label, value] of infoRows) {
                doc
                    .font('Helvetica-Bold')
                    .text(`${label}: `, { continued: true })
                    .font('Helvetica')
                    .text(value);
            }
            doc.moveDown(1);
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
            }
            else {
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
            }
            else {
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
            doc
                .fontSize(9)
                .fillColor('#888888')
                .text('Confidential – For authorized medical personnel only', 50, doc.page.height - 50, {
                align: 'center',
                width: doc.page.width - 100,
            });
            doc.end();
        });
        this.logger.info(`Patient ${patientId} PDF exported by doctor ${doctorId}`);
        return pdfBuffer;
    }
    async importCsvData(doctorId, fileBuffer) {
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
        const dataRows = lines.slice(1);
        const result = new dtos_1.ImportCsvResponseDto();
        result.imported = 0;
        result.skipped = 0;
        result.errors = [];
        let currentPatient = null;
        for (let i = 0; i < dataRows.length; i++) {
            const rowNum = i + 2;
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
            if (notes) {
                try {
                    const patient = new patient_entity_1.Patient();
                    patient.doctorId = doctorId;
                    patient.notes = notes;
                    currentPatient = await this.patientRepository.save(patient);
                    result.imported++;
                }
                catch (err) {
                    result.skipped++;
                    result.errors.push({
                        row: rowNum,
                        reason: `Failed to create patient: ${err.message}`,
                    });
                    currentPatient = null;
                }
            }
            if (!currentPatient) {
                if (!notes) {
                    result.errors.push({
                        row: rowNum,
                        reason: 'Row skipped: no active patient context (notes column is empty)',
                    });
                    result.skipped++;
                }
                continue;
            }
            if (disorder) {
                try {
                    const history = new patient_history_entity_1.PatientHistory();
                    history.patientId = currentPatient.id;
                    history.disorder = disorder;
                    history.description = description || '';
                    history.diagnosisDate = diagnosisDate || null;
                    history.severity = severity || 'moderate';
                    history.medications = medications || '';
                    await this.patientHistoryRepository.save(history);
                }
                catch (err) {
                    result.errors.push({
                        row: rowNum,
                        reason: `Failed to import medical history (disorder: ${disorder}): ${err.message}`,
                    });
                }
            }
            if (familyDisease && relation) {
                try {
                    const fh = new family_history_entity_1.FamilyHistory();
                    fh.patientId = currentPatient.id;
                    fh.diseaseType = familyDisease;
                    fh.relation = relation;
                    fh.severity = familySeverity || 'moderate';
                    fh.notes = familyNotes || '';
                    await this.familyHistoryRepository.save(fh);
                }
                catch (err) {
                    result.errors.push({
                        row: rowNum,
                        reason: `Failed to import family history (disease: ${familyDisease}): ${err.message}`,
                    });
                }
            }
        }
        this.logger.info(`CSV import by doctor ${doctorId}: ${result.imported} patients imported, ${result.skipped} rows skipped, ${result.errors.length} errors`);
        return result;
    }
    parseCsvLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (line[i + 1] === '"') {
                        current += '"';
                        i++;
                    }
                    else {
                        inQuotes = false;
                    }
                }
                else {
                    current += ch;
                }
            }
            else {
                if (ch === '"') {
                    inQuotes = true;
                }
                else if (ch === ',') {
                    fields.push(current);
                    current = '';
                }
                else {
                    current += ch;
                }
            }
        }
        fields.push(current);
        return fields;
    }
};
exports.PatientsService = PatientsService;
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.CreatePatientDto]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "createPatient", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.CreatePatientHistoryDto]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "addPatientHistory", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dtos_1.CreateFamilyHistoryDto]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "addFamilyHistory", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "getPatient", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "getDoctorPatients", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "getPatientMedicalHistory", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "getPatientFamilyHistory", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "updatePatientNotes", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "deletePatient", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "exportPatientDataCsv", null);
__decorate([
    validatieon_decorator_1.errorHandler,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PatientsService.prototype, "exportPatientPdf", null);
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(patient_entity_1.Patient)),
    __param(1, (0, typeorm_1.InjectRepository)(patient_history_entity_1.PatientHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(family_history_entity_1.FamilyHistory)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        nestjs_pino_1.PinoLogger])
], PatientsService);
//# sourceMappingURL=patients.service.js.map