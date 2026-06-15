"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.List = List;
const react_1 = __importDefault(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const spring_icon_1 = require("@ringcentral/spring-icon");
const ActionMenu_1 = require("../components/ActionMenu");
const TextWithMarkdown_1 = require("../components/TextWithMarkdown");
const compat_1 = require("../utils/compat");
const iconMap = {
    check: spring_icon_1.CheckMd,
    connect: spring_icon_1.ConnectorMd,
    copy: spring_icon_1.CopyMd,
    delete: spring_icon_1.TrashMd,
    download: spring_icon_1.DownloadMd,
    edit: spring_icon_1.EditMd,
    info: spring_icon_1.InfoMd,
    insertLink: spring_icon_1.LinkMd,
    newAction: spring_icon_1.AddCommentMd,
    people: spring_icon_1.ContactsMd,
    phone: spring_icon_1.CallMd,
    read: spring_icon_1.MarkReadMd,
    refresh: spring_icon_1.RefreshMd,
    settings: spring_icon_1.SettingsMd,
    share: spring_icon_1.ShareMd,
    sms: spring_icon_1.Smsmd,
    unread: spring_icon_1.MarkUnreadMd,
    view: spring_icon_1.ViewMd,
    viewLog: spring_icon_1.DetailsMd,
    warning: spring_icon_1.AlertMd,
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
    return (react_1.default.createElement("span", { className: "flex shrink-0 items-center" },
        react_1.default.createElement(spring_ui_1.Avatar, { size: "medium", src: getAvatarSource(item), alt: getAvatarAlt(item), symbol: avatarSymbol, variant: showIconAsAvatar ? 'circle' : 'squircle' }, avatarSymbol ? undefined : getInitials(item.authorName || item.title))));
}
function RowMeta({ item }) {
    if (!item.meta && !item.authorName) {
        return null;
    }
    return (react_1.default.createElement(spring_ui_1.Text, { className: "typography-descriptor", noWrap: true }, item.authorName || item.meta));
}
function RowIconMeta({ iconMeta }) {
    if (!Array.isArray(iconMeta) || iconMeta.length === 0) {
        return null;
    }
    return (react_1.default.createElement("span", { className: "flex items-center gap-2" }, iconMeta.map((iconMetaItem, index) => (react_1.default.createElement(spring_ui_1.Tooltip, { key: `${iconMetaItem.icon}-${index}`, title: iconMetaItem.message },
        react_1.default.createElement(spring_ui_1.Icon, { symbol: iconMap[iconMetaItem.icon || 'info'] || iconMap.info, size: iconMetaItem.size || 'medium', style: { color: (0, compat_1.getTextColor)(iconMetaItem.color) } }))))));
}
function RowNavigationIcon({ show }) {
    if (!show) {
        return null;
    }
    return (react_1.default.createElement("span", { className: "flex items-center" },
        react_1.default.createElement(spring_ui_1.Icon, { symbol: spring_icon_1.ArrowRightMd, size: "medium" })));
}
function RowActionButton({ action, onClickAction, }) {
    if (!action) {
        return null;
    }
    return (react_1.default.createElement(spring_ui_1.Button, { size: "small", variant: (0, compat_1.getButtonVariant)(action.variant), color: (0, compat_1.getButtonColor)(action.color), disabled: action.disabled, onClick: (event) => {
            event.stopPropagation();
            onClickAction(action);
        } }, action.title));
}
function RowIconActions({ buttonAction, iconActions, onClickAction, }) {
    if (iconActions.length === 0) {
        return null;
    }
    return (react_1.default.createElement(ActionMenu_1.ActionMenu, { actions: getActionMenuItems(iconActions, onClickAction), maxActions: buttonAction ? 1 : 3, iconClassName: "mr-1", iconShape: "squircle", iconVariant: "outlined", size: "medium", color: "neutral" }));
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
    return (react_1.default.createElement("span", { className: "flex shrink-0 items-center gap-2" },
        react_1.default.createElement(RowIconMeta, { iconMeta: item.iconMeta }),
        react_1.default.createElement(RowMeta, { item: item }),
        react_1.default.createElement(RowNavigationIcon, { show: showAsNavigation }),
        react_1.default.createElement(RowActionButton, { action: buttonAction, onClickAction: onClickAction }),
        react_1.default.createElement(RowIconActions, { buttonAction: buttonAction, iconActions: iconActions, onClickAction: onClickAction })));
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
    const hoverActions = hasHoverActions ? (react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
        react_1.default.createElement(RowIconActions, { buttonAction: buttonAction, iconActions: hoverIconActions, onClickAction: onClickAction }))) : undefined;
    return (react_1.default.createElement(spring_ui_1.ListItem, { selected: !readOnly && selected, clickable: !readOnly && !disabled, hoverable: !readOnly && !disabled, "aria-disabled": disabled || undefined, onClick: readOnly || disabled ? undefined : onClick, hoverActions: hoverActions, className: "group rounded-xl", size: "auto", classes: {
            content: 'bg-inherit !px-3 !py-2',
        }, divider: true },
        react_1.default.createElement(RowAvatar, { item: item, showIconAsAvatar: showIconAsAvatar }),
        react_1.default.createElement(spring_ui_1.ListItemText, { className: "min-w-0 flex-1 px-2 py-1", primary: react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: item.title }), secondary: react_1.default.createElement("span", { style: { color: (0, compat_1.getDescriptionColor)(item.descriptionColor) } },
                react_1.default.createElement(TextWithMarkdown_1.TextWithMarkdown, { text: item.description })) }),
        react_1.default.createElement(RowMetaSlot, { buttonAction: buttonAction, iconActions: inlineIconActions, item: item, onClickAction: onClickAction, showAsNavigation: showAsNavigation })));
}
function MetricCard({ item, disabled, onClick, width, height, readOnly, uiSchema, }) {
    return (react_1.default.createElement("div", { style: { padding: 4, width: width || '100%' } },
        react_1.default.createElement(spring_ui_1.Block, { bordered: true, borderRadius: "small", background: true, className: "box-border flex flex-col items-center justify-center text-center", style: {
                cursor: readOnly ? 'default' : 'pointer',
                height,
                minHeight: height ? undefined : 112,
                backgroundColor: item.backgroundColor,
                opacity: disabled ? 0.5 : undefined,
                padding: 12,
            }, onClick: readOnly ? undefined : onClick },
            react_1.default.createElement(spring_ui_1.Text, { className: "typography-title", component: "div" }, item.value || item.title),
            item.unit ? react_1.default.createElement(spring_ui_1.Text, { className: "typography-descriptor", component: "div" }, item.unit) : null,
            react_1.default.createElement(spring_ui_1.Text, { className: "typography-mainText", component: "div" }, item.title || item.description || item.label),
            item.trend ? (react_1.default.createElement(spring_ui_1.Text, { className: "typography-descriptor", component: "div", style: { color: (0, compat_1.getTextColor)(item.trendColor || (uiSchema === null || uiSchema === void 0 ? void 0 : uiSchema['ui:trendColor'])) } }, item.trend)) : null)));
}
function CardItem({ item, disabled, onClick, width, onClickAuthor, height, readOnly, isMetric, uiSchema, }) {
    if (isMetric) {
        return (react_1.default.createElement(MetricCard, { item: item, disabled: disabled, onClick: onClick, width: width, height: height, readOnly: readOnly, uiSchema: uiSchema }));
    }
    return (react_1.default.createElement("div", { style: { padding: 4, width: width || '100%' } },
        react_1.default.createElement(spring_ui_1.Block, { bordered: true, borderRadius: "small", background: true, style: {
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
            react_1.default.createElement("div", null,
                react_1.default.createElement(spring_ui_1.Text, { className: "typography-subtitle", component: "div", noWrap: true }, item.title),
                react_1.default.createElement(spring_ui_1.Text, { className: "typography-descriptor", component: "div", titleWhenOverflow: 2 }, item.description)),
            react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 } },
                item.authorName ? (react_1.default.createElement(spring_ui_1.Avatar, { size: "xxsmall", src: item.authorAvatar, alt: item.authorName, clickable: true, onClick: (event) => {
                        event.stopPropagation();
                        onClickAuthor(event);
                    } }, getInitials(item.authorName))) : null,
                react_1.default.createElement(spring_ui_1.Text, { className: "typography-descriptor", noWrap: true }, item.meta)))));
}
function List({ schema, uiSchema = {}, disabled, formData, onChange, onFocus, }) {
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
        return (react_1.default.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', flexDirection: 'row' } }, items.map((item) => (react_1.default.createElement(CardItem, { key: item.const, item: item, disabled: disabled, selected: showSelected && formData === item.const, onClick: () => {
                if (!readOnly) {
                    onChange(item.const);
                }
            }, readOnly: readOnly, width: uiSchema['ui:itemWidth'], height: uiSchema['ui:itemHeight'], isMetric: isMetric, uiSchema: uiSchema, onClickAuthor: (event) => {
                event.stopPropagation();
                onFocus(`${item.const}-author`, '$$clicked');
            } })))));
    }
    return (react_1.default.createElement(spring_ui_1.List, { style: { margin: '0 -16px' } }, items.map((item) => (react_1.default.createElement(RowItem, { key: item.const, item: item, disabled: disabled, selected: showSelected && formData === item.const, onClick: () => {
            if (!readOnly) {
                onChange(item.const);
            }
        }, readOnly: readOnly, showIconAsAvatar: showIconAsAvatar, showAsNavigation: showAsNavigation, actions: item.actions || [], onClickAction: (action) => {
            onFocus(`${action.id}-${item.const}-action`, '$$clicked');
        }, alwaysShowActions: alwaysShowActions })))));
}
//# sourceMappingURL=List.js.map