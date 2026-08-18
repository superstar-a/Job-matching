import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { RegisterDto } from './dto/RegisterDto';
import type { Request } from 'express';
import { GoogleLoginDto } from './dto/GoogleLoginDto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: Request): Promise<{
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
    register(registerDto: RegisterDto, req: Request): Promise<{
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
    googleLogin(dto: GoogleLoginDto, req: Request): Promise<{
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
