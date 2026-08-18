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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const jwtService_1 = require("../auth/jwtService");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    db;
    jwtService;
    constructor(db, jwtService) {
        this.db = db;
        this.jwtService = jwtService;
    }
    async create(createUserDto, ipAddress, userAgent) {
        try {
            const userExists = await this.db.user.findFirst({
                where: {
                    email: createUserDto.email,
                },
            });
            const usernameExists = await this.db.user.findFirst({
                where: {
                    username: createUserDto.username,
                },
            });
            if (userExists) {
                throw new common_1.BadRequestException(`User with email ${createUserDto.email} already exists`);
            }
            if (usernameExists) {
                throw new common_1.BadRequestException(`Username ${createUserDto.username} already exists`);
            }
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
            const user = await this.db.user.create({
                data: {
                    email: createUserDto.email,
                    username: createUserDto.username,
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
                    eventDetails: `User ${createUserDto.username} created`,
                    userID: user.userID,
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
    async findAll() {
        try {
            const users = await this.db.user.findMany();
            return users;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async findOne(id) {
        try {
            const user = await this.db.user.findFirst({
                where: {
                    userID: id,
                },
            });
            if (!user) {
                throw new common_1.NotFoundException(`User with ID ${id} not found`);
            }
            return user;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async update(id, updateUserDto) {
        try {
            const userExists = await this.db.user.findFirst({
                where: {
                    userID: id,
                },
            });
            if (!userExists) {
                throw new common_1.NotFoundException(`User with ID ${id} not found`);
            }
            const user = await this.db.user.update({
                where: {
                    userID: id,
                },
                data: updateUserDto,
            });
            return user;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
    async remove(id) {
        try {
            const user = await this.db.user.delete({
                where: {
                    userID: id,
                },
            });
            return user;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        jwtService_1.JwtAuthService])
], UsersService);
//# sourceMappingURL=users.service.js.map