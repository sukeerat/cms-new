import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Avatar,
  Typography,
  Modal,
  Spin,
  Empty,
  Alert,
  Tooltip,
  Badge,
  Collapse,
  List,
  Progress,
} from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  UserOutlined,
  BuildOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import {
  fetchAllCompanies,
  fetchCompanyDetails,
  selectAllCompanies,
  selectCompaniesPagination,
  selectCompaniesSummary,
  selectCompaniesLoading,
  selectSelectedCompany,
  selectSelectedCompanyDetails,
  selectCompanyDetailsLoading,
  selectCompaniesError,
  selectCompanyDetailsError,
  setSelectedCompany,
  clearSelectedCompany,
} from '../store/stateSlice';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// Debounce hook
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

const CompaniesOverview = () => {
  const dispatch = useDispatch();

  // Redux state
  const companies = useSelector(selectAllCompanies);
  const pagination = useSelector(selectCompaniesPagination);
  const summary = useSelector(selectCompaniesSummary);
  const loading = useSelector(selectCompaniesLoading);
  const selectedCompany = useSelector(selectSelectedCompany);
  const selectedCompanyDetails = useSelector(selectSelectedCompanyDetails);
  const detailsLoading = useSelector(selectCompanyDetailsLoading);
  const error = useSelector(selectCompaniesError);
  const detailsError = useSelector(selectCompanyDetailsError);

  // Local state
  const [searchInput, setSearchInput] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [sortBy, setSortBy] = useState('studentCount');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const debouncedSearch = useDebounce(searchInput);

  // Fetch companies
  const fetchCompanies = useCallback((params = {}) => {
    dispatch(fetchAllCompanies({
      page: params.page || currentPage,
      limit: params.limit || pageSize,
      search: params.search !== undefined ? params.search : debouncedSearch,
      industryType: params.industryType !== undefined ? params.industryType : industryType,
      sortBy: params.sortBy || sortBy,
      sortOrder: params.sortOrder || sortOrder,
      forceRefresh: params.forceRefresh,
    }));
  }, [dispatch, currentPage, pageSize, debouncedSearch, industryType, sortBy, sortOrder]);

  // Initial fetch
  useEffect(() => {
    fetchCompanies({ forceRefresh: true });
  }, []);

  // Fetch on filter changes
  useEffect(() => {
    fetchCompanies({ page: 1 });
    setCurrentPage(1);
  }, [debouncedSearch, industryType, sortBy, sortOrder]);

  // Handle view company details
  const handleViewDetails = (company) => {
    dispatch(setSelectedCompany(company));
    dispatch(fetchCompanyDetails(company.id));
    setDetailModalVisible(true);
  };

  // Handle modal close - delay clear to prevent flash during animation
  const handleCloseModal = () => {
    setDetailModalVisible(false);
    // Clear data after modal animation completes
    setTimeout(() => {
      dispatch(clearSelectedCompany());
    }, 300);
  };

  // Handle pagination change - force refresh to ensure fresh data
  const handleTableChange = (paginationConfig) => {
    setCurrentPage(paginationConfig.current);
    setPageSize(paginationConfig.pageSize);
    fetchCompanies({
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
      forceRefresh: true
    });
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  // Table columns
  const columns = useMemo(() => [
    {
      title: 'Company',
      key: 'company',
      width: 280,
      fixed: 'left',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            icon={<BankOutlined />}
            className={record.isSelfIdentifiedCompany
              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
              : 'bg-gradient-to-br from-blue-500 to-cyan-500'}
            size={44}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Text strong className="text-sm truncate max-w-[180px]" title={record.companyName}>
                {record.companyName || 'Unknown Company'}
              </Text>
              {record.isSelfIdentifiedCompany && (
                <Tag color="purple" className="text-[10px] px-1.5 py-0 m-0 rounded-full">
                  Self-Identified
                </Tag>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <EnvironmentOutlined className="text-[10px]" />
              <span className="truncate max-w-[200px]">
                {record.city && record.state
                  ? `${record.city}, ${record.state}`
                  : record.address || 'Location not specified'}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Industry',
      dataIndex: 'industryType',
      key: 'industryType',
      width: 140,
      render: (type, record) => (
        <Tag color={record.isSelfIdentifiedCompany ? 'purple' : 'cyan'} className="font-medium">
          {type || 'General'}
        </Tag>
      ),
    },
    {
      title: 'Total Students',
      key: 'totalStudents',
      width: 120,
      align: 'center',
      sorter: false,
      render: (_, record) => (
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-blue-600">{record.totalStudents || 0}</div>
          <div className="text-[10px] text-gray-500">students</div>
        </div>
      ),
    },
    {
      title: 'Institutions',
      key: 'institutionCount',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-green-600">{record.institutionCount || 0}</div>
          <div className="text-[10px] text-gray-500">institutions</div>
        </div>
      ),
    },
    {
      title: 'Top Institutions',
      key: 'institutions',
      width: 220,
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          {record.institutions?.slice(0, 2).map((inst, i) => (
            <Tooltip key={i} title={`${inst.name}: ${inst.studentCount} students`}>
              <Tag className="text-xs m-0" color="blue">
                {inst.code || inst.name?.substring(0, 10)}: {inst.studentCount}
              </Tag>
            </Tooltip>
          ))}
          {record.institutions?.length > 2 && (
            <Tooltip title={record.institutions.slice(2).map(i => `${i.name}: ${i.studentCount}`).join(', ')}>
              <Tag className="text-xs m-0 cursor-pointer" color="default">
                +{record.institutions.length - 2} more
              </Tag>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex flex-col items-center gap-1">
          {record.isSelfIdentifiedCompany ? (
            <Tag icon={<CheckCircleOutlined />} color="success" className="m-0">
              Auto-Approved
            </Tag>
          ) : (
            <>
              {record.isApproved ? (
                <Tag icon={<CheckCircleOutlined />} color="success" className="m-0">Approved</Tag>
              ) : record.isVerified ? (
                <Tag icon={<SafetyCertificateOutlined />} color="processing" className="m-0">Verified</Tag>
              ) : (
                <Tag icon={<ClockCircleOutlined />} color="warning" className="m-0">Pending</Tag>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ], []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Title level={3} className="!mb-1 flex items-center gap-2">
            <BankOutlined className="text-blue-500" />
            Companies Overview
          </Title>
          <Text type="secondary">
            View all companies across institutions with student placements
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchCompanies({ forceRefresh: true })}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                <BankOutlined className="text-white text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{summary?.totalCompanies || 0}</div>
                <div className="text-xs text-gray-500">Total Companies</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <TeamOutlined className="text-white text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{summary?.totalStudentsPlaced || 0}</div>
                <div className="text-xs text-gray-500">Total Students Placed</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                <SafetyCertificateOutlined className="text-white text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{summary?.totalSelfIdentified || 0}</div>
                <div className="text-xs text-gray-500">Self-Identified Placements</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-700 border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                <RiseOutlined className="text-white text-xl" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{summary?.selfIdentifiedRate || 0}%</div>
                <div className="text-xs text-gray-500">Self-Identified Rate</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small">
        <div className="flex flex-wrap items-center gap-4">
          <Input.Search
            placeholder="Search companies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: 280 }}
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
          />
          <Select
            placeholder="Industry Type"
            value={industryType || undefined}
            onChange={setIndustryType}
            allowClear
            style={{ width: 180 }}
          >
            {summary?.industryTypes?.map((type) => (
              <Select.Option key={type} value={type}>{type}</Select.Option>
            ))}
          </Select>
          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 160 }}
          >
            <Select.Option value="studentCount">Sort by Students</Select.Option>
            <Select.Option value="institutionCount">Sort by Institutions</Select.Option>
            <Select.Option value="companyName">Sort by Name</Select.Option>
          </Select>
          <Button
            icon={sortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
            onClick={toggleSortOrder}
          >
            {sortOrder === 'desc' ? 'Desc' : 'Asc'}
          </Button>
        </div>
      </Card>

      {/* Error Alert */}
      {error && <Alert type="error" message={error} showIcon closable />}

      {/* Companies Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={companies}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} companies`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="middle"
          className="[&_.ant-table-thead>tr>th]:bg-gray-50 dark:[&_.ant-table-thead>tr>th]:bg-slate-800"
          rowClassName={(record) => record.isSelfIdentifiedCompany ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}
        />
      </Card>

      {/* Company Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <Avatar
              icon={<BankOutlined />}
              className={selectedCompanyDetails?.isSelfIdentifiedCompany
                ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                : 'bg-gradient-to-br from-blue-500 to-cyan-500'}
              size={44}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{selectedCompanyDetails?.companyName || 'Company Details'}</span>
                {selectedCompanyDetails?.isSelfIdentifiedCompany && (
                  <Tag color="purple" className="text-xs">Self-Identified</Tag>
                )}
              </div>
              <Text type="secondary" className="text-xs font-normal">
                {selectedCompanyDetails?.totalStudents || 0} students across {selectedCompanyDetails?.institutionCount || 0} institutions
              </Text>
            </div>
          </div>
        }
        open={detailModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={1000}
        destroyOnClose
      >
        {detailsLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" tip="Loading company details..." />
          </div>
        ) : detailsError ? (
          <div className="py-12">
            <Alert
              type="error"
              message="Failed to load company details"
              description={detailsError}
              action={
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    if (selectedCompany?.id) {
                      dispatch(fetchCompanyDetails(selectedCompany.id));
                    }
                  }}
                >
                  Retry
                </Button>
              }
              showIcon
            />
          </div>
        ) : selectedCompanyDetails ? (
          <div className="space-y-4 mt-4">
            {/* Company Info */}
            <Card
              size="small"
              className={selectedCompanyDetails.isSelfIdentifiedCompany
                ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50'
                : 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50'}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={8}>
                  <div className="flex items-center gap-2 mb-1">
                    <BuildOutlined className="text-gray-400" />
                    <Text type="secondary" className="text-xs">Industry Type</Text>
                  </div>
                  <Tag color={selectedCompanyDetails.isSelfIdentifiedCompany ? 'purple' : 'cyan'}>
                    {selectedCompanyDetails.industryType || 'General'}
                  </Tag>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="flex items-center gap-2 mb-1">
                    <EnvironmentOutlined className="text-gray-400" />
                    <Text type="secondary" className="text-xs">Location</Text>
                  </div>
                  <Text>
                    {selectedCompanyDetails.city && selectedCompanyDetails.state
                      ? `${selectedCompanyDetails.city}, ${selectedCompanyDetails.state}`
                      : selectedCompanyDetails.address || 'Not specified'}
                  </Text>
                </Col>
                <Col xs={24} sm={8}>
                  <div className="flex items-center gap-2 mb-1">
                    <SafetyCertificateOutlined className="text-gray-400" />
                    <Text type="secondary" className="text-xs">Status</Text>
                  </div>
                  {selectedCompanyDetails.isSelfIdentifiedCompany ? (
                    <Tag icon={<CheckCircleOutlined />} color="success">Auto-Approved</Tag>
                  ) : (
                    <Space>
                      {selectedCompanyDetails.isApproved && <Tag color="success">Approved</Tag>}
                      {selectedCompanyDetails.isVerified && <Tag color="processing">Verified</Tag>}
                    </Space>
                  )}
                </Col>
                {(selectedCompanyDetails.email || selectedCompanyDetails.phone) && (
                  <>
                    <Col xs={24} sm={12}>
                      <div className="flex items-center gap-2 mb-1">
                        <MailOutlined className="text-gray-400" />
                        <Text type="secondary" className="text-xs">Email</Text>
                      </div>
                      <Text>{selectedCompanyDetails.email || 'N/A'}</Text>
                    </Col>
                    <Col xs={24} sm={12}>
                      <div className="flex items-center gap-2 mb-1">
                        <PhoneOutlined className="text-gray-400" />
                        <Text type="secondary" className="text-xs">Phone</Text>
                      </div>
                      <Text>{selectedCompanyDetails.phone || 'N/A'}</Text>
                    </Col>
                  </>
                )}
              </Row>
            </Card>

            {/* Institutions Breakdown */}
            <Card size="small" title={<><TeamOutlined className="mr-2" />Institutions ({selectedCompanyDetails.institutions?.length || 0})</>}>
              <Collapse accordion>
                {selectedCompanyDetails.institutions?.map((institution, idx) => (
                  <Panel
                    key={idx}
                    header={
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <Avatar size="small" className="bg-blue-500">{institution.code?.[0] || 'I'}</Avatar>
                          <div>
                            <Text strong>{institution.name}</Text>
                            <Text type="secondary" className="ml-2 text-xs">({institution.code})</Text>
                          </div>
                        </div>
                        <Badge count={institution.studentCount} className="[&_.ant-badge-count]:!bg-blue-500" />
                      </div>
                    }
                  >
                    <div className="space-y-3">
                      {/* Branch Distribution */}
                      {institution.branchWiseData?.length > 0 && (
                        <div className="mb-3">
                          <Text type="secondary" className="text-xs mb-2 block">Branch Distribution:</Text>
                          <div className="flex flex-wrap gap-2">
                            {institution.branchWiseData.map((b, i) => (
                              <Tag key={i} color="blue">{b.branch}: {b.count}</Tag>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Students Table */}
                      <Table
                        dataSource={institution.students || []}
                        columns={[
                          {
                            title: 'Student',
                            key: 'student',
                            render: (_, record) => (
                              <div className="flex items-center gap-2">
                                <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
                                <div>
                                  <div className="font-medium text-sm">{record.name}</div>
                                  <div className="text-xs text-gray-500">{record.email}</div>
                                </div>
                              </div>
                            ),
                          },
                          { title: 'Roll No.', dataIndex: 'rollNumber', key: 'rollNumber', width: 100 },
                          {
                            title: 'Branch',
                            dataIndex: 'branch',
                            key: 'branch',
                            width: 120,
                            render: (text) => <Tag color="blue">{text || 'N/A'}</Tag>,
                          },
                          {
                            title: 'Job Profile',
                            dataIndex: 'jobProfile',
                            key: 'jobProfile',
                            width: 150,
                            render: (text) => text || '-',
                          },
                          {
                            title: 'Status',
                            dataIndex: 'status',
                            key: 'status',
                            width: 100,
                            render: (status) => (
                              <Tag color={status === 'JOINED' || status === 'COMPLETED' ? 'green' : 'blue'}>
                                {status}
                              </Tag>
                            ),
                          },
                          {
                            title: 'Joining Letter',
                            dataIndex: 'hasJoiningLetter',
                            key: 'hasJoiningLetter',
                            width: 100,
                            render: (val) => val ? (
                              <Tag color="green" icon={<CheckCircleOutlined />}>Yes</Tag>
                            ) : (
                              <Tag color="default">No</Tag>
                            ),
                          },
                        ]}
                        rowKey="id"
                        pagination={{ pageSize: 5, size: 'small' }}
                        size="small"
                      />
                    </div>
                  </Panel>
                ))}
              </Collapse>
              {(!selectedCompanyDetails.institutions || selectedCompanyDetails.institutions.length === 0) && (
                <Empty description="No institutions found" />
              )}
            </Card>
          </div>
        ) : (
          <Empty description="No data available" />
        )}
      </Modal>
    </div>
  );
};

export default CompaniesOverview;
