import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStudentDashboard,
  fetchStudentProfile,
  fetchMyInternships,
  fetchApplications,
  fetchMyReports,
  fetchMentor,
  fetchGrievances,
  withdrawApplication,
  updateApplication,
  submitMonthlyReport,
} from '../store/studentSlice';
import {
  selectDashboard,
  selectProfile,
  selectInternships,
  selectApplications,
  selectReports,
  selectMentor,
  selectGrievances,
  selectNormalizedApplicationsList,
  selectNormalizedGrievancesList,
  selectSelfIdentifiedApplications,
  selectPlatformApplications,
  selectActiveInternships,
  selectRecentApplications,
  selectMonthlyReportsWithInfo,
  selectCalculatedStats,
  selectCombinedLoadingStates,
  selectDashboardIsLoading,
  selectCombinedErrors,
  selectHasDashboardError,
  selectMentorWithFallback,
  selectProfileData,
  selectInternshipsList,
  selectReportsList,
  // New profile-based selectors for optimization
  selectApplicationsFromProfile,
  selectActiveInternshipsFromProfile,
  selectSelfIdentifiedFromProfile,
  selectPlatformFromProfile,
  selectStatsFromProfile,
  selectCountsFromProfile,
} from '../store/studentSelectors';
import { useSWR, getCachedData, setCachedData } from '../../../hooks/useSWR';

/**
 * Custom hook for Student Dashboard data management
 * Uses Redux for state management and SWR pattern for optimal caching
 *
 * SWR Pattern Benefits:
 * - Shows cached data immediately (no loading spinner on subsequent visits)
 * - Fetches fresh data in background
 * - Shows subtle revalidation indicator while fetching
 * - Auto-revalidates on window focus and network reconnect
 */
