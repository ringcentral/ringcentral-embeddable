import React, { useState } from 'react';

import {
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcAvatar,
  RcIcon,
  RcButton,
  RcCard,
  RcCardContent,
  RcCardActionArea,
  RcCardActions,
  RcTypography,
  RcTooltip,
  styled,
  palette2,
  css,
  ellipsis,
  useAvatarColorToken,
  useAvatarShortName,
} from '@ringcentral/juno';

import {
  ArrowRight,
  Edit,
  Delete,
  NewAction,
  ViewBorder,
  Copy,
  Share,
  Download,
  PhoneBorder,
  SmsBorder,
  People,
  Refresh,
  InfoBorder,
  InsertLink,
  Connect,
  ViewLogBorder,
  Read,
  Unread,
  SettingsBorder,
  Warning,
} from '@ringcentral/juno-icon';

import { ActionMenu } from '../components/ActionMenu';
import { TextWithMarkdown } from '../components/TextWithMarkdown';

const StyledList = styled(RcList)`
  margin: 0 -16px;
`;

const StyledItem = styled(RcListItem)<{
  $hoverOnMoreMenu?: boolean
  $hasActions?: boolean
  $readOnly?: boolean
  $hideMetaOnActionHover?: boolean
  $alwaysShowActions?: boolean
}>`
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  cursor: ${({ $readOnly }) => ($readOnly ? 'default' : 'pointer')};

  .list-item-action-menu {
    display: ${({ $alwaysShowActions }) => ($alwaysShowActions ? 'flex' : 'none')};
  }

  ${({ $hoverOnMoreMenu, $hideMetaOnActionHover, $alwaysShowActions }) =>
    $hoverOnMoreMenu && !$alwaysShowActions &&
    css`
      .list-item-action-menu {
        display: flex;
      }

      ${$hideMetaOnActionHover &&
      css`
        .list-item-meta {
          display: none;
        }
      `}
    `}

  ${({ $hasActions, $readOnly, $hideMetaOnActionHover, $alwaysShowActions }) =>
    $hasActions && !$readOnly && !$alwaysShowActions &&
    css`
      &:hover {
        .list-item-action-menu {
          display: flex;
        }

        ${$hideMetaOnActionHover &&
        css`
          .list-item-meta {
            display: none;
          }
        `}
      }
    `}
`;

const StyledAvatar = styled(RcAvatar)<{ $round?: boolean }>`
  .RcAvatar-avatarContainer {
    ${({ $round }) => 
      $round ? '' : css`
        border-radius: 0;
        background: transparent;
      `
    }
  }
`;

const NavigationIcon = styled(RcIcon)`
  margin: 8px 0 8px 8px;
`;

const MetaContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  span {
    ${ellipsis}
  }

  span:first-child {
    line-height: 22px;
  }
`;

export const StyledActionMenu = styled(ActionMenu)`
  .RcIconButton-root {
    margin-left: 6px;
  }
`;

const SecondaryActionContainer = styled.div`
  display: flex;
  align-items: center;
`;

const IconMetaContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledMetaIcon = styled(RcIcon)`
  & + & {
    margin-left: 4px;
  }
`;

const StyledActionButton = styled(RcButton)`
  margin-left: 8px;
`;

const ICONS_MAP = {
  'edit': Edit,
  'delete': Delete,
  'view': ViewBorder,
  'copy': Copy,
  'share': Share,
  'download': Download,
  'phone': PhoneBorder,
  'sms': SmsBorder,
  'people': People,
  'refresh': Refresh,
  'newAction': NewAction,
  'info': InfoBorder,
  'insertLink': InsertLink,
  'connect': Connect,
  'viewLog': ViewLogBorder,
  'read': Read,
  'unread': Unread,
  'settings': SettingsBorder,
  'warning': Warning,
};

const DESCRIPTION_COLOR_MAP = {
  error: palette2('danger', 'b04'),
  success: palette2('success', 'b04'),
  warning: palette2('warning', 'b04'),
  info: palette2('interactive', 'b04'),
};

const StyledListItemText = styled(RcListItemText)<{ $descriptionColor?: string }>`
  ${({ $descriptionColor }) =>
    $descriptionColor &&
    css`
      .RcListItemText-secondary {
        color: ${$descriptionColor};
      }
    `}
