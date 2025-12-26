import React from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

const StatCard = ({
  icon,
  title,
  value,
  bgClass,
  colorClass,
  suffix,
}) => {
  return (
    <Card
      size="small"
      className="rounded-2xl border border-border hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-default"
      styles={{ body: { padding: '16px' } }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgClass}`}>
          {React.cloneElement(icon, { className: `text-xl ${colorClass}` })}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <Text className="text-2xl font-bold text-gray-900">
              {value ?? 0}
            </Text>
            {suffix && (
              <Text className="text-sm text-gray-500">{suffix}</Text>
            )}
          </div>
          <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
