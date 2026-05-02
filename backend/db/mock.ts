export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  school?: string;
  grade?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  reputationScore: string;
  totalSales: number;
  totalPurchases: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookRecord {
  id: string;
  sellerId: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  category: string;
  condition: string;
  price: string;
  originalPrice?: string;
  description?: string;
  images: string[];
  status: string;
  viewCount: number;
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderRecord {
  id: string;
  bookId: string;
  buyerId: string;
  sellerId: string;
  price: string;
  status: string;
  shippingAddress?: string;
  trackingNumber?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationRecord {
  id: string;
  bookId: string;
  buyerId: string;
  sellerId: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  buyerUnread: number;
  sellerUnread: number;
  createdAt: Date;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface ReviewRecord {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment: string;
  role: string;
  createdAt: Date;
}

export interface FavoriteRecord {
  id: string;
  userId: string;
  bookId: string;
  createdAt: Date;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    password: '123456',
    phone: '13800138001',
    school: '南京大学',
    grade: '大三',
    address: '南京市鼓楼区',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=young%20asian%20college%20student%20avatar%20portrait&image_size=square',
    bio: '热爱阅读，喜欢分享好书',
    reputationScore: '4.95',
    totalSales: 12,
    totalPurchases: 8,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    password: '123456',
    phone: '13900139002',
    school: '北京大学',
    grade: '大四',
    address: '北京市海淀区',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=young%20asian%20female%20student%20avatar%20portrait&image_size=square',
    bio: '专业书籍收集者',
    reputationScore: '4.88',
    totalSales: 25,
    totalPurchases: 15,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    password: '123456',
    phone: '13700137003',
    school: '复旦大学',
    grade: '大二',
    address: '上海市杨浦区',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=young%20asian%20male%20student%20avatar%20portrait&image_size=square',
    bio: '二手书交易爱好者',
    reputationScore: '5.00',
    totalSales: 5,
    totalPurchases: 20,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    name: '新用户',
    email: 'ghOstow8957@outlook.com',
    password: '123456',
    phone: '13800000000',
    school: '清华大学',
    grade: '大一',
    address: '北京市海淀区',
    avatar: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=young%20asian%20student%20avatar%20portrait&image_size=square',
    bio: '热爱阅读的学生',
    reputationScore: '5.00',
    totalSales: 0,
    totalPurchases: 0,
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01'),
  },
];

export const mockBooks: BookRecord[] = [
  {
    id: 'b1',
    sellerId: '1',
    title: '高等数学（第七版）',
    author: '同济大学数学系',
    isbn: '9787040396638',
    publisher: '高等教育出版社',
    publishYear: 2014,
    category: 'textbook',
    condition: 'good',
    price: '35.00',
    originalPrice: '59.00',
    description: '经典高等数学教材，内容完整，有少量笔记标注',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=mathematics%20textbook%20cover%20calculus&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 156,
    favoriteCount: 23,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'b2',
    sellerId: '2',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    isbn: '9787544244909',
    publisher: '南海出版公司',
    publishYear: 2011,
    category: 'literature',
    condition: 'like_new',
    price: '25.00',
    originalPrice: '39.50',
    description: '诺贝尔文学奖作品，魔幻现实主义经典',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=one%20hundred%20years%20of%20solitude%20book%20cover&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 89,
    favoriteCount: 45,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
  },
  {
    id: 'b3',
    sellerId: '3',
    title: '考研英语真题解析',
    author: '张剑',
    isbn: '9787519281952',
    publisher: '世界图书出版公司',
    publishYear: 2023,
    category: 'exam_prep',
    condition: 'brand_new',
    price: '45.00',
    originalPrice: '68.00',
    description: '2024年考研英语真题详解，全新未拆封',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=english%20exam%20preparation%20book%20cover&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 234,
    favoriteCount: 67,
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-04-10'),
  },
  {
    id: 'b4',
    sellerId: '1',
    title: 'Python编程：从入门到实践',
    author: 'Eric Matthes',
    isbn: '9787115428577',
    publisher: '人民邮电出版社',
    publishYear: 2020,
    category: 'computer',
    condition: 'good',
    price: '40.00',
    originalPrice: '79.00',
    description: 'Python入门经典教材，适合零基础学习',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=python%20programming%20book%20cover&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 312,
    favoriteCount: 89,
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-04-05'),
  },
  {
    id: 'b5',
    sellerId: '2',
    title: '中国近代史纲要',
    author: '马克思主义理论研究和建设工程',
    isbn: '9787040501290',
    publisher: '高等教育出版社',
    publishYear: 2023,
    category: 'history',
    condition: 'fair',
    price: '20.00',
    originalPrice: '35.00',
    description: '大学公共课教材，有学习笔记',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=chinese%20history%20textbook%20cover&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 67,
    favoriteCount: 12,
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-04-15'),
  },
  {
    id: 'b6',
    sellerId: '3',
    title: '三体',
    author: '刘慈欣',
    isbn: '9787536692930',
    publisher: '重庆出版社',
    publishYear: 2008,
    category: 'science',
    condition: 'like_new',
    price: '30.00',
    originalPrice: '38.00',
    description: '雨果奖获奖作品，中国科幻巅峰之作',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=three%20body%20problem%20science%20fiction%20book%20cover&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 445,
    favoriteCount: 156,
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
  {
    id: 'b7',
    sellerId: '1',
    title: '新概念英语3',
    author: '亚历山大',
    isbn: '9787560013462',
    publisher: '外语教学与研究出版社',
    publishYear: 1997,
    category: 'language',
    condition: 'good',
    price: '18.00',
    originalPrice: '28.00',
    description: '经典英语学习教材',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=english%20learning%20book%20cover%20new%20concept&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 123,
    favoriteCount: 34,
    createdAt: new Date('2024-04-08'),
    updatedAt: new Date('2024-04-08'),
  },
  {
    id: 'b8',
    sellerId: '2',
    title: '设计心理学',
    author: '唐纳德·诺曼',
    isbn: '9787115116303',
    publisher: '人民邮电出版社',
    publishYear: 2003,
    category: 'art',
    condition: 'good',
    price: '32.00',
    originalPrice: '49.00',
    description: '设计领域经典著作',
    images: ['https://neeko-copilot.bytedance.net/api/text_to_image?prompt=design%20psychology%20book%20cover&image_size=portrait_4_3'],
    status: 'available',
    viewCount: 78,
    favoriteCount: 28,
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-04-12'),
  },
];

export const mockOrders: OrderRecord[] = [];
export const mockConversations: ConversationRecord[] = [];
export const mockMessages: MessageRecord[] = [];
export const mockReviews: ReviewRecord[] = [
  {
    id: 'r1',
    orderId: 'o1',
    reviewerId: '2',
    revieweeId: '1',
    rating: 5,
    comment: '书籍状态很好，卖家发货很快！',
    role: 'buyer',
    createdAt: new Date('2024-04-01'),
  },
  {
    id: 'r2',
    orderId: 'o2',
    reviewerId: '1',
    revieweeId: '3',
    rating: 5,
    comment: '买家很爽快，交易顺利',
    role: 'seller',
    createdAt: new Date('2024-03-25'),
  },
];
export const mockFavorites: FavoriteRecord[] = [];

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function formatDate(date: Date): string {
  return date.toISOString();
}
