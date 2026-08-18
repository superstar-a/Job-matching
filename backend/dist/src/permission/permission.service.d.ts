import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { DatabaseService } from "../database/database.service";
export declare class PermissionService {
    private readonly db;
    constructor(db: DatabaseService);
    create(createPermissionDto: CreatePermissionDto): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    }>;
    findAll(): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    }[]>;
    findOne(id: number): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    } | null>;
    update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    }>;
    remove(id: number): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    }>;
}
