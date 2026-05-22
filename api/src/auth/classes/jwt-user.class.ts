export class JwtUserRole {
  id: number;
  name: string;
}

export class JwtUser {
  id: number;
  email: string;
  role: JwtUserRole;
}
