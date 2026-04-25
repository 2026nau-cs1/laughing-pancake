import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';
import type { User, Book } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Search, CheckCircle, Star, BookOpen, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

interface Props {
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User | null;
}

const CONDITION_LABELS: Record<string, string> = {
  brand_new: '全新',
  like_new: '九成新',
  good: '八成新',
  fair: '七成新',
  poor: '六成新以下',
};

const CONDITION_COLORS: Record<string, string> = {
  brand_new: '#2D4A3E',
  like_new: '#27AE60',
  good: '#E8A84C',
  fair: '#E67E22',
  poor: '#C0392B',
};

interface Category {
  id: string;
  label: string;
  count: string;
  color: string;
  bg: string;
}

const CATEGORIES: Category[] = [
  { id: 'textbook', label: '教材教辅', count: '2,341本', color: '#2D4A3E', bg: 'rgba(45,74,62,0.1)' },
  { id: 'literature', label: '文学小说', count: '1,876本', color: '#C8873A', bg: 'rgba(200,135,58,0.1)' },
  { id: 'exam_prep', label: '考研备考', count: '987本', color: '#E67E22', bg: 'rgba(230,126,34,0.15)' },
  { id: 'language', label: '外语学习', count: '654本', color: '#27AE60', bg: 'rgba(39,174,96,0.1)' },
  { id: 'computer', label: '计算机', count: '1,123本', color: '#C0392B', bg: 'rgba(192,57,43,0.1)' },
  { id: 'science', label: '科学技术', count: '432本', color: '#6B6560', bg: 'rgba(107,101,96,0.1)' },
];

interface Testimonial {
  text: string;
  name: string;
  school: string;
  avatar: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    text: '期末考试前急需教材，在 BookCircle 上找到了九成新的高数，比书店便宜了一半，卖家发货也很快！',
    name: '小雨同学',
    school: '北京师范大学 大二',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&q=80',
    rating: 5,
  },
  {
    text: '毕业时有一大堆专业书不知道怎么处理，用 BookCircle 扫码发布，一周内全部卖出去了！',
    name: '阿明同学',
    school: '上海交通大学 应届毕业生',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&q=80',
    rating: 5,
  },
  {
    text: '平台的担保交易机制让我很放心，确认收货后钱才到卖家，交易全程安全。',
    name: '晓晴同学',
    school: '中山大学 大三',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&q=80',
    rating: 5,
  },
];

const BOOK_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&q=80',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80',
];

const TRUST_BADGES = ['担保交易', 'ISBN 扫码发布', '信誉评价体系'];

const STATS = [
  { value: '10,000+', label: '注册用户' },
  { value: '60%', label: '书籍成交率' },
  { value: '4.5/5', label: '用户满意度' },
];

const STEPS = [
  { step: '第一步', title: '搜索目标书籍', desc: '按书名、作者、ISBN 或分类搜索，支持价格和成色筛选，快速找到最合适的书籍。', icon: Search },
  { step: '第二步', title: '与卖家沟通议价', desc: '通过平台内置聊天功能与卖家直接沟通，了解书籍详情，协商最优价格。', icon: TrendingUp },
  { step: '第三步', title: '安全付款确认收货', desc: '支持支付宝、微信支付，资金由平台担保，确认收货后才释放给卖家，交易全程安全。', icon: Shield },
];

const SELL_FEATURES = [
  { title: 'ISBN 扫码自动填充', desc: '扫描书籍条码，书名、作者、出版社等信息自动填充，省时省力。' },
  { title: '上传照片标注成色', desc: '上传书籍实拍照片，标注成色等级，让买家一目了然，提升成交率。' },
  { title: '灵活管理在售商品', desc: '随时编辑价格、修改描述或下架书籍，完全掌控你的书单。' },
];

const FOOTER_COLS = [
  { title: '平台功能', links: ['浏览书籍', '出售书籍', 'ISBN 扫码发布', '担保交易'] },
  { title: '帮助支持', links: ['新手指南', '常见问题', '联系客服', '举报违规'] },
  { title: '关于我们', links: ['平台介绍', '用户协议', '隐私政策', '加入我们'] },
];

