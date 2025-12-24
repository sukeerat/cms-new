import React, { useEffect, useState } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col, message, Upload, Spin, Modal, Divider } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { createStudent, updateStudent, fetchStudents, fetchBatches, fetchDepartments } from '../store/principalSlice';
import { UploadOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const StudentModal = ({ open, onClose, studentId, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  const { students, batches, departments } = useSelector(state => state.principal);
  const student = studentId ? students.list?.find(s => s.id === studentId) : null;
  const isEditMode = !!studentId;

  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setInitialLoading(true);
        try {
          await Promise.all([
            dispatch(fetchBatches()),
            dispatch(fetchDepartments()),
            studentId && !student ? dispatch(fetchStudents({})) : Promise.resolve(),
          ]);
        } finally {
          setInitialLoading(false);
        }
      };
      loadData();
    }
  }, [dispatch, studentId, student, open]);

  useEffect(() => {
    if (open && student) {
      let profileImageValue = undefined;
      if (student.profileImage) {
        if (typeof student.profileImage === 'string') {
          profileImageValue = [{
            uid: '-1',
            name: 'Profile Image',
            status: 'done',
            url: student.profileImage,
          }];
        } else if (Array.isArray(student.profileImage)) {
          profileImageValue = student.profileImage;
        }
      }

      form.setFieldsValue({
        ...student,
        dateOfBirth: student.dateOfBirth ? dayjs(student.dateOfBirth) : null,
        profileImage: profileImageValue,
      });
    } else if (open && !isEditMode) {
      form.resetFields();
    }
  }, [student, form, open, isEditMode]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null,
      };

      if (isEditMode) {
        await dispatch(updateStudent({ id: studentId, data: formattedValues })).unwrap();
        message.success('Student updated successfully');
      } else {
        await dispatch(createStudent(formattedValues)).unwrap();
        message.success('Student created successfully');
      }
      handleClose();
      onSuccess?.();
    } catch (error) {
      message.error(error?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  return (
    <Modal
      title={isEditMode ? 'Edit Student' : 'Add New Student'}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      {initialLoading ? (
        <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Divider plain>Personal Information</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="rollNumber"
                label="Roll Number"
                rules={[{ required: true, message: 'Please enter roll number' }]}
              >
                <Input placeholder="Enter roll number" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phoneNo"
                label="Phone Number"
                rules={[{ pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number' }]}
              >
                <Input placeholder="Enter phone number" maxLength={10} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[{ required: true, message: 'Please select date of birth' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: 'Please select gender' }]}
              >
                <Select placeholder="Select gender">
                  <Select.Option value="MALE">Male</Select.Option>
                  <Select.Option value="FEMALE">Female</Select.Option>
                  <Select.Option value="OTHER">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider plain>Academic Information</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="batchId"
                label="Batch"
                rules={[{ required: true, message: 'Please select batch' }]}
              >
                <Select placeholder="Select batch">
                  {batches?.list?.map(batch => (
                    <Select.Option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.year})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="departmentId"
                label="Department"
                rules={[{ required: true, message: 'Please select department' }]}
              >
                <Select placeholder="Select department">
                  {departments?.list?.map(dept => (
                    <Select.Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="bloodGroup" label="Blood Group">
                <Select placeholder="Select blood group">
                  <Select.Option value="A+">A+</Select.Option>
                  <Select.Option value="A-">A-</Select.Option>
                  <Select.Option value="B+">B+</Select.Option>
                  <Select.Option value="B-">B-</Select.Option>
                  <Select.Option value="AB+">AB+</Select.Option>
                  <Select.Option value="AB-">AB-</Select.Option>
                  <Select.Option value="O+">O+</Select.Option>
                  <Select.Option value="O-">O-</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider plain>Parent/Guardian Information</Divider>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="parentName" label="Parent/Guardian Name">
                <Input placeholder="Enter parent/guardian name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="parentPhone"
                label="Parent/Guardian Phone"
                rules={[{ pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number' }]}
              >
                <Input placeholder="Enter parent/guardian phone" maxLength={10} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} placeholder="Enter address" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                name="profileImage"
                label="Profile Image"
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload beforeUpload={() => false} maxCount={1} accept="image/*">
                  <Button icon={<UploadOutlined />}>Click to Upload</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              {isEditMode ? 'Update Student' : 'Create Student'}
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default StudentModal;
