import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Card,
  Button,
  Tag,
  Empty,
  Spin,
  Progress,
  Select,
  Popconfirm,
  Typography,
  message,
  Timeline,
  Modal,
  Alert,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CalendarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  MONTH_NAMES,
  getReportSubmissionStatus,
  formatReportPeriod,
  getSubmissionWindow,
} from '../utils/applicationUtils';

const { Text, Title } = Typography;

const MonthlyReportsSection = ({
  application,
  reports = [],
  progress = {},
  loading,
  uploading,
  onUpload,
  onDelete,
  onRefresh,
  hasStarted,
}) => {
  const [reportFile, setReportFile] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);

  // Calculate progress from reports
  const calculatedProgress = {
    total: progress.total || reports.length,
    approved: progress.approved || reports.filter((r) => r.status === 'APPROVED').length,
    draft: progress.draft || reports.filter((r) => r.status === 'DRAFT').length,
    overdue: progress.overdue || 0,
    percentage: progress.percentage || 0,
  };

  // Get reports that can be submitted now (within window or overdue)
  const getSubmittableReports = useCallback(() => {
    return reports.filter((report) => {
      const status = report.submissionStatus || getReportSubmissionStatus(report);
      return status.canSubmit && report.status === 'DRAFT';
    });
  }, [reports]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        message.error('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error('File size should be less than 10MB');
        return;
      }
      setReportFile(file);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!reportFile || !selectedMonth || !selectedYear) {
      message.warning('Please select a file and report month');
      return;
    }

    try {
      await onUpload(application.id, reportFile, selectedMonth, selectedYear);
      setReportFile(null);
      setUploadModalVisible(false);
      setSelectedMonth(null);
      setSelectedYear(null);
      message.success('Report submitted and auto-approved!');
      onRefresh?.();
    } catch (error) {
      // Error handled in hook
    }
  }, [application.id, reportFile, selectedMonth, selectedYear, onUpload, onRefresh]);

  const handleDeleteReport = useCallback(async (reportId, status) => {
    if (status === 'APPROVED') {
      message.warning('Approved reports cannot be deleted');
      return;
    }
    try {
      await onDelete(reportId);
      onRefresh?.();
    } catch (error) {
      // Error handled in hook
    }
  }, [onDelete, onRefresh]);

  const openUploadModal = useCallback((report = null) => {
    if (report) {
      setSelectedMonth(report.reportMonth);
      setSelectedYear(report.reportYear);
    } else {
      // Default to current month's report if available
      const submittable = getSubmittableReports();
      if (submittable.length > 0) {
        setSelectedMonth(submittable[0].reportMonth);
        setSelectedYear(submittable[0].reportYear);
      }
    }
    setUploadModalVisible(true);
  }, [getSubmittableReports]);

  const openViewModal = useCallback((report) => {
    setSelectedReport(report);
    setViewModalVisible(true);
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'CAN_SUBMIT':
        return <UploadOutlined className="text-blue-500" />;
      case 'OVERDUE':
        return <ExclamationCircleOutlined className="text-red-500" />;
      case 'NOT_YET_DUE':
        return <ClockCircleOutlined className="text-gray-400" />;
      default:
        return <FileTextOutlined className="text-gray-400" />;
    }
  }, []);

  const getTimelineColor = useCallback((status) => {
    switch (status) {
      case 'APPROVED':
        return 'green';
      case 'CAN_SUBMIT':
        return 'blue';
      case 'OVERDUE':
        return 'red';
      default:
        return 'gray';
    }
  }, []);

  const handleCloseUploadModal = useCallback(() => {
    setUploadModalVisible(false);
    setReportFile(null);
  }, []);

  const handleCloseViewModal = useCallback(() => {
    setViewModalVisible(false);
    setSelectedReport(null);
  }, []);

  const handleOpenReportPdf = useCallback(() => {
    if (selectedReport?.reportFileUrl) {
      window.open(selectedReport.reportFileUrl, '_blank');
    }
  }, [selectedReport]);

  if (!hasStarted) {
    return (
      <Card className="rounded-xl">
        <Empty
          image={<CalendarOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
          description={
            <div className="text-center">
              <Text className="text-gray-500">
                Monthly reports will be available once your internship starts
              </Text>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Title level={5} className="!mb-0">Monthly Reports Progress</Title>
            <Text className="text-gray-500 text-sm">
              Submit reports for each month of your internship
            </Text>
          </div>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={openUploadModal}
            disabled={getSubmittableReports().length === 0}
            className="bg-blue-600"
          >
            Submit Report
          </Button>
        </div>

        <Progress
          percent={calculatedProgress.percentage}
          status={calculatedProgress.overdue > 0 ? 'exception' : 'active'}
          strokeColor={calculatedProgress.overdue > 0 ? undefined : { from: '#108ee9', to: '#87d068' }}
        />

        <div className="flex justify-between text-sm mt-2">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <CheckCircleOutlined className="text-green-500" />
              {calculatedProgress.approved} approved
            </span>
            <span className="flex items-center gap-1">
              <FileTextOutlined className="text-gray-400" />
              {calculatedProgress.draft} pending
            </span>
          </div>
          {calculatedProgress.overdue > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <WarningOutlined />
              {calculatedProgress.overdue} overdue
            </span>
          )}
        </div>

        {/* Auto-approval notice */}
        <Alert
          className="mt-4"
          title="Reports are auto-approved upon submission"
          type="info"
          showIcon
          icon={<CheckCircleOutlined />}
        />
      </Card>

      {/* Reports Timeline */}
      <Card className="rounded-xl" title="Report Timeline">
        {loading ? (
          <div className="text-center py-8">
            <Spin />
          </div>
        ) : reports.length === 0 ? (
          <Empty description="No reports generated yet. Reports will be generated when your internship dates are set." />
        ) : (
          <Timeline
            mode="left"
            items={reports.map((report) => {
              const submissionStatus = report.submissionStatus || getReportSubmissionStatus(report);
              const window = getSubmissionWindow(report.reportMonth, report.reportYear);

              return {
                key: report.id,
                color: getTimelineColor(submissionStatus.status),
                dot: getStatusIcon(submissionStatus.status),
                children: (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg -mt-1 ml-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Text strong>{MONTH_NAMES[report.reportMonth - 1]} {report.reportYear}</Text>
                        {report.isFinalReport && (
                          <Tag color="purple" className="text-xs">Final</Tag>
                        )}
                        {report.isPartialMonth && (
                          <Tag color="orange" className="text-xs">Partial</Tag>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {submissionStatus.status === 'APPROVED' ? (
                          <span className="text-green-600">{submissionStatus.sublabel}</span>
                        ) : (
                          <>
                            <span>Due: {window.windowEndFormatted}</span>
                            {submissionStatus.sublabel && (
                              <span className={`ml-2 ${submissionStatus.status === 'OVERDUE' ? 'text-red-500' : ''}`}>
                                • {submissionStatus.sublabel}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Tag color={submissionStatus.color}>
                        {submissionStatus.label}
                      </Tag>

                      {/* Submit button for submittable reports */}
                      {submissionStatus.canSubmit && report.status === 'DRAFT' && (
                        <Tooltip title="Click to upload and submit">
                          <Button
                            type="primary"
                            size="small"
                            icon={<UploadOutlined />}
                            onClick={() => openUploadModal(report)}
                            className="bg-blue-600"
                          >
                            Submit
                          </Button>
                        </Tooltip>
                      )}

                      {/* View button if file exists */}
                      {report.reportFileUrl && (
                        <Tooltip title="View report">
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => openViewModal(report)}
                          />
                        </Tooltip>
                      )}

                      {/* Delete button for non-approved reports */}
                      {report.status !== 'APPROVED' && report.reportFileUrl && (
                        <Popconfirm
                          title="Delete this report?"
                          description="This action cannot be undone."
                          onConfirm={() => handleDeleteReport(report.id, report.status)}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      )}
                    </div>
                  </div>
                ),
              };
            })}
          />
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        title="Submit Monthly Report"
        open={uploadModalVisible}
        onCancel={handleCloseUploadModal}
        footer={[
          <Button key="cancel" onClick={handleCloseUploadModal}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={!reportFile}
            className="bg-blue-600"
          >
            Submit & Approve
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <Alert
            title="Auto-Approval"
            description="Your report will be automatically approved upon submission."
            type="success"
            showIcon
          />

          <div>
            <Text strong className="block mb-2">Report Month</Text>
            <div className="flex gap-2">
              <Select
                value={selectedMonth}
                onChange={setSelectedMonth}
                className="w-40"
                placeholder="Month"
                options={MONTH_NAMES.map((name, idx) => ({
                  value: idx + 1,
                  label: name,
                }))}
              />
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                className="w-28"
                placeholder="Year"
                options={[2024, 2025, 2026, 2027].map((y) => ({
                  value: y,
                  label: y.toString(),
                }))}
              />
            </div>
            {selectedMonth && selectedYear && (
              <div className="mt-2 text-sm text-gray-500">
                Submission window: {getSubmissionWindow(selectedMonth, selectedYear).windowStartFormatted} - {getSubmissionWindow(selectedMonth, selectedYear).windowEndFormatted}
              </div>
            )}
          </div>

          <div>
            <Text strong className="block mb-2">Upload PDF Report</Text>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="report-file-input-modal"
            />
            <label
              htmlFor="report-file-input-modal"
              className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {reportFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileTextOutlined className="text-blue-600 text-xl" />
                  <span className="text-blue-600">{reportFile.name}</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <UploadOutlined className="text-3xl mb-2" />
                  <p>Click to select PDF file</p>
                  <p className="text-xs">Maximum file size: 10MB</p>
                </div>
              )}
            </label>
          </div>
        </div>
      </Modal>

      {/* View Report Modal */}
      <Modal
        title={selectedReport ? `${MONTH_NAMES[selectedReport.reportMonth - 1]} ${selectedReport.reportYear} Report` : 'View Report'}
        open={viewModalVisible}
        onCancel={handleCloseViewModal}
        footer={[
          <Button key="close" onClick={handleCloseViewModal}>
            Close
          </Button>,
          selectedReport?.reportFileUrl && (
            <Button
              key="open"
              type="primary"
              onClick={handleOpenReportPdf}
              className="bg-blue-600"
            >
              Open PDF
            </Button>
          ),
        ]}
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text className="text-gray-500 text-xs">Status</Text>
                  <div>
                    <Tag color={getReportSubmissionStatus(selectedReport).color}>
                      {getReportSubmissionStatus(selectedReport).label}
                    </Tag>
                  </div>
                </div>
                <div>
                  <Text className="text-gray-500 text-xs">Submitted</Text>
                  <div>
                    {selectedReport.submittedAt
                      ? new Date(selectedReport.submittedAt).toLocaleDateString()
                      : 'Not submitted'}
                  </div>
                </div>
                {selectedReport.approvedAt && (
                  <div>
                    <Text className="text-gray-500 text-xs">Approved</Text>
                    <div>{new Date(selectedReport.approvedAt).toLocaleDateString()}</div>
                  </div>
                )}
                {selectedReport.isOverdue && (
                  <div>
                    <Text className="text-gray-500 text-xs">Late Submission</Text>
                    <div><Tag color="warning">Yes</Tag></div>
                  </div>
                )}
              </div>
            </div>

            {selectedReport.reportFileUrl && (
              <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <iframe
                  src={selectedReport.reportFileUrl}
                  width="100%"
                  height="100%"
                  title="Report Preview"
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

MonthlyReportsSection.displayName = 'MonthlyReportsSection';

export default memo(MonthlyReportsSection);
