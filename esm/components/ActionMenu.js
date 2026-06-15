import React, { useRef, useState } from 'react';
import { Icon, IconButton, Menu, MenuItem, MenuItemText, } from '@ringcentral/spring-ui';
import { OverflowVerticalMd } from '@ringcentral/spring-icon';
import { getIconButtonColor } from '../utils/compat.js';
export function ActionMenu({ actions, className, color, iconClassName, iconShape, iconVariant = 'icon', maxActions = 3, onClick, onMoreMenuOpen, size = 'small', }) {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreButtonRef = useRef(null);
    const currentActions = actions.length > maxActions ? actions.slice(0, maxActions - 1) : actions;
    const moreActions = actions.length > maxActions ? actions.slice(maxActions - 1) : [];
    const closeMoreMenu = () => {
        setIsMoreMenuOpen(false);
        onMoreMenuOpen === null || onMoreMenuOpen === void 0 ? void 0 : onMoreMenuOpen(false);
    };
    return (React.createElement("div", { className: className, onClick: onClick, style: { display: 'flex', alignItems: 'center' } },
        currentActions.map((action, index) => {
            var _a;
            return (React.createElement(IconButton, { key: `${(_a = action.id) !== null && _a !== void 0 ? _a : action.title}-${index}`, symbol: action.icon, onClick: action.onClick, size: size, "data-sign": action.id, disabled: action.disabled, label: action.title, shape: iconShape, variant: iconVariant, color: getIconButtonColor(action.color || color), className: iconClassName }));
        }),
        moreActions.length > 0 ? (React.createElement(IconButton, { ref: moreButtonRef, symbol: OverflowVerticalMd, onClick: (event) => {
                event.stopPropagation();
                setIsMoreMenuOpen(true);
                onMoreMenuOpen === null || onMoreMenuOpen === void 0 ? void 0 : onMoreMenuOpen(true);
            }, size: size, shape: iconShape, variant: iconVariant, color: getIconButtonColor(color), label: "More actions", className: iconClassName })) : null,
        moreActions.length > 0 ? (React.createElement(Menu, { open: isMoreMenuOpen, onClose: closeMoreMenu, anchorEl: moreButtonRef.current, onClick: (event) => {
                event.stopPropagation();
            } }, moreActions.map((action, index) => {
            var _a;
            return (React.createElement(MenuItem, { key: `${(_a = action.id) !== null && _a !== void 0 ? _a : action.title}-${index}`, onClick: (event) => {
                    event.stopPropagation();
                    action.onClick(event);
                    closeMoreMenu();
                }, disabled: action.disabled },
                React.createElement(Icon, { symbol: action.icon, size: "small", style: { marginRight: 8 } }),
                React.createElement(MenuItemText, { primary: action.title })));
        }))) : null));
}
//# sourceMappingURL=ActionMenu.js.map