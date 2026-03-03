import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, Headset } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model' | 'system' | 'admin';
  content: string;
}

import { api } from '../services/api';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHumanAgent, setIsHumanAgent] = useState(false);
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('support_chat_session');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem('support_chat_session', newId);
    return newId;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load and polling
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/messages/${sessionId}`);
        const data = response.data;
        if (data.length > 0) {
          setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
          // If there's a message from 'admin', switch to human mode
          if (data.some((m: any) => m.role === 'admin')) {
            setIsHumanAgent(true);
          }
        } else if (isOpen) {
          // Initial greeting if no history
          const greeting = { role: 'model' as const, content: '¡Hola! Soy tu asistente virtual de All Pro Sum 33. ¿En qué puedo ayudarte hoy?' };
          setMessages([greeting]);
          saveMessage(greeting.role, greeting.content);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId, isOpen]);

  const saveMessage = async (role: string, content: string) => {
    try {
      await api.post('/chat/messages', { sessionId, role, content });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newUserMsg = { role: 'user' as const, content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);
    saveMessage(newUserMsg.role, newUserMsg.content);
    
    if (isHumanAgent) {
      // In human mode, we just wait for admin to reply via polling
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/chat/send', {
        sessionId,
        message: userMessage,
        history: messages
      });

      const data = response.data;
      const text = data.reply || "Lo siento, hubo un error al procesar tu solicitud.";

      if (text.includes('[TRANSFERIR_A_HUMANO]')) {
        const cleanText = text.replace('[TRANSFERIR_A_HUMANO]', '').trim();
        if (cleanText) {
          const modelMsg = { role: 'model' as const, content: cleanText };
          setMessages(prev => [...prev, modelMsg]);
          saveMessage(modelMsg.role, modelMsg.content);
        }
        const transferMsg = { role: 'model' as const, content: 'Entiendo que necesitas ayuda más especializada. Te estoy transfiriendo con un agente humano...' };
        setMessages(prev => [...prev, transferMsg]);
        saveMessage(transferMsg.role, transferMsg.content);
        setIsHumanAgent(true);
      } else {
        const modelMsg = { role: 'model' as const, content: text };
        setMessages(prev => [...prev, modelMsg]);
        saveMessage(modelMsg.role, modelMsg.content);
      }
    } catch (error) {
      console.error("Error calling backend chat:", error);
      const errorMsg = { role: 'model' as const, content: "Lo siento, estoy teniendo problemas técnicos. ¿Te gustaría que te transfiera con un agente humano?" };
      setMessages(prev => [...prev, errorMsg]);
      saveMessage(errorMsg.role, errorMsg.content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 md:w-96 h-[500px] flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0F158F] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  {isHumanAgent ? <Headset className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm">{isHumanAgent ? 'Agente Humano' : 'Asistente IA'}</h3>
                  <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">
                    {isHumanAgent ? 'En línea' : 'Soporte 24/7'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-1 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`p-2 rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-400 border border-gray-200'
                    }`}>
                      {msg.role === 'user' ? <User className="h-4 w-4" /> : (msg.role === 'admin' ? <Headset className="h-4 w-4" /> : <Bot className="h-4 w-4" />)}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-[#0F158F] text-white rounded-tr-none' 
                        : (msg.role === 'admin' ? 'bg-green-50 text-gray-800 border border-green-100 rounded-tl-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none')
                    }`}>
                      <div className="markdown-body prose prose-sm max-w-none">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Escribe tu mensaje..."
                  className="flex-grow px-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F158F] transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#0F158F] text-white p-2 rounded-xl hover:bg-blue-900 disabled:opacity-50 transition-all shadow-md"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0F158F] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform active:scale-95 flex items-center justify-center"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
