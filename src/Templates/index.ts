import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TemplatesType,
} from '@rjsf/utils';
import { generateTemplates } from '@ringcentral-integration/rjsf-spring';

import ArrayFieldItemTemplate from './ArrayFieldItemTemplate';
import ArrayFieldTemplate from './ArrayFieldTemplate';
import BaseInputTemplate from './BaseInputTemplate';
import DescriptionField from './DescriptionField';
import ErrorListTemplate from './ErrorListTemplate';
import FieldErrorTemplate from './FieldErrorTemplate';
import FieldHelpTemplate from './FieldHelpTemplate';
import FieldTemplate from './FieldTemplate';
import ObjectFieldTemplate from './ObjectFieldTemplate';
import TitleField from './TitleField';

export const templates = {
  ...generateTemplates(),
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  DescriptionFieldTemplate: DescriptionField,
  ErrorListTemplate,
  FieldErrorTemplate,
  FieldHelpTemplate,
  FieldTemplate,
  ObjectFieldTemplate,
  TitleFieldTemplate: TitleField,
} as Partial<TemplatesType<any, RJSFSchema, FormContextType>>;

export function generateJSONSchemaSpringPageTemplates<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(): Partial<TemplatesType<T, S, F>> {
  return {
    ...generateTemplates<T, S, F>(),
    ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    BaseInputTemplate,
    DescriptionFieldTemplate: DescriptionField,
    ErrorListTemplate,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    ObjectFieldTemplate,
    TitleFieldTemplate: TitleField,
  };
}
