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
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    // Fetch dashboard and profile in parallel
    dispatch(fetchStudentDashboard({ forceRefresh }));
    await dispatch(fetchStudentProfile({ forceRefresh }));

    // After profile is loaded, fetch mentor (uses cached profile data)
    dispatch(fetchMentor());

    // Fetch remaining data in parallel
    // Note: /student/applications returns ALL applications including self-identified
    dispatch(fetchApplications({ forceRefresh }));
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
  const normalizedApplications = useSelector(selectNormalizedApplicationsList);
  const normalizedGrievances = useSelector(selectNormalizedGrievancesList);
  const selfIdentifiedApplications = useSelector(selectSelfIdentifiedApplications);
  const platformApplications = useSelector(selectPlatformApplications);
  const stats = useSelector(selectCalculatedStats);
  const activeInternships = useSelector(selectActiveInternships);
  const recentApplications = useSelector(selectRecentApplications);
  const monthlyReports = useSelector(selectMonthlyReportsWithInfo);

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

  return {
    // State
    isLoading,
    isRevalidating, // NEW: Shows subtle indicator during background refresh
    loadingStates,
    dashboard: dashboard.stats,
    profile: profileData,
    mentor: mentorData,
    grievances: normalizedGrievances,
    applications: normalizedApplications, // All applications (platform + self-identified)
    selfIdentified: selfIdentifiedApplications, // Filtered self-identified only
    platformApplications, // Filtered platform only
    internships: internshipsList,
    reports: reportsList,

    // Computed
    stats,
    activeInternships,
    recentApplications,
    monthlyReports,

    // Actions
    refresh,
    fetchDashboardData,
    handleWithdrawApplication,
    handleUpdateApplication,
    handleSubmitReport,
    revalidate, // NEW: Manual revalidation trigger

    // Errors
    errors,
    hasError,
    error: dashboard.error || profile.error || applications.error,
  };
};

export default useStudentDashboard;
