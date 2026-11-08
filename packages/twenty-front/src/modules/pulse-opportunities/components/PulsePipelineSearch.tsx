import {
  usePulseBoardDeals,
  type PulseBoardDeal,
} from '@/pulse-opportunities/hooks/usePulseBoardDeals';
import { type PulsePipeline } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { IconSearch, IconX } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';
import { useDebounce } from 'use-debounce';

const StyledSearch = styled.div`
  position: relative;
  flex: 1 1 280px;
  max-width: 430px;
  min-width: 0;
  @media (max-width: 640px) {
    flex-basis: 100%;
    max-width: none;
  }
`;
const StyledInputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 9px;
  color: ${themeCssVariables.font.color.secondary};
  &:focus-within {
    border-color: ${themeCssVariables.accent.accent9};
    box-shadow: 0 0 0 2px ${themeCssVariables.accent.quaternary};
  }
  input {
    background: transparent;
    border: 0;
    outline: none;
    color: ${themeCssVariables.font.color.primary};
    font: inherit;
    height: 36px;
    min-width: 0;
    width: 100%;
  }
  button {
    background: transparent;
    border: 0;
    color: inherit;
    cursor: pointer;
    display: flex;
    padding: 4px;
  }
`;
const StyledResults = styled.div`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.strong};
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
  left: 0;
  max-height: 380px;
  overflow-y: auto;
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
`;
const StyledResult = styled.button`
  background: transparent;
  border: 0;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: block;
  font: inherit;
  padding: 12px 14px;
  text-align: left;
  width: 100%;
  &[aria-selected='true'],
  &:hover {
    background: ${themeCssVariables.accent.quaternary};
  }
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.accent.accent9};
    outline-offset: -2px;
  }
  strong {
    display: block;
    font-size: 15px;
    overflow-wrap: anywhere;
  }
  small {
    color: ${themeCssVariables.font.color.secondary};
    display: block;
    margin-top: 5px;
    overflow-wrap: anywhere;
  }
`;
const StyledStatus = styled.div`
  padding: 14px;
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const PulsePipelineSearch = ({
  pipeline,
  hasPipelineField,
  onSelect,
  onClear,
}: {
  pipeline: PulsePipeline;
  hasPipelineField: boolean;
  onSelect: (deal: PulseBoardDeal) => void;
  onClear: () => void;
}) => {
  const { t } = useLingui();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [debouncedQuery] = useDebounce(query.trim(), 200);
  const results = usePulseBoardDeals(pipeline, hasPipelineField, {
    search: debouncedQuery,
    skip: !open || !debouncedQuery,
    limit: 20,
  });
  const pending = results.loading || query.trim() !== debouncedQuery;
  const show = open && query.trim().length > 0;
  const listId = `pipeline-search-${pipeline.viewId}`;
  const select = (deal: PulseBoardDeal) => {
    setOpen(false);
    onSelect(deal);
  };
  return (
    <StyledSearch
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <StyledInputRow>
        <IconSearch size={16} />
        <input
          role="combobox"
          aria-label={t`Search this pipeline`}
          aria-expanded={show}
          aria-controls={show ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            show && !pending && !results.error && results.deals[activeIndex]
              ? `${listId}-${activeIndex}`
              : undefined
          }
          placeholder={t`Find a contact, account or deal…`}
          maxLength={120}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!event.target.value.trim()) onClear();
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (!show || pending || results.error) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.max(
                  0,
                  Math.min(
                    results.deals.length - 1,
                    index + (event.key === 'ArrowDown' ? 1 : -1),
                  ),
                ),
              );
            }
            if (event.key === 'Enter' && results.deals[activeIndex]) {
              event.preventDefault();
              select(results.deals[activeIndex]);
            }
          }}
        />
        {query && (
          <button
            type="button"
            aria-label={t`Clear pipeline search`}
            onClick={() => {
              setQuery('');
              setOpen(false);
              setActiveIndex(0);
              onClear();
            }}
          >
            <IconX size={16} />
          </button>
        )}
      </StyledInputRow>
      {show && (
        <StyledResults>
          {results.error ? (
            <StyledStatus role="alert">
              {t`Search couldn't load.`}{' '}
              <button
                type="button"
                onClick={() => {
                  void results.refetch();
                }}
              >{t`Try again`}</button>
            </StyledStatus>
          ) : pending ? (
            <StyledStatus role="status">{t`Searching this pipeline…`}</StyledStatus>
          ) : (
            <>
              <div role="listbox" id={listId} aria-label={t`Matching deals`}>
                {results.deals.map((deal, index) => {
                  const name = [
                    deal.pointOfContact?.name?.firstName,
                    deal.pointOfContact?.name?.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ');
                  const stage = pipeline.stages.find(
                    (stage) => stage.value === deal[pipeline.stageFieldName],
                  );
                  return (
                    <StyledResult
                      key={deal.id}
                      id={`${listId}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => select(deal)}
                    >
                      <strong>
                        {name ||
                          deal.company?.name ||
                          deal.name ||
                          t`Untitled deal`}
                      </strong>
                      <small>
                        {[
                          deal.company?.name,
                          stage?.label || t`Unassigned stage`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </small>
                      <small>{deal.name}</small>
                    </StyledResult>
                  );
                })}
              </div>
              {results.deals.length === 0 ? (
                <StyledStatus role="status">{t`No matches in this pipeline.`}</StyledStatus>
              ) : (
                <StyledStatus>
                  {t`Select a result to jump to its card.`}
                  {results.hasNextPage && (
                    <button
                      type="button"
                      onClick={() => {
                        void results.fetchMoreRecords();
                      }}
                    >{t`More results`}</button>
                  )}
                </StyledStatus>
              )}
            </>
          )}
        </StyledResults>
      )}
    </StyledSearch>
  );
};
