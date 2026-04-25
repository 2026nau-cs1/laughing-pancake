import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import type { User, Book, BookCategory, BookCondition } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Plus, Edit2, Trash2, Eye, Package, CheckCircle, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User;
}

const CONDITION_OPTIONS = [
  { value: 'brand_new', label: '全新' },
  { value: 'like_new', label: '九成新' },
  { value: 'good', label: '八成新' },
  { value: 'fair', label: '七成新' },
  { value: 'poor', label: '六成新以下' },
];
const CATEGORY_OPTIONS = [
  { value: 'textbook', label: '教材教辅' },
  { value: 'literature', label: '文学小说' },
  { value: 'exam_prep', label: '考研备考' },
  { value: 'language', label: '外语学习' },
  { value: 'computer', label: '计算机' },
  { value: 'science', label: '科学技术' },
  { value: 'history', label: '历史文化' },
  { value: 'art', label: '艺术设计' },
  { value: 'other', label: '其他' },
];
const STATUS_LABELS: Record<string, string> = {
  available: '在售', sold: '已售出', reserved: '已预订', removed: '已下架',
};
const STATUS_COLORS: Record<string, string> = {
  available: '#27AE60', sold: '#6B6560', reserved: '#E67E22', removed: '#C0392B',
};
const BOOK_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
  'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300&q=80',
];

const emptyForm = {
  title: '', author: '', isbn: '', publisher: '', publishYear: '',
  category: 'textbook' as BookCategory, condition: 'good' as BookCondition,
  price: '', originalPrice: '', description: '', images: [] as string[],
};

