import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, Trash2, User, Globe, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { AccessRule } from '../types';

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccessControlModal: React.FC<AccessControlModalProps> = ({ isOpen, onClose }) => {
  const [rules, setRules] = useState<AccessRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'EMAIL' | 'DOMAIN'>('EMAIL');
  const [newRole, setNewRole] = useState<'ADMIN' | 'USER'>('USER');
  const [newDesc, setNewDesc] = useState('');

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('access_control')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      alert('無法讀取權限列表，請確認資料庫設定。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  const handleAddRule = async () => {
    if (!newValue.trim()) return;
    setIsAdding(true);

    try {
      const { error } = await supabase.from('access_control').insert([{
        value: newValue.trim().toLowerCase(),
        type: newType,
        role: newRole,
        description: newDesc
      }]);

      if (error) throw error;
      
      setNewValue('');
      setNewDesc('');
      await fetchRules();
    } catch (error: any) {
      alert(`新增失敗: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('確定要移除此權限規則嗎？移除後該使用者可能無法再登入。')) return;

    try {
      const { error } = await supabase.from('access_control').delete().eq('id', id);
      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      alert('刪除失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">權限管理中心</h3>
              <p className="text-xs text-gray-500">管理可存取本系統的白名單與管理員</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50">
          
          {/* Add New Section */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Plus size={16} /> 新增規則
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">類型</label>
                    <select 
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                    >
                        <option value="EMAIL">單一 Email</option>
                        <option value="DOMAIN">網域 (@xxx.com)</option>
                    </select>
                </div>
                <div className="md:col-span-4">
                    <label className="text-xs text-gray-500 block mb-1">值 (Value)</label>
                    <input 
                        type="text" 
                        placeholder={newType === 'EMAIL' ? 'user@company.com' : 'company.com'}
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                </div>
                 <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">角色權限</label>
                    <select 
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as any)}
                    >
                        <option value="USER">一般使用者</option>
                        <option value="ADMIN">系統管理員</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="text-xs text-gray-500 block mb-1">備註 (可選)</label>
                    <input 
                        type="text" 
                        placeholder="例如: 財務部"
                        className="w-full p-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-indigo-500"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                    />
                </div>
                <div className="md:col-span-2">
                    <button 
                        onClick={handleAddRule}
                        disabled={isAdding || !newValue}
                        className="w-full p-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                    >
                        {isAdding ? <Loader2 size={16} className="animate-spin mx-auto"/> : '新增'}
                    </button>
                </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
                * 網域設定範例：若輸入 <code className="bg-gray-100 px-1 rounded">91app.com</code>，則所有該網域信箱皆可登入。
            </p>
          </div>

          {/* List Section */}
          <div className="space-y-3">
             {isLoading ? (
                 <div className="text-center py-8 text-gray-400">
                     <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                     讀取中...
                 </div>
             ) : rules.length === 0 ? (
                 <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                     尚無權限規則，請先新增。
                 </div>
             ) : (
                 rules.map(rule => (
                     <div key={rule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${rule.type === 'EMAIL' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                {rule.type === 'EMAIL' ? <User size={18} /> : <Globe size={18} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-bold text-gray-800">{rule.value}</span>
                                    {rule.role === 'ADMIN' && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                            ADMIN
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 flex gap-2">
                                    <span>{rule.type === 'DOMAIN' ? '網域白名單' : '特定使用者'}</span>
                                    {rule.description && (
                                        <>
                                            <span>•</span>
                                            <span>{rule.description}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="刪除此規則"
                        >
                            <Trash2 size={18} />
                        </button>
                     </div>
                 ))
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AccessControlModal;
