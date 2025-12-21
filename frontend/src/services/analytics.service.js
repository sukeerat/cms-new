import API from './api';

/**
 * Analytics Service
 * API methods for principal analytics and reports
 */
export const analyticsService = {
  // Institution analytics
  async getInstitutionAnalytics(institutionId) {
    const response = await API.get(`/principal/analytics?institutionId=${institutionId}`);
    return response.data;
  },

  async getStudentProgress(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await API.get(`/principal/students/progress?${queryParams}`);
    return response.data;
  },

  async getPendingReportsByMonth(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await API.get(`/principal/reports/pending-by-month?${queryParams}`);
    return response.data;
  },

  async getFacultyReports(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await API.get(`/principal/faculty/reports?${queryParams}`);
    return response.data;
  },

  async getInternshipStats(institutionId) {
    const response = await API.get(`/principal/internships/stats?institutionId=${institutionId}`);
    return response.data;
  },

  async getPlacementStats(institutionId) {
    const response = await API.get(`/principal/placements/stats?institutionId=${institutionId}`);
    return response.data;
  },

  // Faculty progress tracking
  async getFacultyProgressList(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await API.get(`/principal/faculty/progress?${queryParams}`);
    return response.data;
  },

  async getFacultyProgressDetails(facultyId) {
    const response = await API.get(`/principal/faculty/progress/${facultyId}`);
    return response.data;
  },
};

export default analyticsService;
