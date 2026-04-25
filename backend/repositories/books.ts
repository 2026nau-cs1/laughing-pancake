import { db } from '../db';
import { books, users, favorites, insertBookSchema } from '../db/schema';
import { eq, and, ilike, or, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { InsertBook } from '../db/schema';

export const booksRepository = {
  async findAll(params: {
    q?: string;
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
    sellerId?: string;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        book: books,
        seller: {
          id: users.id,
          name: users.name,
          school: users.school,
          avatar: users.avatar,
          reputationScore: users.reputationScore,
        },
      })
      .from(books)
      .innerJoin(users, eq(books.sellerId, users.id))
      .$dynamic();

    const conditions = [];

    const status = params.status || 'available';
    conditions.push(eq(books.status, status));

    if (params.sellerId) {
      conditions.push(eq(books.sellerId, params.sellerId));
    }

    if (params.q) {
      conditions.push(
        or(
          ilike(books.title, `%${params.q}%`),
          ilike(books.author, `%${params.q}%`),
          ilike(books.isbn, `%${params.q}%`)
        )!
      );
    }

    if (params.category) {
      conditions.push(eq(books.category, params.category));
    }

    if (params.condition) {
      conditions.push(eq(books.condition, params.condition));
    }

    if (params.minPrice !== undefined) {
      conditions.push(gte(books.price, String(params.minPrice)));
    }

    if (params.maxPrice !== undefined) {
      conditions.push(lte(books.price, String(params.maxPrice)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    if (params.sortBy === 'price_asc') {
      query = query.orderBy(asc(books.price)) as typeof query;
    } else if (params.sortBy === 'price_desc') {
      query = query.orderBy(desc(books.price)) as typeof query;
    } else if (params.sortBy === 'popular') {
      query = query.orderBy(desc(books.viewCount)) as typeof query;
    } else {
      query = query.orderBy(desc(books.createdAt)) as typeof query;
    }

    const results = await query.limit(limit).offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      books: results,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    };
  },

  async findById(id: string, userId?: string) {
    const result = await db
      .select({
        book: books,
        seller: {
          id: users.id,
          name: users.name,
          school: users.school,
          avatar: users.avatar,
          reputationScore: users.reputationScore,
        },
      })
      .from(books)
      .innerJoin(users, eq(books.sellerId, users.id))
      .where(eq(books.id, id))
      .limit(1);

    if (!result[0]) return null;

    // Increment view count
    await db
      .update(books)
      .set({ viewCount: sql`${books.viewCount} + 1` })
      .where(eq(books.id, id));

    let isFavorited = false;
    if (userId) {
      const fav = await db
        .select()
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.bookId, id)))
        .limit(1);
      isFavorited = fav.length > 0;
    }

    return { ...result[0], isFavorited };
  },

  async create(data: z.infer<typeof insertBookSchema>) {
    const result = await db.insert(books).values(data as InsertBook).returning();
    return result[0];
  },

  async update(id: string, sellerId: string, data: Partial<z.infer<typeof insertBookSchema>>) {
    const result = await db
      .update(books)
      .set({ ...data as Partial<InsertBook>, updatedAt: new Date() })
      .where(and(eq(books.id, id), eq(books.sellerId, sellerId)))
      .returning();
    return result[0] || null;
  },

  async delete(id: string, sellerId: string) {
    const result = await db
      .update(books)
      .set({ status: 'removed', updatedAt: new Date() })
      .where(and(eq(books.id, id), eq(books.sellerId, sellerId)))
      .returning();
    return result.length > 0;
  },

  async toggleFavorite(userId: string, bookId: string) {
    const existing = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.bookId, bookId)));
      await db.update(books).set({ favoriteCount: sql`${books.favoriteCount} - 1` }).where(eq(books.id, bookId));
      return { favorited: false };
    } else {
      await db.insert(favorites).values({ userId, bookId });
      await db.update(books).set({ favoriteCount: sql`${books.favoriteCount} + 1` }).where(eq(books.id, bookId));
      return { favorited: true };
    }
  },

  async getUserFavorites(userId: string) {
    return db
      .select({
        favorite: favorites,
        book: books,
        seller: {
          id: users.id,
          name: users.name,
          school: users.school,
          avatar: users.avatar,
          reputationScore: users.reputationScore,
        },
      })
      .from(favorites)
      .innerJoin(books, eq(favorites.bookId, books.id))
      .innerJoin(users, eq(books.sellerId, users.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
  },
};