export default function HomeView({ onNavigate, user }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [latestBooks, setLatestBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  const fetchLatestBooks = useCallback(async () => {
    try {
      const res = await apiService.getBooks({ limit: 5, sortBy: 'newest' });
      if (res.success && res.data) {
        setLatestBooks(res.data.books);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestBooks();
  }, [fetchLatestBooks]);

  const handleSearch = useCallback(() => {
    onNavigate('browse');
  }, [onNavigate]);

  const handleCategoryClick = useCallback((categoryId: string) => {
    onNavigate('browse');
  }, [onNavigate]);

  const handleEmailSubmit = useCallback(() => {
    if (!user && email) {
      onNavigate('auth');
    }
  }, [user, email, onNavigate]);

  return (
    <div className="pb-16 md:pb-0">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #F7F3EE 0%, #EDE8E0 100%)' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest" style={{ backgroundColor: 'rgba(232,168,76,0.15)', border: '1px solid rgba(232,168,76,0.4)', color: '#C8873A' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#E8A84C' }}></span>
                学生专属二手书平台
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight animate-fade-in-up" style={{ fontFamily: 'Georgia, serif', color: '#2D4A3E' }}>
                让好书<br />
                <span style={{ color: '#C8873A' }}>流转起来</span>
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: '#6B6560', maxWidth: '480px' }}>
                连接数万名学生与书籍爱好者，以极低的价格买到心仪好书，或将闲置书籍变现。安全担保交易，放心买卖。
              </p>
              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="search"
                    placeholder="搜索书名、作者、ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none transition-all"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2D9CF',
                      color: '#1A1A1A',
                      boxShadow: '0 1px 3px rgba(45,74,62,0.08)',
                    }}
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6560' }} />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: '#C8873A' }}
                >
                  立即搜索
                </button>
              </div>
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-5 text-sm" style={{ color: '#6B6560' }}>
                {TRUST_BADGES.map((badge) => (
                  <span key={badge} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" style={{ color: '#27AE60' }} />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80"
                  alt="书架上的书籍"
                  className="w-full h-full object-cover rounded-2xl transition-transform duration-500 hover:scale-[1.02]"
                  style={{ boxShadow: '0 20px 40px -5px rgba(45,74,62,0.25)' }}
                />
                <div className="absolute -bottom-5 -left-5 rounded-xl p-3.5 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', boxShadow: '0 10px 24px -3px rgba(45,74,62,0.15)' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(39,174,96,0.1)' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: '#27AE60' }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>交易成功</div>
                    <div className="text-xs" style={{ color: '#6B6560' }}>《高等数学》已售出</div>
                  </div>
                </div>
                <div className="absolute -top-3 -right-3 rounded-xl px-3 py-2" style={{ backgroundColor: '#E8A84C', boxShadow: '0 4px 12px rgba(232,168,76,0.4)' }}>
                  <div className="text-white text-xs font-bold">省 ￦68</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8" style={{ borderTop: '1px solid #E2D9CF' }}>
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#2D4A3E' }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: '#6B6560' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E2D9CF', borderBottom: '1px solid #E2D9CF' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-7">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>按分类浏览</h2>
            <div className="flex-1 h-px" style={{ backgroundColor: '#E2D9CF' }}></div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="group flex flex-col items-center gap-2.5 p-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                style={{ border: '1px solid #E2D9CF', backgroundColor: '#FFFFFF' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = cat.color;
                  e.currentTarget.style.backgroundColor = cat.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2D9CF';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: cat.bg }}>
                  <BookOpen className="w-5 h-5 transition-colors" style={{ color: cat.color }} />
                </div>
                <span className="text-xs font-medium text-center transition-colors" style={{ color: '#1A1A1A' }}>{cat.label}</span>
                <span className="text-xs transition-colors" style={{ color: '#6B6560' }}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Books */}
      <section className="py-14">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>最新上架</h2>
              <p className="text-sm mt-1" style={{ color: '#6B6560' }}>每天都有新书上架，快来淘宝</p>
            </div>
            <button
              onClick={() => onNavigate('browse')}
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: '#C8873A' }}
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {BOOK_IMAGES.map((_, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
                  <div className="aspect-[3/4] animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 rounded animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
                    <div className="h-3 w-2/3 rounded animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : latestBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {latestBooks.map((book, idx) => (
                <button
                  key={book.id}
                  onClick={() => onNavigate('book-detail', book.id)}
                  className="group text-left rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: '#F7F3EE' }}>
                    <img
                      src={book.images?.[0] || BOOK_IMAGES[idx % BOOK_IMAGES.length]}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: CONDITION_COLORS[book.condition] || '#6B6560' }}>
                      {CONDITION_LABELS[book.condition] || book.condition}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: '#1A1A1A' }}>{book.title}</h3>
                    <p className="text-xs mt-1" style={{ color: '#6B6560' }}>{book.author}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <span className="text-base font-bold" style={{ color: '#C8873A' }}>￦{Number(book.price).toFixed(0)}</span>
                        {book.originalPrice && (
                          <span className="text-xs line-through ml-1" style={{ color: '#6B6560' }}>￦{Number(book.originalPrice).toFixed(0)}</span>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#2D4A3E' }}>购买</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-xs" style={{ color: '#6B6560' }}>{book.sellerSchool || '未知学校'} · {book.sellerName}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {BOOK_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate('browse')}
                  className="group text-left rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: '#F7F3EE' }}>
                    <img src={img} alt="书籍" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#27AE60' }}>九成新</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: '#1A1A1A' }}>示例书籍 {idx + 1}</h3>
                    <p className="text-xs mt-1" style={{ color: '#6B6560' }}>作者名</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold" style={{ color: '#C8873A' }}>￦{(idx + 1) * 15}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#2D4A3E' }}>购买</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16" style={{ backgroundColor: '#2D4A3E' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>如何使用 BookCircle？</h2>
            <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>三步完成交易，简单快捷</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, idx) => (
              <div key={step.step} className="text-center relative">
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px" style={{ background: 'linear-gradient(90deg, rgba(232,168,76,0.3), rgba(232,168,76,0.1))' }}></div>
                )}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <step.icon className="w-8 h-8" style={{ color: '#E8A84C' }} />
                </div>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#E8A84C' }}>{step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Georgia, serif' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell Section */}
      <section className="py-16">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80"
                alt="出售书籍"
                className="w-full rounded-2xl object-cover aspect-video transition-transform duration-500 hover:scale-[1.02]"
                style={{ boxShadow: '0 10px 24px -3px rgba(45,74,62,0.15)' }}
              />
              <div className="absolute -bottom-4 -right-4 rounded-xl p-3.5 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', boxShadow: '0 10px 24px -3px rgba(45,74,62,0.15)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(232,168,76,0.2)' }}>
                  <Zap className="w-5 h-5" style={{ color: '#C8873A' }} />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>ISBN 扫码一键发布</div>
                  <div className="text-xs" style={{ color: '#6B6560' }}>自动填充书籍信息</div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest" style={{ backgroundColor: 'rgba(200,135,58,0.1)', border: '1px solid rgba(200,135,58,0.3)', color: '#C8873A' }}>
                卖家专区
              </div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>轻松出售<br />闲置书籍</h2>
              <p className="leading-relaxed" style={{ color: '#6B6560' }}>
                无论是用过的教材、读完的小说，还是备考资料，都能在 BookCircle 找到新主人。扫描 ISBN 条码，30 秒完成发布。
              </p>
              <div className="space-y-4">
                {SELL_FEATURES.map((feat) => (
                  <div key={feat.title} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(45,74,62,0.1)' }}>
                      <CheckCircle className="w-4 h-4" style={{ color: '#2D4A3E' }} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{feat.title}</div>
                      <div className="text-sm mt-0.5" style={{ color: '#6B6560' }}>{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate('sell')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: '#C8873A' }}
              >
                立即发布书籍 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E2D9CF', borderBottom: '1px solid #E2D9CF' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>用户真实评价</h2>
            <p className="text-sm mt-2" style={{ color: '#6B6560' }}>来自全国各高校学生的真实反馈</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF' }}
              >
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" style={{ color: '#E8A84C' }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#1A1A1A' }}>{t.text}</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#1A1A1A' }}>{t.name}</div>
                    <div className="text-xs" style={{ color: '#6B6560' }}>{t.school}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#F7F3EE' }}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-8 lg:p-12 text-center relative overflow-hidden" style={{ backgroundColor: '#2D4A3E' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: '#E8A84C', transform: 'translate(50%, -50%)' }}></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: '#C8873A', transform: 'translate(-50%, 50%)' }}></div>
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                加入 BookCircle<br />开始你的书籍循环之旅
              </h2>
              <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
                注册免费，立即浏览数千本二手好书，或将你的闲置书籍变现。
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="输入你的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF' }}
                />
                <button
                  onClick={handleEmailSubmit}
                  className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: '#E8A84C' }}
                >
                  免费注册
                </button>
              </div>
              <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>注册即表示同意用户协议和隐私政策</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E2D9CF' }} className="py-12">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2D4A3E' }}>
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: '#2D4A3E' }}>BookCircle</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: '#6B6560' }}>连接学生与书籍爱好者，让好书流转起来，促进知识的循环利用。</p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#1A1A1A' }}>{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <button className="text-xs transition-colors hover:opacity-70" style={{ color: '#6B6560' }}>{link}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid #E2D9CF' }}>
            <p className="text-xs" style={{ color: '#6B6560' }}>© 2026 BookCircle. 保留所有权利。</p>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: '#6B6560' }}>支持支付方式：</span>
              {['支付宝', '微信支付'].map((pay) => (
                <span key={pay} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: '#6B6560', backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF' }}>{pay}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
