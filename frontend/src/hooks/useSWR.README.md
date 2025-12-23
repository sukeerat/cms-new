# useSWR Hook - Quick Reference

## Basic Usage

```javascript
import { useSWR } from './useSWR';

function MyComponent() {
  const { data, error, isLoading, isRevalidating } = useSWR(
    'unique-key',
    async () => {
      const response = await fetch('/api/data');
      return response.json();
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {isRevalidating && <span>Updating...</span>}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## Advanced Usage

### With Configuration Options

```javascript
const { data } = useSWR('my-key', fetcher, {
  revalidateOnFocus: true,       // Revalidate when window gains focus
  revalidateOnReconnect: true,   // Revalidate when network reconnects
  dedupingInterval: 2000,        // Dedupe requests within 2 seconds
  focusThrottleInterval: 5000,   // Throttle focus revalidation to 5 seconds
  shouldRetryOnError: true,      // Retry on error
  errorRetryCount: 3,            // Max 3 retry attempts
  errorRetryInterval: 5000,      // Wait 5 seconds between retries
});
```

### Optimistic Updates

```javascript
const { data, mutate } = useSWR('todo-list', fetchTodos);

const addTodo = async (newTodo) => {
  // Optimistically add to UI
  mutate([...data, newTodo], false);

  try {
    await api.addTodo(newTodo);
    // Revalidate to get fresh data from server
    mutate();
  } catch (error) {
    // Revert on error
    mutate(data);
  }
};
```

### Manual Revalidation

```javascript
const { data, revalidate } = useSWR('user-profile', fetchProfile);

const handleRefresh = () => {
  revalidate(); // Manually trigger data refresh
};

return (
  <div>
    <button onClick={handleRefresh}>Refresh</button>
    <UserProfile data={data} />
  </div>
);
```

### Conditional Fetching

```javascript
import { useSWRConditional } from './useSWR';

const { data } = useSWRConditional(
  'user-details',
  () => fetchUserDetails(userId),
  !!userId // Only fetch when userId exists
);
```

## Cache Management

```javascript
import {
  getCachedData,
  setCachedData,
  clearCachedData,
  clearAllCache
} from './useSWR';

// Get cached data
const cached = getCachedData('my-key');

// Set cached data manually
setCachedData('my-key', { foo: 'bar' });

// Clear specific cache
clearCachedData('my-key');

// Clear all cache (e.g., on logout)
clearAllCache();
```

## Common Patterns

### Dashboard with Auto-Refresh

```javascript
function Dashboard() {
  const { data, isLoading, isRevalidating } = useSWR(
    'dashboard-data',
    fetchDashboardData,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return (
    <div>
      {isRevalidating && (
        <div className="bg-blue-100 p-2">
          <SyncOutlined spin /> Updating...
        </div>
      )}
      <Spin spinning={isLoading}>
        <DashboardContent data={data} />
      </Spin>
    </div>
  );
}
```

### List with Mutations

```javascript
function TodoList() {
  const { data, mutate, revalidate } = useSWR('todos', fetchTodos);

  const toggleTodo = async (id) => {
    // Optimistic update
    const updated = data.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
    mutate(updated, false);

    // Sync with server
    try {
      await api.toggleTodo(id);
      revalidate(); // Get fresh data
    } catch (error) {
      mutate(data); // Revert on error
      toast.error('Failed to update');
    }
  };

  return (
    <ul>
      {data?.map(todo => (
        <li key={todo.id} onClick={() => toggleTodo(todo.id)}>
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
```

### Dependent Queries

```javascript
function UserPosts({ userId }) {
  // First fetch user
  const { data: user } = useSWR(
    userId ? `user-${userId}` : null,
    () => fetchUser(userId)
  );

  // Then fetch posts (depends on user)
  const { data: posts } = useSWR(
    user ? `posts-${user.id}` : null,
    () => fetchPosts(user.id)
  );

  if (!user) return <div>Loading user...</div>;
  if (!posts) return <div>Loading posts...</div>;

  return <PostList posts={posts} />;
}
```

## Return Values

| Property | Type | Description |
|----------|------|-------------|
| `data` | any | The cached or fresh data |
| `error` | Error \| null | Error if fetch failed |
| `isLoading` | boolean | True only on initial load with no cache |
| `isRevalidating` | boolean | True when fetching with cached data available |
| `mutate` | function | Update cache optimistically |
| `revalidate` | function | Manually trigger revalidation |

## Best Practices

1. **Use descriptive cache keys**: `'student-dashboard-data'` instead of `'data'`
2. **Handle loading states properly**: Use `isLoading` for initial load, `isRevalidating` for background updates
3. **Implement error boundaries**: Always handle `error` state
4. **Leverage optimistic updates**: For better UX on mutations
5. **Clear cache on logout**: Prevent stale user data
6. **Use conditional fetching**: Avoid unnecessary requests
7. **Configure revalidation wisely**: Balance freshness vs. request frequency

## TypeScript Support

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const { data, error } = useSWR<User, Error>(
  'user-profile',
  async () => {
    const response = await fetch('/api/user');
    return response.json() as User;
  }
);

// data is typed as User | undefined
// error is typed as Error | null
```

## Debugging

Enable console logging to debug cache behavior:

```javascript
// In useSWR.js, uncomment debug logs:
console.log('[SWR] Cache hit:', key);
console.log('[SWR] Fetching:', key);
console.log('[SWR] Revalidating:', key);
```

## Performance Tips

1. **Increase deduping interval** for stable data: `dedupingInterval: 5000`
2. **Disable focus revalidation** for static data: `revalidateOnFocus: false`
3. **Use cache aggressively** for immutable data
4. **Implement pagination** for large datasets
5. **Consider virtualization** for long lists

## Migration Checklist

- [ ] Replace `useState` + `useEffect` with `useSWR`
- [ ] Update loading states to use `isLoading` and `isRevalidating`
- [ ] Add revalidation indicators to UI
- [ ] Implement cache clearing on logout
- [ ] Test focus revalidation behavior
- [ ] Configure retry behavior for error handling
- [ ] Add optimistic updates for mutations

## Questions?

See `frontend/SWR_IMPLEMENTATION.md` for full documentation.
