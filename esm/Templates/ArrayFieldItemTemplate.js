import React from 'react';
function joinClassNames(...classNames) {
    return classNames.filter(Boolean).join(' ');
}
function shouldRenderInlineItem(schema) {
    const type = schema.type;
    const hasObjectType = type === 'object' || (Array.isArray(type) && type.includes('object'));
    const hasArrayType = type === 'array' || (Array.isArray(type) && type.includes('array'));
    return !hasObjectType && !hasArrayType && !schema.properties && !schema.items;
}
export default function ArrayFieldItemTemplate(props) {
    const { children, className, disabled, hasToolbar, hasCopy, hasMoveDown, hasMoveUp, hasRemove, index, onCopyIndexClick, onDropIndexClick, onReorderClick, readonly, schema, uiSchema, registry, } = props;
    const isInlineItem = shouldRenderInlineItem(schema);
    const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;
    const isActionDisabled = Boolean(disabled || readonly);
    const hasMoveButtons = hasMoveUp || hasMoveDown;
    const shouldRenderToolbar = hasToolbar && (hasMoveButtons || hasCopy || hasRemove);
    const toolbar = shouldRenderToolbar ? (React.createElement("div", { className: joinClassNames('flex shrink-0 justify-end gap-1', isInlineItem ? 'pt-6' : 'absolute right-3 top-3') },
        hasMoveButtons ? (React.createElement(MoveUpButton, { className: "shrink-0", disabled: isActionDisabled || !hasMoveUp, onClick: onReorderClick(index, index - 1), uiSchema: uiSchema, registry: registry })) : null,
        hasMoveButtons ? (React.createElement(MoveDownButton, { className: "shrink-0", disabled: isActionDisabled || !hasMoveDown, onClick: onReorderClick(index, index + 1), uiSchema: uiSchema, registry: registry })) : null,
        hasCopy ? (React.createElement(CopyButton, { className: "shrink-0", disabled: isActionDisabled, onClick: onCopyIndexClick(index), uiSchema: uiSchema, registry: registry })) : null,
        hasRemove ? (React.createElement(RemoveButton, { className: "shrink-0", disabled: isActionDisabled, onClick: onDropIndexClick(index), uiSchema: uiSchema, registry: registry })) : null)) : null;
    return (React.createElement("div", { className: joinClassNames('w-full min-w-0', className) },
        React.createElement("div", { className: joinClassNames('w-full min-w-0 rounded border border-neutral-b4 bg-neutral-base p-3', isInlineItem ? 'flex items-start gap-2' : 'relative') },
            React.createElement("div", { className: joinClassNames('min-w-0', isInlineItem ? 'flex-1' : "[&>[id$='__title']]:pr-[136px]") }, children),
            toolbar)));
}
//# sourceMappingURL=ArrayFieldItemTemplate.js.map