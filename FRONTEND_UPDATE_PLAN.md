# Frontend Update Plan: Report & Visit Standardization

## Overview

This plan documents all frontend changes needed to align with the backend changes for:
1. **Report Auto-Approval** - Reports auto-approve on submission (only DRAFT and APPROVED states)
2. **Visit Grace Period** - Already implemented in applicationUtils.js
3. **Rounding Standardization** - Use Math.round() for percentages

---

## Important Distinctions

### Statuses to KEEP (NOT Monthly Reports)
These are different systems and should NOT be changed:

| System | Statuses | Reason |
|--------|----------|--------|
| Internship Applications | UNDER_REVIEW, REJECTED, etc. | Job application workflow |
| Grievances | SUBMITTED, UNDER_REVIEW, REJECTED | Grievance workflow |
| Joining Letters | REJECTED | Verification workflow |
| Self-Identified Internships | REJECTED | Approval workflow |

### Statuses to UPDATE (Monthly Reports Only)
| Old Status | New Behavior |
|------------|--------------|
| SUBMITTED | Remove - reports go directly to APPROVED |
| UNDER_REVIEW | Remove - no review process |
| REJECTED | Remove - no rejection |
| REVISION_REQUIRED | Remove - no revision requests |

---

## Phase 1: State Level Components

### Files to Update:

#### 1.1 `frontend/src/features/state/dashboard/components/InstituteDetailView.jsx`
**Changes:**
- Line 81: Remove SUBMITTED from status colors (keep only DRAFT, APPROVED)
- Line 84: Remove REJECTED from status colors
- Lines 741-742: Remove approve/reject report actions (reports auto-approve)
- Update status filter dropdown to only show DRAFT, APPROVED, Not Submitted

**Current:**
```javascript
SUBMITTED: 'blue',
APPROVED: 'green',
REJECTED: 'red',
```

**After:**
```javascript
DRAFT: 'default',
APPROVED: 'green',
```

---

## Phase 2: Principal Level Components

### Files to Update:

#### 2.1 `frontend/src/features/principal/students/StudentProgress.jsx`
**Changes:**
- Lines 589-594: Update getReportMonthlyStatusTag to remove SUBMITTED, REJECTED

**Current:**
```javascript
SUBMITTED: { color: 'processing', icon: <SyncOutlined />, text: 'Submitted' },
APPROVED: { color: 'success', icon: <CheckCircleOutlined />, text: 'Approved' },
REJECTED: { color: 'error', icon: <ExclamationCircleOutlined />, text: 'Rejected' },
```

**After:**
```javascript
DRAFT: { color: 'default', icon: <FileTextOutlined />, text: 'Draft' },
APPROVED: { color: 'success', icon: <CheckCircleOutlined />, text: 'Approved' },
```

#### 2.2 `frontend/src/features/principal/store/principalSelectors.js`
**Changes:**
- Line 784: Change `.toFixed(2)` to `Math.round()`

**Current:**
```javascript
? ((studentsWithMentor.length / totalStudents) * 100).toFixed(2)
```

**After:**
```javascript
? Math.round((studentsWithMentor.length / totalStudents) * 100)
```

#### 2.3 `frontend/src/features/principal/analytics/Analytics.jsx`
**Changes:**
- Line 209: Change `.toFixed(1)` to `Math.round()` for trend value

---

## Phase 3: Faculty Level Components

### Files to Update:

#### 3.1 `frontend/src/features/faculty/reports/MonthlyReportsPage.jsx`
**Changes:**
- Lines 50-54: Update STATUS_CONFIG to only have DRAFT and APPROVED
- Lines 111, 115: Update filter logic (remove pending/rejected tabs)
- Lines 128-130: Update count calculations
- Lines 206-208: Update table filter options

**Current:**
```javascript
const STATUS_CONFIG = {
  DRAFT: { color: 'default', label: 'Draft', icon: <FileTextOutlined /> },
  SUBMITTED: { color: 'blue', label: 'Submitted', icon: <FileTextOutlined /> },
  UNDER_REVIEW: { color: 'processing', label: 'Under Review', icon: <ClockCircleOutlined /> },
  APPROVED: { color: 'green', label: 'Approved', icon: <CheckCircleOutlined /> },
  REJECTED: { color: 'red', label: 'Rejected', icon: <CloseCircleOutlined /> },
  REVISION_REQUIRED: { color: 'warning', label: 'Revision Required', icon: <ClockCircleOutlined /> },
};
```

**After:**
```javascript
const STATUS_CONFIG = {
  DRAFT: { color: 'default', label: 'Draft', icon: <FileTextOutlined /> },
  APPROVED: { color: 'green', label: 'Approved', icon: <CheckCircleOutlined /> },
};
```

#### 3.2 `frontend/src/features/faculty/store/facultySelectors.js`
**Changes:**
- Lines 178-184: Update pendingReportsSelector to filter for DRAFT only (not SUBMITTED)

