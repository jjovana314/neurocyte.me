export interface IRoles {
  roles: IRole[];
}

export interface IRole {
  name: string;
}

// Shape of each entry in src/auth/resources/roles.json, used by scripts/seed.ts.
export interface IRoleSeed {
  name: string;
  actions: string[];
}
