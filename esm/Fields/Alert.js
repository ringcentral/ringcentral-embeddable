import React from 'react';
import { Alert as SpringAlert } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown.js';
export function Alert({ schema, uiSchema = {} }) {
    return (React.createElement(SpringAlert, { severity: uiSchema['ui:severity'] || 'info', style: { padding: 10 } },
        React.createElement(TextWithMarkdown, { text: schema.description })));
}
//# sourceMappingURL=Alert.js.map