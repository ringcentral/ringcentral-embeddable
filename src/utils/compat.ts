import type {
  ButtonProps,
  IconButtonProps,
  LinkProps,
} from '@ringcentral/spring-ui';

export type LegacyColor = string | undefined;

const colorMap: Record<string, ButtonProps['color']> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  error: 'danger',
  neutral: 'neutral',
  'danger.b03': 'danger',
  'danger.b04': 'danger',
  'warning.b03': 'warning',
  'warning.b04': 'warning',
  'success.b03': 'success',
  'success.b04': 'success',
  'action.primary': 'primary',
  'interactive.f01': 'primary',
  'interactive.b04': 'primary',
  'neutral.f06': 'neutral',
  'neutral.f05': 'neutral',
  'neutral.f04': 'neutral',
};

const buttonVariantMap: Record<string, ButtonProps['variant']> = {
  contained: 'contained',
  outlined: 'outlined',
  text: 'text',
  plain: 'text',
  inverted: 'inverted',
};

const iconButtonColorMap: Record<string, IconButtonProps['color']> = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  error: 'danger',
  neutral: 'neutral',
  'danger.b03': 'danger',
  'danger.b04': 'danger',
  'warning.b03': 'warning',
  'warning.b04': 'warning',
  'success.b03': 'success',
  'success.b04': 'success',
  'action.primary': 'primary',
  'interactive.f01': 'primary',
  'neutral.f06': 'neutral',
  'neutral.f05': 'neutral',
  'neutral.f04': 'neutral',
};

const textColorMap: Record<string, string> = {
  'action.primary': 'var(--sui-colors-primary-f)',
  danger: 'var(--sui-colors-danger)',
  'danger.b03': 'var(--sui-colors-danger)',
  'danger.b04': 'var(--sui-colors-danger)',
  'danger.f01': 'var(--sui-colors-danger)',
  'danger.f02': 'var(--sui-colors-danger-f)',
  disabled: 'var(--sui-colors-neutral-b3)',
  'disabled.f01': 'var(--sui-colors-neutral-b3)',
  'disabled.f02': 'var(--sui-colors-neutral-b3)',
  error: 'var(--sui-colors-danger)',
  info: 'var(--sui-colors-primary-f)',
  'interactive.f01': 'var(--sui-colors-primary-f)',
  'interactive.b04': 'var(--sui-colors-primary-f)',
  neutral: 'var(--sui-colors-neutral-b2)',
  'neutral.f03': 'var(--sui-colors-neutral-b3)',
  'neutral.f04': 'var(--sui-colors-neutral-b2)',
  'neutral.f05': 'var(--sui-colors-neutral-b1)',
  'neutral.f06': 'var(--sui-colors-neutral-b0)',
  primary: 'var(--sui-colors-primary-f)',
  'primary.f01': 'var(--sui-colors-primary-f)',
  'primary.f02': 'var(--sui-colors-primary-f-high-contrast)',
  success: 'var(--sui-colors-success)',
  'success.b03': 'var(--sui-colors-success)',
  'success.b04': 'var(--sui-colors-success)',
  'success.f01': 'var(--sui-colors-success)',
  'success.f02': 'var(--sui-colors-success-f)',
  warning: 'var(--sui-colors-warning)',
  'warning.b03': 'var(--sui-colors-warning)',
  'warning.b04': 'var(--sui-colors-warning)',
  'warning.f01': 'var(--sui-colors-warning)',
  'warning.f02': 'var(--sui-colors-warning-f)',
};

export function getButtonColor(
  color: LegacyColor,
  fallback: ButtonProps['color'] = 'primary',
): ButtonProps['color'] {
  if (!color) {
    return fallback;
  }
  return colorMap[color] ?? fallback;
}

export function getButtonVariant(
  variant: string | undefined,
  fallback: ButtonProps['variant'] = 'contained',
): ButtonProps['variant'] {
  if (!variant) {
    return fallback;
  }
  return buttonVariantMap[variant] ?? fallback;
}

export function getIconButtonColor(
  color: LegacyColor,
  fallback: IconButtonProps['color'] = 'neutral',
): IconButtonProps['color'] {
  if (!color) {
    return fallback;
  }
  return iconButtonColorMap[color] ?? fallback;
}

export function getLinkVariant(
  variant: string | undefined,
  color: LegacyColor,
): LinkProps['variant'] {
  if (variant === 'inverted') {
    return 'inverted';
  }
  if (variant === 'secondary' || color?.startsWith('neutral')) {
    return 'secondary';
  }
  return 'primary';
}

const typographyClassNames = [
  'typography-descriptor',
  'typography-descriptorMini',
  'typography-descriptorMiniSemiBold',
  'typography-detail',
  'typography-detailBold',
  'typography-display1',
  'typography-display2',
  'typography-display3',
  'typography-headline',
  'typography-label',
  'typography-labelSemiBold',
  'typography-mainText',
  'typography-subtitle',
  'typography-subtitleBold',
  'typography-subtitleMini',
  'typography-subtitleMiniSemiBold',
  'typography-title',
] as const;

type TypographyClassName = (typeof typographyClassNames)[number];

type TypographyComponent = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li';

const defaultTypographyClassName: TypographyClassName = 'typography-mainText';

const typographyClassNameSet = new Set<string>(typographyClassNames);

const legacyTypographyClassNameMap: Record<string, string> = {
  body: 'typography-mainText',
  body1: 'typography-mainText',
  body2: 'typography-subtitleMiniSemiBold',
  button: 'typography-subtitleBold',
  caption: 'typography-descriptor',
  caption1: 'typography-descriptor',
  caption2: 'typography-descriptorMiniSemiBold',
  display4: 'typography-headline',
  h1: 'typography-headline',
  h2: 'typography-headline',
  h3: 'typography-headline',
  h4: 'typography-headline',
  h5: 'typography-display1',
  h6: 'typography-display3',
  headline1: 'typography-display1',
  headline2: 'typography-headline',
  subheading1: 'typography-subtitle',
  subheading2: 'typography-subtitleBold',
  title1: 'typography-display3 tracking-normal',
  title2: 'typography-title',
};

const typographyComponentMap: Record<string, TypographyComponent> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
};

function isTypographyClassName(className: string): className is TypographyClassName {
  return typographyClassNameSet.has(className);
}

function getSpringTypographyClassName(variant: string): string {
  return variant.startsWith('typography-') ? variant : `typography-${variant}`;
}

export function getTypographyClassName(variant: string | undefined): string {
  if (!variant) {
    return defaultTypographyClassName;
  }
  const springTypographyClassName = getSpringTypographyClassName(variant);
  if (isTypographyClassName(springTypographyClassName)) {
    return springTypographyClassName;
  }
  return legacyTypographyClassNameMap[variant] ?? defaultTypographyClassName;
}

export function getTypographyComponent(
  variant: string | undefined,
  isBulletedList: boolean,
): TypographyComponent {
  if (isBulletedList) {
    return 'li';
  }
  if (!variant) {
    return 'p';
  }
  const normalizedVariant = variant.replace('typography-', '');
  return typographyComponentMap[normalizedVariant] ?? 'p';
}

export function getTextColor(color: string | undefined): string | undefined {
  if (!color) {
    return undefined;
  }
  return textColorMap[color] ?? color;
}

export function getDescriptionColor(color: string | undefined): string | undefined {
  return getTextColor(color);
}
