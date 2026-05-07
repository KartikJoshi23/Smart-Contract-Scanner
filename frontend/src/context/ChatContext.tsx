import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { useScanner } from '@/context/ScannerContext';

interface ChatContextType {
    isChatOpen: boolean;
    setIsChatOpen: Dispatch<SetStateAction<boolean>>;
    chatQuestion: string | undefined;
    setChatQuestion: (q: string | undefined) => void;
    analysisId: number | undefined;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatQuestion, setChatQuestion] = useState<string | undefined>();
    const { result } = useScanner();

    const analysisId = result ? parseInt(result.id) : undefined;

    return (
        <ChatContext.Provider value={{ isChatOpen, setIsChatOpen, chatQuestion, setChatQuestion, analysisId }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error('useChat must be used within ChatProvider');
    return ctx;
};
