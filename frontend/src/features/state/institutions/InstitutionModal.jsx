import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Switch,
  message,
  Row,
  Col,
  Divider,
  Spin,
} from 'antd';
import {
  SaveOutlined,
  BankOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  createInstitution,
  updateInstitution,
  selectInstitutions,
} from '../store/stateSlice';

const { Option } = Select;

const InstitutionModal = ({ open, onClose, institutionId, onSuccess }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const institutions = useSelector(selectInstitutions);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditMode = !!institutionId;

  useEffect(() => {
    if (open && isEditMode) {
      setLoading(true);
      const institution = institutions.find((i) => i.id === institutionId);
      if (institution) {
        form.setFieldsValue(institution);
      }
      setLoading(false);
    } else if (open && !isEditMode) {
      form.resetFields();
    }
  }, [open, institutionId, institutions, isEditMode, form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (isEditMode) {
        await dispatch(updateInstitution({ id: institutionId, data: values })).unwrap();
        message.success('Institution updated successfully');
      } else {
        await dispatch(createInstitution(values)).unwrap();
        message.success('Institution created successfully');
      }
      handleClose();
      onSuccess?.();
    } catch (error) {
      message.error(error.message || 'Failed to save institution');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <BankOutlined className="text-primary" />
          <span>{isEditMode ? 'Edit Institution' : 'Add Institution'}</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      {loading ? (
        <div className="py-12 text-center">
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
          initialValues={{ isActive: true }}
        >
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 text-text-primary">
              <InfoCircleOutlined className="text-primary" />
              <span className="font-bold text-sm uppercase tracking-widest">Basic Information</span>
            </div>

            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="name"
                  label="Institution Name"
                  rules={[{ required: true, message: 'Please enter institution name' }]}
                >
                  <Input prefix={<BankOutlined className="text-gray-400" />} placeholder="e.g. Government Polytechnic College" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="code"
                  label="Institution Code"
                  rules={[{ required: true, message: 'Please enter institution code' }]}
                >
                  <Input placeholder="e.g. GPC-001" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="type"
                  label="Institution Type"
                  rules={[{ required: true, message: 'Please select institution type' }]}
                >
                  <Select placeholder="Select type">
                    <Option value="GOVERNMENT">Government</Option>
                    <Option value="AIDED">Aided</Option>
                    <Option value="PRIVATE">Private</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="website" label="Website">
                  <Input prefix={<GlobalOutlined className="text-gray-400" />} placeholder="https://example.com" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4 text-text-primary">
              <EnvironmentOutlined className="text-green-500" />
              <span className="font-bold text-sm uppercase tracking-widest">Location & Contact</span>
            </div>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Official Email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter a valid email' },
                  ]}
                >
                  <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="admin@college.edu" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="contactNumber"
                  label="Contact Number"
                  rules={[{ required: true, message: 'Please enter contact number' }]}
                >
                  <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="+91 XXXXX XXXXX" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="address"
                  label="Address"
                  rules={[{ required: true, message: 'Please enter address' }]}
                >
                  <Input.TextArea rows={2} placeholder="Full address" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="city"
                  label="City"
                  rules={[{ required: true, message: 'Please enter city' }]}
                >
                  <Input placeholder="City" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="state"
                  label="State"
                  rules={[{ required: true, message: 'Please enter state' }]}
                >
                  <Input placeholder="State" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="pincode"
                  label="Pincode"
                  rules={[{ required: true, message: 'Please enter pincode' }]}
                >
                  <Input placeholder="Pincode" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-sm uppercase tracking-widest">Settings</span>
            <Form.Item name="isActive" valuePropName="checked" className="mb-0">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<SaveOutlined />}
            >
              {isEditMode ? 'Update Institution' : 'Save Institution'}
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default InstitutionModal;
