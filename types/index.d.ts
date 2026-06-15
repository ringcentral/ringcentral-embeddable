import { ActionMenu } from './components/ActionMenu';
import { TextWithMarkdown } from './components/TextWithMarkdown';
export { ActionMenu, TextWithMarkdown };
export type JSONSchemaPageProps = {
    formData?: any;
    hiddenSubmitButton?: boolean;
    onButtonClick?: (name: string) => void;
    onFormDataChange: (formData: any) => void;
    onSubmit?: (data: any) => void;
    schema: any;
    uiSchema?: any;
};
export declare function JSONSchemaPage({ schema, uiSchema, formData, onFormDataChange, onButtonClick, hiddenSubmitButton, onSubmit, }: JSONSchemaPageProps): JSX.Element;
//# sourceMappingURL=index.d.ts.map