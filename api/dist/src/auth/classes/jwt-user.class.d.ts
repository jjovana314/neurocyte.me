export declare class JwtUserRole {
    id: number;
    name: string;
}
export declare class JwtUser {
    id: number;
    email: string;
    role: JwtUserRole;
}
