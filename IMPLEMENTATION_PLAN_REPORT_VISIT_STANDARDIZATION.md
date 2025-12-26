# Implementation Plan: Report & Visit Calculation Standardization

## Decision Summary

Based on clarifications received, the following decisions have been made:

| Area | Decision |
|------|----------|
| Report Status | Auto-approve on submission (DRAFT → APPROVED directly) |
| Faculty Review | Remove review capability - view only |
| Visit Grace Period | Add 5-day grace period (align with reports) |
| Joining Letter Rate | Keep current behavior (count all) |
| Rounding | Use `Math.round()` everywhere |

---

## Implementation Tasks

### Phase 1: Report Auto-Approval

#### Task 1.1: Update MonthlyReportStatus Enum
**File:** `backend/prisma/schema.prisma`

**Current:**
```prisma
enum MonthlyReportStatus {
  DRAFT
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  REVISION_REQUIRED
}
```

**Change to:**
```prisma
enum MonthlyReportStatus {
  DRAFT
  APPROVED      // Only two states needed
}
```

**Note:** This is a breaking change. Consider keeping old values but deprecating them, or run a migration to update all existing records.

---

#### Task 1.2: Update Monthly Report Service - Submit Method
**File:** `backend/src/domain/report/monthly/monthly-report.service.ts`

**Location:** `submitReport()` method (Lines ~30-115)

**Changes Required:**
1. Remove status validation for SUBMITTED state
2. Set status directly to APPROVED on submission
3. Set `isApproved: true` automatically
4. Set `approvedAt` to submission time
5. Remove any review-related logic

**Code Change:**
```typescript
// BEFORE (approximate)
async submitReport(data: CreateMonthlyReportDto) {
  // ... validation ...
  const report = await this.prisma.monthlyReport.create({
    data: {
      ...data,
      status: MonthlyReportStatus.SUBMITTED,  // OLD
      submittedAt: new Date(),
    },
  });
  // ...
}

// AFTER
async submitReport(data: CreateMonthlyReportDto) {
  // ... validation ...
  const now = new Date();
  const report = await this.prisma.monthlyReport.create({
    data: {
      ...data,
      status: MonthlyReportStatus.APPROVED,   // NEW: Auto-approve
      submittedAt: now,
      isApproved: true,                        // NEW
      approvedAt: now,                         // NEW
    },
  });
  // ...
}
```

---

#### Task 1.3: Remove Review Methods from Service
**File:** `backend/src/domain/report/monthly/monthly-report.service.ts`

**Methods to Remove/Deprecate:**
- `reviewReport()` (Lines ~187-253)
- Any approval/rejection logic

**Alternative:** Keep methods but have them return immediately or throw "Feature disabled" error.

---

#### Task 1.4: Update Report Statistics Calculation
**File:** `backend/src/domain/report/monthly/monthly-report.service.ts`

**Location:** `getReportStatistics()` (Lines ~255-299)

**Changes Required:**
Since all submitted reports are now APPROVED, simplify the statistics:

```typescript
// BEFORE
const pending = countsByStatus[MonthlyReportStatus.SUBMITTED] ?? 0;
const approved = countsByStatus[MonthlyReportStatus.APPROVED] ?? 0;
const rejected = countsByStatus[MonthlyReportStatus.REJECTED] ?? 0;

// AFTER
const approved = countsByStatus[MonthlyReportStatus.APPROVED] ?? 0;
const draft = countsByStatus[MonthlyReportStatus.DRAFT] ?? 0;

return {
  total: approved + draft,
  submitted: approved,        // All submitted = approved now
  draft: draft,
  submissionRate: total > 0 ? Math.round((approved / total) * 100) : 0,
};
```

---

#### Task 1.5: Update State Dashboard Service
**File:** `backend/src/api/state/services/state-dashboard.service.ts`

**Location:** Report counting queries (Lines ~300-340)

**Changes Required:**
Update status filters to only count APPROVED:

```typescript
// BEFORE
where: { status: { in: ['SUBMITTED', 'APPROVED'] } }

// AFTER
where: { status: MonthlyReportStatus.APPROVED }
```