export default function SellView({ onNavigate, user }: Props) {
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshMyBooks = async () => {
    const res = await apiService.getBooks({ q: undefined });
    if (res.success && res.data) setMyBooks(res.data.books.filter((b) => b.sellerId === user.id));
  };

  useEffect(() => {
    let cancelled = false;
    apiService.getBooks({ q: undefined }).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setMyBooks(res.data.books.filter((b) => b.sellerId === user.id));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleIsbnLookup = async () => {
    if (!form.isbn.trim()) { toast.error('请输入 ISBN'); return; }
    setIsbnLoading(true);
    // Simulate ISBN lookup (in real app would call Open Library API)
    await new Promise((r) => setTimeout(r, 800));
    setIsbnLoading(false);
    toast.success('ISBN 查询功能将在正式环境中对接开放图书 API');
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('请输入书名'); return; }
    if (!form.author.trim()) { toast.error('请输入作者'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('请输入有效价格'); return; }

    setSubmitting(true);
    const payload = {
      title: form.title,
      author: form.author,
      isbn: form.isbn || undefined,
      publisher: form.publisher || undefined,
      publishYear: form.publishYear ? Number(form.publishYear) : undefined,
      category: form.category,
      condition: form.condition,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      description: form.description || undefined,
      images: form.images,
    };

    let res;
    if (editingId) {
      res = await apiService.updateBook(editingId, payload);
    } else {
      res = await apiService.createBook(payload);
    }
    setSubmitting(false);

    if (res.success) {
      toast.success(editingId ? '书籍信息已更新' : '书籍发布成功！');
      setShowForm(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      refreshMyBooks();
    } else {
      toast.error(res.message || '操作失败');
    }
  };

  const handleEdit = (book: Book) => {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publishYear: book.publishYear ? String(book.publishYear) : '',
      category: book.category,
      condition: book.condition,
      price: String(book.price),
      originalPrice: book.originalPrice ? String(book.originalPrice) : '',
      description: book.description || '',
      images: book.images || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const res = await apiService.deleteBook(id);
    if (res.success) {
      toast.success('书籍已下架');
      setDeleteConfirmId(null);
      refreshMyBooks();
    } else {
      toast.error('操作失败');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await apiService.updateBook(id, { status: status as 'available' | 'sold' | 'reserved' | 'removed' });
    if (res.success) {
      toast.success('状态已更新');
      refreshMyBooks();
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>出售书籍</h1>
          <p className="text-sm mt-1" style={{ color: '#6B6560' }}>管理你的在售书籍</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#2D4A3E' }}
        >
          <Plus className="w-4 h-4" /> 发布新书
        </button>
      </div>

      {/* Publish Form */}
      {showForm && (
        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', boxShadow: '0 4px 12px rgba(45,74,62,0.08)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>{editingId ? '编辑书籍' : '发布新书籍'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ color: '#6B6560' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ISBN Lookup */}
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF' }}>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4" style={{ color: '#2D4A3E' }} />
              <span className="text-sm font-semibold" style={{ color: '#2D4A3E' }}>ISBN 扫码自动填充</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入 ISBN 条码"
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
              <button
                onClick={handleIsbnLookup}
                disabled={isbnLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#C8873A' }}
              >
                {isbnLoading ? '查询中...' : '自动填充'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>书名 *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="输入书名"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>作者 *</label>
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="输入作者名"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>出版社</label>
              <input
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                placeholder="出版社名称"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>出版年份</label>
              <input
                type="number"
                value={form.publishYear}
                onChange={(e) => setForm({ ...form, publishYear: e.target.value })}
                placeholder="如 2023"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>分类</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as BookCategory })}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>成色 *</label>
              <select
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value as BookCondition })}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              >
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>出售价格 (￦) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>原价 (￦)（可选）</label>
              <input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                placeholder="定价，用于显示折扣"
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>书籍描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="描述书籍状况、是否有划线笔记等..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
              style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
            />
          </div>

          {/* Image URL input */}
          <div className="mt-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>书籍图片 URL（可选，每行一个）</label>
            <textarea
              value={form.images.join('\n')}
              onChange={(e) => setForm({ ...form, images: e.target.value.split('\n').filter(Boolean) })}
              placeholder="https://example.com/book.jpg"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
              style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
            />
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#2D4A3E' }}
            >
              {submitting ? '提交中...' : (editingId ? '保存修改' : '发布书籍')}
            </button>
          </div>
        </div>
      )}

      {/* My Books List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
          ))}
        </div>
      ) : myBooks.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>还没有在售书籍</h3>
          <p className="text-sm mb-4" style={{ color: '#6B6560' }}>点击上方按钮发布你的第一本书</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myBooks.map((book, idx) => (
            <div
              key={book.id}
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}
            >
              <img
                src={book.images?.[0] || BOOK_IMAGES[idx % BOOK_IMAGES.length]}
                alt={book.title}
                className="w-14 h-18 object-cover rounded-lg flex-shrink-0"
                style={{ height: '72px' }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate" style={{ color: '#1A1A1A' }}>{book.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-base font-bold" style={{ color: '#C8873A' }}>￦{Number(book.price).toFixed(0)}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${STATUS_COLORS[book.status]}20`, color: STATUS_COLORS[book.status] }}
                  >
                    {STATUS_LABELS[book.status] || book.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: '#6B6560' }}>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {book.viewCount}</span>
                  <span>{new Date(book.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {book.status === 'available' && (
                  <button
                    onClick={() => handleStatusChange(book.id, 'removed')}
                    className="p-2 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: '#6B6560' }}
                    title="下架"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {book.status === 'removed' && (
                  <button
                    onClick={() => handleStatusChange(book.id, 'available')}
                    className="p-2 rounded-lg transition-colors hover:opacity-70"
                    style={{ color: '#27AE60' }}
                    title="重新上架"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(book)}
                  className="p-2 rounded-lg transition-colors hover:opacity-70"
                  style={{ color: '#2D4A3E' }}
                  title="编辑"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(book.id)}
                  className="p-2 rounded-lg transition-colors hover:opacity-70"
                  style={{ color: '#C0392B' }}
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A1A' }}>确认下架</h3>
            <p className="text-sm mb-5" style={{ color: '#6B6560' }}>下架后买家将无法看到该书籍，确认操作吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}>取消</button>
              <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#C0392B' }}>确认下架</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
