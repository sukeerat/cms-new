/**
 * Test Script for Monthly Cycle Utility
 *
 * Run with: npx ts-node scripts/test-monthly-cycle.ts
 */

import {
  calculateExpectedMonths,
  getTotalExpectedCount,
  getExpectedReportsAsOfToday,
  getExpectedVisitsAsOfToday,
  getReportDueDate,
  getVisitDueDate,
  getMonthName,
  MONTHLY_CYCLE,
  MonthlyCycle,
} from '../src/common/utils/monthly-cycle.util';

// =============================================================================
// TEST UTILITIES
// =============================================================================

let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passCount++;
  } catch (error: any) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertArrayLength(arr: any[], expected: number, message?: string) {
  if (arr.length !== expected) {
    throw new Error(`${message || 'Array length mismatch'}: expected ${expected}, got ${arr.length}`);
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// =============================================================================
// TESTS
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('MONTHLY CYCLE UTILITY TESTS');
console.log('='.repeat(70) + '\n');

// Test: Basic month calculation
console.log('\n--- Basic Calculations ---\n');

test('getMonthName returns correct month names', () => {
  assertEqual(getMonthName(1), 'January');
  assertEqual(getMonthName(6), 'June');
  assertEqual(getMonthName(12), 'December');
});

test('getReportDueDate returns 5th of next month', () => {
  const dueDate = getReportDueDate(2025, 1); // January 2025
  assertEqual(dueDate.getMonth(), 1); // February (0-indexed)
  assertEqual(dueDate.getDate(), 5);
  assertEqual(dueDate.getFullYear(), 2025);
});

test('getReportDueDate handles December correctly (wraps to next year)', () => {
  const dueDate = getReportDueDate(2025, 12); // December 2025
  assertEqual(dueDate.getMonth(), 0); // January (0-indexed)
  assertEqual(dueDate.getDate(), 5);
  assertEqual(dueDate.getFullYear(), 2026);
});

test('getVisitDueDate returns last day of month', () => {
  // January has 31 days
  const janDue = getVisitDueDate(2025, 1);
  assertEqual(janDue.getDate(), 31);

  // February 2025 has 28 days (not leap year)
  const febDue = getVisitDueDate(2025, 2);
  assertEqual(febDue.getDate(), 28);

  // April has 30 days
  const aprDue = getVisitDueDate(2025, 4);
  assertEqual(aprDue.getDate(), 30);
});

test('getVisitDueDate handles leap year (Feb 2028)', () => {
  const febDue = getVisitDueDate(2028, 2);
  assertEqual(febDue.getDate(), 29);
});

// Test: Example 1 from document - Jan 22 to May 20 (17 weeks)
console.log('\n--- Example 1: Jan 22 - May 20 (17 weeks) ---\n');

test('Example 1: Student Jan 22 - May 20 should have 4 reports/visits', () => {
  const start = new Date('2025-01-22');
  const end = new Date('2025-05-20');
  const months = calculateExpectedMonths(start, end);

  // January: 9 days (<=10) → EXCLUDE
  // February: 28 days → INCLUDE
  // March: 31 days → INCLUDE
  // April: 30 days → INCLUDE
  // May: 20 days (>10) → INCLUDE
  // Total: 4

  assertArrayLength(months, 4, 'Should have 4 included months');
  assertEqual(months[0].monthName, 'February', 'First included should be February');
  assertEqual(months[3].monthName, 'May', 'Last included should be May');
});

test('Example 1: January (9 days) should be excluded', () => {
  const start = new Date('2025-01-22');
  const end = new Date('2025-05-20');
  const months = calculateExpectedMonths(start, end);

  const hasJanuary = months.some(m => m.monthName === 'January');
  assertEqual(hasJanuary, false, 'January should be excluded (9 days)');
});

// Test: Example 2 from document - Jan 15 to May 8 (16 weeks)
console.log('\n--- Example 2: Jan 15 - May 8 (16 weeks) ---\n');

test('Example 2: Student Jan 15 - May 8 should have 4 reports/visits', () => {
  const start = new Date('2025-01-15');
  const end = new Date('2025-05-08');
  const months = calculateExpectedMonths(start, end);

  // January: 16 days (>10) → INCLUDE
  // February: 28 days → INCLUDE
  // March: 31 days → INCLUDE
  // April: 30 days → INCLUDE
  // May: 8 days (<=10) → EXCLUDE
  // Total: 4

  assertArrayLength(months, 4, 'Should have 4 included months');
  assertEqual(months[0].monthName, 'January', 'First included should be January');
  assertEqual(months[3].monthName, 'April', 'Last included should be April');
});

test('Example 2: May (8 days) should be excluded', () => {
  const start = new Date('2025-01-15');
  const end = new Date('2025-05-08');
  const months = calculateExpectedMonths(start, end);

  const hasMay = months.some(m => m.monthName === 'May');
  assertEqual(hasMay, false, 'May should be excluded (8 days)');
});

// Test: Example 3 from document - Jan 28 to May 25 (17 weeks)
console.log('\n--- Example 3: Jan 28 - May 25 (17 weeks) ---\n');

test('Example 3: Student Jan 28 - May 25 should have 4 reports/visits', () => {
  const start = new Date('2025-01-28');
  const end = new Date('2025-05-25');
  const months = calculateExpectedMonths(start, end);

  // January: 3 days (<=10) → EXCLUDE
  // February: 28 days → INCLUDE
  // March: 31 days → INCLUDE
  // April: 30 days → INCLUDE
  // May: 25 days (>10) → INCLUDE
  // Total: 4

  assertArrayLength(months, 4, 'Should have 4 included months');
  assertEqual(months[0].monthName, 'February', 'First included should be February');
});

// Test: Edge cases
console.log('\n--- Edge Cases ---\n');

test('Edge case: Single full month (Jan 1 - Jan 31)', () => {
  const start = new Date('2025-01-01');
  const end = new Date('2025-01-31');
  const months = calculateExpectedMonths(start, end);

  assertArrayLength(months, 1, 'Should have 1 month');
  assertEqual(months[0].monthName, 'January');
  assertEqual(months[0].daysInMonth, 31);
});

test('Edge case: Both first and last month excluded (Jan 25 - May 5)', () => {
  const start = new Date('2025-01-25');
  const end = new Date('2025-05-05');
  const months = calculateExpectedMonths(start, end);

  // January: 6 days → EXCLUDE
  // February: 28 days → INCLUDE
  // March: 31 days → INCLUDE
  // April: 30 days → INCLUDE
  // May: 5 days → EXCLUDE
  // Total: 3

  assertArrayLength(months, 3, 'Should have 3 included months');
  assertEqual(months[0].monthName, 'February');
  assertEqual(months[2].monthName, 'April');
});

test('Edge case: Exactly 10 days in a month should be EXCLUDED', () => {
  const start = new Date('2025-01-22'); // 10 days in January
  const end = new Date('2025-02-28');
  const months = calculateExpectedMonths(start, end);

  // January has exactly 10 days (22-31), should be EXCLUDED (need >10)
  const hasJanuary = months.some(m => m.monthName === 'January');
  assertEqual(hasJanuary, false, 'January with exactly 10 days should be excluded');
});

test('Edge case: 11 days in a month should be INCLUDED', () => {
  const start = new Date('2025-01-21'); // 11 days in January
  const end = new Date('2025-02-28');
  const months = calculateExpectedMonths(start, end);

  // January has 11 days (21-31), should be INCLUDED (>10)
  const hasJanuary = months.some(m => m.monthName === 'January');
  assertEqual(hasJanuary, true, 'January with 11 days should be included');
});

test('Edge case: Year boundary (Dec 2024 - Feb 2025)', () => {
  const start = new Date('2024-12-15');
  const end = new Date('2025-02-28');
  const months = calculateExpectedMonths(start, end);

  // December: 16 days → INCLUDE
  // January: 31 days → INCLUDE
  // February: 28 days → INCLUDE
  // Total: 3

  assertArrayLength(months, 3, 'Should have 3 months across year boundary');
  assertEqual(months[0].year, 2024, 'First month should be in 2024');
  assertEqual(months[2].year, 2025, 'Last month should be in 2025');
});

test('Edge case: Invalid dates (end before start)', () => {
  const start = new Date('2025-05-20');
  const end = new Date('2025-01-22');
  const months = calculateExpectedMonths(start, end);

  assertArrayLength(months, 0, 'Should return empty array for invalid dates');
});

test('Edge case: Same day start and end', () => {
  const start = new Date('2025-01-15');
  const end = new Date('2025-01-15');
  const months = calculateExpectedMonths(start, end);

  // 1 day is <=10, should be excluded
  assertArrayLength(months, 0, 'Same day should result in 0 months (1 day <=10)');
});

// Test: getTotalExpectedCount
console.log('\n--- Total Expected Count ---\n');

test('getTotalExpectedCount matches calculateExpectedMonths length', () => {
  const start = new Date('2025-01-15');
  const end = new Date('2025-05-20');

  const months = calculateExpectedMonths(start, end);
  const count = getTotalExpectedCount(start, end);

  assertEqual(count, months.length, 'Count should match months array length');
});

// Test: Constants
console.log('\n--- Constants ---\n');

test('MONTHLY_CYCLE.MIN_DAYS_FOR_INCLUSION is 10', () => {
  assertEqual(MONTHLY_CYCLE.MIN_DAYS_FOR_INCLUSION, 10);
});

test('MONTHLY_CYCLE.REPORT_DUE_DAY is 5', () => {
  assertEqual(MONTHLY_CYCLE.REPORT_DUE_DAY, 5);
});

// Test: Due date calculations
console.log('\n--- Due Date Calculations ---\n');

test('Report for January 2025 is due Feb 5, 2025', () => {
  const dueDate = getReportDueDate(2025, 1);
  assertEqual(formatDate(dueDate), '2025-02-05');
});

test('Visit for January 2025 is due Jan 31, 2025', () => {
  const dueDate = getVisitDueDate(2025, 1);
  assertEqual(formatDate(dueDate), '2025-01-31');
});

// Test: Long internship
console.log('\n--- Long Internship ---\n');

test('5 month internship (Jan 1 - May 31) should have 5 reports', () => {
  const start = new Date('2025-01-01');
  const end = new Date('2025-05-31');
  const count = getTotalExpectedCount(start, end);

  assertEqual(count, 5, 'Should have 5 months included');
});

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));
console.log(`\n  Total: ${passCount + failCount}`);
console.log(`  ✅ Passed: ${passCount}`);
console.log(`  ❌ Failed: ${failCount}`);
console.log('\n' + '='.repeat(70) + '\n');

if (failCount > 0) {
  process.exit(1);
}
