import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxWidget from './CheckboxWidget';
import CheckboxesWidget from './CheckboxesWidget';
import RadioWidget from './RadioWidget';
import RangeWidget from './RangeWidget';
import SelectWidget from './SelectWidget';
import TextareaWidget from './TextareaWidget';
import FileWidget from './FileWidget';
export const widgets = {
  CheckboxWidget,
  CheckboxesWidget,
  RadioWidget,
  RangeWidget,
  SelectWidget,
  TextareaWidget,
  FileWidget,
} as RegistryWidgetsType<any, RJSFSchema, FormContextType>;
