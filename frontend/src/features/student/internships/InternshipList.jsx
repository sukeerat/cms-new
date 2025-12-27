import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Input, Select, message, Typography, Avatar, Tooltip } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchInternships, applyForInternship } from '../store/studentSlice';
import {
  EyeOutlined,
  SearchOutlined,
  SendOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  BankOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

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
      title: 'Position & Company',
      dataIndex: 'position',
      key: 'position',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            {record.company?.logo ? (
              <img src={record.company.logo} alt={record.company.name} className="w-full h-full object-contain p-1" />
            ) : (
              <BankOutlined />
            )}
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-tight">{record.title || text}</div>
            <div className="text-xs font-medium text-gray-500">{record.company?.name || record.industry?.companyName}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <EnvironmentOutlined className="text-gray-400" />
            {record.location || record.workLocation}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <ClockCircleOutlined className="text-gray-400" />
            {record.duration} months
          </div>
        </div>
      ),
    },
    {
      title: 'Stipend',
      dataIndex: 'stipend',
      key: 'stipend',
      render: (stipend, record) => (
        <div className="font-medium text-gray-700 text-sm">
          {record.stipendAmount || stipend ? `₹${(record.stipendAmount || stipend).toLocaleString()}` : <span className="text-gray-400">Unpaid</span>}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type, record) => {
        const workType = type || (record.isRemoteAllowed ? 'Remote' : 'On-site');
        const color = workType === 'Remote' ? 'blue' : workType === 'Hybrid' ? 'purple' : 'cyan';
        return (
          <Tag color={color} className="rounded-md font-medium border-0 px-2 py-0.5">
            {workType}
          </Tag>
        );
      },
    },
    {
      title: 'Deadline',
      dataIndex: 'applicationDeadline',
      key: 'applicationDeadline',
      render: (date) => (
        <Tooltip title={dayjs(date).format('dddd, MMMM D, YYYY')}>
          <span className="text-sm text-gray-600">{dayjs(date).format('MMM D, YYYY')}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        if (isApplied(record.id)) {
          const status = getApplicationStatus(record.id);
          const config = {
            APPLIED: { color: 'blue', label: 'Applied' },
            SHORTLISTED: { color: 'orange', label: 'Shortlisted' },
            SELECTED: { color: 'green', label: 'Selected' },
            REJECTED: { color: 'red', label: 'Rejected' },
          }[status] || { color: 'default', label: status };
          
          return <Tag color={config.color} className="rounded-md font-bold uppercase text-[10px] tracking-wider">{config.label}</Tag>;
        }
        return <Tag className="rounded-md text-gray-400 border-gray-200">Not Applied</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="default"
            size="small"
            className="rounded-lg border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200"
            onClick={() => navigate(`/internships/${record.id}`)}
          >
            Details
          </Button>
          {!isApplied(record.id) && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleApply(record.id)}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 shadow-sm"
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
    <div className="p-4 md:p-8 bg-background-secondary min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-blue-600 shadow-sm">
              <ShopOutlined className="text-2xl" />
            </div>
            <div>
              <Title level={2} className="!mb-1 !text-gray-900 !text-2xl lg:!text-3xl tracking-tight">
                Internship Opportunities
              </Title>
              <Paragraph className="!text-gray-500 !text-sm lg:!text-base !mb-0 font-medium">
                Explore and apply for internships matching your profile
              </Paragraph>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card bordered={false} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <ShopOutlined className="text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-none mb-1">{stats.total}</div>
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Available Positions</div>
              </div>
            </div>
          </Card>

          <Card bordered={false} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <SendOutlined className="text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-none mb-1">{stats.applied}</div>
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Applications Sent</div>
              </div>
            </div>
          </Card>

          <Card bordered={false} className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <CheckCircleOutlined className="text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-none mb-1">{stats.selected}</div>
                <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Selected</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card bordered={false} className="rounded-2xl border border-gray-100 shadow-sm bg-white" styles={{ body: { padding: '16px' } }}>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search by position or company"
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md rounded-xl h-11 bg-gray-50 border-gray-200 hover:bg-white focus:bg-white"
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Location"
              className="w-40 h-11"
              onChange={(value) => {
                setFilters({ ...filters, location: value });
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
              dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
            >
              <Select.Option value="Remote">Remote</Select.Option>
              <Select.Option value="Bangalore">Bangalore</Select.Option>
              <Select.Option value="Mumbai">Mumbai</Select.Option>
              <Select.Option value="Delhi">Delhi</Select.Option>
            </Select>
            <Select
              placeholder="Duration"
              className="w-40 h-11"
              onChange={(value) => {
                setFilters({ ...filters, duration: value });
                setPagination({ ...pagination, current: 1 });
              }}
              allowClear
              dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
            >
              <Select.Option value="3">3 months</Select.Option>
              <Select.Option value="6">6 months</Select.Option>
              <Select.Option value="12">12 months</Select.Option>
            </Select>
          </div>
        </Card>

        {/* Table Container */}
        <Card bordered={false} className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white" styles={{ body: { padding: 0 } }}>
          <Table
            columns={columns}
            dataSource={internships.list}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              total: internships.total,
              showTotal: (total) => <span className="text-gray-500">Total {total} opportunities</span>,
              showSizeChanger: true,
              className: "px-6 py-6",
            }}
            onChange={handleTableChange}
            className="custom-table"
            rowClassName="hover:bg-gray-50/50 transition-colors"
          />
        </Card>
      </div>
    </div>
  );
};

export default InternshipList;