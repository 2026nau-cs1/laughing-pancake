import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import type { User, Book } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Heart, MessageCircle, ShoppingCart, Star, ArrowLeft, Shield, Truck, RotateCcw, ChevronLeft, ChevronRight, CreditCard, Smartphone, Wallet, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';
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
  const [orderPhone, setOrderPhone] = useState(user?.phone || '');
  const [orderPayment, setOrderPayment] = useState('alipay');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderStep, setOrderStep] = useState<'confirm' | 'payment' | 'success'>('confirm');
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
    if (!orderPhone.trim()) { toast.error('请填写联系电话'); return; }
    if (!detail) return;
    
    setSubmitting(true);
    
    const paymentNames: Record<string, string> = {
      alipay: '支付宝',
      wechat: '微信支付',
      card: '银行卡',
      cod: '货到付款'
    };
    
    const res = await apiService.createOrder({
      bookId: detail.book.id,
      sellerId: detail.seller.id,
      price: Number(detail.book.price),
      shippingAddress: `${orderAddress} (联系电话: ${orderPhone})`,
      paymentMethod: paymentNames[orderPayment],
      notes: orderNotes,
    });
    
    setSubmitting(false);
    
    if (res.success) {
      setOrderStep('success');
      toast.success('订单创建成功！');
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderStep('confirm');
        onNavigate('orders');
      }, 2000);
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
            <span className="text-3xl font-bold" style={{ color: '#C8873A' }}>￥{Number(detail.book.price).toFixed(2)}</span>
            {detail.book.originalPrice && (
              <span className="text-base line-through" style={{ color: '#6B6560' }}>￥{Number(detail.book.originalPrice).toFixed(2)}</span>
            )}
            {detail.book.originalPrice && (
              <span className="text-sm font-medium" style={{ color: '#27AE60' }}>
                省￥{(Number(detail.book.originalPrice) - Number(detail.book.price)).toFixed(0)}
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
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
            {/* Success State */}
            {orderStep === 'success' ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(39,174,96,0.1)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#27AE60' }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>订单创建成功！</h3>
                <p className="text-sm" style={{ color: '#6B6560' }}>正在跳转到订单页面...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="p-6 border-b" style={{ borderColor: '#E2D9CF' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>确认订单</h3>
                    <button onClick={() => setShowOrderModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                      <XCircle className="w-5 h-5" style={{ color: '#6B6560' }} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                  {/* Book Info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: '#F7F3EE' }}>
                    <img src={images[0]} alt={detail.book.title} className="w-20 h-28 object-cover rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold" style={{ color: '#1A1A1A' }}>{detail.book.title}</div>
                      <div className="text-sm mt-1" style={{ color: '#6B6560' }}>{detail.book.author}</div>
                      <div className="text-xl font-bold mt-2" style={{ color: '#C8873A' }}>￥{Number(detail.book.price).toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: '#1A1A1A' }}>
                      <MapPin className="w-4 h-4" style={{ color: '#2D4A3E' }} />
                      收货信息 *
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          value={orderPhone}
                          onChange={(e) => setOrderPhone(e.target.value)}
                          placeholder="联系电话"
                          className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none"
                          style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                        />
                      </div>
                      <textarea
                        value={orderAddress}
                        onChange={(e) => setOrderAddress(e.target.value)}
                        placeholder="请输入详细收货地址（省市区街道门牌号）"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                        style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                      />
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: '#1A1A1A' }}>
                      <Wallet className="w-4 h-4" style={{ color: '#2D4A3E' }} />
                      支付方式
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'alipay', label: '支付宝', icon: Smartphone, color: '#1677FF' },
                        { id: 'wechat', label: '微信支付', icon: Smartphone, color: '#07C160' },
                        { id: 'card', label: '银行卡', icon: CreditCard, color: '#2D4A3E' },
                        { id: 'cod', label: '货到付款', icon: Wallet, color: '#C8873A' }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setOrderPayment(method.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2"
                          style={{
                            backgroundColor: orderPayment === method.id ? 'rgba(45,74,62,0.05)' : '#FFFFFF',
                            borderColor: orderPayment === method.id ? '#2D4A3E' : '#E2D9CF',
                          }}
                        >
                          <method.icon className="w-6 h-6" style={{ color: orderPayment === method.id ? '#2D4A3E' : method.color }} />
                          <span className="text-sm font-medium" style={{ color: orderPayment === method.id ? '#2D4A3E' : '#1A1A1A' }}>
                            {method.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: '#1A1A1A' }}>留言给卖家（可选）</label>
                    <input
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="比如：希望尽快发货，或者需要特定包装..."
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                    />
                  </div>

                  {/* Order Summary */}
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3EE' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: '#6B6560' }}>商品金额</span>
                      <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>￥{Number(detail.book.price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: '#6B6560' }}>运费</span>
                      <span className="text-sm font-medium" style={{ color: '#27AE60' }}>卖家承担</span>
                    </div>
                    <div className="border-t pt-3 mt-3 flex justify-between items-center" style={{ borderColor: '#E2D9CF' }}>
                      <span className="text-base font-semibold" style={{ color: '#1A1A1A' }}>实付金额</span>
                      <span className="text-2xl font-bold" style={{ color: '#C8873A' }}>￥{Number(detail.book.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t" style={{ borderColor: '#E2D9CF' }}>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
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
                      {submitting ? '提交中...' : '确认付款'}
                    </button>
                  </div>
                </div>
              </>
            )}
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
