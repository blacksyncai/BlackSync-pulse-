import {
  usePulseAssignment,
  assignmentMemberName,
} from '@/pulse-assignment/contexts/PulseAssignmentContext';
import { PulsePipelineSearch } from '@/pulse-opportunities/components/PulsePipelineSearch';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { PulseDealCardSettingsButton } from '@/pulse-opportunities/components/PulseDealCardSettingsButton';
import {
  PulseDealCard,
  type PulseDealUpdate,
} from '@/pulse-opportunities/components/PulseDealCard';
import {
  type PulseBoardDeal,
  usePulseBoardDeals,
} from '@/pulse-opportunities/hooks/usePulseBoardDeals';
import { usePulseLeads } from '@/pulse-leads/hooks/usePulseLeads';
import { usePulsePipelines } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { IconPlus, IconTargetArrow } from 'twenty-ui/icon';
import { Tag, type TagColor } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

const PIPELINE_PARAM = 'pipeline';

const StyledPage = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
`;

const StyledBar = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.medium};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const StyledPipelinePicker = styled.select`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 8px;
  color: ${themeCssVariables.font.color.primary};
  font: inherit;
  font-size: 13px;
  padding: 9px 12px;
  max-width: 260px;
  cursor: pointer;
`;
const StyledFilterLabel = styled.label`
  align-items: center;
  display: inline-flex;
  gap: 7px;
  color: ${themeCssVariables.font.color.secondary};
  font-size: 12px;
  input {
    background: ${themeCssVariables.background.primary};
    color: inherit;
    border: 1px solid ${themeCssVariables.border.color.medium};
    border-radius: 7px;
    padding: 7px;
    font: inherit;
    min-width: 0;
  }
`;

const StyledTotals = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.md};
  margin-left: auto;

  strong {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledNewButton = styled.button`
  align-items: center;
  background: ${themeCssVariables.accent.accent9};
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: ${themeCssVariables.font.weight.medium};
  gap: 6px;
  height: 32px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledBoard = styled.div`
  display: flex;
  flex: 1;
  gap: 0;
  min-height: 0;
  overflow-x: auto;
  padding: 0;
  background: ${themeCssVariables.background.secondary};
`;

const StyledCardAnchor = styled.div`
  border-radius: 12px;
  flex-shrink: 0;
  scroll-margin: 16px;
  &[data-located='true'] {
    outline: 3px solid ${themeCssVariables.accent.accent9};
    outline-offset: 3px;
    box-shadow: 0 0 0 7px ${themeCssVariables.accent.quaternary};
  }
`;

const StyledColumn = styled.section`
  background: ${themeCssVariables.background.secondary};
  border: 0;
  border-right: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 0;
  display: flex;
  flex: none;
  flex-direction: column;
  min-height: 0;
  transition: background 0.15s;
  width: 340px;
  max-width: calc(100vw - 24px);

  &[data-over='true'] {
    background: ${themeCssVariables.accent.quaternary};
    border-color: ${themeCssVariables.accent.accent8};
  }
`;

const StyledColumnHeader = styled.header`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[3]};
`;

const StyledColumnCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledColumnValue = styled.span`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-left: auto;
`;

const StyledCards = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
`;

const StyledEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]};
  text-align: center;
`;

const formatCompactMoney = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);

const dealAmount = (deal: PulseBoardDeal) =>
  (deal.amount?.amountMicros ?? 0) / 1_000_000;

