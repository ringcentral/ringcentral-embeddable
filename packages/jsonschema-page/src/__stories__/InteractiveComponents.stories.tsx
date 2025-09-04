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
  title: 'JSONSchemaPage/Interactive Components',
  component: JSONSchemaPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive components for user actions - Buttons, Selection Lists, Search fields, and other clickable elements',
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

// Button Fields
export const ButtonFields: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        primaryButton: {
          type: 'string',
          title: 'Primary Action',
          description: 'Standard primary button',
        },
        secondaryButton: {
          type: 'string',
          title: 'Secondary Action',
          description: 'Outlined secondary button',
        },
        dangerButton: {
          type: 'string',
          title: 'Delete Item',
          description: 'Danger action button',
        },
        textButton: {
          type: 'string',
          title: 'Text Button',
          description: 'Simple text button',
        },
        fullWidthButton: {
          type: 'string',
          title: 'Full Width Button',
          description: 'Button that spans full width',
        },
        plainButton: {
          type: 'string',
          title: 'Plain Button',
          description: 'Plain style button',
        },
      },
    },
    uiSchema: {
      primaryButton: {
        'ui:field': 'button',
        'ui:variant': 'contained',
        'ui:color': 'primary',
      },
      secondaryButton: {
        'ui:field': 'button',
        'ui:variant': 'outlined',
        'ui:color': 'secondary',
      },
      dangerButton: {
        'ui:field': 'button',
        'ui:variant': 'contained',
        'ui:color': 'danger.b03',
      },
      textButton: {
        'ui:field': 'button',
        'ui:variant': 'text',
      },
      fullWidthButton: {
        'ui:field': 'button',
        'ui:variant': 'contained',
        'ui:color': 'success',
        'ui:fullWidth': true,
      },
      plainButton: {
        'ui:field': 'button',
        'ui:variant': 'plain',
      },
    },
    formData: {},
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const [buttonClicks, setButtonClicks] = useState<{
      primaryButton?: number;
      secondaryButton?: number;
      dangerButton?: number;
      textButton?: number;
      fullWidthButton?: number;
      plainButton?: number;
    }>({});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Button Interactions</h4>
            <div style={{ fontSize: '12px' }}>
              <p>Primary clicks: {buttonClicks.primaryButton || 0}</p>
              <p>Secondary clicks: {buttonClicks.secondaryButton || 0}</p>
              <p>Danger clicks: {buttonClicks.dangerButton || 0}</p>
              <p>Text clicks: {buttonClicks.textButton || 0}</p>
              <p>Full Width clicks: {buttonClicks.fullWidthButton || 0}</p>
              <p>Plain clicks: {buttonClicks.plainButton || 0}</p>
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
          onFormDataChange={(data) => {
            setFormData(data);
            args.onFormDataChange?.(data);
          }}
          onSubmit={(data) => {
            console.log('Button form submitted:', data.formData);
            args.onSubmit?.(data);
            alert('Form submitted! Check console and Actions panel.');
          }}
          onButtonClick={(buttonId: string, value: string) => {
            setButtonClicks(prev => ({
              ...prev,
              [buttonId]: (prev[buttonId as keyof typeof prev] || 0) + 1,
            }));
            console.log('Button clicked:', buttonId, value);
            args.onButtonClick?.(buttonId, value);
          }}
        />
      </StoryLayout>
    );
  },
};

