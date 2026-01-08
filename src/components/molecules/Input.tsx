import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helpText?: ReactNode;
    icon?: ReactNode;
    rightElement?: ReactNode;
    containerClassName?: string;
}

export function Input({
    label,
    error,
    helpText,
    icon,
    rightElement,
    className = '',
    containerClassName = '',
    ...props
}: InputProps) {
    return (
        <div className={`input-group ${containerClassName}`}>
            {label && <label className="input-label" htmlFor={props.id}>{label}</label>}

            <div className={icon || rightElement ? 'input-with-icon' : ''}>
                {icon && <div className="input-icon">{icon}</div>}
                <input
                    className={`input ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {rightElement}
            </div>

            {helpText && <p className="input-helper">{helpText}</p>}
            {error && <span className="error-message">{error}</span>}
        </div>
    );
}
