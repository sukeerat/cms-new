import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Button, Typography, Tooltip, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import {
  fetchInstitutions,
  selectInstitutions,
  selectSelectedInstitute,
  selectInstitutionsLoading,
  clearSelectedInstitute,
  setSelectedInstitute,
} from '../store/stateSlice';
import { InstituteSidePanel, InstituteDetailView } from '../dashboard/components';

const { Text, Title } = Typography;

/**
 * InstitutionOverview - A page with sidebar showing institutions list
 * and main content area showing selected institution details
 */
const InstitutionOverview = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const institutions = useSelector(selectInstitutions);
  const selectedInstitute = useSelector(selectSelectedInstitute);
  const loading = useSelector(selectInstitutionsLoading);

  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [initialTab, setInitialTab] = useState(null);

  // Get URL params
  const urlInstitutionId = searchParams.get('id');
  const urlTab = searchParams.get('tab');

  // Note: fetchInstitutions is handled by InstituteSidePanel with proper caching
  // to avoid duplicate API calls

  // Auto-select institution from URL param
  useEffect(() => {
    // Select institution from URL if it's different from current selection
    if (urlInstitutionId && institutions.length > 0 && urlInstitutionId !== selectedInstitute?.id) {
      const institution = institutions.find(inst => inst.id === urlInstitutionId);
      if (institution) {
        dispatch(setSelectedInstitute(institution.id));
        if (urlTab) {
          setInitialTab(urlTab);
        }
        setSearchParams({}, { replace: true });
      }
    }
  }, [urlInstitutionId, urlTab, institutions, selectedInstitute?.id, dispatch, setSearchParams]);

  const hasSelection = selectedInstitute?.id != null;

  const handleClearSelection = useCallback(() => {
    dispatch(clearSelectedInstitute());
  }, [dispatch]);

  // Get selected institution name
  const selectedName = institutions.find(i => i.id === selectedInstitute?.id)?.name;

  return (
    <div className="institution-overview flex flex-col h-[calc(100vh-120px)] bg-background rounded-2xl overflow-hidden shadow-lg border border-border">
      {/* Top Header Bar - Compact */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border">
        <div className="flex items-center gap-3">
          <BankOutlined className="text-primary text-base" />
          <Text className="font-semibold text-text-primary text-sm">Institutions</Text>
          <Text className="text-xs text-text-tertiary">
            ({loading ? '...' : institutions.length})
          </Text>
          {hasSelection && selectedName && (
            <>
              <Text className="text-text-tertiary text-xs">/</Text>
              <Text className="text-text-primary text-sm font-medium truncate max-w-[200px]">{selectedName}</Text>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={handleClearSelection}>Back</Button>
          )}
          <Button
            type="text"
            size="small"
            icon={sidePanelOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Panel */}
        <div
          className={`transition-all duration-300 ease-in-out border-r border-border bg-surface ${
            sidePanelOpen ? 'w-80' : 'w-0'
          } flex-shrink-0 overflow-hidden`}
        >
          <div className="h-full w-80">
            <InstituteSidePanel />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-background-secondary">
          <InstituteDetailView defaultTab={initialTab} />
        </div>
      </div>
    </div>
  );
};

export default InstitutionOverview;
