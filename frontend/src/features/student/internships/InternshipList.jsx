import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Input, Select, message, Row, Col, Statistic, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchInternships, applyForInternship } from '../store/studentSlice';
import { EyeOutlined, SearchOutlined, SendOutlined, ShopOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const InternshipList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { internships, applications, loading } = useSelector(state => state.student);

  useEffect(() => {
    loadInternships();
  }, [dispatch, pagination.current, pagination.pageSize, filters]);

  const loadInternships = () => {
    dispatch(fetchInternships({
      page: pagination.current,
      limit: pagination.pageSize,
      ...filters
    }));
  };

  const handleApply = async (internshipId) => {
    try {
      await dispatch(applyForInternship(internshipId)).unwrap();
      message.success('Application submitted successfully');
      loadInternships();
    } catch (error) {
      message.error(error?.message || 'Failed to submit application');
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
    setPagination({ ...pagination, current: 1 });
  };

  const isApplied = (internshipId) => {
    return applications?.list?.some(app => app.internshipId === internshipId);
  };

  const getApplicationStatus = (internshipId) => {
    const application = applications?.list?.find(app => app.internshipId === internshipId);
    return application?.status;
  };

  const columns = [
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (text, record) => (
        <div>
          <div className="font-medium text-text-primary">{text}</div>
          <div className="text-xs text-text-secondary">{record.company?.name}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} months`,
    },
    {
      title: 'Stipend',
      dataIndex: 'stipend',
      key: 'stipend',
      render: (stipend) => stipend ? `₹${stipend.toLocaleString()}` : 'Unpaid',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'REMOTE' ? 'blue' : type === 'HYBRID' ? 'purple' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Deadline',
      dataIndex: 'applicationDeadline',
      key: 'applicationDeadline',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        if (isApplied(record.id)) {
          const status = getApplicationStatus(record.id);
          const colors = {
            APPLIED: 'processing',
            SHORTLISTED: 'warning',
            SELECTED: 'success',
            REJECTED: 'error'
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        }
        return <Tag>Not Applied</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/internships/${record.id}`)}
          >
            View Details
          </Button>
          {!isApplied(record.id) && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleApply(record.id)}
              size="small"
            >
              Apply
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: internships?.total || 0,
    applied: applications?.list?.length || 0,
    selected: applications?.list?.filter(app => app.status === 'SELECTED')?.length || 0,
  };

  return (
    <div className="p-4 md:p-6 bg-background-secondary min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-primary shadow-sm mr-3">
              <ShopOutlined className="text-lg" />
            </div>
            <div>
              <Title level={2} className="mb-0 text-text-primary text-2xl">
                Internship Opportunities
              </Title>
              <Paragraph className="text-text-secondary text-sm mb-0">
                Explore and apply for internships matching your profile
              </Paragraph>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card size="small" className="rounded-xl border-border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                <ShopOutlined className="text-lg" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
                <div className="text-[10px] uppercase font-bold text-text-tertiary">Available</div>
              </div>
            </div>
          </Card>

          <Card size="small" className="rounded-xl border-border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-500">
                <SendOutlined className="text-lg" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{stats.applied}</div>
                <div className="text-[10px] uppercase font-bold text-text-tertiary">Applications</div>
              </div>
            </div>
          </Card>

          <Card size="small" className="rounded-xl border-border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-success/10 text-success">
                <CheckCircleOutlined className="text-lg" />
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">{stats.selected}</div>
                <div className="text-[10px] uppercase font-bold text-text-tertiary">Selected</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-xl border-border shadow-sm" styles={{ body: { padding: '16px' } }}>
          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder="Search by position or company"
              prefix={<SearchOutlined className="text-text-tertiary" />}
              className="max-w-md rounded-lg h-10 bg-background border-border"
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Location"
              className="w-40 h-10"
              onChange={(value) => {
                setFilters({ ...filters, location: value });
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
            >
              <Select.Option value="Remote">Remote</Select.Option>
              <Select.Option value="Bangalore">Bangalore</Select.Option>
              <Select.Option value="Mumbai">Mumbai</Select.Option>
              <Select.Option value="Delhi">Delhi</Select.Option>
            </Select>
            <Select
              placeholder="Duration"
              className="w-40 h-10"
              onChange={(value) => {
                setFilters({ ...filters, duration: value });
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
            >
              <Select.Option value="3">3 months</Select.Option>
              <Select.Option value="6">6 months</Select.Option>
              <Select.Option value="12">12 months</Select.Option>
            </Select>
          </div>
        </Card>

        {/* Table Container */}
        <Card className="rounded-2xl border-border shadow-sm overflow-hidden" styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={internships.list}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              total: internships.total,
              showTotal: (total) => `Total ${total} internships`,
              showSizeChanger: true,
              className: "px-6 py-4",
            }}
            onChange={handleTableChange}
            className="custom-table"
          />
        </Card>
      </div>
    </div>
  );
};

export default InternshipList;