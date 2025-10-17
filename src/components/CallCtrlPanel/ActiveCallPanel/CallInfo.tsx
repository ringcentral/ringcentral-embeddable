import React from 'react';
import type { FunctionComponent } from 'react';
import {
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcAvatar,
  RcIcon,
  RcTooltip,
  styled,
} from '@ringcentral/juno';
import { People, IdBorder } from '@ringcentral/juno-icon';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';

const StyledItem = styled(RcListItem)`
  margin-top: 16px;

  .RcListItemText-primary {
    display: flex;
    align-items: center;
    flex-direction: row;
  }
  
  &.RcListItem-gutters {
    padding-left: 32px;
  }

  .MuiTypography-root {
    user-select: text;
  }

  .ContactDisplay_root {
    vertical-align: bottom;
    font-family: Lato, Helvetica, Arial, sans-serif;
    overflow: hidden;
  
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

const StyledCallerIDIcon = styled(RcIcon)`
  margin-left: 5px;
`;

const StyledSecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
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
  showCallerIdName: boolean;
  onBehalfOf?: string;
};
const CallInfo: FunctionComponent<CallInfoProps> = ({
  nameMatches = [],
  phoneNumber = null,
  avatarUrl = null,
  brand = 'RingCentral',
  showContactDisplayPlaceholder = true,
  sourceIcons = undefined,
  phoneTypeRenderer = undefined,
  phoneSourceNameRenderer = undefined,
  callQueueName = null,
  selectedMatcherIndex = 0,
  formatPhone,
  fallBackName,
  currentLocale,
  areaCode,
  countryCode,
  onSelectMatcherName,
  showCallerIdName,
  onBehalfOf,
}) => {
  return (
    <StyledItem
      canHover={false}
      disableTouchRipple
    >
      <RcListItemAvatar>
        <RcAvatar
          size="small"
          src={avatarUrl}
          data-sign="avatar"
          color="avatar.global"
        >
          {
            avatarUrl ? null : (
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
            {
              callQueueName && !showCallerIdName && (
                <span data-sign="callQueueName">
                  {callQueueName}
                </span>
              )
            }
            {
              showCallerIdName ? (
                <>
                  <span data-sign="callerId" title={fallBackName}>
                    {fallBackName}
                  </span>
                  <RcTooltip title="Caller ID">
                    <StyledCallerIDIcon
                      symbol={IdBorder}
                      size="medium"
                    />
                  </RcTooltip>
                </>
              ) : (
                <ContactDisplay
                  formatPhone={formatPhone}
                  contactMatches={nameMatches}
                  phoneNumber={phoneNumber}
                  fallBackName={fallBackName}
                  currentLocale={currentLocale}
                  areaCode={areaCode}
                  countryCode={countryCode}
                  showType={false}
                  selected={selectedMatcherIndex}
                  onSelectContact={onSelectMatcherName}
                  isLogging={false}
                  enableContactFallback
                  brand={brand}
                  showPlaceholder={showContactDisplayPlaceholder}
                  // @ts-expect-error TS(2322): Type 'object | undefined' is not assignable to typ... Remove this comment to see the full error message
                  sourceIcons={sourceIcons}
                  phoneTypeRenderer={phoneTypeRenderer}
                  phoneSourceNameRenderer={phoneSourceNameRenderer}
                />
              )
            }
          </>
        }
        primaryTypographyProps={{
          component: 'div',
        }}
        secondary={
          <StyledSecondaryWrapper>
            <div>
              {formatPhone(phoneNumber)}
            </div>
            {
              onBehalfOf && (
                <div>
                  On behalf of {onBehalfOf}
                </div>
              )
            }
          </StyledSecondaryWrapper>
        }
        secondaryTypographyProps={{
          'data-sign': 'userPhoneNumber',
          component: 'div',
        }}
      />
    </StyledItem>
  );
};

export default CallInfo;
