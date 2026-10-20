import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components/ContactAvatar';
import { CopyIconButtonSpring } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  ActionMenuList,
  PageHeaderBackButton,
} from '@ringcentral-integration/next-widgets/components';
import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components/ActionMenuList';
import { EditMd, LinkContactMd, MissedCallMd } from '@ringcentral/spring-icon';
import { Button } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import type { FunctionComponent } from 'react';
import React from 'react';

import { formatPhoneNumber } from '../../lib/FormatPhoneNumber';
import type { CxLeadInfoData } from '../../services/CxLeadInfo/CxLeadInfo.interface';
import { LeadHistoryCard } from './LeadHistoryCard';
import { LeadInfoCards } from './LeadInfoCards';
import type { LeadInfoPanelProps } from './LeadInfoPanel.interface';
import i18n from './i18n';

/** Actions shown as buttons; the rest go in the More menu. */
const ACTION_DISPLAY_COUNT = 3;

const MANUAL_PASS_ACTION = 'manualPass';

const PANEL_CLASS_NAME =
  'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-base';

const BODY_CLASS_NAME = 'min-h-0 flex-1 overflow-y-auto px-4 py-2';

interface LeadPhoneNumberProps {
  phoneNumber: string;
  /** Set when a click on the number dials it. */
  onDial?: (phoneNumber: string) => void;
  isDialDisabled: boolean;
}

/**
 * A lead's number, which dials it when the lead can be dialed, as the Leads
 * list's numbers do.
 */
const LeadPhoneNumber: FunctionComponent<LeadPhoneNumberProps> = ({
  phoneNumber,
  onDial,
  isDialDisabled,
}) => {
  const { t } = useLocale(i18n);
  const formatted = formatPhoneNumber({ phoneNumber }) || phoneNumber;
  return (
    <div
      className="flex min-w-0 items-center gap-1"
      data-sign="leadPhoneNumber"
    >
      {onDial ? (
        <Button
          variant="text"
          size="small"
          disabled={isDialDisabled}
          onClick={() => onDial(phoneNumber)}
          className="min-w-0 justify-start p-0 text-left"
          TooltipProps={{ title: t('callNumber', { number: formatted }) }}
          data-sign="leadPhoneNumberButton"
        >
          <span className="typography-descriptor truncate text-primary-b hover:underline">
            {formatted}
          </span>
        </Button>
      ) : (
        <p
          className="typography-descriptor truncate text-neutral-b2"
          title={formatted}
        >
          {formatted}
        </p>
      )}
      <CopyIconButtonSpring text={formatted} />
    </div>
  );
};

interface LeadInfoHeaderProps {
  info: CxLeadInfoData;
  buttons: ActionMenuListButtonProps[];
  previewActions: LeadInfoPanelProps['previewActions'];
  showCloseButton: boolean;
  onClose: () => void;
}

/**
 * Back, avatar, name and number, then the actions, as the EX call detail
 * page header.
 */
const LeadInfoHeader: FunctionComponent<LeadInfoHeaderProps> = ({
  info,
  buttons,
  previewActions,
  showCloseButton,
  onClose,
}) => {
  const { t } = useLocale(i18n);
  const name = info.name || t('unknown');
  const dialNumbers = previewActions?.dialNumbers ?? [];
  return (
    <div
      className={clsx(
        // A multi-number lead lists each number, so the header can grow.
        'flex min-h-[72px] flex-none items-center gap-1 pr-2 pt-2',
        showCloseButton ? 'pl-2' : 'pl-4',
      )}
      data-sign="leadInfoHeader"
    >
      {showCloseButton ? (
        <PageHeaderBackButton
          onClick={onClose}
          className="flex-none"
          size="medium"
          data-sign="leadInfoClose"
        />
      ) : null}
      <div className="flex flex-auto items-center gap-2 overflow-hidden">
        <ContactAvatar
          size="large"
          variant="circle"
          contactName={info.name || undefined}
          phoneNumber={info.phoneNumbers[0]}
        />
        <div className="ml-1 flex flex-auto flex-col overflow-hidden">
          <h2
            className="typography-subtitle truncate text-neutral-b0"
            data-sign="leadName"
            title={name}
          >
            {name}
          </h2>
          {info.phoneNumbers.map((phoneNumber) => (
            <LeadPhoneNumber
              key={phoneNumber}
              phoneNumber={phoneNumber}
              onDial={
                dialNumbers.includes(phoneNumber)
                  ? previewActions?.onDial
                  : undefined
              }
              isDialDisabled={
                !!previewActions?.isDialDisabled ||
                !!previewActions?.dialedNumbers.includes(phoneNumber)
              }
            />
          ))}
        </div>
      </div>
      {buttons.length ? (
        <div className="flex flex-none items-center gap-1">
          <ActionMenuList
            buttons={buttons}
            displayCount={ACTION_DISPLAY_COUNT}
            variant="plain"
            moreButtonProps={{ variant: 'outlined', color: 'neutral' }}
          />
        </div>
      ) : null}
    </div>
  );
};

