import { db } from '../db';
import { users, insertUserSchema } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { InsertUser } from '../db/schema';

export const usersRepository = {
  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  },

  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  },

  async create(data: z.infer<typeof insertUserSchema>) {
    const result = await db.insert(users).values(data as InsertUser).returning();
    return result[0];
  },

  async update(id: string, data: Partial<z.infer<typeof insertUserSchema>>) {
    const result = await db
      .update(users)
      .set({ ...data as Partial<InsertUser>, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || null;
  },
};
