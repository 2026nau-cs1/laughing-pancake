import { useState } from 'react';
import { apiService } from '@/lib/api';
import type { User } from '@shared/types/api';
import type { AppView } from '@/pages/Index';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
  onSuccess: (user: User) => void;
  onNavigate: (view: AppView) => void;
}

export default function AuthView({ mode, onModeChange, onSuccess, onNavigate }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('请填写邮箱和密码'); return; }
    if (mode === 'signup' && !name.trim()) { toast.error('请填写姓名'); return; }
    if (password.length < 6) { toast.error('密码至少6个字符'); return; }

    setLoading(true);
    try {
      let res;
      if (mode === 'signup') {
        res = await apiService.signup({ name, email, password, phone: phone || undefined });
      } else {
        res = await apiService.login({ email, password });
      }

      if (res.success && res.data) {
        localStorage.setItem('bc_token', res.data.token);
        onSuccess(res.data.user as User);
        toast.success(mode === 'signup' ? '注册成功！欢迎加入 BookCircle' : '登录成功！');
      } else {
        toast.error(res.message || (mode === 'signup' ? '注册失败' : '登录失败'));
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#F7F3EE' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => onNavigate('home')} className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2D4A3E' }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Georgia, serif', color: '#2D4A3E' }}>BookCircle</span>
          </button>
          <h1 className="text-2xl font-bold mt-6" style={{ fontFamily: 'Georgia, serif', color: '#1A1A1A' }}>
            {mode === 'login' ? '登录账户' : '创建账户'}
          </h1>
          <p className="text-sm mt-2" style={{ color: '#6B6560' }}>
            {mode === 'login' ? '还没有账户？' : '已有账户？'}
            <button
              onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 font-semibold transition-colors hover:opacity-70"
              style={{ color: '#C8873A' }}
            >
              {mode === 'login' ? '免费注册' : '登录'}
            </button>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2D9CF', boxShadow: '0 4px 12px rgba(45,74,62,0.08)' }}>
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>姓名 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的姓名"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>邮箱 *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
              style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>密码 *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少6个字符"
                className="w-full px-4 py-3 pr-11 rounded-xl text-sm focus:outline-none transition-all"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#6B6560' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: '#6B6560' }}>手机号（可选）</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="联系手机号"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ backgroundColor: '#F7F3EE', border: '1px solid #E2D9CF', color: '#1A1A1A' }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 mt-2"
            style={{ backgroundColor: '#2D4A3E' }}
          >
            {loading ? '处理中...' : (mode === 'login' ? '登录' : '免费注册')}
          </button>

          {mode === 'signup' && (
            <p className="text-xs text-center" style={{ color: '#6B6560' }}>
              注册即表示同意《用户协议》和《隐私政策》
            </p>
          )}
        </form>

        <div className="text-center mt-6">
          <button onClick={() => onNavigate('home')} className="text-sm transition-colors hover:opacity-70" style={{ color: '#6B6560' }}>
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
