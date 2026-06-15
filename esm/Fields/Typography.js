import React from 'react';
import { Text } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown.js';
import { getTypographyClassName, getTypographyComponent } from '../utils/compat.js';
function getStringValue(value) {
    return typeof value === 'string' ? value : undefined;
}
function joinClassNames(...classNames) {
    return classNames.filter(Boolean).join(' ');
}
export function Typography({ schema, uiSchema = {} }) {
    const isBulletedList = Boolean(uiSchema['ui:bulletedList']);
    const variant = getStringValue(uiSchema['ui:variant']);
    const className = joinClassNames('m-0 text-neutral-b1 [overflow-wrap:anywhere]', getTypographyClassName(variant), isBulletedList ? 'list-disc list-outside !overflow-visible' : 'mt-[5px]');
    return (React.createElement(Text, { component: getTypographyComponent(variant, isBulletedList), className: className },
        React.createElement(TextWithMarkdown, { text: schema.description })));
}
//# sourceMappingURL=Typography.js.map