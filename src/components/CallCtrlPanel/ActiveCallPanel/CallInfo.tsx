import React from 'react';

import {
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcAvatar,
  RcIcon,
  styled,
} from '@ringcentral/juno';
import { People } from '@ringcentral/juno-icon';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import styles from '@ringcentral-integration/widgets/components/ActiveCallPanel/styles.scss';


const StyledItem = styled(RcListItem)`
  .ContactDisplay_root {
    > div {
      font-size: 0.9375rem;
      font-weight: 400;
      line-height: 22px;
    }
  }
  width: 100%;
  max-width: 332px;
  margin-left: auto;
  margin-right: auto;
`;

type CallInfoProps = {
  phoneNumber?: string;
  formatPhone: (...args: any[]) => any;
  nameMatches: any[];
  fallBackName: string;
  areaCode: string;
  countryCode: string;
  currentLocale: string;
  selectedMatcherIndex: number;
  onSelectMatcherName: (...args: any[]) => any;
  avatarUrl?: string;
  brand?: string;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  callQueueName?: string;
};
const CallInfo: React.SFC<CallInfoProps> = (props) => {
  return (
    <StyledItem
      canHover={false}
      disableTouchRipple
    >
      <RcListItemAvatar>
        <RcAvatar
          size="small"
          src={props.avatarUrl}
          data-sign="avatar"
          color="avatar.global"
        >
          {
            props.avatarUrl ? null : (
              <RcIcon
                symbol={People}
                size="medium"
              />
            )
          }
        </RcAvatar>
      </RcListItemAvatar>
      <RcListItemText
        primary={
          <>
            {props.callQueueName}
            <ContactDisplay
              formatPhone={props.formatPhone}
              className={styles.contactDisplay}
              selectClassName={styles.dropdown}
              contactMatches={props.nameMatches}
              phoneNumber={props.phoneNumber}
              fallBackName={props.fallBackName}
              currentLocale={props.currentLocale}
              areaCode={props.areaCode}
              countryCode={props.countryCode}
              showType={false}
              selected={props.selectedMatcherIndex}
              onSelectContact={props.onSelectMatcherName}
              isLogging={false}
              enableContactFallback
              brand={props.brand}
              showPlaceholder={props.showContactDisplayPlaceholder}
              // @ts-expect-error TS(2322): Type 'object | undefined' is not assignable to typ... Remove this comment to see the full error message
              sourceIcons={props.sourceIcons}
              phoneTypeRenderer={props.phoneTypeRenderer}
              phoneSourceNameRenderer={props.phoneSourceNameRenderer}
            />
          </>
        }
        primaryTypographyProps={{
          component: 'div',
        }}
        secondary={props.formatPhone(props.phoneNumber)}
        secondaryTypographyProps={{
          'data-sign': 'userPhoneNumber',
        }}
      />
    </StyledItem>
  );
};
CallInfo.defaultProps = {
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  phoneNumber: null,
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  avatarUrl: null,
  brand: 'RingCentral',
  showContactDisplayPlaceholder: true,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  callQueueName: null,
};
export default CallInfo;