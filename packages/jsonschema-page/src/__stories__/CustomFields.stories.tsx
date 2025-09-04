import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RcThemeProvider } from '@ringcentral/juno';
import { JSONSchemaPage } from '../index';

// Shared layout component for consistent side-by-side display
const StoryLayout = ({ args, children, resultComponent }) => (
  <div style={{ display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto' }}>
    {/* Left Panel - JSON Configuration */}
    <div style={{ flex: '0 0 45%', minWidth: '300px' }}>
      <div style={{ padding: '15px', background: '#f0f8ff', borderRadius: '8px', border: '1px solid #0066cc', marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>📋 JSON Configuration</h4>
        <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '400px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
          {JSON.stringify({
            schema: args.schema,
            uiSchema: args.uiSchema,
            formData: args.formData,
          }, null, 2)}
        </pre>
      </div>
      {resultComponent && (
        <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ccc' }}>
          {resultComponent}
        </div>
      )}
    </div>
    
    {/* Right Panel - Rendered Form */}
    <div style={{ flex: '1', minWidth: '300px' }}>
      <RcThemeProvider>
        <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {children}
        </div>
      </RcThemeProvider>
    </div>
  </div>
);

const meta: Meta<typeof JSONSchemaPage> = {
  title: 'JSONSchemaPage/Display Components',
  component: JSONSchemaPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Components for displaying content and information - Typography, Alerts, Links, and other non-input elements',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    schema: {
      description: 'JSON Schema that defines the form structure - Edit to see live updates!',
      control: { type: 'object' },
      table: {
        type: { summary: 'object' },
        defaultValue: { summary: '{}' },
      },
    },
    uiSchema: {
      description: 'UI Schema that defines how the form should be rendered - Customize appearance and behavior',
      control: { type: 'object' },
      table: {
        type: { summary: 'object' },
        defaultValue: { summary: '{}' },
      },
    },
    formData: {
      description: 'Current form data values - Set initial form values',
      control: { type: 'object' },
      table: {
        type: { summary: 'object' },
        defaultValue: { summary: '{}' },
      },
    },
    onFormDataChange: {
      action: 'formDataChanged',
      description: 'Called when form data changes',
      table: {
        type: { summary: 'function' },
      },
    },
    onSubmit: {
      action: 'formSubmitted',
      description: 'Called when form is submitted',
      table: {
        type: { summary: 'function' },
      },
    },
    onButtonClick: {
      action: 'buttonClicked',
      description: 'Called when custom buttons are clicked',
      table: {
        type: { summary: 'function' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof JSONSchemaPage>;

// Typography Fields
export const TypographyFields: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        heading: {
          type: 'string',
          title: 'Main Heading',
          description: 'This is a main heading using h4 variant',
        },
        subheading: {
          type: 'string',
          title: 'Subheading',
          description: 'This is a subheading using h6 variant',
        },
        body1Text: {
          type: 'string',
          title: 'Body Text',
          description: 'This is regular body text using the default body1 variant. It provides good readability for longer content. This is a [link](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page).',
        },
        body2Text: {
          type: 'string',
          title: 'Small Body Text',
          description: 'This is smaller body text using body2 variant. Perfect for secondary information.',
        },
        caption: {
          type: 'string',
          title: 'Caption',
          description: 'This is caption text, typically used for image captions or footnotes.',
        },
        bulletItem1: {
          type: 'string',
          title: 'Bullet Item 1',
          description: 'First bulleted list item',
        },
        bulletItem2: {
          type: 'string',
          title: 'Bullet Item 2',
          description: 'Second bulleted list item',
        },
        bulletItem3: {
          type: 'string',
          title: 'Bullet Item 3',
          description: 'Third bulleted list item. This is a [link](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page).',
        },
      },
    },
    uiSchema: {
      heading: {
        'ui:field': 'typography',
        'ui:variant': 'h4',
      },
      subheading: {
        'ui:field': 'typography',
        'ui:variant': 'h6',
      },
      body1Text: {
        'ui:field': 'typography',
        'ui:variant': 'body1',
      },
      body2Text: {
        'ui:field': 'typography',
        'ui:variant': 'body2',
      },
      caption: {
        'ui:field': 'typography',
        'ui:variant': 'caption1',
      },
      bulletItem1: {
        'ui:field': 'typography',
        'ui:bulletedList': true,
      },
      bulletItem2: {
        'ui:field': 'typography',
        'ui:bulletedList': true,
      },
      bulletItem3: {
        'ui:field': 'typography',
        'ui:bulletedList': true,
      },
    },
    formData: {},
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📝 Typography Variants</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Heading: h4 variant</p>
              <p>Subheading: h6 variant</p>
              <p>Body1: Default body text</p>
              <p>Body2: Smaller body text</p>
              <p>Caption: caption1 variant</p>
              <p>Bullets: List items with bullets</p>
            </div>
            <h4 style={{ margin: '15px 0 10px 0', color: '#555' }}>📝 Form Data</h4>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </>
        }
      >
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Typography Examples</h4>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <JSONSchemaPage
                {...args}
                formData={formData}
                onFormDataChange={setFormData}
              />
            </ul>
          </div>
        </div>
      </StoryLayout>
    );
  },
};

// Alert Fields
export const AlertFields: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        infoAlert: {
          type: 'string',
          title: 'Information Alert',
          description: 'This is an informational alert. It provides helpful information to users.',
        },
        successAlert: {
          type: 'string',
          title: 'Success Alert',
          description: 'This is a success alert. It indicates that an operation completed successfully.',
        },
        warningAlert: {
          type: 'string',
          title: 'Warning Alert',
          description: 'This is a warning alert. It warns users about potential issues or important information.',
        },
        errorAlert: {
          type: 'string',
          title: 'Error Alert',
          description: 'This is an error alert. It indicates that something went wrong and requires attention.',
        },
        alertWithLink: {
          type: 'string',
          title: 'Alert with Link',
          description: 'This is an alert with a link and bold text. It provides **helpful information** to users. [Learn more](https://ringcentral.github.io/ringcentral-embeddable/jsonschema-page).',
        },
      },
    },
    uiSchema: {
      infoAlert: {
        'ui:field': 'admonition',
        'ui:severity': 'info',
      },
      successAlert: {
        'ui:field': 'admonition',
        'ui:severity': 'success',
      },
      warningAlert: {
        'ui:field': 'admonition',
        'ui:severity': 'warning',
      },
      errorAlert: {
        'ui:field': 'admonition',
        'ui:severity': 'error',
      },
      alertWithLink: {
        'ui:field': 'admonition',
        'ui:severity': 'warning',
      },
    },
    formData: {},
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>🚨 Alert Types</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Info: Blue alert for general information</p>
              <p>Success: Green alert for successful operations</p>
              <p>Warning: Orange alert for warnings</p>
              <p>Error: Red alert for errors</p>
            </div>
            <h4 style={{ margin: '15px 0 10px 0', color: '#555' }}>📝 Form Data</h4>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </>
        }
      >
        <JSONSchemaPage
          {...args}
          formData={formData}
          onFormDataChange={setFormData}
        />
      </StoryLayout>
    );
  },
};

