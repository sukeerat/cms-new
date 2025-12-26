import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, Tabs, Empty, Spin, Button, Typography, Row, Col, Tag, Statistic } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ExportOutlined,
  BankOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

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

const MyApplications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const loading = useSelector(selectApplicationsLoading);
  const applications = useSelector(selectPlatformApplications);
  const selfIdentifiedApplications = useSelector(selectSelfIdentifiedApplications);
  const lastFetched = useSelector(selectApplicationsLastFetched);

  // Memoize derived data
  const derivedData = useMemo(() => {
    const platformCount = applications?.length || 0;
    const selfIdentifiedCount = selfIdentifiedApplications?.length || 0;
    const totalCount = platformCount + selfIdentifiedCount;
    const hasPlatformApplications = platformCount > 0;
    const hasSelfIdentifiedApplications = selfIdentifiedCount > 0;
    const hasAnyApplications = totalCount > 0;

    // Count by status
    const allApps = [...(applications || []), ...(selfIdentifiedApplications || [])];
    const activeCount = allApps.filter(a =>
      ['SELECTED', 'APPROVED', 'JOINED'].includes(a.status)
    ).length;
    const pendingCount = allApps.filter(a =>
      ['APPLIED', 'SHORTLISTED', 'PENDING'].includes(a.status)
    ).length;

    return {
      platformCount,
      selfIdentifiedCount,
      totalCount,
      hasPlatformApplications,
      hasSelfIdentifiedApplications,
      hasAnyApplications,
      activeCount,
      pendingCount,
    };
  }, [applications, selfIdentifiedApplications]);

  // Fetch applications on mount
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
  const [activeTab, setActiveTab] = useState('platform');

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

  const handleRefreshApplication = useCallback(async () => {
    await dispatch(fetchApplications({ forceRefresh: true }));

    if (selectedApplication) {
      await Promise.all([
        fetchReports(selectedApplication.id),
        fetchVisits(selectedApplication.id),
      ]);
    }
  }, [dispatch, selectedApplication, fetchReports, fetchVisits]);

  // Render loading state
  if (loading && !lastFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  // Render details view
  if (showDetailsView && selectedApplication) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
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
          onRefresh={handleRefreshApplication}
        />
      </div>
    );
  }

  // Tab items for Ant Design 5
  const tabItems = [
    {
      key: 'platform',
      label: (
        <span className="flex items-center gap-2">
          <BankOutlined />
          Platform Internships
          <Tag color="blue">{derivedData.platformCount}</Tag>
        </span>
      ),
      children: derivedData.hasPlatformApplications ? (
        <Card className="rounded-2xl border border-gray-200">
          <ApplicationsTable
            applications={applications}
            loading={loading}
            onViewDetails={handleViewDetails}
          />
        </Card>
      ) : (
        <Card className="rounded-2xl border border-gray-200">
          <Empty
            image={<BankOutlined className="text-6xl text-gray-300" />}
            imageStyle={{ height: 80 }}
            description={
              <div className="text-center py-4">
                <Title level={4} className="text-gray-500 mb-2">No applications yet</Title>
                <Text className="text-gray-400">Browse available internships and start applying</Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={() => navigate('/internships')}
              size="large"
            >
              Browse Internships
            </Button>
          </Empty>
        </Card>
      ),
    },
    {
      key: 'self-identified',
      label: (
        <span className="flex items-center gap-2">
          <RocketOutlined />
          Self-Identified
          <Tag color="purple">{derivedData.selfIdentifiedCount}</Tag>
        </span>
      ),
      children: derivedData.hasSelfIdentifiedApplications ? (
        <Card className="rounded-2xl border border-gray-200">
          <ApplicationsTable
            applications={selfIdentifiedApplications}
            loading={loading}
            onViewDetails={handleViewDetails}
            isSelfIdentified
          />
        </Card>
      ) : (
        <Card className="rounded-2xl border border-gray-200">
          <Empty
            image={<RocketOutlined className="text-6xl text-gray-300" />}
            imageStyle={{ height: 80 }}
            description={
              <div className="text-center py-4">
                <Title level={4} className="text-gray-500 mb-2">No self-identified internships</Title>
                <Text className="text-gray-400">Submit internships you found from other platforms</Text>
              </div>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/self-identified-internship')}
              size="large"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add Self-Identified Internship
            </Button>
          </Empty>
        </Card>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <Title level={2} className="mb-1 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <BankOutlined className="text-blue-600 text-lg" />
              </div>
              My Applications
            </Title>
            <Text className="text-gray-500">
              Track and manage your internship applications
            </Text>
          </div>

          <div className="flex gap-2">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={refetch}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/self-identified-internship')}
            >
              Add Internship
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card className="rounded-xl border border-gray-200 text-center">
              <Statistic
                title={<span className="text-gray-500 text-xs">Total Applications</span>}
                value={derivedData.totalCount}
                prefix={<BankOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="rounded-xl border border-gray-200 text-center">
              <Statistic
                title={<span className="text-gray-500 text-xs">Active Internships</span>}
                value={derivedData.activeCount}
                valueStyle={{ color: '#10b981' }}
                prefix={<CheckCircleOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="rounded-xl border border-gray-200 text-center">
              <Statistic
                title={<span className="text-gray-500 text-xs">Pending</span>}
                value={derivedData.pendingCount}
                valueStyle={{ color: '#f59e0b' }}
                prefix={<ClockCircleOutlined className="text-orange-500" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="rounded-xl border border-gray-200 text-center">
              <Statistic
                title={<span className="text-gray-500 text-xs">Self-Identified</span>}
                value={derivedData.selfIdentifiedCount}
                valueStyle={{ color: '#8b5cf6' }}
                prefix={<RocketOutlined className="text-purple-500" />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="applications-tabs"
        size="large"
      />
    </div>
  );
};

export default MyApplications;
