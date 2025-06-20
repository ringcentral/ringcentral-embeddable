# JSONSchemaPage

A library that renders a JSON schema page. It is based on [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form). And styled with [RingCentralJuno](https://github.com/ringcentral/ringcentral-juno).

## Usage

```tsx
import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-page';

function App({
  schema,
  uiSchema,
  formData,
  onFormDataChange,
  onButtonClick,
  hiddenSubmitButton,
  onSubmit,
}) {
  return (
    <JSONSchemaPage
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      onFormDataChange={(newFormData) => {
        // handle the form data change
        onFormDataChange(newFormData);
      }}
      onButtonClick={(buttonId) => {
        // handle the button click
        onButtonClick(buttonId);
      }}
      hiddenSubmitButton={hiddenSubmitButton}
      onSubmit={() => {
        // handle the form submit
        onSubmit(formData);
      }}
    />
  )
}
``` 