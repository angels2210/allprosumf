import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User, Bot, Loader2, Headset, Clock } from 'lucide-react';
import Markdown from 'react-markdown';
import { api } from '../services/api';

interface Message {
  id: number;
  session_id: string;
  role: 'user' | 'model' | 'admin';
  content: string;
  created_at: string;
}

interface Session {
  session_id: string;
  last_message: string;
  last_content: string;
}

export default function SupportChatAdmin() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await api.get('/chat/sessions');
        setSessions(response.data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch messages for selected session
  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/chat/messages/${selectedSession}`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedSession]);

  const handleSend = async () => {
    if (!input.trim() || !selectedSession || isLoading) return;

    const content = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await api.post('/chat/messages', { sessionId: selectedSession, role: 'admin', content });
      
      // Optimistic update
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        session_id: selectedSession, 
        role: 'admin', 
        content, 
        created_at: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] flex overflow-hidden">
      {/* Sidebar - Sessions */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#0F158F]" />
            Chats Activos
          </h3>
        </div>
        <div className="flex-grow overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No hay chats activos
            </div>
          ) : (
            sessions.map(session => (
              <button
                key={session.session_id}
                onClick={() => setSelectedSession(session.session_id)}
                className={`w-full p-4 text-left border-b border-gray-50 transition-colors hover:bg-blue-50 ${
                  selectedSession === session.session_id ? 'bg-blue-50 border-l-4 border-l-[#0F158F]' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-gray-900">ID: {session.session_id}</span>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(session.last_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{session.last_content}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-grow flex flex-col bg-gray-50">
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Usuario {selectedSession}</h3>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">En línea</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={msg.id || idx} 
                  className={`flex ${msg.role === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`p-2 rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'admin' ? 'bg-blue-600 text-white' : (msg.role === 'user' ? 'bg-white text-gray-400 border border-gray-200' : 'bg-gray-200 text-gray-600')
                    }`}>
                      {msg.role === 'admin' ? <Headset className="h-4 w-4" /> : (msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />)}
                    </div>
                    <div>
                      <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                        msg.role === 'admin' 
                          ? 'bg-[#0F158F] text-white rounded-tr-none' 
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                      }`}>
                        <div className="markdown-body prose prose-sm max-w-none">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
                  placeholder="Escribe una respuesta..."
                  className="flex-grow px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F158F] transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#0F158F] text-white px-6 rounded-xl hover:bg-blue-900 disabled:opacity-50 transition-all shadow-md flex items-center gap-2 font-bold"
                >
                  <Send className="h-5 w-5" />
                  Enviar
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-12">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
              <MessageCircle className="h-12 w-12 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Selecciona un chat</h3>
            <p className="text-gray-500 text-sm max-w-xs">
              Elige una conversación de la lista de la izquierda para comenzar a chatear con los clientes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