interface CreateActionButtonOptions {
  actionType: string;
  label: string;
  symbol: ActionMenuListButtonProps['symbol'];
  color?: ActionMenuListButtonProps['color'];
  disabled?: boolean;
  onClick: () => void;
}

/**
 * An outlined button, as the Leads list's lead actions are.
 */
function createActionButton({
  actionType,
  label,
  symbol,
  color = 'neutral',
  disabled = false,
  onClick,
}: CreateActionButtonOptions): ActionMenuListButtonProps {
  return {
    actionType,
    color,
    disabled,
    label,
    onClick: (event) => {
      event.stopPropagation();
      onClick();
    },
    shape: 'squircle',
    size: 'medium',
    symbol,
    variant: 'outlined',
  };
}

interface UseLeadActionButtonsOptions {
  info: CxLeadInfoData | null;
  previewActions: LeadInfoPanelProps['previewActions'];
  canEdit: boolean;
  onOpenEdit: () => void;
  showViewLeadButton: boolean;
  onViewLead: LeadInfoPanelProps['onViewLead'];
  onOpenManualPass: () => void;
}

/**
 * Edit when the campaign allows it, manual pass for a lead not on a call,
 * and the host lead viewer for any lead. The lead's numbers dial it
 * themselves.
 */
function useLeadActionButtons({
  info,
  previewActions,
  canEdit,
  onOpenEdit,
  showViewLeadButton,
  onViewLead,
  onOpenManualPass,
}: UseLeadActionButtonsOptions): ActionMenuListButtonProps[] {
  const { t } = useLocale(i18n);
  if (!info) {
    return [];
  }
  const editButtons = canEdit
    ? [
        createActionButton({
          actionType: 'edit',
          label: t('edit'),
          symbol: EditMd,
          onClick: onOpenEdit,
        }),
      ]
    : [];
  const manualPassButtons = previewActions?.showManualPass
    ? [
        createActionButton({
          actionType: MANUAL_PASS_ACTION,
          label: t('manualPass'),
          symbol: MissedCallMd,
          color: 'danger',
          disabled: previewActions.isManualPassDisabled,
          onClick: onOpenManualPass,
        }),
      ]
    : [];
  const viewLeadButtons = showViewLeadButton
    ? [
        createActionButton({
          actionType: 'viewLead',
          label: t('viewLead'),
          symbol: LinkContactMd,
          onClick: () => onViewLead(info.lead),
        }),
      ]
    : [];
  return [...editButtons, ...manualPassButtons, ...viewLeadButtons];
}

/**
 * The RingCX Lead side widget tab, laid out as the EX call detail page: a
 * header with the lead's name, number and actions, then the Lead details
 * Agent One shows (`containers/CallDetails/LeadInfoPanel`) in cards.
 *
 * With no tab bar above it, the header starts with a back button that
 * closes the tab. Edit and manual pass open their own tabs.
 */
export const LeadInfoPanel: FunctionComponent<LeadInfoPanelProps> = ({
  info,
  showViewLeadButton,
  onViewLead,
  previewActions,
  editActions,
  loadRecording,
  loadLeadHistory,
  showCloseButton,
  onClose,
}) => {
  const { t } = useLocale(i18n);
  const buttons = useLeadActionButtons({
    info,
    previewActions,
    canEdit: !!editActions,
    onOpenEdit: () => editActions?.onOpenEdit(),
    showViewLeadButton,
    onViewLead,
    onOpenManualPass: () => previewActions?.onOpenManualPass(),
  });
  if (!info) {
    return (
      <section className={PANEL_CLASS_NAME} data-sign="leadInfoPanel">
        <div className={BODY_CLASS_NAME}>
          <div className="typography-mainText text-center text-neutral-b2">
            {t('leadNotAvailable')}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className={PANEL_CLASS_NAME} data-sign="leadInfoPanel">
      <LeadInfoHeader
        info={info}
        buttons={buttons}
        previewActions={previewActions}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />
      <div className={BODY_CLASS_NAME}>
        <LeadInfoCards rows={info.rows} loadRecording={loadRecording} />
        {loadLeadHistory && info.lead.leadId ? (
          <LeadHistoryCard
            key={info.lead.leadId}
            leadId={info.lead.leadId}
            loadLeadHistory={loadLeadHistory}
          />
        ) : null}
      </div>
    </section>
  );
};
