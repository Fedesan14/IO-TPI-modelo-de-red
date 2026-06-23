import { useEffect } from 'react';

function ErrorToast({ toast, onClose }) {
    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeoutId = window.setTimeout(onClose, 3600);

        return () => window.clearTimeout(timeoutId);
    }, [toast, onClose]);

    if (!toast) {
        return null;
    }

    return (
        <div className='toast-container' role='alert' aria-live='assertive'>
            <div className='error-toast'>
                <strong>Error</strong>
                <span>{toast.message}</span>
                <button type='button' aria-label='Cerrar error' onClick={onClose}>x</button>
            </div>
        </div>
    );
}

export default ErrorToast;
