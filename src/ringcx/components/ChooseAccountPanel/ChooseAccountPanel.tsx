import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { List, ListItem, ListItemText, Icon } from '@ringcentral/spring-ui';
import { ArrowRightMd } from '@ringcentral/spring-icon';
import React, { useCallback } from 'react';

import type { ChooseAccountPanelProps } from './ChooseAccountPanel.interface';
import i18n from './i18n';

/**
 * ChooseAccountPanel - Displays a list of agent accounts for selection
 */
function ChooseAccountPanel({
  agents,
  isLoading = false,
  onSelectAgent,
}: ChooseAccountPanelProps) {
  const { t } = useLocale(i18n);

  const handleSelectAgent = useCallback(
    (agentId: string) => {
      if (isLoading) return;
      onSelectAgent(agentId);
    },
    [isLoading, onSelectAgent],
  );

  return (
    <div className="flex flex-col h-full bg-neutral-base">
      <List className="flex-1 overflow-y-auto">
        {agents.map((agent) => (
          <ListItem
            key={agent.agentId}
            size="large"
            divider
            clickable
            onClick={() => handleSelectAgent(agent.agentId)}
            data-sign="subAccount"
            className={isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <ListItemText
              primary={agent.accountName}
              secondary={t(agent.agentType)}
            />
            <Icon symbol={ArrowRightMd} size="medium" />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export { ChooseAccountPanel };
