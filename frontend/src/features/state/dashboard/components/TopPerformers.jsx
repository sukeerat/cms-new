import React from 'react';
import { Card, List, Avatar, Typography, Tag, Progress, Empty, Tooltip, Badge, Space } from 'antd';
import {
  TrophyOutlined,
  CrownOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  UserSwitchOutlined,
  CalendarOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;

// Calculate compliance score from stats
const calculateComplianceScore = (item) => {
  // If item already has a score or placementRate, use that
  if (item.score !== undefined) return item.score;
  if (item.placementRate !== undefined) return item.placementRate;

  // Calculate from stats if available
  const stats = item.stats;
  if (!stats) return 0;

  const { studentsWithInternships, assigned, facultyVisits, reportsSubmitted } = stats;
  if (studentsWithInternships === 0) return 100;

  const assignmentScore = (assigned / studentsWithInternships) * 100;
  const visitScore = facultyVisits > 0 ? Math.min((facultyVisits / studentsWithInternships) * 100, 100) : 0;
  const reportScore = (reportsSubmitted / studentsWithInternships) * 100;

  return Math.round((assignmentScore + visitScore + reportScore) / 3);
};

const PerformerItem = ({ item, rank, type }) => {
  const isTop = type === 'top';
  const score = calculateComplianceScore(item);

  const getRankClass = (rank) => {
    if (rank === 0) return 'bg-yellow-400';
    if (rank === 1) return 'bg-gray-400';
    if (rank === 2) return 'bg-amber-600';
    return 'bg-gray-500';
  };

  const stats = item.stats || {};

  return (
    <List.Item className="!px-0 !py-2">
      <div className="flex items-center w-full gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getRankClass(rank)}`}
        >
          {rank + 1}
        </div>
        <Avatar
          icon={<BankOutlined />}
          className={isTop ? 'bg-success' : 'bg-error'}
          src={item.logo}
          size="small"
        />
        <div className="flex-1 min-w-0">
          <Tooltip title={item.name}>
            <Text strong className="block truncate text-sm text-slate-900 dark:text-slate-200">{item.name}</Text>
          </Tooltip>
          {stats.studentsWithInternships !== undefined ? (
            <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Tooltip title="Internships">
                <span>{stats.studentsWithInternships || 0} interns</span>
              </Tooltip>
              {stats.unassigned > 0 && (
                <Tooltip title="Unassigned students">
                  <Tag color="warning" className="text-xs m-0 leading-tight">
                    <WarningOutlined /> {stats.unassigned}
                  </Tag>
                </Tooltip>
              )}
            </div>
          ) : (
            <Text className="text-xs text-slate-500 dark:text-slate-400">
              {item.city || item.shortName || 'Institution'}
            </Text>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            {isTop ? (
              <RiseOutlined className="text-success" />
            ) : (
              <FallOutlined className="text-error" />
            )}
            <Text
              strong
              className={isTop ? 'text-success' : 'text-error'}
            >
              {score}%
            </Text>
          </div>
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            compliance
          </Text>
        </div>
      </div>
    </List.Item>
  );
};

const TopPerformers = ({ topPerformers = [], bottomPerformers = [], loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Performers */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <TrophyOutlined className="text-warning" />
            <span>Top Performers</span>
            <Tag color="success" className="ml-2">Best Compliance</Tag>
          </div>
        }
        className="shadow-sm border-slate-200 dark:border-slate-800"
        loading={loading}
        size="small"
      >
        {topPerformers.length > 0 ? (
          <List
            dataSource={topPerformers.slice(0, 5)}
            renderItem={(item, index) => (
              <PerformerItem item={item} rank={index} type="top" />
            )}
            split={false}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No data available"
          />
        )}
      </Card>

      {/* Bottom Performers (Needs Attention) */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <WarningOutlined className="text-warning" />
            <span>Needs Attention</span>
            <Tag color="warning" className="ml-2">Low Compliance</Tag>
          </div>
        }
        className="shadow-sm border-slate-200 dark:border-slate-800"
        loading={loading}
        size="small"
      >
        {bottomPerformers.length > 0 ? (
          <List
            dataSource={bottomPerformers.slice(0, 5)}
            renderItem={(item, index) => (
              <PerformerItem item={item} rank={index} type="bottom" />
            )}
            split={false}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="All institutions performing well"
          />
        )}
      </Card>
    </div>
  );
};

export default TopPerformers;