`;

const BUTTON_ACTION_TYPE = 'button';
const DEFAULT_ACTION_MENU_MAX_ACTIONS = 3;
const ACTION_MENU_MAX_ACTIONS_WITH_BUTTON = 1;

const isButtonAction = (action) => action?.type === BUTTON_ACTION_TYPE;

function ListItem({
  item,
  disabled,
  selected,
  onClick,
  showIconAsAvatar,
  showAsNavigation,
  actions = [],
  onClickAction,
  readOnly,
  alwaysShowActions,
}) {
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);
  const buttonAction = actions.find(isButtonAction);
  const iconActions = actions.filter((action) => !isButtonAction(action));
  const formattedActions = iconActions.map((action) => {
    const icon = ICONS_MAP[action.icon];
    return {
      title: action.title,
      icon: icon || ICONS_MAP.info,
      onClick: (e) => {
        e && e.stopPropagation();
        onClickAction(action);
      },
      id: action.id,
      color: action.color,
      disabled: action.disabled,
    };
  });
  const actionMenuMaxActions = buttonAction ?
    ACTION_MENU_MAX_ACTIONS_WITH_BUTTON :
    DEFAULT_ACTION_MENU_MAX_ACTIONS;
  const hasSecondaryAction = item.meta || item.iconMeta?.length > 0 || item.authorName || showAsNavigation || buttonAction || iconActions.length > 0;
  const hideMetaOnActionHover = iconActions.length > 0 && !buttonAction;
  return (
    <StyledItem
      key={item.const}
      disabled={disabled}
      selected={!readOnly && selected}
      onClick={readOnly ? undefined : onClick}
      canHover={!readOnly}
      disableRipple={readOnly}
      $hoverOnMoreMenu={hoverOnMoreMenu}
      $hasActions={iconActions.length > 0}
      $readOnly={readOnly}
      $hideMetaOnActionHover={hideMetaOnActionHover}
      $alwaysShowActions={alwaysShowActions}
    >
      {
        item.icon ? (
          <RcListItemAvatar>
            <StyledAvatar
              size="xsmall"
              src={item.icon || item.authorAvatar}
              title={item.authorName}
              $round={showIconAsAvatar}
            />
          </RcListItemAvatar>
        ) : null
      }
      <StyledListItemText
        primary={item.title ? <TextWithMarkdown text={item.title} /> : item.title}
        secondary={item.description ? <TextWithMarkdown text={item.description} /> : item.description}
        $descriptionColor={DESCRIPTION_COLOR_MAP[item.descriptionColor] || item.descriptionColor}
      />
      {
        hasSecondaryAction ? (
          <RcListItemSecondaryAction>
            <SecondaryActionContainer>
              {
                (item.meta || item.authorName) ? (
                  <MetaContainer className="list-item-meta">
                    {item.authorName && <span>{item.authorName}</span>}
                    {item.meta && <span>{item.meta}</span>}
                  </MetaContainer>
                ) : null
              }
              {
                item.iconMeta && item.iconMeta.length > 0 && (
                  <IconMetaContainer className="list-item-meta">
                    {item.iconMeta.map((iconMetaItem, index) => (
                      <RcTooltip key={index} title={iconMetaItem.message}>
                        <StyledMetaIcon
                          symbol={ICONS_MAP[iconMetaItem.icon] || ICONS_MAP.info}
                          size={iconMetaItem.size || 'medium'}
                          color={iconMetaItem.color || 'neutral.f04'}
                        />
                      </RcTooltip>
                    ))}
                  </IconMetaContainer>
                )
              }
              {
                showAsNavigation ? (
                  <NavigationIcon
                    symbol={ArrowRight}
                    size="large"
                  />
                ) : null
              }
              {
                buttonAction ? (
                  <StyledActionButton
                    size="small"
                    variant={buttonAction.variant || 'contained'}
                    color={buttonAction.color || 'primary'}
                    disabled={buttonAction.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClickAction(buttonAction);
                    }}
                  >
                    {buttonAction.title}
                  </StyledActionButton>
                ) : null
              }
              {
                iconActions.length > 0 && (
                  <StyledActionMenu
                    actions={formattedActions}
                    size="small"
                    maxActions={actionMenuMaxActions}
                    className="list-item-action-menu"
                    iconVariant="contained"
                    color="neutral.b01"
                    onMoreMenuOpen={(open) => {
                      setHoverOnMoreMenu(open);
                    }}
                  />
                )
              }
            </SecondaryActionContainer>
          </RcListItemSecondaryAction>
        ) : null
      }
    </StyledItem>
  );
}

const CardTitle = styled(RcTypography)`
  height: 22px;
  ${ellipsis}
