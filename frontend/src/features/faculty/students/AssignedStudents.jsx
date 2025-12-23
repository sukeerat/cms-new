// src/pages/faculty/AssignedStudents.jsx
import React, { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Typography, Card, Tag, Spin, Empty, Alert, Button } from "antd";
import { PhoneOutlined, MailOutlined, ReloadOutlined, TeamOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchAssignedStudents,
  selectStudents,
} from "../store/facultySlice";

const { Title, Text, Paragraph } = Typography;

export default function AssignedStudents() {
  const dispatch = useDispatch();
  const studentsState = useSelector(selectStudents);

  // Extract data from state
  const students = studentsState?.list || [];
  const loading = studentsState?.loading || false;
  const error = studentsState?.error || null;

  // Fetch students on mount
  useEffect(() => {
    dispatch(fetchAssignedStudents());
  }, [dispatch]);

  // Force refresh function
  const forceRefresh = useCallback(() => {
    dispatch(fetchAssignedStudents({ forceRefresh: true }));
  }, [dispatch]);

  // Safely process students data
  const safeStudents = useMemo(() => {
    if (!Array.isArray(students)) {
      console.warn("Students data is not an array:", students);
      return [];
    }
    return students;
  }, [students]);

  /* ------------------------------------------------------------------ */
  /*  Column helpers                                                    */
  /* ------------------------------------------------------------------ */
  const statusColor = (app) => {
    if (app.hasJoined || app.status === "COMPLETED") return "green";
    if (app.status === "REJECTED") return "red";
    if (app.status === "UNDER_REVIEW") return "orange";
    return "blue";
  };

  /* ------------------------------------------------------------------ */
  /*  Table columns                                                     */
  /* ------------------------------------------------------------------ */
  const columns = [
    {
      title: "Student",
      key: "student",
      width: "28%",
      render: (_, r) => (
        <div>
          <Text strong className="text-primary">
            {r.student?.name || "N/A"}
          </Text>
          <Text className="text-text-secondary block text-sm">
            Roll No: {r.student?.rollNumber || "N/A"}
          </Text>
          <Text className="text-text-secondary block text-sm">
            {r.student?.branchName || "N/A"}
          </Text>
          <div className="flex items-center gap-2 mt-1">
            <Tag color="blue">AY: {r.academicYear}</Tag>
            {r.semester && <Tag color="green">Sem: {r.semester}</Tag>}
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: "22%",
      render: (_, r) => (
        <div>
          <div className="flex items-center mb-1">
            <PhoneOutlined className="mr-1 text-text-tertiary" />
            <Text className="text-sm">{r.student?.contact || "N/A"}</Text>
          </div>
          <div className="flex items-center">
            <MailOutlined className="mr-1 text-text-tertiary" />
            <Text className="text-sm text-primary">
              {r.student?.email || "N/A"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Internship Applications",
      key: "apps",
      render: (_, r) => {
        const apps = r.student?.internshipApplications || [];
        if (!apps.length)
          return <Text className="text-text-tertiary text-sm">No applications</Text>;

        return (
          <div className="space-y-2">
            {apps.slice(0, 2).map((app) => (
              <Card
                key={app.id}
                size="small"
                className="border border-border"
              >
                <Text strong className="block text-sm">
                  {app.internship?.title || "N/A"}
                </Text>
                <div className="flex items-center justify-between mt-1">
                  <Tag color={statusColor(app)} size="small">
                    {app.hasJoined ? "ACTIVE" : app.status}
                  </Tag>
                  {app.isSelected && !app.hasJoined && (
                    <Tag color="gold" size="small">
                      Selected
                    </Tag>
                  )}
                </div>
                <Text className="text-xs text-text-tertiary">
                  Applied {dayjs(app.applicationDate).format("MMM DD")}
                </Text>
              </Card>
            ))}
            {apps.length > 2 && (
              <Text className="text-xs text-primary">
                +{apps.length - 2} more
              </Text>
            )}
          </div>
        );
      },
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="small" />
        <Text className="ml-4">Loading students…</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Alert
          title="Error Loading Assigned Students"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
        <Button
          type="primary"
          onClick={forceRefresh}
          icon={<ReloadOutlined />}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background-secondary min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-primary shadow-sm mr-3">
              <TeamOutlined className="text-lg" />
            </div>
            <div>
              <Title level={2} className="mb-0 text-text-primary text-2xl">
                Assigned Students
              </Title>
              <Paragraph className="text-text-secondary text-sm mb-0">
                You have <span className="font-semibold text-primary">{safeStudents.length}</span> students assigned for mentorship
              </Paragraph>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={forceRefresh}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-text-secondary shadow-sm hover:bg-surface-hover hover:scale-105 active:scale-95 transition-all duration-200"
            />
          </div>
        </div>

        {/* Table Container */}
        <Card className="rounded-2xl border-border shadow-sm overflow-hidden" styles={{ body: { padding: 0 } }}>
          {safeStudents.length > 0 ? (
            <Table
              columns={columns}
              dataSource={safeStudents}
              rowKey={(record) => record?.id || Math.random()}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                className: "px-6 py-4",
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} students`,
              }}
              size="middle"
              scroll={{ x: "max-content" }}
              className="custom-table"
            />
          ) : (
            <div className="py-20 flex flex-col items-center justify-center">
              <Empty
                description={false}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <Title level={4} className="text-text-secondary mt-4 mb-1">No students assigned yet</Title>
              <Text className="text-text-tertiary">
                Students will appear here once they are assigned to you by the admin.
              </Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}