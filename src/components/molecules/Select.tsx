import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    containerClassName?: string;
    placeholder?: string;
}

export function Select({
    label,
    error,
    options,
    className = '',
    containerClassName = '',
    placeholder,
    ...props
}: SelectProps) {
    return (
        <div className={`input-group ${containerClassName}`}>
            {label && <label className="input-label" htmlFor={props.id}>{label}</label>}

            <select
                className={`input ${error ? 'input-error' : ''} ${className}`}
                {...props}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            {error && <span className="error-message">{error}</span>}
        </div>
    );
}
