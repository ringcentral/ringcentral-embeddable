import { FormContextType, RegistryWidgetsType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import CheckboxWidget from './CheckboxWidget';
import CheckboxesWidget from './CheckboxesWidget';
import RadioWidget from './RadioWidget';
import RangeWidget from './RangeWidget';
import SelectWidget from './SelectWidget';
import TextareaWidget from './TextareaWidget';

export const widgets = {
  CheckboxWidget,
  CheckboxesWidget,
  RadioWidget,
  RangeWidget,
  SelectWidget,
  TextareaWidget,
} as RegistryWidgetsType<any, RJSFSchema, FormContextType>;
