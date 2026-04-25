import { Router, Request, Response } from 'express';
import { messagesRepository } from '../repositories/messages';
import { booksRepository } from '../repositories/books';
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

// GET /api/messages/conversations
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const result = await messagesRepository.getConversations(userId);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '获取会话列表失败' });
  }
});

// GET /api/messages/:conversationId
router.get('/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const conversationId = req.params.conversationId as string;
    const result = await messagesRepository.getMessages(conversationId);
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: '获取消息失败' });
  }
});

// POST /api/messages/send
router.post('/send', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: '请先登录' });
    const { bookId, receiverId, content, conversationId } = req.body;

    let convId = conversationId;
    if (!convId) {
      // Find book to get seller
      const bookResult = await booksRepository.findById(bookId);
      if (!bookResult) return res.status(404).json({ success: false, message: '书籍不存在' });
      const sellerId = bookResult.book.sellerId;
      const isBuyer = userId !== sellerId;
      const buyerId = isBuyer ? userId : receiverId;
      const conv = await messagesRepository.findOrCreateConversation(bookId, buyerId, sellerId);
      convId = conv.id;
    }

    // Determine if sender is buyer
    const convs = await messagesRepository.getConversations(userId);
    const conv = convs.find((c) => c.conversation.id === convId);
    const isBuyer = conv ? conv.conversation.buyerId === userId : true;

    const msg = await messagesRepository.sendMessage(convId, userId, content, isBuyer);
    return res.status(201).json({ success: true, data: { message: msg, conversationId: convId } });
  } catch {
    return res.status(500).json({ success: false, message: '发送消息失败' });
  }
});

export default router;
