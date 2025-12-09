import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { GenerateContentResponse } from '@google/genai';

interface ChatAssistantProps {
  onClose: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: 'Systems online. Ready for engineering assistance.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatSessionRef = useRef<ReturnType<typeof createChatSession> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let botResponseText = '';
      const botMsgId = (Date.now() + 1).toString();
      
      // Add initial empty bot message
      setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', timestamp: Date.now() }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          botResponseText += c.text;
          setMessages(prev => 
            prev.map(msg => msg.id === botMsgId ? { ...msg, text: botResponseText } : msg)
          );
        }
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: 'Error: Connection interrupted. Please retry.', 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-industrial-900 border-l border-industrial-700 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-industrial-700 bg-industrial-800">
        <div className="flex items-center space-x-2 text-industrial-accent">
          <Bot size={20} />
          <span className="font-mono font-bold tracking-wider">KINZOKU ASSISTANT</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-industrial-700 text-white rounded-br-none' 
                : 'bg-slate-800 text-industrial-cyan border border-industrial-700 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-industrial-800 border-t border-industrial-700">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Query engineering database..."
            className="flex-1 bg-industrial-900 border border-industrial-700 text-white px-3 py-2 rounded focus:outline-none focus:border-industrial-cyan font-mono"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="bg-industrial-cyan hover:bg-cyan-400 text-black p-2 rounded disabled:opacity-50 transition-colors"
          >
            {isStreaming ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
