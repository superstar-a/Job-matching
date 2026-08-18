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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const common_2 = require("@nestjs/common");
let PermissionService = class PermissionService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(createPermissionDto) {
        try {
            const permissionExists = await this.db.permission.findFirst({
                where: {
                    permissionName: createPermissionDto.permissionName,
                },
            });
            if (permissionExists) {
                throw new common_1.BadRequestException(`Permission with name ${createPermissionDto.permissionName} already exists`);
            }
            return await this.db.permission.create({
                data: createPermissionDto,
            });
        }
        catch (error) {
            throw new common_2.InternalServerErrorException(error.message);
        }
    }
    async findAll() {
        try {
            return await this.db.permission.findMany();
        }
        catch (error) {
            throw new common_2.InternalServerErrorException(error.message);
        }
    }
    async findOne(id) {
        try {
            const permissionExists = await this.db.permission.findFirst({
                where: {
                    permissionID: id,
                },
            });
            if (!permissionExists) {
                throw new common_2.NotFoundException(`Permission with ID ${id} not found`);
            }
            return await this.db.permission.findUnique({
                where: {
                    permissionID: id,
                },
            });
        }
        catch (error) {
            throw new common_2.InternalServerErrorException(error.message);
        }
    }
    async update(id, updatePermissionDto) {
        try {
            const permissionExists = await this.db.permission.findFirst({
                where: {
                    permissionID: id,
                },
            });
            if (!permissionExists) {
                throw new common_2.NotFoundException(`Permission with ID ${id} not found`);
            }
            return await this.db.permission.update({
                where: {
                    permissionID: id,
                },
                data: updatePermissionDto,
            });
        }
        catch (error) {
            throw new common_2.InternalServerErrorException(error.message);
        }
    }
    async remove(id) {
        try {
            const permissionExists = await this.db.permission.findFirst({
                where: {
                    permissionID: id,
                },
            });
            if (!permissionExists) {
                throw new common_2.NotFoundException(`Permission with ID ${id} not found`);
            }
            return await this.db.permission.delete({
                where: {
                    permissionID: id,
                },
            });
        }
        catch (error) {
            throw new common_2.InternalServerErrorException(error.message);
        }
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PermissionService);
//# sourceMappingURL=permission.service.js.map