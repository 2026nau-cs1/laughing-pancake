import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import { apiService } from '@/lib/api';
import type { User } from '@shared/types/api';
import HomeView from '@/components/custom/HomeView';
import BrowseView from '@/components/custom/BrowseView';
import SellView from '@/components/custom/SellView';
import OrdersView from '@/components/custom/OrdersView';
import MessagesView from '@/components/custom/MessagesView';
import ProfileView from '@/components/custom/ProfileView';
import AuthView from '@/components/custom/AuthView';
import BookDetailView from '@/components/custom/BookDetailView';
import CartView from '@/components/custom/CartView';
import { BookOpen, Search, PlusCircle, ShoppingBag, MessageCircle, User as UserIcon, Menu, X, LogOut, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export type AppView = 'home' | 'browse' | 'sell' | 'orders' | 'messages' | 'profile' | 'auth' | 'book-detail' | 'cart';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const token = localStorage.getItem('bc_token');
    if (token) {
      apiService.getMe().then((res) => {
        if (res.success) setUser(res.data);
        else localStorage.removeItem('bc_token');
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('bc_token');
    setUser(null);
    setCurrentView('home');
    toast.success('已退出登录');
  };

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    setCurrentView('home');
  };

  const handleNavigate = (view: AppView, bookId?: string) => {
    if ((view === 'sell' || view === 'orders' || view === 'messages' || view === 'profile' || view === 'cart') && !user) {
      setAuthMode('login');
      setCurrentView('auth');
      return;
    }
    if (bookId) setSelectedBookId(bookId);
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const navItems = [
    { id: 'browse' as AppView, label: '浏览书籍', icon: Search },
    { id: 'sell' as AppView, label: '出售书籍', icon: PlusCircle },
    { id: 'cart' as AppView, label: '购物车', icon: ShoppingCart },
    { id: 'orders' as AppView, label: '我的订单', icon: ShoppingBag },
    { id: 'messages' as AppView, label: '消息', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F3EE', fontFamily: 'system-ui, sans-serif', color: '#1A1A1A' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2D9CF' }} className="sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => handleNavigate('home')} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2D4A3E' }}>
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#2D4A3E' }}>BookCircle</span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className="text-sm font-medium transition-colors duration-200 hover:opacity-80"
                  style={{ color: currentView === item.id ? '#2D4A3E' : '#6B6560' }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: '#2D4A3E' }}
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: '#E2D9CF' }}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-4 h-4" style={{ color: '#6B6560' }} />
                      )}
                    </div>
                    <span>{user.name}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm transition-colors hover:opacity-70"
                    style={{ color: '#6B6560' }}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setAuthMode('login'); setCurrentView('auth'); }}
                    className="text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 hover:opacity-80"
                    style={{ color: '#2D4A3E', borderColor: '#2D4A3E' }}
                  >
                    登录
                  </button>
                  <button
                    onClick={() => { setAuthMode('signup'); setCurrentView('auth'); }}
                    className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: '#2D4A3E' }}
                  >
                    免费注册
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#2D4A3E' }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" style={{ borderTop: '1px solid #E2D9CF', backgroundColor: '#FFFFFF' }}>
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: currentView === item.id ? 'rgba(45,74,62,0.08)' : 'transparent',
                    color: currentView === item.id ? '#2D4A3E' : '#6B6560',
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: '#E2D9CF' }}>
                {user ? (
                  <>
                    <button
                      onClick={() => handleNavigate('profile')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
                      style={{ color: '#2D4A3E' }}
                    >
                      <UserIcon className="w-4 h-4" />
                      {user.name}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium"
                      style={{ color: '#6B6560' }}
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setAuthMode('login'); setCurrentView('auth'); setMobileMenuOpen(false); }}
                      className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all"
                      style={{ color: '#2D4A3E', borderColor: '#2D4A3E' }}
                    >
                      登录
                    </button>
                    <button
                      onClick={() => { setAuthMode('signup'); setCurrentView('auth'); setMobileMenuOpen(false); }}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                      style={{ backgroundColor: '#2D4A3E' }}
                    >
                      注册
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>
        {currentView === 'home' && (
          <HomeView onNavigate={handleNavigate} user={user} />
        )}
        {currentView === 'browse' && (
          <BrowseView onNavigate={handleNavigate} user={user} />
        )}
        {currentView === 'book-detail' && selectedBookId && (
          <BookDetailView
            bookId={selectedBookId}
            onNavigate={handleNavigate}
            user={user}
            onAuthRequired={() => { setAuthMode('login'); setCurrentView('auth'); }}
          />
        )}
        {currentView === 'cart' && (
          <CartView
            onNavigate={handleNavigate}
            user={user}
            onAuthRequired={() => { setAuthMode('login'); setCurrentView('auth'); }}
          />
        )}
        {currentView === 'sell' && user && (
          <SellView onNavigate={handleNavigate} user={user} />
        )}
        {currentView === 'orders' && user && (
          <OrdersView onNavigate={handleNavigate} user={user} />
        )}
        {currentView === 'messages' && user && (
          <MessagesView onNavigate={handleNavigate} user={user} />
        )}
        {currentView === 'profile' && user && (
          <ProfileView onNavigate={handleNavigate} user={user} onUserUpdate={setUser} />
        )}
        {currentView === 'auth' && (
          <AuthView
            mode={authMode}
            onModeChange={setAuthMode}
            onSuccess={handleAuthSuccess}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40" style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E2D9CF' }}>
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'home' as AppView, label: '首页', icon: BookOpen },
            { id: 'browse' as AppView, label: '浏览', icon: Search },
            { id: 'sell' as AppView, label: '出售', icon: PlusCircle },
            { id: 'orders' as AppView, label: '订单', icon: ShoppingBag },
            { id: user ? 'profile' as AppView : 'auth' as AppView, label: user ? '我的' : '登录', icon: UserIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'auth') { setAuthMode('login'); }
                handleNavigate(item.id);
              }}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[44px]"
              style={{ color: currentView === item.id ? '#2D4A3E' : '#6B6560' }}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <OmniflowBadge />
      <Toaster />
    </div>
  );
};

export default Index;
