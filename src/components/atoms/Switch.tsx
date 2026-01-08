import type { InputHTMLAttributes } from 'react';
import './Switch.css';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
}

export function Switch({ className = '', label, ...props }: SwitchProps) {
    return (
        <label className={`switch ${className}`}>
            <input type="checkbox" {...props} />
            <span className="switch-slider"></span>
            {label && <span className="sr-only">{label}</span>}
        </label>
    );
}
