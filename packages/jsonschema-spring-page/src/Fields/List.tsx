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
  getTextColor,
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

type ListAvatarItem = {
  authorAvatar?: string;
  authorName?: string;
  icon?: string;
  meta?: string;
  title?: string;
};

type ListIconMetaItem = {
  color?: string;
  icon?: string;
  message?: string;
  size?: 'small' | 'medium' | 'large';
};

type ListActionItem = {
  color?: string;
  disabled?: boolean;
  icon?: string;
  id?: string;
  title: string;
  type?: string;
  variant?: string;
};

type ListRowItem = ListAvatarItem & {
  description?: string;
  descriptionColor?: string;
  iconMeta?: ListIconMetaItem[];
};

type RowAvatarProps = {
  item: ListAvatarItem;
  showIconAsAvatar: boolean;
};

const imageSourcePattern = /^(https?:|data:|blob:)|^\.{0,2}\/|\.(?:svg|png|jpe?g|gif|webp)(?:[?#].*)?$/i;

function hasImageSource(source: string | undefined): boolean {
  return !!source && imageSourcePattern.test(source);
}

function hasAvatar(item: ListAvatarItem): boolean {
  return !!(item.icon || item.authorAvatar || item.authorName);
}

function getAvatarSource(item: ListAvatarItem): string | undefined {
  if (!item.icon) {
    return item.authorAvatar;
  }
  return hasImageSource(item.icon) ? item.icon : undefined;
}

function getAvatarSymbol(item: ListAvatarItem): React.ComponentType | undefined {
  if (!item.icon || hasImageSource(item.icon)) {
    return undefined;
  }
  return iconMap[item.icon] || iconMap.info;
}

function getAvatarAlt(item: ListAvatarItem): string {
  return item.authorName || item.title || '';
}

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

function RowAvatar({ item, showIconAsAvatar }: RowAvatarProps) {
  if (!hasAvatar(item)) {
    return null;
  }
  const avatarSymbol = getAvatarSymbol(item);
  return (
    <span className="flex shrink-0 items-center">
      <Avatar
        size="medium"
        src={getAvatarSource(item)}
        alt={getAvatarAlt(item)}
        symbol={avatarSymbol}
        variant={showIconAsAvatar ? 'circle' : 'squircle'}
      >
        {avatarSymbol ? undefined : getInitials(item.authorName || item.title)}
      </Avatar>
    </span>
  );
}

function RowMeta({ item }: { item: ListAvatarItem }) {
  if (!item.meta && !item.authorName) {
    return null;
  }
  return (
    <Text className="typography-descriptor" noWrap>
      {item.authorName || item.meta}
    </Text>
  );
}

function RowIconMeta({ iconMeta }: { iconMeta?: ListIconMetaItem[] }) {
  if (!Array.isArray(iconMeta) || iconMeta.length === 0) {
    return null;
  }
  return (
    <span className="flex items-center gap-2">
      {iconMeta.map((iconMetaItem, index) => (
        <Tooltip key={`${iconMetaItem.icon}-${index}`} title={iconMetaItem.message}>
          <Icon
            symbol={iconMap[iconMetaItem.icon || 'info'] || iconMap.info}
            size={iconMetaItem.size || 'medium'}
            style={{ color: getTextColor(iconMetaItem.color) }}
          />
        </Tooltip>
      ))}
    </span>
  );
}

function RowNavigationIcon({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }
  return (
    <span className="flex items-center">
      <Icon symbol={ArrowRightMd} size="medium" />
    </span>
  );
}

function RowActionButton({
  action,
  onClickAction,
}: {
  action?: ListActionItem;
  onClickAction: (action: ListActionItem) => void;
}) {
  if (!action) {
    return null;
  }
  return (
    <SpringButton
      size="small"
      variant={getButtonVariant(action.variant)}
      color={getButtonColor(action.color)}
      disabled={action.disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClickAction(action);
      }}
    >
      {action.title}
    </SpringButton>
  );
}

function RowIconActions({
  buttonAction,
  iconActions,
  onClickAction,
}: {
  buttonAction?: ListActionItem;
  iconActions: ListActionItem[];
  onClickAction: (action: ListActionItem) => void;
}) {
  if (iconActions.length === 0) {
    return null;
  }
  return (
    <ActionMenu
      actions={getActionMenuItems(iconActions, onClickAction)}
      maxActions={buttonAction ? 1 : 3}
      iconClassName="mr-1"
      iconShape="squircle"
      iconVariant="outlined"
      size="medium"
      color="neutral"
    />
  );
}

function RowMetaSlot({
  buttonAction,
  iconActions,
  item,
  onClickAction,
  showAsNavigation,
}: {
  buttonAction?: ListActionItem;
  iconActions: ListActionItem[];
  item: ListRowItem;
  onClickAction: (action: ListActionItem) => void;
  showAsNavigation: boolean;
}) {
  const hasIconMeta = Array.isArray(item.iconMeta) && item.iconMeta.length > 0;
  if (
    !hasIconMeta &&
    !item.meta &&
    !item.authorName &&
    !showAsNavigation &&
    !buttonAction &&
    iconActions.length === 0
  ) {
    return null;
  }
  return (
    <span className="flex shrink-0 items-center gap-2">
      <RowIconMeta iconMeta={item.iconMeta} />
      <RowMeta item={item} />
      <RowNavigationIcon show={showAsNavigation} />
      <RowActionButton action={buttonAction} onClickAction={onClickAction} />
      <RowIconActions
        buttonAction={buttonAction}
        iconActions={iconActions}
        onClickAction={onClickAction}
      />
    </span>
  );
}

function getActionMenuItems(
  actions: ListActionItem[],
  onClickAction: (action: ListActionItem) => void,
): ActionMenuItem[] {
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
}: {
  actions?: ListActionItem[];
  alwaysShowActions?: boolean;
  disabled?: boolean;
  item: ListRowItem;
  onClick?: () => void;
  onClickAction: (action: ListActionItem) => void;
  readOnly?: boolean;
  selected?: boolean;
  showAsNavigation: boolean;
  showIconAsAvatar: boolean;
}) {
  const buttonAction = actions.find((action) => action?.type === 'button');
  const iconActions = actions.filter((action) => action?.type !== 'button');
  const inlineIconActions = alwaysShowActions ? iconActions : [];
  const hoverIconActions = alwaysShowActions ? [] : iconActions;
  const hasHoverActions = hoverIconActions.length > 0;
  const hoverActions = hasHoverActions ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <RowIconActions
        buttonAction={buttonAction}
        iconActions={hoverIconActions}
        onClickAction={onClickAction}
      />
    </div>
  ) : undefined;
  return (
    <ListItem
      selected={!readOnly && selected}
      clickable={!readOnly && !disabled}
      hoverable={!readOnly && !disabled}
      aria-disabled={disabled || undefined}
      onClick={readOnly || disabled ? undefined : onClick}
      hoverActions={hoverActions}
      className="group rounded-xl"
      size="auto"
      classes={{
        content: 'bg-inherit !px-3 !py-2',
      }}
      divider
    >
      <RowAvatar item={item} showIconAsAvatar={showIconAsAvatar} />
      <ListItemText
        className="min-w-0 flex-1 px-2 py-1"
        primary={<TextWithMarkdown text={item.title} />}
        secondary={
          <span style={{ color: getDescriptionColor(item.descriptionColor) }}>
            <TextWithMarkdown text={item.description} />
          </span>
        }
      />
      <RowMetaSlot
        buttonAction={buttonAction}
        iconActions={inlineIconActions}
        item={item}
        onClickAction={onClickAction}
        showAsNavigation={showAsNavigation}
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
        className="box-border flex flex-col items-center justify-center text-center"
        style={{
          cursor: readOnly ? 'default' : 'pointer',
          height,
          minHeight: height ? undefined : 112,
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
            style={{ color: getTextColor(item.trendColor || uiSchema?.['ui:trendColor']) }}
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
          onClickAction={(action: ListActionItem) => {
            onFocus(`${action.id}-${item.const}-action`, '$$clicked');
          }}
          alwaysShowActions={alwaysShowActions}
        />
      ))}
    </SpringList>
  );
}
