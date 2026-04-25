import { db } from '../db';
import { orders, books, users, insertOrderSchema } from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import type { InsertOrder } from '../db/schema';

export const ordersRepository = {
  async findByUser(userId: string) {
    return db
      .select({
        order: orders,
        book: {
          id: books.id,
          title: books.title,
          images: books.images,
        },
        buyer: {
          id: users.id,
          name: users.name,
        },
      })
      .from(orders)
      .innerJoin(books, eq(orders.bookId, books.id))
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(or(eq(orders.buyerId, userId), eq(orders.sellerId, userId)))
      .orderBy(desc(orders.createdAt));
  },

  async findById(id: string) {
    const result = await db
      .select({
        order: orders,
        book: {
          id: books.id,
          title: books.title,
          images: books.images,
          author: books.author,
        },
        buyer: {
          id: users.id,
          name: users.name,
          phone: users.phone,
        },
      })
      .from(orders)
      .innerJoin(books, eq(orders.bookId, books.id))
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(eq(orders.id, id))
      .limit(1);
    return result[0] || null;
  },

  async create(data: z.infer<typeof insertOrderSchema>) {
    const result = await db.insert(orders).values(data as InsertOrder).returning();
    // Mark book as reserved
    await db.update(books).set({ status: 'reserved' }).where(eq(books.id, data.bookId as string));
    return result[0];
  },

  async updateStatus(id: string, userId: string, status: string, extra?: { trackingNumber?: string; notes?: string }) {
    const result = await db
      .update(orders)
      .set({ status, ...extra, updatedAt: new Date() })
      .where(and(eq(orders.id, id), or(eq(orders.buyerId, userId), eq(orders.sellerId, userId))))
      .returning();

    // If confirmed, mark book as sold and update seller stats
    if (status === 'confirmed' && result[0]) {
      await db.update(books).set({ status: 'sold' }).where(eq(books.id, result[0].bookId));
    }
    // If cancelled, mark book as available again
    if (status === 'cancelled' && result[0]) {
      await db.update(books).set({ status: 'available' }).where(eq(books.id, result[0].bookId));
    }

    return result[0] || null;
  },
};
