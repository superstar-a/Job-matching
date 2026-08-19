import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from "class-validator";

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
    @MinLength(6)
    @MaxLength(12)
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