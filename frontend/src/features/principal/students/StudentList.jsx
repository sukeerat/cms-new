import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Button, Space, Tag, Avatar, Input, Select, Card, Modal, message } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStudents, deleteStudent, fetchDepartments, optimisticallyDeleteStudent, rollbackStudentOperation } from '../store/principalSlice';
import DataTable from '../../../components/tables/DataTable';
import { EyeOutlined, EditOutlined, UserOutlined, SearchOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getStatusColor } from '../../../utils/format';
import { generateTxnId, snapshotManager, optimisticToast } from '../../../store/optimisticMiddleware';
import StudentModal from './StudentModal';

const { Search } = Input;
const { Option } = Select;

const StudentList = () => {
  const dispatch = useDispatch();
  const { list, loading, pagination } = useSelector((state) => state.principal.students);
  const departments = useSelector((state) => state.principal.departments.list);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    year: '',
    status: '',
    page: 1,
    limit: 10,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);

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
  }, [dispatch, filters]);

  const handleView = (record) => {
    handleOpenModal(record.id);
  };

  const handleEdit = (record) => {
    handleOpenModal(record.id);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Delete Student',
      content: `Are you sure you want to delete ${record.name}? This will deactivate their account.`,
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

  // Memoized columns definition
  const columns = useMemo(() => [
    {
      title: 'Student',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: 'Roll Number',
      dataIndex: 'rollNumber',
      key: 'rollNumber',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      sorter: (a, b) => a.year - b.year,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ], []);

  const handleSearch = useCallback((value) => {
    setSearchInput(value);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
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
            onChange={(value) => handleFilterChange('department', value)}
          >
            {departments?.map(dept => (
              <Option key={dept.id} value={dept.id}>{dept.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="Year"
            allowClear
            className="w-full md:w-[150px]"
            onChange={(value) => handleFilterChange('year', value)}
          >
            <Option value="1">1st Year</Option>
            <Option value="2">2nd Year</Option>
            <Option value="3">3rd Year</Option>
            <Option value="4">4th Year</Option>
          </Select>
          <Select
            placeholder="Status"
            allowClear
            className="w-full md:w-[150px]"
            onChange={(value) => handleFilterChange('status', value)}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="graduated">Graduated</Option>
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