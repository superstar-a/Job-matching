import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import { execSync } from 'child_process';
import * as path from 'path';

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMssql(process.env.DATABASE_URL!);
  return new PrismaClient({ adapter });
}

/**
 * jm db:reset — Drop all tables from the database
 */
export async function dbReset(): Promise<void> {
  console.log('\n🗑️  Resetting database...');

  const prisma = createPrismaClient();

  try {
    await prisma.$connect();

    // Drop tables in correct order (respecting foreign key constraints)
    const dropOrder = [
      'SecurityAuditLogs',
      'Sessions',
      'RolePermissions',
      'UserRoles',
      'Credentials',
      'Permissions',
      'Roles',
      'Users',
    ];

    for (const table of dropOrder) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS [dbo].[${table}]`);
        console.log(`   ✅ Dropped table: ${table}`);
      } catch (err: any) {
        console.log(`   ⚠️  Could not drop table ${table}: ${err.message}`);
      }
    }

    console.log('\n✅ Database has been reset successfully.\n');
  } catch (error: any) {
    console.error(`\n❌ Failed to reset database: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * jm db:init — Re-create the database schema using `prisma db push`
 */
export async function dbInit(): Promise<void> {
  console.log('\n🔧 Initializing database schema...');

  try {
    let backendRoot = path.resolve(__dirname, '..', '..');
    if (backendRoot.endsWith('dist') || backendRoot.endsWith('dist' + path.sep)) {
      backendRoot = path.resolve(backendRoot, '..');
    }

    execSync('npx prisma generate', {
      cwd: backendRoot,
      stdio: 'inherit',
    });

    execSync('npx prisma db push', {
      cwd: backendRoot,
      stdio: 'inherit',
    });

    execSync('npx ts-node prisma/dataset.ts', {
      cwd: backendRoot,
      stdio: 'inherit',
    });

    console.log('\n✅ Database schema initialized successfully.\n');
  } catch (error: any) {
    console.error(`\n❌ Failed to initialize database: ${error.message}\n`);
    process.exit(1);
  }
}
