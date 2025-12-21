import { useEffect, useCallback, useMemo } from 'react';
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

/**
 * Custom hook for Student Dashboard data management
 * Uses Redux for state management and caching
 */
export const useStudentDashboard = () => {
  const dispatch = useDispatch();

  // Selectors with safe defaults
  const dashboard = useSelector((state) => state.student?.dashboard || { loading: false, stats: null, error: null });
  const profile = useSelector((state) => state.student?.profile || { loading: false, data: null, error: null });
  const internships = useSelector((state) => state.student?.internships || { loading: false, list: [], error: null });
  const applications = useSelector((state) => state.student?.applications || { loading: false, list: [], error: null });
  const reports = useSelector((state) => state.student?.reports || { loading: false, list: [], error: null });
  const mentor = useSelector((state) => state.student?.mentor || { loading: false, data: null, error: null });
  const grievances = useSelector((state) => state.student?.grievances || { loading: false, list: [], error: null });

  // Detailed loading states
  const loadingStates = useMemo(() => ({
    dashboard: dashboard.loading,
    profile: profile.loading,
    internships: internships.loading,
    applications: applications.loading,
    reports: reports.loading,
    mentor: mentor.loading,
    grievances: grievances.loading,
  }), [
    dashboard.loading,
    profile.loading,
    internships.loading,
    applications.loading,
    reports.loading,
    mentor.loading,
    grievances.loading,
  ]);

  // Overall loading state
  const isLoading = useMemo(() => (
    dashboard.loading ||
    profile.loading ||
    internships.loading ||
    applications.loading ||
    reports.loading
  ), [
    dashboard.loading,
    profile.loading,
    internships.loading,
    applications.loading,
    reports.loading,
  ]);

  // Detailed error states
  const errors = useMemo(() => ({
    dashboard: dashboard.error,
    profile: profile.error,
    internships: internships.error,
    applications: applications.error,
    reports: reports.error,
    mentor: mentor.error,
    grievances: grievances.error,
  }), [
    dashboard.error,
    profile.error,
    internships.error,
    applications.error,
    reports.error,
    mentor.error,
    grievances.error,
  ]);

  // Check if any error exists
  const hasError = useMemo(() => (
    !!(dashboard.error || profile.error || applications.error || reports.error)
  ), [dashboard.error, profile.error, applications.error, reports.error]);

  // Fetch all dashboard data
  const fetchDashboardData = useCallback((forceRefresh = false) => {
    dispatch(fetchStudentDashboard({ forceRefresh }));
    dispatch(fetchStudentProfile({ forceRefresh }));
    dispatch(fetchMyInternships({ forceRefresh }));
    dispatch(fetchApplications({ forceRefresh }));
    dispatch(fetchMyReports({ forceRefresh }));
    dispatch(fetchMentor());
    dispatch(fetchGrievances());
  }, [dispatch]);

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Normalize applications list
  const normalizedApplications = useMemo(() => {
    if (Array.isArray(applications.list)) {
      return applications.list;
    }
    return applications.list?.applications || [];
  }, [applications.list]);

  // Normalize grievances list
  const normalizedGrievances = useMemo(() => {
    if (Array.isArray(grievances.list)) {
      return grievances.list;
    }
    return grievances.list?.grievances || [];
  }, [grievances.list]);

  // Calculate statistics from data
  const stats = useMemo(() => ({
    totalApplications: normalizedApplications.length,
    activeApplications: normalizedApplications.filter(app =>
      ['APPLIED', 'SHORTLISTED', 'UNDER_REVIEW'].includes(app.status)
    ).length,
    selectedApplications: normalizedApplications.filter(app => app.status === 'SELECTED').length,
    completedInternships: normalizedApplications.filter(app => app.status === 'COMPLETED').length,
    totalInternships: (internships.list || []).length,
    grievances: normalizedGrievances.length,
  }), [normalizedApplications, internships.list, normalizedGrievances]);

  // Get active internship(s)
  const activeInternships = useMemo(() => (
    normalizedApplications.filter(app =>
      app.status === 'SELECTED' || app.status === 'ACTIVE' || app.status === 'JOINED'
    )
  ), [normalizedApplications]);

  // Get recent applications
  const recentApplications = useMemo(() => (
    [...normalizedApplications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  ), [normalizedApplications]);

  // Get monthly reports with internship info
  const monthlyReports = useMemo(() => (
    normalizedApplications.flatMap(app =>
      (app.monthlyReports || []).map(report => ({
        ...report,
        applicationId: app.id,
        internshipTitle: app.internship?.title,
        companyName: app.internship?.industry?.companyName,
      }))
    )
  ), [normalizedApplications]);

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
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  return {
    // State
    isLoading,
    loadingStates,
    dashboard: dashboard.stats,
    profile: profile.data,
    mentor: mentor.data,
    grievances: normalizedGrievances,
    applications: normalizedApplications,
    internships: internships.list || [],
    reports: reports.list || [],

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

    // Errors
    errors,
    hasError,
    error: dashboard.error || profile.error || applications.error,
  };
};

export default useStudentDashboard;
