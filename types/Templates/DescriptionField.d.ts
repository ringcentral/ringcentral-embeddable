import { CSSProperties } from 'react';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
type DescriptionFieldExtraProps = {
    style?: CSSProperties;
};
export default function DescriptionField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(props: DescriptionFieldProps<T, S, F> & DescriptionFieldExtraProps): JSX.Element;
export {};
//# sourceMappingURL=DescriptionField.d.ts.map