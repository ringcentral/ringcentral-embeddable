import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SearchMd } from '@ringcentral/spring-icon';
import { ExpandCollapseCaret, Icon, IconButton, Menu, MenuItem, MenuList, TextField, } from '@ringcentral/spring-ui';
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
    const searchInputRef = useRef(null);
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
    useEffect(() => {
        if (!alwaysExpanded && searchInput.length > 0 && !expanded) {
            onExpandedChange === null || onExpandedChange === void 0 ? void 0 : onExpandedChange(true);
        }
    }, [alwaysExpanded, expanded, onExpandedChange, searchInput]);
    return (React.createElement("div", { className: className }, expanded ? (React.createElement("div", { className: "overflow-hidden flex-1 min-w-0" },
        React.createElement(TextField, { inputRef: searchInputRef, placeholder: placeholder, startAdornment: React.createElement(Icon, { symbol: SearchMd, size: "small" }), variant: "standard", size: "large", RootProps: {
                classes: {
                    focusEffect: 'hidden',
                    content: 'border-none',
                },
            }, fullWidth: true, value: searchInput, disabled: disabled, inputProps: {
                'data-sign': dataSign,
            }, onChange: onSearchInputChange, onBlur: handleSearchBlur }))) : (React.createElement("div", { className: "h-8 -ml-1 flex items-center" },
        React.createElement(IconButton, { variant: "icon", size: "small", color: "secondary", disabled: disabled, onClick: handleSearchButtonClick, "data-sign": `${dataSign}-button`, TooltipProps: {
                title: placeholder,
            } },
            React.createElement(Icon, { symbol: SearchMd, size: "small" }))))));
}
function SingleFilter({ className, data, disabled, onMenuClose, onSelect, value, visibleCount = 2, }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuButtonRef = useRef(null);
    const visibleItems = useMemo(() => getVisibleFilterItems({ data, value, visibleCount }), [data, value, visibleCount]);
    const hiddenItems = useMemo(() => getHiddenFilterItems(data, visibleItems), [data, visibleItems]);
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
    return (React.createElement("div", { className: ['sui-single-filter sui-single-filter-root', className]
            .filter(Boolean)
            .join(' ') },
        visibleItems.map((item) => (React.createElement("button", { key: item.value, className: [
                filterButtonStyle,
                value === item.value ? 'sui-selected' : '',
            ].filter(Boolean).join(' '), title: item.label, "aria-current": value === item.value, type: "button", disabled: disabled, onClick: () => handleItemClick(item.value), "data-sign": `filter-${item.value}` }, item.label))),
        hiddenItems.length > 0 ? (React.createElement(React.Fragment, null,
            React.createElement(IconButton, { ref: menuButtonRef, shape: "squircle", variant: "contained", size: "small", color: "secondary", background: false, className: "sui-single-filter-more", disabled: disabled, onClick: () => setIsMenuOpen(true), "aria-expanded": isMenuOpen, "data-prevent-blur": "true", "data-sign": "jsonSchemaFilterExpand" },
                React.createElement(ExpandCollapseCaret, { orientation: "vertical", expanded: isMenuOpen })),
            React.createElement(Menu, { anchorEl: menuButtonRef.current, open: isMenuOpen, onClose: handleMenuClose },
                React.createElement(MenuList, null, hiddenItems.map((item) => (React.createElement(MenuItem, { key: item.value, selected: value === item.value, onClick: () => handleItemClick(item.value), title: item.label }, item.label))))))) : null));
}
export function Search({ uiSchema = {}, formData, disabled, onChange, }) {
    var _a;
    const placeholder = uiSchema['ui:placeholder'] || 'Search';
    const filterOptions = getFilterOptions(uiSchema['ui:filters']);
    const searchText = getSearchText(formData);
    const defaultFilter = ((_a = filterOptions[0]) === null || _a === void 0 ? void 0 : _a.value) || '';
    const selectedFilter = getFilterValue(formData) || defaultFilter;
    const [searchExpanded, setSearchExpanded] = useState(searchText.length > 0);
    if (filterOptions.length === 0) {
        return (React.createElement(SearchInputToggle, { alwaysExpanded: true, dataSign: "jsonSchemaSearchInput", disabled: disabled, placeholder: placeholder, searchInput: searchText, onSearchInputChange: (event) => onChange(event.target.value) }));
    }
    return (React.createElement("div", { className: "flex items-center gap-2 px-3 py-1", "data-sign": "jsonSchemaSearchAndFilter" },
        React.createElement("div", { className: "flex-auto" },
            React.createElement(SearchInputToggle, { dataSign: "jsonSchemaSearchInput", disabled: disabled, expanded: searchExpanded, onExpandedChange: setSearchExpanded, placeholder: placeholder, searchInput: searchText, onSearchInputChange: (event) => {
                    onChange(getNextSearchFormData({
                        filter: selectedFilter,
                        formData,
                        search: event.target.value,
                    }));
                } })),
        React.createElement("div", { className: "flex-none", "data-sign": "jsonSchemaTypeFilter" },
            React.createElement(SingleFilter, { data: filterOptions, disabled: disabled, value: selectedFilter, visibleCount: searchExpanded ? 1 : uiSchema['ui:previewLength'] || 2, onSelect: (filter) => {
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