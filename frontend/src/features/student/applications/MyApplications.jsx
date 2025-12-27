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
          <Tag color="blue" className="rounded-md font-bold">{derivedData.platformCount}</Tag>
        </span>
      ),
      children: derivedData.hasPlatformApplications ? (
        <Card bordered={false} className="rounded-2xl border border-gray-100 shadow-sm">
          <ApplicationsTable
            applications={applications}
            loading={loading}
            onViewDetails={handleViewDetails}
          />
        </Card>
      ) : (
        <Card bordered={false} className="rounded-2xl border border-gray-100 shadow-sm bg-white">
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
              className="rounded-xl h-11 px-6 font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-200"
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
          <Tag color="purple" className="rounded-md font-bold">{derivedData.selfIdentifiedCount}</Tag>
        </span>
      ),
      children: derivedData.hasSelfIdentifiedApplications ? (
        <Card bordered={false} className="rounded-2xl border border-gray-100 shadow-sm">
          <ApplicationsTable
            applications={selfIdentifiedApplications}
            loading={loading}
            onViewDetails={handleViewDetails}
            isSelfIdentified
          />
        </Card>
      ) : (
        <Card bordered={false} className="rounded-2xl border border-gray-100 shadow-sm bg-white">
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
              className="rounded-xl h-11 px-6 font-bold bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200"
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
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
              <BankOutlined className="text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-1 !text-gray-900 !text-2xl lg:!text-3xl tracking-tight">
                My Applications
              </Title>
              <Text className="text-gray-500 text-sm">
                Track and manage your internship applications
              </Text>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={refetch}
              loading={loading}
              className="rounded-xl h-11 px-4 border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 bg-white"
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/self-identified-internship')}
              className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-blue-200 bg-blue-600 hover:bg-blue-500 border-0"
            >
              Add Internship
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <Statistic
                title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Applications</span>}
                value={derivedData.totalCount}
                prefix={<BankOutlined className="text-blue-500 mr-2" />}
                valueStyle={{ fontWeight: 700, color: '#111827' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <Statistic
                title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Internships</span>}
                value={derivedData.activeCount}
                valueStyle={{ color: '#10b981', fontWeight: 700 }}
                prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <Statistic
                title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Pending</span>}
                value={derivedData.pendingCount}
                valueStyle={{ color: '#f59e0b', fontWeight: 700 }}
                prefix={<ClockCircleOutlined className="text-amber-500 mr-2" />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
              <Statistic
                title={<span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Self-Identified</span>}
                value={derivedData.selfIdentifiedCount}
                valueStyle={{ color: '#8b5cf6', fontWeight: 700 }}
                prefix={<RocketOutlined className="text-violet-500 mr-2" />}
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
        className="applications-tabs custom-tabs"
        size="large"
      />
    </div>
  );
};

export default MyApplications;
