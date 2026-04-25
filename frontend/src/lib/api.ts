import { API_BASE_URL } from '@/config/constants';
import type {
  ApiResponse,
  User,
  Book,
  BookListResponse,
  BookSearchParams,
  CreateBookRequest,
  UpdateBookRequest,
  Order,
  CreateOrderRequest,
  Conversation,
  Message,
  SendMessageRequest,
  Review,
  CreateReviewRequest,
  LoginRequest,
  LoginResponse,
  CreateUserRequest,
  UpdateUserRequest,
} from '@shared/types/api';

function getToken(): string | null {
  return localStorage.getItem('bc_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  return data as ApiResponse<T>;
}

export const apiService = {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  signup: (data: CreateUserRequest) =>
    request<LoginResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: LoginRequest) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request<User>('/api/auth/me'),

  updateProfile: (data: UpdateUserRequest) =>
    request<User>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Books ──────────────────────────────────────────────────────────────────
  getBooks: (params?: BookSearchParams) => {
    const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : '';
    return request<BookListResponse>(`/api/books${qs}`);
  },

  getBook: (id: string) => request<{ book: Book; seller: { id: string; name: string; school?: string; avatar?: string; reputationScore: number }; isFavorited: boolean }>(`/api/books/${id}`),

  createBook: (data: CreateBookRequest) =>
    request<Book>('/api/books', { method: 'POST', body: JSON.stringify(data) }),

  updateBook: (id: string, data: UpdateBookRequest) =>
    request<Book>(`/api/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteBook: (id: string) =>
    request<null>(`/api/books/${id}`, { method: 'DELETE' }),

  toggleFavorite: (id: string) =>
    request<{ favorited: boolean }>(`/api/books/${id}/favorite`, { method: 'POST' }),

  getFavorites: () => request<import('@shared/types/api').Favorite[]>('/api/books/user/favorites'),

  // ─── Orders ────────────────────────────────────────────────────────────────
  getOrders: () => request<Order[]>('/api/orders'),

  createOrder: (data: CreateOrderRequest & { sellerId: string; price: number }) =>
    request<Order>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateOrderStatus: (id: string, status: string, extra?: { trackingNumber?: string; notes?: string }) =>
    request<Order>(`/api/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, ...extra }) }),

  // ─── Messages ─────────────────────────────────────────────────────────────
  getConversations: () => request<Conversation[]>('/api/messages/conversations'),

  getMessages: (conversationId: string) => request<Message[]>(`/api/messages/${conversationId}`),

  sendMessage: (data: SendMessageRequest) =>
    request<{ message: Message; conversationId: string }>('/api/messages/send', { method: 'POST', body: JSON.stringify(data) }),

  // ─── Reviews ─────────────────────────────────────────────────────────────
  getUserReviews: (userId: string) => request<Review[]>(`/api/reviews/user/${userId}`),

  createReview: (data: CreateReviewRequest) =>
    request<Review>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
};
