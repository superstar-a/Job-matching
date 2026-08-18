import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Min, Max } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'The email address of the user',
        required: true,
    })
    email: string;

    @IsString()
    @IsNotEmpty()
    @Min(6)
    @Max(12)
    @ApiProperty({
        example: 'password',
        description: 'The password of the user',
        required: true,
    })
    password: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        example: 'john',
        description: 'The username of the user',
        required: true,
    })
    username: string;
}