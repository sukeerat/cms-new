import React, { useState, useCallback, useEffect } from 'react';
import { Card, Tabs, Empty, Spin, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ExportOutlined } from '@ant-design/icons';

import {
  ApplicationsTable,
  ApplicationDetailsView,
} from './components';
import { useMonthlyReports, useFacultyVisits } from './hooks/useApplications';
import { fetchApplications } from '../store/studentSlice';
import {
  selectApplicationsLoading,
  selectPlatformApplications,
  selectSelfIdentifiedApplications,
  selectApplicationsLastFetched,
} from '../store/studentSelectors';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const MyApplications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state - using memoized selectors
  const loading = useSelector(selectApplicationsLoading);
  const applications = useSelector(selectPlatformApplications);
  const selfIdentifiedApplications = useSelector(selectSelfIdentifiedApplications);
  const lastFetched = useSelector(selectApplicationsLastFetched);

  // Fetch applications on mount if not cached
  useEffect(() => {
    if (!lastFetched) {
      dispatch(fetchApplications({}));
    }
  }, [dispatch, lastFetched]);

  const refetch = useCallback(() => {
    dispatch(fetchApplications({ forceRefresh: true }));
  }, [dispatch]);

  // State
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsView, setShowDetailsView] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const {
    reports: monthlyReports,
    progress: monthlyReportsProgress,
    loading: monthlyReportsLoading,
    uploading: monthlyReportsUploading,
    fetchReports,
    uploadReport,
    deleteReport,
  } = useMonthlyReports();

  const {
    visits: facultyVisits,
    progress: facultyVisitsProgress,
    loading: facultyVisitsLoading,
    fetchVisits,
  } = useFacultyVisits();

  // Handlers
  const handleViewDetails = useCallback(async (application) => {
    setSelectedApplication(application);
    setShowDetailsView(true);

    // Fetch monthly reports and faculty visits in parallel
    await Promise.all([
      fetchReports(application.id),
      fetchVisits(application.id),
    ]);
  }, [fetchReports, fetchVisits]);

  const handleCloseDetailsView = useCallback(() => {
    setShowDetailsView(false);
    setSelectedApplication(null);
  }, []);

  const handleRefreshReports = useCallback(async () => {
    if (selectedApplication) {
      await fetchReports(selectedApplication.id);
    }
  }, [selectedApplication, fetchReports]);

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Render details view
  if (showDetailsView && selectedApplication) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto">
          <ApplicationDetailsView
            application={selectedApplication}
            onBack={handleCloseDetailsView}
            monthlyReports={monthlyReports}
            monthlyReportsProgress={monthlyReportsProgress}
            monthlyReportsLoading={monthlyReportsLoading}
            monthlyReportsUploading={monthlyReportsUploading}
            onUploadReport={uploadReport}
            onDeleteReport={deleteReport}
            onRefreshReports={handleRefreshReports}
            facultyVisits={facultyVisits}
            facultyVisitsProgress={facultyVisitsProgress}
            facultyVisitsLoading={facultyVisitsLoading}
          />
        </div>
      </div>
    );
  }

  // Render applications list
  return (
    <div className="min-h-screen">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Title level={2} className="mb-2">My Applications</Title>
          <Text type="secondary">
            Track and manage your internship applications
          </Text>
        </div>

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Platform Applications */}
          <TabPane tab={`Platform Internships (${applications.length})`} key="1">
            {applications.length > 0 ? (
              <Card className="rounded-2xl">
                <ApplicationsTable
                  applications={applications}
                  loading={loading}
                  onViewDetails={handleViewDetails}
                />
              </Card>
            ) : (
              <Card className="rounded-2xl text-center py-16">
                <Empty
                  description={
                    <div>
                      <Title level={4} className="text-gray-500 mb-2">
                        No applications yet
                      </Title>
                      <Text className="text-gray-400">
                        Browse available internships and start applying
                      </Text>
                    </div>
                  }
                >
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={() => navigate('/internships')}
                    className="bg-blue-600"
                  >
                    Browse Internships
                  </Button>
                </Empty>
              </Card>
            )}
          </TabPane>

          {/* Self-Identified Applications */}
          <TabPane tab={`Self-Identified (${selfIdentifiedApplications.length})`} key="2">
            {selfIdentifiedApplications.length > 0 ? (
              <Card className="rounded-2xl">
                <ApplicationsTable
                  applications={selfIdentifiedApplications}
                  loading={loading}
                  onViewDetails={handleViewDetails}
                  isSelfIdentified
                />
              </Card>
            ) : (
              <Card className="rounded-2xl text-center py-16">
                <Empty
                  description={
                    <div>
                      <Title level={4} className="text-gray-500 mb-2">
                        No self-identified applications yet
                      </Title>
                      <Text className="text-gray-400">
                        Submit internships you found from other platforms
                      </Text>
                    </div>
                  }
                >
                  <Button
                    type="primary"
                    onClick={() => navigate('/internships/self-identified')}
                    className="bg-purple-600"
                  >
                    Submit Self-Identified Internship
                  </Button>
                </Empty>
              </Card>
            )}
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default MyApplications;