// Search and Filter Fields
export const SearchAndFilterFields: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        globalSearch: {
          type: 'string',
          title: 'Global Search',
          description: 'Search across all data',
        },
        searchWithFilters: {
          type: 'object',
          properties: {
            search: {
              type: 'string',
              title: 'Search',
            },
            filter: {
              type: 'string',
              title: 'Filter',
            },
          },
        },
        searchResults: {
          type: 'null',
          title: 'Search Results',
          description: 'Display search results dynamically',
        },
        resultCount: {
          type: 'integer',
          title: 'Result Count',
          description: 'Number of results found',
          default: 0,
        },
      },
    },
    uiSchema: {
      globalSearch: {
        'ui:field': 'search',
        'ui:placeholder': 'Search everything...',
      },
      searchWithFilters: {
        'ui:field': 'search',
        'ui:placeholder': 'Search with filters...',
        'ui:filters': ['All', 'Type A', 'Type B', 'Type C'],
      },
      searchResults: {
        'ui:field': 'typography',
        'ui:options': {
          variant: 'body1',
          text: (formData: any) => {
            if (formData.resultCount > 0) {
              return `Found ${formData.resultCount} results for your search.`;
            }
            return 'No search performed yet.';
          },
          style: {
            fontStyle: 'italic',
            color: '#666',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
          },
        },
      },
    },
    formData: {
      globalSearch: '',
      searchWithFilters: {
        search: '',
        filter: 'All',
      },
      resultCount: 0,
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const [searchHistory, setSearchHistory] = useState<{
      global?: string[];
      filter?: string[];
      category?: string[];
      [key: string]: string[] | undefined;
    }>({});
    
    // Enhanced search handlers
    const enhancedArgs = {
      ...args,
      uiSchema: {
        ...args.uiSchema,
        globalSearch: {
          ...(args.uiSchema as any).globalSearch,
          'ui:options': {
            ...(args.uiSchema as any).globalSearch['ui:options'] || {},
            onSearch: (query: string, currentFormData: any, setCurrentFormData: any) => {
              const mockResults = query ? Math.floor(Math.random() * 50) + 1 : 0;
              setFormData((prev: any) => ({ ...prev, resultCount: mockResults }));
              setSearchHistory(prev => ({
                ...prev,
                global: [...(prev.global || []), query].slice(-3),
              }));
              console.log(`Global search for: ${query}, found ${mockResults} results`);
            },
          },
        },
        searchWithFilters: {
          ...(args.uiSchema as any).searchWithFilters,
          'ui:options': {
            ...(args.uiSchema as any).searchWithFilters['ui:options'] || {},
            onSearch: (query: string, currentFormData: any, setCurrentFormData: any) => {
              const mockResults = query ? Math.floor(Math.random() * 50) + 1 : 0;
              setFormData((prev: any) => ({ ...prev, resultCount: mockResults }));
              setSearchHistory(prev => ({
                ...prev,
                filter: [...(prev.filter || []), query].slice(-3),
              }));
              console.log(`Filter search for: ${query}, found ${mockResults} results`);
            },
          },
        },
      },
    };
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Search Analytics</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Global Searches: {searchHistory.global?.length || 0}</p>
              <p>Filter Searches: {searchHistory.filter?.length || 0}</p>
              <p>Category Filters: {searchHistory.category?.length || 0}</p>
              <p>Current Results: {formData.resultCount}</p>
            </div>
            <h4 style={{ margin: '15px 0 10px 0', color: '#555' }}>📝 Search History</h4>
            <div style={{ fontSize: '11px' }}>
              {Object.entries(searchHistory).map(([type, queries]) => (
                <div key={type} style={{ marginBottom: '8px' }}>
                  <strong>{type}:</strong> {queries?.join(', ') || 'None'}
                </div>
              ))}
            </div>
          </>
        }
      >
        <JSONSchemaPage
          {...enhancedArgs}
          formData={formData}
          onFormDataChange={setFormData}
        />
      </StoryLayout>
    );
  },
};

// Basic List with Icons
export const BasicListField: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        technology: {
          type: 'string',
          title: 'Choose Technology',
          description: 'Select your preferred technology',
          oneOf: [
            {
              const: 'javascript',
              title: 'JavaScript',
              description: 'The language of the web',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
            },
            {
              const: 'typescript',
              title: 'TypeScript',
              description: 'JavaScript with type safety',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
            },
            {
              const: 'react',
              title: 'React',
              description: 'A JavaScript library for building user interfaces',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
            },
            {
              const: 'nodejs',
              title: 'Node.js',
              description: 'JavaScript runtime built on Chrome V8 engine',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
            },
          ],
        },
      },
    },
    uiSchema: {
      technology: {
        'ui:field': 'list',
        'ui:showIconAsAvatar': true,
        'ui:showSelected': true,
      },
    },
    formData: {
      technology: 'react',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const [selectionHistory, setSelectionHistory] = useState<string[]>([]);
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Selection Activity</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Total Selections: {selectionHistory.length}</p>
              <p>Current Selection: {formData.technology || 'None'}</p>
              <p>Recent Selections:</p>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {selectionHistory.slice(-3).map((entry, index) => (
                  <li key={index}>{entry}</li>
                )) || <li>No selections yet</li>}
              </ul>
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
          onFormDataChange={(newData) => {
            if (newData.technology !== formData.technology && newData.technology) {
              const timestamp = new Date().toLocaleTimeString();
              setSelectionHistory(prev => [
                ...prev,
                `${timestamp}: Selected ${newData.technology}`,
              ]);
            }
            setFormData(newData);
          }}
        />
      </StoryLayout>
    );
  },
};

