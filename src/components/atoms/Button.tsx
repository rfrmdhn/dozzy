import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
    size?: 'sm' | 'md' | 'lg';
    leftIcon?: ReactNode;
    className?: string;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    leftIcon,
    className = '',
    ...props
}: ButtonProps) {
    const sizeClass = size === 'md' ? '' : `btn-${size}`;

    return (
        <button
            className={`btn btn-${variant} ${sizeClass} ${className}`}
            {...props}
        >
            {leftIcon}
            {children}
        </button>
    );
}
