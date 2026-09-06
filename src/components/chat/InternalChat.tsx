import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Conversation, ChatMessage } from '../../types';
import {
  MessageSquare,
  Send,
  Headset,
  Car,
} from 'lucide-react';

export const InternalChat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: number) => {
    try {
      const data = await api.getMessages(convId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      const interval = setInterval(() => {
        fetchMessages(activeConvId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !text.trim()) return;

    const sendingText = text.trim();
    setText('');
    try {
      await api.sendMessage(activeConvId, sendingText);
      await fetchMessages(activeConvId);
    } catch (err) {
      console.error(err);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar: Conversations List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col bg-slate-50/60">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <span>پیام‌های رانندگان</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">ارتباط مستقیم راننده با مرکز پیام</p>
          </div>
          <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-200">
            آنلاین
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`w-full p-3.5 text-right transition flex items-start gap-3 cursor-pointer ${
                activeConvId === conv.id
                  ? 'bg-teal-50/80 border-r-4 border-r-teal-600 text-slate-900 font-semibold'
                  : 'hover:bg-slate-100/70 text-slate-700'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 border border-slate-300">
                {conv.driver_name ? <Car className="w-4 h-4 text-teal-700" /> : <Headset className="w-4 h-4 text-teal-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-xs truncate text-slate-800">
                    {conv.driver_name ? `${conv.driver_name} (${conv.car_name || 'ناوگان'})` : 'مرکز پشتیبانی'}
                  </span>
                  <span className="text-[10px] text-slate-400">{conv.updated_at?.slice(11, 16)}</span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {typeof conv.last_message === 'string'
                    ? conv.last_message
                    : (conv.last_message?.content || 'مکالمه جدید')}
                </p>
              </div>
            </button>
          ))}

          {conversations.length === 0 && !loading && (
            <div className="p-6 text-center text-xs text-slate-400">گفتگویی یافت نشد.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                  {activeConv.driver_name ? activeConv.driver_name.charAt(0) : 'پ'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">
                    {activeConv.driver_name ? activeConv.driver_name : 'مرکز پیام آژانس تاکسی پردیس'}
                  </h4>
                  <span className="text-[10px] text-teal-600 font-medium">خط ارتباطی امن ناوگان</span>
                </div>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] shrink-0 font-bold">
                      {msg.sender_name?.charAt(0) || 'ک'}
                    </div>
                    <div
                      className={`max-w-[80%] sm:max-w-md p-3 text-[11px] leading-relaxed shadow-xs ${
                        isMe
                          ? 'bg-teal-600 text-white rounded-2xl rounded-tl-none'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tr-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-80">
                        <span className="font-bold">{msg.sender_name}</span>
                        <span>{msg.created_at?.slice(11, 16)}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content || msg.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="پیام به راننده یا اپراتور..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-full pr-4 pl-10 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="absolute left-2.5 top-2 text-teal-600 hover:text-teal-700 disabled:opacity-40"
                  aria-label="ارسال"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
            <MessageSquare className="w-12 h-12 opacity-30 mb-2 text-slate-400" />
            <span>یک گفتگو را از لیست سمت راست انتخاب فرمایید.</span>
          </div>
        )}
      </div>
    </div>
  );
};
