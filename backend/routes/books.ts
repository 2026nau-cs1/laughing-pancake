import { Router, Request, Response } from 'express';
import { booksRepository } from '../repositories/books';
import { insertBookSchema } from '../db/schema';
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

// GET /api/books
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { q, category, condition, minPrice, maxPrice, sortBy, page, limit, sellerId, status } = req.query;
    const result = await booksRepository.findAll({
      q: q as string,
      category: category as string,
      condition: condition as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy: sortBy as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      sellerId: sellerId as string,
      status: status as string,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: '获取书籍列表失败' });
  }
});

// GET /api/books/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const id = req.params.id as string;
    const result = await booksRepository.findById(id, userId || undefined);
    if (!result) return res.status(404).json({ success: false, message: '书籍不存在' });
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '获取书籍详情失败' });
  }
});

// POST /api/books
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const validated = insertBookSchema.parse({ ...req.body, sellerId: userId });
    const book = await booksRepository.create(validated);
    return res.status(201).json({ success: true, data: book });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '发布书籍失败' });
  }
});

// PUT /api/books/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const id = req.params.id as string;
    const book = await booksRepository.update(id, userId, req.body);
    if (!book) return res.status(404).json({ success: false, message: '书籍不存在或无权限' });
    return res.json({ success: true, data: book });
  } catch {
    return res.status(500).json({ success: false, message: '更新书籍失败' });
  }
});

// DELETE /api/books/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const id = req.params.id as string;
    const success = await booksRepository.delete(id, userId);
    if (!success) return res.status(404).json({ success: false, message: '书籍不存在或无权限' });
    return res.json({ success: true, data: null });
  } catch {
    return res.status(500).json({ success: false, message: '删除书籍失败' });
  }
});

// POST /api/books/:id/favorite
router.post('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const id = req.params.id as string;
    const result = await booksRepository.toggleFavorite(userId, id);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '操作失败' });
  }
});

// GET /api/books/user/favorites
router.get('/user/favorites', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const result = await booksRepository.getUserFavorites(userId);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '获取收藏失败' });
  }
});

export default router;
