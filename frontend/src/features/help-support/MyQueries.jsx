import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
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
  Empty,
  message,
  Spin,
  Avatar,
  Tooltip,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  UserOutlined,
  MessageOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { helpSupportService, SUPPORT_CATEGORIES, TICKET_STATUS, TICKET_PRIORITY } from '../../services/helpSupport.service';
import { useAuth } from '../../hooks/useAuth';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const MyQueries = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Ticket detail drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Reply form
  const [replyForm] = Form.useForm();
  const [submittingReply, setSubmittingReply] = useState(false);

  // New ticket modal
  const [newTicketVisible, setNewTicketVisible] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketForm] = Form.useForm();

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await helpSupportService.getMyTickets();
      setTickets(data);
      setFilteredTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      message.error('Failed to load your tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets
  useEffect(() => {
    let filtered = [...tickets];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(search) ||
          ticket.ticketNumber.toLowerCase().includes(search) ||
          ticket.description.toLowerCase().includes(search)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter((ticket) => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchText, statusFilter, categoryFilter]);

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
      await helpSupportService.respondToTicket(selectedTicket.id, values.message);
      message.success('Reply sent successfully');
      replyForm.resetFields();
      // Refresh ticket details
      const updatedTicket = await helpSupportService.getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket);
      // Refresh ticket list
      fetchTickets();
    } catch (error) {
      console.error('Failed to send reply:', error);
      message.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Submit new ticket
  const handleSubmitTicket = async (values) => {
    setSubmittingTicket(true);
    try {
      await helpSupportService.createTicket({
        subject: values.subject,
        description: values.description,
        category: values.category,
        priority: values.priority || 'MEDIUM',
        attachments: [],
      });
      message.success('Ticket submitted successfully');
      setNewTicketVisible(false);
      ticketForm.resetFields();
      fetchTickets();
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      message.error('Failed to submit ticket');
    } finally {
      setSubmittingTicket(false);
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
      width: 150,
      render: (category) => (
        <Tag color={getCategoryInfo(category).color}>
          {getCategoryInfo(category).label}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => getPriorityTag(priority),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date) => (
        <Tooltip title={dayjs(date).format('DD MMM YYYY, HH:mm')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: 'Responses',
      dataIndex: 'responseCount',
      key: 'responseCount',
      width: 100,
      render: (count) => (
        <Badge count={count} showZero color="#1890ff">
          <MessageOutlined style={{ fontSize: 18 }} />
        </Badge>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
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
              <MessageOutlined /> My Support Tickets
            </Title>
            <Text type="secondary">Track and manage your support requests</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTickets}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setNewTicketVisible(true)}>
              New Ticket
            </Button>
          </Space>
        </div>
      </Card>

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
            placeholder="Filter by Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            {Object.values(TICKET_STATUS).map((status) => (
              <Select.Option key={status.value} value={status.value}>
                {status.label}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            allowClear
          >
            {Object.values(SUPPORT_CATEGORIES).map((cat) => (
              <Select.Option key={cat.value} value={cat.value}>
                {cat.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Tickets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredTickets}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tickets`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No tickets found"
              >
                <Button type="primary" onClick={() => setNewTicketVisible(true)}>
                  Submit Your First Ticket
                </Button>
              </Empty>
            ),
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
        width={600}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedTicket(null);
          replyForm.resetFields();
        }}
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
                <Text type="secondary">
                  <ClockCircleOutlined /> {dayjs(selectedTicket.createdAt).format('DD MMM YYYY, HH:mm')}
                </Text>
              </Space>
              <Paragraph>{selectedTicket.description}</Paragraph>
              {selectedTicket.assignedTo && (
                <Text type="secondary">
                  Assigned to: <strong>{selectedTicket.assignedTo.name}</strong>
                </Text>
              )}
            </Card>

            {/* Resolution (if resolved) */}
            {selectedTicket.resolution && (
              <Card size="small" style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Title level={5} style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined /> Resolution
                </Title>
                <Paragraph>{selectedTicket.resolution}</Paragraph>
              </Card>
            )}

            <Divider>Conversation</Divider>

            {/* Responses Timeline */}
            {selectedTicket.responses && selectedTicket.responses.length > 0 ? (
              <Timeline style={{ marginTop: 16 }}>
                {selectedTicket.responses
                  .filter(r => !r.isInternal)
                  .map((response) => (
                    <Timeline.Item
                      key={response.id}
                      dot={
                        <Avatar size="small" style={{ backgroundColor: response.responder?.id === user?.userId ? '#1890ff' : '#87d068' }}>
                          <UserOutlined />
                        </Avatar>
                      }
                    >
                      <Card size="small" style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text strong>
                            {response.responderName}
                            {response.responder?.id === user?.userId && <Tag style={{ marginLeft: 8 }}>You</Tag>}
                          </Text>
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
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No responses yet"
              />
            )}

            {/* Reply Form (only for open tickets) */}
            {!['RESOLVED', 'CLOSED'].includes(selectedTicket.status) && (
              <>
                <Divider>Reply</Divider>
                <Form form={replyForm} onFinish={handleSubmitReply}>
                  <Form.Item
                    name="message"
                    rules={[{ required: true, message: 'Please enter your reply' }]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Type your reply here..."
                    />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SendOutlined />}
                      loading={submittingReply}
                    >
                      Send Reply
                    </Button>
                  </Form.Item>
                </Form>
              </>
            )}
          </div>
        ) : null}
      </Drawer>

      {/* New Ticket Modal */}
      <Modal
        title={<><PlusOutlined /> Submit New Ticket</>}
        open={newTicketVisible}
        onCancel={() => {
          setNewTicketVisible(false);
          ticketForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={ticketForm}
          layout="vertical"
          onFinish={handleSubmitTicket}
        >
          <Form.Item
            name="subject"
            label="Subject"
            rules={[
              { required: true, message: 'Please enter a subject' },
              { min: 5, message: 'Subject must be at least 5 characters' },
            ]}
          >
            <Input placeholder="Brief description of your issue" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              {Object.values(SUPPORT_CATEGORIES).map((cat) => (
                <Select.Option key={cat.value} value={cat.value}>
                  {cat.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="MEDIUM"
          >
            <Select>
              {Object.values(TICKET_PRIORITY).map((p) => (
                <Select.Option key={p.value} value={p.value}>
                  <Tag color={p.color}>{p.label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: 'Please describe your issue' },
              { min: 20, message: 'Description must be at least 20 characters' },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="Please describe your issue in detail..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setNewTicketVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={submittingTicket}>
                Submit Ticket
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyQueries;
