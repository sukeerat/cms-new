import React, { useState, useCallback, memo } from 'react';
import { Row, Col, Spin, Alert, Modal, message, Card, Typography, Button, Tag, Empty } from 'antd';
import {
  SyncOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
  RightOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import { useStudentDashboard } from '../hooks/useStudentDashboard';
import {
  DashboardHeader,
  StatisticsGrid,
  ActiveInternshipCard,
  JoiningLetterCard,
} from './components';
import {
  selectInstitute,
  selectInstituteLoading,
} from '../../../store/slices/instituteSlice';

dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;

// Quick Actions Card Component
const QuickActionsCard = memo(({
  hasActiveInternship,
  joiningLetterUploaded,
  application,
  onRefresh,
  onNavigateToReports,
  onNavigateToGrievances,
  loading,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="h-full rounded-2xl border border-border">
      <Title level={5} className="mb-4 flex items-center gap-2">
        <CheckCircleOutlined className="text-green-500" />
        Quick Actions
      </Title>

      <div className="space-y-3">
        {/* Joining Letter Status */}
        {hasActiveInternship && (
          <JoiningLetterCard
            application={application}
            onRefresh={onRefresh}
            loading={loading}
          />
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            type="default"
            icon={<FileTextOutlined />}
            onClick={onNavigateToReports}
            className="h-auto py-3 flex flex-col items-center justify-center"
          >
            <span className="text-xs mt-1">Submit Report</span>
          </Button>
          <Button
            type="default"
            icon={<ExclamationCircleOutlined />}
            onClick={onNavigateToGrievances}
            className="h-auto py-3 flex flex-col items-center justify-center"
          >
            <span className="text-xs mt-1">Grievance</span>
          </Button>
        </div>
      </div>
    </Card>
  );
});

QuickActionsCard.displayName = 'QuickActionsCard';

// Recent Applications Mini Card
const RecentApplicationsMini = memo(({ applications = [], onViewAll }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      APPLIED: 'blue',
      SHORTLISTED: 'orange',
      SELECTED: 'green',
      APPROVED: 'green',
      REJECTED: 'red',
      WITHDRAWN: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Card
      className="h-full rounded-2xl border border-border"
      title={
        <div className="flex items-center gap-2">
          <BankOutlined className="text-blue-500" />
          <span>Recent Applications</span>
        </div>
      }
      extra={
        <Button type="link" size="small" onClick={onViewAll}>
          View All <RightOutlined />
        </Button>
      }
      styles={{ body: { padding: applications.length > 0 ? '12px' : '24px' } }}
    >
      {applications.length > 0 ? (
        <div className="space-y-2">
          {applications.slice(0, 4).map((app, index) => {
            const company = app.isSelfIdentified
              ? { companyName: app.companyName }
              : (app.internship?.industry || {});

            return (
              <div
                key={app.id || index}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate('/my-applications')}
              >
                <div className="flex-1 min-w-0">
                  <Text strong className="text-sm block truncate">
                    {company.companyName || 'Company'}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {app.internship?.title || app.jobProfile || 'Internship'}
                  </Text>
                </div>
                <Tag color={getStatusColor(app.status)} className="ml-2">
                  {app.status}
                </Tag>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No applications yet"
          className="py-4"
        >
          <Button type="primary" size="small" onClick={() => navigate('/internships')}>
            Browse Internships
          </Button>
        </Empty>
      )}
    </Card>
  );
});

RecentApplicationsMini.displayName = 'RecentApplicationsMini';

// Monthly Reports Mini Card
const MonthlyReportsMini = memo(({ reports = [], onViewAll, onSubmit }) => {
  const recentReports = reports.slice(0, 3);
  const pendingCount = reports.filter(r => r.status === 'DRAFT' || !r.status).length;

  return (
    <Card
      className="h-full rounded-2xl border border-border"
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-purple-500" />
          <span>Monthly Reports</span>
          {pendingCount > 0 && (
            <Tag color="orange" className="ml-1">{pendingCount} pending</Tag>
          )}
        </div>
      }
      extra={
        <Button type="link" size="small" onClick={onViewAll}>
          View All <RightOutlined />
        </Button>
      }
    >
      {recentReports.length > 0 ? (
        <div className="space-y-2">
          {recentReports.map((report, index) => (
            <div
              key={report.id || index}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
            >
              <div>
                <Text className="text-sm">
                  {dayjs().month(report.reportMonth - 1).format('MMMM')} {report.reportYear}
                </Text>
              </div>
              <Tag color={report.status === 'APPROVED' ? 'green' : 'default'}>
                {report.status || 'Draft'}
              </Tag>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No reports yet"
          className="py-4"
        >
          <Button type="primary" size="small" icon={<UploadOutlined />} onClick={onSubmit}>
            Submit Report
          </Button>
        </Empty>
      )}
    </Card>
  );
});

MonthlyReportsMini.displayName = 'MonthlyReportsMini';

// Grievances Mini Card
const GrievancesMini = memo(({ grievances = [], onViewAll, onCreateNew }) => {
  const navigate = useNavigate();
  const grievancesList = Array.isArray(grievances) ? grievances : (grievances?.grievances || []);
  const pendingCount = grievancesList.filter(g => g.status !== 'RESOLVED' && g.status !== 'CLOSED').length;

  const getStatusColor = (status) => {
    const colors = {
      SUBMITTED: 'blue',
      IN_REVIEW: 'orange',
      IN_PROGRESS: 'orange',
      ESCALATED: 'red',
      RESOLVED: 'green',
      CLOSED: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Card
      className="h-full rounded-2xl border border-border"
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleOutlined className="text-orange-500" />
          <span>Grievances</span>
          {pendingCount > 0 && (
            <Tag color="red" className="ml-1">{pendingCount} active</Tag>
          )}
        </div>
      }
      extra={
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onCreateNew}>
          New
        </Button>
      }
    >
      {grievancesList.length > 0 ? (
        <div className="space-y-2">
          {grievancesList.slice(0, 3).map((grievance, index) => (
            <div
              key={grievance.id || index}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate('/grievances')}
            >
              <div className="flex-1 min-w-0">
                <Text strong className="text-sm block truncate">
                  {grievance.title || grievance.subject}
                </Text>
                <Text className="text-xs text-gray-500">
                  {dayjs(grievance.createdAt).format('MMM DD, YYYY')}
                </Text>
              </div>
              <Tag color={getStatusColor(grievance.status)} className="ml-2">
                {grievance.status}
              </Tag>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No grievances"
          className="py-4"
        >
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onCreateNew}>
            Report Issue
          </Button>
        </Empty>
      )}
    </Card>
  );
});

GrievancesMini.displayName = 'GrievancesMini';

// Main Dashboard Component
const StudentDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Institute data
  const institute = useSelector(selectInstitute);

  // Use custom hook for dashboard data with SWR
  const {
    isLoading,
    isRevalidating,
    loadingStates,
    profile,
    grievances,
    stats,
    counts, // Server-side counts from profile._count
    activeInternships,
    recentApplications,
    monthlyReports,
    mentor,
    error,
    refresh,
    handleWithdrawApplication,
  } = useStudentDashboard();

  // Local UI state
  const [selectedInternship, setSelectedInternship] = useState(null);

  // Navigate to my applications
  const handleViewInternship = useCallback(() => {
    navigate('/my-applications');
  }, [navigate]);

  // Navigate to applications
  const handleNavigateToApplications = useCallback(() => {
    navigate('/my-applications');
  }, [navigate]);

  // Navigate to reports
  const handleNavigateToReports = useCallback(() => {
    navigate('/reports/submit');
  }, [navigate]);

  // Navigate to grievances
  const handleNavigateToGrievances = useCallback(() => {
    navigate('/grievances');
  }, [navigate]);

  // Navigate to submit grievance
  const handleCreateGrievance = useCallback(() => {
    navigate('/submit-grievance');
  }, [navigate]);

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          title="Error loading dashboard"
          description={error}
          showIcon
          action={
            <button onClick={refresh} className="text-blue-600 hover:underline">
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  const hasActiveInternship = activeInternships && activeInternships.length > 0;
  const currentInternship = selectedInternship || (hasActiveInternship ? activeInternships[0] : null);

  return (
    <Spin spinning={isLoading} tip="Loading dashboard...">
      <div className="p-4 md:p-8 bg-background-secondary min-h-screen">
        {/* Subtle Revalidation Indicator */}
        {isRevalidating && !isLoading && (
          <div
            className="fixed top-0 left-0 right-0 z-50 bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-center gap-2 text-blue-700 text-sm"
            style={{ animation: 'slideDown 0.3s ease-out' }}
          >
            <SyncOutlined spin />
            <span>Updating dashboard data...</span>
          </div>
        )}

        {/* Header Section */}
        <DashboardHeader
          studentName={profile?.name}
          instituteName={institute?.name}
          mentorName={mentor?.name}
          onRefresh={refresh}
          loading={isLoading}
          isRevalidating={isRevalidating}
        />

        {/* Statistics Grid */}
        <StatisticsGrid stats={stats} counts={counts} />

        {/* Main Content Section */}
        <div className="space-y-4">
          {/* Primary Row: Active Internship + Quick Actions */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={hasActiveInternship ? 16 : 24}>
              <ActiveInternshipCard
                internship={currentInternship}
                onViewDetails={handleViewInternship}
                loading={loadingStates?.applications}
                studentMentor={mentor}
              />
            </Col>

            {hasActiveInternship && (
              <Col xs={24} lg={8}>
                <QuickActionsCard
                  hasActiveInternship={hasActiveInternship}
                  joiningLetterUploaded={!!currentInternship?.joiningLetterUrl}
                  application={currentInternship}
                  onRefresh={refresh}
                  onNavigateToReports={handleNavigateToReports}
                  onNavigateToGrievances={handleCreateGrievance}
                  loading={loadingStates?.applications}
                />
              </Col>
            )}
          </Row>

          {/* Secondary Row: Reports, Grievances, Recent Applications */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <RecentApplicationsMini
                applications={recentApplications}
                onViewAll={handleNavigateToApplications}
              />
            </Col>

            <Col xs={24} md={12} lg={8}>
              <MonthlyReportsMini
                reports={monthlyReports}
                onViewAll={handleNavigateToReports}
                onSubmit={handleNavigateToReports}
              />
            </Col>

            <Col xs={24} md={24} lg={8}>
              <GrievancesMini
                grievances={grievances}
                onViewAll={handleNavigateToGrievances}
                onCreateNew={handleCreateGrievance}
              />
            </Col>
          </Row>
        </div>
      </div>
    </Spin>
  );
};

StudentDashboard.displayName = 'StudentDashboard';

export default memo(StudentDashboard);
