import { IsEmail, IsNotEmpty, IsString, Min, Max } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsEmail()
    email: string;
    
    @IsString()
    @IsNotEmpty()
    @Min(6)
    @Max(12)
    password: string;

    @IsString()
    @IsNotEmpty()
    @Min(3)
    @Max(20)
    username: string;
}