export const PulseOpportunitiesPage = () => {
  const { t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const { members } = usePulseAssignment();
  const [ownerId, setOwnerId] = useState('');
  const [closeFrom, setCloseFrom] = useState('');
  const [closeTo, setCloseTo] = useState('');
  const scope = { ownerId, closeFrom, closeTo };
  const { pipelines, opportunityMetadataItem } = usePulsePipelines();
  const hasPipelineField = opportunityMetadataItem.fields.some(
    (field) => field.name === 'pipeline',
  );
  // Named pipelines first, the original board last, like Close's pipeline picker.
  const orderedPipelines = [
    ...pipelines.filter((pipeline) => !pipeline.isDefault),
    ...pipelines.filter((pipeline) => pipeline.isDefault),
  ];
  const selectedPipeline =
    orderedPipelines.find(
      (pipeline) => pipeline.viewId === searchParams.get(PIPELINE_PARAM),
    ) ?? orderedPipelines[0];

  const {
    deals,
    loading,
    error,
    refetch,
    totalCount,
    hasNextPage,
    fetchMoreRecords,
  } = usePulseBoardDeals(selectedPipeline, hasPipelineField, scope);
  const [located, setLocated] = useState<{
    pipelineId: string;
    deal: PulseBoardDeal;
  } | null>(null);
  const cardElements = useRef(new Map<string, HTMLDivElement>());
  const locatedDeal =
    located?.pipelineId === selectedPipeline?.viewId ? located.deal : null;
  const boardDeals =
    locatedDeal && !deals.some((deal) => deal.id === locatedDeal.id)
      ? [...deals, locatedDeal]
      : deals;
  useEffect(() => {
    if (!locatedDeal) return;
    const element = cardElements.current.get(locatedDeal.id);
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [locatedDeal]);
  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
  });
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const { leads } = usePulseLeads();
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const [overStage, setOverStage] = useState<string | null>(null);

  if (!isDefined(selectedPipeline)) {
    return (
      <PageCardLayout
        header={<PageHeader title={t`Opportunities`} Icon={IconTargetArrow} />}
      >
        <StyledEmpty>{t`No pipelines yet.`}</StyledEmpty>
      </PageCardLayout>
    );
  }

  const stageField = selectedPipeline.stageFieldName;
  const totalValue = boardDeals.reduce(
    (sum, deal) => sum + dealAmount(deal),
    0,
  );

  const knownStages = new Set(
    selectedPipeline.stages.map((stage) => stage.value),
  );
  const hasUnassignedStage = boardDeals.some(
    (deal) => !knownStages.has(String(deal[stageField] ?? '')),
  );
  const stages = [
    ...selectedPipeline.stages,
    ...(hasUnassignedStage
      ? [{ value: '__UNASSIGNED__', label: t`Unassigned stage`, color: 'gray' }]
      : []),
  ];

  const moveDeal = async (dealId: string, stageValue: string) => {
    await updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      idToUpdate: dealId,
      updateOneRecordInput: { [stageField]: stageValue },
    });
    setLocated((current) =>
      current?.deal.id === dealId
        ? { ...current, deal: { ...current.deal, [stageField]: stageValue } }
        : current,
    );
  };

  const handleSave = async (deal: PulseBoardDeal, update: PulseDealUpdate) => {
    await updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      idToUpdate: deal.id,
      updateOneRecordInput: {
        name: update.name,
        closeDate: update.closeDate,
        amount: {
          amountMicros: Math.round(update.amount * 1_000_000),
          currencyCode: deal.amount?.currencyCode || 'USD',
        },
        [update.stageFieldName]: update.stageValue,
        ...(hasPipelineField ? { pipeline: update.pipelineValue } : {}),
      },
    });
    setLocated((current) => {
      if (current?.deal.id !== deal.id) return current;
      if (
        update.stageFieldName !== stageField ||
        update.pipelineValue !== selectedPipeline.pipelineValue
      )
        return null;
      return {
        ...current,
        deal: {
          ...deal,
          name: update.name,
          closeDate: update.closeDate,
          amount: {
            amountMicros: Math.round(update.amount * 1_000_000),
            currencyCode: deal.amount?.currencyCode || 'USD',
          },
          [update.stageFieldName]: update.stageValue,
        },
      };
    });
  };

  const handleDelete = (deal: PulseBoardDeal) => {
    if (window.confirm(t`Delete this deal?`)) {
      void deleteOneRecord(deal.id).then(() =>
        setLocated((current) =>
          current?.deal.id === deal.id ? null : current,
        ),
      );
    }
  };

  const handleOpen = (deal: PulseBoardDeal) => {
    openRecordInSidePanel(
      isDefined(deal.company)
        ? {
            recordId: deal.company.id,
            objectNameSingular: CoreObjectNameSingular.Company,
          }
        : {
            recordId: deal.id,
            objectNameSingular: CoreObjectNameSingular.Opportunity,
          },
    );
  };

  const handleNewDeal = async () => {
    const created = await createOneRecord({
      name: t`New deal`,
      [stageField]: selectedPipeline.stages[0]?.value,
      ...(hasPipelineField ? { pipeline: selectedPipeline.pipelineValue } : {}),
    });

    openRecordInSidePanel({
      recordId: created.id,
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      isNewRecord: true,
    });
  };

  return (
    <PageCardLayout
      header={
        <PageHeader title={selectedPipeline.name} Icon={IconTargetArrow} />
      }
    >
      <StyledPage>
        <StyledBar>
          <StyledPipelinePicker
            aria-label={t`Pipeline`}
            value={selectedPipeline.viewId}
            onChange={(event) => {
              setLocated(null);
              setSearchParams({ [PIPELINE_PARAM]: event.target.value });
            }}
          >
            {orderedPipelines.map((pipeline) => (
              <option key={pipeline.viewId} value={pipeline.viewId}>
                {pipeline.name}
              </option>
            ))}
          </StyledPipelinePicker>
          <PulsePipelineSearch
            key={`${selectedPipeline.viewId}:${ownerId}:${closeFrom}:${closeTo}`}
            scope={scope}
            pipeline={selectedPipeline}
            hasPipelineField={hasPipelineField}
            onSelect={(deal) =>
              setLocated({ pipelineId: selectedPipeline.viewId, deal })
            }
            onClear={() => setLocated(null)}
          />
          <StyledTotals>
            <strong>{totalCount ?? deals.length}</strong> {t`deals`} ·{' '}
            <strong>{formatCompactMoney(totalValue)}</strong>
            {hasNextPage && <> · {t`loaded value`}</>}
          </StyledTotals>
          <PulseDealCardSettingsButton />
          <StyledNewButton type="button" onClick={handleNewDeal}>
            <IconPlus size={16} />
            {t`New deal`}
          </StyledNewButton>
        </StyledBar>
        <StyledBar>
          <StyledPipelinePicker
            aria-label={t`Deal owner`}
            value={ownerId}
            onChange={(event) => {
              setLocated(null);
              setOwnerId(event.target.value);
            }}
          >
            <option value="">{t`All users`}</option>
            <option value="__UNASSIGNED__">{t`Unassigned`}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {assignmentMemberName(member)}
              </option>
            ))}
          </StyledPipelinePicker>
          <StyledFilterLabel>
            {t`Close from`}
            <input
              type="date"
              value={closeFrom}
              max={closeTo || undefined}
              onChange={(event) => {
                setLocated(null);
                setCloseFrom(event.target.value);
              }}
            />
          </StyledFilterLabel>
          <StyledFilterLabel>
            {t`Close through`}
            <input
              type="date"
              value={closeTo}
              min={closeFrom || undefined}
              onChange={(event) => {
                setLocated(null);
                setCloseTo(event.target.value);
              }}
            />
          </StyledFilterLabel>
          {(ownerId || closeFrom || closeTo) && (
            <button
              type="button"
              onClick={() => {
                setLocated(null);
                setOwnerId('');
                setCloseFrom('');
                setCloseTo('');
              }}
            >{t`Clear filters`}</button>
          )}
        </StyledBar>
        {loading && deals.length === 0 && (
          <StyledEmpty role="status">{t`Loading pipeline…`}</StyledEmpty>
        )}
        {error && (
          <StyledEmpty role="alert">
            {t`This pipeline couldn't load.`}{' '}
            <button
              type="button"
              onClick={() => {
                void refetch();
              }}
            >{t`Try again`}</button>
          </StyledEmpty>
        )}
        {locatedDeal && (
          <StyledEmpty role="status">
            {t`Located card`}:{' '}
            {[
              locatedDeal.pointOfContact?.name?.firstName,
              locatedDeal.pointOfContact?.name?.lastName,
            ]
              .filter(Boolean)
              .join(' ') ||
              locatedDeal.company?.name ||
              locatedDeal.name}
          </StyledEmpty>
        )}
        {hasNextPage && (
          <StyledEmpty>
            <button
              type="button"
              onClick={() => {
                void fetchMoreRecords();
              }}
            >{t`Load more cards`}</button>{' '}
            · {t`Search can find deals beyond the loaded cards.`}
          </StyledEmpty>
        )}
        <StyledBoard>
          {stages.map((stage) => {
            const unassigned = stage.value === '__UNASSIGNED__';
            const stageDeals = boardDeals.filter((deal) =>
              unassigned
                ? !knownStages.has(String(deal[stageField] ?? ''))
                : deal[stageField] === stage.value,
            );
            const stageValue = stageDeals.reduce(
              (sum, deal) => sum + dealAmount(deal),
              0,
            );

            return (
              <StyledColumn
                key={stage.value}
                data-over={overStage === stage.value}
                onDragOver={(event) => {
                  if (unassigned) return;
                  event.preventDefault();
                  setOverStage(stage.value);
                }}
                onDragLeave={() => setOverStage(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  setOverStage(null);

                  const dealId = event.dataTransfer.getData('text/plain');

                  if (!unassigned && dealId.length > 0) {
                    void moveDeal(dealId, stage.value);
                  }
                }}
              >
                <StyledColumnHeader>
                  <Tag color={stage.color as TagColor}>{stage.label}</Tag>
                  <StyledColumnCount>{stageDeals.length}</StyledColumnCount>
                  <StyledColumnValue>
                    {formatCompactMoney(stageValue)}
                  </StyledColumnValue>
                </StyledColumnHeader>
                <StyledCards>
                  {stageDeals.map((deal) => (
                    <StyledCardAnchor
                      key={deal.id}
                      tabIndex={-1}
                      data-located={locatedDeal?.id === deal.id}
                      data-deal-id={deal.id}
                      ref={(element) => {
                        if (element) cardElements.current.set(deal.id, element);
                        else cardElements.current.delete(deal.id);
                      }}
                    >
                      <PulseDealCard
                        deal={deal}
                        pipeline={selectedPipeline}
                        pipelines={orderedPipelines}
                        onOpen={handleOpen}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        lastContact={
                          isDefined(deal.company)
                            ? leadById.get(deal.company.id)
                            : undefined
                        }
                      />
                    </StyledCardAnchor>
                  ))}
                  {stageDeals.length === 0 && !loading && !error && (
                    <StyledEmpty>{t`No deals`}</StyledEmpty>
                  )}
                </StyledCards>
              </StyledColumn>
            );
          })}
        </StyledBoard>
      </StyledPage>
    </PageCardLayout>
  );
};
