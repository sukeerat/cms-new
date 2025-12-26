/**
 * =============================================================================
 * MIGRATION SCRIPT: Populate Expected Reports & Visits Counts
 * =============================================================================
 *
 * This script calculates and populates the totalExpectedReports and
 * totalExpectedVisits fields for all internship applications based on
 * the Fixed Monthly Cycle calculation logic.
 *
 * BUSINESS RULES:
 *   - Reports are aligned with calendar months (January, February, etc.)
 *   - Report due date: 5th of the next month
 *   - Visit due date: Last day of the month (no grace period)
 *   - First month: Include only if >10 days in that month
 *   - Last month: Include only if >10 days in that month
 *
 * WHAT IT DOES:
 *   1. Finds all InternshipApplication records with startDate and endDate
 *   2. Calculates expected reports/visits using monthly cycle logic
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
import { MONTHLY_CYCLE_CONFIG } from '../src/config/monthly-cycle.config';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';

// =============================================================================
// MONTHLY CYCLE CALCULATION (from monthly-cycle.util.ts)
// Uses centralized config from: src/config/monthly-cycle.config.ts
// =============================================================================

const MIN_DAYS_FOR_INCLUSION = MONTHLY_CYCLE_CONFIG.MIN_DAYS_FOR_INCLUSION;
const MAX_MONTHS = MONTHLY_CYCLE_CONFIG.MAX_MONTHS;
const MONTH_NAMES = MONTHLY_CYCLE_CONFIG.MONTH_NAMES;

interface MonthlyCycle {
  monthNumber: number;
  monthName: string;
  year: number;
  daysInMonth: number;
  isFirstMonth: boolean;
  isLastMonth: boolean;
  isIncluded: boolean;
}

/**
 * Get the number of days in a specific month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculate all expected months for an internship
 * Only returns months with >10 days (isIncluded = true)
 */
function calculateExpectedMonths(startDate: Date, endDate: Date): MonthlyCycle[] {
  if (!startDate || !endDate) {
    return [];
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return [];
  }

  if (end < start) {
    return [];
  }

  const months: MonthlyCycle[] = [];
  let currentYear = start.getFullYear();
  let currentMonth = start.getMonth() + 1; // 1-indexed

  const endYear = end.getFullYear();
  const endMonth = end.getMonth() + 1;

  let isFirst = true;
  let monthCount = 0;

  while (
    (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) &&
    monthCount < MAX_MONTHS
  ) {
    const totalDaysInMonth = getDaysInMonth(currentYear, currentMonth);
    let daysInMonth: number;

    // Calculate days in this month for the internship
    if (currentYear === start.getFullYear() && currentMonth === start.getMonth() + 1) {
      // First month: from start date to end of month
      daysInMonth = totalDaysInMonth - start.getDate() + 1;
    } else if (currentYear === end.getFullYear() && currentMonth === end.getMonth() + 1) {
      // Last month: from start of month to end date
      daysInMonth = end.getDate();
    } else {
      // Full month
      daysInMonth = totalDaysInMonth;
    }

    const isLastMonth = currentYear === endYear && currentMonth === endMonth;
    const isIncluded = daysInMonth > MIN_DAYS_FOR_INCLUSION;

    const cycle: MonthlyCycle = {
      monthNumber: currentMonth,
      monthName: MONTH_NAMES[currentMonth - 1],
      year: currentYear,
      daysInMonth,
      isFirstMonth: isFirst,
      isLastMonth,
      isIncluded,
    };

    if (isIncluded) {
      months.push(cycle);
    }

    isFirst = false;
    monthCount++;

    // Move to next month
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return months;
}

/**
 * Get total expected count (reports or visits)
 */
function getTotalExpectedCount(startDate: Date, endDate: Date): number {
  const months = calculateExpectedMonths(startDate, endDate);
  return months.length;
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

  logSection('POPULATE: Expected Reports & Visits Counts (Monthly Cycle)');
  log(`Timestamp: ${new Date().toISOString()}`);
  log(`DRY_RUN: ${DRY_RUN}`);
  log(`Calculation Method: Fixed Monthly Cycle (>10 days rule)`);
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
    log('Step 2: Calculating expected counts using monthly cycles...');

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

        // If no end date, estimate 16 weeks (minimum internship) from start
        const effectiveEndDate = endDate || new Date(new Date(startDate).getTime() + 16 * 7 * 24 * 60 * 60 * 1000);

        // Calculate expected months
        const expectedMonths = getTotalExpectedCount(new Date(startDate), new Date(effectiveEndDate));

        if (expectedMonths === 0) {
          skippedCount++;
          continue;
        }

        stats.calculated++;

        // Check if already set with same values
        if (app.totalExpectedReports === expectedMonths && app.totalExpectedVisits === expectedMonths) {
          alreadySetCount++;
          continue;
        }

        if (DRY_RUN) {
          const months = calculateExpectedMonths(new Date(startDate), new Date(effectiveEndDate));
          const monthNames = months.map(m => m.monthName).join(', ');
          log(`  [DRY_RUN] Would update ${app.id}: ${expectedMonths} reports/visits (${monthNames})`);
          successCount++;
          continue;
        }

        // Update the application
        await prisma.internshipApplication.update({
          where: { id: app.id },
          data: {
            totalExpectedReports: expectedMonths,
            totalExpectedVisits: expectedMonths,
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
