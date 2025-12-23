# Stale-While-Revalidate (SWR) Implementation

## Overview

This document describes the implementation of the Stale-While-Revalidate (SWR) pattern in the CMS application. The SWR pattern significantly improves perceived performance by showing cached data immediately while fetching fresh data in the background.

## What is SWR?

Stale-While-Revalidate is a cache invalidation strategy that:
1. Returns cached (stale) data immediately if available
2. Fetches fresh data in the background (revalidation)
3. Updates the UI when fresh data arrives
4. Shows a subtle loading indicator during revalidation (not a full loading spinner)

### Benefits

- **Instant Loading**: Users see content immediately on subsequent visits
- **Always Fresh**: Data is automatically revalidated in the background
- **Better UX**: No loading spinners on cached data - just a subtle indicator
- **Automatic Revalidation**: Refetches on window focus and network reconnect
- **Request Deduplication**: Prevents multiple identical requests

## Architecture

### Core Components

#### 1. `useSWR` Hook (`frontend/src/hooks/useSWR.js`)

The main hook that implements the SWR pattern.

**Features:**
- In-memory caching with timestamps
- Request deduplication
- Automatic revalidation on focus/reconnect
- Error retry mechanism
- Optimistic updates via `mutate`

**Usage:**
```javascript
import { useSWR } from '../../../hooks/useSWR';

const { data, error, isLoading, isRevalidating, mutate, revalidate } = useSWR(
  'unique-cache-key',
  fetcherFunction,
  {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    focusThrottleInterval: 5000,
  }
);
```

**Return Values:**
- `data`: The cached or fresh data
- `error`: Any error that occurred
- `isLoading`: True only on initial load with no cache
- `isRevalidating`: True when fetching fresh data with cache available
- `mutate(data, shouldRevalidate)`: Function to update cache optimistically
- `revalidate()`: Function to manually trigger revalidation

**Configuration Options:**
- `dedupingInterval`: Time window (ms) to deduplicate requests (default: 2000)
- `revalidateOnFocus`: Revalidate when window regains focus (default: true)
- `revalidateOnReconnect`: Revalidate when network reconnects (default: true)
- `shouldRetryOnError`: Retry on error (default: true)
- `errorRetryCount`: Max retry attempts (default: 3)
- `errorRetryInterval`: Time between retries (ms) (default: 5000)
- `focusThrottleInterval`: Throttle focus revalidation (ms) (default: 5000)

#### 2. Cache Utility Functions

```javascript
import { getCachedData, setCachedData, clearCachedData, clearAllCache } from '../../../hooks/useSWR';

// Get cached data
const cachedData = getCachedData('cache-key');

// Set cached data
setCachedData('cache-key', data);

// Clear specific cache
clearCachedData('cache-key');

// Clear all cache
clearAllCache();
```

### Enhanced Hooks

#### 1. `useStudentDashboard` (`frontend/src/features/student/hooks/useStudentDashboard.js`)

**Enhanced with SWR:**
```javascript
const { isLoading, isRevalidating, revalidate, ...rest } = useStudentDashboard();
```

**New Properties:**
- `isRevalidating`: Shows when fetching fresh data in background
- `revalidate()`: Manually trigger data refresh

**Cache Key:** `'student-dashboard-data'`

#### 2. `useFacultyDashboard` (`frontend/src/features/faculty/hooks/useFacultyDashboard.js`)

**Enhanced with SWR:**
```javascript
const { isLoading, isRevalidating, revalidate, ...rest } = useFacultyDashboard();
```

**Cache Key:** `'faculty-dashboard-data'`

#### 3. `useApplications` (`frontend/src/features/student/applications/hooks/useApplications.js`)

**Enhanced with SWR:**
```javascript
const { loading, isRevalidating, revalidate, ...rest } = useApplications();
```

**Cache Key:** `'student-applications'`

### UI Components

#### Revalidation Indicator

Both `StudentDashboard` and `FacultyDashboard` now show a subtle top banner during background revalidation:

```jsx
{isRevalidating && !isLoading && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-center gap-2 text-blue-700 text-sm">
    <SyncOutlined spin />
    <span>Updating dashboard data...</span>
  </div>
)}
```

**Features:**
- Only shows during background revalidation (not initial load)
- Non-intrusive fixed top banner
- Animated slide-down entrance
- Spinning sync icon for visual feedback

## User Experience Flow

### First Visit (No Cache)
1. User navigates to dashboard
2. `isLoading = true` → Full loading spinner shows
3. Data fetches from API
4. Data displays and gets cached
5. `isLoading = false` → Loading spinner hides

### Subsequent Visits (With Cache)
1. User navigates to dashboard
2. Cached data displays **immediately** (no loading spinner)
3. `isRevalidating = true` → Subtle top banner shows
4. Fresh data fetches in background
5. Data updates seamlessly
6. `isRevalidating = false` → Banner hides

### Auto-Revalidation Triggers
- **Window Focus**: When user returns to the tab (throttled to 5s)
- **Network Reconnect**: When internet connection is restored
- **Manual Refresh**: When user clicks refresh button

