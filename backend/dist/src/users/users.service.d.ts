import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from "../database/database.service";
import { JwtAuthService } from '../auth/jwtService';
export declare class UsersService {
    private readonly db;
    private readonly jwtService;
    constructor(db: DatabaseService, jwtService: JwtAuthService);
    create(createUserDto: CreateUserDto, ipAddress?: string, userAgent?: string): Promise<{
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
