import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
    onAnalyze?: () => void;
    onToggleChat?: () => void;
    onClosePanel?: () => void;
}

const useKeyboardShortcuts = ({ onAnalyze, onToggleChat, onClosePanel }: ShortcutHandlers) => {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Ignore when typing in inputs/textareas
            const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea') return;

            // Ctrl+Enter → Analyze
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                onAnalyze?.();
            }

            // Ctrl+K → Toggle Chat
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                onToggleChat?.();
            }

            // Esc → Close panel
            if (e.key === 'Escape') {
                e.preventDefault();
                onClosePanel?.();
            }
        },
        [onAnalyze, onToggleChat, onClosePanel]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
