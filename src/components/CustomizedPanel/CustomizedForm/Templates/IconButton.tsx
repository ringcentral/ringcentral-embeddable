import React from 'react';
import {
  RcIconButton,
  RcIconButtonProps,
} from '@ringcentral/juno';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Remove,
} from '@ringcentral/juno-icon';
import {
  FormContextType,
  IconButtonProps,
  RJSFSchema,
  StrictRJSFSchema,
  TranslatableString,
} from '@rjsf/utils';

export default function IconButton<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: IconButtonProps<T, S, F>) {
  const { icon, color, uiSchema, registry, ...otherProps } = props;
  return (
    <RcIconButton {...otherProps} size='small' color={color as RcIconButtonProps['color']}>
      {icon}
    </RcIconButton>
  );
}

export function CopyButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <RcIconButton
      title={translateString(TranslatableString.CopyButton)}
      {...props}
      symbol={Copy}
    />
  );
}

export function MoveDownButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <RcIconButton
      title={translateString(TranslatableString.MoveDownButton)}
      {...props}
      symbol={ArrowDown}
    />
  );
}

export function MoveUpButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const {
    registry: { translateString },
  } = props;
  return (
    <RcIconButton
      title={translateString(TranslatableString.MoveUpButton)}
      {...props}
      symbol={ArrowUp}
    />
  );
}

export function RemoveButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: IconButtonProps<T, S, F>
) {
  const { iconType, ...otherProps } = props;
  const {
    registry: { translateString },
  } = otherProps;
  return (
    <RcIconButton
      title={translateString(TranslatableString.RemoveButton)}
      {...otherProps}
      color='secondary'
      symbol={Remove}
    />
  );
}
