import React from 'react';
import type { FunctionComponent } from 'react';
import {
  styled,
  palette2,
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcText,
  RcTypography,
} from '@ringcentral/juno';
import {
  ParkCallSp,
  ParkCallText,
} from '@ringcentral/juno-icon';
import { ActionMenu } from '../ActionMenu';

import { BackHeaderView } from '../BackHeaderView';
import i18n from './i18n';

const StyledListItem = styled(RcListItem)`
  height: 48px;

  .park-location-action-menu {
    display: none;
  }

  &:hover {
    .park-location-action-menu {
      display: flex;
    }
    .park-location-extension-number {
      display: none;
    }
  }

  &:not(:last-child)::after {
    content: "";
    position: absolute;
    bottom: 0px;
    width: calc(100% - 32px);
    border-bottom: 1px solid ${palette2('neutral', 'l02')};
  }
`;

const StyledActionMenu = styled(ActionMenu)`
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -16px;

  .RcIconButton-root {
    margin-left: 8px;
  }
`;

const Title = styled(RcTypography)`
  padding: 0 16px;
  margin: 16px 0 8px 0;
`;

type ParkPanelProps = {
  parkLocations: any[];
  onBackButtonClick: () => void;
  currentLocale: string;
};

export const ParkPanel: FunctionComponent<ParkPanelProps> = ({
  parkLocations,
  onBackButtonClick,
  currentLocale,
}) => {
  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title={i18n.getString('parkCall', currentLocale)}
    >
      <Title variant="body2" color="neutral.f06">{i18n.getString('parkLocation', currentLocale)}</Title>
      <RcList>
        <StyledListItem
          disableGutters={false}
        >
          <RcListItemText primary={i18n.getString('public', currentLocale)} />
          <StyledActionMenu
            className="park-location-action-menu"
            actions={[{
              id: 'park',
              icon: ParkCallSp,
              title: i18n.getString('parkCurrentCall', currentLocale),
              onClick: () => {
                console.log('park');
              },
            }, {
              id: 'parkAndText',
              icon: ParkCallText,
              title: i18n.getString('parkCurrentCallAndSendText', currentLocale),
              onClick: () => {
                console.log('park and text');
              },
            }]}
            size="small"
            iconVariant="contained"
            color="neutral.b01"
          />
        </StyledListItem>
        {parkLocations.map((parkLocation) => (
          <StyledListItem
            key={parkLocation.id}
          >
            <RcListItemText
              primary={parkLocation.extension?.name}
            />
            <RcListItemSecondaryAction className="park-location-extension-number">
              <RcText
                variant="body1"
                color="neutral.f04"
              >
                Ext.{parkLocation.extension?.extensionNumber}
              </RcText>
            </RcListItemSecondaryAction>
            <StyledActionMenu
              className="park-location-action-menu"
              actions={[{
                id: 'park',
                icon: ParkCallSp,
                title: i18n.getString('parkCurrentCall', currentLocale),
                onClick: () => {
                  console.log('park');
                },
              }, {
                id: 'parkAndText',
                icon: ParkCallText,
                title: i18n.getString('parkCurrentCallAndSendText', currentLocale),
                onClick: () => {
                  console.log('park and text');
                },
              }]}
              iconVariant="contained"
              color="neutral.b01"
              size="small"
            />
          </StyledListItem>
        ))}
      </RcList>
    </BackHeaderView>
  );
};
