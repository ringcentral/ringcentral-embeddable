import React from 'react';
import type { FunctionComponent } from 'react';
import {
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
} from '@ringcentral/juno';

import { BackHeaderView } from '../BackHeaderView';

type ParkPanelProps = {
  parkLocations: any[];
  onBackButtonClick: () => void;
};

export const ParkPanel: FunctionComponent<ParkPanelProps> = ({
  parkLocations,
  onBackButtonClick,
}) => {
  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title="Park locations"
    >
      <RcList>
        {parkLocations.map((parkLocation) => (
          <RcListItem key={parkLocation.id}>
            <RcListItemText
              primary={parkLocation.extension?.name}
              secondary={parkLocation.extension?.extensionNumber}
            />
          </RcListItem>
        ))}
      </RcList>
    </BackHeaderView>
  );
};
