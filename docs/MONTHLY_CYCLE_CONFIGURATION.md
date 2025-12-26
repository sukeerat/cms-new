# Monthly Cycle Configuration Guide

This document explains how to modify the business rules for the Fixed Monthly Cycle system.

## Quick Reference

| Rule | Config Key | Default | Location |
|------|-----------|---------|----------|
| Minimum days for inclusion | `MIN_DAYS_FOR_INCLUSION` | 10 | Backend + Frontend config |
| Report due day | `REPORT_DUE_DAY` | 5 | Backend + Frontend config |
| Visit due on month end | `VISIT_DUE_ON_MONTH_END` | true | Backend + Frontend config |
| Max internship months | `MAX_MONTHS` | 24 | Backend + Frontend config |
| Min internship weeks | `MIN_INTERNSHIP_WEEKS` | 16 | Backend + Frontend config |

---

## Configuration Files

### Backend (Primary Source of Truth)
```
backend/src/config/monthly-cycle.config.ts
```

### Frontend (Must Match Backend)
```
frontend/src/config/monthlyCycle.config.js
```

---

## Step-by-Step: How to Change a Rule

### Example: Change minimum days from 10 to 7

#### Step 1: Update Backend Config
Edit `backend/src/config/monthly-cycle.config.ts`:

```typescript
// Before
MIN_DAYS_FOR_INCLUSION: 10,

// After
MIN_DAYS_FOR_INCLUSION: 7,
```

#### Step 2: Update Frontend Config
Edit `frontend/src/config/monthlyCycle.config.js`:

```javascript
// Before
MIN_DAYS_FOR_INCLUSION: 10,

// After
MIN_DAYS_FOR_INCLUSION: 7,
```

#### Step 3: Rebuild and Test
```bash
# Backend
cd backend
npx tsc --noEmit
npx ts-node scripts/test-monthly-cycle.ts

# Frontend
cd frontend
npm run build
```

#### Step 4: Update Existing Data (if needed)
```bash
cd backend
npx ts-node scripts/populate-expected-counts.ts
```

---

## Configuration Options

### Month Inclusion Rule

**Key:** `MIN_DAYS_FOR_INCLUSION`
**Default:** `10`
**Range:** `1-28`

Controls the minimum number of days a student must have in a month for it to be included in reporting.

| Value | Effect |
|-------|--------|
| 10 | Months with ≤10 days excluded |
| 7 | Months with ≤7 days excluded |
| 1 | All months included (even 1 day) |

**Example:**
- Student starts Jan 22 (9 days in January)
- With `MIN_DAYS_FOR_INCLUSION = 10`: January **EXCLUDED**
- With `MIN_DAYS_FOR_INCLUSION = 7`: January **INCLUDED**

---

### Report Due Date

**Key:** `REPORT_DUE_DAY`
**Default:** `5`
**Range:** `1-28`

The day of the **next month** when reports are due.

| Value | Effect |
|-------|--------|
| 5 | January report due Feb 5 |
| 10 | January report due Feb 10 |
| 1 | January report due Feb 1 |

---

### Visit Due Date

**Key:** `VISIT_DUE_ON_MONTH_END`
**Default:** `true`

Controls when visits are due.

| Value | Effect |
|-------|--------|
| true | Visit due on last day of month (Jan 31, Feb 28, etc.) |
| false | Visit due on day specified by `VISIT_DUE_DAY` |

**Key:** `VISIT_DUE_DAY`
**Default:** `28`
**Range:** `1-28`

Only used if `VISIT_DUE_ON_MONTH_END = false`.

---

### Internship Limits

**Key:** `MAX_MONTHS`
**Default:** `24`

Maximum number of months an internship can span. Prevents calculation issues with very long internships.

**Key:** `MIN_INTERNSHIP_WEEKS`
**Default:** `16`

Minimum internship duration in weeks. Used for validation.

---

### Notification Settings

**Key:** `REMINDER_DAYS_BEFORE_DEADLINE`
**Default:** `5`

Days before deadline to send reminder notifications.

**Key:** `SEND_OVERDUE_NOTIFICATIONS`
**Default:** `true`

Whether to send notifications for overdue items.

---

### Auto-Approval

**Key:** `AUTO_APPROVE_REPORTS`
**Default:** `true`

Whether reports are automatically approved upon submission.

---

### Status Labels

Customize the text shown in the UI:

```typescript
STATUS_LABELS: {
  REPORT_NOT_STARTED: 'Not Started',
  REPORT_DRAFT: 'Draft',
  REPORT_SUBMITTED: 'Submitted',
  REPORT_APPROVED: 'Approved',
  REPORT_OVERDUE: 'Overdue',
  VISIT_UPCOMING: 'Upcoming',
  VISIT_PENDING: 'Pending',
  VISIT_COMPLETED: 'Completed',
  VISIT_OVERDUE: 'Overdue',
}
```

---

### Status Colors

Customize badge colors in the UI:

```typescript
STATUS_COLORS: {
  NOT_STARTED: 'gray',
  DRAFT: 'blue',
  SUBMITTED: 'yellow',
  APPROVED: 'green',
  COMPLETED: 'green',
  PENDING: 'orange',
  UPCOMING: 'blue',
  OVERDUE: 'red',
}
```

---

### Month Names

For localization, change month names:

```typescript
MONTH_NAMES: [
  'January',   // Or 'Enero', 'Janvier', etc.
  'February',
  // ...
]
```

---

## Files That Use the Config

### Backend
| File | Uses Config For |
|------|-----------------|
| `src/common/utils/monthly-cycle.util.ts` | All calculations |
| `scripts/populate-expected-counts.ts` | Data migration |
| `scripts/test-monthly-cycle.ts` | Testing |

### Frontend
| File | Uses Config For |
|------|-----------------|
| `src/utils/monthlyCycle.js` | All calculations |

---

## Validation

The backend config includes a validation function:

```typescript
import { validateConfig } from './config/monthly-cycle.config';

const result = validateConfig();
if (!result.valid) {
  console.error('Config errors:', result.errors);
}
```

---

## Common Scenarios

### Scenario 1: Be more lenient with partial months
Change `MIN_DAYS_FOR_INCLUSION` from 10 to 5:
- More months will be included
- Students get more reports to submit

### Scenario 2: Give students more time for reports
Change `REPORT_DUE_DAY` from 5 to 10:
- Reports due on 10th of next month instead of 5th
- More grace period for submissions

### Scenario 3: Make visits due mid-month
```typescript
VISIT_DUE_ON_MONTH_END: false,
VISIT_DUE_DAY: 15,
```
- Visits now due on 15th of each month

---

## Testing Changes

After modifying the config, always run the test suite:

```bash
cd backend
npx ts-node scripts/test-monthly-cycle.ts
```

Expected output:
```
======================================================================
TEST SUMMARY
======================================================================

  Total: 23
  ✅ Passed: 23
  ❌ Failed: 0
```

---

## Troubleshooting

### Values not updating?
1. Make sure you updated **both** backend and frontend configs
2. Rebuild both: `npx tsc --noEmit` (backend) and `npm run build` (frontend)
3. Clear browser cache for frontend changes

### Tests failing?
If tests fail after changing config, update the test expectations in:
```
backend/scripts/test-monthly-cycle.ts
```

### Data out of sync?
Re-run the migration script:
```bash
DRY_RUN=true npx ts-node scripts/populate-expected-counts.ts  # Preview
npx ts-node scripts/populate-expected-counts.ts                # Apply
```

---

*Document Version: 1.0*
*Last Updated: December 27, 2025*
