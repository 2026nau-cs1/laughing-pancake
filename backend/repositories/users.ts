import { USE_MOCK_DATA, mockUsers, generateId, type User } from '../db';
import { z } from 'zod';

const insertUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  school: z.string().optional(),
  grade: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

export const usersRepository = {
  async findById(id: string): Promise<User | null> {
    if (USE_MOCK_DATA) {
      return mockUsers.find(u => u.id === id) || null;
    }
    return null;
  },

  async findByEmail(email: string): Promise<User | null> {
    if (USE_MOCK_DATA) {
      return mockUsers.find(u => u.email === email) || null;
    }
    return null;
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    if (USE_MOCK_DATA) {
      return true;
    }
    return false;
  },

  async create(data: z.infer<typeof insertUserSchema>): Promise<User> {
    if (USE_MOCK_DATA) {
      const newUser: User = {
        id: generateId(),
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        school: data.school,
        grade: data.grade,
        address: data.address,
        avatar: data.avatar,
        bio: data.bio,
        reputationScore: '5.00',
        totalSales: 0,
        totalPurchases: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);
      return newUser;
    }
    throw new Error('Database not configured');
  },

  async update(id: string, data: Partial<z.infer<typeof insertUserSchema>>): Promise<User | null> {
    if (USE_MOCK_DATA) {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...data, updatedAt: new Date() };
        return mockUsers[index];
      }
    }
    return null;
  },
};
