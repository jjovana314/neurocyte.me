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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyHistory = exports.DiseaseType = void 0;
const typeorm_1 = require("typeorm");
const patient_entity_1 = require("./patient.entity");
var DiseaseType;
(function (DiseaseType) {
    DiseaseType["ALZHEIMER"] = "Alzheimer";
    DiseaseType["PARKINSON"] = "Parkinson";
    DiseaseType["STROKE"] = "Stroke";
    DiseaseType["EPILEPSY"] = "Epilepsy";
    DiseaseType["BRAIN_TUMOR"] = "Brain Tumor";
    DiseaseType["MULTIPLE_SCLEROSIS"] = "Multiple Sclerosis";
})(DiseaseType || (exports.DiseaseType = DiseaseType = {}));
let FamilyHistory = class FamilyHistory {
};
exports.FamilyHistory = FamilyHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FamilyHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], FamilyHistory.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => patient_entity_1.Patient, (patient) => patient.familyHistory, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'patientId' }),
    __metadata("design:type", patient_entity_1.Patient)
], FamilyHistory.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DiseaseType }),
    __metadata("design:type", String)
], FamilyHistory.prototype, "diseaseType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], FamilyHistory.prototype, "relation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", String)
], FamilyHistory.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FamilyHistory.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], FamilyHistory.prototype, "recordedAt", void 0);
exports.FamilyHistory = FamilyHistory = __decorate([
    (0, typeorm_1.Entity)()
], FamilyHistory);
//# sourceMappingURL=family-history.entity.js.map