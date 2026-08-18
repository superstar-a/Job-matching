import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsNotEmpty()
    @IsString()
    @IsEnum([
        'Active',
        'Suspended',
        'Locked',
    ], { message: "Invalid account status" })
    accountStatus: string;
}
