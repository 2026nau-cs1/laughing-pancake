import { useState, useEffect, useRef } from 'react';
import { apiService } from '@/lib/api';
import type { User, Conversation, Message } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User;
}

const BOOK_IMAGES = ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80'];

export default function MessagesView({ onNavigate, user }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshConversations = async () => {
    const res = await apiService.getConversations();
    if (res.success && res.data) setConversations(res.data);
  };

  const refreshMessages = async (convId: string) => {
    const res = await apiService.getMessages(convId);
    if (res.success && res.data) setMessages(res.data);
  };

  useEffect(() => {
    let cancelled = false;
    apiService.getConversations().then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setConversations(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedConvId) return;
    let cancelled = false;
    apiService.getMessages(selectedConvId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setMessages(res.data);
    });
    return () => { cancelled = true; };
  }, [selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvId) return;
    const conv = conversations.find((c) => c.id === selectedConvId);
    if (!conv) return;
    setSending(true);
    const res = await apiService.sendMessage({
      conversationId: selectedConvId,
      bookId: conv.bookId,
      receiverId: conv.buyerId === user.id ? conv.sellerId : conv.buyerId,
      content: newMessage,
    });
    setSending(false);
    if (res.success) {
      setNewMessage('');
      refreshMessages(selectedConvId);
      refreshConversations();
    } else {
      toast.error('发送失败');
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherPartyName = selectedConv
    ? (selectedConv.buyerId === user.id ? selectedConv.sellerName : selectedConv.buyerName)
    : '';

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>消息</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6" style={{ minHeight: '500px' }}>
        {/* Conversation List */}
        <div className={`lg:col-span-1 ${selectedConvId ? 'hidden lg:block' : ''}`}>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: '#E2D9CF' }} />
                <p className="text-sm" style={{ color: '#6B6560' }}>暂无消息</p>
                <p className="text-xs mt-1" style={{ color: '#6B6560' }}>浏览书籍并联系卖家开始聊天</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const unread = conv.unreadCount;
                const otherName = conv.buyerId === user.id ? conv.sellerName : conv.buyerName;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: selectedConvId === conv.id ? 'rgba(45,74,62,0.06)' : '#FFFFFF',
                      borderBottom: '1px solid #E2D9CF',
                    }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E2D9CF' }}>
                      <span className="text-sm font-bold" style={{ color: '#6B6560' }}>{otherName[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{otherName}</span>
                        {unread > 0 && (
                          <span className="text-xs text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#C0392B' }}>{unread}</span>
                        )}
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#6B6560' }}>
                        {conv.bookTitle}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs truncate mt-0.5" style={{ color: '#6B6560' }}>{conv.lastMessage}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={`lg:col-span-2 ${!selectedConvId ? 'hidden lg:flex' : 'flex'} flex-col`}>
          {!selectedConvId ? (
            <div className="flex-1 flex items-center justify-center rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#E2D9CF' }} />
                <p className="text-sm" style={{ color: '#6B6560' }}>选择一个会话开始聊天</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', height: '600px' }}>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #E2D9CF', backgroundColor: '#F7F3EE' }}>
                <button
                  onClick={() => setSelectedConvId(null)}
                  className="lg:hidden p-1 rounded-lg"
                  style={{ color: '#6B6560' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E2D9CF' }}>
                  <span className="text-xs font-bold" style={{ color: '#6B6560' }}>{otherPartyName[0]}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{otherPartyName}</div>
                  <div className="text-xs" style={{ color: '#6B6560' }}>{selectedConv?.bookTitle}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: '#6B6560' }}>发送第一条消息开始聊天吧！</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className="max-w-[75%] px-4 py-2.5 rounded-2xl text-sm"
                          style={{
                            backgroundColor: isMe ? '#2D4A3E' : '#F7F3EE',
                            color: isMe ? '#FFFFFF' : '#1A1A1A',
                            borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          }}
                        >
                          {msg.content}
                          <div className="text-xs mt-1 opacity-60">
                            {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-3 p-4" style={{ borderTop: '1px solid #E2D9CF' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="输入消息..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: '#2D4A3E' }}
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
