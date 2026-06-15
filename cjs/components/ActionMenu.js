"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionMenu = ActionMenu;
const react_1 = __importStar(require("react"));
const spring_ui_1 = require("@ringcentral/spring-ui");
const spring_icon_1 = require("@ringcentral/spring-icon");
const compat_1 = require("../utils/compat");
function ActionMenu({ actions, className, color, iconClassName, iconShape, iconVariant = 'icon', maxActions = 3, onClick, onMoreMenuOpen, size = 'small', }) {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = (0, react_1.useState)(false);
    const moreButtonRef = (0, react_1.useRef)(null);
    const currentActions = actions.length > maxActions ? actions.slice(0, maxActions - 1) : actions;
    const moreActions = actions.length > maxActions ? actions.slice(maxActions - 1) : [];
    const closeMoreMenu = () => {
        setIsMoreMenuOpen(false);
        onMoreMenuOpen === null || onMoreMenuOpen === void 0 ? void 0 : onMoreMenuOpen(false);
    };
    return (react_1.default.createElement("div", { className: className, onClick: onClick, style: { display: 'flex', alignItems: 'center' } },
        currentActions.map((action, index) => {
            var _a;
            return (react_1.default.createElement(spring_ui_1.IconButton, { key: `${(_a = action.id) !== null && _a !== void 0 ? _a : action.title}-${index}`, symbol: action.icon, onClick: action.onClick, size: size, "data-sign": action.id, disabled: action.disabled, label: action.title, shape: iconShape, variant: iconVariant, color: (0, compat_1.getIconButtonColor)(action.color || color), className: iconClassName }));
        }),
        moreActions.length > 0 ? (react_1.default.createElement(spring_ui_1.IconButton, { ref: moreButtonRef, symbol: spring_icon_1.OverflowVerticalMd, onClick: (event) => {
                event.stopPropagation();
                setIsMoreMenuOpen(true);
                onMoreMenuOpen === null || onMoreMenuOpen === void 0 ? void 0 : onMoreMenuOpen(true);
            }, size: size, shape: iconShape, variant: iconVariant, color: (0, compat_1.getIconButtonColor)(color), label: "More actions", className: iconClassName })) : null,
        moreActions.length > 0 ? (react_1.default.createElement(spring_ui_1.Menu, { open: isMoreMenuOpen, onClose: closeMoreMenu, anchorEl: moreButtonRef.current, onClick: (event) => {
                event.stopPropagation();
            } }, moreActions.map((action, index) => {
            var _a;
            return (react_1.default.createElement(spring_ui_1.MenuItem, { key: `${(_a = action.id) !== null && _a !== void 0 ? _a : action.title}-${index}`, onClick: (event) => {
                    event.stopPropagation();
                    action.onClick(event);
                    closeMoreMenu();
                }, disabled: action.disabled },
                react_1.default.createElement(spring_ui_1.Icon, { symbol: action.icon, size: "small", style: { marginRight: 8 } }),
                react_1.default.createElement(spring_ui_1.MenuItemText, { primary: action.title })));
        }))) : null));
}
//# sourceMappingURL=ActionMenu.js.map