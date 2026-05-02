import { USE_MOCK_DATA, mockOrders, mockBooks, mockUsers, generateId, type OrderRecord } from '../db';
import { z } from 'zod';

const insertOrderSchema = z.object({
  bookId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  price: z.coerce.string(),
  status: z.enum(['pending_payment', 'paid', 'shipped', 'delivered', 'confirmed', 'cancelled', 'refunded']).optional(),
  shippingAddress: z.string().optional(),
  trackingNumber: z.string().optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const ordersRepository = {
  async findByUser(userId: string) {
    if (USE_MOCK_DATA) {
      return mockOrders
        .filter(order => order.buyerId === userId || order.sellerId === userId)
        .map(order => ({
          order,
          book: {
            id: mockBooks.find(b => b.id === order.bookId)?.id || '',
            title: mockBooks.find(b => b.id === order.bookId)?.title || '',
            images: mockBooks.find(b => b.id === order.bookId)?.images || [],
          },
          buyer: {
            id: mockUsers.find(u => u.id === order.buyerId)?.id || '',
            name: mockUsers.find(u => u.id === order.buyerId)?.name || '',
          },
        }))
        .sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime());
    }
    return [];
  },

  async findById(id: string) {
    if (USE_MOCK_DATA) {
      const order = mockOrders.find(o => o.id === id);
      if (!order) return null;
      const book = mockBooks.find(b => b.id === order.bookId);
      const buyer = mockUsers.find(u => u.id === order.buyerId);
      return {
        order,
        book: book ? {
          id: book.id,
          title: book.title,
          images: book.images,
          author: book.author,
        } : null,
        buyer: buyer ? {
          id: buyer.id,
          name: buyer.name,
          phone: buyer.phone,
        } : null,
      };
    }
    return null;
  },

  async create(data: z.infer<typeof insertOrderSchema>): Promise<OrderRecord> {
    if (USE_MOCK_DATA) {
      const newOrder: OrderRecord = {
        id: generateId(),
        bookId: data.bookId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        price: data.price,
        status: data.status || 'pending_payment',
        shippingAddress: data.shippingAddress,
        trackingNumber: data.trackingNumber,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockOrders.push(newOrder);
      const book = mockBooks.find(b => b.id === data.bookId);
      if (book) book.status = 'reserved';
      return newOrder;
    }
    throw new Error('Database not configured');
  },

  async updateStatus(id: string, userId: string, status: string, extra?: { trackingNumber?: string; notes?: string }) {
    if (USE_MOCK_DATA) {
      const index = mockOrders.findIndex(o => o.id === id && (o.buyerId === userId || o.sellerId === userId));
      if (index !== -1) {
        mockOrders[index] = { ...mockOrders[index], status, ...extra, updatedAt: new Date() };
        const book = mockBooks.find(b => b.id === mockOrders[index].bookId);
        if (book) {
          if (status === 'confirmed') {
            book.status = 'sold';
          } else if (status === 'cancelled') {
            book.status = 'available';
          }
        }
        return mockOrders[index];
      }
    }
    return null;
  },
};
