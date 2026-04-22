import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { ParkCallMd, Smsmd } from '@ringcentral/spring-icon';
import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  Text,
  Tooltip,
} from '@ringcentral/spring-ui';
import React, { FunctionComponent, useEffect, useRef } from 'react';

import type { ParkViewPanelProps } from '../Park.view.interface';

import { t } from './i18n';

const hoverActionsClassName = 'flex items-center gap-1';

export const ParkPage: FunctionComponent<ParkViewPanelProps> = ({
  parkLocations,
  onBack,
  onPark,
  onText,
  onCallEnd,
  session,
  formatPhone,
}) => {
  const sessionRef = useRef(session);

  useEffect(() => {
    if (sessionRef.current && !session) {
      onCallEnd();
    }
    sessionRef.current = session;
  }, [session, onCallEnd]);

  if (!session) {
    return null;
  }

  const handleParkAndText = async (locationId?: string) => {
    const result = await onPark(locationId);
    if (result) {
      await onText(
        `You have a call from ${formatPhone(result.fromNumber)} at ${result.destination}`,
      );
    }
  };

  return (
    <div data-sign="parkPage" className="flex flex-col h-full">
      <PageHeader onBackClick={onBack}>{t('parkCall')}</PageHeader>
      <div className="flex-auto overflow-y-auto">
        <Text
          component="span"
          className="typography-descriptor text-neutral-f06 block px-4 mt-4 mb-2"
        >
          {t('parkLocation')}
        </Text>
        <List>
          <ListItem
            data-sign="parkLocationPublic"
            divider
            size="large"
            hoverActions={
              <>
                <IconButton
                  size="medium"
                  variant="outlined"
                  color="secondary"
                  data-sign="parkLocationPublic-park"
                  symbol={ParkCallMd}
                  TooltipProps={{ title: t('parkCurrentCall') }}
                  onClick={() => {
                    void onPark();
                  }}
                />
                <IconButton
                  size="medium"
                  variant="outlined"
                  color="secondary"
                  data-sign="parkLocationPublic-parkAndText"
                  symbol={Smsmd}
                  TooltipProps={{
                    title: t('parkCurrentCallAndSendText'),
                  }}
                  onClick={() => {
                    void handleParkAndText();
                  }}
                  className="ml-2"
                />
              </>
            }
          >
            <ListItemText primary={t('public')} />
          </ListItem>
          {parkLocations.map((parkLocation) => {
            const disabled =
              parkLocation.extension?.status !== 'Enabled';
            const busy =
              (parkLocation.presence?.activeCalls?.length ?? 0) > 0;
            const isDisabled = disabled || busy;
            let tooltipTitle = '';
            if (disabled) {
              tooltipTitle = t('parkLocationDisabled');
            } else if (busy) {
              tooltipTitle = t('parkLocationBusy');
            }
            const extensionNumberText = parkLocation.extension?.extensionNumber
              ? t('extensionNumber', {
                  extensionNumber: parkLocation.extension.extensionNumber,
                })
              : '';
            const listItem = (
              <ListItem
                key={parkLocation.id}
                data-sign={`parkLocation-${parkLocation.id}`}
                divider
                hoverable={!isDisabled}
                size="large"
                hoverActions={
                  !isDisabled ? (
                    <>
                      <IconButton
                        size="medium"
                        variant="outlined"
                        color="secondary"
                        data-sign={`parkLocation-${parkLocation.id}-park`}
                        symbol={ParkCallMd}
                        disabled={isDisabled}
                        TooltipProps={{ title: t('parkCurrentCall') }}
                        onClick={() => {
                          void onPark(parkLocation.id);
                        }}
                      />
                      <IconButton
                        size="medium"
                        variant="outlined"
                        color="secondary"
                        data-sign={`parkLocation-${parkLocation.id}-parkAndText`}
                        symbol={Smsmd}
                        disabled={isDisabled}
                        TooltipProps={{
                          title: t('parkCurrentCallAndSendText'),
                        }}
                        onClick={() => {
                          void handleParkAndText(parkLocation.id);
                        }}
                        className="ml-2"
                      />
                    </>
                  ) : undefined
                }
              >
                <ListItemText primary={parkLocation.extension?.name} />
                {extensionNumberText ? (
                  <Text
                    component="span"
                    className="typography-body text-neutral-f04"
                    title={extensionNumberText}
                  >
                    {extensionNumberText}
                  </Text>
                ) : null}
              </ListItem>
            );
            if (isDisabled && tooltipTitle) {
              return (
                <Tooltip
                  key={parkLocation.id}
                  title={tooltipTitle}
                  placement="top"
                  triggerWhenDisabled
                >
                  <div aria-disabled="true">{listItem}</div>
                </Tooltip>
              );
            }
            return listItem;
          })}
        </List>
      </div>
    </div>
  );
};
