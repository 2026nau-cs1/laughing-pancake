import { Router, Request, Response } from 'express';
import { ordersRepository } from '../repositories/orders';
import { insertOrderSchema } from '../db/schema';
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

// GET /api/orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const result = await ordersRepository.findByUser(userId);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '获取订单失败' });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const id = req.params.id as string;
    const result = await ordersRepository.findById(id);
    if (!result) return res.status(404).json({ success: false, message: '订单不存在' });
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '获取订单详情失败' });
  }
});

// POST /api/orders
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const { bookId, sellerId, price, shippingAddress, paymentMethod, notes } = req.body;
    const validated = insertOrderSchema.parse({
      bookId,
      buyerId: userId,
      sellerId,
      price: String(price),
      shippingAddress,
      paymentMethod,
      notes,
    });
    const order = await ordersRepository.create(validated);
    return res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '创建订单失败' });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const id = req.params.id as string;
    const { status, trackingNumber, notes } = req.body;
    const order = await ordersRepository.updateStatus(id, userId, status, { trackingNumber, notes });
    if (!order) return res.status(404).json({ success: false, message: '订单不存在或无权限' });
    return res.json({ success: true, data: order });
  } catch {
    return res.status(500).json({ success: false, message: '更新订单状态失败' });
  }
});

export default router;
