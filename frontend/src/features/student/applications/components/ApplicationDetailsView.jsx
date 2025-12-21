import React from 'react';
import { Card, Button, Typography, Tabs } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { hasInternshipStarted } from '../utils/applicationUtils';
import {
  ApplicationDetailsTab,
  ApplicationTimelineTab,
  ApplicationFeedbackTab,
  ApplicationProgressTab,
} from './tabs';

const { Title } = Typography;
const { TabPane } = Tabs;

const ApplicationDetailsView = ({
  application,
  onBack,
  onOpenFeedbackModal,
  onOpenMonthlyFeedbackModal,
  completionFeedback,
  monthlyReports,
  monthlyReportsLoading,
  monthlyReportsUploading,
  missingReports,
  onUploadReport,
  onSubmitReport,
  onDeleteReport,
  onRefreshReports,
  monthlyFeedbacks,
  monthlyFeedbacksLoading,
}) => {
  if (!application) return null;

  const isSelfIdentified = application.isSelfIdentified || !application.internship;
  const internship = application.internship;
  const industry = internship?.industry || {};
  const internshipStarted = hasInternshipStarted(application);

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
          <TabPane tab="Monthly Progress" key="progress">
            <ApplicationProgressTab
              application={application}
              monthlyFeedbacks={monthlyFeedbacks}
              monthlyFeedbacksLoading={monthlyFeedbacksLoading}
              monthlyReports={monthlyReports}
              monthlyReportsLoading={monthlyReportsLoading}
              monthlyReportsUploading={monthlyReportsUploading}
              missingReports={missingReports}
              internshipStarted={internshipStarted}
              onOpenMonthlyFeedbackModal={onOpenMonthlyFeedbackModal}
              onUploadReport={onUploadReport}
              onSubmitReport={onSubmitReport}
              onDeleteReport={onDeleteReport}
              onRefreshReports={onRefreshReports}
            />
          </TabPane>
          <TabPane tab="Feedback" key="feedback">
            <ApplicationFeedbackTab
              application={application}
              completionFeedback={completionFeedback}
              onOpenFeedbackModal={onOpenFeedbackModal}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default ApplicationDetailsView;
