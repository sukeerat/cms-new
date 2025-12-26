import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Tag, Avatar, Input, Select, Card, Modal, message, Dropdown } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents, deleteStudent, updateStudent, fetchDepartments, fetchBatches, optimisticallyDeleteStudent, rollbackStudentOperation } from '../store/principalSlice';
import DataTable from '../../../components/tables/DataTable';
import {
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { getStatusColor } from '../../../utils/format';
import { generateTxnId, snapshotManager, optimisticToast } from '../../../store/optimisticMiddleware';
import StudentModal from './StudentModal';

const { Search } = Input;
const { Option } = Select;

// Fallback departments list
const DEFAULT_DEPARTMENTS = [
  { id: 'cse', name: 'CSE - Computer Science Engineering' },
  { id: 'it', name: 'IT - Information Technology' },
  { id: 'ece', name: 'ECE - Electronics & Communication' },
  { id: 'ee', name: 'EE - Electrical Engineering' },
  { id: 'me', name: 'ME - Mechanical Engineering' },
  { id: 'ce', name: 'CE - Civil Engineering' },
  { id: 'lt', name: 'LT - Leather Technology' },
];

const StudentList = () => {
  const dispatch = useDispatch();
  const { list, loading, pagination } = useSelector((state) => state.principal.students);
  const departmentsFromStore = useSelector((state) => state.principal.departments.list);
  const batches = useSelector((state) => state.principal.batches?.list || []);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    branchId: '',
    batchId: '',
    isActive: '',
    page: 1,
    limit: 10,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

  // Use store departments if available, otherwise use fallback
  const departments = departmentsFromStore?.length > 0 ? departmentsFromStore : DEFAULT_DEPARTMENTS;

  const handleOpenModal = (studentId = null) => {
    setEditingStudentId(studentId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingStudentId(null);
  };

  const handleModalSuccess = () => {
    dispatch(fetchStudents({ ...filters, forceRefresh: true }));
  };

  // Debounced search effect - 300ms delay
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    dispatch(fetchStudents(filters));
    dispatch(fetchDepartments());
    dispatch(fetchBatches());
  }, [dispatch, filters]);

  const handleView = (record) => {
    handleOpenModal(record.id);
  };

  const handleEdit = (record) => {
    handleOpenModal(record.id);
  };

  const handleToggleStatus = async (record) => {
    const newStatus = !record.isActive;
    const actionText = newStatus ? 'activate' : 'deactivate';

    Modal.confirm({
      title: `${newStatus ? 'Activate' : 'Deactivate'} Student`,
      content: `Are you sure you want to ${actionText} ${record.name}?`,
      okText: newStatus ? 'Activate' : 'Deactivate',
      okType: newStatus ? 'primary' : 'danger',
      onOk: async () => {
        try {
          await dispatch(updateStudent({
            id: record.id,
            data: { isActive: newStatus }
          })).unwrap();
          message.success(`Student ${newStatus ? 'activated' : 'deactivated'} successfully`);
          dispatch(fetchStudents({ ...filters, forceRefresh: true }));
        } catch (error) {
          message.error(error || `Failed to ${actionText} student`);
        }
      },
    });
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Student',
      content: `Are you sure you want to delete ${record.name}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        const txnId = generateTxnId();

        // Save snapshot of current state
        const currentStudentsList = list;
        snapshotManager.save(txnId, 'principal', { students: { list: currentStudentsList } });

        // Show loading toast
        optimisticToast.loading(txnId, 'Deleting student...');

        // Optimistically remove from UI
        dispatch(optimisticallyDeleteStudent(record.id));

        try {
          // Perform actual deletion
          await dispatch(deleteStudent(record.id)).unwrap();

          // Show success toast
          optimisticToast.success(txnId, 'Student deleted successfully');

          // Clean up snapshot
          snapshotManager.delete(txnId);

          // Refresh the list to ensure consistency
          dispatch(fetchStudents({ ...filters, forceRefresh: true }));
        } catch (error) {
          // Show error toast
          optimisticToast.error(txnId, error || 'Failed to delete student');

          // Rollback the optimistic update
          const snapshot = snapshotManager.get(txnId);
          if (snapshot) {
            dispatch(rollbackStudentOperation(snapshot.state.students));
            snapshotManager.delete(txnId);
          }
        }
      },
    });
  };

  const getActionMenuItems = (record) => [
    {
      key: 'view',
      label: 'View Details',
      icon: <EyeOutlined />,
      onClick: () => handleView(record),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => handleEdit(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'toggle',
      label: record.isActive ? 'Deactivate' : 'Activate',
      icon: record.isActive ? <StopOutlined /> : <CheckCircleOutlined />,
      onClick: () => handleToggleStatus(record),
      danger: record.isActive,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => handleDelete(record),
      danger: true,
    },
  ];

  // Memoized columns definition
  const columns = useMemo(() => [
    {
      title: 'Student',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-xs text-text-tertiary">{record.rollNumber}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'branchName',
      key: 'branchName',
      render: (branchName, record) => branchName || record.branch?.name || '-',
    },
    {
      title: 'Batch',
      dataIndex: 'batchName',
      key: 'batchName',
      render: (batchName, record) => batchName || record.batch?.name || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, record) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: '18px' }} />}
            className="flex items-center justify-center"
          />
        </Dropdown>
      ),
    },
  ], [filters, list]);

  const handleSearch = useCallback((value) => {
    setSearchInput(value);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    // Convert undefined to empty string (Select allowClear passes undefined)
    setFilters(prev => ({ ...prev, [key]: value ?? '', page: 1 }));
  }, []);

  const handlePageChange = useCallback((page, pageSize) => {
    setFilters(prev => ({ ...prev, page, limit: pageSize }));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">Students</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          className="rounded-lg shadow-md shadow-primary/20"
        >
          Add Student
        </Button>
      </div>

      <Card className="rounded-xl border-border shadow-sm">
        <div className="flex gap-4 flex-wrap">
          <Search
            placeholder="Search by name or roll number"
            allowClear
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={handleSearch}
            className="w-full md:w-[300px]"
            prefix={<SearchOutlined className="text-text-tertiary" />}
          />
          <Select
            placeholder="Department"
            allowClear
            className="w-full md:w-[200px]"
            onChange={(value) => handleFilterChange('branchId', value)}
          >
            {departments?.map(dept => (
              <Option key={dept.id} value={dept.id}>{dept.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="Batch/Year"
            allowClear
            className="w-full md:w-[150px]"
            onChange={(value) => handleFilterChange('batchId', value)}
          >
            {batches?.map(batch => (
              <Option key={batch.id} value={batch.id}>{batch.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="Status"
            allowClear
            className="w-full md:w-[150px]"
            onChange={(value) => handleFilterChange('isActive', value)}
          >
            <Option value="true">Active</Option>
            <Option value="false">Inactive</Option>
          </Select>
        </div>
      </Card>

      <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          dataSource={list}
          loading={loading}
          rowKey="id"
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            total: pagination?.total || 0,
            onChange: handlePageChange,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} students`,
          }}
        />
      </div>

      <StudentModal
        open={modalOpen}
        onClose={handleCloseModal}
        studentId={editingStudentId}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default StudentList;
