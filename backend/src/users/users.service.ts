import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DatabaseService } from 'src/database/database.service';
import { JwtAuthService } from '../auth/jwtService';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtAuthService,
  ) { }

  async create(createUserDto: CreateUserDto, ipAddress?: string, userAgent?: string) {
    try {
      const userExists = await this.db.user.findFirst({
        where: {
          email: createUserDto.email,
        },
      });
      const usernameExists = await this.db.user.findFirst({
        where: {
          username: createUserDto.username,
        },
      });
      if (userExists) {
        throw new BadRequestException(`User with email ${createUserDto.email} already exists`);
      }
      if (usernameExists) {
        throw new BadRequestException(`Username ${createUserDto.username} already exists`);
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
      const user = await this.db.user.create({
        data: {
          email: createUserDto.email,
          username: createUserDto.username,
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
                create: {
                  roleName: 'User'
                }
              },
            },
          },
        },
      });

      await this.db.securityAuditLog.create({
        data: {
          eventType: 'CREATE_USER',
          eventDetails: `User ${createUserDto.username} created`,
          userID: user.userID,
        },
      });

      const jwtPayload = {
        sub: user.userID,
        email: user.email,
        username: user.username,
      };

      const accessToken = await this.jwtService.generateToken(jwtPayload);
      const refreshToken = await this.jwtService.generateRefreshToken(jwtPayload);

      await this.db.session.create({
        data: {
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
    }
    catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    try {
      const users = await this.db.user.findMany();
      return users;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.db.user.findFirst({
        where: {
          userID: id,
        },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const userExists = await this.db.user.findFirst({
        where: {
          userID: id,
        },
      });
      if (!userExists) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      const user = await this.db.user.update({
        where: {
          userID: id,
        },
        data: updateUserDto,
      });
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.db.user.delete({
        where: {
          userID: id,
        },
      });
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
