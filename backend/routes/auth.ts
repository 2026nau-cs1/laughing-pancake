import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { usersRepository } from '../repositories/users';
import { insertUserSchema } from '../db/schema';
import { USE_MOCK_DATA } from '../db';
import { z } from 'zod';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'bookcircle-secret-key';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = insertUserSchema.pick({
  name: true,
  email: true,
  password: true,
  phone: true,
});

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    console.log('Signup request:', req.body);
    const validated = signupSchema.parse(req.body);
    console.log('Validated:', validated);
    const existing = await usersRepository.findByEmail(validated.email);
    console.log('Existing user:', existing ? existing.id : 'null');
    if (existing) {
      return res.status(400).json({ success: false, message: '该邮箱已被注册' });
    }
    const hashedPassword = USE_MOCK_DATA ? validated.password : await bcrypt.hash(validated.password, 10);
    console.log('Creating user, mock mode:', USE_MOCK_DATA);
    const user = await usersRepository.create({ ...validated, password: hashedPassword });
    console.log('User created:', user.id);
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.status(201).json({ success: true, data: { token, user: userWithoutPassword } });
  } catch (err) {
    console.error('Signup error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    console.log('Login attempt for:', validated.email);
    console.log('USE_MOCK_DATA:', USE_MOCK_DATA);
    
    const user = await usersRepository.findByEmail(validated.email);
    console.log('Found user:', user ? user.id : 'null');
    
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    
    let valid = false;
    if (USE_MOCK_DATA) {
      valid = true;
      console.log('Mock data mode: auto-validated');
    } else {
      valid = await bcrypt.compare(validated.password, user.password);
    }
    
    console.log('Password valid:', valid);
    
    if (!valid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, data: { token, user: userWithoutPassword } });
  } catch (err) {
    console.error('Login error:', err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    return res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await usersRepository.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ success: true, data: userWithoutPassword });
  } catch {
    return res.status(401).json({ success: false, message: '无效的令牌' });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未授权' });
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { name, phone, school, grade, address, avatar, bio } = req.body;
    const user = await usersRepository.update(decoded.userId, { name, phone, school, grade, address, avatar, bio });
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ success: true, data: userWithoutPassword });
  } catch {
    return res.status(500).json({ success: false, message: '更新失败' });
  }
});

export default router;
