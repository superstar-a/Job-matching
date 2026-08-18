import { IsEmail, IsNotEmpty, IsString, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'The email address of the user'
    })
    @IsString()
    @IsEmail()
    email: string;
    
    @ApiProperty({
        example: 'P@ssw0rd123',
        description: 'The password of the user (6 to 12 characters)'
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        example: 'johndoe99',
        description: 'The username of the user (3 to 20 characters)'
    })
    @IsString()
    @IsNotEmpty()
    username: string;
}
