import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class RolesService {
  constructor(private readonly db: DatabaseService) { }
  async create(createRoleDto: CreateRoleDto) {
    try {
      const roleExists = await this.db.role.findFirst({
        where: {
          roleName: createRoleDto.roleName,
        },
      });
      if (roleExists) {
        throw new BadRequestException(`Role with name ${createRoleDto.roleName} already exists`);
      }
      const role = await this.db.role.create({
        data: createRoleDto,
      });
      return role;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll() {
    const roles = await this.db.role.findMany();
    return roles;
  }

  async findOne(id: number) {
    try {
      const role = await this.db.role.findFirst({
        where: {
          roleID: id,
        },
      });
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      return role;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.db.role.update({
        where: {
          roleID: id,
        },
        data: updateRoleDto,
      });
      return role;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number) {
    try {
      const roleExists = await this.db.role.findFirst({
        where: {
          roleID: id,
        },
      });
      if (!roleExists) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      const role = await this.db.role.delete({
        where: {
          roleID: id,
        },
      });

      return role;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
