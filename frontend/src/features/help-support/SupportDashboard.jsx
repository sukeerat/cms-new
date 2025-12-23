import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Typography,
  Drawer,
  Timeline,
  Divider,
  Statistic,
  message,
  Spin,
  Avatar,
  Tooltip,
  Badge,
  DatePicker,
  Popconfirm,
  Tabs,
  Checkbox,
} from 'antd';
import {
  SearchOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  MessageOutlined,
  ReloadOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  SolutionOutlined,
  AlertOutlined,
  InboxOutlined,
  CheckSquareOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { helpSupportService, SUPPORT_CATEGORIES, TICKET_STATUS, TICKET_PRIORITY } from '../../services/helpSupport.service';
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const SupportDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [assignableUsers, setAssignableUsers] = useState([]);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // Ticket detail drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Forms
  const [replyForm] = Form.useForm();
  const [submittingReply, setSubmittingReply] = useState(false);

  // Modals
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [assignForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (categoryFilter) filters.category = categoryFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (dateRange && dateRange[0]) filters.fromDate = dateRange[0].toISOString();
      if (dateRange && dateRange[1]) filters.toDate = dateRange[1].toISOString();

      const [ticketsData, statsData, usersData] = await Promise.all([
        helpSupportService.getAllTickets(filters),
        helpSupportService.getTicketStatistics(),
        helpSupportService.getAssignableUsers(),
      ]);

      setTickets(ticketsData);
      setStatistics(statsData);
      setAssignableUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to load support data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, priorityFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter tickets by search
  const filteredTickets = tickets.filter((ticket) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(search) ||
      ticket.ticketNumber.toLowerCase().includes(search) ||
      ticket.submitterName?.toLowerCase().includes(search) ||
      ticket.description.toLowerCase().includes(search)
    );
  });

  // View ticket details
  const handleViewTicket = async (ticketId) => {
    setLoadingTicket(true);
    setDrawerVisible(true);
    try {
      const ticket = await helpSupportService.getTicketById(ticketId);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      message.error('Failed to load ticket details');
    } finally {
      setLoadingTicket(false);
    }
  };

  // Submit reply
  const handleSubmitReply = async (values) => {
    if (!selectedTicket) return;

    setSubmittingReply(true);
    try {
      await helpSupportService.respondToTicket(
        selectedTicket.id,
        values.message,
        [],
        values.isInternal || false
      );
      message.success('Reply sent successfully');
      replyForm.resetFields();
      const updatedTicket = await helpSupportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      fetchData();
    } catch (error) {
      console.error('Failed to send reply:', error);
      message.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Assign ticket
  const handleAssignTicket = async (values) => {
    if (!selectedTicket) return;

    setSubmittingAction(true);
    try {
      await helpSupportService.assignTicket(selectedTicket.id, values.assigneeId, values.remarks);
      message.success('Ticket assigned successfully');
      setAssignModalVisible(false);
      assignForm.resetFields();
      const updatedTicket = await helpSupportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      fetchData();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      message.error('Failed to assign ticket');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Resolve ticket
  const handleResolveTicket = async (values) => {
    if (!selectedTicket) return;

    setSubmittingAction(true);
    try {
      await helpSupportService.resolveTicket(selectedTicket.id, values.resolution, values.remarks);
      message.success('Ticket resolved successfully');
      setResolveModalVisible(false);
      resolveForm.resetFields();
      const updatedTicket = await helpSupportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      fetchData();
    } catch (error) {
      console.error('Failed to resolve ticket:', error);
      message.error('Failed to resolve ticket');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Close ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      await helpSupportService.closeTicket(selectedTicket.id);
      message.success('Ticket closed successfully');
      const updatedTicket = await helpSupportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      fetchData();
    } catch (error) {
      console.error('Failed to close ticket:', error);
      message.error('Failed to close ticket');
    }
  };

  // Update status
  const handleUpdateStatus = async (status) => {
    if (!selectedTicket) return;

    try {
      await helpSupportService.updateTicketStatus(selectedTicket.id, status);
      message.success('Status updated successfully');
      const updatedTicket = await helpSupportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      message.error('Failed to update status');
    }
  };

  // Get status tag
  const getStatusTag = (status) => {
    const statusInfo = TICKET_STATUS[status] || { label: status, color: 'default' };
    return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
  };

  // Get priority tag
  const getPriorityTag = (priority) => {
    const priorityInfo = TICKET_PRIORITY[priority] || { label: priority, color: 'default' };
    return <Tag color={priorityInfo.color}>{priorityInfo.label}</Tag>;
  };

  // Get category info
  const getCategoryInfo = (category) => {
    return SUPPORT_CATEGORIES[category] || { label: category, color: 'default' };
  };

  // Table columns
  const columns = [
    {
      title: 'Ticket #',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 150,
      render: (text) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
      sorter: (a, b) => a.ticketNumber.localeCompare(b.ticketNumber),
    },
    {
      title: 'Submitter',
      key: 'submitter',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <Text strong style={{ display: 'block', lineHeight: 1.2 }}>{record.submitterName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.submitterRole}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category) => (
        <Tag color={getCategoryInfo(category).color}>
          {getCategoryInfo(category).label}
        </Tag>
      ),
      filters: Object.values(SUPPORT_CATEGORIES).map(c => ({ text: c.label, value: c.value })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => getPriorityTag(priority),
      filters: Object.values(TICKET_PRIORITY).map(p => ({ text: p.label, value: p.value })),
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
      filters: Object.values(TICKET_STATUS).map(s => ({ text: s.label, value: s.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      width: 130,
      render: (assignee) => assignee ? (
        <Text>{assignee.name}</Text>
      ) : (
        <Tag color="warning">Unassigned</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewTicket(record.id)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <SolutionOutlined /> Support Dashboard
            </Title>
            <Text type="secondary">Manage all support tickets from users</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              <Statistic
                title="Total Tickets"
                value={statistics.total}
                prefix={<InboxOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              <Statistic
                title="Open"
                value={statistics.byStatus?.open || 0}
                prefix={<FolderOpenOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              <Statistic
                title="In Progress"
                value={statistics.byStatus?.inProgress || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              <Statistic
                title="Resolved"
                value={statistics.byStatus?.resolved || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              <Statistic
                title="Unassigned"
                value={statistics.summary?.unassigned || 0}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8} md={6} lg={4}>
            <Card>
              <Statistic
                title="This Week"
                value={statistics.summary?.recentWeek || 0}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap style={{ width: '100%' }}>
          <Input
            placeholder="Search tickets..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            allowClear
          >
            {Object.values(TICKET_STATUS).map((status) => (
              <Select.Option key={status.value} value={status.value}>
                {status.label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 160 }}
            allowClear
          >
            {Object.values(SUPPORT_CATEGORIES).map((cat) => (
              <Select.Option key={cat.value} value={cat.value}>
                {cat.label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Priority"
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 120 }}
            allowClear
          >
            {Object.values(TICKET_PRIORITY).map((p) => (
              <Select.Option key={p.value} value={p.value}>
                {p.label}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 250 }}
          />
          <Button
            onClick={() => {
              setSearchText('');
              setStatusFilter(null);
              setCategoryFilter(null);
              setPriorityFilter(null);
              setDateRange(null);
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Tickets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tickets`,
          }}
        />
      </Card>

      {/* Ticket Detail Drawer */}
      <Drawer
        title={
          selectedTicket ? (
            <Space>
              <Text strong>{selectedTicket.ticketNumber}</Text>
              {getStatusTag(selectedTicket.status)}
            </Space>
          ) : 'Ticket Details'
        }
        width={700}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedTicket(null);
          replyForm.resetFields();
        }}
        extra={
          selectedTicket && !['CLOSED'].includes(selectedTicket.status) && (
            <Space>
              <Button onClick={() => setAssignModalVisible(true)}>
                <TeamOutlined /> Assign
              </Button>
              {!['RESOLVED', 'CLOSED'].includes(selectedTicket.status) && (
                <Button type="primary" onClick={() => setResolveModalVisible(true)}>
                  <CheckCircleOutlined /> Resolve
                </Button>
              )}
              {selectedTicket.status === 'RESOLVED' && (
                <Popconfirm title="Close this ticket?" onConfirm={handleCloseTicket}>
                  <Button><CloseCircleOutlined /> Close</Button>
                </Popconfirm>
              )}
            </Space>
          )
        }
      >
        {loadingTicket ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin tip="Loading ticket..." />
          </div>
        ) : selectedTicket ? (
          <div>
            {/* Ticket Info */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5}>{selectedTicket.subject}</Title>
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color={getCategoryInfo(selectedTicket.category).color}>
                  {getCategoryInfo(selectedTicket.category).label}
                </Tag>
                {getPriorityTag(selectedTicket.priority)}
              </Space>
              <Paragraph>{selectedTicket.description}</Paragraph>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Submitted by:</Text>
                  <div>
                    <Text strong>{selectedTicket.submitterName}</Text>
                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                      {selectedTicket.submitterEmail}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Created:</Text>
                  <div>
                    <Text>{dayjs(selectedTicket.createdAt).format('DD MMM YYYY, HH:mm')}</Text>
                  </div>
                </Col>
              </Row>

              {selectedTicket.assignedTo && (
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary">Assigned to: </Text>
                  <Text strong>{selectedTicket.assignedTo.name}</Text>
                </div>
              )}
            </Card>

            {/* Status Update */}
            {!['RESOLVED', 'CLOSED'].includes(selectedTicket.status) && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Text strong>Quick Status Update:</Text>
                <Space style={{ marginTop: 8 }}>
                  {selectedTicket.status !== 'IN_PROGRESS' && (
                    <Button size="small" onClick={() => handleUpdateStatus('IN_PROGRESS')}>
                      Mark In Progress
                    </Button>
                  )}
                  {selectedTicket.status !== 'PENDING_USER' && (
                    <Button size="small" onClick={() => handleUpdateStatus('PENDING_USER')}>
                      Pending User Response
                    </Button>
                  )}
                </Space>
              </Card>
            )}

            {/* Resolution */}
            {selectedTicket.resolution && (
              <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Title level={5} style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined /> Resolution
                </Title>
                <Paragraph>{selectedTicket.resolution}</Paragraph>
              </Card>
            )}

            <Divider>Conversation</Divider>

            {/* Responses */}
            {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
              <Timeline style={{ marginTop: 16 }}>
                {selectedTicket.responses.map((response) => (
                  <Timeline.Item
                    key={response.id}
                    dot={
                      <Avatar
                        size="small"
                        style={{
                          backgroundColor: response.isInternal
                            ? '#faad14'
                            : response.responder?.id === user?.userId
                            ? '#1890ff'
                            : '#87d068'
                        }}
                      >
                        <UserOutlined />
                      </Avatar>
                    }
                  >
                    <Card
                      size="small"
                      style={{
                        marginBottom: 8,
                        background: response.isInternal ? '#fffbe6' : undefined,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Space>
                          <Text strong>{response.responderName}</Text>
                          <Tag>{response.responderRole}</Tag>
                          {response.isInternal && <Tag color="warning">Internal Note</Tag>}
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(response.createdAt).fromNow()}
                        </Text>
                      </div>
                      <Paragraph style={{ marginBottom: 0 }}>{response.message}</Paragraph>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Text type="secondary">No responses yet</Text>
            )}

            {/* Reply Form */}
            {!['CLOSED'].includes(selectedTicket.status) && (
              <>
                <Divider>Add Response</Divider>
                <Form form={replyForm} onFinish={handleSubmitReply}>
                  <Form.Item
                    name="message"
                    rules={[{ required: true, message: 'Please enter your response' }]}
                  >
                    <TextArea rows={4} placeholder="Type your response..." />
                  </Form.Item>
                  <Form.Item name="isInternal" valuePropName="checked" style={{ marginBottom: 8 }}>
                    <Checkbox>Internal note (not visible to user)</Checkbox>
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submittingReply}>
                      Send Response
                    </Button>
                  </Form.Item>
                </Form>
              </>
            )}
          </div>
        ) : null}
      </Drawer>

      {/* Assign Modal */}
      <Modal
        title="Assign Ticket"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          assignForm.resetFields();
        }}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssignTicket}>
          <Form.Item
            name="assigneeId"
            label="Assign To"
            rules={[{ required: true, message: 'Please select an assignee' }]}
          >
            <Select placeholder="Select user">
              {assignableUsers.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="Remarks (Optional)">
            <TextArea rows={3} placeholder="Add any notes..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAssignModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submittingAction}>
                Assign
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        title="Resolve Ticket"
        open={resolveModalVisible}
        onCancel={() => {
          setResolveModalVisible(false);
          resolveForm.resetFields();
        }}
        footer={null}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolveTicket}>
          <Form.Item
            name="resolution"
            label="Resolution"
            rules={[{ required: true, message: 'Please provide resolution details' }]}
          >
            <TextArea rows={4} placeholder="Describe how the issue was resolved..." />
          </Form.Item>
          <Form.Item name="remarks" label="Additional Remarks (Optional)">
            <TextArea rows={2} placeholder="Any additional notes..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setResolveModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submittingAction}>
                Resolve Ticket
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportDashboard;
