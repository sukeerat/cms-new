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

  const fetchMyApplications = useCallback(async () => {
    try {
      const response = await API.get('/internship-applications/my-applications');
      if (response.data?.data) {
        const platformApps = (response.data.data || []).filter(
          (app) => !app.isSelfIdentified
        );
        setApplications(platformApps);
      }
      return true;
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to fetch applications');
      toast.error('Failed to fetch applications');
      return false;
    }
  }, []);

  const fetchSelfIdentifiedApplications = useCallback(async () => {
    try {
      const response = await API.get('/internship-applications/self-identified');
      if (response.data?.data) {
        setSelfIdentifiedApplications(response.data.data);
      }
      return true;
    } catch (err) {
      console.error('Error fetching self-identified applications:', err);
      // Don't show toast for this as it's secondary data
      return false;
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMyApplications(),
        fetchSelfIdentifiedApplications(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchMyApplications, fetchSelfIdentifiedApplications]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    loading,
    error,
    applications,
    selfIdentifiedApplications,
    refetch: fetchAll,
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
      const response = await API.get(`/monthly-reports/application/${applicationId}`);
      if (response.data?.data) {
        setReports(response.data.data);
        // Calculate missing reports
        const existing = new Set(
          response.data.data.map((r) => `${r.reportMonth}-${r.reportYear}`)
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
      }
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
      const studentId = getStudentId();
      if (!studentId) {
        throw new Error('Student ID not found. Please log in again.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', applicationId);
      formData.append('studentId', studentId);
      formData.append('reportMonth', month);
      formData.append('reportYear', year);

      const response = await API.post('/monthly-reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Report uploaded successfully!');
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to upload report';
      toast.error(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const submitReport = useCallback(async (reportId) => {
    try {
      const studentId = getStudentId();
      if (!studentId) {
        throw new Error('Student ID not found. Please log in again.');
      }

      const response = await API.patch(`/monthly-reports/${reportId}/submit`, {
        studentId,
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
      await API.delete(`/monthly-reports/${reportId}`);
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
      const response = await API.get(`/monthly-feedback/application/${applicationId}`);
      if (response.data?.data) {
        setFeedbacks(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching monthly feedbacks:', err);
      setError(err.message || 'Failed to fetch feedbacks');
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
