# RingCentral Embeddable - JSONSchemaSpringPage

React components for rendering JSON Schema forms with RingCentral Spring UI.

This package mirrors the public API of `@ringcentral-integration/jsonschema-page`,
but renders with `@ringcentral/spring-ui` and builds on
`@ringcentral-integration/rjsf-spring`.

## Installation

```bash
npm install @ringcentral-integration/jsonschema-spring-page
```

Peer dependencies:

```bash
npm install @ringcentral/spring-ui @ringcentral/spring-icon @ringcentral/spring-theme react
```

Spring UI styles must be loaded once by the host app. You can either import the
prebuilt Spring UI CSS:

```ts
import '@ringcentral/spring-ui/index.css';
```

or configure Tailwind with `@ringcentral/spring-theme/tailwind` and include
`node_modules/@ringcentral/spring-ui/**/*.js` in Tailwind's content scan.

## Quick Start

```tsx
import '@ringcentral/spring-ui/index.css';
import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-spring-page';
import { suiLight, ThemeProvider } from '@ringcentral/spring-theme';
import { useState } from 'react';

export function MyForm() {
  const [formData, setFormData] = useState({});
  const schema = {
    title: 'Contact Form',
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Full Name' },
      email: { type: 'string', format: 'email', title: 'Email' },
    },
    required: ['name', 'email'],
  };

  return (
    <ThemeProvider theme={suiLight}>
      <JSONSchemaPage
        schema={schema}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={(data) => console.log('Submitted:', data.formData)}
      />
    </ThemeProvider>
  );
}
```

## API Compatibility

The package exports the same primary symbols as the Juno package:

- `JSONSchemaPage`
- `TextWithMarkdown`
- `ActionMenu`

Supported custom fields include:

- `button`
- `search`
- `list`
- `admonition`
- `typography`
- `link`
- `image`

Supported custom widgets include:

- `AutocompleteWidget`
- `DurationWidget`
- `FileWidget`
- `RadioWidget`
- `SelectWidget`

Existing JSON schema and UI schema definitions should generally migrate by
changing the import path from `@ringcentral-integration/jsonschema-page` to
`@ringcentral-integration/jsonschema-spring-page`.

For typography fields, `h1` through `h6` are rendered through Spring UI
`Text`'s `component` prop, while typography is applied with Spring UI
`typography-*` utility classes. Spring typography token names such as
`headline`, `display3`, `title`, `subtitle`, `mainText`, and `descriptor` are
also supported. Legacy Juno variant names like `body1`, `body2`, and
`caption1` are mapped for migration compatibility.
