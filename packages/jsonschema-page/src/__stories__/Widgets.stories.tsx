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

const DURATION_REGEX = /^P(?=\d|T\d)(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?)?$/i;

const getDurationMinutes = (value?: string) => {
  if (!value) {
    return null;
  }

  const match = value.match(DURATION_REGEX);
  if (!match) {
    return null;
  }

  const [, days = '0', hours = '0', minutes = '0'] = match;
  return Number.parseInt(days, 10) * 24 * 60
    + Number.parseInt(hours, 10) * 60
    + Number.parseInt(minutes, 10);
};

const formatDurationSummary = (value?: string) => {
  const totalMinutes = getDurationMinutes(value);
  if (totalMinutes === null) {
    return 'Invalid duration';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
};

const meta: Meta<typeof JSONSchemaPage> = {
  title: 'JSONSchemaPage/Form Input Widgets',
  component: JSONSchemaPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Form input widgets for collecting user data - Text inputs, Numbers, Selections, Toggles, File uploads, and other interactive form controls',
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

// Text Input Widget
export const TextInputWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        basicText: {
          type: 'string',
          title: 'Basic Text Input',
          description: 'Standard text input field',
        },
        emailInput: {
          type: 'string',
          format: 'email',
          title: 'Email Input',
          description: 'Email format validation',
        },
        urlInput: {
          type: 'string',
          format: 'uri',
          title: 'URL Input',
          description: 'URL format validation',
        },
        passwordInput: {
          type: 'string',
          title: 'Password Input',
          description: 'Hidden text input',
        },
        patternText: {
          type: 'string',
          title: 'Pattern Validation',
          pattern: '^[A-Za-z]+$',
          description: 'Only letters allowed',
        },
        minMaxText: {
          type: 'string',
          title: 'Length Validation',
          minLength: 3,
          maxLength: 10,
          description: 'Between 3-10 characters',
        },
      },
    },
    uiSchema: {
      basicText: {
        'ui:placeholder': 'Enter any text...',
      },
      emailInput: {
        'ui:placeholder': 'user@example.com',
      },
      urlInput: {
        'ui:placeholder': 'https://example.com',
      },
      passwordInput: {
        'ui:widget': 'password',
        'ui:placeholder': 'Enter password',
      },
      patternText: {
        'ui:placeholder': 'LettersOnly',
        'ui:help': 'Only alphabetic characters are allowed',
      },
      minMaxText: {
        'ui:placeholder': 'Min 3, Max 10 chars',
      },
    },
    formData: {
      basicText: 'Sample text',
      emailInput: 'user@example.com',
      urlInput: 'https://ringcentral.com',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Input Statistics</h4>
            <div style={{ fontSize: '12px' }}>
              <p>Basic Text: {formData.basicText?.length || 0} characters</p>
              <p>Email Valid: {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailInput) ? '✅' : '❌'}</p>
              <p>URL Valid: {/^https?:\/\/.+/.test(formData.urlInput) ? '✅' : '❌'}</p>
              <p>Pattern Valid: {/^[A-Za-z]+$/.test(formData.patternText) ? '✅' : '❌'}</p>
              <p>Length Valid: {formData.minMaxText?.length >= 3 && formData.minMaxText?.length <= 10 ? '✅' : '❌'}</p>
            </div>
          </>
        }
      >
        <JSONSchemaPage
          {...args}
          formData={formData}
          onFormDataChange={(data) => {
            setFormData(data);
            args.onFormDataChange?.(data);
          }}
          onSubmit={(data) => {
            console.log('Text inputs submitted:', data.formData);
            args.onSubmit?.(data);
            alert('Form submitted! Check console and Actions panel.');
          }}
          onButtonClick={(name, value) => {
            console.log('Button clicked:', name, value);
            args.onButtonClick?.(name, value);
          }}
        />
      </StoryLayout>
    );
  },
};

