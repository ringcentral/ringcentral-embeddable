type SearchFormData = {
    filter?: string;
    search?: string;
    [key: string]: unknown;
};
type FilterInput = string | {
    label?: string;
    value?: string;
};
type SearchUiSchema = {
    'ui:filters'?: FilterInput[];
    'ui:placeholder'?: string;
    'ui:previewLength'?: number;
};
type SearchProps = {
    disabled?: boolean;
    formData?: SearchFormData | string;
    onChange: (value: SearchFormData | string) => void;
    uiSchema?: SearchUiSchema;
};
export declare function Search({ uiSchema, formData, disabled, onChange, }: SearchProps): JSX.Element;
export {};
//# sourceMappingURL=Search.d.ts.map