export const useStudentDashboard = () => {
  const dispatch = useDispatch();

  // Redux state - using memoized selectors
  const dashboard = useSelector(selectDashboard);
  const profile = useSelector(selectProfile);
  const internships = useSelector(selectInternships);
  const applications = useSelector(selectApplications);
  const reports = useSelector(selectReports);
  const mentor = useSelector(selectMentor);
  const grievances = useSelector(selectGrievances);

  // Derived selectors
  const loadingStates = useSelector(selectCombinedLoadingStates);
  const reduxIsLoading = useSelector(selectDashboardIsLoading);
  const errors = useSelector(selectCombinedErrors);
  const hasError = useSelector(selectHasDashboardError);

  // SWR state for tracking background revalidation
  const [isRevalidating, setIsRevalidating] = useState(false);

  // Fetch all dashboard data - optimized to reduce redundant calls
  // Profile API now returns internshipApplications, mentorAssignments, and _count
  // so we can skip separate fetches for applications and mentor
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Fetch dashboard and profile in parallel
    // Profile includes: internshipApplications, mentorAssignments, _count
    dispatch(fetchStudentDashboard({ forceRefresh }));
    await dispatch(fetchStudentProfile({ forceRefresh }));

    // Mentor is extracted from profile.mentorAssignments - no separate call needed
    // Applications are in profile.internshipApplications - no separate call needed

    // Only fetch grievances and reports separately (they're not in profile)
    dispatch(fetchMyReports({ forceRefresh }));
    dispatch(fetchGrievances());
  }, [dispatch]);

  // SWR implementation - fetches with stale-while-revalidate pattern
  const { isLoading: swrIsLoading, isRevalidating: swrIsRevalidating, revalidate } = useSWR(
    'student-dashboard-data',
    async () => {
      await fetchDashboardData(false);
      return true; // Return success indicator
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      focusThrottleInterval: 5000,
    }
  );

  // Update local revalidation state
  useEffect(() => {
    setIsRevalidating(swrIsRevalidating);
  }, [swrIsRevalidating]);

  // Combined loading state: only show full loading on initial load with no cache
  const isLoading = swrIsLoading || reduxIsLoading;

  // Use memoized selectors for derived data
  // Prefer profile-based selectors to avoid redundant API calls
  const normalizedApplications = useSelector(selectNormalizedApplicationsList);
  const normalizedGrievances = useSelector(selectNormalizedGrievancesList);

  // Use profile-based selectors (preferred - single API call)
  const applicationsFromProfile = useSelector(selectApplicationsFromProfile);
  const selfIdentifiedFromProfile = useSelector(selectSelfIdentifiedFromProfile);
  const platformFromProfile = useSelector(selectPlatformFromProfile);
  const activeInternshipsFromProfile = useSelector(selectActiveInternshipsFromProfile);
  const statsFromProfile = useSelector(selectStatsFromProfile);
  const countsFromProfile = useSelector(selectCountsFromProfile);

  // Fallback selectors (from separate API calls)
  const selfIdentifiedApplications = useSelector(selectSelfIdentifiedApplications);
  const platformApplications = useSelector(selectPlatformApplications);
  const stats = useSelector(selectCalculatedStats);
  const activeInternships = useSelector(selectActiveInternships);
  const recentApplications = useSelector(selectRecentApplications);
  const monthlyReports = useSelector(selectMonthlyReportsWithInfo);

  // Merge stats from profile with calculated stats
  const mergedStats = {
    ...stats,
    ...statsFromProfile,
    // Prefer _count values from profile for accurate server-side counts
    totalApplications: countsFromProfile?.internshipApplications || stats?.totalApplications || 0,
    totalMonthlyReports: countsFromProfile?.monthlyReports || 0,
    totalGrievances: countsFromProfile?.grievances || stats?.grievances || 0,
  };

  // Action handlers with error handling
  const handleWithdrawApplication = useCallback(async (applicationId) => {
    try {
      const result = await dispatch(withdrawApplication(applicationId)).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const handleUpdateApplication = useCallback(async (id, data) => {
    try {
      const result = await dispatch(updateApplication({ id, data })).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const handleSubmitReport = useCallback(async (reportId, data) => {
    try {
      const result = await dispatch(submitMonthlyReport({ reportId, data })).unwrap();
      return result;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const refresh = useCallback(() => {
    setIsRevalidating(true);
    fetchDashboardData(true).finally(() => {
      setIsRevalidating(false);
      revalidate();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revalidate]);

  // Extract mentor from profile or fallback to mentor state
  const mentorData = useSelector(selectMentorWithFallback);

  // Direct data access
  const profileData = useSelector(selectProfileData);
  const internshipsList = useSelector(selectInternshipsList);
  const reportsList = useSelector(selectReportsList);

  // Prefer profile data over separate API call data
  const effectiveApplications = applicationsFromProfile.length > 0
    ? applicationsFromProfile
    : normalizedApplications;
  const effectiveSelfIdentified = selfIdentifiedFromProfile.length > 0
    ? selfIdentifiedFromProfile
    : selfIdentifiedApplications;
  const effectivePlatformApplications = platformFromProfile.length > 0
    ? platformFromProfile
    : platformApplications;
  const effectiveActiveInternships = activeInternshipsFromProfile.length > 0
    ? activeInternshipsFromProfile
    : activeInternships;

  return {
    // State
    isLoading,
    isRevalidating, // Shows subtle indicator during background refresh
    loadingStates,
    dashboard: dashboard.stats,
    profile: profileData,
    mentor: mentorData,
    grievances: normalizedGrievances,
    applications: effectiveApplications, // All applications (from profile or API)
    selfIdentified: effectiveSelfIdentified, // Filtered self-identified only
    platformApplications: effectivePlatformApplications, // Filtered platform only
    internships: internshipsList,
    reports: reportsList,

    // Computed - using merged stats with _count data
    stats: mergedStats,
    activeInternships: effectiveActiveInternships,
    recentApplications,
    monthlyReports,

    // Server-side counts from profile._count
    counts: countsFromProfile,

    // Actions
    refresh,
    fetchDashboardData,
    handleWithdrawApplication,
    handleUpdateApplication,
    handleSubmitReport,
    revalidate, // Manual revalidation trigger

    // Errors
    errors,
    hasError,
    error: dashboard.error || profile.error || applications.error,
  };
};

export default useStudentDashboard;