// List with Meta Information
export const ListWithMetaField: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        taskPriority: {
          type: 'string',
          title: 'Task Priority',
          description: 'Select task priority level',
          oneOf: [
            {
              const: 'urgent',
              title: 'Urgent',
              description: 'Needs immediate attention',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
              meta: 'Due today',
            },
            {
              const: 'high',
              title: 'High Priority',
              description: 'Important but not urgent',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
              meta: 'Due this week',
            },
            {
              const: 'medium',
              title: 'Medium Priority',
              description: 'Normal priority task',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
              meta: 'Due next week',
            },
            {
              const: 'low',
              title: 'Low Priority',
              description: 'Can be done when time permits',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
              meta: 'No rush',
            },
          ],
        },
      },
    },
    uiSchema: {
      taskPriority: {
        'ui:field': 'list',
        'ui:showIconAsAvatar': false,
        'ui:showSelected': true,
      },
    },
    formData: {
      taskPriority: 'high',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Priority Analysis</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Selected Priority: {formData.taskPriority || 'None'}</p>
              <p>Priority Level: {
                formData.taskPriority === 'urgent' ? '🔴 Critical' :
                formData.taskPriority === 'high' ? '🟠 High' :
                formData.taskPriority === 'medium' ? '🟡 Medium' :
                formData.taskPriority === 'low' ? '🟢 Low' : 'Not set'
              }</p>
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

// Card Layout List
export const CardListField: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        projectCard: {
          type: 'string',
          title: 'Choose Project',
          description: 'Select a project to work on',
          oneOf: [
            {
              const: 'web-app',
              title: 'Web Application',
              description: 'Modern React-based web application with TypeScript and advanced features',
              backgroundColor: '#e3f2fd',
              authorName: 'John Smith',
              authorAvatar: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
              meta: '5 days left',
            },
            {
              const: 'mobile-app',
              title: 'Mobile App',
              description: 'Cross-platform mobile application using React Native',
              backgroundColor: '#f3e5f5',
              authorName: 'Alice Johnson',
              authorAvatar: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
              meta: '2 weeks left',
            },
            {
              const: 'api-service',
              title: 'API Service',
              description: 'RESTful API service built with Node.js and Express',
              backgroundColor: '#e8f5e8',
              authorName: 'Bob Wilson',
              authorAvatar: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
              meta: '1 week left',
            },
            {
              const: 'dashboard',
              title: 'Analytics Dashboard',
              description: 'Data visualization dashboard with real-time updates and charts',
              backgroundColor: '#fff3e0',
              authorName: 'Carol Davis',
              authorAvatar: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
              meta: '3 days left',
            },
          ],
        },
      },
    },
    uiSchema: {
      "projectCard": {
        "ui:field": "list",
        "ui:itemType": "card",
        "ui:itemWidth": "48%",
        "ui:itemHeight": "110px",
        "ui:showSelected": false,
        "ui:readonly": false,
      }
    },
    formData: {
      projectCard: 'web-app',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Project Stats</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Selected Project: {formData.projectCard || 'None'}</p>
              <p>Project Status: {
                formData.projectCard === 'web-app' ? '🚀 In Development' :
                formData.projectCard === 'mobile-app' ? '📱 Planning' :
                formData.projectCard === 'api-service' ? '🔧 Testing' :
                formData.projectCard === 'dashboard' ? '📊 Design Phase' : 'Not selected'
              }</p>
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

// Metric Cards Widget (similar to phone activity dashboard)
export const MetricCardsWidget: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        phoneActivity: {
          type: 'string',
          title: 'Phone Activity',
          description: 'View phone activity metrics',
          oneOf: [
            {
              const: 'inbound',
              title: 'Inbound Call',
              value: '1',
              label: 'inbound call',
            },
            {
              const: 'outbound',
              title: 'Outbound Calls',
              value: '8',
              label: 'outbound calls',
            },
            {
              const: 'answered',
              title: 'Answered Calls',
              value: '1',
              label: 'answered calls',
            },
            {
              const: 'answer-rate',
              title: 'Answer Rate',
              value: '100%',
              trend: '+67% company avg',
              trendColor: 'success.f02',
            },
          ],
        },
        phoneEngagement: {
          type: 'string',
          title: 'Phone Engagement',
          description: 'View phone engagement metrics',
          oneOf: [
            {
              const: 'total-talk-time',
              title: 'Total Talk Time',
              value: '67',
              unit: 'minutes',
              trend: '+38% company avg',
              trendColor: 'success.f02',
            },
            {
              const: 'avg-talk-time',
              title: 'Average Talk Time',
              value: '22',
              unit: 'minutes',
              trend: '-5% company avg',
              trendColor: 'danger.f02',
            },
          ],
        },
      },
    },
    uiSchema: {
      phoneActivity: {
        'ui:field': 'list',
        'ui:itemType': 'metric',
        'ui:itemWidth': '48%',
        'ui:itemHeight': '120px',
        'ui:showSelected': false,
        'ui:readonly': true,
      },
      phoneEngagement: {
        'ui:field': 'list',
        'ui:itemType': 'metric',
        'ui:itemWidth': '48%',
        'ui:itemHeight': '120px',
        'ui:showSelected': false,
      },
    },
    formData: {
      phoneActivity: '',
      phoneEngagement: '',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Metric Dashboard</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Interactive: {formData.phoneActivity || formData.phoneEngagement ? 'Yes' : 'No'}</p>
              <p>Selected Activity: {formData.phoneActivity || 'None'}</p>
              <p>Selected Engagement: {formData.phoneEngagement || 'None'}</p>
            </div>
            <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '4px', marginBottom: '10px' }}>
              <strong>Features:</strong>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '11px' }}>
                <li>Large numeric values with descriptive labels</li>
                <li>Comparison indicators (positive/negative)</li>
                <li>Responsive card layout</li>
                <li>Read-only mode for dashboard display</li>
              </ul>
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

