import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: ReactNode;
    containerClassName?: string;
}

export function Input({
    label,
    error,
    icon,
    className = '',
    containerClassName = '',
    ...props
}: InputProps) {
    return (
        <div className={`input-group ${containerClassName}`}>
            {label && <label className="input-label" htmlFor={props.id}>{label}</label>}

            <div className={icon ? 'input-with-icon' : ''}>
                {icon && <div className="input-icon">{icon}</div>}
                <input
                    className={`input ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
            </div>

            {error && <span className="error-message">{error}</span>}
        </div>
    );
}
