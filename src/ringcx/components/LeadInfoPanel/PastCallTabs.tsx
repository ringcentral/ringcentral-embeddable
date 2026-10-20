import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Tab, TabContext, Tabs } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import type { FunctionComponent } from 'react';
import React, { useState } from 'react';

import { LeadHistoryCard } from './LeadHistoryCard';
import { LeadInfoCards } from './LeadInfoCards';
import type { PastCallTabsProps } from './LeadInfoPanel.interface';
import i18n from './i18n';

type PastCallTab = 'call' | 'lead' | 'history';

/**
 * Pill tabs that keep a past lead call's detail page short, under the call's
 * who-and-when cards: the call's disposition and term details, the lead's
 * details, and the lead's history, which loads the first
 * time its tab is opened and is kept while the agent switches tabs.
 */
export const PastCallTabs: FunctionComponent<PastCallTabsProps> = ({
  callContent,
  leadId,
  rows,
  loadRecording,
  loadLeadHistory,
}) => {
  const { t } = useLocale(i18n);
  const hasCallTab = !!callContent;
  const [activeTab, setActiveTab] = useState<PastCallTab>(
    hasCallTab ? 'call' : 'lead',
  );
  const [isHistoryOpened, setHistoryOpened] = useState(false);
  const selectTab = (tab: PastCallTab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      setHistoryOpened(true);
    }
  };
  const panelClassName = (tab: PastCallTab) =>
    clsx(activeTab !== tab && 'hidden');
  return (
    <>
      <TabContext
        value={activeTab}
        onChange={(_, value) => selectTab(value as PastCallTab)}
      >
        {/* Sticky, so a long Lead tab can still switch tabs. */}
        <div className="sticky top-0 z-10 -mx-4 mb-1 bg-neutral-base px-4 pb-2">
          <Tabs variant="moreMenu" pill size="small" data-sign="pastCallTabs">
            {hasCallTab ? (
              <Tab
                value="call"
                id="pastCallTab-call"
                label={t('callTab')}
                data-sign="pastCallTab-call"
              />
            ) : null}
            <Tab
              value="lead"
              id="pastCallTab-lead"
              label={t('lead')}
              data-sign="pastCallTab-lead"
            />
            {loadLeadHistory ? (
              <Tab
                value="history"
                id="pastCallTab-history"
                label={t('history')}
                data-sign="pastCallTab-history"
              />
            ) : null}
          </Tabs>
        </div>
      </TabContext>
      {hasCallTab ? (
        <div className={panelClassName('call')} data-sign="pastCallPanel-call">
          {callContent}
        </div>
      ) : null}
      <div className={panelClassName('lead')} data-sign="pastCallPanel-lead">
        <LeadInfoCards rows={rows} loadRecording={loadRecording} />
      </div>
      {loadLeadHistory && isHistoryOpened ? (
        <div
          className={panelClassName('history')}
          data-sign="pastCallPanel-history"
        >
          <LeadHistoryCard
            key={leadId}
            leadId={leadId}
            loadLeadHistory={loadLeadHistory}
            autoLoad
            showTitle={false}
          />
        </div>
      ) : null}
    </>
  );
};
