import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RcThemeProvider } from '@ringcentral/juno';
import { JSONSchemaPage } from '../index';

const meta: Meta<typeof JSONSchemaPage> = {
  title: 'JSONSchemaPage/Complete Form Examples',
  component: JSONSchemaPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete form examples showing real-world use cases - Contact forms, Multi-step workflows, Validation patterns, and advanced form features',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    schema: {
      description: 'JSON Schema that defines the form structure',
      control: { type: 'object' },
    },
    uiSchema: {
      description: 'UI Schema that defines how the form should be rendered',
      control: { type: 'object' },
    },
    formData: {
      description: 'Current form data values',
      control: { type: 'object' },
    },
    hiddenSubmitButton: {
      description: 'Whether to hide the default submit button',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof JSONSchemaPage>;

// Simple Contact Form
export const ContactForm: Story = {
  args: {
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email'],
      properties: {
        firstName: {
          type: 'string',
          title: 'First Name',
          description: 'Enter your first name',
        },
        lastName: {
          type: 'string',
          title: 'Last Name',
          description: 'Enter your last name',
        },
        email: {
          type: 'string',
          format: 'email',
          title: 'Email Address',
          description: 'Enter a valid email address',
        },
        phone: {
          type: 'string',
          title: 'Phone Number',
          description: 'Enter your phone number (optional)',
        },
        age: {
          type: 'integer',
          title: 'Age',
          minimum: 0,
          maximum: 120,
        },
      },
    },
    uiSchema: {
      firstName: {
        'ui:placeholder': 'John',
      },
      lastName: {
        'ui:placeholder': 'Doe',
      },
      email: {
        'ui:placeholder': 'john.doe@example.com',
      },
      phone: {
        'ui:placeholder': '+1 (555) 123-4567',
      },
      age: {
        'ui:widget': 'range',
      },
    },
    formData: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
    hiddenSubmitButton: false,
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
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
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ccc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Current Form Data</h4>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
        
        {/* Right Panel - Rendered Form */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <RcThemeProvider>
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <JSONSchemaPage
                {...args}
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={(data) => {
                  console.log('Form submitted:', data.formData);
                  alert('Form submitted! Check console for data.');
                }}
              />
            </div>
          </RcThemeProvider>
        </div>
      </div>
    );
  },
};



// Conditional Fields Example
export const ConditionalFields: Story = {
  args: {
    schema: {
      type: 'object',
      required: ['name', 'userType'],
      properties: {
        name: {
          type: 'string',
          title: 'Full Name',
        },
        userType: {
          type: 'string',
          title: 'User Type',
          enum: ['individual', 'business'],
          enumNames: ['Individual', 'Business'],
        },
        email: {
          type: 'string',
          format: 'email',
          title: 'Email Address',
        },
      },
      dependencies: {
        userType: {
          oneOf: [
            {
              properties: {
                userType: {
                  enum: ['individual'],
                },
                dateOfBirth: {
                  type: 'string',
                  format: 'date',
                  title: 'Date of Birth',
                },
                personalId: {
                  type: 'string',
                  title: 'Personal ID',
                },
              },
              required: ['dateOfBirth'],
            },
            {
              properties: {
                userType: {
                  enum: ['business'],
                },
                companyName: {
                  type: 'string',
                  title: 'Company Name',
                },
                taxId: {
                  type: 'string',
                  title: 'Tax ID',
                },
                numberOfEmployees: {
                  type: 'integer',
                  title: 'Number of Employees',
                  minimum: 1,
                },
              },
              required: ['companyName', 'taxId'],
            },
          ],
        },
      },
    },
    formData: {
      userType: 'individual',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
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
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ccc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Current Form Data</h4>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
        
        {/* Right Panel - Rendered Form */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <RcThemeProvider>
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <JSONSchemaPage
                {...args}
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={(data) => {
                  console.log('Registration data:', data.formData);
                  alert('Registration submitted! Check console for data.');
                }}
              />
            </div>
          </RcThemeProvider>
        </div>
      </div>
    );
  },
};

// Array Fields Example
export const ArrayFields: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        projectName: {
          type: 'string',
          title: 'Project Name',
        },
        teamMembers: {
          type: 'array',
          title: 'Team Members',
          description: 'Add team members to the project',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                title: 'Name',
              },
              role: {
                type: 'string',
                title: 'Role',
                enum: ['developer', 'designer', 'manager', 'tester'],
                enumNames: ['Developer', 'Designer', 'Manager', 'Tester'],
              },
              email: {
                type: 'string',
                format: 'email',
                title: 'Email',
              },
              isLead: {
                type: 'boolean',
                title: 'Team Lead',
                default: false,
              },
            },
            required: ['name', 'role', 'email'],
          },
        },
        tags: {
          type: 'array',
          title: 'Project Tags',
          description: 'Add relevant tags for the project',
          items: {
            type: 'string',
          },
          uniqueItems: true,
        },
      },
      required: ['projectName'],
    },
    formData: {
      projectName: 'Awesome Project',
      teamMembers: [
        {
          name: 'John Doe',
          role: 'developer',
          email: 'john@example.com',
          isLead: true,
        },
      ],
      tags: ['react', 'typescript'],
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
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
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ccc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Current Form Data</h4>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
        
        {/* Right Panel - Rendered Form */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <RcThemeProvider>
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <JSONSchemaPage
                {...args}
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={(data) => {
                  console.log('Team data:', data.formData);
                  alert('Team data submitted! Check console for data.');
                }}
              />
            </div>
          </RcThemeProvider>
        </div>
      </div>
    );
  },
};

// Custom Validation Example
export const CustomValidation: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          title: 'Username',
          minLength: 3,
          maxLength: 20,
          pattern: '^[a-zA-Z0-9_]+$',
          description: 'Username must be 3-20 characters, alphanumeric and underscores only',
        },
        password: {
          type: 'string',
          title: 'Password',
          minLength: 8,
          description: 'Password must be at least 8 characters long',
        },
        confirmPassword: {
          type: 'string',
          title: 'Confirm Password',
          description: 'Re-enter your password',
        },
        agreeToTerms: {
          type: 'boolean',
          title: 'I agree to the terms and conditions',
          const: true,
        },
      },
      required: ['username', 'password', 'confirmPassword', 'agreeToTerms'],
    },
    uiSchema: {
      password: {
        'ui:widget': 'password',
      },
      confirmPassword: {
        'ui:widget': 'password',
      },
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
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
          <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #ccc' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Current Form Data</h4>
            <pre style={{ fontSize: '11px', overflow: 'auto', maxHeight: '200px', margin: 0, background: 'white', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
        
        {/* Right Panel - Rendered Form */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <RcThemeProvider>
            <div style={{ padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <JSONSchemaPage
                {...args}
                formData={formData}
                onFormDataChange={setFormData}
                onSubmit={(data) => {
                  // Custom validation for password confirmation
                  if (data.formData.password !== data.formData.confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                  }
                  console.log('Account created:', data.formData);
                  alert('Account created successfully!');
                }}
              />
            </div>
          </RcThemeProvider>
        </div>
      </div>
    );
  },
};