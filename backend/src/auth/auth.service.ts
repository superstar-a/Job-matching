import { BadRequestException, Injectable, InternalServerErrorException, HttpException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/LoginDto';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt'
import { RegisterDto } from './dto/RegisterDto';
import { JwtAuthService } from './jwtService';
import { OAuth2Client } from 'google-auth-library';
import { UUID } from 'crypto';
@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtAuthService,
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
    );
  }
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    try {
      const user = await this.db.user.findFirst({
        where: {
          email: loginDto.email,
        },
        include: {
          credentials: true
        }
      });
      if (!user) {
        throw new NotFoundException(`User with email ${loginDto.email} not found`);
      }
      if (user.credentials[0].authProvider !== 'Local') {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isPasswordValid = bcrypt.compareSync(loginDto.password, user.credentials[0].passwordHash!);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const sessionID = crypto.randomUUID();

      const jwtPayload = {
        sub: user.userID,
        email: user.email,
        username: user.username,
        sessionID: sessionID,
      };

      const accessToken = await this.jwtService.generateToken(jwtPayload);
      const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);

      await this.db.session.create({
        data: {
          sessionID: sessionID,
          userID: user.userID,
          refreshToken: refreshToken,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await this.db.securityAuditLog.create({
        data: {
          eventType: 'LOGIN',
          eventDetails: `User ${user.username} logged in`,
          userID: user.userID,
          ipAddress: ipAddress || null,
        },
      })

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
    try {
      const userExists = await this.db.user.findFirst({
        where: {
          email: registerDto.email,
        },
      });
      const usernameExists = await this.db.user.findFirst({
        where: {
          username: registerDto.username,
        },
      });
      if (userExists) {
        throw new BadRequestException(`User with email ${registerDto.email} already exists`);
      }
      if (usernameExists) {
        throw new BadRequestException(`Username ${registerDto.username} already exists`);
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(registerDto.password, salt);
      const user = await this.db.user.create({
        data: {
          email: registerDto.email,
          username: registerDto.username,
          accountStatus: 'Active',
          credentials: {
            create: {
              authProvider: 'Local',
              passwordHash: hashedPassword,

            },
          },
          userRoles: {
            create: {
              role: {
                connect: {
                  roleID: 2
                }
              },
            },
          },
        },
      });

      await this.db.securityAuditLog.create({
        data: {
          eventType: 'CREATE_USER',
          eventDetails: `User ${registerDto.username} created`,
          userID: user.userID,
          ipAddress: ipAddress || null,
        },
      });

      const sessionID = crypto.randomUUID();

      const jwtPayload = {
        sub: user.userID,
        email: user.email,
        username: user.username,
        sessionID: sessionID,
      };

      const accessToken = await this.jwtService.generateToken(jwtPayload);
      const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);

      await this.db.session.create({
        data: {
          sessionID: sessionID,
          userID: user.userID,
          refreshToken: refreshToken,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message);
    }
  }

  async googleLogin(idToken: string, ipAddress?: string, userAgent?: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID token');
      }
      const email = payload['email'];
      const name = payload['name'];
      const picture = payload['picture'];

      const existingUser = await this.db.user.findFirst({
        where: {
          email: email,
        },
        include: {
          credentials: true,
        },
      });

      if (existingUser) {
        if (existingUser.credentials[0].authProvider !== 'Google') {
          throw new BadRequestException('User exists with a different authentication provider');
        }

        const sessionID = crypto.randomUUID();

        const jwtPayload = {
          sub: existingUser.userID,
          email: existingUser.email,
          username: existingUser.username,
          sessionID: sessionID,
        };

        const accessToken = await this.jwtService.generateToken(jwtPayload);
        const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);

        await this.db.session.create({
          data: {
            sessionID: sessionID,
            userID: existingUser.userID,
            refreshToken: refreshToken,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        return {
          user: existingUser,
          accessToken,
          refreshToken,
        };
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(idToken, salt);

      const user = await this.db.user.create({
        data: {
          email: email!,
          username: name!.replace(/\s+/g, '_'),
          accountStatus: 'Active',
          credentials: {
            create: {
              authProvider: 'Google',
              passwordHash: hashedPassword,

            },
          },
          userRoles: {
            create: {
              role: {
                connect: {
                  roleID: 2,
                },
              },
            },
          },
        },
      });

      await this.db.securityAuditLog.create({
        data: {
          eventType: 'CREATE_USER',
          eventDetails: `User ${user.username} created via Google OAuth`,
          userID: user.userID,
          ipAddress: ipAddress || null,
        },
      });

      const sessionID = crypto.randomUUID();

      const jwtPayload = {
        sub: user.userID,
        email: user.email,
        username: user.username,
        sessionID: sessionID,
      };

      const accessToken = await this.jwtService.generateToken(jwtPayload);
      const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);

      await this.db.session.create({
        data: {
          sessionID: sessionID,
          userID: user.userID,
          refreshToken: refreshToken,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Google login failed: ' + error.message);
    }
  }

  decodeToken(token: string) {
    return this.jwtService.decodeToken(token);
  }

  async logout(sessionID: string) {
    try {
      await this.db.session.delete({
        where: {
          sessionID: sessionID,
        },
      });

      return {
        message: 'User logged out successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Logout failed: ' + error.message);
    }
  }
}
