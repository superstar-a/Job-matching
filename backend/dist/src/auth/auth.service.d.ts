import { LoginDto } from './dto/LoginDto';
import { DatabaseService } from "../database/database.service";
import { RegisterDto } from './dto/RegisterDto';
import { JwtAuthService } from './jwtService';
export declare class AuthService {
    private readonly db;
    private readonly jwtService;
    private readonly googleClient;
    constructor(db: DatabaseService, jwtService: JwtAuthService);
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{
        user: {
            credentials: {
                userID: string;
                credentialID: string;
                authProvider: string;
                providerKey: string | null;
                passwordHash: string | null;
                passwordSalt: string | null;
                lastUpdated: Date;
            }[];
        } & {
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
    register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<{
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
    googleLogin(idToken: string, ipAddress?: string, userAgent?: string): Promise<{
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
}
