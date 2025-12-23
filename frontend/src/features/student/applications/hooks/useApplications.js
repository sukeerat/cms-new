import { useState, useEffect, useCallback } from 'react';
import API from '../../../../services/api';
import { toast } from 'react-hot-toast';

// Utility function to get student ID from localStorage
const getStudentId = () => {
  try {
    const loginData = localStorage.getItem('loginResponse');
    if (loginData) {
      const parsed = JSON.parse(loginData);
      return parsed.userId || parsed.user?.id || parsed.studentId || null;
    }
  } catch (error) {
    console.error('Failed to parse login response:', error);
  }
  return null;
};

export const useApplications = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selfIdentifiedApplications, setSelfIdentifiedApplications] = useState([]);
  const [error, setError] = useState(null);

  const fetchAllApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.get('/student/applications');

      // Handle different response structures:
      // - { applications: [...], total, page, ... } (paginated)
      // - { data: [...] } (wrapped)
      // - [...] (direct array)
      let allApps = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          allApps = response.data;
        } else if (response.data.applications) {
          allApps = response.data.applications;
        } else if (response.data.data) {
          allApps = response.data.data;
        }
      }

      // Separate platform and self-identified applications
      const platformApps = allApps.filter(app => !app.isSelfIdentified);
      const selfIdentifiedApps = allApps.filter(app => app.isSelfIdentified);

      setApplications(platformApps);
      setSelfIdentifiedApplications(selfIdentifiedApps);

      return true;
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to fetch applications');
      toast.error('Failed to fetch applications');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllApplications();
  }, [fetchAllApplications]);

  return {
    loading,
    error,
    applications,
    selfIdentifiedApplications,
    refetch: fetchAllApplications,
  };
};

export const useCompletionFeedback = () => {
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeedback = useCallback(async (applicationId) => {
    if (!applicationId) return null;
    setLoading(true);
    setError(null);
    try {
      const response = await API.get(`/completion-feedback/application/${applicationId}`);
      const feedbackData = response.data?.data || null;
      setFeedback(feedbackData);
      return feedbackData;
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching feedback:', err);
        setError(err.message || 'Failed to fetch feedback');
      }
      setFeedback(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitFeedback = useCallback(async (applicationId, values) => {
    const payload = {
      applicationId,
      studentRating: values.studentRating,
      studentFeedback: values.studentFeedback,
      skillsLearned: values.skillsLearned,
      careerImpact: values.careerImpact,
      wouldRecommend: values.wouldRecommend || false,
    };

    try {
      const response = await API.post('/completion-feedback/student', payload);
      toast.success('Feedback submitted successfully!');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit feedback';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    feedback,
    loading,
    error,
    fetchFeedback,
    submitFeedback,
    setFeedback,
  };
};

export const useMonthlyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [missingReports, setMissingReports] = useState([]);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async (applicationId) => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await API.get(`/student/monthly-reports`, {
        params: { applicationId }
      });
      // Handle response structure: { reports, total, page, ... }
      const reportsData = response.data?.reports || response.data?.data || [];
      setReports(reportsData);

      // Calculate missing reports
      const existing = new Set(
        reportsData.map((r) => `${r.reportMonth}-${r.reportYear}`)
      );
      const now = new Date();
      const missing = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getMonth() + 1}-${date.getFullYear()}`;
        if (!existing.has(key)) {
          missing.push({
            month: date.getMonth() + 1,
            year: date.getFullYear(),
          });
        }
      }
      setMissingReports(missing);
    } catch (err) {
      console.error('Error fetching monthly reports:', err);
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadReport = useCallback(async (applicationId, file, month, year) => {
    setUploading(true);
    try {
      // First upload the file, then create the report
      const formData = new FormData();
      formData.append('file', file);

      // Upload file first (if there's a file upload endpoint)
      // For now, create report with file URL
      const response = await API.post('/student/monthly-reports', {
        applicationId,
        reportMonth: month,
        reportYear: year,
        // reportFileUrl would come from file upload
      });

      toast.success('Report created successfully!');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to create report';
      toast.error(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const submitReport = useCallback(async (reportId, data = {}) => {
    try {
      const response = await API.put(`/student/monthly-reports/${reportId}`, {
        ...data,
        status: 'SUBMITTED',
      });
      toast.success('Report submitted for review!');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to submit report';
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteReport = useCallback(async (reportId) => {
    try {
      // Note: Backend may need a DELETE endpoint for monthly reports
      await API.delete(`/student/monthly-reports/${reportId}`);
      toast.success('Report deleted successfully');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete report';
      toast.error(message);
      throw err;
    }
  }, []);

  return {
    reports,
    loading,
    uploading,
    error,
    missingReports,
    fetchReports,
    uploadReport,
    submitReport,
    deleteReport,
    setReports,
  };
};

export const useMonthlyFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeedbacks = useCallback(async (applicationId) => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      // Monthly feedback is submitted by faculty - students may not have a direct endpoint
      // Try to fetch from faculty feedback endpoint or skip if not available
      const response = await API.get(`/student/applications/${applicationId}/feedback`);
      const feedbackData = response.data?.feedbacks || response.data?.data || [];
      setFeedbacks(feedbackData);
    } catch (err) {
      // 404 is expected if no feedback endpoint exists for students - fail gracefully
      if (err.response?.status !== 404) {
        console.error('Error fetching monthly feedbacks:', err);
        setError(err.message || 'Failed to fetch feedbacks');
      }
      setFeedbacks([]); // Return empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  const submitFeedback = useCallback(async (applicationId, imageFile) => {
    setSubmitting(true);
    try {
      const studentId = getStudentId();
      if (!studentId) {
        throw new Error('Student ID not found. Please log in again.');
      }

      const formData = new FormData();
      formData.append('applicationId', applicationId);
      formData.append('studentId', studentId);
      formData.append('progressImage', imageFile);

      const response = await API.post('/monthly-feedback', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Monthly progress uploaded successfully!');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to upload progress';
      toast.error(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    feedbacks,
    loading,
    submitting,
    error,
    fetchFeedbacks,
    submitFeedback,
    setFeedbacks,
  };
};
