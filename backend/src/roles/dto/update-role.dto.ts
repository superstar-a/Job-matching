import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    @IsString()
    @IsNotEmpty()
    @Min(3)
    @Max(20)
    roleName: string;

    @IsString()
    @IsNotEmpty()
    @Min(10)
    @Max(255)
    description: string;
}
