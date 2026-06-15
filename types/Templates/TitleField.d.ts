import { FormContextType, RJSFSchema, StrictRJSFSchema, TitleFieldProps } from '@rjsf/utils';
type ExtraTitleFieldProps = {
    extended?: boolean;
    onClick?: () => void;
};
export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({ id, title, uiSchema, extended, onClick, }: TitleFieldProps<T, S, F> & ExtraTitleFieldProps): JSX.Element;
export {};
//# sourceMappingURL=TitleField.d.ts.map