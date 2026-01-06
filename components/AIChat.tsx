
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { Patent } from '../types';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  contextPatents: Patent[];
  initialMessage?: string;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, contextPatents, initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '您好！我是您的專利管理助手。您可以詢問關於專利期限、年費或法律狀態的問題。' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle external triggers (like "Analyze" button)
  useEffect(() => {
    if (isOpen && initialMessage) {
        handleSend(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isOpen]);


  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    // Add User Message
    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(textToSend, contextPatents);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: '抱歉，發生錯誤，請稍後再試。', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles size={18} />
            </div>
            <div>
                <h3 className="font-semibold text-sm">AI 專利助手</h3>
                {/* Updated label to reflect the Gemini 3 model being used */}
                <p className="text-[10px] text-blue-100 opacity-90">Powered by Gemini 3</p>
            </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : msg.isError 
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
            }`}>
              {msg.role === 'model' && <Bot size={14} className="mb-1 text-blue-400 block" />}
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              <span className="text-xs text-gray-400">正在思考中...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入您的問題..."
            className="flex-1 bg-gray-50 border-0 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block w-full p-2.5 outline-none placeholder:text-gray-400"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
