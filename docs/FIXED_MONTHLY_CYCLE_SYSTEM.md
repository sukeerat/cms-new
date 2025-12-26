# Fixed Monthly Cycle System - Implementation Guide

## Document Purpose
This document serves as a complete reference for implementing the Fixed Monthly Cycle system for tracking internship reports and faculty visits. It replaces the previous 4-week cycle system.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Business Requirements](#2-business-requirements)
3. [Clarification Questions (NEEDS ANSWERS)](#3-clarification-questions-needs-answers)
4. [Technical Specifications](#4-technical-specifications)
5. [Database Changes](#5-database-changes)
6. [Backend Implementation](#6-backend-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Legacy Code Removal](#8-legacy-code-removal)
9. [Migration Plan](#9-migration-plan)
10. [Testing Requirements](#10-testing-requirements)

---

## 1. Executive Summary

### What's Changing
| Aspect | Old System (4-Week Cycle) | New System (Fixed Monthly) |
|--------|---------------------------|----------------------------|
| Cycle Period | 28 days from individual start date | Calendar months (Jan, Feb, Mar, Apr, May) |
| Deadlines | Individual per student | Same for all students in a month |
| Report Due | Cycle end + 5 days | Month end + 5 days (e.g., Jan report due Feb 5) |
| Visit Due | Cycle end + 5 days | Month end, NO grace (e.g., Jan visit due Jan 31) |
| Tracking | "Cycle 1, 2, 3, 4" | "January, February, March, April, May" |
| Complexity | High | Low |

### Why This Change
1. **Simplicity**: Calendar months are intuitive and universal
2. **Consistency**: All students have same deadlines per month
3. **Easy Dashboard**: Show Jan, Feb, Mar, Apr, May tabs clearly
4. **Better Comparison**: Easy to compare students and institutions

---

## 2. Business Requirements

### 2.1 Confirmed Requirements

| Requirement | Value | Status |
|-------------|-------|--------|
| Minimum internship duration | 16 weeks | ✅ Confirmed |
| Reports per month | 1 | ✅ Confirmed |
| Visits per month | 1 | ✅ Confirmed |
| Report grace period | 5 days after month end | ✅ Confirmed |
| Visit grace period | NONE (due at month end) | ✅ Confirmed |
| First month rule | Include only if >10 days | ✅ Confirmed |
| Last month rule | Include only if >10 days | ✅ Confirmed |

### 2.2 Typical Internship Timeline (Jan-May 2025)

**Most students: Start Jan 22**
```
January   → EXCLUDED (9 days ≤10)
February  → 28 days → Report due Mar 5,  Visit due Feb 28
March     → 31 days → Report due Apr 5,  Visit due Mar 31
April     → 30 days → Report due May 5,  Visit due Apr 30
May       → varies  → Report due Jun 5,  Visit due May 31 (if >10 days)
```

**Some students: Start Jan 15**
```
January   → 16 days → Report due Feb 5,  Visit due Jan 31 (16 days >10, INCLUDED)
February  → 28 days → Report due Mar 5,  Visit due Feb 28
March     → 31 days → Report due Apr 5,  Visit due Mar 31
April     → 30 days → Report due May 5,  Visit due Apr 30
May       → varies  → Report due Jun 5,  Visit due May 31 (if >10 days)
```

---

## 3. Clarification Questions (NEEDS ANSWERS)

### CRITICAL QUESTIONS - Must Answer Before Implementation

#### Q1: Report Naming Convention
**Question:** What should we call the reports/visits?
- Option A: "January Report", "February Report" (month name)
- Option B: "Report 1", "Report 2" (numbered)
- Option C: "Month 1 Report", "Month 2 Report" (numbered month)

**Current Assumption:** "January Report" (month name) Option A

---

#### Q2: Student Starting Jan 31 or Very Late
**Question:** If a student starts on Jan 31 (only 1 day in January), should they still submit a January report?
No check if last month has more than 10 days, as most will be, skip january if less than 10 days
**Current Rule:** Yes, first month always included (compensated in last month)

**Clarify:** Is this correct? Even for 1-2 days? No, No check if last month has more than 10 days, as most will be, skip january if less than 10 days

---

#### Q3: Visit Due Date Timing
**Question:** You said visits have NO grace period. Is the visit due at:
- Option A: End of month 11:59 PM (Jan 31, 11:59 PM)
- Option B: Start of next month (Feb 1, 12:00 AM)
- Option C: Some other time?

**Current Assumption:** End of month 11:59:59 PM yes
yes

---

#### Q4: What Happens When Report/Visit is Overdue?
**Question:** When a student misses a deadline:
- Can they still submit late?
- yes
- Is there a penalty or flag?
- there is a flag in shcema
- Does it affect their compliance score?
- no
- Is there a maximum late period?
- no

---

#### Q5: Auto-Approval Still Applies?
**Question:** We recently implemented auto-approval for reports. Does this still apply?
- Reports auto-approve on submission (no faculty review)?
- Or does monthly system need faculty approval?

**Current Assumption:** Auto-approval still applies yers

---

#### Q6: Expected Reports/Visits Calculation
**Question:** When calculating "expected" for dashboard:
- Should we count ALL expected months? (e.g., 5 total) yes like as in 
- Or only months where deadline has passed?
o, No check if last month has more than 10 days, as most will be, skip january if less than 10 days only 4 Reports/Visits
**Example:** Today is Feb 10
- Student has 5 months total (Jan-May)
- Only January deadline has passed
- Expected = 1 (only Jan) OR Expected = 5 (total)?

**Current Assumption:** Expected = only months where deadline has passed

---

#### Q7: Dashboard Filter Options
**Question:** What filters should dashboards support?
- Filter by specific month (January only, February only)?
- Filter by status (overdue, pending, completed)? 
- Filter by institution/student?
- Date range filter?
- 
- Filter by status (overdue, pending, completed)

---

#### Q8: What About Students Who Started Earlier?
**Question:** If there are existing students who started before January (e.g., Dec 2024):
- Do they follow the new monthly system?
- Or do they continue with old 4-week cycles?
- Or do we migrate them to monthly?
- there will not be any

---

#### Q9: Future Years
**Question:** For students starting in different years (e.g., 2026):
- Same monthly system applies?
- Any year-specific considerations?
there is no need, we can change it

---

#### Q10: Minimum 16 Weeks Validation
**Question:** How should we handle internships shorter than 16 weeks?
- Prevent creation?
- Allow but show warning?
- Calculate fewer months?
Prevent creation
---

#### Q11: Partial Month Display
**Question:** When a student has few days in a month:
- Show "January (9 days)" in UI?
- Or just "January"?
- Any visual indicator for partial months?
no
---

#### Q12: Report Content Requirements
**Question:** Does the report content change based on days in month?
- Full month report vs partial month report?
- Same template for all?
Same template for all
---

### LOWER PRIORITY QUESTIONS

#### Q13: Notification Timing
**Question:** When should reminder notifications be sent?
- How many days before report deadline? 5
- How many days before visit deadline? 5
- After deadline (overdue reminder)? yes

---

#### Q14: Faculty Bulk Actions
**Question:** Can faculty complete visits for multiple students at once?
yes
- Or must be individual?

---

#### Q15: Report/Visit Linking
**Question:** Should report and visit be linked?
- Visit must happen before report can be submitted?
- Independent of each other?
Independent of each other
---

## 4. Technical Specifications

### 4.1 Month Calculation Algorithm

```
For each student internship (startDate, endDate):

1. Get all months from startDate.month to endDate.month

2. For FIRST month:
   - Calculate daysInMonth = days from startDate to month end
   - IF daysInMonth > 10: Include
   - IF daysInMonth <= 10: EXCLUDE

3. For MIDDLE months:
   - ALWAYS include
   - daysInMonth = full month

4. For LAST month:
   - Calculate daysInMonth = days from month start to endDate
   - IF daysInMonth > 10: Include
   - IF daysInMonth <= 10: EXCLUDE 
   same for first month

5. Return array of months to track
```

### 4.2 Due Date Calculation

```
REPORT DUE DATE:
- January report  → Due February 5
- February report → Due March 5
- March report    → Due April 5
- April report    → Due May 5
- May report      → Due June 5
Formula: 5th day of (month + 1)

VISIT DUE DATE:
- January visit   → Due January 31
- February visit  → Due February 28/29
- March visit     → Due March 31
- April visit     → Due April 30
- May visit       → Due May 31
Formula: Last day of month
```

### 4.3 Status Definitions

**Report Status:**
| Status | Condition |
|--------|-----------|
| NOT_STARTED | No report created, deadline not passed |
| DRAFT | Report created but not submitted |
| APPROVED | Report submitted (auto-approved) |
| OVERDUE | Deadline passed, not submitted |

**Visit Status:**
| Status | Condition |
|--------|-----------|
| UPCOMING | Month hasn't started yet |
| PENDING | In current month, not completed |
| COMPLETED | Visit completed |
| OVERDUE | Month ended, not completed |

### 4.4 Examples

**Example 1: Student Jan 22 - May 20 (17 weeks)**
```
January   → EXCLUDE (9 days ≤10)
February  → Include (28 days) → Report due Mar 5,  Visit due Feb 28
March     → Include (31 days) → Report due Apr 5,  Visit due Mar 31
April     → Include (30 days) → Report due May 5,  Visit due Apr 30
May       → Include (20 days) → Report due Jun 5,  Visit due May 31
TOTAL: 4 Reports + 4 Visits
```

**Example 2: Student Jan 15 - May 8 (16 weeks)**
```
January   → Include (16 days) → Report due Feb 5,  Visit due Jan 31
February  → Include (28 days) → Report due Mar 5,  Visit due Feb 28
March     → Include (31 days) → Report due Apr 5,  Visit due Mar 31
April     → Include (30 days) → Report due May 5,  Visit due Apr 30
May       → EXCLUDE (8 days ≤10)
TOTAL: 4 Reports + 4 Visits
```

**Example 3: Student Jan 28 - May 25 (17 weeks)**
```
January   → EXCLUDE (3 days ≤10)
February  → Include (28 days) → Report due Mar 5,  Visit due Feb 28
March     → Include (31 days) → Report due Apr 5,  Visit due Mar 31
April     → Include (30 days) → Report due May 5,  Visit due Apr 30
May       → Include (25 days) → Report due Jun 5,  Visit due May 31
TOTAL: 4 Reports + 4 Visits
```

---

## 5. Database Changes

### 5.1 MonthlyReport Table
Keep existing structure, use these fields:
- `reportMonth` (1-12): The calendar month
- `reportYear` (2025): The year
- `dueDate`: Calculate as month end + 5 days

### 5.2 FacultyVisitLog Table
Add/update fields:
- `visitMonth` (1-12): The calendar month (ADD if not exists)
- `visitYear` (2025): The year (ADD if not exists)
- `requiredByDate`: Calculate as month end (no grace)

### 5.3 InternshipApplication Table
Update calculation:
- `totalExpectedReports`: Count of expected months
- `totalExpectedVisits`: Same as reports

---

## 6. Backend Implementation

### 6.1 New Utility File
Create: `backend/src/common/utils/monthly-cycle.util.ts`

Key functions:
- `calculateExpectedMonths(startDate, endDate)` → MonthlyCycle[]
- `getReportDueDate(year, month)` → Date
- `getVisitDueDate(year, month)` → Date
- `getReportSubmissionStatus(report, dueDate)` → Status
- `getVisitSubmissionStatus(visit, dueDate)` → Status
- `getTotalExpectedCount(startDate, endDate)` → number
- `getExpectedReportsAsOfToday(startDate, endDate)` → number
- `getExpectedVisitsAsOfToday(startDate, endDate)` → number

### 6.2 Services to Update

| Service | Changes |
|---------|---------|
| `state-dashboard.service.ts` | Use monthly calculations, update API response |
| `state-institution.service.ts` | Use monthly calculations |
| `principal.service.ts` | Use monthly calculations |
| `faculty.service.ts` | Use monthly calculations |
| `student.service.ts` | Use monthly calculations |
| `monthly-report.service.ts` | Update due date logic |
| `faculty-visit.service.ts` | Update due date logic, add visitMonth/visitYear |

### 6.3 API Response Structure

```json
{
  "monthlyProgress": {
    "january": {
      "reports": { "submitted": 450, "expected": 500, "overdue": 50 },
      "visits": { "completed": 480, "expected": 500, "overdue": 20 },
      "reportDueDate": "2025-02-05",
      "visitDueDate": "2025-01-31"
    },
    "february": {
      "reports": { "submitted": 120, "expected": 500, "overdue": 0 },
      "visits": { "completed": 100, "expected": 500, "overdue": 0 },
      "reportDueDate": "2025-03-05",
      "visitDueDate": "2025-02-28"
    }
  },
  "totals": {
    "totalReports": { "submitted": 570, "expected": 1000, "overdue": 50 },
    "totalVisits": { "completed": 580, "expected": 1000, "overdue": 20 }
  },
  "currentMonth": "february"
}
```

---

## 7. Frontend Implementation

### 7.1 New Utility File
Create: `frontend/src/utils/monthlyCycle.js`
(Mirror backend logic for client-side calculations)

### 7.2 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  MONTHLY PROGRESS                                                    │
├───────────┬───────────┬───────────┬───────────┬───────────┬────────┤
│  JANUARY  │ FEBRUARY  │   MARCH   │   APRIL   │    MAY    │ TOTAL  │
├───────────┼───────────┼───────────┼───────────┼───────────┼────────┤
│ Reports   │ Reports   │ Reports   │ Reports   │ Reports   │        │
│ 450/500   │ 120/500   │ -/500     │ -/500     │ -/480     │ 570    │
│ ✓ 90%     │ 24%       │ Upcoming  │ Upcoming  │ Upcoming  │        │
├───────────┼───────────┼───────────┼───────────┼───────────┼────────┤
│ Visits    │ Visits    │ Visits    │ Visits    │ Visits    │        │
│ 480/500   │ 100/500   │ -/500     │ -/500     │ -/480     │ 580    │
│ ✓ 96%     │ 20%       │ Upcoming  │ Upcoming  │ Upcoming  │        │
├───────────┼───────────┼───────────┼───────────┼───────────┼────────┤
│ Due: Feb 5│ Due: Mar 5│ Due: Apr 5│ Due: May 5│ Due: Jun 5│        │
│ Visit:1/31│ Visit:2/28│ Visit:3/31│ Visit:4/30│ Visit:5/31│        │
└───────────┴───────────┴───────────┴───────────┴───────────┴────────┘
```

### 7.3 Components to Update

**State Level:**
- `StatisticsCards.jsx`
- `PerformanceMetrics.jsx`
- `InstituteDetailView.jsx`
- `InstitutionsTable.jsx`

**Principal Level:**
- `PrincipalDashboard.jsx`
- `Analytics.jsx`
- `StudentProgress.jsx`

**Faculty Level:**
- `FacultyDashboard.jsx`
- `AssignedStudentsList.jsx`
- `StudentDetailsModal.jsx`
- `MonthlyReportsCard.jsx`

**Student Level:**
- `StudentDashboard.jsx`
- `MonthlyReportsCard.jsx`
- `applicationUtils.js`

---

## 8. Legacy Code Removal

### 8.1 Files to Remove/Deprecate

**Backend:**
| File | Action |
|------|--------|
| `backend/src/common/utils/four-week-cycle.util.ts` | Mark DEPRECATED, keep for reference |
| `backend/scripts/populate-expected-counts.ts` | Update to use monthly logic |

**Frontend:**
| File | Action |
|------|--------|
| `frontend/src/utils/fourWeekCycle.js` | DELETE |

### 8.2 Imports to Update

Remove `four-week-cycle` imports from:
1. `backend/src/api/principal/principal.service.ts`
2. `backend/src/api/state/services/state-dashboard.service.ts`
3. `backend/src/api/state/services/state-institution.service.ts`
4. `backend/src/api/faculty/faculty.service.ts`
5. `backend/src/api/student-portal/student.service.ts`
6. `backend/src/domain/report/faculty-visit/faculty-visit.service.ts`
7. `frontend/src/features/faculty/dashboard/components/AssignedStudentsList.jsx`
8. `frontend/src/features/faculty/dashboard/components/StudentDetailsModal.jsx`

### 8.3 Documentation to Archive

| File | Action |
|------|--------|
| `IMPLEMENTATION_TRACKER.md` | Archive |
| `IMPLEMENTATION_PLAN_REPORT_VISIT_STANDARDIZATION.md` | Archive |
| `MONTHLY_REPORT_FACULTY_VISIT_CALCULATION_FINDINGS.md` | Archive |
| `FRONTEND_UPDATE_PLAN.md` | Archive |

---

## 9. Migration Plan

### Phase 1: Preparation (Day 1)
- [ ] Answer all clarification questions in Section 3
- [ ] Finalize business rules
- [ ] Create detailed test cases

### Phase 2: Backend Utility (Day 2)
- [ ] Create `monthly-cycle.util.ts`
- [ ] Write unit tests
- [ ] Export from utils index

### Phase 3: Backend Services (Day 3-4)
- [ ] Update state-dashboard.service.ts
- [ ] Update state-institution.service.ts
- [ ] Update principal.service.ts
- [ ] Update faculty.service.ts
- [ ] Update student.service.ts
- [ ] Update monthly-report.service.ts
- [ ] Update faculty-visit.service.ts

### Phase 4: Database Migration (Day 5)
- [ ] Add visitMonth/visitYear fields if needed
- [ ] Migrate existing data to monthly format
- [ ] Recalculate expected counts

### Phase 5: Frontend (Day 6-7)
- [ ] Create monthlyCycle.js utility
- [ ] Update State dashboard
- [ ] Update Principal dashboard
- [ ] Update Faculty dashboard
- [ ] Update Student dashboard

### Phase 6: Cleanup (Day 8)
- [ ] Remove legacy 4-week cycle code
- [ ] Archive old documentation
- [ ] Final testing

---

## 10. Testing Requirements

### 10.1 Unit Tests

- [ ] `calculateExpectedMonths` with various start/end dates
- [ ] `getReportDueDate` for all months
- [ ] `getVisitDueDate` for all months
- [ ] Last month exclusion rule (≤10 days)
- [ ] First month exclusion rule (≤10 days)
- [ ] Year boundary handling (Dec to Jan)

### 10.2 Integration Tests

- [ ] State dashboard shows correct monthly data
- [ ] Principal dashboard shows correct data
- [ ] Faculty dashboard shows assigned students correctly
- [ ] Student dashboard shows correct progress

### 10.3 Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Student starts Jan 31 (1 day) | January excluded (1 day ≤10) |
| Student ends May 8 (8 days) | May excluded (≤10 days) |
| Student Jan 1 - Jan 31 (1 month) | 1 Report + 1 Visit |
| Student starts Dec 15, ends Apr 30 | Dec, Jan, Feb, Mar, Apr included |
| Leap year February | Visit due Feb 29 |

### 10.4 UI Tests

- [ ] Monthly cards display correctly
- [ ] Status colors are correct (green, orange, red)
- [ ] Due dates shown correctly
- [ ] Overdue counts accurate
- [ ] Filters work properly

---

## Summary

This document provides a complete reference for implementing the Fixed Monthly Cycle system. Before starting implementation:

1. **Answer all questions in Section 3**
2. **Review and approve the technical specifications**
3. **Confirm the migration timeline**

---

*Document Version: 1.0*
*Created: December 27, 2025*
*Status: PENDING CLARIFICATIONS*

---

## 11. Additional Clarification Questions (Added by Developer)

### Critical Inconsistencies to Resolve

#### Q16: First Month Rule - Document Inconsistency
The document has conflicting information:
- **Section 2.1** says: "First month rule: Always include (even if few days) ✅ Confirmed"
- **Q2 inline answer** says: "skip january if less than 10 days"
- **Section 10.3 Edge Cases** says: "Student starts Jan 31 (1 day) → January included"

**Which is correct?** Should first month follow the same >10 days rule as last month?

**Answer:**
skip january if less than 10 days

---

#### Q17: Example Corrections Needed?
If the first month rule changes to >10 days, these examples in Section 4.4 would be wrong:
- Example 1: Jan 22 start (9 days) → Should January be **excluded**?
- Example 3: Jan 28 start (3 days) → Should January be **excluded**?

Should we update these examples after confirming Q16?

**Answer:** yes

---

#### Q18: Visit Due Date Edge Case
If a visit is due Jan 31 at 11:59:59 PM, and a student starts Jan 22 (9 days), should they really complete a faculty visit within ~9 days? Is this realistic for faculty to schedule and complete?

**Answer:**
No skip both monthly and faculty visit
---

### Technical Questions

#### Q19: Database Schema - Existing Fields
Do the `visitMonth` and `visitYear` fields already exist in `FacultyVisitLog` table? Or do we need to add them via a database migration?

**Answer:**
You need to verify
---

#### Q20: Expected Count Calculation Clarification
When you said "only 4 Reports/Visits" in Q6 - is this:
- A fixed number for all students?
- OR a calculated example (4 because first month gets skipped in that scenario)?

The total should vary based on each student's start/end dates, correct?

**Answer:** minimum number for all students if students training increased from 16 weeks then we can enhance, like students start at 15 january and ends at 15 may, he needs to submit 5 reports. if it goes to 10th june then also 5

---

#### Q21: Existing Data Migration
You mentioned "there will not be any" students from before January. Please confirm:
- This is a fresh start with no historical data to migrate?
- All current students started January 2025 or later?
- No need to handle legacy 4-week cycle data?
This is a fresh start with no historical data to migrate
**Answer:**

---

#### Q22: Leap Year Handling
For February 2028 (leap year), visit due date would be Feb 29. Should the utility automatically handle leap years using standard date libraries?
we dont need to go that far
**Answer:**

---

### Implementation Questions

#### Q23: Implementation Priority & Approach
Given the scope (7 backend services, 4 dashboard levels, utilities, tests), which approach should we take?

- **Option A**: Start with backend utilities → State dashboard (top-down)
- **Option B**: Start with Student dashboard → work up (bottom-up)
- **Option C**: All layers in parallel using multiple agents
- **Option D**: Other (specify)

**Answer:**- **Option C**: All layers in parallel using multiple agents

---

#### Q24: Testing Environment
- Should we write unit tests alongside implementation?
- Is there an existing test framework set up?
- Should integration tests be included in initial implementation or added later?

**Answer:** no

---

#### Q25: Deployment Strategy
- Will this be deployed all at once or in phases?
- Is there a staging environment for testing?
- Any rollback plan if issues are found?

**Answer:** no need

---

*Questions added: December 27, 2025*
*Status: AWAITING ANSWERS*
