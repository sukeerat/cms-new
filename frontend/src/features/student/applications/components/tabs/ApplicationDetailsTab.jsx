import React from 'react';
import { Card, Typography, Tag, Avatar, Row, Col } from 'antd';
import {
  BankOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { formatDisplayDate, formatCurrency, getStatusColor } from '../../utils/applicationUtils';
import { getImageUrl } from '../../../../../utils/imageUtils';
import { getStatusIcon } from '../applicationHelpers';

const { Title, Text } = Typography;

const ApplicationDetailsTab = ({ application, isSelfIdentified, internship, industry }) => (
  <div className="space-y-6">
    {/* Company/Internship Info */}
    <Card className="rounded-xl">
      <div className="flex items-start gap-4">
        <Avatar
          src={industry?.logo ? getImageUrl(industry.logo) : null}
          icon={<BankOutlined />}
          size={64}
          className="bg-blue-100 text-blue-600"
        />
        <div className="flex-1">
          <Title level={4} className="mb-1">
            {isSelfIdentified
              ? application.companyName
              : industry?.companyName || 'N/A'}
          </Title>
          <Text type="secondary">
            {isSelfIdentified
              ? application.jobProfile
              : internship?.title || 'Internship'}
          </Text>
          <div className="mt-2">
            <Tag
              color={getStatusColor(application.status)}
              icon={getStatusIcon(application.status)}
              className="rounded-full"
            >
              {application.status?.replace(/_/g, ' ')}
            </Tag>
            {isSelfIdentified && (
              <Tag color="purple" className="ml-2">Self-Identified</Tag>
            )}
          </div>
        </div>
      </div>
    </Card>

    {/* Details Grid */}
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card className="rounded-xl h-full" title="Duration & Schedule">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-blue-500" />
              <div>
                <Text type="secondary" className="block text-xs">Start Date</Text>
                <Text>
                  {formatDisplayDate(
                    isSelfIdentified
                      ? application.startDate
                      : internship?.startDate
                  )}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-green-500" />
              <div>
                <Text type="secondary" className="block text-xs">End Date</Text>
                <Text>
                  {formatDisplayDate(
                    isSelfIdentified
                      ? application.endDate
                      : internship?.endDate
                  )}
                </Text>
              </div>
            </div>
            {!isSelfIdentified && internship?.stipend && (
              <div className="flex items-center gap-2">
                <StarOutlined className="text-yellow-500" />
                <div>
                  <Text type="secondary" className="block text-xs">Stipend</Text>
                  <Text>{formatCurrency(internship.stipend)}</Text>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card className="rounded-xl h-full" title="Contact Information">
          <div className="space-y-3">
            {(industry?.address || application.companyAddress) && (
              <div className="flex items-center gap-2">
                <EnvironmentOutlined className="text-red-500" />
                <div>
                  <Text type="secondary" className="block text-xs">Location</Text>
                  <Text>{industry?.address || application.companyAddress}</Text>
                </div>
              </div>
            )}
            {industry?.phone && (
              <div className="flex items-center gap-2">
                <PhoneOutlined className="text-green-500" />
                <div>
                  <Text type="secondary" className="block text-xs">Phone</Text>
                  <Text>{industry.phone}</Text>
                </div>
              </div>
            )}
            {industry?.email && (
              <div className="flex items-center gap-2">
                <MailOutlined className="text-blue-500" />
                <div>
                  <Text type="secondary" className="block text-xs">Email</Text>
                  <Text>{industry.email}</Text>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Col>
    </Row>

    {/* Mentor Info */}
    {application.mentor && (
      <Card className="rounded-xl" title="Assigned Mentor">
        <div className="flex items-center gap-4">
          <Avatar
            src={application.mentor.profileImage ? getImageUrl(application.mentor.profileImage) : null}
            icon={<UserOutlined />}
            size={48}
            className="bg-purple-100 text-purple-600"
          />
          <div>
            <Text strong>{application.mentor.name}</Text>
            <br />
            <Text type="secondary" className="text-sm">
              {application.mentor.designation || 'Faculty Mentor'}
            </Text>
            {application.mentor.email && (
              <div className="text-xs text-gray-500">{application.mentor.email}</div>
            )}
          </div>
        </div>
      </Card>
    )}
  </div>
);

export default ApplicationDetailsTab;
