import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { Role } from '../src/auth/entites/role.entity';
import { Action } from '../src/auth/entites/action.entity';
import { RoleEnum } from '../src/auth/enums/role.enum';
import { IRoleSeed } from '../src/auth/interfaces/roles.interface';
import rolesJson from '../src/auth/resources/roles.json';

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

const rolesData = (rolesJson as { roles: IRoleSeed[] }).roles;

// Fail fast if roles.json names a role the code doesn't know about - every
// role check in the services goes through RoleEnum.
const knownRoles = Object.values(RoleEnum) as string[];
for (const role of rolesData) {
  if (!knownRoles.includes(role.name)) {
    throw new Error(
      `Unknown role "${role.name}" in roles.json - add it to RoleEnum first.`,
    );
  }
}

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
        const action = actionRepo.create({
          name: actionName,
          roleName: role.name,
        });
        await actionRepo.save(action);
        console.log(`  Created action: ${actionName} -> ${role.name}`);
      } else {
        console.log(
          `  Action already exists, skipping: ${actionName} -> ${role.name}`,
        );
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
