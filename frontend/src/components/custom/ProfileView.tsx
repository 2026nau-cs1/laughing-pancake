import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import type { User, Review, Favorite } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Star, Edit2, Save, X, BookOpen, ShoppingBag, Award, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User;
  onUserUpdate: (user: User) => void;
}

const CONDITION_LABELS: Record<string, string> = {
  brand_new: '全新', like_new: '九成新', good: '八成新', fair: '七成新', poor: '六成新以下',
};
const BOOK_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
];

export default function ProfileView({ onNavigate, user, onUserUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<'info' | 'reviews' | 'favorites'>('info');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    school: user.school || '',
    grade: user.grade || '',
    address: user.address || '',
    bio: user.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(true);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      let cancelled = false;
      apiService.getUserReviews(user.id).then((res) => {
        if (cancelled) return;
        if (res.success && res.data) setReviews(res.data);
        setLoadingReviews(false);
      });
      return () => { cancelled = true; };
    }
    if (activeTab === 'favorites' && favorites.length === 0) {
      let cancelled = false;
      apiService.getFavorites().then((res) => {
        if (cancelled) return;
        if (res.success && res.data) setFavorites(res.data);
        setLoadingFavs(false);
      });
      return () => { cancelled = true; };
    }
  }, [activeTab]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('姓名不能为空'); return; }
    setSaving(true);
    const res = await apiService.updateProfile(form);
    setSaving(false);
    if (res.success && res.data) {
      onUserUpdate(res.data as User);
      setEditing(false);
      toast.success('个人资料已更新');
    } else {
      toast.error(res.message || '更新失败');
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      {/* Profile Header */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E2D9CF' }}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold" style={{ color: '#6B6560' }}>{user.name[0]}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>{user.name}</h1>
            {user.school && <p className="text-sm mt-0.5" style={{ color: '#6B6560' }}>{user.school}{user.grade ? ` · ${user.grade}` : ''}</p>}
            {user.bio && <p className="text-sm mt-1" style={{ color: '#6B6560' }}>{user.bio}</p>}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" style={{ color: '#E8A84C' }} />
                <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{Number(user.reputationScore).toFixed(1)}</span>
                <span className="text-xs" style={{ color: '#6B6560' }}>信誉分</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" style={{ color: '#2D4A3E' }} />
                <span className="text-sm" style={{ color: '#6B6560' }}>已售 {user.totalSales} 本</span>
              </div>
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" style={{ color: '#C8873A' }} />
                <span className="text-sm" style={{ color: '#6B6560' }}>已买 {user.totalPurchases} 本</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF' }}>
        {[
          { id: 'info' as const, label: '个人资料', icon: Edit2 },
          { id: 'reviews' as const, label: '评价记录', icon: Award },
          { id: 'favorites' as const, label: '我的收藏', icon: Heart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.id ? '#2D4A3E' : '#6B6560',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(45,74,62,0.08)' : 'none',
            }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>个人资料</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: 'rgba(45,74,62,0.08)', color: '#2D4A3E' }}
              >
                <Edit2 className="w-3.5 h-3.5" /> 编辑
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone || '', school: user.school || '', grade: user.grade || '', address: user.address || '', bio: user.bio || '' }); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm"
                  style={{ color: '#6B6560' }}
                >
                  <X className="w-3.5 h-3.5" /> 取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ backgroundColor: '#2D4A3E' }}
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'name', label: '姓名', placeholder: '你的姓名', required: true },
              { key: 'phone', label: '手机号', placeholder: '联系手机号' },
              { key: 'school', label: '学校', placeholder: '就读学校' },
              { key: 'grade', label: '年级', placeholder: '如大二、大三' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>{field.label}</label>
                {editing ? (
                  <input
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                  />
                ) : (
                  <div className="px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#F7F3EE', color: form[field.key as keyof typeof form] ? '#1A1A1A' : '#6B6560' }}>
                    {form[field.key as keyof typeof form] || '未填写'}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>收货地址</label>
            {editing ? (
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="默认收货地址"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            ) : (
              <div className="px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#F7F3EE', color: form.address ? '#1A1A1A' : '#6B6560' }}>
                {form.address || '未填写'}
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>个人简介</label>
            {editing ? (
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="介绍一下自己..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            ) : (
              <div className="px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: '#F7F3EE', color: form.bio ? '#1A1A1A' : '#6B6560' }}>
                {form.bio || '未填写'}
              </div>
            )}
          </div>

          <div className="mt-5 pt-5" style={{ borderTop: '1px solid #E2D9CF' }}>
            <div className="text-xs" style={{ color: '#6B6560' }}>注册邮箱: {user.email}</div>
            <div className="text-xs mt-1" style={{ color: '#6B6560' }}>注册时间: {new Date(user.createdAt).toLocaleDateString('zh-CN')}</div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          {loadingReviews ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20">
              <Award className="w-12 h-12 mx-auto mb-3" style={{ color: '#E2D9CF' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>暂无评价</h3>
              <p className="text-sm" style={{ color: '#6B6560' }}>完成交易后可以获得评价</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E2D9CF' }}>
                      {review.reviewerAvatar ? (
                        <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <span className="text-sm font-bold" style={{ color: '#6B6560' }}>{review.reviewerName[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{review.reviewerName}</span>
                        <span className="text-xs" style={{ color: '#6B6560' }}>{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5" style={{ color: i < review.rating ? '#E8A84C' : '#E2D9CF' }} fill={i < review.rating ? '#E8A84C' : 'none'} />
                        ))}
                        <span className="text-xs ml-1" style={{ color: '#6B6560' }}>{review.role === 'buyer' ? '买家评价' : '卖家评价'}</span>
                      </div>
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: '#1A1A1A' }}>{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div>
          {loadingFavs ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
                  <div className="aspect-[3/4] animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
                </div>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-12 h-12 mx-auto mb-3" style={{ color: '#E2D9CF' }} />
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>暂无收藏</h3>
              <p className="text-sm mb-4" style={{ color: '#6B6560' }}>浏览书籍并点击心形按钮收藏</p>
              <button onClick={() => onNavigate('browse')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#2D4A3E' }}>去浏览</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {favorites.map((fav, idx) => (
                <button
                  key={fav.id}
                  onClick={() => onNavigate('book-detail', fav.bookId)}
                  className="group text-left rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden" style={{ backgroundColor: '#F7F3EE' }}>
                    <img
                      src={fav.book?.images?.[0] || BOOK_IMAGES[idx % BOOK_IMAGES.length]}
                      alt={fav.book?.title || '书籍'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {fav.book?.status === 'sold' && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <span className="text-white text-sm font-bold">已售出</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: '#1A1A1A' }}>{fav.book?.title}</h3>
                    <p className="text-xs mt-1" style={{ color: '#6B6560' }}>{fav.book?.author}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold" style={{ color: '#C8873A' }}>￦{Number(fav.book?.price).toFixed(0)}</span>
                      <span className="text-xs" style={{ color: '#6B6560' }}>{CONDITION_LABELS[fav.book?.condition || '']}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
