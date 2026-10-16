import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components/ContactAvatar';
import { CopyIconButtonSpring } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  ActionMenuList,
  PageHeaderBackButton,
} from '@ringcentral-integration/next-widgets/components';
import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components/ActionMenuList';
import { LinkContactMd, MissedCallMd } from '@ringcentral/spring-icon';
import { Button } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import type { FunctionComponent } from 'react';
import React, { useState } from 'react';

import { formatPhoneNumber } from '../../lib/FormatPhoneNumber';
import type {
  CxLeadInfoData,
  CxLeadInfoGroup,
  CxLeadInfoRow,
} from '../../services/CxLeadInfo/CxLeadInfo.interface';
import { DetailCard, DetailField } from '../DetailCard';
import { ManualPassModal } from '../ManualPassModal';
import type { LeadInfoPanelProps } from './LeadInfoPanel.interface';
import { LeadRecordingPlayer } from './LeadRecordingPlayer';
import i18n from './i18n';

/** Shown for an extra data field the lead left empty. */
const EMPTY_VALUE = '-';

/** Card order, top to bottom. */
const GROUP_ORDER: readonly CxLeadInfoGroup[] = [
  'status',
  'contact',
  'ids',
  'aux',
  'extra',
];

/** Actions shown as buttons; the rest go in the More menu. */
const ACTION_DISPLAY_COUNT = 3;

const MANUAL_PASS_ACTION = 'manualPass';

const PANEL_CLASS_NAME =
  'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-base';

const BODY_CLASS_NAME = 'min-h-0 flex-1 overflow-y-auto px-4 py-2';

interface LeadInfoFieldProps {
  row: CxLeadInfoRow;
  loadRecording: LeadInfoPanelProps['loadRecording'];
}

const LeadInfoField: FunctionComponent<LeadInfoFieldProps> = ({
  row,
  loadRecording,
}) => {
  const { t } = useLocale(i18n);
  const label = row.labelKey ? t(row.labelKey) : row.label ?? '';
  return (
    <DetailField
      label={label}
      value={row.value || EMPTY_VALUE}
      className={row.wide ? 'col-span-2' : ''}
      data-sign={`leadField-${row.id}`}
    >
      {row.isRecording ? (
        <LeadRecordingPlayer value={row.value} loadRecording={loadRecording} />
      ) : undefined}
    </DetailField>
  );
};

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
              isDialDisabled={!!previewActions?.isDialDisabled}
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
  showViewLeadButton: boolean;
  onViewLead: LeadInfoPanelProps['onViewLead'];
  onOpenManualPass: () => void;
}

/**
 * Manual pass for a lead not on a call, and the host lead viewer for any
 * lead. The lead's numbers dial it themselves.
 */
function useLeadActionButtons({
  info,
  previewActions,
  showViewLeadButton,
  onViewLead,
  onOpenManualPass,
}: UseLeadActionButtonsOptions): ActionMenuListButtonProps[] {
  const { t } = useLocale(i18n);
  if (!info) {
    return [];
  }
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
  return [...manualPassButtons, ...viewLeadButtons];
}

/**
 * The rows of each non-empty card, in card order.
 */
function getCardRows(rows: readonly CxLeadInfoRow[]): CxLeadInfoRow[][] {
  return GROUP_ORDER.map((group) =>
    rows.filter((row) => row.group === group),
  ).filter((groupRows) => groupRows.length > 0);
}

interface LeadInfoCardsProps {
  info: CxLeadInfoData;
  loadRecording: LeadInfoPanelProps['loadRecording'];
}

const LeadInfoCards: FunctionComponent<LeadInfoCardsProps> = ({
  info,
  loadRecording,
}) => (
  <>
    {getCardRows(info.rows).map((rows) => (
      <DetailCard key={rows[0].group} data-sign={`leadCard-${rows[0].group}`}>
        <div className="grid w-full grid-cols-2 gap-3">
          {rows.map((row) => (
            <LeadInfoField
              key={row.id}
              row={row}
              loadRecording={loadRecording}
            />
          ))}
        </div>
      </DetailCard>
    ))}
  </>
);

/**
 * The RingCX Lead side widget tab, laid out as the EX call detail page: a
 * header with the lead's name, number and actions, then the Lead details
 * Agent One shows (`containers/CallDetails/LeadInfoPanel`) in cards.
 *
 * With no tab bar above it, the header starts with a back button that
 * closes the tab.
 */
export const LeadInfoPanel: FunctionComponent<LeadInfoPanelProps> = ({
  info,
  showViewLeadButton,
  onViewLead,
  previewActions,
  loadRecording,
  showCloseButton,
  onClose,
}) => {
  const { t } = useLocale(i18n);
  const [isManualPassOpen, setManualPassOpen] = useState(false);
  const buttons = useLeadActionButtons({
    info,
    previewActions,
    showViewLeadButton,
    onViewLead,
    onOpenManualPass: () => setManualPassOpen(true),
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
        <LeadInfoCards info={info} loadRecording={loadRecording} />
      </div>
      {previewActions?.showManualPass ? (
        <ManualPassModal
          open={isManualPassOpen}
          onClose={() => setManualPassOpen(false)}
          onSubmit={async (params) => {
            setManualPassOpen(false);
            await previewActions.onManualPass(params);
          }}
          fetchDispositionList={previewActions.fetchDispositionList}
          campaignId={info.lead.campaignId || ''}
          defaultTimezone={previewActions.defaultTimezone}
          disabled={previewActions.isManualPassDisabled}
        />
      ) : null}
    </section>
  );
};
