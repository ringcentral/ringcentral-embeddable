import React from 'react';
import { Avatar, Block, Button as SpringButton, Icon, List as SpringList, ListItem, ListItemText, Text, Tooltip, } from '@ringcentral/spring-ui';
import { AddCommentMd, AlertMd, ArrowRightMd, CallMd, CheckMd, ConnectorMd, ContactsMd, CopyMd, DetailsMd, DownloadMd, EditMd, InfoMd, LinkMd, MarkReadMd, MarkUnreadMd, RefreshMd, SettingsMd, ShareMd, Smsmd, TrashMd, ViewMd, } from '@ringcentral/spring-icon';
import { ActionMenu } from '../components/ActionMenu.js';
import { TextWithMarkdown } from '../components/TextWithMarkdown.js';
import { getButtonColor, getButtonVariant, getDescriptionColor, getTextColor, } from '../utils/compat.js';
const iconMap = {
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
const imageSourcePattern = /^(https?:|data:|blob:)|^\.{0,2}\/|\.(?:svg|png|jpe?g|gif|webp)(?:[?#].*)?$/i;
function hasImageSource(source) {
    return !!source && imageSourcePattern.test(source);
}
function hasAvatar(item) {
    return !!(item.icon || item.authorAvatar || item.authorName);
}
function getAvatarSource(item) {
    if (!item.icon) {
        return item.authorAvatar;
    }
    return hasImageSource(item.icon) ? item.icon : undefined;
}
function getAvatarSymbol(item) {
    if (!item.icon || hasImageSource(item.icon)) {
        return undefined;
    }
    return iconMap[item.icon] || iconMap.info;
}
function getAvatarAlt(item) {
    return item.authorName || item.title || '';
}
function getInitials(name) {
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
function RowAvatar({ item, showIconAsAvatar }) {
    if (!hasAvatar(item)) {
        return null;
    }
    const avatarSymbol = getAvatarSymbol(item);
    return (React.createElement("span", { className: "flex shrink-0 items-center" },
        React.createElement(Avatar, { size: "medium", src: getAvatarSource(item), alt: getAvatarAlt(item), symbol: avatarSymbol, variant: showIconAsAvatar ? 'circle' : 'squircle' }, avatarSymbol ? undefined : getInitials(item.authorName || item.title))));
}
function RowMeta({ item }) {
    if (!item.meta && !item.authorName) {
        return null;
    }
    return (React.createElement(Text, { className: "typography-descriptor", noWrap: true }, item.authorName || item.meta));
}
function RowIconMeta({ iconMeta }) {
    if (!Array.isArray(iconMeta) || iconMeta.length === 0) {
        return null;
    }
    return (React.createElement("span", { className: "flex items-center gap-2" }, iconMeta.map((iconMetaItem, index) => (React.createElement(Tooltip, { key: `${iconMetaItem.icon}-${index}`, title: iconMetaItem.message },
        React.createElement(Icon, { symbol: iconMap[iconMetaItem.icon || 'info'] || iconMap.info, size: iconMetaItem.size || 'medium', style: { color: getTextColor(iconMetaItem.color) } }))))));
}
function RowNavigationIcon({ show }) {
    if (!show) {
        return null;
    }
    return (React.createElement("span", { className: "flex items-center" },
        React.createElement(Icon, { symbol: ArrowRightMd, size: "medium" })));
}
function RowActionButton({ action, onClickAction, }) {
    if (!action) {
        return null;
    }
    return (React.createElement(SpringButton, { size: "small", variant: getButtonVariant(action.variant), color: getButtonColor(action.color), disabled: action.disabled, onClick: (event) => {
            event.stopPropagation();
            onClickAction(action);
        } }, action.title));
}
function RowIconActions({ buttonAction, iconActions, onClickAction, }) {
    if (iconActions.length === 0) {
        return null;
    }
    return (React.createElement(ActionMenu, { actions: getActionMenuItems(iconActions, onClickAction), maxActions: buttonAction ? 1 : 3, iconClassName: "mr-1", iconShape: "squircle", iconVariant: "outlined", size: "medium", color: "neutral" }));
}
function RowMetaSlot({ buttonAction, iconActions, item, onClickAction, showAsNavigation, }) {
    const hasIconMeta = Array.isArray(item.iconMeta) && item.iconMeta.length > 0;
    if (!hasIconMeta &&
        !item.meta &&
        !item.authorName &&
        !showAsNavigation &&
        !buttonAction &&
        iconActions.length === 0) {
        return null;
    }
    return (React.createElement("span", { className: "flex shrink-0 items-center gap-2" },
        React.createElement(RowIconMeta, { iconMeta: item.iconMeta }),
        React.createElement(RowMeta, { item: item }),
        React.createElement(RowNavigationIcon, { show: showAsNavigation }),
        React.createElement(RowActionButton, { action: buttonAction, onClickAction: onClickAction }),
        React.createElement(RowIconActions, { buttonAction: buttonAction, iconActions: iconActions, onClickAction: onClickAction })));
}
function getActionMenuItems(actions, onClickAction) {
    return actions.map((action) => ({
        color: action.color,
        disabled: action.disabled,
        icon: iconMap[action.icon] || iconMap.info,
        id: action.id,
        onClick: (event) => {
            event === null || event === void 0 ? void 0 : event.stopPropagation();
            onClickAction(action);
        },
        title: action.title,
    }));
}
function RowItem({ item, disabled, selected, onClick, showIconAsAvatar, showAsNavigation, actions = [], onClickAction, readOnly, alwaysShowActions, }) {
    const buttonAction = actions.find((action) => (action === null || action === void 0 ? void 0 : action.type) === 'button');
    const iconActions = actions.filter((action) => (action === null || action === void 0 ? void 0 : action.type) !== 'button');
    const inlineIconActions = alwaysShowActions ? iconActions : [];
    const hoverIconActions = alwaysShowActions ? [] : iconActions;
    const hasHoverActions = hoverIconActions.length > 0;
    const hoverActions = hasHoverActions ? (React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement(RowIconActions, { buttonAction: buttonAction, iconActions: hoverIconActions, onClickAction: onClickAction }))) : undefined;
    return (React.createElement(ListItem, { selected: !readOnly && selected, clickable: !readOnly && !disabled, hoverable: !readOnly && !disabled, "aria-disabled": disabled || undefined, onClick: readOnly || disabled ? undefined : onClick, hoverActions: hoverActions, className: "group rounded-xl", size: "auto", classes: {
            content: 'bg-inherit !px-3 !py-2',
        }, divider: true },
        React.createElement(RowAvatar, { item: item, showIconAsAvatar: showIconAsAvatar }),
        React.createElement(ListItemText, { className: "min-w-0 flex-1 px-2 py-1", primary: React.createElement(TextWithMarkdown, { text: item.title }), secondary: React.createElement("span", { style: { color: getDescriptionColor(item.descriptionColor) } },
                React.createElement(TextWithMarkdown, { text: item.description })) }),
        React.createElement(RowMetaSlot, { buttonAction: buttonAction, iconActions: inlineIconActions, item: item, onClickAction: onClickAction, showAsNavigation: showAsNavigation })));
}
function MetricCard({ item, disabled, onClick, width, height, readOnly, uiSchema, }) {
    return (React.createElement("div", { style: { padding: 4, width: width || '100%' } },
        React.createElement(Block, { bordered: true, borderRadius: "small", background: true, className: "box-border flex flex-col items-center justify-center text-center", style: {
                cursor: readOnly ? 'default' : 'pointer',
                height,
                minHeight: height ? undefined : 112,
                backgroundColor: item.backgroundColor,
                opacity: disabled ? 0.5 : undefined,
                padding: 12,
            }, onClick: readOnly ? undefined : onClick },
            React.createElement(Text, { className: "typography-title", component: "div" }, item.value || item.title),
            item.unit ? React.createElement(Text, { className: "typography-descriptor", component: "div" }, item.unit) : null,
            React.createElement(Text, { className: "typography-mainText", component: "div" }, item.title || item.description || item.label),
            item.trend ? (React.createElement(Text, { className: "typography-descriptor", component: "div", style: { color: getTextColor(item.trendColor || (uiSchema === null || uiSchema === void 0 ? void 0 : uiSchema['ui:trendColor'])) } }, item.trend)) : null)));
}
function CardItem({ item, disabled, onClick, width, onClickAuthor, height, readOnly, isMetric, uiSchema, }) {
    if (isMetric) {
        return (React.createElement(MetricCard, { item: item, disabled: disabled, onClick: onClick, width: width, height: height, readOnly: readOnly, uiSchema: uiSchema }));
    }
    return (React.createElement("div", { style: { padding: 4, width: width || '100%' } },
        React.createElement(Block, { bordered: true, borderRadius: "small", background: true, style: {
                cursor: readOnly ? 'default' : 'pointer',
                height,
                minHeight: height ? undefined : 110,
                backgroundColor: item.backgroundColor,
                opacity: disabled ? 0.5 : undefined,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
            }, onClick: readOnly ? undefined : onClick },
            React.createElement("div", null,
                React.createElement(Text, { className: "typography-subtitle", component: "div", noWrap: true }, item.title),
                React.createElement(Text, { className: "typography-descriptor", component: "div", titleWhenOverflow: 2 }, item.description)),
            React.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 } },
                item.authorName ? (React.createElement(Avatar, { size: "xxsmall", src: item.authorAvatar, alt: item.authorName, clickable: true, onClick: (event) => {
                        event.stopPropagation();
                        onClickAuthor(event);
                    } }, getInitials(item.authorName))) : null,
                React.createElement(Text, { className: "typography-descriptor", noWrap: true }, item.meta)))));
}
export function List({ schema, uiSchema = {}, disabled, formData, onChange, onFocus, }) {
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
        return (React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', flexDirection: 'row' } }, items.map((item) => (React.createElement(CardItem, { key: item.const, item: item, disabled: disabled, selected: showSelected && formData === item.const, onClick: () => {
                if (!readOnly) {
                    onChange(item.const);
                }
            }, readOnly: readOnly, width: uiSchema['ui:itemWidth'], height: uiSchema['ui:itemHeight'], isMetric: isMetric, uiSchema: uiSchema, onClickAuthor: (event) => {
                event.stopPropagation();
                onFocus(`${item.const}-author`, '$$clicked');
            } })))));
    }
    return (React.createElement(SpringList, { style: { margin: '0 -16px' } }, items.map((item) => (React.createElement(RowItem, { key: item.const, item: item, disabled: disabled, selected: showSelected && formData === item.const, onClick: () => {
            if (!readOnly) {
                onChange(item.const);
            }
        }, readOnly: readOnly, showIconAsAvatar: showIconAsAvatar, showAsNavigation: showAsNavigation, actions: item.actions || [], onClickAction: (action) => {
            onFocus(`${action.id}-${item.const}-action`, '$$clicked');
        }, alwaysShowActions: alwaysShowActions })))));
}
//# sourceMappingURL=List.js.map