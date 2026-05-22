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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
const user_entity_1 = require("./entites/user.entity");
const nestjs_pino_1 = require("nestjs-pino");
const role_entity_1 = require("./entites/role.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const action_entity_1 = require("./entites/action.entity");
let AuthService = class AuthService {
    constructor(usersService, roleRepository, actionRepository, jwtService, logger) {
        this.usersService = usersService;
        this.roleRepository = roleRepository;
        this.actionRepository = actionRepository;
        this.jwtService = jwtService;
        this.logger = logger;
    }
    async login(user) {
        const payload = { id: user.id, email: user.email, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload, { expiresIn: '1d' }),
            refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }
    async validateAndLogin(email, password) {
        const user = await this.usersService.validateUser(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.login(user);
    }
    async register(email, password, firstName, lastName, role) {
        const existingUser = await this.usersService.findUserByEmail(email);
        if (existingUser) {
            this.logger.error(`User with email ${existingUser.email} already exists`);
            throw new common_1.BadRequestException(`User with email ${email} already exists`);
        }
        const user = new user_entity_1.User();
        user.email = email;
        user.password = password;
        user.firstName = firstName;
        user.lastName = lastName;
        const foundRole = await this.roleRepository.findOne({
            where: { name: role },
        });
        if (!foundRole) {
            throw new common_1.UnauthorizedException(`Role "${role}" does not exist`);
        }
        user.role = foundRole;
        this.logger.info('Creating user...');
        await this.usersService.save(user);
        this.logger.info(`User with id ${user.id} registered successfully`);
        return await this.login(user);
    }
    async getRoles(name, actions) {
        const query = this.roleRepository.createQueryBuilder('role');
        if (name) {
            query.where('role.name = :name', { name });
        }
        if (actions && actions.length > 0) {
            query.andWhere('role.actions && :actions', { actions });
        }
        const roles = await query.getMany();
        return { roles };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(action_entity_1.Action)),
    __metadata("design:paramtypes", [user_service_1.UserService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        nestjs_pino_1.PinoLogger])
], AuthService);
//# sourceMappingURL=auth.service.js.map