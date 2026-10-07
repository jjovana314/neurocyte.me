// Values must match the role names stored in the `role` table (seeded from
// src/auth/resources/roles.json), so don't change them without a migration.
export enum RoleEnum {
  DOCTOR = 'Doctor',
  SUPPORT_ENGINEER = 'Support Engineer',
  ADMIN = 'admin',
}
