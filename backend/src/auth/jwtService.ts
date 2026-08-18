import { Injectable } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthService {
    private get secret(): string {
        return process.env.JWT_SECRET!;
    }

    async generateToken(payload: any): Promise<string> {
        return jwt.sign(payload, this.secret, { expiresIn: '1h' });
    }

    async generateRefreshToken(payload: any): Promise<string> {
        return jwt.sign(payload, this.secret, { expiresIn: '7d' });
    }

    async verifyToken(token: string): Promise<any> {
        return jwt.verify(token, this.secret);
    }
}
