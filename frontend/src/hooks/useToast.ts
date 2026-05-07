import { useState, useCallback, useRef } from 'react';

type ToastVariant = 'default' | 'success' | 'error' | 'info';

interface Toast {
    id: string;
    title: string;
    description?: string;
    variant: ToastVariant;
}

let toastCounter = 0;
let globalAddToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export const toast = (props: Omit<Toast, 'id'>) => {
    globalAddToast?.(props);
};

export const useToast = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const addToast = useCallback((props: Omit<Toast, 'id'>) => {
        const id = `toast-${++toastCounter}`;
        setToasts(prev => [...prev, { ...props, id }]);

        const timer = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
            timersRef.current.delete(id);
        }, 4000);
        timersRef.current.set(id, timer);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    // Register global toast function
    globalAddToast = addToast;

    return { toasts, addToast, dismissToast };
};
