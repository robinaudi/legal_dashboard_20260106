import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { Lock, Mail, ArrowRight, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { APP_VERSION } from '../constants';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSent, setIsSent] = useState(false);

  // 檢查資料庫權限
  const checkPermissionFromDB = async (email: string): Promise<boolean> => {
    const lowerEmail = email.toLowerCase().trim();
    const domain = lowerEmail.split('@')[1];

    try {
        // 1. 查詢是否符合 EMAIL 規則
        const { data: emailMatch, error: emailError } = await supabase
            .from('access_control')
            .select('*')
            .eq('type', 'EMAIL')
            .eq('value', lowerEmail)
            .single();

        if (emailMatch) return true;

        // 2. 查詢是否符合 DOMAIN 規則
        const { data: domainMatch, error: domainError } = await supabase
            .from('access_control')
            .select('*')
            .eq('type', 'DOMAIN')
            .eq('value', domain)
            .maybeSingle();

        if (domainMatch) return true;

    } catch (e) {
        console.error("Permission check failed:", e);
        return false;
    }
    
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const lowerEmail = email.toLowerCase().trim();

    // 1. 資料庫權限檢查
    const isAllowed = await checkPermissionFromDB(lowerEmail);

    if (!isAllowed) {
        setIsLoading(false);
        setErrorMsg('抱歉，您的 Email 不在允許名單中。請聯繫管理員新增權限。');
        return;
    }

    try {
      // 2. 發送 Magic Link
      // 注意：我們移除了 options.emailRedirectTo 設定
      // 請務必至 Supabase Dashboard -> Authentication -> URL Configuration 設定正確的 Site URL
      const { error } = await supabase.auth.signInWithOtp({
        email: lowerEmail,
      });

      if (error) throw error;
      setIsSent(true);
    } catch (error: any) {
      setErrorMsg(error.message || '登入發送失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm shadow-inner border border-white/30">
                <Lock className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">PatentVault</h1>
            <p className="text-blue-100 text-sm mt-2 opacity-90">企業級專利權管理系統</p>
        </div>

        {/* Body */}
        <div className="p-8">
            {isSent ? (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">請查看您的信箱</h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                        我們已發送登入連結至 <span className="font-bold text-gray-800">{email}</span>。<br/>
                        點擊信中的連結即可直接登入。
                    </p>
                    <button 
                        onClick={() => setIsSent(false)}
                        className="text-blue-600 text-sm hover:underline"
                    >
                        返回重新輸入
                    </button>
                </div>
            ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                            Work Email
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input 
                                type="email" 
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-gray-800 font-medium"
                            />
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 items-start text-red-600 text-sm animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-xs uppercase">
                            <ShieldCheck size={14} />
                            存取限制 (Access Control)
                        </div>
                        <p className="text-xs text-blue-600/80 leading-relaxed">
                            本系統已啟用雲端白名單驗證。
                        </p>
                        <p className="text-xs text-blue-600/80 mt-1">
                            若您無法登入，請確認您已在組織的授權清單中。
                        </p>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading || !email}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                取得登入連結 <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-[10px] text-gray-400">
                <span className="font-mono mr-2">{APP_VERSION}</span>
                &copy; {new Date().getFullYear()} PatentVault Pro. All rights reserved.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;