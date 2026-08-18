import { IsNotEmpty, IsString, Max, Min } from "class-validator";

export class CreatePermissionDto {
    @IsString()
    @Min(3)
    @Max(20)
    permissionName: string;

    @IsString()
    @IsNotEmpty()
    @Min(10)
    @Max(255)
    description: string;
}
