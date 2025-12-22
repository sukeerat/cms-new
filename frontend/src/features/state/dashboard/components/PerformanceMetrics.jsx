import React, { useState } from 'react';
import { Card, Progress, Row, Col, Statistic, Typography, Tooltip, Segmented, Empty } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DotChartOutlined,
  UserSwitchOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BookOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';

const { Text } = Typography;

const MetricItem = ({ label, value, color, icon, description }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        {icon}
        <Text strong className="text-sm">{label}</Text>
      </div>
      <Tooltip title={description}>
        <Text className="font-semibold">
          {value}%
        </Text>
      </Tooltip>
    </div>
    <Progress
      percent={value}
      showInfo={false}
      size="small"
      strokeColor={color}
    />
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface p-3 shadow-lg rounded-lg border border-border">
        <p className="font-semibold text-text-primary">{data.label}</p>
        <p className="text-sm" style={{ color: data.color }}>
          Value: <span className="font-bold">{data.value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const PerformanceMetrics = ({ stats }) => {
  const [viewMode, setViewMode] = useState('progress');

  // Self-identified internship rate
  const totalStudents = Number(stats?.students?.total ?? stats?.totalStudents ?? 0) || 0;
  const activeInternships = Number(stats?.internships?.active ?? stats?.activeInternships ?? 0) || 0;
  const internshipRate = totalStudents > 0 ? Math.round((activeInternships / totalStudents) * 100) : 0;

  // Mentor assignment rate
  const assignments = stats?.assignments || {};
  const studentsWithInternships = Number(assignments?.studentsWithInternships ?? activeInternships) || 0;
  const assignedStudents = Number(assignments?.assigned ?? 0) || 0;
  const assignmentRate = studentsWithInternships > 0 ? Math.round((assignedStudents / studentsWithInternships) * 100) : 0;

  // Faculty visit rate (this month)
  const facultyVisits = stats?.facultyVisits || {};
  const visitsThisMonth = Number(facultyVisits?.thisMonth ?? 0) || 0;
  const expectedVisits = Number(facultyVisits?.expectedThisMonth ?? studentsWithInternships) || 0;
  const visitRate = expectedVisits > 0 ? Math.round((visitsThisMonth / expectedVisits) * 100) : 0;

  // Monthly report submission rate
  const monthlyReports = stats?.monthlyReports || {};
  const reportsSubmitted = Number(monthlyReports?.thisMonth ?? 0) || 0;
  const expectedReports = Number(monthlyReports?.expectedThisMonth ?? studentsWithInternships) || 0;
  const reportRate = expectedReports > 0 ? Math.round((reportsSubmitted / expectedReports) * 100) : 0;

  const metrics = [
    {
      label: 'Internship Coverage',
      value: internshipRate,
      color: '#ec4899',
      icon: <BookOutlined className="text-pink-500" />,
      description: 'Percentage of students with active self-identified internships',
    },
    {
      label: 'Mentor Assignment',
      value: assignmentRate,
      color: '#8b5cf6',
      icon: <UserSwitchOutlined className="text-purple-500" />,
      description: 'Percentage of interns with assigned mentors',
    },
    {
      label: 'Faculty Visit Compliance',
      value: visitRate,
      color: '#06b6d4',
      icon: <CalendarOutlined className="text-cyan-500" />,
      description: 'Faculty visits completed this month vs expected',
    },
    {
      label: 'Report Submission',
      value: reportRate,
      color: '#f97316',
      icon: <FileTextOutlined className="text-orange-500" />,
      description: 'Monthly reports submitted this month vs expected',
    },
  ];

  // Data for bar chart
  const barChartData = metrics.map((m) => ({
    label: m.label.split(' ')[0],
    value: m.value,
    color: m.color,
  }));

  // Data for radar chart
  const radarData = metrics.map((m) => ({
    subject: m.label.split(' ')[0],
    current: m.value,
    target: 85,
  }));

  const renderProgressView = () => (
    <div className="space-y-2">
      {metrics.map((metric, index) => (
        <MetricItem key={index} {...metric} />
      ))}
    </div>
  );

  const renderBarChartView = () => (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={barChartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#666' }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 10, fill: '#666' }} domain={[0, 100]} />
          <RechartsTooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={35}>
            {barChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderRadarChartView = () => (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#666' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8, fill: '#999' }} />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Radar
            name="Target"
            dataKey="target"
            stroke="#52c41a"
            fill="#52c41a"
            fillOpacity={0.2}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );

  const hasData = metrics.some((m) => m.value > 0);

  // Calculate overall compliance score
  const overallScore = Math.round((internshipRate + assignmentRate + visitRate + reportRate) / 4);

  return (
    <Card
      title="Compliance Overview"
      className="shadow-sm h-full"
      extra={
        <Segmented
          size="small"
          options={[
            { value: 'progress', icon: <LineChartOutlined /> },
            { value: 'bar', icon: <BarChartOutlined /> },
            { value: 'radar', icon: <DotChartOutlined /> },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      }
    >
      {hasData ? (
        viewMode === 'progress' ? renderProgressView() :
        viewMode === 'bar' ? renderBarChartView() :
        renderRadarChartView()
      ) : (
        <Empty description="No performance data available" />
      )}

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-border">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={<span className="text-xs">Overall Score</span>}
              value={overallScore}
              suffix="%"
              valueStyle={{
                color: overallScore >= 75 ? '#52c41a' : overallScore >= 50 ? '#faad14' : '#f5222d',
                fontSize: '20px'
              }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={<span className="text-xs">Active Interns</span>}
              value={activeInternships}
              valueStyle={{ fontSize: '20px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={<span className="text-xs">Pending Actions</span>}
              value={(assignments?.unassigned || 0) + (monthlyReports?.missingThisMonth || 0)}
              valueStyle={{
                color: '#f5222d',
                fontSize: '20px'
              }}
            />
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default PerformanceMetrics;
