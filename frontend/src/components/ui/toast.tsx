import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

const variantStyles = {
    default: 'bg-card border-white/10',
    success: 'bg-emerald-500/10 border-emerald-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
};

const variantIcons = {
    default: null,
    success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
};

const Toaster = () => {
    const { toasts, dismissToast } = useToast();

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-xl ${variantStyles[t.variant]}`}
                    >
                        {variantIcons[t.variant]}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white">{t.title}</p>
                            {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                        </div>
                        <button onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-white transition-colors shrink-0">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Toaster;