---

#### Task 1.6: Update State Institution Service
**File:** `backend/src/api/state/services/state-institution.service.ts`

**Location:** Report counting queries (Lines ~290-310)

**Same change as Task 1.5**

---

#### Task 1.7: Remove Faculty Report Review UI
**File:** `frontend/src/features/faculty/reports/MonthlyReportsPage.jsx`

**Changes Required:**
1. Remove "Approve", "Reject", "Request Revision" buttons
2. Remove review modal/dialog
3. Keep only "View" action
4. Update table to show reports in read-only mode

**Specific UI Elements to Remove:**
- Approval action buttons
- Review comments input
- Status change dropdown
- Any review-related modals

---

#### Task 1.8: Update Frontend Report Service
**File:** `frontend/src/services/report.service.js` (or similar)

**Changes Required:**
- Remove `approveReport()`, `rejectReport()` API calls
- Keep only `getReports()` and `submitReport()` methods

---

### Phase 2: Faculty Visit Grace Period

#### Task 2.1: Update Four-Week Cycle Utility
**File:** `backend/src/common/utils/four-week-cycle.util.ts`

**Current visit due date logic:**
```typescript
requiredByDate = cycleEndDate  // No grace period
```

**Change to:**
```typescript
// Add constant for visit grace period
export const VISIT_GRACE_DAYS = 5;  // Same as SUBMISSION_GRACE_DAYS

// In cycle calculation, add:
visitDueDate = addDays(cycleEndDate, VISIT_GRACE_DAYS);
```

---

#### Task 2.2: Update Faculty Visit Service
**File:** `backend/src/domain/report/faculty-visit/faculty-visit.service.ts`

**Location:** `generateExpectedVisits()` (Lines ~461-558)

**Changes Required:**
Update `requiredByDate` calculation:

```typescript
// BEFORE
requiredByDate: cycle.cycleEndDate,

// AFTER
requiredByDate: addDays(cycle.cycleEndDate, 5),  // Add 5-day grace
```

---

#### Task 2.3: Update Visit Status Calculation
**File:** `backend/src/domain/report/faculty-visit/faculty-visit.service.ts`

**Location:** `getVisitSubmissionStatus()` (Lines ~76-135)

**Changes Required:**
Update overdue calculation to account for grace period:

```typescript
// The requiredByDate already includes grace period now
// No changes needed if requiredByDate is updated in Task 2.2
```

---

#### Task 2.4: Update Frontend Visit Status Utils
**File:** `frontend/src/features/student/applications/utils/applicationUtils.js`

**Location:** `getVisitStatus()` (Lines ~301-354)

**Changes Required:**
Ensure frontend uses `requiredByDate` from backend (which now includes grace period).

No changes needed if frontend already uses backend-provided `requiredByDate`.

---

### Phase 3: Rounding Standardization

#### Task 3.1: Update State Dashboard Service Rounding
**File:** `backend/src/api/state/services/state-dashboard.service.ts`

**Locations to Update:**
- Line ~323: Change `.toFixed(1)` to `Math.round()`
- Line ~337: Verify using `Math.round()`
- Line ~759: Verify using `Math.round()`

**Pattern:**
```typescript
// BEFORE
submissionRate: ((count / total) * 100).toFixed(1)

// AFTER
submissionRate: Math.round((count / total) * 100)
```

---

#### Task 3.2: Update Principal Service Rounding
**File:** `backend/src/api/principal/principal.service.ts`

**Location:** Line ~110

**Change:**
```typescript
// BEFORE
completionRate: ((completed / total) * 100).toFixed(2)

// AFTER
completionRate: Math.round((completed / total) * 100)
```

---

#### Task 3.3: Audit All Services for Rounding
**Files to Check:**
- `backend/src/api/state/services/state-institution.service.ts` - OK (uses Math.round)
- `backend/src/domain/report/monthly/monthly-report.service.ts` - OK (uses Math.round)
- `backend/src/domain/report/faculty-visit/faculty-visit.service.ts` - Verify
- `backend/src/api/system-admin/services/analytics.service.ts` - Verify

