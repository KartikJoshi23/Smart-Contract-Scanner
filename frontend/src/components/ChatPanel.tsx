import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sendChatMessage, type ChatMessage } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
    X,
    Send,
    MessageCircle,
    Loader2,
    Bot,
    User,
    Sparkles,
    Copy,
    Check,
} from 'lucide-react';

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    analysisId?: number;
    initialQuestion?: string;
}

const QUICK_PROMPTS = [
    { label: 'Explain vulnerabilities', prompt: 'Explain the vulnerabilities found in this contract in simple terms.' },
    { label: 'How to fix?', prompt: 'How do I fix the most critical vulnerabilities in this contract?' },
    { label: 'False positive?', prompt: 'Could any of these findings be false positives? How can I verify?' },
    { label: 'Write a test', prompt: 'Write a test case that demonstrates the most critical vulnerability found.' },
    { label: 'Attack vector', prompt: 'What is the most likely attack vector for this contract?' },
];

const ChatPanel = ({ isOpen, onClose, analysisId, initialQuestion }: ChatPanelProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<number | undefined>();
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const hasHandledInitialQuestion = useRef(false);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Handle initial question (from "Ask about this vulnerability")
    useEffect(() => {
        if (isOpen && initialQuestion && !hasHandledInitialQuestion.current) {
            hasHandledInitialQuestion.current = true;
            handleSend(initialQuestion);
        }
    }, [isOpen, initialQuestion]);

    // Reset when panel closes  
    useEffect(() => {
        if (!isOpen) {
            hasHandledInitialQuestion.current = false;
        }
    }, [isOpen]);

    const handleSend = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isStreaming) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsStreaming(true);

        // Add empty assistant message to stream into
        const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMsg]);

        await sendChatMessage(
            text,
            analysisId,
            sessionId,
            // onChunk
            (chunk) => {
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        updated[updated.length - 1] = {
                            ...lastMsg,
                            content: lastMsg.content + chunk,
                        };
                    }
                    return updated;
                });
            },
            // onDone
            (newSessionId) => {
                setSessionId(newSessionId);
                setIsStreaming(false);
            },
            // onError
            (error) => {
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        updated[updated.length - 1] = {
                            ...lastMsg,
                            content: `⚠️ Error: ${error}`,
                        };
                    }
                    return updated;
                });
                setIsStreaming(false);
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:bg-transparent md:backdrop-blur-none md:pointer-events-none"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={`fixed z-50 bg-[#0d0d1a]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col
          inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[440px]
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Security Assistant</h3>
                            <p className="text-xs text-muted-foreground">Powered by Gemini AI</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="hover:bg-white/10 text-muted-foreground"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-4 border border-violet-500/20">
                                <MessageCircle className="w-8 h-8 text-violet-400" />
                            </div>
                            <h4 className="text-lg font-semibold text-white mb-2">Ask About Your Contract</h4>
                            <p className="text-sm text-muted-foreground mb-6">
                                I can explain vulnerabilities, suggest fixes, and help you write secure Solidity code.
                            </p>

                            {/* Quick Prompts */}
                            <div className="w-full space-y-2">
                                {QUICK_PROMPTS.map((qp) => (
                                    <button
                                        key={qp.label}
                                        onClick={() => handleSend(qp.prompt)}
                                        className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 
                      hover:bg-violet-500/10 hover:border-violet-500/30 transition-all duration-200
                      text-sm text-muted-foreground hover:text-white group"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 inline mr-2 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {qp.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-blue-600/80 text-white'
                                    : 'bg-white/5 border border-white/10 text-gray-200'
                                    }`}
                            >
                                {msg.role === 'assistant' ? (
                                    <div className="prose prose-invert prose-sm max-w-none
                    prose-p:my-1 prose-headings:my-2 prose-li:my-0.5
                    prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                    prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                code({ className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const codeString = String(children).replace(/\n$/, '');

                                                    if (match) {
                                                        return (
                                                            <div className="relative group my-2">
                                                                <button
                                                                    onClick={() => copyToClipboard(codeString, i)}
                                                                    className="absolute right-2 top-2 p-1.5 rounded-md bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                                >
                                                                    {copiedIndex === i ? (
                                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                    ) : (
                                                                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                                                                    )}
                                                                </button>
                                                                <SyntaxHighlighter
                                                                    style={oneDark as { [key: string]: React.CSSProperties }}
                                                                    language={match[1]}
                                                                    PreTag="div"
                                                                    customStyle={{
                                                                        margin: 0,
                                                                        borderRadius: '0.75rem',
                                                                        fontSize: '0.8rem',
                                                                    }}
                                                                >
                                                                    {codeString}
                                                                </SyntaxHighlighter>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                            }}
                                        >
                                            {msg.content || (isStreaming && i === messages.length - 1 ? '' : '')}
                                        </ReactMarkdown>
                                        {isStreaming && i === messages.length - 1 && (
                                            <span className="inline-flex gap-1 ml-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 mt-1">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your contract..."
                            rows={1}
                            className="flex-1 resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 
                text-sm text-white placeholder:text-muted-foreground
                focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25
                min-h-[44px] max-h-[120px]"
                            style={{ fieldSizing: 'content' } as React.CSSProperties}
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isStreaming}
                            className="h-11 w-11 p-0 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 
                hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 border-0 shrink-0"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-2 text-center">
                        Powered by Gemini 2.5 Flash · Responses may be inaccurate
                    </p>
                </div>
            </div>
        </>
    );
};

export default ChatPanel;
