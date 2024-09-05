import React from 'react';
import type { FunctionComponent } from 'react';
import {
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcAvatar,
  RcIcon,
  styled,
} from '@ringcentral/juno';
import { Conference } from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/ActiveCallPanel/i18n';

const Container = styled.div`
  margin-top: 16px;
  margin-left: 13%;
  margin-right: 13%;
`;

const StyledItem = styled(RcListItem)`
  cursor: pointer;
  width: 100%;
  max-width: 332px;
  margin-left: auto;
  margin-right: auto;

  .ContactDisplay_root {
    > div {
      font-size: 0.9375rem;
      font-weight: 400;
      line-height: 22px;
    }
  }

  &.RcListItem-gutters {
    padding-left: 0;
    padding-right: 0;
  }
`;

type ConferenceInfoProps = {
  currentLocale: string;
  partyProfiles?: {
    avatarUrl?: string;
    partyName?: string;
  }[];
  onClick?: (...args: any[]) => any;
};

const ConferenceInfo: FunctionComponent<ConferenceInfoProps> = ({
  currentLocale,
  partyProfiles = undefined,
  onClick = undefined,
}) => {
  const profiles = partyProfiles || [];
  const partiesCount = profiles.length + 1;
  const conferenceName = profiles.length > 0 ?
    profiles.map((profile) => profile.partyName).join(', ') :
    'Conference Call';
  return (
    <Container>
      <StyledItem
        canHover={false}
        disableTouchRipple
        data-sign="conferenceInfo"
        onClick={onClick}
      >
        <RcListItemAvatar>
          <RcAvatar
            size="small"
            data-sign="avatar"
            color="avatar.global"
          >
            <RcIcon
              symbol={Conference}
              size="medium"
            />
          </RcAvatar>
        </RcListItemAvatar>
        <RcListItemText
          primary={conferenceName}
          primaryTypographyProps={{
            title: conferenceName,
          }}
          secondary={`${i18n.getString('conferenceCall', currentLocale)} (${partiesCount})`}
        />
      </StyledItem>
    </Container>
  );
}

export default ConferenceInfo;