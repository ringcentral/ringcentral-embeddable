# RingCentral Embeddable - JSONSchemaPage

A powerful React component library that renders dynamic forms based on JSON Schema definitions. Built on top of [react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form) and beautifully styled with [RingCentral Juno](https://github.com/ringcentral/ringcentral-juno) components.

---

## 🚀 Quick Navigation

Find exactly what you need:

### **📖 New to JSONSchemaPage?**
➡️ **[Complete Documentation & Tutorial](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/docs/jsonschemapage-documentation--docs)**
- Installation guide, basic usage, and comprehensive examples
- Learn JSON Schema fundamentals and UI Schema customization

### **🔤 Need Form Inputs?**
➡️ **[Form Input Widgets](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-form-input-widgets--text-input-widget)**
- Text fields, numbers, dropdowns, checkboxes, file uploads
- All the input controls users type/select in

### **📄 Need Content Display?** 
➡️ **[Display Components](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-display-components--typography-fields)**
- Typography, alerts, links, static content
- Components that show information to users

### **🎯 Need User Actions?**
➡️ **[Interactive Components](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-interactive-components--button-fields)**  
- Buttons, selection lists, search fields
- Components users click and interact with

### **📋 Need Complete Examples?**
➡️ **[Complete Form Examples](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-complete-form-examples--contact-form)**
- Real-world forms, validation patterns, complex workflows
- Full implementation examples

---

## 📊 Quick Reference

| **I want to...** | **Go to** | **Example** |
|-------------------|-----------|-------------|
| Learn the basics | [Documentation](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/docs/jsonschemapage-documentation--docs) | Installation, basic usage |
| Add a text input | [Text Input Widget](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-form-input-widgets--text-input-widget) | `{ type: 'string', title: 'Name' }` |
| Add scheduling fields | [Scheduling Input Widgets](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-form-input-widgets--scheduling-input-widgets) | `{ type: 'string', format: 'duration' }` |
| Add a dropdown | [Select Widget](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-form-input-widgets--select-widget) | `{ enum: ['option1', 'option2'] }` |
| Add a button | [Button Fields](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-interactive-components--button-fields) | `{ 'ui:field': 'button' }` |
| Show an alert | [Alert Fields](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-display-components--alert-fields) | `{ 'ui:field': 'alert' }` |
| Build a contact form | [Contact Form](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-complete-form-examples--contact-form) | Complete working example |
| Handle file uploads | [File Upload](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/story/jsonschemapage-form-input-widgets--file-upload-widget) | `{ type: 'string', format: 'data-url' }` |

---

## ⚡ Quick Start

```tsx
import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-page';
import { useState } from 'react';

function MyForm() {
  const [formData, setFormData] = useState({});

  const schema = {
    title: 'Contact Form',
    type: 'object',
    properties: {
      name: { type: 'string', title: 'Full Name' },
      email: { type: 'string', format: 'email', title: 'Email' }
    },
    required: ['name', 'email']
  };

  return (
    <JSONSchemaPage
      schema={schema}
      formData={formData}
      onFormDataChange={setFormData}
      onSubmit={(data) => console.log('Submitted:', data.formData)}
    />
  );
}
```

---

## 💡 How to Use These Stories

1. **📋 Copy JSON Configuration** - Each story shows the exact `schema`, `uiSchema`, and `formData`
2. **👁️ Side-by-Side View** - See your JSON config alongside the rendered component 
3. **🎮 Interactive Examples** - Click, type, and interact to see real behavior
4. **📊 Live Updates** - Watch form data change in real-time as you interact

---

## 🛠️ Installation

```bash
npm install @ringcentral-integration/jsonschema-page
```

**Peer Dependencies:**
```bash
npm install @ringcentral/juno @ringcentral/juno-icon react styled-components
```

---

## ✨ Key Features

- **🎨 Beautiful UI** - Styled with RingCentral Juno design system
- **📱 Responsive** - Works on desktop and mobile
- **🔧 Highly Customizable** - Extensive UI Schema options
- **✅ Built-in Validation** - JSON Schema validation + custom rules
- **🎯 Interactive Elements** - Buttons, search, custom fields
- **📊 Dynamic Forms** - Conditional fields and arrays
- **♿ Accessible** - WCAG compliant components
- **⚡ Performance Optimized** - Handles large forms efficiently

---

## 🎯 Common Use Cases

- **Configuration Forms** - App settings and preferences
- **Data Entry** - Complex data collection
- **Survey Forms** - Dynamic questionnaires  
- **Admin Panels** - Management interfaces
- **User Profiles** - Registration and profiles
- **Multi-step Wizards** - Complex workflows

---

## 🔗 Useful Links

- **[Complete Documentation](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/docs/jsonschemapage-documentation--docs)** - Learn everything
- **[GitHub Repository](https://github.com/ringcentral/ringcentral-embeddable)** - Source code
- **[JSON Schema Spec](https://json-schema.org/)** - Official specification
- **[React JSON Schema Form](https://github.com/rjsf-team/react-jsonschema-form)** - Base library

---

**Ready to build amazing forms?** Start with the [Documentation](https://github.com/ringcentral/ringcentral-embeddable/jsonschema-page/?path=/docs/jsonschemapage-documentation--docs) or explore the examples above! 🚀
