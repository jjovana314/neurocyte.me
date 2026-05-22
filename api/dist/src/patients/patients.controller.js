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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("./decorators/roles.guard");
const patients_service_1 = require("./patients.service");
const dtos_1 = require("./dtos");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const jwt_user_class_1 = require("../auth/classes/jwt-user.class");
const multipart_file_class_1 = require("../common/classes/multipart-file.class");
let PatientsController = class PatientsController {
    constructor(patientsService) {
        this.patientsService = patientsService;
    }
    async createPatient(user, createPatientDto) {
        return this.patientsService.createPatient(user.id, createPatientDto);
    }
    async getMyPatients(user) {
        return this.patientsService.getDoctorPatients(user.id);
    }
    async exportCsv(user) {
        return this.patientsService.exportPatientDataCsv(user.id);
    }
    async exportPatientPdf(user, patientId) {
        const buffer = await this.patientsService.exportPatientPdf(user.id, parseInt(patientId, 10));
        return new common_1.StreamableFile(buffer);
    }
    async importCsv(user, file) {
        return this.patientsService.importCsvData(user.id, file.buffer);
    }
    async getPatient(user, patientId) {
        return this.patientsService.getPatient(user.id, parseInt(patientId, 10));
    }
    async updatePatientNotes(user, patientId, body) {
        return this.patientsService.updatePatientNotes(user.id, parseInt(patientId, 10), body.notes);
    }
    async deletePatient(user, patientId) {
        return this.patientsService.deletePatient(user.id, parseInt(patientId, 10));
    }
    async addPatientHistory(user, patientId, createHistoryDto) {
        createHistoryDto.patientId = parseInt(patientId, 10);
        return this.patientsService.addPatientHistory(user.id, createHistoryDto);
    }
    async getPatientHistory(user, patientId) {
        return this.patientsService.getPatientMedicalHistory(user.id, parseInt(patientId, 10));
    }
    async addFamilyHistory(user, patientId, createFamilyHistoryDto) {
        createFamilyHistoryDto.patientId = parseInt(patientId, 10);
        return this.patientsService.addFamilyHistory(user.id, createFamilyHistoryDto);
    }
    async getPatientFamilyHistory(user, patientId) {
        return this.patientsService.getPatientFamilyHistory(user.id, parseInt(patientId, 10));
    }
};
exports.PatientsController = PatientsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser,
        dtos_1.CreatePatientDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "createPatient", null);
__decorate([
    (0, common_1.Get)('my-patients'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getMyPatients", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Header)('Content-Type', 'text/csv'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="patient_export.csv"'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)(':id/export/pdf'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.Header)('Content-Type', 'application/pdf'),
    (0, common_1.Header)('Content-Disposition', 'attachment; filename="patient-report.pdf"'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "exportPatientPdf", null);
__decorate([
    (0, common_1.Post)('import/csv'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [new common_1.FileTypeValidator({ fileType: 'text/csv' })],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser,
        multipart_file_class_1.MultipartFile]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getPatient", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String, dtos_1.UpdatePatientNotesDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "updatePatientNotes", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "deletePatient", null);
__decorate([
    (0, common_1.Post)(':id/history'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String, dtos_1.CreatePatientHistoryDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "addPatientHistory", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getPatientHistory", null);
__decorate([
    (0, common_1.Post)(':id/family-history'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String, dtos_1.CreateFamilyHistoryDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "addFamilyHistory", null);
__decorate([
    (0, common_1.Get)(':id/family-history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jwt_user_class_1.JwtUser, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getPatientFamilyHistory", null);
exports.PatientsController = PatientsController = __decorate([
    (0, common_1.Controller)('patients'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [patients_service_1.PatientsService])
], PatientsController);
//# sourceMappingURL=patients.controller.js.map