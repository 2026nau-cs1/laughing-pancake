import { USE_MOCK_DATA, mockConversations, mockMessages, mockBooks, mockUsers, generateId, type MessageRecord, type ConversationRecord } from '../db';
import { z } from 'zod';

const insertMessageSchema = z.object({
  conversationId: z.string(),
  senderId: z.string(),
  content: z.string().min(1),
});

const insertConversationSchema = z.object({
  bookId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  lastMessage: z.string().optional(),
});

export const messagesRepository = {
  async getConversations(userId: string) {
    if (USE_MOCK_DATA) {
      return mockConversations
        .filter(c => c.buyerId === userId || c.sellerId === userId)
        .map(conversation => ({
          conversation,
          book: {
            id: mockBooks.find(b => b.id === conversation.bookId)?.id || '',
            title: mockBooks.find(b => b.id === conversation.bookId)?.title || '',
            images: mockBooks.find(b => b.id === conversation.bookId)?.images || [],
          },
          buyer: {
            id: mockUsers.find(u => u.id === conversation.buyerId)?.id || '',
            name: mockUsers.find(u => u.id === conversation.buyerId)?.name || '',
            avatar: mockUsers.find(u => u.id === conversation.buyerId)?.avatar,
          },
        }))
        .sort((a, b) => {
          const timeA = a.conversation.lastMessageAt ? new Date(a.conversation.lastMessageAt).getTime() : 0;
          const timeB = b.conversation.lastMessageAt ? new Date(b.conversation.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });
    }
    return [];
  },

  async getMessages(conversationId: string) {
    if (USE_MOCK_DATA) {
      return mockMessages
        .filter(m => m.conversationId === conversationId)
        .map(message => ({
          message,
          sender: {
            id: mockUsers.find(u => u.id === message.senderId)?.id || '',
            name: mockUsers.find(u => u.id === message.senderId)?.name || '',
            avatar: mockUsers.find(u => u.id === message.senderId)?.avatar,
          },
        }))
        .sort((a, b) => new Date(a.message.createdAt).getTime() - new Date(b.message.createdAt).getTime());
    }
    return [];
  },

  async findOrCreateConversation(bookId: string, buyerId: string, sellerId: string): Promise<ConversationRecord> {
    if (USE_MOCK_DATA) {
      const existing = mockConversations.find(c => c.bookId === bookId && c.buyerId === buyerId);
      if (existing) return existing;

      const newConversation: ConversationRecord = {
        id: generateId(),
        bookId,
        buyerId,
        sellerId,
        lastMessage: undefined,
        lastMessageAt: undefined,
        buyerUnread: 0,
        sellerUnread: 0,
        createdAt: new Date(),
      };
      mockConversations.push(newConversation);
      return newConversation;
    }
    throw new Error('Database not configured');
  },

  async sendMessage(conversationId: string, senderId: string, content: string, isBuyer: boolean): Promise<MessageRecord> {
    if (USE_MOCK_DATA) {
      const newMessage: MessageRecord = {
        id: generateId(),
        conversationId,
        senderId,
        content,
        createdAt: new Date(),
      };
      mockMessages.push(newMessage);

      const conversation = mockConversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();
        if (isBuyer) {
          conversation.sellerUnread++;
        } else {
          conversation.buyerUnread++;
        }
      }

      return newMessage;
    }
    throw new Error('Database not configured');
  },

  async markRead(conversationId: string, userId: string, isBuyer: boolean) {
    if (USE_MOCK_DATA) {
      const conversation = mockConversations.find(c => c.id === conversationId);
      if (conversation) {
        if (isBuyer) {
          conversation.buyerUnread = 0;
        } else {
          conversation.sellerUnread = 0;
        }
      }
    }
  },
};
