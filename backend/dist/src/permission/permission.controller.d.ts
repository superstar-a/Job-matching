import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
export declare class PermissionController {
    private readonly permissionService;
    constructor(permissionService: PermissionService);
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
    findOne(id: string): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    } | null>;
    update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        permissionName: string;
        permissionID: number;
    }>;
}