export const SchedulingInputWidgets: Story = {
  args: {
    schema: {
      type: 'object',
      required: ['meetingDate', 'meetingTime', 'meetingStart', 'meetingDuration'],
      properties: {
        meetingDate: {
          type: 'string',
          format: 'date',
          title: 'Meeting Date',
          description: 'Calendar date for the invitation',
        },
        meetingTime: {
          type: 'string',
          format: 'time',
          title: 'Meeting Time',
          description: 'Start time for the invitation',
        },
        meetingStart: {
          type: 'string',
          format: 'date-time',
          title: 'Meeting Start DateTime',
          description: 'Combined start date and time in UTC format',
        },
        meetingDuration: {
          type: 'string',
          format: 'duration',
          title: 'Meeting Duration',
          description: 'Meeting length stored as an ISO 8601 duration string',
        },
      },
    },
    uiSchema: {
      meetingTime: {
        'ui:help': 'Stored as HH:MM:SS in form data',
      },
      meetingStart: {
        'ui:help': 'Date-time values are stored in UTC',
      },
      meetingDuration: {
        'ui:help': 'The duration widget stores values like PT45M or PT1H30M',
        'ui:options': {
          minuteStep: 15,
        },
      },
    },
    formData: {
      meetingDate: '2026-04-15',
      meetingTime: '09:30:00',
      meetingStart: '2026-04-15T09:30:00.000Z',
      meetingDuration: 'PT45M',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const durationMinutes = getDurationMinutes(formData.meetingDuration);
    const meetingEnd = formData.meetingStart && durationMinutes !== null
      ? new Date(new Date(formData.meetingStart).getTime() + durationMinutes * 60 * 1000)
      : null;

    return (
      <StoryLayout
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📅 Meeting Invitation Preview</h4>
            <div style={{ fontSize: '12px' }}>
              <p>Date Value: {formData.meetingDate || 'Not set'}</p>
              <p>Time Value: {formData.meetingTime || 'Not set'}</p>
              <p>DateTime Value: {formData.meetingStart || 'Not set'}</p>
              <p>Duration Value: {formData.meetingDuration || 'Not set'}</p>
              <p>Duration Summary: {formData.meetingDuration ? formatDurationSummary(formData.meetingDuration) : 'Not set'}</p>
              <p>Estimated End: {meetingEnd ? meetingEnd.toLocaleString() : 'Not enough information yet'}</p>
            </div>
          </>
        }
      >
        <JSONSchemaPage
          {...args}
          formData={formData}
          onFormDataChange={(data) => {
            setFormData(data);
            args.onFormDataChange?.(data);
          }}
          onSubmit={(data) => {
            console.log('Scheduling inputs submitted:', data.formData);
            args.onSubmit?.(data);
            alert('Form submitted! Check console and Actions panel.');
          }}
          onButtonClick={(name, value) => {
            console.log('Button clicked:', name, value);
            args.onButtonClick?.(name, value);
          }}
        />
      </StoryLayout>
    );
  },
};

