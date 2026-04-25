import { pgTable, text, integer, decimal, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable('Users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  phone: text('phone'),
  school: text('school'),
  grade: text('grade'),
  address: text('address'),
  avatar: text('avatar'),
  bio: text('bio'),
  reputationScore: decimal('reputation_score', { precision: 3, scale: 2 }).default('5.00').notNull(),
  totalSales: integer('total_sales').default(0).notNull(),
  totalPurchases: integer('total_purchases').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Books ───────────────────────────────────────────────────────────────────
export const books = pgTable('Books', {
  id: uuid('id').primaryKey().defaultRandom(),
  sellerId: uuid('seller_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  author: text('author').notNull(),
  isbn: text('isbn'),
  publisher: text('publisher'),
  publishYear: integer('publish_year'),
  category: text('category').notNull().default('other'),
  condition: text('condition').notNull().default('good'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
  description: text('description'),
  images: text('images').array().default([]),
  status: text('status').notNull().default('available'),
  viewCount: integer('view_count').default(0).notNull(),
  favoriteCount: integer('favorite_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertBookSchema = createInsertSchema(books, {
  sellerId: z.string().uuid(),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(200),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  publishYear: z.coerce.number().int().min(1900).max(2030).optional(),
  category: z.enum(['textbook', 'literature', 'exam_prep', 'language', 'computer', 'science', 'history', 'art', 'other']),
  condition: z.enum(['brand_new', 'like_new', 'good', 'fair', 'poor']),
  price: z.coerce.string(),
  originalPrice: z.coerce.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['available', 'sold', 'reserved', 'removed']).optional(),
});

export type BookRecord = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orders = pgTable('Orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull().references(() => books.id),
  buyerId: uuid('buyer_id').notNull().references(() => users.id),
  sellerId: uuid('seller_id').notNull().references(() => users.id),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending_payment'),
  shippingAddress: text('shipping_address'),
  trackingNumber: text('tracking_number'),
  paymentMethod: text('payment_method'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders, {
  bookId: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  price: z.coerce.string(),
  status: z.enum(['pending_payment', 'paid', 'shipped', 'delivered', 'confirmed', 'cancelled', 'refunded']).optional(),
  shippingAddress: z.string().optional(),
  trackingNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export type OrderRecord = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Conversations ───────────────────────────────────────────────────────────
export const conversations = pgTable('Conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id').notNull().references(() => books.id),
  buyerId: uuid('buyer_id').notNull().references(() => users.id),
  sellerId: uuid('seller_id').notNull().references(() => users.id),
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at'),
  buyerUnread: integer('buyer_unread').default(0).notNull(),
  sellerUnread: integer('seller_unread').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations, {
  bookId: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  lastMessage: z.string().optional(),
});

export type ConversationRecord = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Messages ────────────────────────────────────────────────────────────────
export const messages = pgTable('Messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages, {
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1),
});

export type MessageRecord = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviews = pgTable('Reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  reviewerId: uuid('reviewer_id').notNull().references(() => users.id),
  revieweeId: uuid('reviewee_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  role: text('role').notNull().default('buyer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviews, {
  orderId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  role: z.enum(['buyer', 'seller']),
});

export type ReviewRecord = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Favorites ───────────────────────────────────────────────────────────────
export const favorites = pgTable('Favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  bookId: uuid('book_id').notNull().references(() => books.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertFavoriteSchema = createInsertSchema(favorites);
export type FavoriteRecord = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reports = pgTable('Reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').notNull().references(() => users.id),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertReportSchema = createInsertSchema(reports, {
  targetType: z.enum(['book', 'user', 'review']),
  reason: z.string().min(1),
  description: z.string().optional(),
});

export type ReportRecord = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── Uploads ─────────────────────────────────────────────────────────────────
export const uploads = pgTable('Uploads', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  s3Key: text('s3_key').notNull(),
  s3Url: text('s3_url').notNull(),
  uploadId: text('upload_id').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertUploadSchema = createInsertSchema(uploads, {
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  s3Key: z.string().min(1),
  s3Url: z.string().min(1),
  uploadId: z.string().min(1),
  status: z.string().optional(),
});

export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = typeof uploads.$inferInsert;
