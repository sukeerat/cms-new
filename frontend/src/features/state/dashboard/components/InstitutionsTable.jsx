import React from 'react';
import { Card, Table, Tag, Button, Space, Avatar, Typography, Tooltip, Badge, Progress } from 'antd';
import {
  BankOutlined,
  EyeOutlined,
  RightOutlined,
  TeamOutlined,
  UserSwitchOutlined,
  CalendarOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const InstitutionsTable = ({ institutions, loading, onViewAll, onViewDetails, month, year }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'red';
      case 'pending':
        return 'orange';
      default:
        return 'blue';
    }
  };

  // Calculate compliance score based on assignments, visits, and reports
  const getComplianceScore = (stats) => {
    if (!stats) return 0;
    const { studentsWithInternships, assigned, facultyVisits, reportsSubmitted } = stats;
    if (studentsWithInternships === 0) return 100;

    const assignmentScore = (assigned / studentsWithInternships) * 100;
    const visitScore = facultyVisits > 0 ? Math.min((facultyVisits / studentsWithInternships) * 100, 100) : 0;
    const reportScore = (reportsSubmitted / studentsWithInternships) * 100;

    return Math.round((assignmentScore + visitScore + reportScore) / 3);
  };

  const columns = [
    {
      title: 'Institution',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (name, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            icon={<BankOutlined />}
            className="bg-primary"
            size="small"
          />
          <div>
            <Text strong className="block text-slate-900 dark:text-slate-200 text-sm">{name}</Text>
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {record.code || record.city}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Total active students">
          <Space size={4}>
            <TeamOutlined />
            <span>Students</span>
          </Space>
        </Tooltip>
      ),
      dataIndex: ['stats', 'totalStudents'],
      key: 'totalStudents',
      width: 90,
      align: 'center',
      render: (value) => (
        <Text strong>{value || 0}</Text>
      ),
    },
    {
      title: (
        <Tooltip title="Students with active self-identified internships">
          <Space size={4}>
            <BookOutlined />
            <span>Internships</span>
          </Space>
        </Tooltip>
      ),
      dataIndex: ['stats', 'studentsWithInternships'],
      key: 'studentsWithInternships',
      width: 100,
      align: 'center',
      render: (value, record) => {
        const total = record.stats?.totalStudents || 0;
        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <Tooltip title={`${percent}% of students have internships`}>
            <div className="text-center">
              <Text strong className="text-blue-600">{value || 0}</Text>
              <Progress
                percent={percent}
                showInfo={false}
                size="small"
                strokeColor="#3b82f6"
                className="mt-1"
              />
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: (
        <Tooltip title="Mentor Assignments - Assigned / Unassigned">
          <Space size={4}>
            <UserSwitchOutlined />
            <span>Mentors</span>
          </Space>
        </Tooltip>
      ),
      key: 'assignments',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const assigned = record.stats?.assigned || 0;
        const unassigned = record.stats?.unassigned || 0;
        const hasUnassigned = unassigned > 0;

        return (
          <Space size={4}>
            <Tag color="success" className="m-0">
              <CheckCircleOutlined /> {assigned}
            </Tag>
            {hasUnassigned && (
              <Tooltip title={`${unassigned} students need mentors`}>
                <Tag color="warning" className="m-0">
                  <WarningOutlined /> {unassigned}
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: (
        <Tooltip title="Faculty visits this month">
          <Space size={4}>
            <CalendarOutlined />
            <span>Visits</span>
          </Space>
        </Tooltip>
      ),
      dataIndex: ['stats', 'facultyVisits'],
      key: 'facultyVisits',
      width: 80,
      align: 'center',
      render: (value, record) => {
        const expected = record.stats?.studentsWithInternships || 0;
        const isLow = expected > 0 && value < expected;
        return (
          <Tooltip title={`${value} visits / ${expected} expected`}>
            <Badge
              count={value || 0}
              showZero
              color={isLow ? '#faad14' : '#52c41a'}
              overflowCount={999}
            />
          </Tooltip>
        );
      },
    },
    {
      title: (
        <Tooltip title="Monthly Reports - Submitted / Missing">
          <Space size={4}>
            <FileTextOutlined />
            <span>Reports</span>
          </Space>
        </Tooltip>
      ),
      key: 'reports',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const submitted = record.stats?.reportsSubmitted || 0;
        const missing = record.stats?.reportsMissing || 0;
        const hasMissing = missing > 0;

        return (
          <Space size={4}>
            <Tag color="success" className="m-0">
              <CheckCircleOutlined /> {submitted}
            </Tag>
            {hasMissing && (
              <Tooltip title={`${missing} reports missing this month`}>
                <Tag color="error" className="m-0">
                  <WarningOutlined /> {missing}
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Score',
      key: 'score',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const score = getComplianceScore(record.stats);
        let color = '#52c41a';
        if (score < 50) color = '#f5222d';
        else if (score < 75) color = '#faad14';

        return (
          <Tooltip title="Overall compliance score based on assignments, visits, and reports">
            <Progress
              type="circle"
              percent={score}
              width={40}
              strokeColor={color}
              format={(percent) => `${percent}%`}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: 80,
      align: 'center',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} className="m-0">
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      fixed: 'right',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => onViewDetails?.(record) || navigate(`/institutions-overview?id=${record.id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const monthName = month ? new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' }) : '';

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <BankOutlined className="text-primary" />
          <span>Institution Performance</span>
          {month && year && (
            <Tag color="blue" className="ml-2">
              {monthName} {year}
            </Tag>
          )}
        </div>
      }
      extra={
        <Button
          type="link"
          onClick={onViewAll || (() => navigate('/institutions'))}
        >
          View All <RightOutlined />
        </Button>
      }
      className="shadow-sm h-full border-slate-200 dark:border-slate-800"
      styles={{ body: { padding: 0 } }}
    >
      <Table
        columns={columns}
        dataSource={institutions}
        loading={loading}
        pagination={false}
        size="small"
        rowKey="id"
        scroll={{ x: 900 }}
        className="institution-stats-table"
      />
      <style>{`
        .institution-stats-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-size: 12px;
          padding: 8px 12px;
        }
        .institution-stats-table .ant-table-tbody > tr > td {
          padding: 8px 12px;
        }
        .dark .institution-stats-table .ant-table-thead > tr > th {
          background: #1e293b;
        }
      `}</style>
    </Card>
  );
};

export default InstitutionsTable;
