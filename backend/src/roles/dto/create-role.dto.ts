import { IsNotEmpty, IsString, Max, Min } from "class-validator";

export class CreateRoleDto {
    @IsString()
    @IsNotEmpty()
    roleName: string;

    @IsString()
    @IsNotEmpty()
    @Min(10)
    @Max(255)
    description: string;
}
