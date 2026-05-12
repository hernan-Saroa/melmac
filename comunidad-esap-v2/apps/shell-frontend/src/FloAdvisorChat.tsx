import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Sparkles, Loader2 } from 'lucide-react';
import { fetchLegacy } from './lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  date: Date;
}

export default function FloAdvisorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy FLO AI ✨, tu asesor experto en la norma AGN y el SGDEA. ¿En qué te puedo ayudar hoy con Melmac Docs?',
      date: new Date()
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;

    const userText = message.trim();
    setMessage('');
    
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userText, date: new Date() }
    ];
    
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Preparamos el historial omitiendo el primer mensaje de saludo estático si es necesario, 
      // pero por lo general se envía todo el historial.
      const historyToSend = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Proxy hacia Django
      const response = await fetchLegacy('/flo-ai/consult/', {
        method: 'POST',
        body: JSON.stringify({ messages: historyToSend })
      });

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response || 'No recibí respuesta de mi cerebro neuronal.', date: new Date() }
      ]);
      
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Hubo un error de conexión con mi red neuronal. Por favor, intenta de nuevo.', date: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl transition-all duration-300 z-50 group flex items-center justify-center ${
          isOpen ? 'bg-rose-500 hover:bg-rose-600 rotate-90' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Bot className="w-6 h-6 text-white group-hover:animate-pulse" />
        )}
        
        {/* Badge indicador flotante (Solo si está cerrado) */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="p-4 bg-indigo-600 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center relative">
              <Bot className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">FLO AI</h3>
              <p className="text-indigo-100 text-xs">Asesor AGN Inteligente</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                )}
                
                <div className={`max-w-[75%] p-3 text-sm shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                    {msg.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu consulta sobre SGDEA..."
                className="flex-1 bg-slate-50 border border-slate-200 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
