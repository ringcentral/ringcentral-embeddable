import React, { useCallback, useEffect, useMemo, useRef, type FunctionComponent } from 'react';
import { Autocomplete, Chip, ListItemText, StatusIndicator } from '@ringcentral/spring-ui';
import type { AutocompleteRef, SuggestionListItemData } from '@ringcentral/spring-ui';

import type { CxDirectAgentListItem } from '../../services/CxTransferCall/CxTransferCall.interface';
import { filterByContains } from './filterOptions';

const AGENT_LIST_POLL_INTERVAL = 3000;

interface AgentOption extends SuggestionListItemData {
  agentId: string;
  available: boolean;
}

interface InternalTransferTabProps {
  isActive: boolean;
  agentList: CxDirectAgentListItem[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  fetchAgentList: () => void;
  labels: {
    searchAgents: string;
    noAgents: string;
    available: string;
    unavailable: string;
  };
}

/**
 * Internal transfer tab content with agent autocomplete and periodic polling.
 */
export const InternalTransferTab: FunctionComponent<InternalTransferTabProps> = ({
  isActive,
  agentList,
  selectedAgentId,
  onSelectAgent,
  fetchAgentList,
  labels,
}) => {
  const actionRef = useRef<AutocompleteRef>(null);

  useEffect(() => {
    fetchAgentList();
    const timerId = setInterval(fetchAgentList, AGENT_LIST_POLL_INTERVAL);
    return () => clearInterval(timerId);
  }, [fetchAgentList]);

  useEffect(() => {
    if (isActive) {
      actionRef.current?.focus();
    }
  }, [isActive]);

  const options: AgentOption[] = useMemo(
    () =>
      agentList.map((agent) => ({
        id: agent.agentId,
        label: (agent.firstName || agent.lastName)
          ? `${agent.firstName} ${agent.lastName}`.trim()
          : agent.username,
        agentId: agent.agentId,
        available: agent.available,
      })),
    [agentList],
  );

  const selectedValue = useMemo(() => {
    if (!selectedAgentId) return [];
    const found = options.find((o) => o.agentId === selectedAgentId);
    return found ? [found] : [];
  }, [options, selectedAgentId]);

  const handleChange = useCallback(
    (selectedItems: SuggestionListItemData[]) => {
      const selected = selectedItems.length > 0
        ? (selectedItems[selectedItems.length - 1] as AgentOption)
        : null;
      onSelectAgent(selected?.agentId ?? '');
    },
    [onSelectAgent],
  );

  return (
    <div className="flex-1 overflow-hidden" data-sign="internalTransferTab">
      <Autocomplete
        action={actionRef}
        data-sign="agentAutocomplete"
        variant="tags"
        inputVariant="outlined"
        options={options}
        value={selectedValue}
        onChange={handleChange}
        placeholder={labels.searchAgents}
        openOnFocus
        toggleButton
        size="medium"
        filterOptions={filterByContains}
        renderTags={(selectedItems, getTagProps) =>
          selectedItems.map((item, index) => {
            const agent = item as AgentOption;
            const { label, ...itemChipProps } = getTagProps(item, index);
            const { id, ...rest } = agent;
            return (
              <Chip
                key={id}
                label={label}
                aria-label={`${label}, press Backspace to remove`}
                {...rest}
                {...itemChipProps}
                size="small"
                startSlot={
                  <StatusIndicator
                    variant={agent.available ? 'available' : 'unavailable'}
                    size="medium"
                  />
                }
              />
            );
          })
        }
        renderOption={(option, state) => {
          const { agentId, available, label, id, error, disabled, className, ...restProps } = option as AgentOption & Record<string, unknown>;
          const itemClassName = [
            'sui-suggestion-list-item',
            state.highlighted && 'sui-suggestion-list-highlighted',
            className,
          ].filter(Boolean).join(' ');
          return (
            <div
              id={`${id}`}
              className={itemClassName}
              {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
              key={`${id || label}-${state.index}`}
            >
              <StatusIndicator
                variant={available ? 'available' : 'unavailable'}
                size="medium"
              />
              <ListItemText
                primary={label}
                secondary={available ? labels.available : labels.unavailable}
              />
            </div>
          );
        }}
      />
    </div>
  );
};
