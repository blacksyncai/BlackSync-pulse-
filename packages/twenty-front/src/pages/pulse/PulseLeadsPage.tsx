import { PulseLeadsBulkBar } from '@/pulse-leads/components/PulseLeadsBulkBar';
import { PulseLeadsFilterBar } from '@/pulse-leads/components/PulseLeadsFilterBar';
import { PulseLeadsTable } from '@/pulse-leads/components/PulseLeadsTable';
import { PulseNewLeadForm } from '@/pulse-leads/components/PulseNewLeadForm';
import {
  DEFAULT_SMART_VIEWS,
  EMPTY_SMART_VIEW_FILTERS,
} from '@/pulse-leads/constants/DefaultSmartViews';
import { useLeadStatusOptions } from '@/pulse-leads/hooks/useLeadStatusOptions';
import { usePulseLeadActions } from '@/pulse-leads/hooks/usePulseLeadActions';
import { usePulseLeads } from '@/pulse-leads/hooks/usePulseLeads';
import { useSmartViews } from '@/pulse-leads/hooks/useSmartViews';
import { type PulseSmartView } from '@/pulse-leads/types/PulseSmartView';
import { applySmartView } from '@/pulse-leads/utils/applySmartView';
import { formatCompactMoney } from '@/pulse-leads/utils/formatRelativeTime';
import { usePulseTaskActions } from '@/pulse-tasks/hooks/usePulseTaskActions';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { IconBuildingSkyscraper, IconPlus } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

const VIEW_PARAM = 'view';

type Draft = Pick<PulseSmartView, 'filters' | 'sort'> & { viewId: string };

const StyledPage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  height: 100%;
  overflow: auto;
  padding: ${themeCssVariables.spacing[5]} ${themeCssVariables.spacing[6]};
`;

const StyledTop = styled.div`
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[4]};
  justify-content: space-between;
`;

const StyledTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  h1 {
    color: ${themeCssVariables.font.color.primary};
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
  }
`;

const StyledStats = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[4]};

  strong {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};

  input {
    background: ${themeCssVariables.background.primary};
    border: 1px solid ${themeCssVariables.accent.accent9};
    border-radius: 10px;
    color: ${themeCssVariables.font.color.primary};
    font-family: inherit;
    font-size: ${themeCssVariables.font.size.md};
    height: 34px;
    padding: 0 ${themeCssVariables.spacing[3]};
  }
`;

const StyledButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 10px;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: ${themeCssVariables.spacing[1]};
  height: 34px;
  padding: 0 ${themeCssVariables.spacing[3]};

  &[data-primary='true'] {
    background: ${themeCssVariables.accent.accent9};
    border-color: ${themeCssVariables.accent.accent9};
    color: #fff;
  }

  &[data-tone='danger'] {
    color: ${themeCssVariables.font.color.danger};
  }
`;

const StyledViewTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledViewTab = styled.button`
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  padding: 6px 12px;

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.transparent.medium};
    color: ${themeCssVariables.font.color.primary};
    font-weight: ${themeCssVariables.font.weight.medium};
  }
`;

const StyledTableScroll = styled.div`
  overflow-x: auto;
  padding-bottom: 80px;
`;

