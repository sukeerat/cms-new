import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Empty,
  Spin,
  Descriptions,
  Timeline,
  Alert,
  Divider,
  Row,
  Col,
  Badge,
  Steps,
  Tooltip,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  SendOutlined,
  AlertOutlined,
  CommentOutlined,
  UserOutlined,
  BankOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import API from "../../../services/api";
import toast from "react-hot-toast";
import grievanceService from "../../../services/grievance.service";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Escalation level labels
const ESCALATION_LEVELS = {
  MENTOR: { label: "Faculty Mentor", level: 1, icon: <UserOutlined /> },
  PRINCIPAL: { label: "Principal", level: 2, icon: <BankOutlined /> },
  STATE_DIRECTORATE: { label: "State Directorate", level: 3, icon: <TeamOutlined /> },
};

export default function StudentGrievance() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [escalationChain, setEscalationChain] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [internships, setInternships] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assignedMentor, setAssignedMentor] = useState(null);

  useEffect(() => {
    const loginData = localStorage.getItem("loginResponse");
    if (loginData) {
      try {
        const parsed = JSON.parse(loginData);
        setStudentId(parsed.user.studentId);
      } catch (e) {
        console.error("Failed to parse loginResponse:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (studentId) {
      fetchGrievances();
      fetchInternships();
      fetchAssignedMentor();
    }
  }, [studentId]);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const response = await grievanceService.getByStudentId(studentId);
      setGrievances(response || []);
    } catch (error) {
      console.error("Error fetching grievances:", error);
      toast.error("Failed to load grievances");
    } finally {
      setLoading(false);
    }
  };

  const fetchEscalationChain = async (grievanceId) => {
    try {
      const chain = await grievanceService.getEscalationChain(grievanceId);
      setEscalationChain(chain);
    } catch (error) {
      console.error("Error fetching escalation chain:", error);
    }
  };

  const fetchInternships = async () => {
    try {
      const response = await API.get(
        `/student/applications`,
        {
          params: { studentId },
        }
      );

      const applications = response.data?.data || response.data || [];

      const uniqueInternships = applications
        .filter((app) => app.internship)
        .map((app) => ({
          id: app.internship.id,
          title: app.internship.title,
          company: app.internship.industry?.companyName,
          industryId: app.internship.industry?.id,
        }));

      const uniqueIndustries = applications
        .filter((app) => app.internship?.industry)
        .map((app) => ({
          id: app.internship.industry.id,
          companyName: app.internship.industry.companyName,
        }))
        .filter(
          (industry, index, self) =>
            index === self.findIndex((i) => i.id === industry.id)
        );

      setInternships(uniqueInternships);
      setIndustries(uniqueIndustries);
    } catch (error) {
      console.error("Error fetching internships:", error);
    }
  };

  const fetchFacultyMembers = async () => {
    try {
      const loginData = localStorage.getItem("loginResponse");
      const parsed = JSON.parse(loginData);
      const institutionId = parsed.user.institutionId;

      const response = await API.get(`/institutions/${institutionId}`);
      const users = response.data.users || [];

      const faculty = users.filter(
        (user) => user.role === "TEACHER" || user.role === "FACULTY_SUPERVISOR"
      );

      setFacultyMembers(faculty);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    }
  };

  const fetchAssignableUsers = async () => {
    try {
      const loginData = localStorage.getItem("loginResponse");
      const parsed = JSON.parse(loginData);
      const institutionId = parsed.user.institutionId;

      const response = await grievanceService.getAssignableUsers(institutionId);
      setAssignableUsers(response || []);
    } catch (error) {
      console.error("Error fetching assignable users:", error);
    }
  };

  const fetchAssignedMentor = async () => {
    try {
      const response = await API.get(`/mentor/my-mentor`);
      const assignment = response.data?.data;

      if (assignment?.mentor) {
        setAssignedMentor(assignment.mentor);
      } else {
        setAssignedMentor(null);
      }
    } catch (error) {
      console.error("Error fetching assigned mentor:", error);
      setAssignedMentor(null);
    }
  };

  useEffect(() => {
    if (createModalVisible) {
      fetchFacultyMembers();
      fetchAssignableUsers();
    }
  }, [createModalVisible]);

  useEffect(() => {
    if (createModalVisible) {
      if (assignedMentor) {
        form.setFieldsValue({ assignedToId: assignedMentor.id, facultySupervisorId: assignedMentor.id });
      } else {
        form.setFieldsValue({ assignedToId: undefined, facultySupervisorId: undefined });
      }
    }
  }, [createModalVisible, assignedMentor, form]);

  const combinedAssignableUsers = useMemo(() => {
    if (!assignedMentor) {
      return assignableUsers;
    }

    const alreadyIncluded = assignableUsers.some(
      (user) => user.id === assignedMentor.id
    );

    return alreadyIncluded
      ? assignableUsers
      : [assignedMentor, ...assignableUsers];
  }, [assignedMentor, assignableUsers]);

  const handleOpenCreateModal = () => {
    if (!assignedMentor) {
      toast.error("Mentor not assigned yet. Please contact your institution.");
      return;
    }
    setCreateModalVisible(true);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      SUBMITTED: "blue",
      PENDING: "blue",
      UNDER_REVIEW: "orange",
      IN_PROGRESS: "processing",
      RESOLVED: "success",
      CLOSED: "default",
      ESCALATED: "red",
      REJECTED: "error",
    };
    return statusColors[status] || "default";
  };

  const getSeverityColor = (severity) => {
    const colors = {
      LOW: "green",
      MEDIUM: "orange",
      HIGH: "red",
      URGENT: "purple",
    };
    return colors[severity] || "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "RESOLVED":
      case "CLOSED":
        return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
      case "ESCALATED":
        return <RiseOutlined style={{ color: "#ff4d4f" }} />;
      case "REJECTED":
        return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
      case "IN_PROGRESS":
      case "UNDER_REVIEW":
        return <ClockCircleOutlined style={{ color: "#faad14" }} />;
      default:
        return <ExclamationCircleOutlined style={{ color: "#1890ff" }} />;
    }
  };

  const handleCreateGrievance = async (values) => {
    try {
      setSubmitting(true);

      const grievanceData = {
        ...values,
        submittedDate: new Date().toISOString(),
      };

      await grievanceService.submit(grievanceData);

      toast.success("Grievance submitted successfully");
      setCreateModalVisible(false);
      form.resetFields();
      fetchGrievances();
    } catch (error) {
      console.error("Error creating grievance:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit grievance"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = async (grievance) => {
    setSelectedGrievance(grievance);
    setDetailModalVisible(true);
    await fetchEscalationChain(grievance.id);
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => (
        <Tag color="blue">{category?.replace(/_/g, " ")}</Tag>
      ),
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severity) => (
        <Tag color={getSeverityColor(severity)}>{severity}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Badge
          status={
            status === "RESOLVED" || status === "CLOSED"
              ? "success"
              : status === "ESCALATED"
              ? "error"
              : status === "REJECTED"
              ? "error"
              : status === "IN_PROGRESS" || status === "UNDER_REVIEW"
              ? "processing"
              : "default"
          }
          text={status?.replace(/_/g, " ")}
        />
      ),
    },
    {
      title: "Escalation Level",
      dataIndex: "escalationLevel",
      key: "escalationLevel",
      render: (level) => {
        const levelInfo = ESCALATION_LEVELS[level] || {};
        return (
          <Tooltip title={`Level ${levelInfo.level || 1}: ${levelInfo.label || level}`}>
            <Tag color={level === "STATE_DIRECTORATE" ? "red" : level === "PRINCIPAL" ? "orange" : "blue"}>
              {levelInfo.icon} {levelInfo.label || level}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (assignedTo) => assignedTo ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{assignedTo.name}</Text>
        </Space>
      ) : (
        <Text type="secondary">Unassigned</Text>
      ),
    },
    {
      title: "Submitted",
      dataIndex: "submittedDate",
      key: "submittedDate",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => openDetailModal(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  // Render escalation chain steps
  const renderEscalationChain = () => {
    if (!escalationChain) return null;

    const { escalationChain: chain, currentLevel, canEscalate, nextLevel } = escalationChain;

    return (
      <Card size="small" title={
        <Space>
          <RiseOutlined />
          <span>Escalation Progress</span>
        </Space>
      } className="mb-4">
        <Steps
          size="small"
          current={ESCALATION_LEVELS[currentLevel]?.level - 1 || 0}
          items={chain?.map((item, index) => ({
            title: ESCALATION_LEVELS[item.level]?.label || item.level,
            description: item.isCurrentLevel ? "Current Level" : item.isPastLevel ? "Completed" : "Pending",
            icon: ESCALATION_LEVELS[item.level]?.icon,
            status: item.isCurrentLevel ? "process" : item.isPastLevel ? "finish" : "wait",
          })) || []}
        />
        {canEscalate && nextLevel && (
          <Alert
            type="info"
            className="mt-3"
            showIcon
            title={`If not resolved, this grievance can be escalated to ${ESCALATION_LEVELS[nextLevel]?.label || nextLevel}`}
          />
        )}
        {!canEscalate && (
          <Alert
            type="warning"
            className="mt-3"
            showIcon
            title="This grievance is at the highest escalation level"
          />
        )}
      </Card>
    );
  };

  // Render status history timeline
  const renderStatusHistory = () => {
    if (!selectedGrievance?.statusHistory || selectedGrievance.statusHistory.length === 0) {
      return null;
    }

    return (
      <Card size="small" title={
        <Space>
          <ClockCircleOutlined />
          <span>Status History</span>
        </Space>
      }>
        <Timeline
          mode="left"
          items={selectedGrievance.statusHistory.map((history, index) => ({
            color: history.action === "ESCALATED" ? "red" :
                   history.action === "RESOLVED" ? "green" :
                   history.action === "REJECTED" ? "red" : "blue",
            label: new Date(history.createdAt).toLocaleString(),
            children: (
              <div>
                <Text strong>
                  {history.action === "SUBMITTED" && "Grievance Submitted"}
                  {history.action === "ASSIGNED" && `Assigned to ${history.changedBy?.name || "staff"}`}
                  {history.action === "ESCALATED" && `Escalated to ${ESCALATION_LEVELS[history.escalationLevel]?.label || history.escalationLevel}`}
                  {history.action === "RESPONDED" && "Response Received"}
                  {history.action === "STATUS_CHANGED" && `Status: ${history.toStatus?.replace(/_/g, " ")}`}
                  {history.action === "REJECTED" && "Grievance Rejected"}
                </Text>
                {history.remarks && (
                  <Paragraph type="secondary" className="mt-1 mb-0">
                    {history.remarks}
                  </Paragraph>
                )}
                {history.changedBy && (
                  <Text type="secondary" className="text-xs">
                    By: {history.changedBy.name} ({history.changedBy.role?.replace(/_/g, " ")})
                  </Text>
                )}
              </div>
            ),
          }))}
        />
      </Card>
    );
  };

  return (
    <div className="h-full overflow-y-auto hide-scrollbar">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title level={2} className="!mb-1">
              My Grievances
            </Title>
            <Text type="secondary">
              Submit and track your internship-related concerns
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="medium"
            onClick={handleOpenCreateModal}
          >
            Submit New Grievance
          </Button>
        </div>

        {/* Info Alert */}
        <Alert
          title="Grievance Support"
          description={
            <div>
              <p>Submit any concerns or issues you face during your internship. Your grievance will be:</p>
              <ul className="mt-2 list-disc list-inside">
                <li>Initially assigned to your faculty mentor</li>
                <li>Escalated to Principal if not resolved</li>
                <li>Further escalated to State Directorate if needed</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          closable
        />

        {/* Grievances Table */}
        <Card className="border border-gray-200 shadow-sm !mt-3">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spin size="small" />
            </div>
          ) : (
            <Table
              dataSource={grievances}
              columns={columns}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} grievances`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    description="No grievances submitted yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  >
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenCreateModal}
                    >
                      Submit Your First Grievance
                    </Button>
                  </Empty>
                ),
              }}
            />
          )}
        </Card>

        {/* Create Grievance Modal */}
        <Modal
          title={
            <span>
              <FileTextOutlined className="mr-2" />
              Submit New Grievance
            </span>
          }
          open={createModalVisible}
          onCancel={() => {
            setCreateModalVisible(false);
            form.resetFields();
          }}
          footer={null}
          width={700}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateGrievance}
            className="mt-4"
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="title"
                  label="Grievance Title"
                  rules={[
                    { required: true, message: "Please enter a title" },
                    {
                      min: 10,
                      message: "Title must be at least 10 characters",
                    },
                  ]}
                >
                  <Input
                    placeholder="Brief summary of your concern"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[
                    { required: true, message: "Please select a category" },
                  ]}
                >
                  <Select placeholder="Select category" size="large">
                    <Option value="INTERNSHIP_RELATED">
                      Internship Related
                    </Option>
                    <Option value="MENTOR_RELATED">Mentor Related</Option>
                    <Option value="INDUSTRY_RELATED">Industry Related</Option>
                    <Option value="PAYMENT_ISSUE">Payment Issue</Option>
                    <Option value="WORKPLACE_HARASSMENT">
                      Workplace Harassment
                    </Option>
                    <Option value="WORK_CONDITION">Work Condition</Option>
                    <Option value="DOCUMENTATION">Documentation</Option>
                    <Option value="WORK_ENVIRONMENT">Work Environment</Option>
                    <Option value="HARASSMENT">Harassment</Option>
                    <Option value="SAFETY_CONCERN">Safety Concern</Option>
                    <Option value="DISCRIMINATION">Discrimination</Option>
                    <Option value="WORK_HOURS">Work Hours</Option>
                    <Option value="MENTORSHIP">Mentorship</Option>
                    <Option value="LEARNING_OPPORTUNITY">
                      Learning Opportunity
                    </Option>
                    <Option value="OTHER">Other</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="severity"
                  label="Severity"
                  rules={[
                    { required: true, message: "Please select severity" },
                  ]}
                >
                  <Select placeholder="Select severity" size="large">
                    <Option value="LOW">Low</Option>
                    <Option value="MEDIUM">Medium</Option>
                    <Option value="HIGH">High</Option>
                    <Option value="URGENT">Urgent</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12} className="!hidden">
                <Form.Item
                  name="facultySupervisorId"
                  label="Faculty Supervisor"
                >
                  <Select
                    placeholder="Select Faculty Supervisor"
                    size="large"
                    showSearch
                    disabled
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {combinedAssignableUsers.map((user) => (
                      <Option key={user.id} value={user.id}>
                        {user.name} - {(user.role || "").replace(/_/g, " ")}
                        {assignedMentor && user.id === assignedMentor.id
                          ? " (Assigned Mentor)"
                          : ""}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="assignedToId" label="Assign To">
                  <Select
                    placeholder="Select Principal or Faculty to assign"
                    size="large"
                    showSearch
                    disabled
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {combinedAssignableUsers.map((user) => (
                      <Option key={user.id} value={user.id}>
                        {user.name} - {(user.role || "").replace(/_/g, " ")}
                        {assignedMentor && user.id === assignedMentor.id
                          ? " (Assigned Mentor)"
                          : ""}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="preferredContactMethod"
                  label="Preferred Contact"
                >
                  <Select
                    placeholder="How should we contact you?"
                    size="large"
                  >
                    <Option value="EMAIL">Email</Option>
                    <Option value="PHONE">Phone</Option>
                    <Option value="IN_PERSON">In Person</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="description"
                  label="Detailed Description"
                  rules={[
                    {
                      required: true,
                      message: "Please describe your grievance",
                    },
                    {
                      min: 50,
                      message: "Description must be at least 50 characters",
                    },
                  ]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Provide detailed information about your concern..."
                  />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="actionRequested" label="Action Requested">
                  <TextArea
                    rows={3}
                    placeholder="What would you like to happen? (Optional)"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={submitting}
              >
                Submit Grievance
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title={
            <span>
              <FileTextOutlined className="mr-2" />
              Grievance Details
            </span>
          }
          open={detailModalVisible}
          onCancel={() => {
            setDetailModalVisible(false);
            setSelectedGrievance(null);
            setEscalationChain(null);
          }}
          footer={null}
          width={900}
        >
          {selectedGrievance && (
            <div className="space-y-4">
              {/* Status Banner */}
              <Alert
                title={
                  <span className="font-semibold">
                    Status: {selectedGrievance.status?.replace(/_/g, " ")}
                  </span>
                }
                description={
                  <div>
                    {selectedGrievance.status === "RESOLVED" &&
                      "Your grievance has been resolved."}
                    {selectedGrievance.status === "CLOSED" &&
                      "Your grievance has been closed."}
                    {selectedGrievance.status === "REJECTED" &&
                      "Your grievance has been reviewed and rejected."}
                    {selectedGrievance.status === "ESCALATED" &&
                      `Your grievance has been escalated to ${ESCALATION_LEVELS[selectedGrievance.escalationLevel]?.label || "higher authority"}.`}
                    {selectedGrievance.status === "IN_PROGRESS" &&
                      "We are actively working on your grievance."}
                    {selectedGrievance.status === "UNDER_REVIEW" &&
                      "Your grievance is being reviewed."}
                    {(selectedGrievance.status === "SUBMITTED" || selectedGrievance.status === "PENDING") &&
                      "Your grievance has been submitted and is pending review."}
                  </div>
                }
                type={
                  selectedGrievance.status === "RESOLVED" || selectedGrievance.status === "CLOSED"
                    ? "success"
                    : selectedGrievance.status === "ESCALATED" || selectedGrievance.status === "REJECTED"
                    ? "error"
                    : "info"
                }
                showIcon
                icon={getStatusIcon(selectedGrievance.status)}
              />

              {/* Escalation Chain */}
              {renderEscalationChain()}

              {/* Basic Information */}
              <Card size="small" title="Basic Information">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Title" span={2}>
                    <Text strong>{selectedGrievance.title}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Category">
                    <Tag color="blue">
                      {selectedGrievance.category?.replace(/_/g, " ")}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Severity">
                    <Tag color={getSeverityColor(selectedGrievance.severity)}>
                      {selectedGrievance.severity}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Escalation Level">
                    <Tag color={
                      selectedGrievance.escalationLevel === "STATE_DIRECTORATE" ? "red" :
                      selectedGrievance.escalationLevel === "PRINCIPAL" ? "orange" : "blue"
                    }>
                      {ESCALATION_LEVELS[selectedGrievance.escalationLevel]?.icon}{" "}
                      {ESCALATION_LEVELS[selectedGrievance.escalationLevel]?.label || selectedGrievance.escalationLevel}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Submitted Date">
                    {new Date(selectedGrievance.submittedDate).toLocaleString()}
                  </Descriptions.Item>
                  {selectedGrievance.resolvedDate && (
                    <Descriptions.Item label="Resolved Date">
                      {new Date(selectedGrievance.resolvedDate).toLocaleString()}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* Assigned To */}
              {selectedGrievance.assignedTo && (
                <Card size="small" title="Currently Assigned To">
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                      <Text strong>{selectedGrievance.assignedTo.name}</Text>
                      <br />
                      <Text type="secondary">
                        {selectedGrievance.assignedTo.role?.replace(/_/g, " ")}
                        {selectedGrievance.assignedTo.email && ` • ${selectedGrievance.assignedTo.email}`}
                      </Text>
                    </div>
                  </Space>
                </Card>
              )}

              {/* Description */}
              <Card size="small" title="Description">
                <Paragraph>{selectedGrievance.description}</Paragraph>
              </Card>

              {/* Action Requested */}
              {selectedGrievance.actionRequested && (
                <Card size="small" title="Action Requested">
                  <Paragraph>{selectedGrievance.actionRequested}</Paragraph>
                </Card>
              )}

              {/* Resolution */}
              {selectedGrievance.resolution && (
                <Card
                  size="small"
                  title={selectedGrievance.status === "REJECTED" ? "Rejection Reason" : "Resolution"}
                  className={selectedGrievance.status === "REJECTED" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}
                >
                  <Paragraph>{selectedGrievance.resolution}</Paragraph>
                </Card>
              )}

              {/* Status History */}
              {renderStatusHistory()}

              {/* Related Information */}
              {(selectedGrievance.internship ||
                selectedGrievance.industry ||
                selectedGrievance.facultySupervisor) && (
                <Card size="small" title="Related Information">
                  <Descriptions column={1} size="small">
                    {selectedGrievance.internship && (
                      <Descriptions.Item
                        label="Internship"
                      >
                        <BankOutlined className="mr-1" />
                        {selectedGrievance.internship.title}
                      </Descriptions.Item>
                    )}
                    {selectedGrievance.industry && (
                      <Descriptions.Item label="Company">
                        {selectedGrievance.industry.companyName}
                      </Descriptions.Item>
                    )}
                    {selectedGrievance.facultySupervisor && (
                      <Descriptions.Item label="Faculty Supervisor">
                        <Space>
                          <UserOutlined />
                          {selectedGrievance.facultySupervisor.name}
                        </Space>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
