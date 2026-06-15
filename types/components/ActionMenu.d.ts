import React from 'react';
import type { IconButtonProps } from '@ringcentral/spring-ui';
export type ActionMenuItem = {
    color?: string;
    disabled?: boolean;
    icon: React.ComponentType;
    id?: string;
    onClick: (event?: React.MouseEvent) => void;
    title: string;
};
export type ActionMenuProps = {
    actions: ActionMenuItem[];
    className?: string;
    color?: string;
    iconClassName?: string;
    iconShape?: IconButtonProps['shape'];
    iconVariant?: 'outlined' | 'contained' | 'icon' | 'inverted';
    maxActions?: number;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
    onMoreMenuOpen?: (open: boolean) => void;
    size?: 'xsmall' | 'small' | 'medium' | 'large';
};
export declare function ActionMenu({ actions, className, color, iconClassName, iconShape, iconVariant, maxActions, onClick, onMoreMenuOpen, size, }: ActionMenuProps): JSX.Element;
//# sourceMappingURL=ActionMenu.d.ts.map