import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, Upload, Button, message, Steps, Table, Alert, Space, Select, Divider } from 'antd';
import { UploadOutlined, DownloadOutlined, CheckCircleOutlined, CloseCircleOutlined, BankOutlined } from '@ant-design/icons';
import { bulkService } from '../../../services/bulk.service';
import { stateService } from '../../../services/state.service';
import * as XLSX from 'xlsx';

const { Step } = Steps;
const { Dragger } = Upload;

const BulkUpload = () => {
  const { user } = useSelector((state) => state.auth);
  const isStateDirectorate = user?.role === 'STATE_DIRECTORATE';

  const [currentStep, setCurrentStep] = useState(0);
  const [uploadType, setUploadType] = useState('students');
  const [fileData, setFileData] = useState([]);
  const [originalFile, setOriginalFile] = useState(null);
  const [validationResults, setValidationResults] = useState({ valid: [], invalid: [] });
  const [uploading, setUploading] = useState(false);

  // Institution selector state for STATE_DIRECTORATE
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  // Fetch institutions for STATE_DIRECTORATE
  useEffect(() => {
    if (isStateDirectorate) {
      fetchInstitutions();
    }
  }, [isStateDirectorate]);

  const fetchInstitutions = async () => {
    setLoadingInstitutions(true);
    try {
      const response = await stateService.getInstitutions({ limit: 1000 });
      setInstitutions(response.data || response.institutions || []);
    } catch (error) {
      message.error('Failed to fetch institutions');
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = uploadType === 'students'
        ? await bulkService.downloadStudentTemplate()
        : await bulkService.downloadUserTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-${uploadType}-upload-template.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Template downloaded successfully');
    } catch (error) {
      message.error('Failed to download template');
    }
  };

  const validateStudentData = (data) => {
    const valid = [];
    const invalid = [];

    data.forEach((row, index) => {
      const errors = [];

      // Required field validations
      if (!row.name || row.name.trim() === '') errors.push('Name is required');
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Valid email is required');
      if (!row.rollNumber || row.rollNumber.trim() === '') errors.push('Roll number is required');
      if (!row.phone || !/^[0-9]{10}$/.test(row.phone.toString())) errors.push('Valid 10-digit phone is required');
      if (!row.department || row.department.trim() === '') errors.push('Department is required');
      if (!row.batch || row.batch.trim() === '') errors.push('Batch is required');
      if (!row.gender || !['male', 'female', 'other'].includes(row.gender.toLowerCase())) {
        errors.push('Gender must be male, female, or other');
      }

      const record = {
        ...row,
        rowNumber: index + 2, // +2 because Excel starts at 1 and header is row 1
        errors: errors,
      };

      if (errors.length === 0) {
        valid.push(record);
      } else {
        invalid.push(record);
      }
    });

    return { valid, invalid };
  };

  const validateStaffData = (data) => {
    const valid = [];
    const invalid = [];

    data.forEach((row, index) => {
      const errors = [];

      if (!row.name || row.name.trim() === '') errors.push('Name is required');
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Valid email is required');
      if (!row.employeeId || row.employeeId.trim() === '') errors.push('Employee ID is required');
      if (!row.phone || !/^[0-9]{10}$/.test(row.phone.toString())) errors.push('Valid 10-digit phone is required');
      if (!row.department || row.department.trim() === '') errors.push('Department is required');
      if (!row.role || row.role.trim() === '') errors.push('Role is required');
      if (!row.designation || row.designation.trim() === '') errors.push('Designation is required');

      const record = {
        ...row,
        rowNumber: index + 2,
        errors: errors,
      };

      if (errors.length === 0) {
        valid.push(record);
      } else {
        invalid.push(record);
      }
    });

    return { valid, invalid };
  };

  const handleFileUpload = (file) => {
    // Store original file for later upload
    setOriginalFile(file);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        if (jsonData.length === 0) {
          message.error('The file is empty or has no valid data');
          setOriginalFile(null);
          return false;
        }

        setFileData(jsonData);

        // Validate data for preview purposes
        const results = uploadType === 'students'
          ? validateStudentData(jsonData)
          : validateStaffData(jsonData);

        setValidationResults(results);
        setCurrentStep(1);

        if (results.invalid.length > 0) {
          message.warning(`Found ${results.invalid.length} invalid record(s). Please review before uploading.`);
        } else {
          message.success(`All ${results.valid.length} record(s) are valid!`);
        }
      } catch (error) {
        message.error('Failed to read file. Please ensure it is a valid Excel file.');
        setOriginalFile(null);
      }
    };

    reader.readAsArrayBuffer(file);
    return false; // Prevent auto upload
  };

  const handleUpload = async () => {
    if (validationResults.valid.length === 0) {
      message.error('No valid records to upload');
      return;
    }

    if (!originalFile) {
      message.error('File not found. Please upload again.');
      return;
    }

    // STATE_DIRECTORATE must select an institution
    if (isStateDirectorate && !selectedInstitution) {
      message.error('Please select an institution first');
      return;
    }

    setUploading(true);
    try {
      const institutionId = isStateDirectorate ? selectedInstitution : null;
      const uploadFn = uploadType === 'students'
        ? bulkService.uploadStudents
        : bulkService.uploadUsers;

      // Send the original file with institutionId for STATE_DIRECTORATE
      await uploadFn(originalFile, null, true, institutionId);

      message.success(`Successfully uploaded ${validationResults.valid.length} ${uploadType}`);
      setCurrentStep(2);
    } catch (error) {
      message.error(error?.response?.data?.message || error?.message || 'Failed to upload data');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setCurrentStep(0);
    setFileData([]);
    setOriginalFile(null);
    setValidationResults({ valid: [], invalid: [] });
  };

  const validColumns = [
    { title: 'Row', dataIndex: 'rowNumber', key: 'rowNumber', width: 70 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: uploadType === 'students' ? 'Roll Number' : 'Employee ID',
      dataIndex: uploadType === 'students' ? 'rollNumber' : 'employeeId',
      key: 'id',
    },
    { title: 'Department', dataIndex: 'department', key: 'department' },
  ];

  const invalidColumns = [
    { title: 'Row', dataIndex: 'rowNumber', key: 'rowNumber', width: 70 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Errors',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors) => (
        <ul className="text-red-500 text-xs">
          {errors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card title="Bulk Upload" variant="borderless">
        <Steps current={currentStep} className="mb-6">
          <Step title="Upload File" description="Select and upload Excel file" />
          <Step title="Validate Data" description="Review and validate records" />
          <Step title="Complete" description="Upload successful" />
        </Steps>

        {currentStep === 0 && (
          <div>
            <Space className="mb-4" size="middle" wrap>
              {/* Institution selector for STATE_DIRECTORATE */}
              {isStateDirectorate && (
                <Select
                  placeholder="Select Institution"
                  value={selectedInstitution}
                  onChange={setSelectedInstitution}
                  loading={loadingInstitutions}
                  style={{ width: 300 }}
                  showSearch
                  optionFilterProp="label"
                  suffixIcon={<BankOutlined />}
                  options={institutions.map((inst) => ({
                    value: inst.id,
                    label: inst.name,
                  }))}
                />
              )}
              <Select
                value={uploadType}
                onChange={(value) => {
                  setUploadType(value);
                  resetUpload();
                }}
                style={{ width: 200 }}
                options={[
                  { value: 'students', label: 'Upload Students' },
                  { value: 'staff', label: 'Upload Staff' },
                ]}
              />
              <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                Download Template
              </Button>
            </Space>

            {/* Warning for STATE_DIRECTORATE if no institution selected */}
            {isStateDirectorate && !selectedInstitution && (
              <Alert
                title="Select an Institution"
                description="As a State Directorate user, you must select an institution before uploading data."
                type="warning"
                showIcon
                className="mb-4"
              />
            )}

            <Alert
              title="Instructions"
              description={
                <ul className="list-disc ml-4 mt-2">
                  <li>Download the template file first</li>
                  <li>Fill in the required information in the template</li>
                  <li>Ensure all required fields are filled correctly</li>
                  <li>Upload the completed Excel file below</li>
                  <li>Supported formats: .xlsx, .xls</li>
                </ul>
              }
              type="info"
              className="mb-4"
            />

            <Dragger
              accept=".xlsx,.xls"
              beforeUpload={handleFileUpload}
              maxCount={1}
              showUploadList={false}
              disabled={isStateDirectorate && !selectedInstitution}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, opacity: isStateDirectorate && !selectedInstitution ? 0.5 : 1 }} />
              </p>
              <p className="ant-upload-text">
                {isStateDirectorate && !selectedInstitution
                  ? 'Please select an institution first'
                  : 'Click or drag file to this area to upload'}
              </p>
              <p className="ant-upload-hint">
                Support for a single Excel file upload. File size should not exceed 10MB.
              </p>
            </Dragger>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <Alert
              title={`Total Records: ${fileData.length}`}
              description={
                <div>
                  <div className="flex items-center gap-4">
                    <span className="text-green-600">
                      <CheckCircleOutlined /> Valid: {validationResults.valid.length}
                    </span>
                    <span className="text-red-600">
                      <CloseCircleOutlined /> Invalid: {validationResults.invalid.length}
                    </span>
                  </div>
                </div>
              }
              type={validationResults.invalid.length > 0 ? 'warning' : 'success'}
              className="mb-4"
            />

            {validationResults.valid.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-green-600">Valid Records</h3>
                <Table
                  columns={validColumns}
                  dataSource={validationResults.valid}
                  rowKey="rowNumber"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              </div>
            )}

            {validationResults.invalid.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-red-600">Invalid Records</h3>
                <Table
                  columns={invalidColumns}
                  dataSource={validationResults.invalid}
                  rowKey="rowNumber"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              </div>
            )}

            <Divider />

            <Space>
              <Button onClick={resetUpload}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleUpload}
                loading={uploading}
                disabled={validationResults.valid.length === 0}
              >
                Upload {validationResults.valid.length} Valid Record(s)
              </Button>
            </Space>
          </div>
        )}

        {currentStep === 2 && (
          <div className="text-center py-8">
            <CheckCircleOutlined style={{ fontSize: 72 }} />
            <h2 className="text-2xl font-semibold mt-4">Upload Successful!</h2>
            <p className="text-gray-600 mt-2">
              Successfully uploaded {validationResults.valid.length} {uploadType}
            </p>
            <Button type="primary" onClick={resetUpload} className="mt-4">
              Upload Another File
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BulkUpload;