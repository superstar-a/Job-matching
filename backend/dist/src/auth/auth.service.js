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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const common_2 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const jwtService_1 = require("./jwtService");
const google_auth_library_1 = require("google-auth-library");
let AuthService = class AuthService {
    db;
    jwtService;
    googleClient;
    constructor(db, jwtService) {
        this.db = db;
        this.jwtService = jwtService;
        this.googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }
    async login(loginDto, ipAddress, userAgent) {
        try {
            const user = await this.db.user.findFirst({
                where: {
                    email: loginDto.email,
                },
                include: {
                    credentials: true
                }
            });
            if (!user) {
                throw new common_2.NotFoundException(`User with email ${loginDto.email} not found`);
            }
            if (user.credentials[0].authProvider !== 'Local') {
                throw new common_2.UnauthorizedException('Invalid credentials');
            }
            const isPasswordValid = bcrypt.compareSync(loginDto.password, user.credentials[0].passwordHash);
            if (!isPasswordValid) {
                throw new common_2.UnauthorizedException('Invalid credentials');
            }
            const jwtPayload = {
                sub: user.userID,
                email: user.email,
                username: user.username,
            };
            const accessToken = await this.jwtService.generateToken(jwtPayload);
            const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);
            await this.db.session.create({
                data: {
                    userID: user.userID,
                    refreshToken: refreshToken,
                    ipAddress: ipAddress || null,
                    userAgent: userAgent || null,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            await this.db.securityAuditLog.create({
                data: {
                    eventType: 'LOGIN',
                    eventDetails: `User ${user.username} logged in`,
                    userID: user.userID,
                    ipAddress: ipAddress || null,
                },
            });
            return {
                user,
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async register(registerDto, ipAddress, userAgent) {
        try {
            const userExists = await this.db.user.findFirst({
                where: {
                    email: registerDto.email,
                },
            });
            const usernameExists = await this.db.user.findFirst({
                where: {
                    username: registerDto.username,
                },
            });
            if (userExists) {
                throw new common_1.BadRequestException(`User with email ${registerDto.email} already exists`);
            }
            if (usernameExists) {
                throw new common_1.BadRequestException(`Username ${registerDto.username} already exists`);
            }
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(registerDto.password, salt);
            const user = await this.db.user.create({
                data: {
                    email: registerDto.email,
                    username: registerDto.username,
                    accountStatus: 'Active',
                    credentials: {
                        create: {
                            authProvider: 'Local',
                            passwordHash: hashedPassword,
                            passwordSalt: salt,
                        },
                    },
                    userRoles: {
                        create: {
                            role: {
                                create: {
                                    roleName: 'User'
                                }
                            },
                        },
                    },
                },
            });
            await this.db.securityAuditLog.create({
                data: {
                    eventType: 'CREATE_USER',
                    eventDetails: `User ${registerDto.username} created`,
                    userID: user.userID,
                    ipAddress: ipAddress || null,
                },
            });
            const jwtPayload = {
                sub: user.userID,
                email: user.email,
                username: user.username,
            };
            const accessToken = await this.jwtService.generateToken(jwtPayload);
            const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);
            await this.db.session.create({
                data: {
                    userID: user.userID,
                    refreshToken: refreshToken,
                    ipAddress: ipAddress || null,
                    userAgent: userAgent || null,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            return {
                user,
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async googleLogin(idToken, ipAddress, userAgent) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new common_2.UnauthorizedException('Invalid Google ID token');
            }
            const email = payload['email'];
            const name = payload['name'];
            const picture = payload['picture'];
            const existingUser = await this.db.user.findFirst({
                where: {
                    email: email,
                },
                include: {
                    credentials: true,
                },
            });
            if (existingUser) {
                if (existingUser.credentials[0].authProvider !== 'Google') {
                    throw new common_1.BadRequestException('User exists with a different authentication provider');
                }
                const jwtPayload = {
                    sub: existingUser.userID,
                    email: existingUser.email,
                    username: existingUser.username,
                };
                const accessToken = await this.jwtService.generateToken(jwtPayload);
                const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);
                await this.db.session.create({
                    data: {
                        userID: existingUser.userID,
                        refreshToken: refreshToken,
                        ipAddress: ipAddress || null,
                        userAgent: userAgent || null,
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                });
                return {
                    user: existingUser,
                    accessToken,
                    refreshToken,
                };
            }
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(idToken, salt);
            const user = await this.db.user.create({
                data: {
                    email: email,
                    username: name.replace(/\s+/g, '_'),
                    accountStatus: 'Active',
                    credentials: {
                        create: {
                            authProvider: 'Google',
                            passwordHash: hashedPassword,
                            passwordSalt: salt,
                        },
                    },
                    userRoles: {
                        create: {
                            role: {
                                create: {
                                    roleName: 'User',
                                },
                            },
                        },
                    },
                },
            });
            await this.db.securityAuditLog.create({
                data: {
                    eventType: 'CREATE_USER',
                    eventDetails: `User ${user.username} created via Google OAuth`,
                    userID: user.userID,
                    ipAddress: ipAddress || null,
                },
            });
            const jwtPayload = {
                sub: user.userID,
                email: user.email,
                username: user.username,
            };
            const accessToken = await this.jwtService.generateToken(jwtPayload);
            const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);
            await this.db.session.create({
                data: {
                    userID: user.userID,
                    refreshToken: refreshToken,
                    ipAddress: ipAddress || null,
                    userAgent: userAgent || null,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            });
            return {
                user,
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            if (error instanceof common_2.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Google login failed: ' + error.message);
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwtService_1.JwtAuthService])
], AuthService);
//# sourceMappingURL=auth.service.js.map