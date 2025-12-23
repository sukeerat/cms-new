import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, Modal, message, Input, DatePicker, Descriptions, Drawer, Typography } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import { fetchVisitLogs, deleteVisitLog } from '../store/facultySlice';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const VisitLogList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { visitLogs } = useSelector((state) => state.faculty);
  const { list: visitLogsList = [], loading } = visitLogs || {};
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    dispatch(fetchVisitLogs());
  }, [dispatch]);

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Visit Log',
      content: 'Are you sure you want to delete this visit log? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await dispatch(deleteVisitLog(id)).unwrap();
          message.success('Visit log deleted successfully');
        } catch (error) {
          message.error(error?.message || 'Failed to delete visit log');
        }
      },
    });
  };

  const filteredLogs = visitLogsList?.filter(log => {
    const matchesSearch = !searchText ||
      log.student?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      log.company?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      log.purpose?.toLowerCase().includes(searchText.toLowerCase());

    const matchesDate = !dateRange || (
      dayjs(log.visitDate).isAfter(dateRange[0]) &&
      dayjs(log.visitDate).isBefore(dateRange[1])
    );

    return matchesSearch && matchesDate;
  }) || [];

  const columns = [
    {
      title: 'Visit Date',
      dataIndex: 'visitDate',
      key: 'visitDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.visitDate).unix() - dayjs(b.visitDate).unix(),
    },
    {
      title: 'Student',
      dataIndex: ['student', 'name'],
      key: 'student',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-text-secondary text-xs">{record.student?.rollNumber}</div>
        </div>
      ),
    },
    {
      title: 'Company',
      dataIndex: ['company', 'name'],
      key: 'company',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Scheduled', value: 'scheduled' },
        { text: 'Completed', value: 'completed' },
        { text: 'Cancelled', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLog(record);
              setDetailDrawer(true);
            }}
            size="small"
          >
            View
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/visit-logs/${record.id}/edit`)}
            size="small"
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-background-secondary min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-primary shadow-sm mr-3">
              <CalendarOutlined className="text-lg" />
            </div>
            <div>
              <Title level={2} className="mb-0 text-text-primary text-2xl">
                Visit Logs
              </Title>
              <Paragraph className="text-text-secondary text-sm mb-0">
                Track and manage industrial visits for assigned students
              </Paragraph>
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/visit-logs/new')}
            className="h-10 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            Add Visit Log
          </Button>
        </div>

        {/* Filters */}
        <Card className="rounded-xl border-border shadow-sm" styles={{ body: { padding: '16px' } }}>
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Search by student, company..."
              prefix={<SearchOutlined className="text-text-tertiary" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-md rounded-lg h-10 bg-background border-border"
              allowClear
            />
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
              placeholder={['Start Date', 'End Date']}
              className="rounded-lg h-10 border-border"
            />
          </div>
        </Card>

        {/* Table Container */}
        <Card className="rounded-2xl border-border shadow-sm overflow-hidden" styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={filteredLogs}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              className: "px-6 py-4",
              showTotal: (total) => `Total ${total} visit logs`,
            }}
            size="middle"
            className="custom-table"
          />
        </Card>
      </div>

      {/* Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <EyeOutlined className="text-primary" />
            </div>
            <span className="font-bold text-text-primary">Visit Log Details</span>
          </div>
        }
        placement="right"
        width={600}
        onClose={() => {
          setDetailDrawer(false);
          setSelectedLog(null);
        }}
        open={detailDrawer}
        styles={{ mask: { backdropFilter: 'blur(4px)' } }}
        className="rounded-l-2xl overflow-hidden"
      >
        {selectedLog && (
          <div className="space-y-8">
            <div className="bg-surface rounded-xl border border-border p-4 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <CalendarOutlined className="text-primary" />
                <span className="font-bold text-text-primary">{dayjs(selectedLog.visitDate).format('MMMM DD, YYYY')}</span>
              </div>
              <Tag 
                color={selectedLog.status === 'completed' ? 'success' : 'processing'}
                className="rounded-full px-3 font-bold uppercase tracking-widest text-[10px] border-0"
              >
                {selectedLog.status}
              </Tag>
            </div>

            <section>
              <Title level={5} className="!mb-4 text-xs uppercase tracking-widest text-text-tertiary font-bold">Student Information</Title>
              <div className="bg-background-tertiary/30 rounded-xl border border-border overflow-hidden">
                <Descriptions column={1} size="small" bordered className="custom-descriptions">
                  <Descriptions.Item label={<span className="text-text-tertiary font-medium">Name</span>}>
                    <Text strong className="text-text-primary">{selectedLog.student?.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="text-text-tertiary font-medium">Roll Number</span>}>
                    {selectedLog.student?.rollNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="text-text-tertiary font-medium">Email</span>}>
                    {selectedLog.student?.email}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </section>

            <section>
              <Title level={5} className="!mb-4 text-xs uppercase tracking-widest text-text-tertiary font-bold">Company Information</Title>
              <div className="bg-background-tertiary/30 rounded-xl border border-border overflow-hidden">
                <Descriptions column={1} size="small" bordered className="custom-descriptions">
                  <Descriptions.Item label={<span className="text-text-tertiary font-medium">Company</span>}>
                    <Text strong className="text-text-primary">{selectedLog.company?.name || 'N/A'}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label={<span className="text-text-tertiary font-medium">Contact Person</span>}>
                    {selectedLog.contactPerson || 'N/A'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            </section>

            <section>
              <Title level={5} className="!mb-4 text-xs uppercase tracking-widest text-text-tertiary font-bold">Visit Findings</Title>
              <div className="space-y-4">
                <div className="bg-surface p-4 rounded-xl border border-border">
                  <Text className="text-xs uppercase font-bold text-text-tertiary block mb-2">Observations</Text>
                  <Paragraph className="text-text-primary text-sm mb-0">{selectedLog.observations || 'No observations recorded'}</Paragraph>
                </div>
                <div className="bg-surface p-4 rounded-xl border border-border">
                  <Text className="text-xs uppercase font-bold text-text-tertiary block mb-2">Feedback</Text>
                  <Paragraph className="text-text-primary text-sm mb-0">{selectedLog.feedback || 'No feedback provided'}</Paragraph>
                </div>
              </div>
            </section>

            <div className="pt-6 flex justify-end gap-3 border-t border-border">
              <Button 
                onClick={() => setDetailDrawer(false)}
                className="rounded-xl px-6 h-10 font-medium"
              >
                Close
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  setDetailDrawer(false);
                  navigate(`/visit-logs/${selectedLog.id}/edit`);
                }}
                className="rounded-xl px-6 h-10 font-bold bg-primary border-0"
              >
                Edit Log
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default VisitLogList;