// Link Fields
export const LinkFields: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        externalLink: {
          type: 'string',
          title: 'External Link',
          description: 'Visit RingCentral Embeddable Documentation',
        },
        coloredLink: {
          type: 'string',
          title: 'Colored Link',
          description: 'Link with custom color styling',
        },
        underlinedLink: {
          type: 'string',
          title: 'Underlined Link',
          description: 'Link with underline styling',
        },
        buttonLink: {
          type: 'string',
          title: 'Button Link',
          description: 'Link that acts like a button (no href)',
        },
        listLinkItem1: {
          type: 'string',
          title: 'List Link Item 1',
          description: 'GitHub Repository',
        },
        listLinkItem2: {
          type: 'string',
          title: 'List Link Item 2',
          description: 'API Documentation',
        },
        listLinkItem3: {
          type: 'string',
          title: 'List Link Item 3',
          description: 'Developer Guide',
        },
      },
    },
    uiSchema: {
      externalLink: {
        'ui:field': 'link',
        'ui:variant': 'body1',
        'ui:href': 'https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/',
      },
      coloredLink: {
        'ui:field': 'link',
        'ui:variant': 'body1',
        'ui:color': 'avatar.brass',
        'ui:href': 'https://developers.ringcentral.com/',
      },
      underlinedLink: {
        'ui:field': 'link',
        'ui:variant': 'body1',
        'ui:underline': 'always',
        'ui:href': 'https://github.com/ringcentral/ringcentral-embeddable',
      },
      buttonLink: {
        'ui:field': 'link',
        'ui:variant': 'body1',
        'ui:color': 'action.primary',
        'ui:underline': false,
      },
      listLinkItem1: {
        'ui:field': 'link',
        'ui:bulletedList': true,
        'ui:href': 'https://github.com/ringcentral/ringcentral-embeddable',
      },
      listLinkItem2: {
        'ui:field': 'link',
        'ui:bulletedList': true,
        'ui:href': 'https://developers.ringcentral.com/api-reference',
      },
      listLinkItem3: {
        'ui:field': 'link',
        'ui:bulletedList': true,
        'ui:href': 'https://developers.ringcentral.com/guide/embeddable',
      },
    },
    formData: {},
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const [linkClicks, setLinkClicks] = useState<{
      buttonLink?: number;
    }>({});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>🔗 Link Interactions</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>External links: Open in new tab</p>
              <p>Button link clicks: {linkClicks.buttonLink || 0}</p>
              <p>List links: Organized as bulleted list</p>
            </div>
            <h4 style={{ margin: '15px 0 10px 0', color: '#555' }}>📝 Form Data</h4>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </>
        }
      >
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Link Examples</h4>
          <div style={{ marginBottom: '20px' }}>
            <JSONSchemaPage
              {...args}
              formData={formData}
              onFormDataChange={setFormData}
              onButtonClick={(buttonId: string) => {
                if (buttonId === 'buttonLink') {
                  setLinkClicks(prev => ({
                    ...prev,
                    [buttonId]: (prev[buttonId as keyof typeof prev] || 0) + 1,
                  }));
                }
              }}
            />
          </div>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#666' }}>Bulleted Link List:</h5>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li style={{ marginBottom: '8px' }}>
                <JSONSchemaPage
                  schema={{ type: 'object', properties: { listLinkItem1: (args.schema.properties as any).listLinkItem1 } }}
                  uiSchema={{ listLinkItem1: (args.uiSchema as any).listLinkItem1 }}
                  formData={{}}
                  onFormDataChange={() => {}}
                  onButtonClick={() => {}}
                  onSubmit={() => {}}
                />
              </li>
              <li style={{ marginBottom: '8px' }}>
                <JSONSchemaPage
                  schema={{ type: 'object', properties: { listLinkItem2: (args.schema.properties as any).listLinkItem2 } }}
                  uiSchema={{ listLinkItem2: (args.uiSchema as any).listLinkItem2 }}
                  formData={{}}
                  onFormDataChange={() => {}}
                  onButtonClick={() => {}}
                  onSubmit={() => {}}
                />
              </li>
              <li style={{ marginBottom: '8px' }}>
                <JSONSchemaPage
                  schema={{ type: 'object', properties: { listLinkItem3: (args.schema.properties as any).listLinkItem3 } }}
                  uiSchema={{ listLinkItem3: (args.uiSchema as any).listLinkItem3 }}
                  formData={{}}
                  onFormDataChange={() => {}}
                  onButtonClick={() => {}}
                  onSubmit={() => {}}
                />
              </li>
            </ul>
          </div>
        </div>
      </StoryLayout>
    );
  },
};