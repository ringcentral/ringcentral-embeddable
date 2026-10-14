import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FunctionComponent,
} from 'react';
import { TabContext, Tabs, Tab, TabPanel } from '@ringcentral/spring-ui';
import {
  AskFirstFilledMd,
  TransferCallMd,
  VoicemailFilledMd,
} from '@ringcentral/spring-icon';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';

import type { CxTransferType } from '../../enums';
import { directTransferTypes, transferTypes } from '../../enums';
import type {
  CxDirectAgentListItem,
  CxTransferMode,
  CxTransferPhoneBookItem,
} from '../../services/CxTransferCall/CxTransferCall.interface';
import type { CxAvailableRequeueQueue } from '../../services/CxClient';
import type { DirectoryRecord } from '../../services/CxDirectorySearch';
import { InternalTransferTab } from './InternalTransferTab';
import { PhoneBookTransferTab } from './PhoneBookTransferTab';
import { ManualEntryTransferTab } from './ManualEntryTransferTab';
import { QueueTransferTab } from './QueueTransferTab';
import { CallControlGrid } from '../CallControlGrid';
import type { CallControlAction } from '../CallControlGrid';
import i18n from './i18n';

interface TransferTab {
  value: CxTransferType;
  label: string;
  disabled: boolean;
}

interface TransferPanelProps {
  allTabs: TransferTab[];
  defaultTab: CxTransferType | null;
  isTransferring: boolean;
  isDisabled: boolean;
  isVoicemailDisabled: boolean;
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
  onSelectAgent: (agentId: string) => void;
  onSelectPhoneBookContact: (index: number | null) => void;
  onManualEntryChange: (value: string) => void;
  onManualEntryKeypadPress: (key: string) => void;
  onManualEntryBackspace: () => void;
  onManualEntryClear: () => void;
  onSelectDirectoryRecord: (record: DirectoryRecord) => void;
  onQueueGroupChange: (groupId: string) => void;
  onGateChange: (gateId: string) => void;
  onTransfer: (mode: CxTransferMode) => Promise<void>;
  fetchAgentList: () => void;
}

/**
 * TransferPanel renders the tabbed transfer UI with destination selection and action buttons.
 */
export const TransferPanel: FunctionComponent<TransferPanelProps> = ({
  allTabs,
  defaultTab,
  isTransferring,
  isDisabled,
  isVoicemailDisabled,
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

  // Only the manual tab reaches the corporate directory, the one destination
  // that can take a voicemail transfer
  const showVoicemail = activeTab === transferTypes.manualEntry;

  const actions = useMemo<CallControlAction[]>(() => {
    // Names the destination on the manual tab, where a typed extension
    // otherwise gives no sign of who is behind the digits. Empty on the other
    // tabs, which spell their destination out themselves.
    const tooltip = transferDestinationLabel
      ? t('transferToTip', { destination: transferDestinationLabel })
      : undefined;
    const transferActions: CallControlAction[] = [
      {
        actionType: 'askFirstTransfer',
        symbol: AskFirstFilledMd,
        label: t('askFirst'),
        disabled: isDisabled || isTransferring,
        tooltip,
        onClick: () => onTransfer(directTransferTypes.WARM),
      },
      {
        actionType: 'executeTransfer',
        symbol: TransferCallMd,
        label: t('transfer'),
        disabled: isDisabled || isTransferring,
        tooltip,
        onClick: () => onTransfer(directTransferTypes.COLD),
      },
    ];
    if (showVoicemail) {
      transferActions.push({
        actionType: 'voicemailTransfer',
        symbol: VoicemailFilledMd,
        label: t('toVoicemail'),
        disabled: isVoicemailDisabled || isTransferring,
        onClick: () => onTransfer(directTransferTypes.VOICEMAIL),
      });
    }
    return transferActions;
  }, [
    t,
    showVoicemail,
    transferDestinationLabel,
    isDisabled,
    isVoicemailDisabled,
    isTransferring,
    onTransfer,
  ]);

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
            marked `hidden`. Preflight's `[hidden]` rule loses to a display
            utility such as `flex`, so a panel that sets one has to re-hide
            itself, or it keeps its flex-1 share of the height while inactive. */}
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
            className="flex-1 min-h-0 flex flex-col [&[hidden]]:hidden"
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
      <CallControlGrid
        className="flex-shrink-0 px-4 pt-2 pb-4 gap-x-2"
        data-sign="transferActions"
        columns={showVoicemail ? 3 : 2}
        // Smaller than the call page's buttons: the manual tab's keypad has
        // to fit above them without scrolling
        buttonSize="large"
        // Translated labels run long ("Vers la messagerie vocale"): two
        // lines fit them, the smaller buttons leave room for that
        maxLabelLines={2}
        actions={actions}
      />
    </div>
  );
};
