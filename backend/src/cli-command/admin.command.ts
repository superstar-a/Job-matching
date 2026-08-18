import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as bcrypt from 'bcrypt';

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMssql(process.env.DATABASE_URL!);
  return new PrismaClient({ adapter });
}

/**
 * jm admin:create --email=<email> --password=<password>
 * Creates an admin account with the 'Admin' role.
 */
export async function adminCreate(email: string, password: string): Promise<void> {
  console.log('\n👤 Creating Admin account...');
  console.log(`   Email: ${email}`);

  const prisma = createPrismaClient();

  try {
    await prisma.$connect();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      console.error(`\n❌ A user with email "${email}" already exists.\n`);
      process.exit(1);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Find or create the Admin role
    let adminRole = await prisma.role.findFirst({
      where: { roleName: 'Admin' },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          roleName: 'Admin',
          description: 'Administrator with full access',
        },
      });
      console.log('   ✅ Created "Admin" role');
    }

    // Create the user with credentials and role assignment
    const user = await prisma.user.create({
      data: {
        email: email,
        username: email.split('@')[0] + '_admin',
        accountStatus: 'Active',
        credentials: {
          create: {
            authProvider: 'Local',
            passwordHash: hashedPassword,
          },
        },
        userRoles: {
          create: {
            roleID: adminRole.roleID,
          },
        },
      },
    });

    // Audit log
    await prisma.securityAuditLog.create({
      data: {
        eventType: 'ADMIN_CREATED',
        eventDetails: `Admin account created via CLI for ${email}`,
        userID: user.userID,
      },
    });

    console.log(`   ✅ Admin user created (ID: ${user.userID})`);
    console.log('\n✅ Admin account created successfully.\n');
  } catch (error: any) {
    console.error(`\n❌ Failed to create admin account: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
