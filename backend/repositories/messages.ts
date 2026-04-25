import { db } from '../db';
import { conversations, messages, books, users, insertMessageSchema, insertConversationSchema } from '../db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { InsertMessage, InsertConversation } from '../db/schema';

export const messagesRepository = {
  async getConversations(userId: string) {
    return db
      .select({
        conversation: conversations,
        book: {
          id: books.id,
          title: books.title,
          images: books.images,
        },
        buyer: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(conversations)
      .innerJoin(books, eq(conversations.bookId, books.id))
      .innerJoin(users, eq(conversations.buyerId, users.id))
      .where(or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId)))
      .orderBy(desc(conversations.lastMessageAt));
  },

  async getMessages(conversationId: string) {
    return db
      .select({
        message: messages,
        sender: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  },

  async findOrCreateConversation(bookId: string, buyerId: string, sellerId: string) {
    const existing = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.bookId, bookId), eq(conversations.buyerId, buyerId)))
      .limit(1);

    if (existing[0]) return existing[0];

    const data: z.infer<typeof insertConversationSchema> = { bookId, buyerId, sellerId };
    const result = await db.insert(conversations).values(data as InsertConversation).returning();
    return result[0];
  },

  async sendMessage(conversationId: string, senderId: string, content: string, isBuyer: boolean) {
    const data: z.infer<typeof insertMessageSchema> = { conversationId, senderId, content };
    const msg = await db.insert(messages).values(data as InsertMessage).returning();

    // Update conversation last message
    const unreadField = isBuyer ? { sellerUnread: sql`seller_unread + 1` } : { buyerUnread: sql`buyer_unread + 1` };
    await db
      .update(conversations)
      .set({ lastMessage: content, lastMessageAt: new Date(), ...unreadField })
      .where(eq(conversations.id, conversationId));

    return msg[0];
  },

  async markRead(conversationId: string, userId: string, isBuyer: boolean) {
    const field = isBuyer ? { buyerUnread: 0 } : { sellerUnread: 0 };
    await db.update(conversations).set(field).where(eq(conversations.id, conversationId));
  },
};
