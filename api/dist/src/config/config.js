"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const profiguration_1 = require("@golevelup/profiguration");
exports.config = (0, profiguration_1.createProfiguration)({
    SECRET_KEY: {
        default: '',
        env: 'SECRET_KEY',
    },
    DATABASE_URL: {
        default: '',
        env: 'DATABASE_URL',
    },
    DATABASE_NAME: {
        default: '',
        env: 'DATABASE_NAME',
    },
    DATABASE_USERNAME: {
        default: '',
        env: 'DATABASE_USERNAME',
    },
    DATABASE_PASSWORD: {
        default: '',
        env: 'DATABASE_PASSWORD',
    },
    DATABASE_PORT: {
        default: '',
        env: 'DATABASE_PORT',
    },
    MAIL_HOST: {
        default: '',
        env: 'MAIL_HOST',
    },
    MAIL_PORT: {
        default: '587',
        env: 'MAIL_PORT',
    },
    MAIL_USER: {
        default: '',
        env: 'MAIL_USER',
    },
    MAIL_PASS: {
        default: '',
        env: 'MAIL_PASS',
    },
    MAIL_FROM: {
        default: '',
        env: 'MAIL_FROM',
    },
    APP_URL: {
        default: 'http://localhost:3000',
        env: 'APP_URL',
    },
}, {
    strict: true,
    verbose: true,
    loadRelativeTo: 'cwd',
    configureEnv: () => ({
        files: `.env`,
    }),
});
//# sourceMappingURL=config.js.map