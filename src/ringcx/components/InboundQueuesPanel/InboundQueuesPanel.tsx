import React, { useState, useCallback, useMemo } from 'react';
import {
  Button,
  Checkbox,
  Icon,
  TextField,
  List,
  ListItem,
  ListItemText,
  FormLabel,
} from '@ringcentral/spring-ui';
import { SearchMd } from '@ringcentral/spring-icon';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { InboundQueuesPanelProps } from './InboundQueuesPanel.interface';
import i18n from './i18n';

/**
 * InboundQueuesPanel - Panel for selecting inbound queues
 * Provides search, select all, and individual selection functionality
 */
function InboundQueuesPanel({
  inboundQueues,
  selectedQueueIds,
  onSubmit,
  onBack,
}: InboundQueuesPanelProps) {
  const { t } = useLocale(i18n);
  const [searchText, setSearchText] = useState('');
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedQueueIds);
  const filteredQueues = useMemo(() => {
    if (!searchText.trim()) {
      return inboundQueues;
    }
    const lowerSearch = searchText.toLowerCase();
    return inboundQueues.filter((queue) =>
      queue.gateName.toLowerCase().includes(lowerSearch),
    );
  }, [inboundQueues, searchText]);

  const isAllSelected = useMemo(() => {
    return (
      inboundQueues.length > 0 &&
      inboundQueues.every((queue) => localSelectedIds.includes(queue.gateId))
    );
  }, [inboundQueues, localSelectedIds]);

  const isIndeterminate = useMemo(() => {
    return (
      localSelectedIds.length > 0 &&
      localSelectedIds.length < inboundQueues.length
    );
  }, [inboundQueues, localSelectedIds]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
    },
    [],
  );

  const handleQueueToggle = useCallback((gateId: string) => {
    setLocalSelectedIds((prev) =>
      prev.includes(gateId)
        ? prev.filter((id) => id !== gateId)
        : [...prev, gateId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setLocalSelectedIds([]);
    } else {
      setLocalSelectedIds(inboundQueues.map((queue) => queue.gateId));
    }
  }, [isAllSelected, inboundQueues]);

  const handleSubmit = useCallback(() => {
    onSubmit(localSelectedIds);
  }, [onSubmit, localSelectedIds]);

  const handleBack = useCallback(() => {
    onBack();
  }, [onBack]);

  return (
    <div className="flex flex-col h-full bg-neutral-base">
      {/* Header */}
      <PageHeader onBackClick={handleBack}>
        {t('inboundQueues')}
      </PageHeader>
      {/* Search */}
      <div className="px-4 py-3">
        <TextField
          data-sign="searchInput"
          value={searchText}
          onChange={handleSearchChange}
          placeholder={t('search')}
          variant="outlined"
          size="large"
          fullWidth
          clearBtn={false}
          startAdornment={(
            <Icon symbol={SearchMd} size="small" className="text-neutral-b3" />
          )}
        />
      </div>
      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        <List>
          {filteredQueues.map((queue) => (
            <ListItem
              key={queue.gateId}
              onClick={() => handleQueueToggle(queue.gateId)}
              className="cursor-pointer"
            >
              <Checkbox
                checked={localSelectedIds.includes(queue.gateId)}
                onChange={() => handleQueueToggle(queue.gateId)}
              />
              <ListItemText
                primary={queue.gateName}
              />
            </ListItem>
          ))}
        </List>
      </div>
      {/* Footer */}
      <div className="px-4 py-4 border-t border-neutral-b4">
        <div className="flex items-center justify-between mb-4">
          <FormLabel
            label={t('selectAll')}
            placement="end"
          >
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={handleSelectAll}
              data-sign="bulkChangeCheckBox"
            />
          </FormLabel>
          <span
            className="typography-descriptor text-neutral-b2"
            data-sign="selectedTips"
          >
            {t('selectedTips', {
              totalInboundQueuesNumber: inboundQueues.length,
              assignedInboundQueuesNumber: localSelectedIds.length,
            })}
          </span>
        </div>
        <Button
          data-sign="update"
          onClick={handleSubmit}
          fullWidth
        >
          {t('update')}
        </Button>
      </div>
    </div>
  );
}

export { InboundQueuesPanel };
