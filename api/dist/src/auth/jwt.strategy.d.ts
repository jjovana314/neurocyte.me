import { Strategy } from 'passport-jwt';
import { JwtUser } from './classes/jwt-user.class';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: {
        id: number;
        email: string;
        role: {
            id: number;
            name: string;
        };
    }): Promise<JwtUser>;
}
export {};
