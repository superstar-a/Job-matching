import { Controller, Post, Body, ValidationPipe, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { RegisterDto } from './dto/RegisterDto';
import type { Request, Response } from 'express';
import { GoogleLoginDto } from './dto/GoogleLoginDto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
    });
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('/login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(loginDto, ipAddress, userAgent);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'User or username already exists.' })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.register(registerDto, ipAddress, userAgent);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('google')
  async googleLogin(
    @Body(ValidationPipe) dto: GoogleLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.googleLogin(dto.idToken, ipAddress, userAgent);
    this.setCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const accessToken = req.cookies?.accessToken;
    let sessionID;
    
    if (accessToken) {
      const decoded = this.authService.decodeToken(accessToken);
      if (decoded && decoded.sessionID) {
        sessionID = decoded.sessionID;
      }
    }
    
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    if (sessionID) {
      return this.authService.logout(sessionID);
    }
    
    return { message: 'User logged out successfully' };
  }
}
