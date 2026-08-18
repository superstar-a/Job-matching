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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let RolesService = class RolesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(createRoleDto) {
        try {
            const roleExists = await this.db.role.findFirst({
                where: {
                    roleName: createRoleDto.roleName,
                },
            });
            if (roleExists) {
                throw new common_1.BadRequestException(`Role with name ${createRoleDto.roleName} already exists`);
            }
            const role = await this.db.role.create({
                data: createRoleDto,
            });
            return role;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error);
        }
    }
    async findAll() {
        const roles = await this.db.role.findMany();
        return roles;
    }
    async findOne(id) {
        try {
            const role = await this.db.role.findFirst({
                where: {
                    roleID: id,
                },
            });
            if (!role) {
                throw new common_1.NotFoundException(`Role with ID ${id} not found`);
            }
            return role;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error);
        }
    }
    async update(id, updateRoleDto) {
        try {
            const role = await this.db.role.update({
                where: {
                    roleID: id,
                },
                data: updateRoleDto,
            });
            return role;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error);
        }
    }
    async remove(id) {
        try {
            const roleExists = await this.db.role.findFirst({
                where: {
                    roleID: id,
                },
            });
            if (!roleExists) {
                throw new common_1.NotFoundException(`Role with ID ${id} not found`);
            }
            const role = await this.db.role.delete({
                where: {
                    roleID: id,
                },
            });
            return role;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error);
        }
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RolesService);
//# sourceMappingURL=roles.service.js.map