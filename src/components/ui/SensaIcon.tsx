import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './SensaIcon.module.css';

// ============================================
// TYPES
// ============================================
export type SensaIconSize = 'sm' | 'md' | 'lg' | 'xl';
export type SensaIconVariant = 'default' | 'glow' | 'gradient' | 'duotone';
export type SensaIconAnimation = 'none' | 'pulse' | 'float' | 'spin';
export type SensaIconColor = 'default' | 'success' | 'warning' | 'error' | 'muted';

export interface SensaIconProps {
    /** Lucide icon component to render */
    icon: LucideIcon;
    /** Size preset: sm (16px), md (20px), lg (24px), xl (32px) */
    size?: SensaIconSize;
    /** Visual treatment variant */
    variant?: SensaIconVariant;
    /** Animation type */
    animate?: SensaIconAnimation;
    /** Semantic color override */
    color?: SensaIconColor;
    /** Enable hover/click interactions */
    interactive?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Additional CSS class */
    className?: string;
    /** Accessibility label */
    'aria-label'?: string;
}

// ============================================
// SIZE MAPPING (for Lucide size prop)
// ============================================
const sizeMap: Record<SensaIconSize, number> = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
};

// ============================================
// COMPONENT
// ============================================
export const SensaIcon = forwardRef<HTMLSpanElement, SensaIconProps>(
    (
        {
            icon: Icon,
            size = 'md',
            variant = 'default',
            animate = 'none',
            color = 'default',
            interactive = false,
            disabled = false,
            className = '',
            'aria-label': ariaLabel,
            ...rest
        },
        ref
    ) => {
        // Build class names
        const classNames = [
            styles.iconWrapper,
            styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`],
            styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
            animate !== 'none' && styles[`animate${animate.charAt(0).toUpperCase() + animate.slice(1)}`],
            color !== 'default' && styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`],
            interactive && styles.interactive,
            disabled && styles.disabled,
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <span
                ref={ref}
                className={classNames}
                role={ariaLabel ? 'img' : undefined}
                aria-label={ariaLabel}
                aria-hidden={!ariaLabel}
                {...rest}
            >
                <Icon
                    size={sizeMap[size]}
                    strokeWidth={1.5}
                />
            </span>
        );
    }
);

SensaIcon.displayName = 'SensaIcon';
