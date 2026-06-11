import React from 'react';
import {
  Avatar,
  Block,
  Button as SpringButton,
  Icon,
  List as SpringList,
  ListItem,
  ListItemText,
  Text,
  Tooltip,
} from '@ringcentral/spring-ui';
import {
  AddCommentMd,
  AlertMd,
  ArrowRightMd,
  CallMd,
  CheckMd,
  ConnectorMd,
  ContactsMd,
  CopyMd,
  DetailsMd,
  DownloadMd,
  EditMd,
  InfoMd,
  LinkMd,
  MarkReadMd,
  MarkUnreadMd,
  RefreshMd,
  SettingsMd,
  ShareMd,
  Smsmd,
  TrashMd,
  ViewMd,
} from '@ringcentral/spring-icon';
import { ActionMenu, ActionMenuItem } from '../components/ActionMenu';
import { TextWithMarkdown } from '../components/TextWithMarkdown';
import {
  getButtonColor,
  getButtonVariant,
  getDescriptionColor,
} from '../utils/compat';

const iconMap: Record<string, React.ComponentType> = {
  check: CheckMd,
  connect: ConnectorMd,
  copy: CopyMd,
  delete: TrashMd,
  download: DownloadMd,
  edit: EditMd,
  info: InfoMd,
  insertLink: LinkMd,
  newAction: AddCommentMd,
  people: ContactsMd,
  phone: CallMd,
  read: MarkReadMd,
  refresh: RefreshMd,
  settings: SettingsMd,
  share: ShareMd,
  sms: Smsmd,
  unread: MarkUnreadMd,
  view: ViewMd,
  viewLog: DetailsMd,
  warning: AlertMd,
};

function getInitials(name: string | undefined): string {
  if (!name) {
    return '';
  }
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function getActionMenuItems(actions: any[], onClickAction: (action: any) => void): ActionMenuItem[] {
  return actions.map((action) => ({
    color: action.color,
    disabled: action.disabled,
    icon: iconMap[action.icon] || iconMap.info,
    id: action.id,
    onClick: (event?: React.MouseEvent) => {
      event?.stopPropagation();
      onClickAction(action);
    },
    title: action.title,
  }));
}

function RowItem({
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
}: any) {
  const buttonAction = actions.find((action: any) => action?.type === 'button');
  const iconActions = actions.filter((action: any) => action?.type !== 'button');
  const hoverActions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {item.meta || item.authorName ? (
        <Text className="typography-descriptor" noWrap>
          {item.authorName || item.meta}
        </Text>
      ) : null}
      {item.iconMeta?.map((iconMetaItem: any, index: number) => (
        <Tooltip key={`${iconMetaItem.icon}-${index}`} title={iconMetaItem.message}>
          <Icon
            symbol={iconMap[iconMetaItem.icon] || iconMap.info}
            size={iconMetaItem.size || 'medium'}
            style={{ color: iconMetaItem.color }}
          />
        </Tooltip>
      ))}
      {showAsNavigation ? <Icon symbol={ArrowRightMd} size="medium" /> : null}
      {buttonAction ? (
        <SpringButton
          size="small"
          variant={getButtonVariant(buttonAction.variant)}
          color={getButtonColor(buttonAction.color)}
          disabled={buttonAction.disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClickAction(buttonAction);
          }}
        >
          {buttonAction.title}
        </SpringButton>
      ) : null}
      {iconActions.length > 0 ? (
        <ActionMenu
          actions={getActionMenuItems(iconActions, onClickAction)}
          maxActions={buttonAction ? 1 : 3}
          iconVariant="contained"
          color="neutral"
        />
      ) : null}
    </div>
  );
  return (
    <ListItem
      selected={!readOnly && selected}
      clickable={!readOnly}
      hoverable={!readOnly}
      disabled={disabled}
      onClick={readOnly ? undefined : onClick}
      hoverActions={hoverActions}
      alwaysShowHoverActions={alwaysShowActions}
      divider
    >
      {item.icon ? (
        <Avatar
          size="xsmall"
          src={item.icon || item.authorAvatar}
          alt={item.authorName}
          variant={showIconAsAvatar ? 'circle' : 'squircle'}
          style={{ marginRight: 12 }}
        />
      ) : null}
      <ListItemText
        primary={<TextWithMarkdown text={item.title} />}
        secondary={
          <span style={{ color: getDescriptionColor(item.descriptionColor) }}>
            <TextWithMarkdown text={item.description} />
          </span>
        }
      />
    </ListItem>
  );
}

