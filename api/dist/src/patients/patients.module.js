"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const patients_controller_1 = require("./patients.controller");
const patients_service_1 = require("./patients.service");
const patient_entity_1 = require("./entities/patient.entity");
const patient_history_entity_1 = require("./entities/patient-history.entity");
const family_history_entity_1 = require("./entities/family-history.entity");
const user_entity_1 = require("../auth/entites/user.entity");
const user_module_1 = require("../user/user.module");
let PatientsModule = class PatientsModule {
};
exports.PatientsModule = PatientsModule;
exports.PatientsModule = PatientsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([patient_entity_1.Patient, patient_history_entity_1.PatientHistory, family_history_entity_1.FamilyHistory, user_entity_1.User]),
            user_module_1.UserModule,
        ],
        controllers: [patients_controller_1.PatientsController],
        providers: [patients_service_1.PatientsService],
        exports: [patients_service_1.PatientsService],
    })
], PatientsModule);
//# sourceMappingURL=patients.module.js.map