import React, { memo } from 'react';
import { Card, Button, Typography, Tabs, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';
import { hasInternshipStarted } from '../utils/applicationUtils';
import {
  ApplicationDetailsTab,
  ApplicationTimelineTab,
  ApplicationProgressTab,
} from './tabs';
import FacultyVisitsSection from './FacultyVisitsSection';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ApplicationDetailsView = ({
  application,
  onBack,
  monthlyReports,
  monthlyReportsProgress,
  monthlyReportsLoading,
  monthlyReportsUploading,
  onUploadReport,
  onDeleteReport,
  onRefreshReports,
  facultyVisits = [],
  facultyVisitsProgress = {},
  facultyVisitsLoading = false,
}) => {
  if (!application) return null;

  const isSelfIdentified = application.isSelfIdentified || !application.internship;
  const internship = application.internship;
  const industry = internship?.industry || {};
  const internshipStarted = hasInternshipStarted(application);
  const facultyVisitCount = facultyVisitsProgress?.completed || application._count?.facultyVisitLogs || 0;

  return (
    <div className="mb-8">
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        className="mb-4"
        size="large"
      >
        Back to My Applications
      </Button>

      {/* Quick Stats */}
      <Row gutter={16} className="mb-4">
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Reports Approved"
              value={`${monthlyReportsProgress?.approved || 0}/${monthlyReportsProgress?.total || 0}`}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: monthlyReportsProgress?.percentage === 100 ? '#52c41a' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Faculty Visits"
              value={`${facultyVisitsProgress?.completed || 0}/${facultyVisitsProgress?.total || 0}`}
              prefix={<TeamOutlined />}
              valueStyle={{ color: facultyVisitsProgress?.percentage === 100 ? '#52c41a' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Statistic
              title="Progress"
              value={monthlyReportsProgress?.percentage || 0}
              suffix="%"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: monthlyReportsProgress?.percentage === 100 ? '#52c41a' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="text-center">
            <Text type="secondary" className="text-xs">Status</Text>
            <div className="mt-1">
              <Text strong className="text-lg">
                {application.status}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Application Details Content */}
      <Card className="rounded-2xl">
        <div className="mb-6">
          <Title level={3}>
            <FileTextOutlined className="mr-2 text-blue-600" />
            Application Details
          </Title>
        </div>

        <Tabs defaultActiveKey="details">
          <TabPane tab="Application Details" key="details">
            <ApplicationDetailsTab
              application={application}
              isSelfIdentified={isSelfIdentified}
              internship={internship}
              industry={industry}
            />
          </TabPane>
          <TabPane tab="Timeline" key="timeline">
            <ApplicationTimelineTab application={application} />
          </TabPane>
          <TabPane tab="Monthly Reports" key="progress">
            <ApplicationProgressTab
              application={application}
              monthlyReports={monthlyReports}
              monthlyReportsProgress={monthlyReportsProgress}
              monthlyReportsLoading={monthlyReportsLoading}
              monthlyReportsUploading={monthlyReportsUploading}
              internshipStarted={internshipStarted}
              onUploadReport={onUploadReport}
              onDeleteReport={onDeleteReport}
              onRefreshReports={onRefreshReports}
            />
          </TabPane>
          <TabPane tab="Faculty Visits" key="visits">
            <FacultyVisitsSection
              application={application}
              visits={facultyVisits}
              progress={facultyVisitsProgress}
              loading={facultyVisitsLoading}
              hasStarted={internshipStarted}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

ApplicationDetailsView.displayName = 'ApplicationDetailsView';

export default memo(ApplicationDetailsView);
