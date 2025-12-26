import React from 'react';
import {
  LaptopOutlined,
  CheckCircleOutlined,
  StarOutlined,
  RocketOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import StatCard from './StatCard';

const StatisticsGrid = ({ stats, counts }) => {
  const safeStats = stats || {};
  // counts comes from profile._count for accurate server-side values
  const safeCounts = counts || {};

  const cardConfigs = [
    {
      title: 'Total Applications',
      // Prefer _count value from profile for accurate server-side count
      value: safeCounts.internshipApplications ?? safeStats.totalApplications ?? 0,
      icon: <LaptopOutlined />,
      bgClass: 'bg-blue-50',
      colorClass: 'text-blue-500',
    },
    {
      title: 'Active Internships',
      value: safeStats.ongoingInternships ?? safeStats.selectedApplications ?? 0,
      icon: <CheckCircleOutlined />,
      bgClass: 'bg-green-50',
      colorClass: 'text-green-500',
    },
    {
      title: 'Monthly Reports',
      // Use _count.monthlyReports for accurate count
      value: safeCounts.monthlyReports ?? safeStats.totalMonthlyReports ?? 0,
      icon: <FileTextOutlined />,
      bgClass: 'bg-purple-50',
      colorClass: 'text-purple-500',
    },
    {
      title: 'Self-Identified',
      value: safeStats.selfIdentifiedCount ?? 0,
      icon: <RocketOutlined />,
      bgClass: 'bg-cyan-50',
      colorClass: 'text-cyan-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cardConfigs.map((card, idx) => (
        <StatCard key={idx} {...card} />
      ))}
    </div>
  );
};

export default StatisticsGrid;
