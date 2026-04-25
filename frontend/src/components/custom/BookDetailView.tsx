import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import type { User, Book } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Heart, MessageCircle, ShoppingCart, Star, ArrowLeft, Shield, Truck, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  bookId: string;
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User | null;
  onAuthRequired: () => void;
}

type BookDetail = {
  book: Book;
  seller: { id: string; name: string; school?: string; avatar?: string; reputationScore: number };
  isFavorited: boolean;
};

const CONDITION_LABELS: Record<string, string> = {
  brand_new: '全新', like_new: '九成新', good: '八成新', fair: '七成新', poor: '六成新以下',
};
const CONDITION_COLORS: Record<string, string> = {
  brand_new: '#2D4A3E', like_new: '#27AE60', good: '#E8A84C', fair: '#E67E22', poor: '#C0392B',
};
const CATEGORY_LABELS: Record<string, string> = {
  textbook: '教材教辅', literature: '文学小说', exam_prep: '考研备考',
  language: '外语学习', computer: '计算机', science: '科学技术',
  history: '历史文化', art: '艺术设计', other: '其他',
};
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80',
];

export default function BookDetailView({ bookId, onNavigate, user, onAuthRequired }: Props) {
  const [detail, setDetail] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [orderAddress, setOrderAddress] = useState(user?.address || '');
  const [orderPayment, setOrderPayment] = useState('支付宝');
  const [orderNotes, setOrderNotes] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiService.getBook(bookId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setDetail(res.data as BookDetail);
        setIsFavorited(res.data.isFavorited);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [bookId]);

  const handleFavorite = async () => {
    if (!user) { onAuthRequired(); return; }
    const res = await apiService.toggleFavorite(bookId);
    if (res.success) {
      setIsFavorited(res.data.favorited);
      toast.success(res.data.favorited ? '已收藏' : '已取消收藏');
    }
  };

  const handleOrder = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!orderAddress.trim()) { toast.error('请填写收货地址'); return; }
    if (!detail) return;
    setSubmitting(true);
    const res = await apiService.createOrder({
      bookId: detail.book.id,
      sellerId: detail.seller.id,
      price: Number(detail.book.price),
      shippingAddress: orderAddress,
      paymentMethod: orderPayment,
      notes: orderNotes,
    });
    setSubmitting(false);
    if (res.success) {
      toast.success('订单创建成功！请尽快完成支付。');
      setShowOrderModal(false);
      onNavigate('orders');
    } else {
      toast.error(res.message || '创建订单失败');
    }
  };

  const handleSendMessage = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!messageContent.trim()) { toast.error('请输入消息内容'); return; }
    if (!detail) return;
    setSubmitting(true);
    const res = await apiService.sendMessage({
      bookId: detail.book.id,
      receiverId: detail.seller.id,
      content: messageContent,
    });
    setSubmitting(false);
    if (res.success) {
      toast.success('消息已发送！');
      setShowMessageModal(false);
      setMessageContent('');
      onNavigate('messages');
    } else {
      toast.error(res.message || '发送失败');
    }
  };

  const handleReport = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!reportReason.trim()) { toast.error('请选择举报原因'); return; }
    toast.success('举报已提交，我们将尽快处理。');
    setShowReportModal(false);
    setReportReason('');
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="aspect-[3/4] rounded-2xl animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 rounded animate-pulse" style={{ backgroundColor: '#E2D9CF', width: `${80 - i * 10}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-20">
        <p style={{ color: '#6B6560' }}>书籍不存在或已下架</p>
        <button onClick={() => onNavigate('browse')} className="mt-4 text-sm" style={{ color: '#2D4A3E' }}>返回浏览</button>
      </div>
    );
  }

  const images = detail.book.images?.length > 0 ? detail.book.images : PLACEHOLDER_IMAGES;
  const isOwner = user?.id === detail.book.sellerId;
  const isSold = detail.book.status === 'sold' || detail.book.status === 'reserved';

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
      {/* Back */}
      <button
        onClick={() => onNavigate('browse')}
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-70"
        style={{ color: '#6B6560' }}
      >
        <ArrowLeft className="w-4 h-4" /> 返回浏览
      </button>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden" style={{ backgroundColor: '#F7F3EE' }}>
            <img src={images[currentImageIdx]} alt={detail.book.title} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIdx((i) => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: '#1A1A1A' }} />
                </button>
                <button
                  onClick={() => setCurrentImageIdx((i) => Math.min(images.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: '#1A1A1A' }} />
                </button>
              </>
            )}
            <div
              className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: CONDITION_COLORS[detail.book.condition] || '#6B6560' }}
            >
              {CONDITION_LABELS[detail.book.condition] || detail.book.condition}
            </div>
            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <span className="text-white text-2xl font-bold">{detail.book.status === 'sold' ? '已售出' : '已预订'}</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIdx(i)}
                  className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                  style={{ borderColor: currentImageIdx === i ? '#2D4A3E' : 'transparent' }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(45,74,62,0.1)', color: '#2D4A3E' }}>
                {CATEGORY_LABELS[detail.book.category] || detail.book.category}
              </span>
            </div>
            <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>{detail.book.title}</h1>
            <p className="text-base mt-1" style={{ color: '#6B6560' }}>{detail.book.author}</p>
            {detail.book.publisher && (
              <p className="text-sm mt-0.5" style={{ color: '#6B6560' }}>{detail.book.publisher}{detail.book.publishYear ? ` · ${detail.book.publishYear}年` : ''}</p>
            )}
            {detail.book.isbn && (
              <p className="text-xs mt-0.5" style={{ color: '#6B6560' }}>ISBN: {detail.book.isbn}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold" style={{ color: '#C8873A' }}>￦{Number(detail.book.price).toFixed(2)}</span>
            {detail.book.originalPrice && (
              <span className="text-base line-through" style={{ color: '#6B6560' }}>￦{Number(detail.book.originalPrice).toFixed(2)}</span>
            )}
            {detail.book.originalPrice && (
              <span className="text-sm font-medium" style={{ color: '#27AE60' }}>
                省￦{(Number(detail.book.originalPrice) - Number(detail.book.price)).toFixed(0)}
              </span>
            )}
          </div>

          {/* Description */}
          {detail.book.description && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF' }}>
              <p className="text-sm leading-relaxed" style={{ color: '#1A1A1A' }}>{detail.book.description}</p>
            </div>
          )}

          {/* Seller */}
          <div className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#E2D9CF' }}>
              {detail.seller.avatar ? (
                <img src={detail.seller.avatar} alt={detail.seller.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold" style={{ color: '#6B6560' }}>{detail.seller.name[0]}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{detail.seller.name}</div>
              <div className="text-xs" style={{ color: '#6B6560' }}>{detail.seller.school || '未知学校'}</div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-current" style={{ color: '#E8A84C' }} />
              <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{Number(detail.seller.reputationScore).toFixed(1)}</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: '担保交易' },
              { icon: Truck, label: '快速发货' },
              { icon: RotateCcw, label: '确认收货后付款' },
            ].map((badge) => (
              <div key={badge.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF' }}>
                <badge.icon className="w-5 h-5" style={{ color: '#2D4A3E' }} />
                <span className="text-xs text-center" style={{ color: '#6B6560' }}>{badge.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          {!isOwner && (
            <div className="flex gap-3">
              <button
                onClick={handleFavorite}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: isFavorited ? 'rgba(192,57,43,0.08)' : '#FFFFFF',
                  borderColor: isFavorited ? '#C0392B' : '#E2D9CF',
                  color: isFavorited ? '#C0392B' : '#6B6560',
                }}
              >
                <Heart className="w-4 h-4" fill={isFavorited ? '#C0392B' : 'none'} />
                {isFavorited ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={() => setShowMessageModal(true)}
                disabled={isSold}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
                style={{ backgroundColor: '#FFFFFF', borderColor: '#E2D9CF', color: '#2D4A3E' }}
              >
                <MessageCircle className="w-4 h-4" />
                联系卖家
              </button>
              <button
                onClick={() => setShowOrderModal(true)}
                disabled={isSold}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: isSold ? '#6B6560' : '#2D4A3E' }}
              >
                <ShoppingCart className="w-4 h-4" />
                {detail.book.status === 'sold' ? '已售出' : detail.book.status === 'reserved' ? '已预订' : '立即购买'}
              </button>
            </div>
          )}

          {isOwner && (
            <div className="flex gap-3">
              <button
                onClick={() => onNavigate('sell')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#2D4A3E' }}
              >
                管理我的书籍
              </button>
            </div>
          )}

          {/* Report */}
          {!isOwner && (
            <button
              onClick={() => setShowReportModal(true)}
              className="text-xs transition-colors hover:opacity-70"
              style={{ color: '#6B6560' }}
            >
              举报该书籍
            </button>
          )}
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>确认订单</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#F7F3EE' }}>
                <img src={images[0]} alt={detail.book.title} className="w-12 h-16 object-cover rounded-lg" />
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#1A1A1A' }}>{detail.book.title}</div>
                  <div className="text-lg font-bold mt-1" style={{ color: '#C8873A' }}>￦{Number(detail.book.price).toFixed(2)}</div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>收货地址 *</label>
                <textarea
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  placeholder="请输入详细收货地址"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>支付方式</label>
                <div className="flex gap-2">
                  {['支付宝', '微信支付'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setOrderPayment(method)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        backgroundColor: orderPayment === method ? '#2D4A3E' : '#F7F3EE',
                        color: orderPayment === method ? '#FFFFFF' : '#6B6560',
                        border: '1px solid',
                        borderColor: orderPayment === method ? '#2D4A3E' : '#E2D9CF',
                      }}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>留言（可选）</label>
                <input
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="向卖家说点什么..."
                  className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}
              >
                取消
              </button>
              <button
                onClick={handleOrder}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#2D4A3E' }}
              >
                {submitting ? '提交中...' : '确认购买'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>联系卖家</h3>
            <p className="text-sm mb-4" style={{ color: '#6B6560' }}>向 {detail.seller.name} 发送消息</p>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="你好，我对这本书感兴趣，请问还在吗？"
              rows={4}
              className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none resize-none mb-4"
              style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}
              >
                取消
              </button>
              <button
                onClick={handleSendMessage}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#2D4A3E' }}
              >
                {submitting ? '发送中...' : '发送消息'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF' }}>
            <h3 className="text-lg font-bold mb-4" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>举报该书籍</h3>
            <div className="space-y-2 mb-4">
              {['信息不实', '假冒他人书籍', '价格虚高', '重复发布', '其他违规'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    backgroundColor: reportReason === reason ? 'rgba(192,57,43,0.1)' : '#F7F3EE',
                    color: reportReason === reason ? '#C0392B' : '#1A1A1A',
                    border: '1px solid',
                    borderColor: reportReason === reason ? '#C0392B' : '#E2D9CF',
                  }}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}>取消</button>
              <button onClick={handleReport} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#C0392B' }}>提交举报</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
