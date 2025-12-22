import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Button, Select, Switch, message, Spin, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { createStaff, updateStaff, fetchStaffById, fetchInstitutions } from '../store/stateSlice';
import stateService from '../../../services/state.service';

const StaffForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const { list: institutions } = useSelector((state) => state.state.institutions);

  useEffect(() => {
    // Load institutions for dropdown
    dispatch(fetchInstitutions({ limit: 500 }));
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode) {
      loadStaffData();
    }
  }, [id]);

  const loadStaffData = async () => {
    try {
      setInitialLoading(true);
      const data = await stateService.getStaffById(id);
      form.setFieldsValue({
        name: data.name,
        email: data.email,
        phoneNo: data.phoneNo,
        role: data.role,
        institutionId: data.institutionId,
        branchName: data.branchName,
        designation: data.designation,
        active: data.active !== false,
      });
    } catch (error) {
      message.error('Failed to load staff data');
      navigate('/state-staff');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      if (isEditMode) {
        // Don't send password on update
        const { password, ...updateData } = values;
        await dispatch(updateStaff({ id, data: updateData })).unwrap();
        message.success('Staff member updated successfully');
      } else {
        await dispatch(createStaff(values)).unwrap();
        message.success('Staff member created successfully');
      }

      navigate('/state-staff', { state: { refresh: true } });
    } catch (error) {
      message.error(error?.message || `Failed to ${isEditMode ? 'update' : 'create'} staff member`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/state-staff')}
            />
            <span>{isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}</span>
          </Space>
        }
        variant="borderless"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            active: true,
            role: 'TEACHER',
          }}
          className="max-w-2xl"
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter staff name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter email address" disabled={isEditMode} />
          </Form.Item>

          {!isEditMode && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password placeholder="Enter password (min 8 characters)" />
            </Form.Item>
          )}

          <Form.Item
            name="phoneNo"
            label="Phone Number"
            rules={[
              { pattern: /^[0-9]{10}$/, message: 'Phone number must be 10 digits' },
            ]}
          >
            <Input placeholder="Enter 10-digit phone number" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select role">
              <Select.Option value="TEACHER">Teacher</Select.Option>
              <Select.Option value="FACULTY_SUPERVISOR">Faculty Supervisor</Select.Option>
              <Select.Option value="PLACEMENT_OFFICER">Placement Officer</Select.Option>
              <Select.Option value="ACCOUNTANT">Accountant</Select.Option>
              <Select.Option value="ADMISSION_OFFICER">Admission Officer</Select.Option>
              <Select.Option value="EXAMINATION_OFFICER">Examination Officer</Select.Option>
              <Select.Option value="PMS_OFFICER">PMS Officer</Select.Option>
              <Select.Option value="EXTRACURRICULAR_HEAD">Extracurricular Head</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="institutionId"
            label="Institution"
            rules={[{ required: true, message: 'Please select an institution' }]}
          >
            <Select
              placeholder="Select institution"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {institutions?.map(inst => (
                <Select.Option key={inst.id} value={inst.id}>
                  {inst.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="branchName"
            label="Branch"
          >
            <Input placeholder="Enter branch (e.g., CSE, ECE, ME)" />
          </Form.Item>

          <Form.Item
            name="designation"
            label="Designation"
          >
            <Input placeholder="Enter designation (e.g., Assistant Professor)" />
          </Form.Item>

          {isEditMode && (
            <Form.Item
              name="active"
              label="Active Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          )}

          <Form.Item className="mt-6">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
              >
                {isEditMode ? 'Update Staff' : 'Create Staff'}
              </Button>
              <Button onClick={() => navigate('/state-staff')}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StaffForm;
