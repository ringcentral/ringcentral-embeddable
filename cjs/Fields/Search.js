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
exports.Search = Search;
const react_1 = __importStar(require("react"));
const spring_icon_1 = require("@ringcentral/spring-icon");
const spring_ui_1 = require("@ringcentral/spring-ui");
const filterButtonStyle = 'sui-filter-button sui-filter-button-root max-w-[120px]';
function getSearchText(formData) {
    if (typeof formData === 'string') {
        return formData;
    }
    return (formData === null || formData === void 0 ? void 0 : formData.search) || '';
}
function getFilterValue(formData) {
    if (typeof formData === 'string') {
        return '';
    }
    return (formData === null || formData === void 0 ? void 0 : formData.filter) || '';
}
function getFilterOptions(filters) {
    if (!Array.isArray(filters)) {
        return [];
    }
    return filters
        .map((filter) => {
        if (typeof filter === 'string') {
            return {
                label: filter,
                value: filter,
            };
        }
        if (!(filter === null || filter === void 0 ? void 0 : filter.value)) {
            return null;
        }
        return {
            label: filter.label || filter.value,
            value: filter.value,
        };
    })
        .filter((filter) => filter !== null);
}
function getVisibleFilterItems({ data, value, visibleCount, }) {
    if (data.length === 0) {
        return [];
    }
    const count = Math.max(1, visibleCount);
    const visibleItems = data.slice(0, count);
    const selectedItem = data.find((item) => item.value === value);
    if (!selectedItem || visibleItems.some((item) => item.value === value)) {
        return visibleItems;
    }
    return [...visibleItems.slice(0, -1), selectedItem];
}
function getHiddenFilterItems(data, visibleItems) {
    return data.filter((item) => !visibleItems.some((visibleItem) => visibleItem.value === item.value));
}
function getNextSearchFormData({ filter, formData, search, }) {
    const currentFormData = typeof formData === 'object' && formData !== null ? formData : {};
    return Object.assign(Object.assign({}, currentFormData), { filter,
        search });
}
function SearchInputToggle({ alwaysExpanded = false, className, dataSign, disabled, expanded: controlledExpanded, onExpandedChange, onSearchInputChange, placeholder, searchInput, }) {
    const searchInputRef = (0, react_1.useRef)(null);
    const expanded = alwaysExpanded ? true : controlledExpanded !== null && controlledExpanded !== void 0 ? controlledExpanded : false;
    const handleSearchButtonClick = () => {
        if (disabled) {
            return;
        }
        if (!alwaysExpanded) {
            onExpandedChange === null || onExpandedChange === void 0 ? void 0 : onExpandedChange(true);
        }
        window.setTimeout(() => {
            var _a;
            (_a = searchInputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        }, 0);
    };
    const handleSearchBlur = (event) => {
        const relatedTarget = event.relatedTarget;
        if ((relatedTarget === null || relatedTarget === void 0 ? void 0 : relatedTarget.getAttribute('data-prevent-blur')) === 'true') {
            return;
        }
        if (!alwaysExpanded && searchInput.length === 0) {
            onExpandedChange === null || onExpandedChange === void 0 ? void 0 : onExpandedChange(false);
        }
    };
    (0, react_1.useEffect)(() => {
        if (!alwaysExpanded && searchInput.length > 0 && !expanded) {
            onExpandedChange === null || onExpandedChange === void 0 ? void 0 : onExpandedChange(true);
        }
    }, [alwaysExpanded, expanded, onExpandedChange, searchInput]);
    return (react_1.default.createElement("div", { className: className }, expanded ? (react_1.default.createElement("div", { className: "overflow-hidden flex-1 min-w-0" },
        react_1.default.createElement(spring_ui_1.TextField, { inputRef: searchInputRef, placeholder: placeholder, startAdornment: react_1.default.createElement(spring_ui_1.Icon, { symbol: spring_icon_1.SearchMd, size: "small" }), variant: "standard", size: "large", RootProps: {
                classes: {
                    focusEffect: 'hidden',
                    content: 'border-none',
                },
            }, fullWidth: true, value: searchInput, disabled: disabled, inputProps: {
                'data-sign': dataSign,
            }, onChange: onSearchInputChange, onBlur: handleSearchBlur }))) : (react_1.default.createElement("div", { className: "h-8 -ml-1 flex items-center" },
        react_1.default.createElement(spring_ui_1.IconButton, { variant: "icon", size: "small", color: "secondary", disabled: disabled, onClick: handleSearchButtonClick, "data-sign": `${dataSign}-button`, TooltipProps: {
                title: placeholder,
            } },
            react_1.default.createElement(spring_ui_1.Icon, { symbol: spring_icon_1.SearchMd, size: "small" }))))));
}
function SingleFilter({ className, data, disabled, onMenuClose, onSelect, value, visibleCount = 2, }) {
    const [isMenuOpen, setIsMenuOpen] = (0, react_1.useState)(false);
    const menuButtonRef = (0, react_1.useRef)(null);
    const visibleItems = (0, react_1.useMemo)(() => getVisibleFilterItems({ data, value, visibleCount }), [data, value, visibleCount]);
    const hiddenItems = (0, react_1.useMemo)(() => getHiddenFilterItems(data, visibleItems), [data, visibleItems]);
    const handleMenuClose = () => {
        setIsMenuOpen(false);
        onMenuClose === null || onMenuClose === void 0 ? void 0 : onMenuClose();
    };
    const handleItemClick = (itemValue) => {
        onSelect(itemValue);
        handleMenuClose();
    };
    if (data.length === 0) {
        return null;
    }
    return (react_1.default.createElement("div", { className: ['sui-single-filter sui-single-filter-root', className]
            .filter(Boolean)
            .join(' ') },
        visibleItems.map((item) => (react_1.default.createElement("button", { key: item.value, className: [
                filterButtonStyle,
                value === item.value ? 'sui-selected' : '',
            ].filter(Boolean).join(' '), title: item.label, "aria-current": value === item.value, type: "button", disabled: disabled, onClick: () => handleItemClick(item.value), "data-sign": `filter-${item.value}` }, item.label))),
        hiddenItems.length > 0 ? (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(spring_ui_1.IconButton, { ref: menuButtonRef, shape: "squircle", variant: "contained", size: "small", color: "secondary", background: false, className: "sui-single-filter-more", disabled: disabled, onClick: () => setIsMenuOpen(true), "aria-expanded": isMenuOpen, "data-prevent-blur": "true", "data-sign": "jsonSchemaFilterExpand" },
                react_1.default.createElement(spring_ui_1.ExpandCollapseCaret, { orientation: "vertical", expanded: isMenuOpen })),
            react_1.default.createElement(spring_ui_1.Menu, { anchorEl: menuButtonRef.current, open: isMenuOpen, onClose: handleMenuClose },
                react_1.default.createElement(spring_ui_1.MenuList, null, hiddenItems.map((item) => (react_1.default.createElement(spring_ui_1.MenuItem, { key: item.value, selected: value === item.value, onClick: () => handleItemClick(item.value), title: item.label }, item.label))))))) : null));
}
function Search({ uiSchema = {}, formData, disabled, onChange, }) {
    var _a;
    const placeholder = uiSchema['ui:placeholder'] || 'Search';
    const filterOptions = getFilterOptions(uiSchema['ui:filters']);
    const searchText = getSearchText(formData);
    const defaultFilter = ((_a = filterOptions[0]) === null || _a === void 0 ? void 0 : _a.value) || '';
    const selectedFilter = getFilterValue(formData) || defaultFilter;
    const [searchExpanded, setSearchExpanded] = (0, react_1.useState)(searchText.length > 0);
    if (filterOptions.length === 0) {
        return (react_1.default.createElement(SearchInputToggle, { alwaysExpanded: true, dataSign: "jsonSchemaSearchInput", disabled: disabled, placeholder: placeholder, searchInput: searchText, onSearchInputChange: (event) => onChange(event.target.value) }));
    }
    return (react_1.default.createElement("div", { className: "flex items-center gap-2 px-3 py-1", "data-sign": "jsonSchemaSearchAndFilter" },
        react_1.default.createElement("div", { className: "flex-auto" },
            react_1.default.createElement(SearchInputToggle, { dataSign: "jsonSchemaSearchInput", disabled: disabled, expanded: searchExpanded, onExpandedChange: setSearchExpanded, placeholder: placeholder, searchInput: searchText, onSearchInputChange: (event) => {
                    onChange(getNextSearchFormData({
                        filter: selectedFilter,
                        formData,
                        search: event.target.value,
                    }));
                } })),
        react_1.default.createElement("div", { className: "flex-none", "data-sign": "jsonSchemaTypeFilter" },
            react_1.default.createElement(SingleFilter, { data: filterOptions, disabled: disabled, value: selectedFilter, visibleCount: searchExpanded ? 1 : uiSchema['ui:previewLength'] || 2, onSelect: (filter) => {
                    onChange(getNextSearchFormData({
                        filter,
                        formData,
                        search: searchText,
                    }));
                }, onMenuClose: () => {
                    setSearchExpanded(false);
                } }))));
}
//# sourceMappingURL=Search.js.map