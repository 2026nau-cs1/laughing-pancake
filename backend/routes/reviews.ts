import { Router, Request, Response } from 'express';
import { reviewsRepository } from '../repositories/reviews';
import { insertReviewSchema } from '../db/schema';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'bookcircle-secret-key';

function getUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const result = await reviewsRepository.findByUser(userId);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '获取评价失败' });
  }
});

// POST /api/reviews
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const validated = insertReviewSchema.parse({ ...req.body, reviewerId: userId });
    const review = await reviewsRepository.create(validated);
    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '提交评价失败' });
  }
});

export default router;
