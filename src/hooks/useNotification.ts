import { useToast } from '../contexts/ToastContext';

export const useNotification = () => {
    const { addToast } = useToast();

    return {
        success: (message: string) => addToast(message, 'success'),
        error: (message: string) => addToast(message, 'error'),
        info: (message: string) => addToast(message, 'info'),
        warning: (message: string) => addToast(message, 'warning'),
    };
};
