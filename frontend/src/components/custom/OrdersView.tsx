import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import type { User, Order } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { Package, CheckCircle, Truck, Clock, XCircle, Star, ShoppingBag, MessageSquare, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending_payment: { label: '待付款', color: '#E67E22', bg: 'rgba(230,126,34,0.1)', icon: Clock },
  paid: { label: '已付款', color: '#27AE60', bg: 'rgba(39,174,96,0.1)', icon: CheckCircle },
  shipped: { label: '已发货', color: '#2D4A3E', bg: 'rgba(45,74,62,0.1)', icon: Truck },
  delivered: { label: '已送达', color: '#C8873A', bg: 'rgba(200,135,58,0.1)', icon: Package },
  confirmed: { label: '交易完成', color: '#27AE60', bg: 'rgba(39,174,96,0.1)', icon: CheckCircle },
  cancelled: { label: '已取消', color: '#6B6560', bg: 'rgba(107,101,96,0.1)', icon: XCircle },
  refunded: { label: '已退款', color: '#C0392B', bg: 'rgba(192,57,43,0.1)', icon: XCircle },
};

const BOOK_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80',
];

export default function OrdersView({ onNavigate, user }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [showReviewModal, setShowReviewModal] = useState<{ orderId: string; revieweeId: string; role: 'buyer' | 'seller' } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshOrders = async () => {
    const res = await apiService.getOrders();
    if (res.success && res.data) setOrders(res.data);
  };

  useEffect(() => {
    let cancelled = false;
    apiService.getOrders().then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setOrders(res.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const buyingOrders = orders.filter((o) => o.buyerId === user.id);
  const sellingOrders = orders.filter((o) => o.sellerId === user.id);
  const displayOrders = activeTab === 'buying' ? buyingOrders : sellingOrders;

  const handleStatusUpdate = async (orderId: string, status: string) => {
    const res = await apiService.updateOrderStatus(orderId, status);
    if (res.success) {
      toast.success('订单状态已更新');
      refreshOrders();
    } else {
      toast.error('操作失败');
    }
  };

  const handleSubmitReview = async () => {
    if (!showReviewModal) return;
    if (!reviewComment.trim()) { toast.error('请输入评价内容'); return; }
    setSubmitting(true);
    const res = await apiService.createReview({
      orderId: showReviewModal.orderId,
      revieweeId: showReviewModal.revieweeId,
      rating: reviewRating,
      comment: reviewComment,
      role: showReviewModal.role,
    });
    setSubmitting(false);
    if (res.success) {
      toast.success('评价已提交！');
      setShowReviewModal(null);
      setReviewComment('');
      setReviewRating(5);
    } else {
      toast.error(res.message || '提交失败');
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>我的订单</h1>
          <p className="text-sm mt-1" style={{ color: '#6B6560' }}>
            共 {displayOrders.length} 笔{activeTab === 'buying' ? '购买' : '出售'}订单
          </p>
        </div>
        <ShoppingBag className="w-8 h-8" style={{ color: '#2D4A3E' }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl mb-6" style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF' }}>
        {[
          { id: 'buying' as const, label: `我购买的`, count: buyingOrders.length },
          { id: 'selling' as const, label: `我出售的`, count: sellingOrders.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.id ? '#2D4A3E' : '#6B6560',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(45,74,62,0.1)' : 'none',
            }}
          >
            {tab.label}
            <span 
              className="px-2 py-0.5 rounded-full text-xs"
              style={{
                backgroundColor: activeTab === tab.id ? 'rgba(45,74,62,0.1)' : 'rgba(107,101,96,0.1)',
                color: activeTab === tab.id ? '#2D4A3E' : '#6B6560'
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
          ))}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#F7F3EE' }}>
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
            <ShoppingBag className="w-10 h-10" style={{ color: '#E2D9CF' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>暂无订单</h3>
          <p className="text-sm mb-6" style={{ color: '#6B6560' }}>
            {activeTab === 'buying' ? '去浏览书籍并下单吧！' : '发布书籍等待买家吧！'}
          </p>
          <button
            onClick={() => onNavigate(activeTab === 'buying' ? 'browse' : 'sell')}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#2D4A3E' }}
          >
            {activeTab === 'buying' ? '去浏览' : '发布书籍'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayOrders.map((order, idx) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
            const StatusIcon = statusCfg.icon;
            const isBuyer = order.buyerId === user.id;
            const canConfirm = isBuyer && order.status === 'delivered';
            const canMarkShipped = !isBuyer && order.status === 'paid';
            const canMarkPaid = isBuyer && order.status === 'pending_payment';
            const canCancel = order.status === 'pending_payment';
            const canReview = order.status === 'confirmed';

            return (
              <div key={order.id} className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
                {/* Order Header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: '#F7F3EE', borderBottom: '1px solid #E2D9CF' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: statusCfg.bg }}>
                      <StatusIcon className="w-5 h-5" style={{ color: statusCfg.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: statusCfg.color }}>{statusCfg.label}</div>
                      <div className="text-xs" style={{ color: '#6B6560' }}>{new Date(order.createdAt).toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" style={{ color: '#E2D9CF' }} />
                </div>

                {/* Order Body */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={order.bookImage || BOOK_IMAGES[idx % BOOK_IMAGES.length]}
                        alt={order.bookTitle}
                        className="w-24 h-32 object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2" style={{ color: '#1A1A1A' }}>{order.bookTitle}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs" style={{ color: '#6B6560' }}>
                          <ShoppingBag className="w-3 h-3" />
                          {isBuyer ? `卖家: ${order.sellerName}` : `买家: ${order.buyerName}`}
                        </div>
                      </div>
                      {order.shippingAddress && (
                        <div className="mt-2 text-xs line-clamp-1" style={{ color: '#6B6560' }}>
                          📍 {order.shippingAddress}
                        </div>
                      )}
                      {order.trackingNumber && (
                        <div className="mt-1 text-xs" style={{ color: '#2D4A3E' }}>
                          📦 快递单号: {order.trackingNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold" style={{ color: '#C8873A' }}>￥{Number(order.price).toFixed(2)}</div>
                      {order.paymentMethod && (
                        <div className="text-xs mt-1" style={{ color: '#6B6560' }}>{order.paymentMethod}</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t" style={{ borderColor: '#E2D9CF' }}>
                    {canMarkPaid && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'paid')}
                        className="flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#27AE60' }}
                      >
                        确认付款
                      </button>
                    )}
                    {canMarkShipped && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'shipped')}
                        className="flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#2D4A3E' }}
                      >
                        确认发货
                      </button>
                    )}
                    {order.status === 'shipped' && isBuyer && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        className="flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#C8873A' }}
                      >
                        确认收到
                      </button>
                    )}
                    {canConfirm && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                        className="flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#27AE60' }}
                      >
                        确认收货
                      </button>
                    )}
                    {canReview && (
                      <button
                        onClick={() => setShowReviewModal({
                          orderId: order.id,
                          revieweeId: isBuyer ? order.sellerId : order.buyerId,
                          role: isBuyer ? 'buyer' : 'seller',
                        })}
                        className="flex items-center justify-center gap-2 flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                        style={{ backgroundColor: 'rgba(232,168,76,0.15)', color: '#C8873A', border: '1px solid rgba(232,168,76,0.3)' }}
                      >
                        <Star className="w-4 h-4" /> 评价
                      </button>
                    )}
                    {canCancel && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                        className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                        style={{ color: '#6B6560', border: '1px solid #E2D9CF' }}
                      >
                        取消订单
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="p-6 border-b" style={{ borderColor: '#E2D9CF' }}>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>交易评价</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="text-sm font-medium mb-4 block" style={{ color: '#1A1A1A' }}>综合评分</label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} className="transition-transform hover:scale-110">
                      <Star
                        className="w-10 h-10 transition-all"
                        style={{ color: star <= reviewRating ? '#E8A84C' : '#E2D9CF' }}
                        fill={star <= reviewRating ? '#E8A84C' : 'none'}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm mt-3" style={{ color: '#6B6560' }}>
                  {reviewRating <= 2 ? '不太满意' : reviewRating === 3 ? '一般般' : reviewRating === 4 ? '很满意' : '非常满意'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-3 block" style={{ color: '#1A1A1A' }}>评价内容</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="分享你的交易体验，帮助其他同学做出选择..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                  style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                />
              </div>
            </div>
            
            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#E2D9CF' }}>
              <button onClick={() => setShowReviewModal(null)} className="flex-1 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80" style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}>
                取消
              </button>
              <button onClick={handleSubmitReview} disabled={submitting} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: '#2D4A3E' }}>
                {submitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
