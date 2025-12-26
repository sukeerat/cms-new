import React, { memo, useState } from 'react';
import { Card, Button, Typography, Tabs, Statistic, Row, Col, Tag, Upload, Modal, message, Space, Tooltip, Avatar, Progress } from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  LoadingOutlined,
  BankOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { hasInternshipStarted } from '../utils/applicationUtils';
import {
  ApplicationDetailsTab,
  ApplicationTimelineTab,
  ApplicationProgressTab,
} from './tabs';
import FacultyVisitsSection from './FacultyVisitsSection';
import studentService from '../../../../services/student.service';
import { getFileUrl } from '../../../../utils/imageUtils';

const { Title, Text } = Typography;

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
  onRefresh,
}) => {
  // Joining letter management state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  if (!application) return null;

  const isSelfIdentified = application.isSelfIdentified || !application.internship;
  const internship = application.internship;
  const industry = internship?.industry || {};
  const internshipStarted = hasInternshipStarted(application);

  // Company info
  const company = isSelfIdentified
    ? { companyName: application.companyName, city: application.companyAddress?.split(',')[0] }
    : industry;

  // Check joining letter status
  const hasJoiningLetter = !!(application?.joiningLetterUrl || application?.joiningLetter);
  const joiningLetterUrl = application?.joiningLetterUrl || application?.joiningLetter;

  // Calculate progress
  const startDate = application.joiningDate || application.startDate || internship?.startDate;
  const endDate = application.endDate || internship?.endDate;
  const totalDays = endDate && startDate ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;
  const daysCompleted = startDate ? Math.max(0, dayjs().diff(dayjs(startDate), 'day')) : 0;
  const progressPercent = totalDays > 0 ? Math.min(Math.round((daysCompleted / totalDays) * 100), 100) : 0;

  // Handle file selection for joining letter
  const handleFileSelect = (file) => {
    const isPdf = file.type === 'application/pdf';
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isPdf) {
      message.error('Only PDF files are allowed');
      return false;
    }

    if (!isLt5M) {
      message.error('File must be smaller than 5MB');
      return false;
    }

    setSelectedFile(file);
    return false;
  };

  // Handle joining letter upload
  const handleUploadJoiningLetter = async () => {
    if (!selectedFile) {
      message.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      await studentService.uploadJoiningLetter(application.id, selectedFile);
      message.success('Joining letter uploaded successfully');
      setUploadModalVisible(false);
      setSelectedFile(null);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to upload joining letter');
    } finally {
      setUploading(false);
    }
  };

  // Handle joining letter delete
  const handleDeleteJoiningLetter = async () => {
    try {
      setUploading(true);
      await studentService.deleteJoiningLetter(application.id);
      message.success('Joining letter deleted successfully');
      setDeleteConfirmVisible(false);

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete joining letter');
    } finally {
      setUploading(false);
    }
  };

  // Handle view joining letter
  const handleViewJoiningLetter = () => {
    if (joiningLetterUrl) {
      const url = getFileUrl(joiningLetterUrl);
      window.open(url, '_blank');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      APPLIED: 'blue',
      SHORTLISTED: 'orange',
      SELECTED: 'green',
      APPROVED: 'green',
      JOINED: 'purple',
      COMPLETED: 'cyan',
      REJECTED: 'red',
      WITHDRAWN: 'default',
    };
    return colors[status] || 'default';
  };

  // Tab items for Ant Design 5
  const tabItems = [
    {
      key: 'details',
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          Details
        </span>
      ),
      children: (
        <ApplicationDetailsTab
          application={application}
          isSelfIdentified={isSelfIdentified}
          internship={internship}
          industry={industry}
          onApplicationUpdate={onRefresh}
        />
      ),
    },
    {
      key: 'timeline',
      label: (
        <span className="flex items-center gap-2">
          <ClockCircleOutlined />
          Timeline
        </span>
      ),
      children: <ApplicationTimelineTab application={application} />,
    },
    {
      key: 'reports',
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          Reports
          {monthlyReportsProgress?.pending > 0 && (
            <Tag color="orange" className="ml-1">{monthlyReportsProgress.pending}</Tag>
          )}
        </span>
      ),
      children: (
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
      ),
    },
    {
      key: 'visits',
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          Faculty Visits
        </span>
      ),
      children: (
        <FacultyVisitsSection
          application={application}
          visits={facultyVisits}
          progress={facultyVisitsProgress}
          loading={facultyVisitsLoading}
          hasStarted={internshipStarted}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          size="large"
          className="rounded-xl"
        >
          Back to Applications
        </Button>
      </div>

      {/* Company Header Card */}
      <Card className="rounded-2xl border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              size={64}
              icon={<BankOutlined />}
              src={industry?.logo}
              className="bg-blue-50 text-blue-500"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Title level={3} className="m-0">
                  {company.companyName || 'Company'}
                </Title>
                {isSelfIdentified && (
                  <Tag color="purple">Self-Identified</Tag>
                )}
              </div>
              <Text className="text-gray-500">
                {application.jobProfile || internship?.title || 'Internship'}
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tag color={getStatusColor(application.status)} className="text-sm px-3 py-1 rounded-lg">
              {application.status?.replace(/_/g, ' ')}
            </Tag>
          </div>
        </div>

        {/* Progress Bar */}
        {internshipStarted && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <Text className="text-sm font-medium">Internship Progress</Text>
              <Text className="text-sm font-bold text-blue-600">{progressPercent}%</Text>
            </div>
            <Progress
              percent={progressPercent}
              showInfo={false}
              strokeColor={{ '0%': '#3b82f6', '100%': '#10b981' }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{startDate ? dayjs(startDate).format('MMM DD, YYYY') : 'N/A'}</span>
              <span>{daysCompleted} days completed</span>
              <span>{endDate ? dayjs(endDate).format('MMM DD, YYYY') : 'N/A'}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-gray-200 text-center h-full">
            <Statistic
              title={<span className="text-gray-500 text-xs">Reports</span>}
              value={monthlyReportsProgress?.approved || 0}
              suffix={`/ ${monthlyReportsProgress?.total || 0}`}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: monthlyReportsProgress?.percentage === 100 ? '#10b981' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-gray-200 text-center h-full">
            <Statistic
              title={<span className="text-gray-500 text-xs">Faculty Visits</span>}
              value={facultyVisitsProgress?.completed || 0}
              suffix={`/ ${facultyVisitsProgress?.total || 0}`}
              prefix={<TeamOutlined className="text-purple-500" />}
              valueStyle={{ color: facultyVisitsProgress?.percentage === 100 ? '#10b981' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-gray-200 text-center h-full">
            <Statistic
              title={<span className="text-gray-500 text-xs">Overall Progress</span>}
              value={monthlyReportsProgress?.percentage || 0}
              suffix="%"
              prefix={<CalendarOutlined className="text-green-500" />}
              valueStyle={{ color: monthlyReportsProgress?.percentage === 100 ? '#10b981' : '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="rounded-xl border border-gray-200 text-center h-full">
            {isSelfIdentified ? (
              <div>
                <Text className="text-gray-500 text-xs block mb-1">Joining Letter</Text>
                {hasJoiningLetter ? (
                  <Tag color="success" icon={<CheckCircleOutlined />} className="mt-1">
                    Uploaded
                  </Tag>
                ) : (
                  <Tag color="warning" icon={<ExclamationCircleOutlined />} className="mt-1">
                    Required
                  </Tag>
                )}
              </div>
            ) : (
              <Statistic
                title={<span className="text-gray-500 text-xs">Days Left</span>}
                value={totalDays > daysCompleted ? totalDays - daysCompleted : 0}
                prefix={<ClockCircleOutlined className="text-orange-500" />}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Joining Letter Card - For Self-Identified Internships */}
      {isSelfIdentified && (
        <Card className="rounded-2xl border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                hasJoiningLetter ? 'bg-green-100' : 'bg-orange-100'
              }`}>
                <FileTextOutlined className={`text-xl ${
                  hasJoiningLetter ? 'text-green-600' : 'text-orange-600'
                }`} />
              </div>
              <div>
                <Title level={5} className="m-0">Joining Letter</Title>
                <Text className={`text-sm ${hasJoiningLetter ? 'text-green-600' : 'text-orange-600'}`}>
                  {hasJoiningLetter ? 'Document uploaded successfully' : 'Upload required for verification'}
                </Text>
              </div>
            </div>

            {hasJoiningLetter && (
              <Tag color="success" icon={<CheckCircleOutlined />}>
                Uploaded
              </Tag>
            )}
          </div>

          <div className="mt-4">
            {hasJoiningLetter ? (
              <Space wrap>
                <Button icon={<EyeOutlined />} onClick={handleViewJoiningLetter}>
                  View Document
                </Button>
                <Button icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
                  Replace
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteConfirmVisible(true)}>
                  Delete
                </Button>
              </Space>
            ) : (
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
                size="large"
              >
                Upload Joining Letter
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Card className="rounded-2xl border border-gray-200">
        <Tabs
          defaultActiveKey="details"
          items={tabItems}
          size="large"
          className="application-details-tabs"
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CloudUploadOutlined className="text-blue-500" />
            <span>{hasJoiningLetter ? 'Replace' : 'Upload'} Joining Letter</span>
          </div>
        }
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          setSelectedFile(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => { setUploadModalVisible(false); setSelectedFile(null); }}>
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={uploading}
            disabled={!selectedFile}
            onClick={handleUploadJoiningLetter}
            icon={uploading ? <LoadingOutlined /> : <UploadOutlined />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>,
        ]}
      >
        <Upload.Dragger
          accept=".pdf"
          maxCount={1}
          beforeUpload={handleFileSelect}
          onRemove={() => setSelectedFile(null)}
          fileList={selectedFile ? [{ uid: '-1', name: selectedFile.name, status: 'done' }] : []}
        >
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined className="text-4xl text-blue-500" />
          </p>
          <p className="ant-upload-text">Click or drag file to upload</p>
          <p className="ant-upload-hint">PDF only, max 5MB</p>
        </Upload.Dragger>

        {hasJoiningLetter && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Text className="text-yellow-700 text-sm">
              <ExclamationCircleOutlined className="mr-2" />
              Uploading a new file will replace the existing document.
            </Text>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        title={<span className="text-red-500"><DeleteOutlined /> Delete Joining Letter</span>}
        open={deleteConfirmVisible}
        onCancel={() => setDeleteConfirmVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteConfirmVisible(false)}>Cancel</Button>,
          <Button key="delete" danger loading={uploading} onClick={handleDeleteJoiningLetter}>Delete</Button>,
        ]}
      >
        <p>Are you sure you want to delete the joining letter?</p>
        <p className="text-red-500 text-sm">This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

ApplicationDetailsView.displayName = 'ApplicationDetailsView';

export default memo(ApplicationDetailsView);
