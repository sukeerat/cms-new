import React, { useState } from 'react';
import { Card, Col, Row, Progress, Tooltip, theme, Modal, Statistic, Divider, Badge, Space, Typography, Button } from 'antd';
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
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

// Get compliance color and level based on threshold
const getComplianceLevel = (score) => {
  if (score === null || score === undefined) {
    return { level: 'N/A', color: 'text-text-tertiary', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-300' };
  }
  if (score >= 90) {
    return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-500/10', borderColor: 'border-green-300' };
  }
  if (score >= 70) {
    return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-300' };
  }
  if (score >= 50) {
    return { level: 'Warning', color: 'text-yellow-600', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-300' };
  }
  if (score >= 30) {
    return { level: 'Critical', color: 'text-orange-600', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-300' };
  }
  return { level: 'Intervention Required', color: 'text-red-600', bgColor: 'bg-red-500/10', borderColor: 'border-red-300' };
};

// Compliance Score card with threshold-based coloring
const ComplianceScoreCard = ({ score, mentorRate, joiningLetterRate, onClick }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { level, color, bgColor, borderColor } = getComplianceLevel(score);
  const displayScore = score !== null && score !== undefined ? `${Math.round(score)}%` : 'N/A';

  return (
    <>
      <Card
        className={`rounded-xl border shadow-sm hover:shadow-md transition-all h-full bg-surface cursor-pointer ${borderColor}`}
        styles={{ body: { padding: '16px' } }}
        onClick={() => setModalVisible(true)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgColor} ${color}`}>
            <SafetyCertificateOutlined style={{ fontSize: '24px' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <Text className="text-text-tertiary text-xs font-bold uppercase tracking-wider block mb-0.5">Compliance Score</Text>
              <Tooltip title="View breakdown">
                <EyeOutlined className="text-text-tertiary hover:text-primary cursor-pointer" />
              </Tooltip>
            </div>
            <div className={`text-2xl font-black leading-tight ${color}`}>
              {displayScore}
            </div>
            <Text className={`text-xs mt-1 block font-semibold ${color}`}>{level}</Text>
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3 py-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColor} ${color}`}>
              <SafetyCertificateOutlined style={{ fontSize: '16px' }} />
            </div>
            <span className="text-text-primary font-bold text-lg">Compliance Score Breakdown</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        className="rounded-2xl overflow-hidden"
      >
        <div className="py-4 space-y-4">
          <div className="text-center p-6 rounded-xl bg-background-tertiary/30 border border-border">
            <div className={`text-4xl font-black ${color}`}>{displayScore}</div>
            <div className={`text-sm font-semibold ${color} mt-1`}>{level}</div>
            <div className="text-xs text-text-tertiary mt-2">
              Formula: (Mentor Rate + Joining Letter Rate) / 2
            </div>
          </div>

          <div className="space-y-3">
            <Tooltip title="Percentage of active students with assigned mentors">
              <div className="p-4 rounded-xl bg-background-tertiary/30 border border-border cursor-help">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <UserSwitchOutlined className="text-purple-500" />
                    <Text className="text-text-secondary font-medium">Mentor Assignment Rate</Text>
                  </div>
                  <Text strong className="text-text-primary">{mentorRate !== null ? `${Math.round(mentorRate)}%` : 'N/A'}</Text>
                </div>
                <Progress
                  percent={mentorRate || 0}
                  showInfo={false}
                  strokeColor="rgb(168, 85, 247)"
                  size="small"
                />
              </div>
            </Tooltip>

            <Tooltip title="Percentage of active students with uploaded joining letters">
              <div className="p-4 rounded-xl bg-background-tertiary/30 border border-border cursor-help">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <FileTextOutlined className="text-cyan-500" />
                    <Text className="text-text-secondary font-medium">Joining Letter Rate</Text>
                  </div>
                  <Text strong className="text-text-primary">{joiningLetterRate !== null ? `${Math.round(joiningLetterRate)}%` : 'N/A'}</Text>
                </div>
                <Progress
                  percent={joiningLetterRate || 0}
                  showInfo={false}
                  strokeColor="rgb(6, 182, 212)"
                  size="small"
                />
              </div>
            </Tooltip>
          </div>

          <div className="text-xs text-text-tertiary text-center pt-2 border-t border-border">
            Compliance is calculated based on mentor assignments and joining letter uploads.
            Reports and visits are tracked separately.
          </div>
        </div>
      </Modal>
    </>
  );
};

// Simple status card for Report/Visit status (no color indicators)
const StatusCard = ({ title, submitted, expected, icon, details, detailsTitle }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const displayValue = `${submitted} / ${expected}`;

  return (
    <>
      <Card
        className="rounded-xl border-border shadow-sm hover:shadow-md transition-all h-full bg-surface cursor-pointer"
        styles={{ body: { padding: '16px' } }}
        onClick={() => setModalVisible(true)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gray-500/10 text-gray-600">
            {React.cloneElement(icon, { style: { fontSize: '24px' } })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <Text className="text-text-tertiary text-xs font-bold uppercase tracking-wider block mb-0.5">{title}</Text>
              <Tooltip title="View details">
                <EyeOutlined className="text-text-tertiary hover:text-primary cursor-pointer" />
              </Tooltip>
            </div>
            <div className="text-2xl font-black text-text-primary leading-tight">
              {displayValue}
            </div>
            <Text className="text-text-secondary text-xs mt-1 block">
              {expected > 0 ? `${Math.round((submitted / expected) * 100)}% this cycle` : 'No data'}
            </Text>
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-500/10 text-gray-600">
              {React.cloneElement(icon, { style: { fontSize: '16px' } })}
            </div>
            <span className="text-text-primary font-bold text-lg">{detailsTitle || `${title} Details`}</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        className="rounded-2xl overflow-hidden"
      >
        <div className="py-4">
          <Row gutter={[16, 16]}>
            {details?.map((detail, idx) => (
              <Col span={12} key={idx}>
                <Tooltip title={detail.tooltip} placement="top">
                  <div className={`p-4 rounded-xl border cursor-help ${detail.highlight ? 'bg-warning-50 border-warning-200' : 'bg-background-tertiary/30 border-border'}`}>
                    <div className="flex items-center gap-2 mb-2 text-text-tertiary text-xs font-bold uppercase tracking-wider">
                      {detail.icon && React.cloneElement(detail.icon, { className: detail.highlight ? 'text-warning' : 'text-text-secondary' })}
                      {detail.label}
                    </div>
                    <div className={`text-2xl font-black ${detail.highlight ? 'text-warning-700' : 'text-text-primary'}`}>
                      {detail.value}
                    </div>
                  </div>
                </Tooltip>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>
    </>
  );
};

// Simple stat card for primary metrics
const StatCard = ({ title, value, subtitle, icon, colorClass, bgClass, badge }) => {
  return (
    <Card className="rounded-xl border-border shadow-sm hover:shadow-md transition-all h-full bg-surface" styles={{ body: { padding: '16px' } }}>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
          {React.cloneElement(icon, { style: { fontSize: '24px' } })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <Text className="text-text-tertiary text-xs font-bold uppercase tracking-wider block mb-0.5">{title}</Text>
            {badge > 0 && <Badge count={badge} style={{ backgroundColor: 'rgb(var(--color-primary))', boxShadow: 'none' }} />}
          </div>
          <div className="text-2xl font-black text-text-primary leading-tight">
            {value?.toLocaleString() || 0}
          </div>
          {subtitle && (
            <Text className="text-text-secondary text-xs mt-1 block truncate">{subtitle}</Text>
          )}
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
  colorClass,
  bgClass,
  details,
  badgeCount,
  badgeStatus = 'warning',
  alertMessage,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Card className="rounded-xl border-border shadow-sm hover:shadow-md transition-all h-full bg-surface" styles={{ body: { padding: '16px' } }}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
            {React.cloneElement(icon, { style: { fontSize: '24px' } })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <Text className="text-text-tertiary text-xs font-bold uppercase tracking-wider">{title}</Text>
              <Tooltip title="View Details">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<EyeOutlined className="text-text-tertiary hover:text-primary" />} 
                  onClick={() => setModalVisible(true)} 
                  className="rounded-lg w-6 h-6 flex items-center justify-center"
                />
              </Tooltip>
            </div>
            
            <div className="flex items-end gap-4 mb-3">
              <div>
                <div className="text-2xl font-black text-text-primary leading-none">{mainValue?.toLocaleString() || 0}</div>
                <div className="text-text-tertiary text-[10px] uppercase font-bold mt-1">{mainLabel}</div>
              </div>
              <div className="h-8 w-px bg-border mx-2"></div>
              <div>
                <div className="text-xl font-bold text-text-secondary leading-none">{secondaryValue?.toLocaleString() || 0}</div>
                <div className="text-text-tertiary text-[10px] uppercase font-bold mt-1">{secondaryLabel}</div>
              </div>
            </div>

            {alertMessage && (
              <div className="flex items-center gap-2 text-xs bg-warning/10 text-warning-700 px-2 py-1 rounded-md border border-warning/20">
                <WarningOutlined className="text-warning" />
                <span className="font-medium truncate">{alertMessage}</span>
              </div>
            )}
            
            {!alertMessage && details && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {details.slice(0, 2).map((detail, idx) => (
                  <Tooltip key={idx} title={detail.tooltip} placement="top">
                    <div className="flex justify-between items-center text-xs cursor-help">
                      <span className="text-text-tertiary truncate">{detail.label}:</span>
                      <span className={`font-semibold ${detail.highlight ? 'text-warning' : 'text-text-primary'}`}>
                        {detail.value}
                      </span>
                    </div>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3 py-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
              {React.cloneElement(icon, { style: { fontSize: '16px' } })}
            </div>
            <span className="text-text-primary font-bold text-lg">{title} Details</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        className="rounded-2xl overflow-hidden"
      >
        <div className="py-4">
          <Row gutter={[16, 16]}>
            {details?.map((detail, idx) => (
              <Col span={12} key={idx}>
                <Tooltip title={detail.tooltip} placement="top">
                  <div className={`p-4 rounded-xl border cursor-help ${detail.highlight ? 'bg-warning-50 border-warning-200' : 'bg-background-tertiary/30 border-border'}`}>
                    <div className="flex items-center gap-2 mb-2 text-text-tertiary text-xs font-bold uppercase tracking-wider">
                      {detail.icon && React.cloneElement(detail.icon, { className: detail.highlight ? 'text-warning' : 'text-text-secondary' })}
                      {detail.label}
                    </div>
                    <div className={`text-2xl font-black ${detail.highlight ? 'text-warning-700' : 'text-text-primary'}`}>
                      {detail.value}
                    </div>
                  </div>
                </Tooltip>
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

  // Compliance metrics (2-metric formula: Mentor Rate + Joining Letter Rate)
  // These are calculated by the backend and passed through stats
  const compliance = stats?.compliance || {};
  const mentorRate = compliance?.mentorRate ?? assignments?.assignmentRate ?? null;
  const joiningLetterRate = compliance?.joiningLetterRate ?? null;

  // Calculate compliance score from 2-metric formula
  // If backend provides complianceScore, use it; otherwise calculate from rates
  let complianceScore = compliance?.score ?? stats?.complianceScore ?? null;
  if (complianceScore === null && mentorRate !== null && joiningLetterRate !== null) {
    complianceScore = Math.round((mentorRate + joiningLetterRate) / 2);
  } else if (complianceScore === null && mentorRate !== null) {
    // If only mentor rate available, use it as partial compliance
    complianceScore = Math.round(mentorRate);
  }

  // Report and Visit status (separate from compliance - just informational)
  const reportsSubmitted = monthlyReports?.thisMonth ?? 0;
  const reportsExpected = monthlyReports?.expectedThisMonth ?? 0;
  const visitsCompleted = facultyVisits?.thisMonth ?? 0;
  const visitsExpected = facultyVisits?.expectedThisMonth ?? 0;

  // Report details for modal
  const reportDetails = [
    { label: 'Submitted This Cycle', value: reportsSubmitted, icon: <CheckCircleOutlined />, tooltip: 'Reports submitted in the current cycle' },
    { label: 'Expected This Cycle', value: reportsExpected, icon: <TeamOutlined />, tooltip: 'Reports expected based on active internships in their 4-week cycle' },
    { label: 'Missing This Cycle', value: monthlyReports?.missingThisMonth || 0, icon: <WarningOutlined />, highlight: (monthlyReports?.missingThisMonth || 0) > 0, tooltip: 'Reports not yet submitted this cycle' },
    { label: 'Total Submitted', value: monthlyReports?.total || 0, icon: <FileTextOutlined />, tooltip: 'Total reports submitted all time' },
    { label: 'Last Month', value: monthlyReports?.lastMonth || 0, icon: <ClockCircleOutlined />, tooltip: 'Reports submitted last month' },
    { label: 'Pending Review', value: monthlyReports?.pendingReview || 0, icon: <ClockCircleOutlined />, tooltip: 'Reports awaiting review' },
  ];

  // Visit details for modal
  const visitDetails = [
    { label: 'Completed This Cycle', value: visitsCompleted, icon: <CheckCircleOutlined />, tooltip: 'Visits completed in the current cycle' },
    { label: 'Expected This Cycle', value: visitsExpected, icon: <TeamOutlined />, tooltip: 'Visits expected based on active internships' },
    { label: 'Pending This Cycle', value: facultyVisits?.pendingThisMonth || 0, icon: <WarningOutlined />, highlight: (facultyVisits?.pendingThisMonth || 0) > 0, tooltip: 'Visits still pending this cycle' },
    { label: 'Total Visits', value: facultyVisits?.total || 0, icon: <CalendarOutlined />, tooltip: 'Total visits completed all time' },
    { label: 'Last Month', value: facultyVisits?.lastMonth || 0, icon: <ClockCircleOutlined />, tooltip: 'Visits completed last month' },
    { label: 'Completion Rate', value: facultyVisits?.completionRate != null ? `${facultyVisits.completionRate}%` : 'N/A', icon: <RiseOutlined />, tooltip: 'Percentage of expected visits completed' },
  ];

  // Primary stat cards - focused on core metrics
  const primaryCards = [
    {
      title: 'Institutions',
      value: totalInstitutions,
      subtitle: `${activeInstitutions} active`,
      icon: <BankOutlined />,
      bgClass: 'bg-blue-500/10',
      colorClass: 'text-blue-500',
    },
    {
      title: 'Students',
      value: totalStudents,
      subtitle: `${activeStudents} active`,
      icon: <TeamOutlined />,
      bgClass: 'bg-emerald-500/10',
      colorClass: 'text-emerald-500',
    },
    {
      title: 'Active Internships',
      value: activeInternships,
      subtitle: `${totalInternships} students with approved internships`,
      icon: <BookOutlined />,
      bgClass: 'bg-pink-500/10',
      colorClass: 'text-pink-500',
      badge: activeInternships,
    },
    {
      title: 'Faculty',
      value: totalFaculty,
      subtitle: `${activeFaculty} active mentors`,
      icon: <UserOutlined />,
      bgClass: 'bg-amber-500/10',
      colorClass: 'text-amber-500',
    },
  ];

  // Detailed cards configuration - Mentor Assignments only (Reports/Visits moved to separate status cards)
  const detailedCards = [
    {
      title: 'Mentor Assignments',
      mainValue: assignments?.assigned || 0,
      mainLabel: 'Assigned',
      secondaryValue: assignments?.unassigned || 0,
      secondaryLabel: 'Unassigned',
      icon: <UserSwitchOutlined />,
      bgClass: 'bg-purple-500/10',
      colorClass: 'text-purple-500',
      badgeCount: assignments?.unassigned || 0,
      badgeStatus: 'warning',
      alertMessage: assignments?.unassigned > 0 ? `${assignments.unassigned} students need mentor assignment` : null,
      details: [
        { label: 'Total Students', value: assignments?.totalStudents || totalStudents || 0, icon: <TeamOutlined />, tooltip: 'Total number of students across all institutions' },
        { label: 'Students with Mentors', value: assignments?.assigned || 0, icon: <CheckCircleOutlined />, tooltip: 'Students who have an active mentor assigned' },
        { label: 'Students with no Mentor', value: assignments?.unassigned || 0, icon: <WarningOutlined />, highlight: (assignments?.unassigned || 0) > 0, tooltip: 'Students who do not have any mentor assigned (Total Students - Students with Mentors)' },
        { label: 'Total Internships', value: assignments?.studentsWithInternships || 0, icon: <BookOutlined />, tooltip: 'Total approved self-identified internships' },
        { label: 'Internships with Mentors', value: assignments?.internshipsWithMentors || 0, icon: <CheckCircleOutlined />, tooltip: 'Internships where the student has an active mentor assigned' },
        { label: 'Internships without Mentors', value: assignments?.internshipsWithoutMentors || 0, icon: <WarningOutlined />, highlight: (assignments?.internshipsWithoutMentors || 0) > 0, tooltip: 'Internships where the student does not have a mentor assigned' },
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

      {/* Compliance, Reports, and Visits Row */}
      <Row gutter={[16, 16]}>
        {/* Compliance Score Card - Color coded based on thresholds */}
        <Col xs={24} sm={12} lg={8}>
          <ComplianceScoreCard
            score={complianceScore}
            mentorRate={mentorRate}
            joiningLetterRate={joiningLetterRate}
          />
        </Col>

        {/* Report Status Card - No color indicator, just numbers */}
        <Col xs={24} sm={12} lg={8}>
          <StatusCard
            title="Report Status"
            submitted={reportsSubmitted}
            expected={reportsExpected}
            icon={<FileTextOutlined />}
            details={reportDetails}
            detailsTitle="Monthly Report Status"
          />
        </Col>

        {/* Visit Status Card - No color indicator, just numbers */}
        <Col xs={24} sm={12} lg={8}>
          <StatusCard
            title="Visit Status"
            submitted={visitsCompleted}
            expected={visitsExpected}
            icon={<CalendarOutlined />}
            details={visitDetails}
            detailsTitle="Faculty Visit Status"
          />
        </Col>
      </Row>

      {/* Detailed Stats Row - Mentor Assignments */}
      <Row gutter={[16, 16]}>
        {detailedCards.map((card, idx) => (
          <Col key={idx} xs={24} sm={24} lg={24}>
            <DetailedStatCard {...card} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default StatisticsCards;
