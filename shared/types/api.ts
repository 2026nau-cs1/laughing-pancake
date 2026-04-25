// Shared API types — single source of truth for frontend ↔ backend contracts.

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── User ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  school?: string;
  grade?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  reputationScore: number;
  totalSales: number;
  totalPurchases: number;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  school?: string;
  grade?: string;
  address?: string;
  avatar?: string;
  bio?: string;
}

// ─── Book ────────────────────────────────────────────────────────────────────
export type BookCondition = 'brand_new' | 'like_new' | 'good' | 'fair' | 'poor';
export type BookCategory =
  | 'textbook'
  | 'literature'
  | 'exam_prep'
  | 'language'
  | 'computer'
  | 'science'
  | 'history'
  | 'art'
  | 'other';
export type BookStatus = 'available' | 'sold' | 'reserved' | 'removed';

export interface Book {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerSchool?: string;
  sellerAvatar?: string;
  sellerReputationScore: number;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  category: BookCategory;
  condition: BookCondition;
  price: number;
  originalPrice?: number;
  description?: string;
  images: string[];
  status: BookStatus;
  viewCount: number;
  favoriteCount: number;
  isFavorited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  category: BookCategory;
  condition: BookCondition;
  price: number;
  originalPrice?: number;
  description?: string;
  images?: string[];
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  category?: BookCategory;
  condition?: BookCondition;
  price?: number;
  originalPrice?: number;
  description?: string;
  images?: string[];
  status?: BookStatus;
}

export interface BookSearchParams {
  q?: string;
  category?: BookCategory;
  condition?: BookCondition;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  limit?: number;
}

export interface BookListResponse {
  books: Book[];
  total: number;
  page: number;
  limit: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'confirmed'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  bookId: string;
  bookTitle: string;
  bookImage?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  status: OrderStatus;
  shippingAddress?: string;
  trackingNumber?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  bookId: string;
  shippingAddress: string;
  paymentMethod: string;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  trackingNumber?: string;
  notes?: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  bookId: string;
  bookTitle: string;
  bookImage?: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  bookId: string;
  receiverId: string;
  content: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeId: string;
  rating: number;
  comment: string;
  role: 'buyer' | 'seller';
  createdAt: string;
}

export interface CreateReviewRequest {
  orderId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  role: 'buyer' | 'seller';
}

// ─── Favorite ────────────────────────────────────────────────────────────────
export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  book: Book;
  createdAt: string;
}

// ─── Report ──────────────────────────────────────────────────────────────────
export interface CreateReportRequest {
  targetType: 'book' | 'user' | 'review';
  targetId: string;
  reason: string;
  description?: string;
}
