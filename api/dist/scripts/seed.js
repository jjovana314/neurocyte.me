"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
const typeorm_1 = require("typeorm");
const role_entity_1 = require("../src/auth/entites/role.entity");
const action_entity_1 = require("../src/auth/entites/action.entity");
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DATABASE_URL,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [role_entity_1.Role, action_entity_1.Action],
    synchronize: false,
});
const rolesData = [
    {
        name: 'Doctor',
        actions: [
            'create_patient',
            'update_patient',
            'delete_patient',
            'view_patient',
            'upload_medical_document',
            'download_medical_document',
            'generate_report',
            'access_medical_devices',
            'update_own_profile',
        ],
    },
    {
        name: 'Support Engineer',
        actions: [
            'create_user',
            'update_user',
            'delete_user',
            'assign_roles',
            'manage_api_access',
            'view_system_logs',
        ],
    },
    {
        name: 'admin',
        actions: [
            'create_user',
            'update_user',
            'delete_user',
            'assign_roles',
            'manage_api_access',
            'view_system_logs',
            'create_patient',
            'update_patient',
            'delete_patient',
            'view_patient',
            'generate_report',
        ],
    },
];
async function seed() {
    await AppDataSource.initialize();
    console.log('Connected to database.');
    const roleRepo = AppDataSource.getRepository(role_entity_1.Role);
    const actionRepo = AppDataSource.getRepository(action_entity_1.Action);
    for (const roleData of rolesData) {
        let role = await roleRepo.findOne({ where: { name: roleData.name } });
        if (!role) {
            role = roleRepo.create({ name: roleData.name });
            role = await roleRepo.save(role);
            console.log(`Created role: ${role.name}`);
        }
        else {
            console.log(`Role already exists, skipping: ${role.name}`);
        }
        for (const actionName of roleData.actions) {
            const exists = await actionRepo.findOne({
                where: { name: actionName, roleName: role.name },
            });
            if (!exists) {
                const action = actionRepo.create({ name: actionName, roleName: role.name });
                await actionRepo.save(action);
                console.log(`  Created action: ${actionName} -> ${role.name}`);
            }
            else {
                console.log(`  Action already exists, skipping: ${actionName} -> ${role.name}`);
            }
        }
    }
    console.log('Seeding complete.');
    await AppDataSource.destroy();
}
seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map