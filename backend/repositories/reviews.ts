import { USE_MOCK_DATA, mockReviews, mockUsers, mockOrders, generateId, type ReviewRecord } from '../db';
import { z } from 'zod';

const insertReviewSchema = z.object({
  orderId: z.string(),
  reviewerId: z.string(),
  revieweeId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1),
  role: z.enum(['buyer', 'seller']),
});

export const reviewsRepository = {
  async findByUser(userId: string) {
    if (USE_MOCK_DATA) {
      return mockReviews
        .filter(r => r.revieweeId === userId)
        .map(review => ({
          review,
          reviewer: {
            id: mockUsers.find(u => u.id === review.reviewerId)?.id || '',
            name: mockUsers.find(u => u.id === review.reviewerId)?.name || '',
            avatar: mockUsers.find(u => u.id === review.reviewerId)?.avatar,
          },
        }))
        .sort((a, b) => new Date(b.review.createdAt).getTime() - new Date(a.review.createdAt).getTime());
    }
    return [];
  },

  async create(data: z.infer<typeof insertReviewSchema>): Promise<ReviewRecord> {
    if (USE_MOCK_DATA) {
      const newReview: ReviewRecord = {
        id: generateId(),
        orderId: data.orderId,
        reviewerId: data.reviewerId,
        revieweeId: data.revieweeId,
        rating: data.rating,
        comment: data.comment,
        role: data.role,
        createdAt: new Date(),
      };
      mockReviews.push(newReview);

      const reviewee = mockUsers.find(u => u.id === data.revieweeId);
      if (reviewee) {
        const userReviews = mockReviews.filter(r => r.revieweeId === data.revieweeId);
        const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
        reviewee.reputationScore = avgRating.toFixed(2);
      }

      return newReview;
    }
    throw new Error('Database not configured');
  },

  async findByOrder(orderId: string) {
    if (USE_MOCK_DATA) {
      return mockReviews.filter(r => r.orderId === orderId);
    }
    return [];
  },
};
