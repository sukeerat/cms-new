import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Progress,
  Spin,
  Empty,
  Typography,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  fetchJoiningLetterStats,
  selectJoiningLetterStats,
  selectJoiningLettersLoading,
} from '../../store/stateSlice';

const { Text } = Typography;

const JoiningLetterTracker = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectJoiningLetterStats);
  const loading = useSelector(selectJoiningLettersLoading);

  useEffect(() => {
    dispatch(fetchJoiningLetterStats());
  }, [dispatch]);

  if (loading) {
    return (
      <Card className="rounded-2xl border-border shadow-sm bg-surface">
        <div className="flex justify-center items-center h-16">
          <Spin />
        </div>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="rounded-2xl border-border shadow-sm bg-surface">
        <Empty description="No joining letter data available" className="!my-4" />
      </Card>
    );
  }

  const { summary } = stats;
  const uploadRate = summary?.uploadRate || 0;

  return (
    <Card
      title={
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
            <FileTextOutlined className="text-blue-500 text-lg" />
          </div>
          <span className="font-bold text-text-primary text-lg">Joining Letter Tracker</span>
        </div>
      }
      className="rounded-2xl border-border shadow-sm bg-surface"
      styles={{ header: { borderBottom: '1px solid var(--color-border)', padding: '12px 20px' }, body: { padding: '12px 20px' } }}
    >
      <div className="flex items-center gap-6">
        {/* Stats */}
        <div className="flex items-center gap-4 flex-1">
          <Tooltip title="Approved self-identified internships without joining letter">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10">
              <WarningOutlined className="text-warning" />
              <div>
                <div className="text-xs text-text-tertiary">Not Uploaded</div>
                <div className="text-xl font-bold text-warning">{summary?.noLetter || 0}</div>
              </div>
            </div>
          </Tooltip>

          <Tooltip title="Approved self-identified internships with joining letter uploaded">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10">
              <CheckCircleOutlined className="text-success" />
              <div>
                <div className="text-xs text-text-tertiary">Uploaded</div>
                <div className="text-xl font-bold text-success">{summary?.uploaded || 0}</div>
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Upload Progress */}
        <div className="w-56">
          <div className="flex justify-between items-center mb-1">
            <Text className="text-xs font-medium text-text-secondary">Upload Progress</Text>
            <Text strong className="text-sm text-text-primary">{summary?.uploaded || 0} of {summary?.total || 0}</Text>
          </div>
          <Progress
            percent={uploadRate}
            strokeColor={uploadRate >= 80 ? 'rgb(var(--color-success))' : uploadRate >= 50 ? 'rgb(var(--color-warning))' : 'rgb(var(--color-error))'}
            railColor="rgba(var(--color-border), 0.3)"
            size="small"
            showInfo={false}
            className="!m-0"
          />
          <div className="text-xs text-text-tertiary text-center mt-1">{uploadRate}% of approved internships have joining letters</div>
        </div>
      </div>
    </Card>
  );
};

export default JoiningLetterTracker;
