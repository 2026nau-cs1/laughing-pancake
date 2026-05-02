import { USE_MOCK_DATA, mockBooks, mockUsers, mockFavorites, generateId, type BookRecord, type User } from '../db';
import { z } from 'zod';

const insertBookSchema = z.object({
  sellerId: z.string(),
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

type BookWithSeller = {
  book: BookRecord;
  seller: {
    id: string;
    name: string;
    school?: string;
    avatar?: string;
    reputationScore: string;
  };
  isFavorited?: boolean;
};

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
    if (USE_MOCK_DATA) {
      const page = params.page || 1;
      const limit = params.limit || 20;
      const offset = (page - 1) * limit;
      const status = params.status || 'available';

      let filteredBooks = mockBooks.filter(book => {
        if (book.status !== status) return false;
        if (params.sellerId && book.sellerId !== params.sellerId) return false;
        if (params.q) {
          const query = params.q.toLowerCase();
          return book.title.toLowerCase().includes(query) ||
                 book.author.toLowerCase().includes(query) ||
                 (book.isbn && book.isbn.includes(query));
        }
        if (params.category && book.category !== params.category) return false;
        if (params.condition && book.condition !== params.condition) return false;
        if (params.minPrice !== undefined && parseFloat(book.price) < params.minPrice) return false;
        if (params.maxPrice !== undefined && parseFloat(book.price) > params.maxPrice) return false;
        return true;
      });

      filteredBooks.sort((a, b) => {
        if (params.sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
        if (params.sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
        if (params.sortBy === 'popular') return b.viewCount - a.viewCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const result = filteredBooks.slice(offset, offset + limit).map(book => ({
        book,
        seller: this.getSellerInfo(book.sellerId),
      }));

      return {
        books: result,
        total: filteredBooks.length,
        page,
        limit,
      };
    }
    return { books: [], total: 0, page: 1, limit: 20 };
  },

  getSellerInfo(sellerId: string) {
    const seller = mockUsers.find(u => u.id === sellerId);
    return seller ? {
      id: seller.id,
      name: seller.name,
      school: seller.school,
      avatar: seller.avatar,
      reputationScore: seller.reputationScore,
    } : null;
  },

  async findById(id: string, userId?: string): Promise<BookWithSeller | null> {
    if (USE_MOCK_DATA) {
      const book = mockBooks.find(b => b.id === id);
      if (!book) return null;

      book.viewCount++;

      const isFavorited = userId ? mockFavorites.some(f => f.userId === userId && f.bookId === id) : false;

      return {
        book,
        seller: this.getSellerInfo(book.sellerId)!,
        isFavorited,
      };
    }
    return null;
  },

  async create(data: z.infer<typeof insertBookSchema>): Promise<BookRecord> {
    if (USE_MOCK_DATA) {
      const newBook: BookRecord = {
        id: generateId(),
        sellerId: data.sellerId,
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        publisher: data.publisher,
        publishYear: data.publishYear,
        category: data.category,
        condition: data.condition,
        price: data.price,
        originalPrice: data.originalPrice,
        description: data.description,
        images: data.images || [],
        status: data.status || 'available',
        viewCount: 0,
        favoriteCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockBooks.push(newBook);
      return newBook;
    }
    throw new Error('Database not configured');
  },

  async update(id: string, sellerId: string, data: Partial<z.infer<typeof insertBookSchema>>): Promise<BookRecord | null> {
    if (USE_MOCK_DATA) {
      const index = mockBooks.findIndex(b => b.id === id && b.sellerId === sellerId);
      if (index !== -1) {
        mockBooks[index] = { ...mockBooks[index], ...data, updatedAt: new Date() };
        return mockBooks[index];
      }
    }
    return null;
  },

  async delete(id: string, sellerId: string): Promise<boolean> {
    if (USE_MOCK_DATA) {
      const index = mockBooks.findIndex(b => b.id === id && b.sellerId === sellerId);
      if (index !== -1) {
        mockBooks[index].status = 'removed';
        mockBooks[index].updatedAt = new Date();
        return true;
      }
    }
    return false;
  },

  async toggleFavorite(userId: string, bookId: string) {
    if (USE_MOCK_DATA) {
      const index = mockFavorites.findIndex(f => f.userId === userId && f.bookId === bookId);
      if (index !== -1) {
        mockFavorites.splice(index, 1);
        const book = mockBooks.find(b => b.id === bookId);
        if (book) book.favoriteCount--;
        return { favorited: false };
      } else {
        mockFavorites.push({
          id: generateId(),
          userId,
          bookId,
          createdAt: new Date(),
        });
        const book = mockBooks.find(b => b.id === bookId);
        if (book) book.favoriteCount++;
        return { favorited: true };
      }
    }
    return { favorited: false };
  },

  async getUserFavorites(userId: string) {
    if (USE_MOCK_DATA) {
      return mockFavorites
        .filter(f => f.userId === userId)
        .map(f => {
          const book = mockBooks.find(b => b.id === f.bookId);
          if (!book) return null;
          return {
            favorite: f,
            book,
            seller: this.getSellerInfo(book.sellerId),
          };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b!.favorite.createdAt).getTime() - new Date(a!.favorite.createdAt).getTime());
    }
    return [];
  },
};
