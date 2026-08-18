import { IsNotEmpty, IsString, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePermissionDto {
    @ApiProperty({
        example: 'CREATE_POST',
        description: 'The identifier for the permission'
    })
    @IsString()
    permissionName: string;

    @ApiProperty({
        example: 'Allows the user to create a new blog post',
        description: 'Description of the permission'
    })
    @IsString()
    @IsNotEmpty()
    description: string;
}
