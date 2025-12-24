import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Button, Typography } from 'antd';
import { MenuOutlined, CloseOutlined } from '@ant-design/icons';
import {
  fetchInstitutions,
  selectInstitutions,
  selectSelectedInstitute,
  clearSelectedInstitute,
  setSelectedInstitute,
} from '../store/stateSlice';
import { InstituteSidePanel, InstituteDetailView } from '../dashboard/components';

const { Text } = Typography;

/**
 * InstitutionOverview - A page with sidebar showing institutions list
 * and main content area showing selected institution details
 *
 * Supports URL query params:
 * - id: Institution ID to auto-select
 * - tab: Default tab to show (overview, students, companies, faculty)
 */
const InstitutionOverview = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const institutions = useSelector(selectInstitutions);
  const selectedInstitute = useSelector(selectSelectedInstitute);

  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [initialTab, setInitialTab] = useState(null);

  // Get URL params
  const urlInstitutionId = searchParams.get('id');
  const urlTab = searchParams.get('tab');

  // Fetch institutions on mount
  useEffect(() => {
    dispatch(fetchInstitutions({ limit: 100 }));
  }, [dispatch]);

  // Auto-select institution from URL param after institutions are loaded
  useEffect(() => {
    if (urlInstitutionId && institutions.length > 0 && !selectedInstitute?.id) {
      const institution = institutions.find(inst => inst.id === urlInstitutionId);
      if (institution) {
        // setSelectedInstitute expects just the ID, not the full object
        dispatch(setSelectedInstitute(institution.id));
        // Set initial tab if provided in URL
        if (urlTab) {
          setInitialTab(urlTab);
        }
        // Clear URL params after selection to avoid re-triggering
        setSearchParams({}, { replace: true });
      }
    }
  }, [urlInstitutionId, urlTab, institutions, selectedInstitute?.id, dispatch, setSearchParams]);

  // Check if an institute is selected
  const hasSelection = selectedInstitute?.id != null;

  // Handle back/clear selection
  const handleClearSelection = useCallback(() => {
    dispatch(clearSelectedInstitute());
  }, [dispatch]);

  return (
    <div className="institution-overview flex h-[calc(100vh-120px)] bg-background-secondary rounded-xl overflow-hidden shadow-sm border border-border">
      {/* Side Panel */}
      <div
        className={`transition-all duration-300 border-r border-border ${
          sidePanelOpen ? 'w-80' : 'w-0 overflow-hidden'
        } flex-shrink-0 bg-surface`}
      >
        {sidePanelOpen && (
          <div className="h-full">
            <InstituteSidePanel />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header with toggle and back button */}
        <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-border">
          <Button
            type="text"
            icon={sidePanelOpen ? <CloseOutlined /> : <MenuOutlined />}
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
            className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
          >
            {sidePanelOpen ? 'Hide Panel' : 'Show Panel'}
          </Button>

          {hasSelection && (
            <Button onClick={handleClearSelection} size="small" className="text-text-primary border-border">
              ← Clear Selection
            </Button>
          )}

          <div className="flex-1" />

          <Text className="text-sm text-text-secondary">
            {institutions.length} institutions loaded
          </Text>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <InstituteDetailView defaultTab={initialTab} />
        </div>
      </div>
    </div>
  );
};

export default InstitutionOverview;
