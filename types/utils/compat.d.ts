import type { ButtonProps, IconButtonProps, LinkProps } from '@ringcentral/spring-ui';
export type LegacyColor = string | undefined;
export declare function getButtonColor(color: LegacyColor, fallback?: ButtonProps['color']): ButtonProps['color'];
export declare function getButtonVariant(variant: string | undefined, fallback?: ButtonProps['variant']): ButtonProps['variant'];
export declare function getIconButtonColor(color: LegacyColor, fallback?: IconButtonProps['color']): IconButtonProps['color'];
export declare function getLinkVariant(variant: string | undefined, color: LegacyColor): LinkProps['variant'];
type TypographyComponent = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'li';
export declare function getTypographyClassName(variant: string | undefined): string;
export declare function getTypographyComponent(variant: string | undefined, isBulletedList: boolean): TypographyComponent;
export declare function getTextColor(color: string | undefined): string | undefined;
export declare function getDescriptionColor(color: string | undefined): string | undefined;
export {};
//# sourceMappingURL=compat.d.ts.map