**Current:**
```javascript
report.status === 'PENDING' || report.status === 'SUBMITTED'
```

**After:**
```javascript
report.status === 'DRAFT'
```

#### 3.3 `frontend/src/features/faculty/hooks/useFacultyDashboard.js`
**Changes:**
- Line 201: Update to filter DRAFT instead of PENDING/SUBMITTED

#### 3.4 `frontend/src/features/faculty/dashboard/components/MonthlyReportsCard.jsx`
**Changes:**
- Lines 22-24: Update STATUS_CONFIG (remove SUBMITTED, REJECTED)
- Line 89: Update isPending check
- Line 183: Update pending condition

#### 3.5 `frontend/src/features/faculty/dashboard/components/StudentDetailsModal.jsx`
**Changes:**
- Lines 117-118: Remove SUBMITTED, REJECTED from status colors
- Line 502: Update pending filter

#### 3.6 `frontend/src/features/faculty/dashboard/components/AssignedStudentsList.jsx`
**Changes:**
- Line 205: Update SUBMITTED check to DRAFT
- Line 280: Update pending check

---

## Phase 4: Student Level Components

### Files to Update:

#### 4.1 `frontend/src/features/student/dashboard/components/MonthlyReportsCard.jsx`
**Changes:**
- Lines 17-21: Update STATUS_CONFIG (remove SUBMITTED, UNDER_REVIEW, REJECTED, REVISION_REQUIRED)

**Current:**
```javascript
const getStatusConfig = (status) => ({
  DRAFT: { color: 'default', icon: <FileTextOutlined />, label: 'Draft' },
  SUBMITTED: { color: 'blue', icon: <ClockCircleOutlined />, label: 'Submitted' },
  UNDER_REVIEW: { color: 'gold', icon: <ClockCircleOutlined />, label: 'Under Review' },
  APPROVED: { color: 'green', icon: <CheckCircleOutlined />, label: 'Approved' },
  REJECTED: { color: 'red', icon: <ExclamationCircleOutlined />, label: 'Rejected' },
  REVISION_REQUIRED: { color: 'orange', icon: <ExclamationCircleOutlined />, label: 'Revision Required' },
}[status] || { color: 'default', icon: <FileTextOutlined />, label: status });
```

**After:**
```javascript
const getStatusConfig = (status) => ({
  DRAFT: { color: 'default', icon: <FileTextOutlined />, label: 'Draft' },
  APPROVED: { color: 'green', icon: <CheckCircleOutlined />, label: 'Approved' },
}[status] || { color: 'default', icon: <FileTextOutlined />, label: status });
```

#### 4.2 `frontend/src/features/student/applications/utils/applicationUtils.js`
**Changes:**
- Lines 170-174: Update getReportSubmissionStatus to remove SUBMITTED check

**Current:**
```javascript
if (report.status === 'SUBMITTED') {
  return {
    status: 'SUBMITTED',
    label: 'Awaiting Review',
    ...
  };
}
```

**After:**
Remove this block entirely - reports go directly to APPROVED.

#### 4.3 `frontend/src/features/student/applications/components/MonthlyReportsSection.jsx`
**Changes:**
- Line 60: Remove SUBMITTED count (or change to APPROVED)
- Update any SUBMITTED references

#### 4.4 `frontend/src/features/student/store/studentSelectors.js`
**Changes:**
- Line 682: Update filter from 'pending' | 'draft' to just 'draft'

---

## Summary of Changes by File

| File | Changes |
|------|---------|
| **State Level** |
| InstituteDetailView.jsx | Remove SUBMITTED/REJECTED colors, remove approve/reject actions |
| **Principal Level** |
| StudentProgress.jsx | Update status tag config |
| principalSelectors.js | Change toFixed to Math.round |
| Analytics.jsx | Change toFixed to Math.round |
| **Faculty Level** |
| MonthlyReportsPage.jsx | Update STATUS_CONFIG, filters, counts |
| facultySelectors.js | Update pending filter |
| useFacultyDashboard.js | Update pending filter |
| MonthlyReportsCard.jsx | Update STATUS_CONFIG, isPending check |
| StudentDetailsModal.jsx | Update status colors, pending filter |
| AssignedStudentsList.jsx | Update SUBMITTED checks |
| **Student Level** |
| MonthlyReportsCard.jsx | Update STATUS_CONFIG |
| applicationUtils.js | Remove SUBMITTED status check |
| MonthlyReportsSection.jsx | Update status counts |
| studentSelectors.js | Update pending filter |

---

## Implementation Order

1. **State Level** - Update InstituteDetailView.jsx
2. **Principal Level** - Update StudentProgress.jsx, selectors, analytics
3. **Faculty Level** - Update all 6 files
4. **Student Level** - Update all 4 files

---

*Plan created: December 26, 2025*