`;

const StyledCardBody = styled(RcTypography)`
  margin-top: 4px;
  height: 32px;
  ${ellipsis}
  white-space: break-spaces;
`;

const StyledCard = styled(RcCard)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledCardWrapper = styled.div`
  padding: 4px;
  width: 100%;
`;

const StyledCardActions = styled(RcCardActions)`
  width: 100%;
  box-sizing: border-box;
`;

const StyledCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  height: 16px;
  width: 100%;
  ${ellipsis}
`;

const StyledCardAuthorAvatar = styled(RcAvatar)`
  .RcAvatar-avatarContainer {
    width: 12px;
    height: 12px;
    line-height: 12px;
    font-size: 0.625rem;
  }
`;

const AuthorAvatarWrapper = styled.div`
  margin-right: 4px;
  display: flex;
`;

const StyledCardContent = styled(RcCardContent)`
  padding-bottom: 0;
`;

// Metric Card Styles
const MetricCardContent = styled(RcCardContent)`
  padding: 0 !important;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  box-sizing: border-box;
  
  &:last-child {
    padding-bottom: 0 !important;
  }
`;

const MetricValue = styled(RcTypography)`
  line-height: 1;
  margin-bottom: 8px;
  font-weight: 600;
`;

const MetricLabel = styled(RcTypography)`
  text-align: center;
  line-height: 1.2;
  margin-bottom: 2px;
  font-size: 0.8125rem;
`;

const MetricUnit = styled(RcTypography)`
  text-align: center;
  line-height: 1.2;
  margin-bottom: 4px;
  font-size: 0.75rem;
`;

const MetricComparison = styled(RcTypography)`
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 2px;
`;

const ActionArea = ({
  children,
  readOnly,
  onClick,
  disabled,
}) => {
  if (readOnly) {
    return <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>{children}</div>;
  }
  return (
    <RcCardActionArea 
      onClick={onClick} 
      component="div" 
      disabled={disabled}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </RcCardActionArea>
  );
};

function MetricCard({
  item,
  disabled,
  onClick,
  width,
  height,
  readOnly,
  uiSchema,
}) {
  const cardStyle: {
    backgroundColor?: string;
    height?: string;
  } = {};
  if (item.backgroundColor) {
    cardStyle.backgroundColor = item.backgroundColor;
  }
  if (height) {
    cardStyle.height = height;
  }
  const wrapperStyle: {
    width?: string;
  } = {};
  if (width) {
    wrapperStyle.width = width;
  }

  return (
    <StyledCardWrapper style={wrapperStyle}>
      <StyledCard style={cardStyle}>
        <ActionArea
          onClick={onClick}
          readOnly={readOnly}
          disabled={disabled}
        >
          <MetricCardContent>
            <MetricValue variant="title2" color="neutral.f06">{item.value || item.title}</MetricValue>
            {item.unit && (
              <MetricUnit variant="caption1" color="neutral.f04">{item.unit}</MetricUnit>
            )}
            <MetricLabel variant="body1" color="neutral.f04">{item.title || item.description || item.label}</MetricLabel>
            {item.trend && (
              <MetricComparison 
                color={
                  item.trendColor || 
                  uiSchema?.['ui:trendColor']
                }
              >
                {item.trend}
              </MetricComparison>
            )}
          </MetricCardContent>
        </ActionArea>
      </StyledCard>
    </StyledCardWrapper>
  );
}

