import { db } from '../db';
import { reviews, users, orders, insertReviewSchema } from '../db/schema';
import { eq, desc, avg, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { InsertReview } from '../db/schema';

export const reviewsRepository = {
  async findByUser(userId: string) {
    return db
      .select({
        review: reviews,
        reviewer: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt));
  },

  async create(data: z.infer<typeof insertReviewSchema>) {
    const result = await db.insert(reviews).values(data as InsertReview).returning();

    // Recalculate reputation score for reviewee
    const avgResult = await db
      .select({ avg: avg(reviews.rating) })
      .from(reviews)
      .where(eq(reviews.revieweeId, data.revieweeId as string));

    const newScore = Number(avgResult[0]?.avg || 5).toFixed(2);
    await db
      .update(users)
      .set({ reputationScore: newScore })
      .where(eq(users.id, data.revieweeId as string));

    return result[0];
  },

  async findByOrder(orderId: string) {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.orderId, orderId));
  },
};
