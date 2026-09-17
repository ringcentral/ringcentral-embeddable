import React, { useState, useCallback } from 'react';
import { ListItem, ListItemText, IconButton, Button, Avatar } from '@ringcentral/spring-ui';
import { CallMd, LinkContactMd, MissedCallMd, ContactsMd } from '@ringcentral/spring-icon';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { FunctionComponent } from 'react';

import { SEARCH_DISABLE_DIAL_STATES } from '../../services/CxLeads';
import { ManualPassModal } from '../ManualPassModal';
import type { LeadItemProps } from './LeadItem.interface';
import i18n from './i18n';

/**
 * Extracts initials from a display name (up to 2 characters)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * LeadItem - Displays a lead with contact info and action buttons
 *
 * Layout matches CallsListItem pattern:
 * [Avatar] [ListItemText: name + phone] [leadState] [hoverActions]
 *
 * Features preserved from old LeadItem:
 * - Clickable phone number buttons (clicking dials)
 * - Hover actions: dial (single phone), view lead, manual pass
 * - ManualPassModal rendered inside each item (self-contained state)
 * - fromSearch support with SEARCH_DISABLE_DIAL_STATES
 */
export const LeadItem: FunctionComponent<LeadItemProps> = ({
  lead,
  phoneNumbers,
  displayName,
  allowDial = true,
  isDialing = false,
  disabled = false,
  fromSearch = false,
  onDial,
  onViewLead,
  onPass,
  showViewLeadButton = false,
  showManualPassButton = false,
  disableManualPass = false,
  fetchDispositionList,
  defaultTimezone = 'America/New_York',
  hoverActions,
  className,
  'data-sign': dataSign,
}) => {
  const { t } = useLocale(i18n);
  const [manualPassOpen, setManualPassOpen] = useState(false);
  const isDisabledFromSearch = fromSearch && SEARCH_DISABLE_DIAL_STATES.includes(lead.leadState);
  const isButtonDisabled = disabled || isDialing || !allowDial || isDisabledFromSearch;
  const isManualPassDisabled = disabled || isDialing || disableManualPass;
  const initials = getInitials(displayName);

  const handleManualPassSubmit = useCallback(async (params: {
    dispositionId: string;
    notes: string;
    callback: boolean;
    callbackDTS: string;
  }) => {
    setManualPassOpen(false);
    await onPass?.({
      lead,
      ...params,
    });
  }, [lead, onPass]);

  const defaultHoverActions = (
    <>
      {phoneNumbers.length === 1 && onDial && (
        <IconButton
          symbol={CallMd}
          size="medium"
          shape="squircle"
          variant="outlined"
          color="neutral"
          disabled={isButtonDisabled}
          onClick={() => onDial(phoneNumbers[0].destination)}
          data-sign="dialButton"
          TooltipProps={{
            title: t('call'),
          }}
          className="mr-1"
        />
      )}
      {showViewLeadButton && onViewLead && (
        <IconButton
          symbol={LinkContactMd}
          size="medium"
          shape="squircle"
          variant="outlined"
          color="neutral"
          onClick={() => onViewLead(lead)}
          data-sign="viewLeadButton"
          className="mr-1"
          TooltipProps={{
            title: t('viewLead'),
          }}
        />
      )}
      {showManualPassButton && (
        <IconButton
          symbol={MissedCallMd}
          size="medium"
          shape="squircle"
          variant="outlined"
          color="danger"
          disabled={isManualPassDisabled}
          onClick={() => setManualPassOpen(true)}
          data-sign="manualPassButton"
          TooltipProps={{
            title: t('manualPass'),
          }}
        />
      )}
    </>
  );

  return (
    <>
      <ListItem
        size="auto"
        className={className}
        classes={{
          content: 'bg-inherit !px-3 !py-2',
        }}
        data-sign={dataSign || `leadItem-${lead.leadId}`}
        hoverable
        hoverActions={hoverActions || defaultHoverActions}
        divider={false}
      >
        <Avatar size="medium" classes={{ content: 'bg-neutral-b5 text-neutral-b2' }}>
          {initials || <ContactsMd />}
        </Avatar>
        <ListItemText
          primary={
            <div className="flex flex-col items-start gap-0.5 truncate">
              <span className="typography-subtitle text-neutral-b1 truncate">
                {displayName || t('unknown')}
              </span>
            </div>
          }
          secondary={
            <div className="flex flex-col gap-0.5 items-start">
              {phoneNumbers.map((phone) => (
                <Button
                  key={phone.destination}
                  variant="text"
                  size="small"
                  onClick={() => onDial?.(phone.destination)}
                  disabled={isButtonDisabled}
                  className="justify-start p-0 text-left"
                  data-sign="phoneNumberButton"
                >
                  <span className="typography-descriptor text-primary-b hover:underline">
                    {phone.formatted}
                  </span>
                </Button>
              ))}
            </div>
          }
        />
        <div className="text-right min-h-11 max-w-[30%]">
          <span
            className="typography-descriptor text-neutral-b2"
            data-sign="leadState"
          >
            {lead.leadState}
          </span>
        </div>
      </ListItem>
      {showManualPassButton && fetchDispositionList && (
        <ManualPassModal
          open={manualPassOpen}
          onClose={() => setManualPassOpen(false)}
          onSubmit={handleManualPassSubmit}
          fetchDispositionList={fetchDispositionList}
          campaignId={lead.campaignId || ''}
          defaultTimezone={defaultTimezone}
          disabled={isManualPassDisabled}
        />
      )}
    </>
  );
};
