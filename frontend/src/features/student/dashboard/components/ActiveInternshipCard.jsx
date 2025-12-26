import React, { memo } from 'react';
import { Card, Typography, Tag, Button, Avatar, Progress, Divider, Spin, Empty } from 'antd';
import {
  BankOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ClockCircleOutlined,
  RightOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ActiveInternshipCard = ({
  internship,
  onViewDetails,
  loading = false,
  studentMentor = null, // Fallback mentor from student's mentorAssignments
}) => {
  // Show loading state
  if (loading) {
    return (
      <Card className="h-full rounded-2xl border border-border">
        <div className="flex items-center justify-center py-16">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        </div>
      </Card>
    );
  }

  // Show empty state
  if (!internship) {
    return (
      <Card className="h-full rounded-2xl border border-border">
        <Empty
          image={<BankOutlined className="text-6xl text-gray-300" />}
          imageStyle={{ height: 80 }}
          description={
            <div className="text-center">
              <Title level={5} className="text-gray-500 mb-1">No Active Internship</Title>
              <Text type="secondary">Apply for internships or add a self-identified one to get started</Text>
            </div>
          }
          className="py-12"
        >
          <Button type="primary" onClick={() => window.location.href = '/internships'}>
            Browse Internships
          </Button>
        </Empty>
      </Card>
    );
  }

  // Handle self-identified vs regular internships
  const isSelfIdentified = internship.isSelfIdentified || !internship.internshipId;

  const company = isSelfIdentified
    ? { companyName: internship.companyName, city: internship.companyAddress?.split(',')[0] }
    : (internship.internship?.industry || internship.industry || {});

  const startDate = internship.joiningDate || internship.startDate || internship.internship?.startDate;
  const endDate = internship.endDate || internship.internship?.endDate;
  const duration = internship.internshipDuration || internship.internship?.duration;

  // Calculate progress
  const totalDays = endDate && startDate ? dayjs(endDate).diff(dayjs(startDate), 'day') : 0;
  const daysCompleted = startDate ? Math.max(0, dayjs().diff(dayjs(startDate), 'day')) : 0;
  const daysRemaining = totalDays > 0 ? Math.max(0, totalDays - daysCompleted) : 0;
  const progressPercent = totalDays > 0 ? Math.min(Math.round((daysCompleted / totalDays) * 100), 100) : 0;

  const getStatusConfig = (status) => {
    const configs = {
      SELECTED: { color: 'green', label: 'Selected' },
      APPROVED: { color: 'green', label: isSelfIdentified ? 'Active' : 'Approved' },
      JOINED: { color: 'purple', label: 'Ongoing' },
      COMPLETED: { color: 'cyan', label: 'Completed' },
    };
    return configs[status] || { color: 'blue', label: status };
  };

  const statusConfig = getStatusConfig(internship.status);

  return (
    <Card
      className="h-full rounded-2xl border border-border hover:shadow-lg transition-shadow duration-300"
      styles={{ body: { padding: '24px' } }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            size={56}
            icon={<BankOutlined />}
            src={company.logo}
            className="bg-blue-50 text-blue-500"
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Title level={4} className="m-0">
                {company.companyName || 'Company'}
              </Title>
              {isSelfIdentified && (
                <Tag color="purple" className="text-xs">Self-Identified</Tag>
              )}
            </div>
            <Text className="text-gray-500">
              {internship.jobProfile || internship.internship?.title || 'Internship'}
            </Text>
          </div>
        </div>
        <Tag color={statusConfig.color} className="text-sm px-3 py-1">
          {statusConfig.label}
        </Tag>
      </div>

      {/* Progress Section */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-700">Internship Progress</Text>
          <Text className="text-sm font-bold text-blue-600">{progressPercent}%</Text>
        </div>
        <Progress
          percent={progressPercent}
          showInfo={false}
          strokeColor={{
            '0%': '#3b82f6',
            '100%': '#10b981',
          }}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{startDate ? dayjs(startDate).format('MMM DD, YYYY') : 'N/A'}</span>
          <span>{daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Completed'}</span>
          <span>{endDate ? dayjs(endDate).format('MMM DD, YYYY') : 'N/A'}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <CalendarOutlined className="text-blue-500" />
          <div>
            <Text className="text-xs text-gray-500 block">Duration</Text>
            <Text className="text-sm font-medium">{duration || 'N/A'} months</Text>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <EnvironmentOutlined className="text-green-500" />
          <div>
            <Text className="text-xs text-gray-500 block">Location</Text>
            <Text className="text-sm font-medium">{company.city || 'N/A'}</Text>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <ClockCircleOutlined className="text-purple-500" />
          <div>
            <Text className="text-xs text-gray-500 block">Days Completed</Text>
            <Text className="text-sm font-medium">{daysCompleted} days</Text>
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <UserOutlined className="text-orange-500" />
          <div>
            <Text className="text-xs text-gray-500 block">Mentor</Text>
            <Text className="text-sm font-medium truncate">
              {internship.mentor?.name || internship.facultyMentorName || studentMentor?.name || 'Not assigned'}
            </Text>
          </div>
        </div>
      </div>

      {/* Faculty Mentor Card (for self-identified) */}
      {isSelfIdentified && (internship.mentor || internship.facultyMentorName) && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
          <Text className="text-xs text-blue-600 font-medium block mb-2">Faculty Mentor</Text>
          <div className="flex items-center gap-3">
            <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
            <div>
              <Text strong className="text-sm block">
                {internship.mentor?.name || internship.facultyMentorName}
              </Text>
              {(internship.mentor?.email || internship.facultyMentorEmail) && (
                <Text className="text-xs text-gray-500">
                  {internship.mentor?.email || internship.facultyMentorEmail}
                </Text>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <Button
        type="primary"
        size="large"
        block
        onClick={onViewDetails}
        className="rounded-xl h-12"
      >
        View Details <RightOutlined />
      </Button>
    </Card>
  );
};

ActiveInternshipCard.displayName = 'ActiveInternshipCard';

export default memo(ActiveInternshipCard);