function MetricCard({
  item,
  disabled,
  onClick,
  width,
  height,
  readOnly,
  uiSchema,
}: any) {
  return (
    <div style={{ padding: 4, width: width || '100%' }}>
      <Block
        bordered
        borderRadius="small"
        background
        style={{
          cursor: readOnly ? 'default' : 'pointer',
          height,
          minHeight: height ? undefined : 112,
          textAlign: 'center',
          backgroundColor: item.backgroundColor,
          opacity: disabled ? 0.5 : undefined,
          padding: 12,
        }}
        onClick={readOnly ? undefined : onClick}
      >
        <Text className="typography-title" component="div">{item.value || item.title}</Text>
        {item.unit ? <Text className="typography-descriptor" component="div">{item.unit}</Text> : null}
        <Text className="typography-mainText" component="div">{item.title || item.description || item.label}</Text>
        {item.trend ? (
          <Text
            className="typography-descriptor"
            component="div"
            style={{ color: item.trendColor || uiSchema?.['ui:trendColor'] }}
          >
            {item.trend}
          </Text>
        ) : null}
      </Block>
    </div>
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
}: any) {
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
  return (
    <div style={{ padding: 4, width: width || '100%' }}>
      <Block
        bordered
        borderRadius="small"
        background
        style={{
          cursor: readOnly ? 'default' : 'pointer',
          height,
          minHeight: height ? undefined : 110,
          backgroundColor: item.backgroundColor,
          opacity: disabled ? 0.5 : undefined,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        onClick={readOnly ? undefined : onClick}
      >
        <div>
          <Text className="typography-subtitle" component="div" noWrap>{item.title}</Text>
          <Text className="typography-descriptor" component="div" titleWhenOverflow={2}>
            {item.description}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          {item.authorName ? (
            <Avatar
              size="xxsmall"
              src={item.authorAvatar}
              alt={item.authorName}
              clickable
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                onClickAuthor(event);
              }}
            >
              {getInitials(item.authorName)}
            </Avatar>
          ) : null}
          <Text className="typography-descriptor" noWrap>{item.meta}</Text>
        </div>
      </Block>
    </div>
  );
}

export function List({
  schema,
  uiSchema = {},
  disabled,
  formData,
  onChange,
  onFocus,
}: any) {
  const showIconAsAvatar = typeof uiSchema['ui:showIconAsAvatar'] === 'undefined' ? true : uiSchema['ui:showIconAsAvatar'];
  const showAsNavigation = typeof uiSchema['ui:navigation'] === 'undefined' ? false : uiSchema['ui:navigation'];
  const showSelected = typeof uiSchema['ui:showSelected'] === 'undefined' ? true : uiSchema['ui:showSelected'];
  const readOnly = typeof uiSchema['ui:readonly'] === 'undefined' ? false : uiSchema['ui:readonly'];
  const itemWidget = uiSchema['ui:itemWidget'];
  const isCard = uiSchema['ui:itemType'] === 'card' || itemWidget === 'card';
  const isMetric = uiSchema['ui:itemType'] === 'metric' || itemWidget === 'metric';
  const alwaysShowActions = !!uiSchema['ui:alwaysShowActions'];
  const items = schema.oneOf || [];
  if (isCard || isMetric) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row' }}>
        {items.map((item: any) => (
          <CardItem
            key={item.const}
            item={item}
            disabled={disabled}
            selected={showSelected && formData === item.const}
            onClick={() => {
              if (!readOnly) {
                onChange(item.const);
              }
            }}
            readOnly={readOnly}
            width={uiSchema['ui:itemWidth']}
            height={uiSchema['ui:itemHeight']}
            isMetric={isMetric}
            uiSchema={uiSchema}
            onClickAuthor={(event: React.MouseEvent) => {
              event.stopPropagation();
              onFocus(`${item.const}-author`, '$$clicked');
            }}
          />
        ))}
      </div>
    );
  }
  return (
    <SpringList style={{ margin: '0 -16px' }}>
      {items.map((item: any) => (
        <RowItem
          key={item.const}
          item={item}
          disabled={disabled}
          selected={showSelected && formData === item.const}
          onClick={() => {
            if (!readOnly) {
              onChange(item.const);
            }
          }}
          readOnly={readOnly}
          showIconAsAvatar={showIconAsAvatar}
          showAsNavigation={showAsNavigation}
          actions={item.actions || []}
          onClickAction={(action: any) => {
            onFocus(`${action.id}-${item.const}-action`, '$$clicked');
          }}
          alwaysShowActions={alwaysShowActions}
        />
      ))}
    </SpringList>
  );
}
