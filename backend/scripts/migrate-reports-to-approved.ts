/**
 * =============================================================================
 * MIGRATION SCRIPT: Migrate Reports to APPROVED Status
 * =============================================================================
 *
 * This script migrates existing MonthlyReport records with status SUBMITTED or
 * UNDER_REVIEW to APPROVED status. This is part of Phase 4 of the compliance
 * simplification implementation.
 *
 * WHAT IT DOES:
 *   1. Finds all MonthlyReport records with status SUBMITTED or UNDER_REVIEW
 *   2. Updates them to:
 *      - status: 'APPROVED'
 *      - isApproved: true
 *      - approvedAt: submittedAt (uses original submission date)
 *
 * USAGE:
 *   npx ts-node scripts/migrate-reports-to-approved.ts
 *
 * OPTIONS:
 *   DRY_RUN=true npx ts-node scripts/migrate-reports-to-approved.ts
 *
 * IDEMPOTENCY:
 *   This script is idempotent - running it multiple times will not cause issues
 *   as it only updates reports that are SUBMITTED or UNDER_REVIEW.
 *
 * =============================================================================
 */

import { PrismaClient, MonthlyReportStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';

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
// MIGRATION FUNCTION
// =============================================================================

async function migrateReportsToApproved() {
  const startTime = Date.now();

  logSection('MIGRATION: Reports to APPROVED Status');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`DRY_RUN: ${DRY_RUN}`);
  log('');

  try {
    // Step 1: Find all reports that need migration
    log('Step 1: Finding reports with SUBMITTED or UNDER_REVIEW status...');

    const reportsToMigrate = await prisma.monthlyReport.findMany({
      where: {
        status: {
          in: [MonthlyReportStatus.SUBMITTED, MonthlyReportStatus.UNDER_REVIEW],
        },
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reportMonth: true,
        reportYear: true,
        studentId: true,
      },
    });

    log(`  Found ${reportsToMigrate.length} reports to migrate`);

    if (reportsToMigrate.length === 0) {
      log('No reports need migration. All reports are already in final states.', 'SUCCESS');
      return;
    }

    // Log breakdown by status
    const submittedCount = reportsToMigrate.filter(r => r.status === MonthlyReportStatus.SUBMITTED).length;
    const underReviewCount = reportsToMigrate.filter(r => r.status === MonthlyReportStatus.UNDER_REVIEW).length;
    log(`  - SUBMITTED: ${submittedCount}`);
    log(`  - UNDER_REVIEW: ${underReviewCount}`);
    log('');

    // Step 2: Migrate each report individually
    // We need individual updates because approvedAt should be set to each report's submittedAt
    log('Step 2: Migrating reports...');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const report of reportsToMigrate) {
      try {
        // Use submittedAt if available, otherwise use current date
        const approvedAt = report.submittedAt || new Date();

        if (DRY_RUN) {
          log(`  [DRY_RUN] Would update report ${report.id} (${report.reportMonth}/${report.reportYear}) -> APPROVED`);
          successCount++;
          continue;
        }

        await prisma.monthlyReport.update({
          where: { id: report.id },
          data: {
            status: MonthlyReportStatus.APPROVED,
            isApproved: true,
            approvedAt: approvedAt,
          },
        });

        successCount++;

        // Log every 10 reports for progress tracking
        if (successCount % 10 === 0) {
          log(`  Progress: ${successCount}/${reportsToMigrate.length} reports migrated...`);
        }
      } catch (error: any) {
        log(`  Error migrating report ${report.id}: ${error.message}`, 'ERROR');
        errorCount++;
      }
    }

    // Step 3: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection('MIGRATION SUMMARY');
    log(`Duration: ${duration} seconds`);
    log('');
    log(`Total reports found: ${reportsToMigrate.length}`);
    log(`Successfully migrated: ${successCount}`, 'SUCCESS');
    log(`Errors: ${errorCount}`, errorCount > 0 ? 'ERROR' : 'INFO');
    log(`Skipped: ${skippedCount}`);
    log('');

    if (DRY_RUN) {
      log('This was a DRY RUN. No reports were actually migrated.', 'WARN');
      log('Run without DRY_RUN=true to perform actual migration.', 'WARN');
    } else {
      log('Migration completed successfully!', 'SUCCESS');
    }

    // Step 4: Verification (only if not dry run)
    if (!DRY_RUN && successCount > 0) {
      log('');
      log('Step 4: Verifying migration...');

      const remainingCount = await prisma.monthlyReport.count({
        where: {
          status: {
            in: [MonthlyReportStatus.SUBMITTED, MonthlyReportStatus.UNDER_REVIEW],
          },
        },
      });

      if (remainingCount === 0) {
        log('  Verification passed: No SUBMITTED or UNDER_REVIEW reports remain.', 'SUCCESS');
      } else {
        log(`  Warning: ${remainingCount} reports still have SUBMITTED or UNDER_REVIEW status.`, 'WARN');
      }

      const approvedCount = await prisma.monthlyReport.count({
        where: { status: MonthlyReportStatus.APPROVED },
      });
      log(`  Total APPROVED reports in database: ${approvedCount}`);
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
    await migrateReportsToApproved();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
