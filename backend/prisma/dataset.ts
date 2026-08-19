import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the environment variables.');
}

const adapter = new PrismaMssql(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('\n🌱 Running dataset (Roles)...');
  
  const roles = [
    { 
      roleID: 1, 
      roleName: 'Admin', 
      description: 'System Administrator with full access to manage users, settings, and administrative operations.' 
    },
    { 
      roleID: 2, 
      roleName: 'User', 
      description: 'Regular user with access to basic features like profile management and job applications.' 
    }
  ];

  for (const role of roles) {
    const existing = await prisma.role.findUnique({
      where: { roleName: role.roleName }
    });

    if (!existing) {
      await prisma.$executeRawUnsafe(`
        SET IDENTITY_INSERT [dbo].[Roles] ON;
        INSERT INTO [dbo].[Roles] ([RoleID], [RoleName], [Description]) 
        VALUES (${role.roleID}, '${role.roleName}', '${role.description}');
        SET IDENTITY_INSERT [dbo].[Roles] OFF;
      `);
    } else {
      await prisma.role.update({
        where: { roleName: role.roleName },
        data: { description: role.description }
      });
    }
  }

  console.log('✅ Roles dataset initialized successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
