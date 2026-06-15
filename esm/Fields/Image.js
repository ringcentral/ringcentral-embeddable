import React from 'react';
export function Image({ schema, uiSchema = {}, formData, onFocus, name, }) {
    const src = formData || uiSchema['ui:src'] || schema.default;
    const alt = uiSchema['ui:alt'] || schema.title || '';
    const clickable = uiSchema['ui:clickable'] || false;
    const customStyle = uiSchema['ui:style'] || {};
    if (!src) {
        return null;
    }
    return (React.createElement("img", { src: src, alt: alt, style: Object.assign(Object.assign({ display: 'block', maxWidth: '100%', height: 'auto' }, customStyle), { cursor: clickable ? 'pointer' : customStyle.cursor }), onClick: clickable ? () => onFocus(name, '$$clicked') : undefined }));
}
//# sourceMappingURL=Image.js.map