import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { DatabaseService } from 'src/database/database.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

@Injectable()
export class PermissionService {
  constructor(private readonly db: DatabaseService) { }

  async create(createPermissionDto: CreatePermissionDto) {
    try {
      const permissionExists = await this.db.permission.findFirst({
        where: {
          permissionName: createPermissionDto.permissionName,
        },
      });
      if (permissionExists) {
        throw new BadRequestException(`Permission with name ${createPermissionDto.permissionName} already exists`);
      }
      return await this.db.permission.create({
        data: createPermissionDto,
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    try {
      return await this.db.permission.findMany();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      const permissionExists = await this.db.permission.findFirst({
        where: {
          permissionID: id,
        },
      });
      if (!permissionExists) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }
      return await this.db.permission.findUnique({
        where: {
          permissionID: id,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    try {
      const permissionExists = await this.db.permission.findFirst({
        where: {
          permissionID: id,
        },
      });
      if (!permissionExists) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }
      return await this.db.permission.update({
        where: {
          permissionID: id,
        },
        data: updatePermissionDto,
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async remove(id: number) {
    try {
      const permissionExists = await this.db.permission.findFirst({
        where: {
          permissionID: id,
        },
      });
      if (!permissionExists) {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      }
      return await this.db.permission.delete({
        where: {
          permissionID: id,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
