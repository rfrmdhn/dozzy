import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, CheckCircleIcon, AlertIcon, InfoIcon } from './icons';
import './styles/Toast.css';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

const icons = {
    success: <CheckCircleIcon size={20} />,
    error: <AlertIcon size={20} />,
    warning: <AlertIcon size={20} />, // Reuse alert for warning
    info: <InfoIcon size={20} />,
};

export function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 300); // Match animation duration
    };

    return (
        <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={handleClose}>
                <CloseIcon size={16} />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: (Omit<ToastProps, 'onClose'> & { id: string })[];
    onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return createPortal(
        <div className="toast-container">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>,
        document.body
    );
}
