import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi there! 👋 How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const messagesEndRef = useRef(null);

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
    const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleCopy = (code, index) => {
        navigator.clipboard.writeText(code);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        const newMessages = [...messages, { role: 'user', text: userText }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            if (!API_KEY) {
                setMessages([...newMessages, { role: 'model', text: '⚠️ Add VITE_GEMINI_API_KEY in .env file' }]);
                setIsLoading(false);
                return;
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userText }] }]
                    })
                }
            );

            const data = await response.json();

            const modelText =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                'Sorry, I could not understand that.';

            setMessages([...newMessages, { role: 'model', text: modelText }]);

        } catch (error) {
            console.error(error);
            setMessages([...newMessages, { role: 'model', text: '❌ Error occurred.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border flex flex-col mb-4"
                        style={{ height: '520px' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between">
                            <h3 className="font-semibold">AI Assistant</h3>
                            <X onClick={toggleChat} className="cursor-pointer" />
                        </div>

                        {/* Messages */}
                        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white self-end'
                                            : 'bg-white border text-gray-800 self-start shadow-sm'
                                    }`}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ inline, className, children }) {
                                                const match = /language-(\w+)/.exec(className || '');

                                                return !inline ? (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => handleCopy(children, idx)}
                                                            className="absolute right-2 top-2 text-xs bg-gray-700 text-white px-2 py-1 rounded"
                                                        >
                                                            {copiedIndex === idx ? <Check size={14}/> : <Copy size={14}/>}
                                                        </button>

                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus}
                                                            language={match?.[1] || 'javascript'}
                                                            PreTag="div"
                                                        >
                                                            {String(children).replace(/\n$/, '')}
                                                        </SyntaxHighlighter>
                                                    </div>
                                                ) : (
                                                    <code className="bg-gray-200 px-1 rounded">{children}</code>
                                                );
                                            }
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>
                            ))}

                            {/* Typing Loader */}
                            {isLoading && (
                                <div className="bg-white border p-3 rounded-2xl shadow-sm flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t flex gap-2">
                            <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }}
    className="flex-1 px-3 py-2 border rounded-xl text-sm"
    placeholder="Ask something..."
/>

                            <button
                                onClick={handleSend}
                                className="bg-indigo-600 text-white p-2 rounded-xl"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg"
            >
                {isOpen ? <X /> : <MessageCircle />}
            </button>
        </div>
    );
}
