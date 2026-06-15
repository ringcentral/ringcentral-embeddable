import { Text } from '@ringcentral/spring-ui';
import { helpId, } from '@rjsf/utils';
import React from 'react';
import { TextWithMarkdown } from '../components/TextWithMarkdown.js';
export default function FieldHelpTemplate({ help, idSchema }) {
    if (!help) {
        return null;
    }
    return (React.createElement(Text, { id: helpId(idSchema), className: "typography-descriptor", component: "div", style: { color: 'var(--sui-colors-neutral-b2)' } }, typeof help === 'string' ? React.createElement(TextWithMarkdown, { text: help }) : help));
}
//# sourceMappingURL=FieldHelpTemplate.js.map