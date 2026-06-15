import React from 'react';
import { Link as SpringLink } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown.js';
import { getLinkVariant } from '../utils/compat.js';
export function Link({ schema, uiSchema = {}, disabled, onFocus, name, }) {
    const href = uiSchema['ui:href'] || undefined;
    const isBulletedList = uiSchema['ui:bulletedList'];
    const component = isBulletedList ? 'li' : 'a';
    return (React.createElement(SpringLink, { component: component, variant: getLinkVariant(uiSchema['ui:variant'], uiSchema['ui:color']), underline: uiSchema['ui:underline'] || 'hover', href: href, target: "_blank", rel: "noopener noreferrer", style: {
            opacity: disabled ? 0.5 : undefined,
            pointerEvents: disabled ? 'none' : undefined,
        }, onClick: () => {
            if (disabled) {
                return;
            }
            if (!href) {
                onFocus(name, '$$clicked');
                return;
            }
            if (component !== 'a') {
                window.open(href, '_blank');
            }
        } },
        React.createElement(TextWithMarkdown, { text: schema.description })));
}
//# sourceMappingURL=Link.js.map