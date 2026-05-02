'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const sendCode = async () => {
    if (!phone || phone.length < 11) {
      setMessage('请输入正确的手机号');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      // 检查用户是否存在，不存在则创建
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();

      if (!existingUser) {
        await supabase.from('users').insert({ phone, plan: 'free' });
      }

      // 发送验证码（这里先用模拟的方式，实际需要接入阿里云短信）
      // 由于用户没有短信服务，我们先用假的验证码演示
      setMessage('演示模式：验证码为 123456');
      setStep('code');
      setCountdown(60);
    } catch (err) {
      setMessage('发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code !== '123456') {
      setMessage('验证码错误');
      return;
    }
    setLoading(true);

    try {
      // 验证成功，跳转
      window.location.href = '/';
    } catch (err) {
      setMessage('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">简历Pro</h1>
          <p className="text-slate-500 mt-2">登录以开始制作简历</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="138-0000-0000"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入6位验证码"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '验证中...' : '登录'}
            </button>
            <button
              onClick={() => {
                setStep('phone');
                setCode('');
                setMessage('');
              }}
              className="w-full py-2 text-slate-500 text-sm hover:text-slate-700"
            >
              返回重新输入手机号
            </button>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${message.includes('演示模式') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-6">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
}