// Number Input Widget
export const NumberInputWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        basicNumber: {
          type: 'number',
          title: 'Basic Number',
          description: 'Any numeric value',
        },
        integerOnly: {
          type: 'integer',
          title: 'Integer Only',
          description: 'Whole numbers only',
        },
        minMaxNumber: {
          type: 'number',
          title: 'Range Constrained',
          minimum: 0,
          maximum: 100,
          description: 'Between 0 and 100',
        },
        stepNumber: {
          type: 'number',
          title: 'Step Increment',
          multipleOf: 0.5,
          description: 'Increments of 0.5',
        },
        currencyAmount: {
          type: 'number',
          title: 'Currency Amount',
          minimum: 0,
          multipleOf: 0.01,
          description: 'Dollar amount (cents precision)',
        },
        percentage: {
          type: 'number',
          title: 'Percentage',
          minimum: 0,
          maximum: 100,
          multipleOf: 0.01,
          description: 'Percentage value',
        },
      },
    },
    uiSchema: {
      basicNumber: {
        'ui:placeholder': '123.45',
      },
      integerOnly: {
        'ui:placeholder': '42',
      },
      minMaxNumber: {
        'ui:placeholder': '50',
      },
      stepNumber: {
        'ui:placeholder': '1.5',
        'ui:options': {
          step: 0.5,
        },
      },
      currencyAmount: {
        'ui:placeholder': '19.99',
        'ui:options': {
          step: 0.01,
        },
      },
      percentage: {
        'ui:placeholder': '75.25',
        'ui:options': {
          step: 0.01,
        },
      },
    },
    formData: {
      basicNumber: 123.45,
      integerOnly: 42,
      minMaxNumber: 50,
      stepNumber: 2.5,
      currencyAmount: 19.99,
      percentage: 75.25,
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Number Analysis</h4>
            <div style={{ fontSize: '12px' }}>
              <p>Basic: {formData.basicNumber}</p>
              <p>Integer: {formData.integerOnly} {Number.isInteger(formData.integerOnly) ? '✅' : '❌'}</p>
              <p>Range Valid: {formData.minMaxNumber >= 0 && formData.minMaxNumber <= 100 ? '✅' : '❌'}</p>
              <p>Step Valid: {formData.stepNumber % 0.5 === 0 ? '✅' : '❌'}</p>
              <p>Currency: ${formData.currencyAmount?.toFixed(2)}</p>
              <p>Percentage: {formData.percentage}%</p>
            </div>
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

// Boolean Toggle Widget
export const BooleanToggleWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        basicToggle: {
          type: 'boolean',
          title: 'Basic Toggle',
          description: 'Simple on/off switch',
        },
        defaultTrue: {
          type: 'boolean',
          title: 'Default Enabled',
          default: true,
          description: 'Defaults to enabled state',
        },
        requiredToggle: {
          type: 'boolean',
          title: 'Required Agreement',
          description: 'Must be checked to proceed',
        },
        consentToggle: {
          type: 'boolean',
          title: 'Marketing Consent',
          description: 'Receive marketing communications',
        },
        privacyToggle: {
          type: 'boolean',
          title: 'Privacy Settings',
          description: 'Enable privacy mode',
        },
        notificationToggle: {
          type: 'boolean',
          title: 'Push Notifications',
          description: 'Allow push notifications',
        },
      },
      required: ['requiredToggle'],
    },
    uiSchema: {
      requiredToggle: {
        'ui:help': 'This field is required',
      },
    },
    formData: {
      basicToggle: false,
      defaultTrue: true,
      requiredToggle: true,
      consentToggle: false,
      privacyToggle: true,
      notificationToggle: false,
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    const enabledCount = Object.values(formData).filter(Boolean).length;
    const totalCount = Object.keys(formData).length;
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Toggle States</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Enabled: {enabledCount}/{totalCount}</p>
              <p>Progress: {Math.round((enabledCount / totalCount) * 100)}%</p>
            </div>
            <div style={{ fontSize: '12px' }}>
              {Object.entries(formData).map(([key, value]) => (
                <p key={key}>
                  {key}: {value ? '✅ ON' : '❌ OFF'}
                </p>
              ))}
            </div>
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

// File Upload Widget
export const FileUploadWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        singleFile: {
          type: 'string',
          title: 'Single File Upload',
          format: 'data-url',
          description: 'Select a single file to upload',
        },
        profileImage: {
          type: 'string',
          title: 'Profile Image',
          format: 'data-url',
          description: 'Upload your profile picture (JPG, PNG only)',
        },
        resume: {
          type: 'string',
          title: 'Resume (Max 5MB)',
          format: 'data-url',
          description: 'Upload your resume (PDF, DOC files)',
        },
        documents: {
          type: 'array',
          title: 'Multiple Documents',
          items: {
            type: 'string',
            format: 'data-url',
          },
          description: 'Upload multiple files at once',
        },
      },
    },
    uiSchema: {
      singleFile: {
        'ui:widget': 'file',
        'ui:accept': '*/*',
        'ui:placeholder': 'Choose any file...',
      },
      profileImage: {
        'ui:widget': 'file',
        'ui:accept': 'image/*',
        'ui:placeholder': 'Choose an image...',
      },
      resume: {
        'ui:widget': 'file',
        'ui:accept': '.pdf,.doc,.docx',
        'ui:maxSize': 5242880, // 5MB in bytes
        'ui:placeholder': 'Choose a document...',
      },
      documents: {
        items: {
          'ui:widget': 'file',
          'ui:multiple': true,
          'ui:accept': '*/*',
          'ui:placeholder': 'Choose multiple files...',
        } 
      },
    },
    formData: {
      singleFile: null,
      profileImage: null,
      resume: null,
      documents: null,
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const [uploadStats, setUploadStats] = useState({
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {} as Record<string, number>,
    });

    // Calculate upload statistics
    React.useEffect(() => {
      const allFiles = [];
      
      // Add single files
      if (formData.singleFile && typeof formData.singleFile === 'object') {
        allFiles.push(formData.singleFile);
      }
      if (formData.profileImage && typeof formData.profileImage === 'object') {
        allFiles.push(formData.profileImage);
      }
      if (formData.resume && typeof formData.resume === 'object') {
        allFiles.push(formData.resume);
      }
      
      // Add multiple files
      if (Array.isArray(formData.documents)) {
        allFiles.push(...formData.documents);
      }

      const stats = allFiles.reduce(
        (acc, file) => {
          if (file && file.name && file.size) {
            acc.totalFiles += 1;
            acc.totalSize += file.size;
            const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
            acc.fileTypes[ext] = (acc.fileTypes[ext] || 0) + 1;
          }
          return acc;
        },
        { totalFiles: 0, totalSize: 0, fileTypes: {} as Record<string, number> }
      );

      setUploadStats(stats);
    }, [formData]);

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Upload Statistics</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Total Files: {uploadStats.totalFiles}</p>
              <p>Total Size: {formatFileSize(uploadStats.totalSize)}</p>
              <p>File Types:</p>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {Object.entries(uploadStats.fileTypes).length > 0 ? 
                  Object.entries(uploadStats.fileTypes).map(([type, count]) => (
                    <li key={type}>{type}: {count} file{count > 1 ? 's' : ''}</li>
                  )) : 
                  <li>No files uploaded yet</li>
                }
              </ul>
            </div>
            <h4 style={{ margin: '15px 0 10px 0', color: '#555' }}>💡 Widget Features</h4>
            <div style={{ fontSize: '11px', marginBottom: '15px', color: '#666' }}>
              <p>• Single file: Returns FileInfoType object with dataURL, name, size, type</p>
              <p>• Multiple files: Returns array of FileInfoType objects</p>
              <p>• File size validation: resume field has 5MB maxSize limit</p>
              <p>• Accept filter: profileImage accepts only images</p>
              <p>• Files are converted to base64 dataURL format</p>
              <p>• Drag & drop supported, click attachment icon to browse</p>
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

// Range Widget
export const RangeWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        basicRange: {
          type: 'integer',
          title: 'Basic Range',
          minimum: 0,
          maximum: 100,
          description: 'A simple range slider',
        },
        temperatureRange: {
          type: 'integer',
          title: 'Temperature',
          minimum: -20,
          maximum: 50,
          description: 'Temperature in Celsius',
        },
        priceRange: {
          type: 'number',
          title: 'Price Range',
          minimum: 0,
          maximum: 1000,
          multipleOf: 0.01,
          description: 'Select price range',
        },
        percentageRange: {
          type: 'integer',
          title: 'Percentage',
          minimum: 0,
          maximum: 100,
          description: 'Percentage value',
        },
      },
    },
    uiSchema: {
      basicRange: {
        'ui:widget': 'range',
      },
      temperatureRange: {
        'ui:widget': 'range',
        'ui:options': {
          step: 1,
        },
      },
      priceRange: {
        'ui:widget': 'range',
        'ui:options': {
          step: 10,
        },
      },
      percentageRange: {
        'ui:widget': 'range',
        'ui:options': {
          step: 5,
        },
      },
    },
    formData: {
      basicRange: 50,
      temperatureRange: 20,
      priceRange: 500,
      percentageRange: 75,
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Current Values</h4>
            <ul style={{ fontSize: '12px', margin: 0, paddingLeft: '20px' }}>
              <li>Basic Range: {formData.basicRange}</li>
              <li>Temperature: {formData.temperatureRange}°C</li>
              <li>Price: ${formData.priceRange}</li>
              <li>Percentage: {formData.percentageRange}%</li>
            </ul>
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

// Radio Widget
export const RadioWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        favoriteColor: {
          type: 'string',
          title: 'Favorite Color',
          oneOf: [{
            "const": "neutral",
            "title": "Neutral",
            "color": "#939393"
          }, {
            "const": "yellow",
            "title": "Yellow",
            "color": "#B17D1A"
          }, {
            "const": "purple",
            "title": "Purple",
            "color": "#8A77E3"
          }],
          description: 'Choose your favorite color',
        },
        priority: {
          type: 'string',
          title: 'Priority Level',
          enum: ['low', 'medium', 'high', 'urgent'],
          enumNames: ['Low Priority', 'Medium Priority', 'High Priority', 'Urgent'],
        },
        tab: {
          type: 'string',
          title: 'Tab',
          enum: ['tab1', 'tab2', 'tab3'],
          enumNames: ['Tab 1', 'Tab 2', 'Tab 3'],
        },
        size: {
          type: 'string',
          title: 'T-Shirt Size',
          enum: ['xs', 's', 'm', 'l', 'xl', 'xxl'],
          enumNames: ['Extra Small', 'Small', 'Medium', 'Large', 'Extra Large', 'XXL'],
          description: 'Select your size',
        },
      },
    },
    uiSchema: {
      "favoriteColor": {
        "ui:widget": "radio",
        "ui:inline": true
      },
      "priority": {
        "ui:widget": "radio",
        "ui:inline": true
      },
      "tab": {
        "ui:widget": "radio",
        "ui:inline": true,
        "ui:tab": true,
      },
      "size": {
        "ui:widget": "radio"
      },
    },
    formData: {
      favoriteColor: 'blue',
      priority: 'medium',
      tab: 'tab1',
      size: 'm',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Selected Values</h4>
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

// Select Widget
export const SelectWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        country: {
          type: 'string',
          title: 'Country',
          enum: ['us', 'ca', 'uk', 'de', 'fr', 'jp', 'au'],
          enumNames: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'Australia'],
          description: 'Select your country',
        },
        language: {
          type: 'string',
          title: 'Programming Language',
          enum: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'],
          enumNames: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust'],
        },
        multipleLanguages: {
          type: 'array',
          title: 'Multiple Languages',
          items: {
            type: 'string',
            enum: ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust'],
            enumNames: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust'],
          },
          uniqueItems: true,
          description: 'Select multiple programming languages',
        },
      },
    },
    uiSchema: {
      country: {
        'ui:placeholder': 'Choose a country...',
      },
      language: {
        'ui:placeholder': 'Select a language...',
      },
      multipleLanguages: {
        'ui:widget': 'select',
        'ui:placeholder': 'Select languages...',
      },
    },
    formData: {
      country: 'us',
      language: 'typescript',
      multipleLanguages: ['javascript', 'typescript'],
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Selected Values</h4>
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

// Checkbox Widget
export const CheckboxWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        agreeToTerms: {
          type: 'boolean',
          title: 'I agree to the terms and conditions',
          description: 'You must agree to continue',
        },
        enableNotifications: {
          type: 'boolean',
          title: 'Enable push notifications',
          default: true,
        },
        subscribeNewsletter: {
          type: 'boolean',
          title: 'Subscribe to newsletter',
          description: 'Receive weekly updates via email',
        },
        features: {
          type: 'array',
          title: 'Enabled Features',
          items: {
            type: 'string',
            enum: ['feature1', 'feature2', 'feature3', 'feature4'],
          },
          uniqueItems: true,
          description: 'Select which features to enable',
        },
        preferences: {
          type: 'object',
          title: 'User Preferences',
          properties: {
            darkMode: {
              type: 'boolean',
              title: 'Dark Mode',
              default: false,
            },
            autoSave: {
              type: 'boolean',
              title: 'Auto Save',
              default: true,
            },
            showTips: {
              type: 'boolean',
              title: 'Show Tips',
              default: true,
            },
          },
        },
      },
    },
    uiSchema: {
      features: {
        'ui:widget': 'checkboxes',
        'ui:options': {
          enumOptions: [
            { value: 'feature1', label: 'Advanced Analytics' },
            { value: 'feature2', label: 'Real-time Sync' },
            { value: 'feature3', label: 'Custom Themes' },
            { value: 'feature4', label: 'API Access' },
          ],
        },
      },
    },
    formData: {
      enableNotifications: true,
      features: ['feature1', 'feature2'],
      preferences: {
        darkMode: false,
        autoSave: true,
        showTips: true,
      },
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Checkbox States</h4>
            <div style={{ fontSize: '12px' }}>
              <p>Terms Agreed: {formData.agreeToTerms ? '✅' : '❌'}</p>
              <p>Notifications: {formData.enableNotifications ? '✅' : '❌'}</p>
              <p>Newsletter: {formData.subscribeNewsletter ? '✅' : '❌'}</p>
              <p>Features: {formData.features?.length || 0} selected</p>
              <p>Dark Mode: {formData.preferences?.darkMode ? '✅' : '❌'}</p>
            </div>
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

// Textarea Widget
export const TextareaWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          title: 'Product Description',
          description: 'Enter a detailed description of the product',
        },
        feedback: {
          type: 'string',
          title: 'Feedback',
          description: 'Share your thoughts and suggestions',
        },
        code: {
          type: 'string',
          title: 'Code Snippet',
          description: 'Paste your code here',
        },
        notes: {
          type: 'string',
          title: 'Additional Notes',
          description: 'Any additional information',
        },
      },
    },
    uiSchema: {
      description: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 4,
          placeholder: 'Enter product description...',
        },
      },
      feedback: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 3,
          placeholder: 'We value your feedback...',
        },
      },
      code: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 6,
          placeholder: 'function example() {\n  // Your code here\n}',
        },
      },
      notes: {
        'ui:widget': 'textarea',
        'ui:options': {
          rows: 2,
          placeholder: 'Optional notes...',
        },
      },
    },
    formData: {
      description: 'This is a high-quality product designed for professionals.',
      code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Text Statistics</h4>
            <div style={{ fontSize: '12px' }}>
              <p>Description: {formData.description?.length || 0} characters</p>
              <p>Feedback: {formData.feedback?.length || 0} characters</p>
              <p>Code: {formData.code?.length || 0} characters</p>
              <p>Notes: {formData.notes?.length || 0} characters</p>
            </div>
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

// Autocomplete Widget (Downshift)
export const AutocompleteWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          title: 'City',
          description: 'Type to search and select a city',
          enum: [
            'New York',
            'Los Angeles',
            'Chicago',
            'Houston',
            'Phoenix',
            'Philadelphia',
            'San Antonio',
            'San Diego',
            'Dallas',
            'San Jose',
          ],
          enumNames: [
            'New York',
            'Los Angeles',
            'Chicago',
            'Houston',
            'Phoenix',
            'Philadelphia',
            'San Antonio',
            'San Diego',
            'Dallas',
            'San Jose',
          ],
        },
        language: {
          type: 'string',
          title: 'Programming Language',
          description: 'Autocomplete with popular languages',
          enum: [
            'JavaScript',
            'TypeScript',
            'Python',
            'Java',
            'C#',
            'Go',
            'Rust',
            'Ruby',
            'PHP',
            'Kotlin',
          ],
        },
        multipleLanguages: {
          type: 'array',
          title: 'Multiple Languages',
          items: {
            type: 'string',
          },
        },
      },
    },
    uiSchema: {
      city: {
        'ui:widget': 'AutocompleteWidget',
        'ui:placeholder': 'Start typing a city...'
      },
      language: {
        'ui:widget': 'AutocompleteWidget',
        'ui:placeholder': 'Type a language...'
      },
      multipleLanguages: {
        'ui:widget': 'AutocompleteWidget',
        'ui:placeholder': 'Select languages...',
        'ui:options': {
          multiple: true,
          enumOptions: [
            { value: 'javascript', label: 'JavaScript' },
            { value: 'typescript', label: 'TypeScript' },
            { value: 'python', label: 'Python' },
            { value: 'java', label: 'Java' },
            { value: 'csharp', label: 'C#' },
          ],
        }
      },
    },
    formData: {
      city: 'San',
      language: 'Type',
      multipleLanguages: ['javascript', 'typescript'],
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>💡 Tips</h4>
            <div style={{ fontSize: '12px', marginBottom: '10px' }}>
              <p>• Start typing to see suggestions.</p>
              <p>• Press Enter to accept highlighted suggestion.</p>
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
