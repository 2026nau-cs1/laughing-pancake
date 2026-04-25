import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api';
import type { User, Book, BookCategory, BookCondition } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Search, SlidersHorizontal, Heart, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User | null;
}

const CONDITION_LABELS: Record<string, string> = {
  brand_new: '全新', like_new: '九成新', good: '八成新', fair: '七成新', poor: '六成新以下',
};
const CONDITION_COLORS: Record<string, string> = {
  brand_new: '#2D4A3E', like_new: '#27AE60', good: '#E8A84C', fair: '#E67E22', poor: '#C0392B',
};
const CATEGORIES = [
  { id: '', label: '全部' },
  { id: 'textbook', label: '教材教辅' },
  { id: 'literature', label: '文学小说' },
  { id: 'exam_prep', label: '考研备考' },
  { id: 'language', label: '外语学习' },
  { id: 'computer', label: '计算机' },
  { id: 'science', label: '科学技术' },
  { id: 'history', label: '历史文化' },
  { id: 'art', label: '艺术设计' },
  { id: 'other', label: '其他' },
];
const SORT_OPTIONS = [
  { id: 'newest', label: '最新上架' },
  { id: 'price_asc', label: '价格从低到高' },
  { id: 'price_desc', label: '价格从高到低' },
  { id: 'popular', label: '最多浏览' },
];
const BOOK_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&q=80',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=300&q=80',
  'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80',
];

export default function BrowseView({ onNavigate, user }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.getBooks({
        q: searchQuery || undefined,
        category: selectedCategory as BookCategory || undefined,
        condition: selectedCondition as BookCondition || undefined,
        sortBy: sortBy as 'newest' | 'price_asc' | 'price_desc' | 'popular',
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        page,
        limit: 20,
      });
      if (res.success && res.data) {
        setBooks(res.data.books);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedCondition, sortBy, minPrice, maxPrice, page]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleToggleFavorite = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation();
    if (!user) { toast.error('请先登录'); return; }
    const res = await apiService.toggleFavorite(bookId);
    if (res.success) {
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (res.data.favorited) next.add(bookId); else next.delete(bookId);
        return next;
      });
      toast.success(res.data.favorited ? '已收藏' : '已取消收藏');
    }
  };

  const handleSearch = () => { setPage(1); fetchBooks(); };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>浏览书籍</h1>
        <p className="text-sm mt-1" style={{ color: '#6B6560' }}>共 {total} 本书籍在售</p>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <input
            type="search"
            placeholder="搜索书名、作者、ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6560' }} />
        </div>
        <button
          onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#2D4A3E' }}
        >
          搜索
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ backgroundColor: showFilters ? '#2D4A3E' : '#FFFFFF', color: showFilters ? '#FFFFFF' : '#2D4A3E', border: '1px solid #E2D9CF' }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">筛选</span>
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>成色</label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              >
                <option value="">全部成色</option>
                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>排序</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>最低价格 (￦)</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>最高价格 (￦)</label>
              <input
                type="number"
                placeholder="999"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => { setSelectedCondition(''); setSortBy('newest'); setMinPrice(''); setMaxPrice(''); }}
              className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
              style={{ color: '#6B6560' }}
            >
              <X className="w-3 h-3" /> 清除筛选
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: selectedCategory === cat.id ? '#2D4A3E' : '#FFFFFF',
              color: selectedCategory === cat.id ? '#FFFFFF' : '#6B6560',
              border: '1px solid',
              borderColor: selectedCategory === cat.id ? '#2D4A3E' : '#E2D9CF',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
              <div className="aspect-[3/4] animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
              <div className="p-3 space-y-2">
                <div className="h-3 rounded animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
                <div className="h-3 w-2/3 rounded animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>暂无相关书籍</h3>
          <p className="text-sm" style={{ color: '#6B6560' }}>试试其他搜索词或分类</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book, idx) => (
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
                <div
                  className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: CONDITION_COLORS[book.condition] || '#6B6560' }}
                >
                  {CONDITION_LABELS[book.condition] || book.condition}
                </div>
                <button
                  onClick={(e) => handleToggleFavorite(e, book.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                >
                  <Heart
                    className="w-3.5 h-3.5"
                    style={{ color: favoritedIds.has(book.id) ? '#C0392B' : '#6B6560' }}
                    fill={favoritedIds.has(book.id) ? '#C0392B' : 'none'}
                  />
                </button>
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
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', color: '#2D4A3E' }}
          >
            上一页
          </button>
          <span className="px-4 py-2 text-sm" style={{ color: '#6B6560' }}>第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / 20)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', color: '#2D4A3E' }}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
