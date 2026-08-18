import { IsNotEmpty, IsString, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateRoleDto {
    @ApiProperty({
        example: 'Editor',
        description: 'The name of the role'
    })
    @IsString()
    @IsNotEmpty()
    roleName: string;

    @ApiProperty({
        example: 'Has access to edit content',
        description: 'The description of what this role can do'
    })
    @IsString()
    @IsNotEmpty()
    description: string;
}
