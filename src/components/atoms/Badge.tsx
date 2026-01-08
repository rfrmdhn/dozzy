import type { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'todo' | 'in_progress' | 'done' | 'active' | 'delayed' | 'draft' | 'low' | 'medium' | 'high' | 'primary' | 'warning' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    className?: string;
}

export function Badge({ children, variant = 'draft', size = 'md', className = '' }: BadgeProps) {
    // Map underscore variants to hyphenated classes if needed, 
    // but our CSS uses "badge-in-progress" so we need to handle that.
    const validVariant = variant.replace('_', '-');
    const sizeClass = size === 'sm' ? 'badge-sm' : '';

    return (
        <span className={`badge badge-${validVariant} ${sizeClass} ${className}`}>
            {children}
        </span>
    );
}
