import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
} from 'react';
import { TabContext, Tabs, Tab, TabPanel, Switch, Button } from '@ringcentral/spring-ui';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';

import type { CxTransferType } from '../../enums';
import { transferTypes } from '../../enums';
import type { CxDirectAgentListItem, CxTransferPhoneBookItem } from '../../services/CxTransferCall/CxTransferCall.interface';
import type { CxAvailableRequeueQueue } from '../../services/CxClient';
import type { DirectoryRecord } from '../../services/CxDirectorySearch';
import { InternalTransferTab } from './InternalTransferTab';
import { PhoneBookTransferTab } from './PhoneBookTransferTab';
import { ManualEntryTransferTab } from './ManualEntryTransferTab';
import { QueueTransferTab } from './QueueTransferTab';
import i18n from './i18n';

interface TransferTab {
  value: CxTransferType;
  label: string;
  disabled: boolean;
}

interface TransferPanelProps {
  allTabs: TransferTab[];
  defaultTab: CxTransferType | null;
  isStayOnCall: boolean;
  isTransferring: boolean;
  isDisabled: boolean;
  agentList: CxDirectAgentListItem[];
  phoneBook: CxTransferPhoneBookItem[];
  selectedAgentId: string | null;
  selectedPhoneBookIndex: number | null;
  manualEntryNumber: string;
  manualEntryDirectoryRecords: DirectoryRecord[];
  selectedDirectoryRecordId: string | null;
  matchedDirectoryName: string;
  transferDestinationLabel: string;
  isSearchingDirectory: boolean;
  showManualEntryKeypad: boolean;
  queueGroups: CxAvailableRequeueQueue[];
  selectedQueueGroupId: string;
  selectedGateId: string;
  onTabChange: (type: CxTransferType) => void;
  onStayOnCallChange: () => void;
  onSelectAgent: (agentId: string) => void;
  onSelectPhoneBookContact: (index: number | null) => void;
  onManualEntryChange: (value: string) => void;
  onManualEntryKeypadPress: (key: string) => void;
  onManualEntryBackspace: () => void;
  onManualEntryClear: () => void;
  onSelectDirectoryRecord: (record: DirectoryRecord) => void;
  onQueueGroupChange: (groupId: string) => void;
  onGateChange: (gateId: string) => void;
  onTransfer: () => Promise<void>;
  onCancel: () => void;
  fetchAgentList: () => void;
}

/**
 * TransferPanel renders the tabbed transfer UI with destination selection and action buttons.
 */