// Navigation Style List
export const NavigationListField: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        navigationMenu: {
          type: 'string',
          title: 'Navigation Menu',
          description: 'Select a page to navigate to',
          oneOf: [
            {
              const: 'dashboard',
              title: 'Dashboard',
              description: 'Overview of your account and recent activity',
            },
            {
              const: 'projects',
              title: 'Projects',
              description: 'Manage your projects and tasks',
            },
            {
              const: 'team',
              title: 'Team',
              description: 'View team members and collaboration tools',
            },
            {
              const: 'settings',
              title: 'Settings',
              description: 'Configure your account preferences',
            },
            {
              const: 'help',
              title: 'Help & Support',
              description: 'Get help and contact support',
            },
          ],
        },
      },
    },
    uiSchema: {
      navigationMenu: {
        'ui:field': 'list',
        'ui:navigation': true,
        'ui:showIconAsAvatar': false,
        'ui:showSelected': false,
      },
    },
    formData: {
      navigationMenu: '',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
    
    return (
      <StoryLayout 
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Navigation Activity</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Current Page: {formData.navigationMenu || 'Home'}</p>
              <p>Total Navigations: {navigationHistory.length}</p>
              <p>Navigation History:</p>
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                {navigationHistory.slice(-3).map((entry, index) => (
                  <li key={index}>{entry}</li>
                )) || <li>No navigation yet</li>}
              </ul>
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
          onFormDataChange={(newData) => {
            if (newData.navigationMenu !== formData.navigationMenu && newData.navigationMenu) {
              const timestamp = new Date().toLocaleTimeString();
              setNavigationHistory(prev => [
                ...prev,
                `${timestamp}: Navigated to ${newData.navigationMenu}`,
              ]);
            }
            setFormData(newData);
          }}
        />
      </StoryLayout>
    );
  },
}; 

// List with Actions