function CardItem({
  item,
  disabled,
  onClick,
  width,
  onClickAuthor,
  height,
  readOnly,
  isMetric,
  uiSchema,
}) {
  // Use MetricCard component for metric layout
  if (isMetric) {
    return (
      <MetricCard
        item={item}
        disabled={disabled}
        onClick={onClick}
        width={width}
        height={height}
        readOnly={readOnly}
        uiSchema={uiSchema}
      />
    );
  }

  // Standard card layout
  const cardStyle: {
    backgroundColor?: string;
    height?: string;
  } = {};
  if (item.backgroundColor) {
    cardStyle.backgroundColor = item.backgroundColor;
  }
  if (height) {
    cardStyle.height = height;
  }
  const wrapperStyle: {
    width?: string;
  } = {};
  if (width) {
    wrapperStyle.width = width;
  }
  let shortName = '';
  let avatarColor;
  if (item.authorName) {
    const [firstName, lastName] = item.authorName.split(/\s+/);
    shortName = useAvatarShortName({
      firstName,
      lastName,
    });
    avatarColor = useAvatarColorToken(item.authorName);
  }

  return (
    <StyledCardWrapper
      style={wrapperStyle}
    >
      <StyledCard
        style={cardStyle}
      >
        <ActionArea
          onClick={onClick}
          readOnly={readOnly}
          disabled={disabled}
        >
          <StyledCardContent>
            <CardTitle variant="body2">{item.title}</CardTitle>
            <StyledCardBody variant="caption1" color="neutral.f05">
              {item.description}
            </StyledCardBody>
          </StyledCardContent>
          <StyledCardActions>
            <StyledCardFooter>
              {
                item.authorName && (
                  <AuthorAvatarWrapper onClick={onClickAuthor}>
                    <StyledCardAuthorAvatar
                      size="xxsmall"
                      src={item.authorAvatar}
                      title={item.authorName}
                      color={avatarColor}
                      useRcTooltip
                    >
                      {shortName}
                    </StyledCardAuthorAvatar>
                  </AuthorAvatarWrapper>
                )
              }
              <RcTypography variant="caption1" color="neutral.f05">{item.meta}</RcTypography>
            </StyledCardFooter>
          </StyledCardActions>
        </ActionArea>
      </StyledCard>
    </StyledCardWrapper>
  );
}

const StyledCardList = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
`;

export function List({
  schema,
  uiSchema,
  disabled,
  formData,
  onChange,
  onFocus,
}) {
  const showIconAsAvatar = 
    typeof uiSchema['ui:showIconAsAvatar'] === 'undefined' ?
    true :
    uiSchema['ui:showIconAsAvatar'];
  const showAsNavigation = 
    typeof uiSchema['ui:navigation'] === 'undefined' ?
    false :
    uiSchema['ui:navigation'];
  const showSelected =
    typeof uiSchema['ui:showSelected'] === 'undefined' ?
    true :
    uiSchema['ui:showSelected'];
  const readOnly =
    typeof uiSchema['ui:readonly'] === 'undefined' ?
    false :
    uiSchema['ui:readonly'];
  const itemWidget = uiSchema['ui:itemWidget'];
  const isCard = uiSchema['ui:itemType'] === 'card' || itemWidget === 'card';
  const isMetric = uiSchema['ui:itemType'] === 'metric' || itemWidget === 'metric';
  const alwaysShowActions = !!uiSchema['ui:alwaysShowActions'];
  const Item = isCard || isMetric ? CardItem : ListItem;
  const Container = isCard || isMetric ? StyledCardList : StyledList;
  return (
    <Container>
      {schema.oneOf.map((item) => (
        <Item
          key={item.const}
          item={item}
          disabled={disabled}
          selected={showSelected && formData === item.const}
          onClick={(e) => {
            if (readOnly) {
              return;
            }
            onChange(item.const);
          }}
          readOnly={readOnly}
          showIconAsAvatar={showIconAsAvatar}
          showAsNavigation={showAsNavigation}
          width={uiSchema['ui:itemWidth']}
          height={uiSchema['ui:itemHeight']}
          isMetric={isMetric}
          uiSchema={uiSchema}
          onClickAuthor={(e) => {
            e.stopPropagation();
            onFocus(`${item.const}-author`, '$$clicked');
          }}
          actions={item.actions}
          onClickAction={(action) => {
            onFocus(`${action.id}-${item.const}-action`, '$$clicked');
          }}
          alwaysShowActions={alwaysShowActions}
        />
      ))}
    </Container>
  );
}
