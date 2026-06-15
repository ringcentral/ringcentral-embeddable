import React from 'react';
import { Text } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown.js';
export default function DescriptionField(props) {
    const { id, description, style = {}, uiSchema = {} } = props;
    if (!description) {
        return null;
    }
    const isDisabled = uiSchema['ui:disabled'] || false;
    return (React.createElement(Text, { id: id, className: "typography-descriptor", component: "div", style: Object.assign({ color: isDisabled ? 'var(--sui-colors-neutral-b3)' : 'var(--sui-colors-neutral-b2)' }, style) }, typeof description === 'string' ? React.createElement(TextWithMarkdown, { text: description }) : description));
}
//# sourceMappingURL=DescriptionField.js.map