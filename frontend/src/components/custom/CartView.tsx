import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import type { User, Book } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, ArrowLeft, CreditCard, Smartphone, Wallet, MapPin, Phone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (view: AppView, bookId?: string) => void;
  user: User | null;
  onAuthRequired: () => void;
}

interface CartItem {
  book: Book;
  seller: { id: string; name: string; school?: string; avatar?: string; reputationScore: number };
  quantity: number;
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
];

export default function CartView({ onNavigate, user, onAuthRequired }: Props) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderAddress, setOrderAddress] = useState(user?.address || '');
  const [orderPhone, setOrderPhone] = useState(user?.phone || '');
  const [orderPayment, setOrderPayment] = useState('alipay');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderStep, setOrderStep] = useState<'info' | 'confirm' | 'success'>('info');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const saved = localStorage.getItem('bc_cart');
    console.log('Cart data from localStorage:', saved);
    if (saved) {
      try {
        const items = JSON.parse(saved);
        console.log('Parsed cart items:', items);
        const fullItems: CartItem[] = [];
        for (const item of items) {
          console.log('Loading book:', item.bookId);
          const res = await apiService.getBook(item.bookId);
          console.log('API response:', res);
          if (res.success && res.data) {
            const data = res.data as any;
            fullItems.push({
              book: data.book,
              seller: data.seller,
              quantity: item.quantity || 1,
            });
          }
        }
        console.log('Full cart items:', fullItems);
        setCartItems(fullItems);
        setSelectedItems(new Set(fullItems.map(i => i.book.id)));
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    }
    setLoading(false);
  };

  const updateCart = (items: CartItem[]) => {
    localStorage.setItem('bc_cart', JSON.stringify(items.map(i => ({ bookId: i.book.id, quantity: i.quantity }))));
    setCartItems(items);
  };

  const handleRemove = (bookId: string) => {
    const newItems = cartItems.filter(i => i.book.id !== bookId);
    updateCart(newItems);
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(bookId);
      return next;
    });
    toast.success('已从购物车移除');
  };

  const handleQuantityChange = (bookId: string, delta: number) => {
    const newItems = cartItems.map(item => {
      if (item.book.id === bookId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    updateCart(newItems);
  };

  const toggleSelect = (bookId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(i => i.book.id)));
    }
  };

  const selectedCartItems = cartItems.filter(i => selectedItems.has(i.book.id));
  const totalPrice = selectedCartItems.reduce((sum, i) => sum + Number(i.book.price) * i.quantity, 0);

  const handleCheckout = async () => {
    if (!user) { onAuthRequired(); return; }
    if (!orderAddress.trim()) { toast.error('请填写收货地址'); return; }
    if (!orderPhone.trim()) { toast.error('请填写联系电话'); return; }
    if (selectedCartItems.length === 0) { toast.error('请选择要购买的书籍'); return; }

    setSubmitting(true);
    
    const paymentNames: Record<string, string> = {
      alipay: '支付宝',
      wechat: '微信支付',
      card: '银行卡',
      cod: '货到付款'
    };

    let successCount = 0;
    for (const item of selectedCartItems) {
      const res = await apiService.createOrder({
        bookId: item.book.id,
        sellerId: item.seller.id,
        price: Number(item.book.price) * item.quantity,
        shippingAddress: `${orderAddress} (联系电话: ${orderPhone})`,
        paymentMethod: paymentNames[orderPayment],
        notes: orderNotes,
      });
      if (res.success) successCount++;
    }

    setSubmitting(false);

    if (successCount === selectedCartItems.length) {
      const newItems = cartItems.filter(i => !selectedItems.has(i.book.id));
      updateCart(newItems);
      setSelectedItems(new Set());
      setOrderStep('success');
      toast.success(`成功创建 ${successCount} 个订单！`);
      setTimeout(() => {
        setShowCheckout(false);
        setOrderStep('info');
        onNavigate('orders');
      }, 2000);
    } else {
      toast.error(`部分订单创建失败（${successCount}/${selectedCartItems.length}）`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: '#E2D9CF' }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('browse')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" style={{ color: '#6B6560' }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>购物车</h1>
            <p className="text-sm" style={{ color: '#6B6560' }}>共 {cartItems.length} 件商品</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(45,74,62,0.1)' }}>
          <CartIcon className="w-5 h-5" style={{ color: '#2D4A3E' }} />
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#F7F3EE' }}>
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
            <CartIcon className="w-10 h-10" style={{ color: '#E2D9CF' }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#1A1A1A' }}>购物车是空的</h3>
          <p className="text-sm mb-6" style={{ color: '#6B6560' }}>快去挑选喜欢的书籍吧！</p>
          <button
            onClick={() => onNavigate('browse')}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#2D4A3E' }}
          >
            去浏览书籍
          </button>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center justify-between mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded"
                style={{ accentColor: '#2D4A3E' }}
              />
              <span className="text-sm font-medium" style={{ color: '#1A1A1A' }}>全选</span>
            </label>
            <span className="text-sm" style={{ color: '#6B6560' }}>已选择 {selectedItems.size} 件商品</span>
          </div>

          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div
                key={item.book.id}
                className="flex gap-4 p-4 rounded-2xl"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF' }}
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.book.id)}
                    onChange={() => toggleSelect(item.book.id)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: '#2D4A3E' }}
                  />
                </label>
                
                <img
                  src={item.book.images?.[0] || PLACEHOLDER_IMAGES[0]}
                  alt={item.book.title}
                  className="w-24 h-32 object-cover rounded-xl flex-shrink-0 cursor-pointer"
                  onClick={() => onNavigate('book-detail', item.book.id)}
                />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold line-clamp-2 cursor-pointer" style={{ color: '#1A1A1A' }} onClick={() => onNavigate('book-detail', item.book.id)}>
                    {item.book.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#6B6560' }}>{item.book.author}</p>
                  <p className="text-xs" style={{ color: '#6B6560' }}>卖家: {item.seller.name}</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-lg font-bold" style={{ color: '#C8873A' }}>￥{Number(item.book.price).toFixed(2)}</div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-lg" style={{ border: '1px solid #E2D9CF' }}>
                        <button
                          onClick={() => handleQuantityChange(item.book.id, -1)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" style={{ color: '#6B6560' }} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium" style={{ color: '#1A1A1A' }}>{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.book.id, 1)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Plus className="w-3 h-3" style={{ color: '#6B6560' }} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemove(item.book.id)}
                        className="p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: '#C0392B' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E2D9CF' }}>
            <div className="max-w-screen-xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm" style={{ color: '#6B6560' }}>合计</div>
                  <div className="text-2xl font-bold" style={{ color: '#C8873A' }}>￥{totalPrice.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => {
                    if (!user) { onAuthRequired(); return; }
                    if (selectedItems.size === 0) { toast.error('请选择要购买的书籍'); return; }
                    setShowCheckout(true);
                  }}
                  disabled={selectedItems.size === 0}
                  className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#2D4A3E' }}
                >
                  去结算 ({selectedItems.size})
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
            {orderStep === 'success' ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(39,174,96,0.1)' }}>
                  <CheckCircle className="w-10 h-10" style={{ color: '#27AE60' }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#1A1A1A' }}>下单成功！</h3>
                <p className="text-sm" style={{ color: '#6B6560' }}>正在跳转到订单页面...</p>
              </div>
            ) : orderStep === 'confirm' ? (
              <>
                <div className="p-6 border-b" style={{ borderColor: '#E2D9CF' }}>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>确认订单</h3>
                </div>
                
                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: '#F7F3EE' }}>
                    <div className="text-sm font-medium" style={{ color: '#1A1A1A' }}>订单摘要</div>
                    {selectedCartItems.map(item => (
                      <div key={item.book.id} className="flex justify-between text-sm">
                        <span style={{ color: '#6B6560' }}>{item.book.title} x{item.quantity}</span>
                        <span className="font-medium" style={{ color: '#C8873A' }}>￥{(Number(item.book.price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-3 mt-3 flex justify-between" style={{ borderColor: '#E2D9CF' }}>
                      <span className="font-semibold" style={{ color: '#1A1A1A' }}>总计</span>
                      <span className="text-xl font-bold" style={{ color: '#C8873A' }}>￥{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3EE' }}>
                    <div className="text-sm font-medium mb-3" style={{ color: '#1A1A1A' }}>收货信息</div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" style={{ color: '#6B6560' }} />
                        <span className="text-sm" style={{ color: '#1A1A1A' }}>{orderPhone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5" style={{ color: '#6B6560' }} />
                        <span className="text-sm" style={{ color: '#1A1A1A' }}>{orderAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#F7F3EE' }}>
                    <div className="text-sm font-medium mb-3" style={{ color: '#1A1A1A' }}>支付方式</div>
                    <div className="text-sm" style={{ color: '#6B6560' }}>
                      {orderPayment === 'alipay' ? '支付宝' : orderPayment === 'wechat' ? '微信支付' : orderPayment === 'card' ? '银行卡' : '货到付款'}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t flex gap-3" style={{ borderColor: '#E2D9CF' }}>
                  <button
                    onClick={() => setOrderStep('info')}
                    className="flex-1 py-3 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}
                  >
                    返回修改
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: '#2D4A3E' }}
                  >
                    {submitting ? '提交中...' : '确认支付'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 border-b" style={{ borderColor: '#E2D9CF' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>填写订单信息</h3>
                    <button onClick={() => setShowCheckout(false)} className="p-2 rounded-full hover:bg-gray-100">
                      <span style={{ color: '#6B6560' }}>✕</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: '#1A1A1A' }}>
                      <Phone className="w-4 h-4" style={{ color: '#2D4A3E' }} />
                      联系电话 *
                    </label>
                    <input
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value)}
                      placeholder="请输入联系电话"
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1" style={{ color: '#1A1A1A' }}>
                      <MapPin className="w-4 h-4" style={{ color: '#2D4A3E' }} />
                      收货地址 *
                    </label>
                    <textarea
                      value={orderAddress}
                      onChange={(e) => setOrderAddress(e.target.value)}
                      placeholder="请输入详细收货地址（省市区街道门牌号）"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                      style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                    />
                  </div>

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

                  <div className="space-y-2">
                    <label className="text-sm font-medium" style={{ color: '#1A1A1A' }}>订单备注（可选）</label>
                    <input
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="给卖家的留言..."
                      className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
                    />
                  </div>
                </div>

                <div className="p-6 border-t flex gap-3" style={{ borderColor: '#E2D9CF' }}>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: '#F7F3EE', color: '#6B6560' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      if (!orderAddress.trim()) { toast.error('请填写收货地址'); return; }
                      if (!orderPhone.trim()) { toast.error('请填写联系电话'); return; }
                      setOrderStep('confirm');
                    }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: '#2D4A3E' }}
                  >
                    确认订单
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
