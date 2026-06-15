import React from 'react';
import { Divider, Icon, Text } from '@ringcentral/spring-ui';
import { CaretDownMd, CaretUpMd } from '@ringcentral/spring-icon';
export default function TitleField({ id, title, uiSchema = {}, extended = false, onClick, }) {
    const isCollapsible = uiSchema['ui:collapsible'] || false;
    const isDisabled = uiSchema['ui:disabled'] || false;
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { id: id, style: {
                alignItems: 'center',
                cursor: isCollapsible ? 'pointer' : 'default',
                display: 'flex',
                margin: '8px 0',
                overflow: 'hidden',
            }, onClick: onClick },
            React.createElement(Text, { className: extended ? 'typography-subtitle' : 'typography-mainText', component: "div", style: {
                    color: isDisabled ? 'var(--sui-colors-neutral-b3)' : undefined,
                    flex: 1,
                } }, title),
            isCollapsible ? React.createElement(Icon, { symbol: extended ? CaretUpMd : CaretDownMd, size: "small" }) : null),
        isCollapsible ? React.createElement(Divider, null) : null));
}
//# sourceMappingURL=TitleField.js.map