export const TransferPanel: FunctionComponent<TransferPanelProps> = ({
  allTabs,
  defaultTab,
  isStayOnCall,
  isTransferring,
  isDisabled,
  agentList,
  phoneBook,
  selectedAgentId,
  selectedPhoneBookIndex,
  manualEntryNumber,
  manualEntryDirectoryRecords,
  selectedDirectoryRecordId,
  matchedDirectoryName,
  transferDestinationLabel,
  isSearchingDirectory,
  showManualEntryKeypad,
  queueGroups,
  selectedQueueGroupId,
  selectedGateId,
  onTabChange,
  onStayOnCallChange,
  onSelectAgent,
  onSelectPhoneBookContact,
  onManualEntryChange,
  onManualEntryKeypadPress,
  onManualEntryBackspace,
  onManualEntryClear,
  onSelectDirectoryRecord,
  onQueueGroupChange,
  onGateChange,
  onTransfer,
  onCancel,
  fetchAgentList,
}) => {
  const { t } = useLocale(i18n);
  const [activeTab, setActiveTab] = useState<CxTransferType | null>(defaultTab);

  const availableTabs = useMemo(
    () => allTabs.filter((tab) => !tab.disabled),
    [allTabs],
  );

  const availableTabValues = useMemo(
    () => new Set(availableTabs.map((tab) => tab.value)),
    [availableTabs],
  );

  // Tracks the tab already reported to the parent, so the initially active tab
  // is synced as well. Without it the parent keeps its own default transfer
  // type and destination validation runs against the wrong tab.
  const reportedTabRef = useRef<CxTransferType | null>(null);

  useEffect(() => {
    const shouldReset = activeTab === null || !availableTabValues.has(activeTab);
    const nextTab = shouldReset ? defaultTab : activeTab;
    if (nextTab === null) return;
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
    if (reportedTabRef.current !== nextTab) {
      reportedTabRef.current = nextTab;
      onTabChange(nextTab);
    }
  }, [activeTab, defaultTab, availableTabValues, onTabChange]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent | null, value: string | number | null) => {
      if (value === null) return;
      const tabValue = value as CxTransferType;
      if (!availableTabValues.has(tabValue)) return;
      setActiveTab(tabValue);
      reportedTabRef.current = tabValue;
      onTabChange(tabValue);
    },
    [onTabChange, availableTabValues],
  );

  return (
    <div className="flex flex-col flex-1 bg-neutral-base overflow-hidden">
      <TabContext value={activeTab} onChange={handleTabChange}>
        <div className="px-4 pt-2 flex-shrink-0">
          <Tabs variant="moreMenu" data-sign="transferTabs">
            {availableTabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                id={tab.value}
                label={tab.label}
                data-sign={`transferTab-${tab.value}`}
              />
            ))}
          </Tabs>
        </div>
        {/* A bounded flex column, not a scroller: the manual tab pins its
            number field and scrolls only the keypad below it, which needs the
            panel itself to be the height-bounded box. Each TabPanel therefore
            owns its own scrolling. Inactive panels still render their root div,
            but MUI marks them `hidden` (display:none) so they take no space. */}
        <div className="flex-1 min-h-0 px-4 pt-4 pb-2 flex flex-col overflow-hidden">
          <TabPanel
            value={transferTypes.internal}
            className="flex-1 min-h-0 overflow-y-auto"
          >
            <InternalTransferTab
              isActive={activeTab === transferTypes.internal}
              agentList={agentList}
              selectedAgentId={selectedAgentId}
              onSelectAgent={onSelectAgent}
              fetchAgentList={fetchAgentList}
              labels={{
                searchAgents: t('searchAgents'),
                noAgents: t('noAgents'),
                available: t('available'),
                unavailable: t('unavailable'),
              }}
            />
          </TabPanel>
          <TabPanel
            value={transferTypes.phoneBook}
            className="flex-1 min-h-0 overflow-y-auto"
          >
            <PhoneBookTransferTab
              isActive={activeTab === transferTypes.phoneBook}
              phoneBook={phoneBook}
              selectedIndex={selectedPhoneBookIndex}
              onSelectContact={onSelectPhoneBookContact}
              labels={{
                searchContacts: t('searchContacts'),
                noContacts: t('noContacts'),
              }}
            />
          </TabPanel>
          <TabPanel
            value={transferTypes.manualEntry}
            className="flex-1 min-h-0 flex flex-col"
          >
            <ManualEntryTransferTab
              isActive={activeTab === transferTypes.manualEntry}
              value={manualEntryNumber}
              directoryRecords={manualEntryDirectoryRecords}
              selectedDirectoryRecordId={selectedDirectoryRecordId}
              matchedDirectoryName={matchedDirectoryName}
              isSearchingDirectory={isSearchingDirectory}
              showKeypad={showManualEntryKeypad}
              onChange={onManualEntryChange}
              onKeypadPress={onManualEntryKeypadPress}
              onBackspace={onManualEntryBackspace}
              onClear={onManualEntryClear}
              onSelectDirectoryRecord={onSelectDirectoryRecord}
              labels={{
                enterNumber: t('enterNumber'),
                searchingDirectory: t('searchingDirectory'),
                corporateDirectory: t('corporateDirectory'),
                extension: (extensionNumber: string) =>
                  t('extension', { extensionNumber }),
              }}
            />
          </TabPanel>
          <TabPanel
            value={transferTypes.queue}
            className="flex-1 min-h-0 overflow-y-auto"
          >
            <QueueTransferTab
              queueGroups={queueGroups}
              selectedQueueGroupId={selectedQueueGroupId}
              selectedGateId={selectedGateId}
              onQueueGroupChange={onQueueGroupChange}
              onGateChange={onGateChange}
              labels={{
                selectQueueGroup: t('selectQueueGroup'),
                selectQueue: t('selectQueue'),
                noGroups: t('noGroups'),
                noQueues: t('noQueues'),
                selectAGroup: t('selectAGroup'),
                selectAQueue: t('selectAQueue'),
              }}
            />
          </TabPanel>
        </div>
      </TabContext>
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <Switch
            data-sign="stayOnCall"
            checked={isStayOnCall}
            onChange={onStayOnCallChange}
          />
          <span className="typography-mainText">{t('stayOnCall')}</span>
        </div>
        <div className="flex gap-2">
          <Button
            data-sign="cancelTransfer"
            variant="outlined"
            color="neutral"
            fullWidth
            onClick={onCancel}
          >
            {t('cancel')}
          </Button>
          <Button
            data-sign="executeTransfer"
            variant="contained"
            color="primary"
            fullWidth
            disabled={isDisabled}
            loading={isTransferring}
            onClick={onTransfer}
            // Names the destination on the manual tab, where a typed extension
            // otherwise gives no sign of who is behind the digits. Empty on the
            // other tabs, which spell their destination out themselves.
            TooltipProps={
              transferDestinationLabel
                ? {
                    title: t('transferToTip', {
                      destination: transferDestinationLabel,
                    }),
                  }
                : undefined
            }
          >
            {t('transfer')}
          </Button>
        </div>
      </div>
    </div>
  );
};
