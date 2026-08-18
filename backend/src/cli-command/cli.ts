#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { adminCreate } from './admin.command';
import { userCreate } from './user.command';
import { dbReset, dbInit } from './db.command';

const program = new Command();

program
  .name('jm')
  .description('Job Matching CLI — Administrative tools')
  .version('1.0.0');

// ─── admin:create ───────────────────────────────────────────────
program
  .command('admin:create')
  .alias('a:c')
  .description('Create an admin account')
  .requiredOption('--email <email>', 'Admin email address')
  .requiredOption('--password <password>', 'Admin password')
  .action(async (options) => {
    await adminCreate(options.email, options.password);
  });

// ─── user:create ────────────────────────────────────────────────
program
  .command('user:create')
  .alias('u:c')
  .description('Create a regular user account')
  .requiredOption('--email <email>', 'User email address')
  .requiredOption('--password <password>', 'User password')
  .action(async (options) => {
    await userCreate(options.email, options.password);
  });

// ─── db:reset ───────────────────────────────────────────────────
program
  .command('db:reset')
  .alias('db:rs')
  .description('Drop all tables from the database')
  .action(async () => {
    await dbReset();
  });

// ─── db:init ────────────────────────────────────────────────────
program
  .command('db:init')
  .alias('db:i')
  .description('Re-create the database schema (prisma db push)')
  .action(async () => {
    await dbInit();
  });

program.parse(process.argv);
