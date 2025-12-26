import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Descriptions,
  Tag,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Spin,
  Empty,
  Timeline,
  Card,
  Space,
  Divider,
  Avatar,
  Typography,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  BankOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const StudentDetailsModal = ({
  visible,
  student,
  onClose,
  onScheduleVisit,
  onRefresh,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm] = Form.useForm();
  const [visitForm] = Form.useForm();
  const [visitModalVisible, setVisitModalVisible] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setActiveTab('overview');
      setIsEditing(false);
    }
  }, [visible]);

  // Helper to get nested data
  const getStudentData = () => {
    if (!student) return null;
    return student.student || student;
  };

  const getInternshipApp = () => {
    const s = getStudentData();
    return s?.internshipApplications?.[0] ||
           student?.internshipApplications?.[0] ||
           student?.activeInternship ||
           null;
  };

  const studentData = getStudentData();
  const internshipApp = getInternshipApp();

  // Get visits from nested structure
  const visits = internshipApp?.facultyVisitLogs ||
                 student?.visits ||
                 student?.visitLogs ||
                 [];

  // Get monthly reports from nested structure
  const monthlyReports = internshipApp?.monthlyReports ||
                         student?.monthlyReports ||
                         [];

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      APPROVED: 'green',
      VERIFIED: 'green',
      ACTIVE: 'green',
      PENDING: 'orange',
      SUBMITTED: 'blue',
      REJECTED: 'red',
      DRAFT: 'default',
    };
    return colors[status] || 'default';
  };

  // Handle visit form submission
  const handleVisitSubmit = async () => {
    try {
      const values = await visitForm.validateFields();
      const visitData = {
        ...values,
        applicationId: internshipApp?.id || student?.applicationId || student?.id,
        visitDate: values.visitDate.toISOString(),
      };

      if (onScheduleVisit) {
        await onScheduleVisit(visitData);
        message.success('Visit logged successfully');
        setVisitModalVisible(false);
        visitForm.resetFields();
        onRefresh?.();
      }
    } catch (err) {
      if (!err.errorFields) {
        message.error('Failed to create visit log');
      }
    }
  };

  // Open joining letter
  const handleViewJoiningLetter = () => {
    if (internshipApp?.joiningLetterUrl) {
      window.open(internshipApp.joiningLetterUrl, '_blank');
    } else {
      message.info('No joining letter available');
    }
  };

  // Tab items
  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div className="space-y-4">
          {/* Student Info Card */}
          <Card size="small" title="Student Information" className="border-border">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Name">
                <Text strong>{studentData?.name || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Roll Number">
                {studentData?.rollNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {studentData?.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {studentData?.phone || studentData?.mobileNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Branch">
                {studentData?.branchName || studentData?.branch?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="College">
                {studentData?.collegeName || studentData?.college?.name || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Internship Info Card */}
          <Card size="small" title="Internship Information" className="border-border">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Company">
                <Text strong>{internshipApp?.companyName || 'Not Assigned'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(internshipApp?.status)}>
                  {internshipApp?.status || 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {internshipApp?.startDate
                  ? dayjs(internshipApp.startDate).format('DD MMM YYYY')
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {internshipApp?.endDate
                  ? dayjs(internshipApp.endDate).format('DD MMM YYYY')
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {internshipApp?.location || internshipApp?.city || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Stipend">
                {internshipApp?.stipend ? `₹${internshipApp.stipend}` : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {/* Joining Letter */}
            <Divider className="my-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileTextOutlined />
                <Text>Joining Letter</Text>
              </div>
              {internshipApp?.joiningLetterUrl ? (
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={handleViewJoiningLetter}
                >
                  View
                </Button>
              ) : (
                <Tag>Not Uploaded</Tag>
              )}
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card size="small" className="text-center border-border">
              <div className="text-2xl font-bold text-primary">{visits.length}</div>
              <Text type="secondary" className="text-xs">Visits</Text>
            </Card>
            <Card size="small" className="text-center border-border">
              <div className="text-2xl font-bold text-success">{monthlyReports.length}</div>
              <Text type="secondary" className="text-xs">Reports</Text>
            </Card>
            <Card size="small" className="text-center border-border">
              <div className="text-2xl font-bold text-warning">
                {monthlyReports.filter(r => r.status === 'PENDING' || r.status === 'SUBMITTED').length}
              </div>
              <Text type="secondary" className="text-xs">Pending</Text>
            </Card>
          </div>
        </div>
      ),
    },
    {
      key: 'visits',
      label: `Visits (${visits.length})`,
      children: (
        <div>
          <div className="flex justify-end mb-4">
            <Button
              type="primary"
              icon={<EnvironmentOutlined />}
              onClick={() => setVisitModalVisible(true)}
            >
              Log New Visit
            </Button>
          </div>
          {visits.length > 0 ? (
            <Timeline
              items={visits.map((visit, idx) => ({
                key: idx,
                color: dayjs(visit.visitDate).isAfter(dayjs()) ? 'blue' : 'green',
                children: (
                  <div className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Text strong>
                          {dayjs(visit.visitDate).format('DD MMM YYYY, hh:mm A')}
                        </Text>
                        <Tag color={visit.visitType === 'PHYSICAL' ? 'green' : visit.visitType === 'VIRTUAL' ? 'blue' : 'orange'} className="ml-2">
                          {visit.visitType || 'PHYSICAL'}
                        </Tag>
                      </div>
                    </div>
                    {visit.visitLocation && (
                      <div className="text-text-secondary text-sm mt-1">
                        <EnvironmentOutlined className="mr-1" />
                        {visit.visitLocation}
                      </div>
                    )}
                    {visit.notes && (
                      <div className="text-text-secondary text-sm mt-1">
                        {visit.notes}
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="No visits recorded yet" />
          )}
        </div>
      ),
    },
    {
      key: 'reports',
      label: `Reports (${monthlyReports.length})`,
      children: (
        <div>
          {monthlyReports.length > 0 ? (
            <div className="space-y-3">
              {monthlyReports.map((report, idx) => (
                <Card key={report.id || idx} size="small" className="border-border">
                  <div className="flex justify-between items-center">
                    <div>
                      <Text strong>
                        {dayjs().month(report.reportMonth - 1).format('MMMM')} {report.reportYear}
                      </Text>
                      <Tag color={getStatusColor(report.status)} className="ml-2">
                        {report.status}
                      </Tag>
                    </div>
                    <Space>
                      {report.reportFileUrl && (
                        <Tooltip title="Download Report">
                          <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => window.open(report.reportFileUrl, '_blank')}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  </div>
                  {report.submittedAt && (
                    <Text type="secondary" className="text-xs">
                      Submitted: {dayjs(report.submittedAt).format('DD MMM YYYY')}
                    </Text>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="No monthly reports submitted yet" />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-3">
            <Avatar size={40} icon={<UserOutlined />} className="bg-primary" />
            <div>
              <Title level={5} className="m-0">
                {studentData?.name || 'Student Details'}
              </Title>
              <Text type="secondary" className="text-xs">
                {studentData?.rollNumber || ''}
              </Text>
            </div>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
          <Button
            key="visit"
            type="primary"
            icon={<EnvironmentOutlined />}
            onClick={() => setVisitModalVisible(true)}
          >
            Log Visit
          </Button>,
        ]}
        className="student-details-modal"
      >
        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </Spin>
      </Modal>

      {/* Quick Visit Log Modal */}
      <Modal
        title={`Log Visit - ${studentData?.name || ''}`}
        open={visitModalVisible}
        onOk={handleVisitSubmit}
        onCancel={() => {
          setVisitModalVisible(false);
          visitForm.resetFields();
        }}
        okText="Create Visit Log"
        width={500}
      >
        <Form form={visitForm} layout="vertical" className="mt-4">
          <Form.Item
            name="visitDate"
            label="Visit Date"
            rules={[{ required: true, message: 'Please select a date' }]}
            initialValue={dayjs()}
          >
            <DatePicker className="w-full" showTime />
          </Form.Item>

          <Form.Item
            name="visitType"
            label="Visit Type"
            rules={[{ required: true, message: 'Please select visit type' }]}
          >
            <Select placeholder="Select visit type">
              <Option value="PHYSICAL">Physical Visit</Option>
              <Option value="VIRTUAL">Virtual Visit</Option>
              <Option value="PHONE">Phone Call</Option>
            </Select>
          </Form.Item>

          <Form.Item name="visitLocation" label="Visit Location">
            <Input placeholder="Enter visit location" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Add any notes about this visit" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StudentDetailsModal;
