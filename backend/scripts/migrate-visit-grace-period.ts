/**
 * =============================================================================
 * MIGRATION SCRIPT: Add Grace Period to Faculty Visit Due Dates
 * =============================================================================
 *
 * This script adds a 5-day grace period to all existing FacultyVisitLog records
 * that have a requiredByDate set. This is part of Phase 4 of the compliance
 * simplification implementation.
 *
 * WHAT IT DOES:
 *   1. Finds all FacultyVisitLog records with requiredByDate set
 *   2. Adds 5 days to each requiredByDate
 *
 * USAGE:
 *   npx ts-node scripts/migrate-visit-grace-period.ts
 *
 * OPTIONS:
 *   DRY_RUN=true npx ts-node scripts/migrate-visit-grace-period.ts
 *
 * IDEMPOTENCY WARNING:
 *   This script is NOT fully idempotent - running it multiple times will
 *   keep adding 5 days to the requiredByDate. Only run this script ONCE
 *   during the migration process.
 *
 *   A tracking mechanism is included to prevent accidental re-runs by
 *   checking if the migration has already been performed.
 *
 * =============================================================================
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';
const GRACE_PERIOD_DAYS = 5;
const MIGRATION_KEY = 'visit-grace-period-migration-v1';

// =============================================================================
// LOGGING
// =============================================================================

function log(message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: '\x1b[36m[INFO]\x1b[0m',
    WARN: '\x1b[33m[WARN]\x1b[0m',
    ERROR: '\x1b[31m[ERROR]\x1b[0m',
    SUCCESS: '\x1b[32m[SUCCESS]\x1b[0m',
  }[level];

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function logSection(title: string) {
  log('\n' + '='.repeat(70));
  log(title);
  log('='.repeat(70));
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// =============================================================================
// MIGRATION TRACKING
// =============================================================================

async function checkMigrationStatus(): Promise<boolean> {
  try {
    // Check if this migration has already been run by looking for a marker
    // We use AuditLog as a simple way to track migrations
    const existingMigration = await prisma.auditLog.findFirst({
      where: {
        entityType: 'MIGRATION',
        action: 'BULK_OPERATION',
        description: MIGRATION_KEY,
      },
    });

    return !!existingMigration;
  } catch (error) {
    // If table doesn't exist or other error, assume migration hasn't run
    return false;
  }
}

async function recordMigrationComplete(visitsUpdated: number): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: 'MIGRATION',
        action: 'BULK_OPERATION',
        userRole: 'SYSTEM_ADMIN',
        description: MIGRATION_KEY,
        category: 'SYSTEM',
        severity: 'MEDIUM',
        newValues: {
          gracePeriodDays: GRACE_PERIOD_DAYS,
          visitsUpdated: visitsUpdated,
          completedAt: new Date().toISOString(),
        },
        changedFields: ['requiredByDate'],
      },
    });
  } catch (error: any) {
    log(`Warning: Could not record migration completion: ${error.message}`, 'WARN');
  }
}

// =============================================================================
// MIGRATION FUNCTION
// =============================================================================

async function addVisitGracePeriod() {
  const startTime = Date.now();

  logSection('MIGRATION: Add Grace Period to Faculty Visit Due Dates');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`DRY_RUN: ${DRY_RUN}`);
  log(`Grace Period: ${GRACE_PERIOD_DAYS} days`);
  log('');

  try {
    // Step 0: Check if migration has already been run
    log('Step 0: Checking migration status...');
    const alreadyRun = await checkMigrationStatus();

    if (alreadyRun && !DRY_RUN) {
      log('This migration has already been run!', 'WARN');
      log('If you need to run it again, please manually remove the migration record from AuditLog.', 'WARN');
      log(`Migration key: ${MIGRATION_KEY}`, 'INFO');
      return;
    }

    if (alreadyRun) {
      log('Migration was previously run, but continuing in DRY_RUN mode for preview...', 'WARN');
    } else {
      log('Migration has not been run before. Proceeding...', 'SUCCESS');
    }
    log('');

    // Step 1: Find all visits with requiredByDate
    log('Step 1: Finding faculty visits with requiredByDate set...');

    const visitsToMigrate = await prisma.facultyVisitLog.findMany({
      where: {
        requiredByDate: { not: null },
      },
      select: {
        id: true,
        requiredByDate: true,
        visitMonth: true,
        visitYear: true,
        applicationId: true,
        status: true,
      },
    });

    log(`  Found ${visitsToMigrate.length} visits with requiredByDate`);

    if (visitsToMigrate.length === 0) {
      log('No visits need migration. No requiredByDate values found.', 'SUCCESS');
      return;
    }

    // Log sample of visits for verification
    log('');
    log('Sample of visits to be updated (first 5):');
    visitsToMigrate.slice(0, 5).forEach((visit, index) => {
      const oldDate = visit.requiredByDate!;
      const newDate = addDays(oldDate, GRACE_PERIOD_DAYS);
      log(`  ${index + 1}. Visit ${visit.id.slice(-8)}... (${visit.visitMonth}/${visit.visitYear})`);
      log(`     Old: ${formatDate(oldDate)} -> New: ${formatDate(newDate)}`);
    });
    log('');

    // Step 2: Update each visit individually
    log('Step 2: Updating visits with grace period...');

    let successCount = 0;
    let errorCount = 0;

    for (const visit of visitsToMigrate) {
      try {
        const oldDate = visit.requiredByDate!;
        const newDate = addDays(oldDate, GRACE_PERIOD_DAYS);

        if (DRY_RUN) {
          successCount++;
          continue;
        }

        await prisma.facultyVisitLog.update({
          where: { id: visit.id },
          data: {
            requiredByDate: newDate,
          },
        });

        successCount++;

        // Log every 50 visits for progress tracking
        if (successCount % 50 === 0) {
          log(`  Progress: ${successCount}/${visitsToMigrate.length} visits updated...`);
        }
      } catch (error: any) {
        log(`  Error updating visit ${visit.id}: ${error.message}`, 'ERROR');
        errorCount++;
      }
    }

    // Step 3: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection('MIGRATION SUMMARY');
    log(`Duration: ${duration} seconds`);
    log('');
    log(`Total visits found: ${visitsToMigrate.length}`);
    log(`Successfully updated: ${successCount}`, 'SUCCESS');
    log(`Errors: ${errorCount}`, errorCount > 0 ? 'ERROR' : 'INFO');
    log('');

    if (DRY_RUN) {
      log('This was a DRY RUN. No visits were actually updated.', 'WARN');
      log('Run without DRY_RUN=true to perform actual migration.', 'WARN');
    } else {
      log('Migration completed successfully!', 'SUCCESS');

      // Record migration completion
      await recordMigrationComplete(successCount);
      log('Migration completion recorded in audit log.', 'INFO');
    }

    // Step 4: Verification (only if not dry run)
    if (!DRY_RUN && successCount > 0) {
      log('');
      log('Step 4: Verifying migration...');

      // Get a sample of updated visits to verify
      const sampleVisits = await prisma.facultyVisitLog.findMany({
        where: { id: { in: visitsToMigrate.slice(0, 3).map(v => v.id) } },
        select: { id: true, requiredByDate: true },
      });

      log('  Sample of updated visits:');
      sampleVisits.forEach((visit, index) => {
        log(`    ${index + 1}. Visit ${visit.id.slice(-8)}... -> ${visit.requiredByDate ? formatDate(visit.requiredByDate) : 'null'}`);
      });

      log('  Verification complete.', 'SUCCESS');
    }

  } catch (error: any) {
    log(`Migration failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  try {
    await addVisitGracePeriod();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
