const React = require('react');

const JSONSchemaPage = jest.fn(
  ({ hiddenSubmitButton, onButtonClick, onFormDataChange, onSubmit }) =>
    React.createElement(
      'div',
      { 'data-sign': 'json-schema-page' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onFormDataChange?.({ name: 'Updated' }),
        },
        'Change form',
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onFormDataChange?.('invalid'),
        },
        'Invalid form',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onButtonClick?.('custom') },
        'Custom action',
      ),
      hiddenSubmitButton
        ? null
        : React.createElement(
            'button',
            { type: 'button', onClick: () => onSubmit?.() },
            'Submit form',
          ),
    ),
);

module.exports = {
  JSONSchemaPage,
};
