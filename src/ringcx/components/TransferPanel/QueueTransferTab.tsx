import React, { useMemo, type FunctionComponent } from 'react';
import { Select, Option, MenuItemText } from '@ringcentral/spring-ui';

import type { CxAvailableRequeueQueue } from '../../services/CxClient';

interface QueueTransferTabProps {
  queueGroups: CxAvailableRequeueQueue[];
  selectedQueueGroupId: string;
  selectedGateId: string;
  onQueueGroupChange: (groupId: string) => void;
  onGateChange: (gateId: string) => void;
  labels: {
    selectQueueGroup: string;
    selectQueue: string;
    noGroups: string;
    noQueues: string;
    selectAGroup: string;
    selectAQueue: string;
  };
}

/**
 * Queue transfer tab content with two-level queue group/gate selectors.
 */
export const QueueTransferTab: FunctionComponent<QueueTransferTabProps> = ({
  queueGroups,
  selectedQueueGroupId,
  selectedGateId,
  onQueueGroupChange,
  onGateChange,
  labels,
}) => {
  const selectedGroup = useMemo(
    () => queueGroups.find((g) => g.gateGroupId === selectedQueueGroupId),
    [queueGroups, selectedQueueGroupId],
  );

  const gates = selectedGroup?.gates ?? [];

  const renderGroupValue = useMemo(
    () => (value: unknown) => {
      const group = queueGroups.find((g) => g.gateGroupId === value);
      return group?.groupName ?? '';
    },
    [queueGroups],
  );

  const renderGateValue = useMemo(
    () => (value: unknown) => {
      const gate = gates.find((g) => g.gateId === value);
      return gate?.gateName ?? '';
    },
    [gates],
  );

  return (
    <div className="flex flex-col gap-4 flex-1" data-sign="queueTransferTab">
      <Select
        data-sign="queueGroupSelect"
        label={labels.selectQueueGroup}
        value={selectedQueueGroupId}
        renderValue={renderGroupValue}
        onChange={(e) => {
          const groupId = e.target.value as string;
          onQueueGroupChange(groupId);
          onGateChange('');
        }}
        variant="outlined"
        size="medium"
        placeholder={labels.selectAGroup}
      >
        {queueGroups.length === 0 ? (
          <Option value="" disabled>
            <MenuItemText primary={labels.noGroups} />
          </Option>
        ) : (
          queueGroups.map((group) => (
            <Option key={group.gateGroupId} value={group.gateGroupId}>
              <MenuItemText primary={group.groupName} />
            </Option>
          ))
        )}
      </Select>
      <Select
        data-sign="queueGateSelect"
        label={labels.selectQueue}
        value={selectedGateId}
        renderValue={renderGateValue}
        onChange={(e) => onGateChange(e.target.value as string)}
        variant="outlined"
        size="medium"
        disabled={!selectedQueueGroupId || gates.length === 0}
        placeholder={labels.selectAQueue}
      >
        {gates.length === 0 ? (
          <Option value="" disabled>
            <MenuItemText primary={labels.noQueues} />
          </Option>
        ) : (
          gates.map((gate) => (
            <Option key={gate.gateId} value={gate.gateId}>
              <MenuItemText primary={gate.gateName} />
            </Option>
          ))
        )}
      </Select>
    </div>
  );
};