export const PulseLeadsPage = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { leads, loading, refetch } = usePulseLeads();
  const { options: statusOptions } = useLeadStatusOptions();
  const { smartViews, createSmartView, updateSmartView, deleteSmartView } =
    useSmartViews();
  const { setStatus } = usePulseLeadActions();
  const { currentWorkspaceMemberId } = usePulseTaskActions();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const currentView =
    smartViews.find((view) => view.id === searchParams.get(VIEW_PARAM)) ??
    DEFAULT_SMART_VIEWS[0];
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [newViewName, setNewViewName] = useState<string | null>(null);

  const activeDraft: Draft =
    draft?.viewId === currentView.id
      ? draft
      : {
          viewId: currentView.id,
          filters: currentView.filters,
          sort: currentView.sort,
        };
  const hasChanges =
    JSON.stringify({ filters: activeDraft.filters, sort: activeDraft.sort }) !==
    JSON.stringify({ filters: currentView.filters, sort: currentView.sort });

  const now = Date.now();
  const visibleLeads = applySmartView(leads, activeDraft, {
    now,
    currentWorkspaceMemberId,
  });
  const totalValue = visibleLeads.reduce(
    (sum, lead) => sum + lead.dealValueMicros,
    0,
  );
  const neverCalled = visibleLeads.filter(
    (lead) => lead.callCount === 0,
  ).length;

  const selectView = (viewId: string) => {
    setSelectedIds(new Set());
    setDraft(null);
    setSearchParams({ [VIEW_PARAM]: viewId });
  };

  const handleStatusChange = async (leadId: string, status: string | null) => {
    await setStatus([leadId], status);
    void refetch();
  };

  const handleSaveNewView = async () => {
    const name = (newViewName ?? '').trim();

    if (name.length === 0) {
      return;
    }

    const created = await createSmartView({
      name,
      filters: activeDraft.filters,
      sort: activeDraft.sort,
    });

    setNewViewName(null);
    enqueueToast({ variant: 'success', children: t`Saved "${name}"` });
    selectView(created.id);
  };

  const handleUpdateView = async () => {
    await updateSmartView({
      ...currentView,
      filters: activeDraft.filters,
      sort: activeDraft.sort,
    });
    setDraft(null);
    enqueueToast({ variant: 'success', children: t`View updated` });
  };

  const handleDeleteView = async () => {
    if (window.confirm(t`Delete the "${currentView.name}" view?`)) {
      await deleteSmartView(currentView.id);
      selectView(DEFAULT_SMART_VIEWS[0].id);
    }
  };

  return (
    <PageCardLayout
      header={<PageHeader title={t`Leads`} Icon={IconBuildingSkyscraper} />}
    >
      <StyledPage>
        <StyledViewTabs>
          {smartViews.map((view) => (
            <StyledViewTab
              key={view.id}
              type="button"
              aria-pressed={view.id === currentView.id}
              onClick={() => selectView(view.id)}
            >
              {view.name}
            </StyledViewTab>
          ))}
        </StyledViewTabs>

        <StyledTop>
          <StyledTitleBlock>
            <h1>{currentView.name}</h1>
            <StyledStats>
              <span>
                <strong>{visibleLeads.length}</strong> {t`leads`}
              </span>
              <span>
                <strong>{formatCompactMoney(totalValue)}</strong> {t`in deals`}
              </span>
              <span>
                <strong>{neverCalled}</strong> {t`never called`}
              </span>
            </StyledStats>
          </StyledTitleBlock>
          <StyledActions>
            {isDefined(newViewName) ? (
              <>
                <input
                  autoFocus
                  placeholder={t`Name this view`}
                  value={newViewName}
                  onChange={(event) => setNewViewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleSaveNewView();
                    }
                  }}
                />
                <StyledButton
                  type="button"
                  data-primary
                  onClick={() => void handleSaveNewView()}
                >
                  {t`Save`}
                </StyledButton>
                <StyledButton
                  type="button"
                  onClick={() => setNewViewName(null)}
                >
                  {t`Cancel`}
                </StyledButton>
              </>
            ) : (
              <>
                {hasChanges && currentView.isBuiltIn !== true && (
                  <StyledButton type="button" onClick={handleUpdateView}>
                    {t`Update view`}
                  </StyledButton>
                )}
                {hasChanges && (
                  <StyledButton
                    type="button"
                    onClick={() => setNewViewName('')}
                  >
                    {t`Save as Smart View`}
                  </StyledButton>
                )}
                {currentView.isBuiltIn !== true && !hasChanges && (
                  <StyledButton
                    type="button"
                    data-tone="danger"
                    onClick={handleDeleteView}
                  >
                    {t`Delete view`}
                  </StyledButton>
                )}
                <StyledButton
                  type="button"
                  data-primary
                  onClick={() => setIsCreatingLead(!isCreatingLead)}
                >
                  <IconPlus size={16} />
                  {t`New lead`}
                </StyledButton>
              </>
            )}
          </StyledActions>
        </StyledTop>

        {isCreatingLead && (
          <PulseNewLeadForm
            statusOptions={statusOptions}
            onCancel={() => setIsCreatingLead(false)}
            onCreated={(leadId) => {
              setIsCreatingLead(false);
              void refetch();
              openRecordInSidePanel({
                recordId: leadId,
                objectNameSingular: CoreObjectNameSingular.Company,
              });
            }}
          />
        )}

        <PulseLeadsFilterBar
          filters={activeDraft.filters}
          statusOptions={statusOptions}
          hasChanges={hasChanges}
          onChange={(filters) => setDraft({ ...activeDraft, filters })}
          onClear={() =>
            setDraft({
              ...activeDraft,
              filters: currentView.isBuiltIn
                ? currentView.filters
                : EMPTY_SMART_VIEW_FILTERS,
              sort: currentView.sort,
            })
          }
        />

        <StyledTableScroll>
          <PulseLeadsTable
            leads={visibleLeads}
            now={now}
            sort={activeDraft.sort}
            onSortChange={(sort) => setDraft({ ...activeDraft, sort })}
            statusOptions={statusOptions}
            onStatusChange={(leadId, status) =>
              void handleStatusChange(leadId, status)
            }
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onOpenLead={(leadId) =>
              openRecordInSidePanel({
                recordId: leadId,
                objectNameSingular: CoreObjectNameSingular.Company,
              })
            }
            isLoading={loading}
          />
        </StyledTableScroll>

        {selectedIds.size > 0 && (
          <PulseLeadsBulkBar
            selectedIds={[...selectedIds]}
            statusOptions={statusOptions}
            onClear={() => setSelectedIds(new Set())}
            onDone={() => {
              setSelectedIds(new Set());
              void refetch();
            }}
          />
        )}
      </StyledPage>
    </PageCardLayout>
  );
};
