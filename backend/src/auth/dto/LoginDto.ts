import { IsNotEmpty, IsEmail, Min, Max, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'The email of the user'
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'password123',
        description: 'The password of the user'
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(12)
    password: string;
}