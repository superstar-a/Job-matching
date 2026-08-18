import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
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
    findOne(id: string): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        roleID: number;
        roleName: string;
    }>;
}
