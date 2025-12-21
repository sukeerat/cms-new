import React from 'react';
import { Card, Button, Empty, Spin } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { getImageUrl } from '../../../../../utils/imageUtils';
import MonthlyReportsSection from '../MonthlyReportsSection';

const ApplicationProgressTab = ({
  application,
  monthlyFeedbacks,
  monthlyFeedbacksLoading,
  monthlyReports,
  monthlyReportsLoading,
  monthlyReportsUploading,
  missingReports,
  internshipStarted,
  onOpenMonthlyFeedbackModal,
  onUploadReport,
  onSubmitReport,
  onDeleteReport,
  onRefreshReports,
}) => (
  <div className="space-y-4">
    {/* Monthly Feedbacks (Images) */}
    <Card
      className="rounded-xl"
      title="Monthly Progress Images"
      extra={
        internshipStarted && (
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={() => onOpenMonthlyFeedbackModal(application)}
            className="bg-green-600"
          >
            Upload Progress
          </Button>
        )
      }
    >
      {monthlyFeedbacksLoading ? (
        <div className="text-center py-8"><Spin /></div>
      ) : monthlyFeedbacks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {monthlyFeedbacks.map((feedback) => (
            <div key={feedback.id} className="relative">
              <img
                src={getImageUrl(feedback.progressImage)}
                alt="Progress"
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-b-lg">
                {new Date(feedback.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty description="No progress images uploaded yet" />
      )}
    </Card>

    {/* Monthly Reports Section */}
    <MonthlyReportsSection
      application={application}
      reports={monthlyReports}
      loading={monthlyReportsLoading}
      uploading={monthlyReportsUploading}
      missingReports={missingReports}
      onUpload={onUploadReport}
      onSubmit={onSubmitReport}
      onDelete={onDeleteReport}
      onRefresh={onRefreshReports}
      hasStarted={internshipStarted}
    />
  </div>
);

export default ApplicationProgressTab;
