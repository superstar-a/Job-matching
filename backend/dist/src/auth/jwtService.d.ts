export declare class JwtAuthService {
    private get secret();
    generateToken(payload: any): Promise<string>;
    generateRefreshToken(payload: any): Promise<string>;
    verifyToken(token: string): Promise<any>;
}
