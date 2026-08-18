import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from "../../database/database.service";
export declare class RolesGuard implements CanActivate {
    private reflector;
    private db;
    constructor(reflector: Reflector, db: DatabaseService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
