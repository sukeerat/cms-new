import React, { useState } from 'react';
import { Card, Col, Row, Progress, Tooltip, theme, Modal, Statistic, Divider, Badge, Space } from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  CalendarOutlined,
  FileTextOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';

// Simple stat card for primary metrics
const StatCard = ({ title, value, subtitle, icon, gradient, badge }) => {
  const { token: antToken } = theme.useToken();

  return (
    <Card className="overflow-hidden h-full border-slate-200 dark:border-slate-800" styles={{ body: { padding: 0 } }}>
      <div className="p-4 text-white relative" style={{ background: gradient }}>
        <div
          className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 bg-white translate-x-1/4 -translate-y-1/4"
        />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <div className="text-3xl font-bold">{value?.toLocaleString() || 0}</div>
            <div className="text-xs uppercase tracking-wider opacity-90 font-medium">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs mt-1 opacity-75">{subtitle}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge !== undefined && badge > 0 && (
              <Badge count={badge} overflowCount={999} />
            )}
            <div className="p-3 rounded-xl backdrop-blur-sm bg-white/20">
              {React.cloneElement(icon, { style: { fontSize: '28px' } })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Enhanced card for detailed stats with eye icon modal
const DetailedStatCard = ({
  title,
  mainValue,
  mainLabel,
  secondaryValue,
  secondaryLabel,
  icon,
  gradient,
  details,
  badgeCount,
  badgeStatus = 'warning',
  alertMessage,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Card className="overflow-hidden h-full border-slate-200 dark:border-slate-800" styles={{ body: { padding: 0 } }}>
        <div className="p-4 text-white relative" style={{ background: gradient }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20 bg-white translate-x-1/4 -translate-y-1/4" />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider opacity-90 font-medium mb-2">
                {title}
              </div>
              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-2xl font-bold">{mainValue?.toLocaleString() || 0}</div>
                  <div className="text-xs opacity-75">{mainLabel}</div>
                </div>
                <div className="text-white/40 text-xl">|</div>
                <div>
                  <div className="text-2xl font-bold">{secondaryValue?.toLocaleString() || 0}</div>
                  <div className="text-xs opacity-75">{secondaryLabel}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip title="View Details">
                <div
                  className="p-2 rounded-lg backdrop-blur-sm bg-white/20 cursor-pointer hover:bg-white/30 transition-colors"
                  onClick={() => setModalVisible(true)}
                >
                  <EyeOutlined style={{ fontSize: '18px' }} />
                </div>
              </Tooltip>
              <Badge count={badgeCount} status={badgeStatus} offset={[-5, 5]} overflowCount={999}>
                <div className="p-3 rounded-xl backdrop-blur-sm bg-white/20">
                  {React.cloneElement(icon, { style: { fontSize: '28px' } })}
                </div>
              </Badge>
            </div>
          </div>
        </div>
        <div className="p-3 bg-background-tertiary">
          {alertMessage ? (
            <div className="flex items-center gap-2 text-xs text-warning">
              <WarningOutlined />
              <span>{alertMessage}</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {details?.slice(0, 2).map((detail, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-text-tertiary">{detail.label}:</span>
                  <span className={`font-semibold ${detail.highlight ? 'text-warning' : 'text-text-secondary'}`}>
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            {React.cloneElement(icon, { style: { fontSize: '20px', color: 'rgb(var(--color-primary))' } })}
            <span>{title} - Detailed View</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <div className="py-4">
          <Row gutter={[16, 16]}>
            {details?.map((detail, idx) => (
              <Col span={12} key={idx}>
                <Card size="small" className={detail.highlight ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''}>
                  <Statistic
                    title={
                      <span className="flex items-center gap-1">
                        {detail.icon && React.cloneElement(detail.icon, { style: { fontSize: '14px' } })}
                        {detail.label}
                      </span>
                    }
                    value={detail.value}
                    valueStyle={{
                      color: detail.highlight ? 'rgb(var(--color-warning))' : undefined,
                      fontSize: '20px'
                    }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>
    </>
  );
};

const StatisticsCards = ({ stats }) => {
  // Primary metrics
  const totalInstitutions = stats?.institutions?.total ?? 0;
  const activeInstitutions = stats?.institutions?.active ?? totalInstitutions;

  const totalStudents = stats?.students?.total ?? 0;
  const activeStudents = stats?.students?.active ?? totalStudents;

  const totalFaculty = stats?.faculty?.total ?? stats?.totalFaculty ?? 0;
  const activeFaculty = stats?.faculty?.active ?? stats?.activeFaculty ?? totalFaculty;

  // Self-identified internships (main focus)
  const totalInternships = stats?.internships?.total ?? 0;
  const activeInternships = stats?.internships?.active ?? 0;

  // Detailed stats
  const assignments = stats?.assignments || {};
  const facultyVisits = stats?.facultyVisits || {};
  const monthlyReports = stats?.monthlyReports || {};

  // Primary stat cards - focused on core metrics
  const primaryCards = [
    {
      title: 'Institutions',
      value: totalInstitutions,
      subtitle: `${activeInstitutions} active`,
      icon: <BankOutlined />,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
    },
    {
      title: 'Students',
      value: totalStudents,
      subtitle: `${activeStudents} active`,
      icon: <TeamOutlined />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    },
    {
      title: 'Active Internships',
      value: activeInternships,
      subtitle: `${totalInternships} total self-identified`,
      icon: <BookOutlined />,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      badge: activeInternships,
    },
    {
      title: 'Faculty',
      value: totalFaculty,
      subtitle: `${activeFaculty} active mentors`,
      icon: <UserOutlined />,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
    },
  ];

  // Detailed cards configuration with focus areas
  const detailedCards = [
    {
      title: 'Mentor Assignments',
      mainValue: assignments?.assigned || 0,
      mainLabel: 'Assigned',
      secondaryValue: assignments?.unassigned || 0,
      secondaryLabel: 'Unassigned',
      icon: <UserSwitchOutlined />,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      badgeCount: assignments?.unassigned || 0,
      badgeStatus: 'warning',
      alertMessage: assignments?.unassigned > 0 ? `${assignments.unassigned} students need mentor assignment` : null,
      details: [
        { label: 'Total Assignments', value: assignments?.total || 0, icon: <TeamOutlined /> },
        { label: 'Active Assignments', value: assignments?.active || 0, icon: <CheckCircleOutlined /> },
        { label: 'Students with Internships', value: assignments?.studentsWithInternships || 0, icon: <BookOutlined /> },
        { label: 'Unassigned Students', value: assignments?.unassigned || 0, icon: <WarningOutlined />, highlight: (assignments?.unassigned || 0) > 0 },
      ],
    },
    {
      title: 'Faculty Visits',
      mainValue: facultyVisits?.thisMonth || 0,
      mainLabel: 'This Month',
      secondaryValue: facultyVisits?.pendingThisMonth || 0,
      secondaryLabel: 'Pending',
      icon: <CalendarOutlined />,
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      badgeCount: facultyVisits?.pendingThisMonth || 0,
      badgeStatus: 'processing',
      alertMessage: facultyVisits?.pendingThisMonth > 0 ? `${facultyVisits.pendingThisMonth} visits pending this month` : null,
      details: [
        { label: 'Total Visits', value: facultyVisits?.total || 0, icon: <CalendarOutlined /> },
        { label: 'This Month', value: facultyVisits?.thisMonth || 0, icon: <CheckCircleOutlined /> },
        { label: 'Last Month', value: facultyVisits?.lastMonth || 0, icon: <ClockCircleOutlined /> },
        { label: 'Expected This Month', value: facultyVisits?.expectedThisMonth || 0, icon: <TeamOutlined /> },
        { label: 'Pending This Month', value: facultyVisits?.pendingThisMonth || 0, icon: <WarningOutlined />, highlight: (facultyVisits?.pendingThisMonth || 0) > 0 },
        { label: 'Completion Rate', value: `${facultyVisits?.completionRate || 0}%`, icon: <RiseOutlined /> },
      ],
    },
    {
      title: 'Monthly Reports',
      mainValue: monthlyReports?.thisMonth || 0,
      mainLabel: 'Submitted',
      secondaryValue: monthlyReports?.missingThisMonth || 0,
      secondaryLabel: 'Missing',
      icon: <FileTextOutlined />,
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      badgeCount: monthlyReports?.missingThisMonth || 0,
      badgeStatus: 'error',
      alertMessage: monthlyReports?.missingThisMonth > 0 ? `${monthlyReports.missingThisMonth} reports missing this month` : null,
      details: [
        { label: 'Total Submitted', value: monthlyReports?.total || 0, icon: <FileTextOutlined /> },
        { label: 'Submitted This Month', value: monthlyReports?.thisMonth || 0, icon: <CheckCircleOutlined /> },
        { label: 'Submitted Last Month', value: monthlyReports?.lastMonth || 0, icon: <ClockCircleOutlined /> },
        { label: 'Pending Review', value: monthlyReports?.pendingReview || 0, icon: <ClockCircleOutlined /> },
        { label: 'Expected This Month', value: monthlyReports?.expectedThisMonth || 0, icon: <TeamOutlined /> },
        { label: 'Missing This Month', value: monthlyReports?.missingThisMonth || 0, icon: <WarningOutlined />, highlight: (monthlyReports?.missingThisMonth || 0) > 0 },
        { label: 'Submission Rate', value: `${monthlyReports?.submissionRate || 0}%`, icon: <RiseOutlined /> },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* Primary Stats Row - Core Metrics */}
      <Row gutter={[16, 16]}>
        {primaryCards.map((card, idx) => (
          <Col key={idx} xs={24} sm={12} lg={6}>
            <StatCard {...card} />
          </Col>
        ))}
      </Row>

      {/* Detailed Stats Row - Focus Areas with Eye Icons */}
      <Row gutter={[16, 16]}>
        {detailedCards.map((card, idx) => (
          <Col key={idx} xs={24} sm={24} lg={8}>
            <DetailedStatCard {...card} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default StatisticsCards;
