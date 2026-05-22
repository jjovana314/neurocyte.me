import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Role } from '../src/auth/entites/role.entity';
import { Action } from '../src/auth/entites/action.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_URL,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Role, Action],
  synchronize: false,
});

const rolesData: { name: string; actions: string[] }[] = [
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

  const roleRepo = AppDataSource.getRepository(Role);
  const actionRepo = AppDataSource.getRepository(Action);

  for (const roleData of rolesData) {
    let role = await roleRepo.findOne({ where: { name: roleData.name } });

    if (!role) {
      role = roleRepo.create({ name: roleData.name });
      role = await roleRepo.save(role);
      console.log(`Created role: ${role.name}`);
    } else {
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
      } else {
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
