/**
 * =============================================================================
 * MIGRATION SCRIPT: Populate Expected Reports & Visits Counts
 * =============================================================================
 *
 * This script calculates and populates the totalExpectedReports and
 * totalExpectedVisits fields for all internship applications based on
 * the 4-week cycle calculation logic.
 *
 * WHAT IT DOES:
 *   1. Finds all InternshipApplication records with startDate and endDate
 *   2. Calculates expected reports/visits using 4-week cycle logic
 *   3. Updates totalExpectedReports and totalExpectedVisits fields
 *
 * USAGE:
 *   npx ts-node scripts/populate-expected-counts.ts
 *
 * OPTIONS:
 *   DRY_RUN=true npx ts-node scripts/populate-expected-counts.ts
 *
 * IDEMPOTENCY:
 *   This script is idempotent - running it multiple times will recalculate
 *   and update the values based on current dates.
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

// =============================================================================
// 4-WEEK CYCLE CALCULATION (copied from four-week-cycle.util.ts)
// =============================================================================

const CYCLE_DURATION_DAYS = 28; // 4 weeks = 28 days
const MAX_CYCLES = 26; // Max ~2 years of internship

interface FourWeekCycle {
  cycleNumber: number;
  cycleStartDate: Date;
  cycleEndDate: Date;
}

function calculateFourWeekCycles(startDate: Date, endDate: Date): FourWeekCycle[] {
  if (!startDate || !endDate) {
    return [];
  }

  const cycles: FourWeekCycle[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [];
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (end < start) {
    return [];
  }

  let cycleNumber = 1;
  let cycleStartDate = new Date(start);

  while (cycleStartDate <= end && cycleNumber <= MAX_CYCLES) {
    const naturalCycleEnd = new Date(cycleStartDate);
    naturalCycleEnd.setDate(naturalCycleEnd.getDate() + CYCLE_DURATION_DAYS - 1);
    naturalCycleEnd.setHours(23, 59, 59, 999);

    const cycleEndDate = naturalCycleEnd > end ? new Date(end) : naturalCycleEnd;
    const isFinalCycle = cycleEndDate >= end || naturalCycleEnd >= end;

    cycles.push({
      cycleNumber,
      cycleStartDate: new Date(cycleStartDate),
      cycleEndDate: new Date(cycleEndDate),
    });

    if (isFinalCycle) {
      break;
    }

    cycleStartDate = new Date(cycleEndDate);
    cycleStartDate.setDate(cycleStartDate.getDate() + 1);
    cycleStartDate.setHours(0, 0, 0, 0);
    cycleNumber++;
  }

  return cycles;
}

function getTotalExpectedCycles(startDate: Date, endDate: Date): number {
  const cycles = calculateFourWeekCycles(startDate, endDate);
  return cycles.length;
}

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

async function populateExpectedCounts() {
  const startTime = Date.now();

  logSection('POPULATE: Expected Reports & Visits Counts');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`DRY_RUN: ${DRY_RUN}`);
  log('');

  try {
    // Step 1: Find all internship applications
    log('Step 1: Finding all internship applications...');

    const applications = await prisma.internshipApplication.findMany({
      select: {
        id: true,
        startDate: true,
        endDate: true,
        joiningDate: true,
        completionDate: true,
        totalExpectedReports: true,
        totalExpectedVisits: true,
        status: true,
        isSelfIdentified: true,
        internship: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    log(`  Found ${applications.length} internship applications`);
    log('');

    // Step 2: Calculate and update each application
    log('Step 2: Calculating expected counts...');

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let alreadySetCount = 0;

    const stats = {
      noStartDate: 0,
      noEndDate: 0,
      calculated: 0,
    };

    for (const app of applications) {
      try {
        // Determine start and end dates
        // For self-identified: use startDate/endDate from application
        // For regular: use internship dates or application joining/completion dates
        const startDate = app.startDate || app.joiningDate || app.internship?.startDate;
        const endDate = app.endDate || app.completionDate || app.internship?.endDate;

        if (!startDate) {
          stats.noStartDate++;
          skippedCount++;
          continue;
        }

        // If no end date, estimate 6 months from start
        const effectiveEndDate = endDate || new Date(new Date(startDate).getTime() + 180 * 24 * 60 * 60 * 1000);

        // Calculate expected cycles
        const expectedCycles = getTotalExpectedCycles(new Date(startDate), new Date(effectiveEndDate));

        if (expectedCycles === 0) {
          skippedCount++;
          continue;
        }

        stats.calculated++;

        // Check if already set with same values
        if (app.totalExpectedReports === expectedCycles && app.totalExpectedVisits === expectedCycles) {
          alreadySetCount++;
          continue;
        }

        if (DRY_RUN) {
          log(`  [DRY_RUN] Would update ${app.id}: ${expectedCycles} reports/visits (start: ${new Date(startDate).toLocaleDateString()}, end: ${new Date(effectiveEndDate).toLocaleDateString()})`);
          successCount++;
          continue;
        }

        // Update the application
        await prisma.internshipApplication.update({
          where: { id: app.id },
          data: {
            totalExpectedReports: expectedCycles,
            totalExpectedVisits: expectedCycles,
          },
        });

        successCount++;

        // Log progress every 50 applications
        if (successCount % 50 === 0) {
          log(`  Progress: ${successCount} applications updated...`);
        }
      } catch (error: any) {
        log(`  Error updating application ${app.id}: ${error.message}`, 'ERROR');
        errorCount++;
      }
    }

    // Step 3: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    logSection('MIGRATION SUMMARY');
    log(`Duration: ${duration} seconds`);
    log('');
    log(`Total applications found: ${applications.length}`);
    log(`Successfully updated: ${successCount}`, 'SUCCESS');
    log(`Already set correctly: ${alreadySetCount}`);
    log(`Skipped (no dates): ${skippedCount}`);
    log(`  - No start date: ${stats.noStartDate}`);
    log(`Errors: ${errorCount}`, errorCount > 0 ? 'ERROR' : 'INFO');
    log('');

    if (DRY_RUN) {
      log('This was a DRY RUN. No applications were actually updated.', 'WARN');
      log('Run without DRY_RUN=true to perform actual update.', 'WARN');
    } else {
      log('Population completed successfully!', 'SUCCESS');
    }

    // Step 4: Verification (only if not dry run)
    if (!DRY_RUN && successCount > 0) {
      log('');
      log('Step 4: Verifying population...');

      const populatedCount = await prisma.internshipApplication.count({
        where: {
          totalExpectedReports: { not: null },
          totalExpectedVisits: { not: null },
        },
      });

      const totalCount = await prisma.internshipApplication.count();

      log(`  Applications with expected counts: ${populatedCount}/${totalCount}`);

      // Show sample of updated records
      const sample = await prisma.internshipApplication.findMany({
        where: {
          totalExpectedReports: { not: null },
        },
        select: {
          id: true,
          totalExpectedReports: true,
          totalExpectedVisits: true,
          startDate: true,
          endDate: true,
        },
        take: 5,
      });

      log('  Sample of updated records:');
      for (const s of sample) {
        log(`    - ${s.id}: ${s.totalExpectedReports} reports, ${s.totalExpectedVisits} visits`);
      }
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
    await populateExpectedCounts();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
