import { Controller, Post, Body, ValidationPipe, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/LoginDto';
import { RegisterDto } from './dto/RegisterDto';
import type { Request } from 'express';
import { GoogleLoginDto } from './dto/GoogleLoginDto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('/login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() req: Request
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'User or username already exists.' })
  register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Req() req: Request
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  @Post('google')
  async googleLogin(
    @Body(ValidationPipe) dto: GoogleLoginDto,
    @Req() req: Request) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.googleLogin(dto.idToken, ipAddress, userAgent);
  }
}
