import React, { useState } from 'react';
import {
  MessageSquare, Send, AlertTriangle, Search,
  Phone, Clock, User
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { mockConversations, mockMessages } from '../lib/mockData';
import type { Conversation, Message } from '../types';
import { formatRelativeTime, formatDate, getInitials } from '../utils/helpers';
import { cn } from '../utils/cn';

export const InboxPage: React.FC = () => {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(mockConversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [search, setSearch] = useState('');

  const filteredConversations = mockConversations.filter(c =>
    c.guestName.toLowerCase().includes(search.toLowerCase()) ||
    c.roomNumber.includes(search)
  );

  const currentMessages = messages.filter(m => m.stayId === selectedConv?.stayId);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConv) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      hotelId: 'hotel-001',
      stayId: selectedConv.stayId,
      guestId: selectedConv.guestId,
      sender: 'reception',
      content: newMessage,
      status: 'sent',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const quickReplies = [
    'Bien reçu, nous nous en occupons immédiatement.',
    'Merci pour votre message. Un membre de l\'équipe vous contacte sous peu.',
    'Votre demande est en cours de traitement.',
    'Nous vous souhaitons une excellente soirée !',
  ];

  return (
    <div className="h-[calc(100vh-64px)] flex fade-in">
      {/* Conversations List */}
      <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-900">
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {filteredConversations.map(conv => (
            <button
              key={conv.stayId}
              onClick={() => setSelectedConv(conv)}
              className={cn(
                'w-full text-left p-4 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors',
                selectedConv?.stayId === conv.stayId && 'bg-slate-800/50 border-l-2 border-l-amber-400'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    conv.isUrgent ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30' : 'bg-amber-500/20 text-amber-400'
                  )}>
                    {getInitials(conv.guestName.split(' ')[0], conv.guestName.split(' ')[1] || '')}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center font-medium">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn('text-sm font-medium', conv.unreadCount > 0 ? 'text-white' : 'text-slate-300')}>
                      {conv.guestName}
                    </span>
                    <span className="text-slate-600 text-xs">{formatRelativeTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-slate-500 text-xs">Ch. {conv.roomNumber}</span>
                    {conv.isUrgent && (
                      <Badge variant="error" size="sm">
                        <AlertTriangle className="w-2 h-2" /> Urgent
                      </Badge>
                    )}
                  </div>
                  <p className={cn(
                    'text-xs truncate',
                    conv.unreadCount > 0 ? 'text-slate-300' : 'text-slate-500'
                  )}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold',
                selectedConv.isUrgent ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              )}>
                {getInitials(selectedConv.guestName.split(' ')[0], selectedConv.guestName.split(' ')[1] || '')}
              </div>
              <div>
                <h3 className="text-white font-semibold">{selectedConv.guestName}</h3>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" /> Ch. {selectedConv.roomNumber}
                  </span>
                  {selectedConv.stay && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Départ {new Date(selectedConv.stay.checkOutDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {selectedConv.guest?.language && (
                    <span>🌐 {selectedConv.guest.language.toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedConv.isUrgent && (
                <Badge variant="error">
                  <AlertTriangle className="w-3 h-3" /> Urgent
                </Badge>
              )}
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl hover:bg-emerald-500/20 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                Appeler
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hidden">
            {currentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
                <p className="text-slate-500">Début de la conversation</p>
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.sender === 'reception' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.sender !== 'reception' && (
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0 mt-1">
                      {selectedConv.guestName.charAt(0)}
                    </div>
                  )}
                  <div className={cn(
                    'max-w-md',
                    msg.sender === 'reception' ? 'items-end' : 'items-start',
                    'flex flex-col gap-1'
                  )}>
                    <div className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.sender === 'reception'
                        ? 'bg-amber-500/20 text-amber-50 rounded-tr-sm'
                        : msg.sender === 'system'
                        ? 'bg-slate-700/50 text-slate-400 text-xs'
                        : 'bg-slate-800 text-white rounded-tl-sm'
                    )}>
                      {msg.content}
                    </div>
                    <span className={cn(
                      'text-xs text-slate-600',
                      msg.sender === 'reception' ? 'text-right' : 'text-left'
                    )}>
                      {formatDate(msg.createdAt)}
                      {msg.sender === 'reception' && (
                        <span className="ml-1">
                          {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Replies */}
          <div className="px-6 py-2 border-t border-slate-800/50">
            <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-1">
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => setNewMessage(reply)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 rounded-full transition-all"
                >
                  {reply.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-slate-800">
            <div className="flex items-end gap-3">
              <div className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 focus-within:ring-1 focus-within:ring-amber-500/50 focus-within:border-amber-500/50 transition-all">
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Écrire un message..."
                  rows={2}
                  className="w-full bg-transparent text-white text-sm placeholder-slate-500 resize-none focus:outline-none"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!newMessage.trim()}
                className="p-3 gradient-gold rounded-xl text-slate-900 hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400">Sélectionnez une conversation</p>
          </div>
        </div>
      )}
    </div>
  );
};