---

### Phase 4: Database Migration

#### Task 4.1: Create Migration for Existing Reports
**Purpose:** Update all existing SUBMITTED/UNDER_REVIEW reports to APPROVED

```sql
-- Migration: auto_approve_existing_reports
UPDATE monthly_reports
SET
  status = 'APPROVED',
  is_approved = true,
  approved_at = submitted_at
WHERE
  status IN ('SUBMITTED', 'UNDER_REVIEW');
```

---

#### Task 4.2: Update Existing Visit Due Dates
**Purpose:** Add 5-day grace to existing visit records

```sql
-- Migration: add_visit_grace_period
UPDATE faculty_visit_logs
SET required_by_date = DATE_ADD(required_by_date, INTERVAL 5 DAY)
WHERE required_by_date IS NOT NULL;
```

---

### Phase 5: Testing & Validation

#### Task 5.1: Unit Tests to Update
- `monthly-report.service.spec.ts` - Remove review tests, add auto-approve tests
- `faculty-visit.service.spec.ts` - Update due date expectations
- `state-dashboard.service.spec.ts` - Update status filter expectations

#### Task 5.2: Integration Tests
- Test report submission → verify immediate APPROVED status
- Test visit creation → verify correct due date with grace period
- Test dashboard statistics → verify consistent calculations

#### Task 5.3: Manual Testing Checklist
- [ ] Student can submit report → shows as APPROVED immediately
- [ ] Faculty cannot see approve/reject buttons
- [ ] Faculty can view report details (read-only)
- [ ] Visit due dates show correctly (with 5-day grace)
- [ ] Dashboard percentages are whole numbers
- [ ] State-level statistics match institution-level

---

## File Change Summary

### Backend Files to Modify:

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Simplify MonthlyReportStatus enum |
| `domain/report/monthly/monthly-report.service.ts` | Auto-approve, remove review |
| `domain/report/faculty-visit/faculty-visit.service.ts` | Add grace period |
| `common/utils/four-week-cycle.util.ts` | Add VISIT_GRACE_DAYS constant |
| `api/state/services/state-dashboard.service.ts` | Update rounding, status filters |
| `api/state/services/state-institution.service.ts` | Update status filters |
| `api/principal/principal.service.ts` | Update rounding |
| `api/faculty/faculty.controller.ts` | Remove review endpoints |

### Frontend Files to Modify:

| File | Changes |
|------|---------|
| `features/faculty/reports/MonthlyReportsPage.jsx` | Remove review UI |
| `services/report.service.js` | Remove review API calls |
| `features/student/applications/utils/applicationUtils.js` | Verify visit status logic |

### New Files to Create:

| File | Purpose |
|------|---------|
| `migrations/YYYYMMDD_auto_approve_reports.sql` | Migrate existing reports |
| `migrations/YYYYMMDD_add_visit_grace_period.sql` | Migrate existing visits |

---

## Implementation Order

1. **Phase 1** (Report Auto-Approval) - Highest impact, do first
2. **Phase 4** (Database Migration) - Run immediately after Phase 1
3. **Phase 2** (Visit Grace Period) - Can be done in parallel
4. **Phase 3** (Rounding) - Quick fixes, can be done anytime
5. **Phase 5** (Testing) - After all changes

---

## Rollback Plan

If issues arise:

1. **Report Status:** Keep old enum values in schema, just don't use them
2. **Visit Grace:** Can revert by subtracting 5 days from due dates
3. **Rounding:** Non-breaking, easy to revert

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| Remove approval workflow | Medium | Ensure faculty can still view reports |
| Change enum values | High | Keep old values, deprecate don't delete |
| Visit grace period | Low | Pure additive change |
| Rounding changes | Low | Visual only, no data impact |

---

*Plan created: December 26, 2025*
*Based on findings from MONTHLY_REPORT_FACULTY_VISIT_CALCULATION_FINDINGS.md*
