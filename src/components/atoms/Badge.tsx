import type { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    variant?: 'todo' | 'in_progress' | 'done' | 'active' | 'delayed' | 'draft' | 'low' | 'medium' | 'high';
    className?: string;
}

export function Badge({ children, variant = 'draft', className = '' }: BadgeProps) {
    // Map underscore variants to hyphenated classes if needed, 
    // but our CSS uses "badge-in-progress" so we need to handle that.
    const validVariant = variant.replace('_', '-');

    return (
        <span className={`badge badge-${validVariant} ${className}`}>
            {children}
        </span>
    );
}
