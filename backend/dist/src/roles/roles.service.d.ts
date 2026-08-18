import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DatabaseService } from "../database/database.service";
export declare class RolesService {
    private readonly db;
    constructor(db: DatabaseService);
    create(createRoleDto: CreateRoleDto): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }>;
    findAll(): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }[]>;
    findOne(id: number): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }>;
    update(id: number, updateRoleDto: UpdateRoleDto): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }>;
    remove(id: number): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }>;
}
