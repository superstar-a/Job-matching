import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { Request } from 'express';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: Request): Promise<{
        user: {
            email: string;
            userID: string;
            username: string;
            accountStatus: string;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    findAll(): Promise<{
        email: string;
        userID: string;
        username: string;
        accountStatus: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        email: string;
        userID: string;
        username: string;
        accountStatus: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        email: string;
        userID: string;
        username: string;
        accountStatus: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        email: string;
        userID: string;
        username: string;
        accountStatus: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
