import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as bcrypt from 'bcrypt';

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaMssql(process.env.DATABASE_URL!);
  return new PrismaClient({ adapter });
}

/**
 * jm user:create --email=<email> --password=<password>
 * Creates a user account with the 'User' role.
 */
export async function userCreate(email: string, password: string): Promise<void> {
  console.log('\n👤 Creating User account...');
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

    // Find or create the User role
    let userRole = await prisma.role.findFirst({
      where: { roleName: 'User' },
    });

    if (!userRole) {
      userRole = await prisma.role.create({
        data: {
          roleName: 'User',
          description: 'Standard user',
        },
      });
      console.log('   ✅ Created "User" role');
    }

    // Create the user with credentials and role assignment
    const user = await prisma.user.create({
      data: {
        email: email,
        username: email.split('@')[0],
        accountStatus: 'Active',
        credentials: {
          create: {
            authProvider: 'Local',
            passwordHash: hashedPassword,
          },
        },
        userRoles: {
          create: {
            roleID: userRole.roleID,
          },
        },
      },
    });

    // Audit log
    await prisma.securityAuditLog.create({
      data: {
        eventType: 'USER_CREATED',
        eventDetails: `User account created via CLI for ${email}`,
        userID: user.userID,
      },
    });

    console.log(`   ✅ User created (ID: ${user.userID})`);
    console.log('\n✅ User account created successfully.\n');
  } catch (error: any) {
    console.error(`\n❌ Failed to create user account: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
