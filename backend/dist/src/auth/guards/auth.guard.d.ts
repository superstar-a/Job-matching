import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthService } from '../jwtService';
export declare class AuthGuard implements CanActivate {
    private jwtService;
    constructor(jwtService: JwtAuthService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