export const ListWithActions: Story = {
  args: {
    schema: {
      type: 'object',
      properties: {
        contacts: {
          type: 'string',
          title: 'Contacts',
          description: 'Select a contact or use actions',
          oneOf: [
            {
              const: 'alice',
              title: 'Alice Johnson',
              description: 'Account Manager',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
              meta: 'Last contacted: 2d ago',
              actions: [
                { id: 'call', title: 'Call', icon: 'phone' },
                { id: 'sms', title: 'SMS', icon: 'sms' },
                { id: 'edit', title: 'Edit', icon: 'edit' },
                { id: 'delete', title: 'Delete', icon: 'delete', color: 'danger.b03' },
                { id: 'newAction', title: 'New Action', icon: 'newAction' },
                { id: 'info', title: 'Info', icon: 'info' },
                { id: 'view', title: 'View', icon: 'view' },
                { id: 'refresh', title: 'Refresh', icon: 'refresh' },
                { id: 'copy', title: 'Copy', icon: 'copy' },
                { id: 'share', title: 'Share', icon: 'share' },
                { id: 'download', title: 'Download', icon: 'download' },
                { id: 'people', title: 'People', icon: 'people' },
                { id: 'insertLink', title: 'Insert Link', icon: 'insertLink' },
                { id: 'connect', title: 'Connect', icon: 'connect' },
                { id: 'viewLog', title: 'View Log', icon: 'viewLog' },
                { id: 'read', title: 'Mark as unread', icon: 'read' },
                { id: 'unread', title: 'Mark as read', icon: 'unread' },
              ],
            },
            {
              const: 'bob',
              title: 'Bob Wilson',
              description: 'Sales Engineer',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
              meta: 'Last contacted: 5h ago',
              actions: [
                { id: 'call', title: 'Call', icon: 'phone' },
                { id: 'sms', title: 'SMS', icon: 'sms' },
                { id: 'edit', title: 'Edit', icon: 'edit' },
                { id: 'delete', title: 'Delete', icon: 'delete', color: 'danger.b03' },
                { id: 'newAction', title: 'New Action', icon: 'newAction' },
                { id: 'info', title: 'Info', icon: 'info' },
                { id: 'view', title: 'View', icon: 'view' },
                { id: 'refresh', title: 'Refresh', icon: 'refresh' },
                { id: 'copy', title: 'Copy', icon: 'copy' },
                { id: 'share', title: 'Share', icon: 'share' },
                { id: 'download', title: 'Download', icon: 'download' },
                { id: 'people', title: 'People', icon: 'people' },
                { id: 'insertLink', title: 'Insert Link', icon: 'insertLink' },
                { id: 'connect', title: 'Connect', icon: 'connect' },
                { id: 'viewLog', title: 'View Log', icon: 'viewLog' },
              ],
            },
            {
              const: 'carol',
              title: 'Carol Davis',
              description: 'Support Specialist',
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
              meta: 'Last contacted: 1w ago',
              actions: [
                { id: 'call', title: 'Call', icon: 'phone' },
                { id: 'sms', title: 'SMS', icon: 'sms' },
                { id: 'edit', title: 'Edit', icon: 'edit' },
                { id: 'delete', title: 'Delete', icon: 'delete', color: 'danger.b03' },
                { id: 'newAction', title: 'New Action', icon: 'newAction' },
                { id: 'info', title: 'Info', icon: 'info' },
                { id: 'view', title: 'View', icon: 'view' },
                { id: 'refresh', title: 'Refresh', icon: 'refresh' },
                { id: 'copy', title: 'Copy', icon: 'copy' },
                { id: 'share', title: 'Share', icon: 'share' },
                { id: 'download', title: 'Download', icon: 'download' },
                { id: 'people', title: 'People', icon: 'people' },
                { id: 'insertLink', title: 'Insert Link', icon: 'insertLink' },
                { id: 'connect', title: 'Connect', icon: 'connect' },
                { id: 'viewLog', title: 'View Log', icon: 'viewLog' },
              ],
            },
          ],
        },
      },
    },
    uiSchema: {
      contacts: {
        'ui:field': 'list',
        'ui:showIconAsAvatar': true,
        'ui:showSelected': true,
      },
    },
    formData: {
      contacts: 'alice',
    },
  },
  render: (args) => {
    const [formData, setFormData] = useState(args.formData || {});
    const [actionHistory, setActionHistory] = useState<string[]>([]);
    const [actionCounts, setActionCounts] = useState<Record<string, number>>({});

    return (
      <StoryLayout
        args={args}
        resultComponent={
          <>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊Supported icons</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>call, sms, edit, delete, newAction, info, view, refresh, copy, share, download, people, insertLink, connect, viewLog, read, unread</p>
            </div>
            <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>📊 Action Activity</h4>
            <div style={{ fontSize: '12px', marginBottom: '15px' }}>
              <p>Selected Contact: {formData.contacts || 'None'}</p>
              <p>Total Actions: {actionHistory.length}</p>
              <div>
                <strong>Action Counts:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {Object.entries(actionCounts).map(([key, count]) => (
                    <li key={key}>{key}: {count}</li>
                  ))}
                  {Object.keys(actionCounts).length === 0 && <li>None</li>}
                </ul>
              </div>
            </div>
            <h4 style={{ margin: '15px 0 10px 0', color: '#555' }}>📝 Recent Actions</h4>
            <ul style={{ fontSize: '11px', margin: '5px 0 15px', paddingLeft: '20px' }}>
              {actionHistory.slice(-5).map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
              {actionHistory.length === 0 && <li>No actions yet</li>}
            </ul>
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
          onButtonClick={(name: string) => {
            // name format: `${item.const}-${action.id}-action` or `${item.const}-author`
            const timestamp = new Date().toLocaleTimeString();
            setActionHistory(prev => [...prev, `${timestamp}: ${name}`]);
            const actionMatch = name.match(/^(.*?)-(.*?)-(action)$/);
            if (actionMatch) {
              const [, actionId, itemId] = actionMatch;
              const key = `${actionId}:${itemId}`;
              setActionCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
            }
            args.onButtonClick?.(name as any);
          }}
        />
      </StoryLayout>
    );
  },
};