## Implementation Best Practices

### 1. Cache Keys
Use descriptive, unique cache keys:
```javascript
// Good
useSWR('student-dashboard-data', fetchData);
useSWR('faculty-applications-pending', fetchPending);

// Bad
useSWR('data', fetchData);
useSWR('1', fetchData);
```

### 2. Error Handling
The SWR hook includes automatic retry logic:
```javascript
const { data, error } = useSWR(key, fetcher, {
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
});

if (error) {
  // Handle error state
}
```

### 3. Optimistic Updates
Use `mutate` for immediate UI updates before API response:
```javascript
const { data, mutate } = useSWR(key, fetcher);

const handleUpdate = async (newValue) => {
  // Optimistically update UI
  mutate({ ...data, value: newValue }, false);

  // Send request
  try {
    await api.update(newValue);
    // Revalidate to get fresh data
    mutate();
  } catch (error) {
    // Revert on error
    mutate(data);
  }
};
```

### 4. Conditional Fetching
Use `useSWRConditional` for conditional data fetching:
```javascript
import { useSWRConditional } from '../../../hooks/useSWR';

const { data } = useSWRConditional(
  'user-details',
  fetchUserDetails,
  !!userId // Only fetch when userId exists
);
```

### 5. Manual Revalidation
Trigger revalidation after mutations:
```javascript
const { revalidate } = useStudentDashboard();

const handleSubmit = async (data) => {
  await api.submit(data);
  // Refresh dashboard data
  revalidate();
};
```

## Performance Considerations

### Request Deduplication
Multiple components requesting the same data within `dedupingInterval` (2s) will share the same request:
```javascript
// Component A
useSWR('student-data', fetchStudent); // Makes API request

// Component B (mounted within 2s)
useSWR('student-data', fetchStudent); // Uses same in-flight request
```

### Focus Throttling
Window focus revalidation is throttled to prevent excessive requests:
```javascript
// User switches tabs multiple times within 5 seconds
// Only 1 revalidation request is made
focusThrottleInterval: 5000
```

### Cache Invalidation
Cache persists in memory during the session. To clear:
```javascript
import { clearCachedData, clearAllCache } from '../../../hooks/useSWR';

// Clear specific cache on logout
clearCachedData('student-dashboard-data');

// Or clear all cache
clearAllCache();
```

## Migration Guide

### Before (Traditional Approach)
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  fetchData()
    .then(setData)
    .finally(() => setLoading(false));
}, []);

// User sees loading spinner every time
```

### After (SWR Approach)
```javascript
const { data, isLoading, isRevalidating } = useSWR(
  'cache-key',
  fetchData
);

// First visit: loading spinner
// Subsequent visits: cached data instantly + subtle revalidation indicator
```

## Testing

### Testing SWR Hooks
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useSWR } from './useSWR';

test('returns cached data immediately', async () => {
  const fetcher = jest.fn(() => Promise.resolve('data'));

  const { result, rerender } = renderHook(() =>
    useSWR('test-key', fetcher)
  );

  await waitFor(() => expect(result.current.data).toBe('data'));

  // Remount - should use cache
  rerender();
  expect(result.current.isLoading).toBe(false);
});
```

## Troubleshooting

### Issue: Data not updating
**Solution:** Check if `revalidateOnFocus` is disabled or if the cache key is correct.

### Issue: Too many requests
**Solution:** Increase `dedupingInterval` or `focusThrottleInterval`.

### Issue: Stale data persisting
**Solution:** Call `revalidate()` manually or clear cache with `clearCachedData()`.

### Issue: Loading spinner still showing on cached data
**Solution:** Check if you're using `isLoading` instead of `isRevalidating` for the revalidation indicator.

## Future Enhancements

- [ ] Persistent cache (localStorage/IndexedDB)
- [ ] Cache expiration policies
- [ ] Automatic garbage collection for old cache entries
- [ ] Offline support with service workers
- [ ] Cache invalidation based on mutations
- [ ] Integration with React Query for advanced features

## Related Files

- `frontend/src/hooks/useSWR.js` - Core SWR implementation
- `frontend/src/features/student/hooks/useStudentDashboard.js` - Student dashboard with SWR
- `frontend/src/features/faculty/hooks/useFacultyDashboard.js` - Faculty dashboard with SWR
- `frontend/src/features/student/applications/hooks/useApplications.js` - Applications with SWR
- `frontend/src/features/student/dashboard/StudentDashboard.jsx` - UI component with revalidation indicator
- `frontend/src/features/faculty/dashboard/FacultyDashboard.jsx` - UI component with revalidation indicator
- `frontend/src/index.css` - Animation styles for revalidation indicator

## References

- [HTTP RFC 5861 - Stale-While-Revalidate](https://tools.ietf.org/html/rfc5861)
- [SWR Library by Vercel](https://swr.vercel.app/)
- [React Query](https://tanstack.com/query/latest)
