import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, Trash2, User, Globe, Loader2, Settings, FileText, CheckSquare, Square, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { AccessRule, AppRole, ActionLog, PERMISSIONS } from '../types';

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'USERS' | 'ROLES' | 'LOGS';

const AccessControlModal: React.FC<AccessControlModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('USERS');
  const [isLoading, setIsLoading] = useState(false);

  // --- Users Tab State ---
  const [rules, setRules] = useState<AccessRule[]>([]);
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleType, setNewRuleType] = useState<'EMAIL' | 'DOMAIN'>('EMAIL');
  const [newRuleRole, setNewRuleRole] = useState('USER'); // Default to existing role
  const [availableRoles, setAvailableRoles] = useState<AppRole[]>([]); // For dropdown

  // --- Roles Tab State ---
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');

  // --- Logs Tab State ---
  const [logs, setLogs] = useState<ActionLog[]>([]);

  // -------------------------
  // Fetch Data
  // -------------------------
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Rules
      const { data: rulesData } = await supabase.from('access_control').select('*').order('created_at', { ascending: false });
      setRules(rulesData || []);

      // Fetch Roles
      const { data: rolesData } = await supabase.from('app_roles').select('*').order('created_at', { ascending: true });
      setRoles(rolesData || []);
      setAvailableRoles(rolesData || []);

      // Fetch Logs (Only if on logs tab to save bandwidth)
      if (activeTab === 'LOGS') {
        const { data: logsData } = await supabase.from('action_logs').select('*').order('created_at', { ascending: false }).limit(100);
        setLogs(logsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, activeTab]);

  // -------------------------
  // Handlers: USERS
  // -------------------------
  const handleAddRule = async () => {
    if (!newRuleValue.trim()) return;
    try {
      const { error } = await supabase.from('access_control').insert([{
        value: newRuleValue.trim().toLowerCase(),
        type: newRuleType,
        role: newRuleRole,
      }]);
      if (error) throw error;
      setNewRuleValue('');
      fetchData();
    } catch (e: any) {
      alert(`新增失敗: ${e.message}`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('確定移除此使用者/網域權限？')) return;
    await supabase.from('access_control').delete().eq('id', id);
    fetchData();
  };

  // -------------------------
  // Handlers: ROLES
  // -------------------------
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
        const { error } = await supabase.from('app_roles').insert([{
            role_name: newRoleName.trim().toUpperCase(),
            permissions: [],
            description: '自定義角色'
        }]);
        if (error) throw error;
        setNewRoleName('');
        fetchData();
    } catch(e: any) {
        alert('建立角色失敗 (可能角色名稱重複)');
    }
  };

  const startEditRole = (role: AppRole) => {
    setSelectedRole(role);
    setTempPermissions([...role.permissions]);
    setIsEditingRole(true);
  };

  const togglePermission = (permKey: string) => {
    setTempPermissions(prev => 
        prev.includes(permKey) 
        ? prev.filter(p => p !== permKey) 
        : [...prev, permKey]
    );
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
        const { error } = await supabase
            .from('app_roles')
            .update({ permissions: tempPermissions })
            .eq('role_name', selectedRole.role_name);
        if (error) throw error;
        setIsEditingRole(false);
        fetchData();
    } catch (e) {
        alert('儲存權限失敗');
    }
  };

  const handleDeleteRole = async (roleName: string) => {
      if (roleName === 'ADMIN' || roleName === 'USER') {
          alert('系統預設角色不可刪除');
          return;
      }
      if (!confirm(`確定刪除角色 ${roleName}？`)) return;
      await supabase.from('app_roles').delete().eq('role_name', roleName);
      fetchData();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <Settings size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">系統管理後台</h3>
              <p className="text-xs text-slate-400">權限配置與軌跡追蹤</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'USERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <User size={16} /> 使用者名單
            </button>
            <button 
                onClick={() => setActiveTab('ROLES')}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ROLES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <Shield size={16} /> 角色與權限設定
            </button>
            <button 
                onClick={() => setActiveTab('LOGS')}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'LOGS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                <FileText size={16} /> 操作日誌 (Logs)
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                </div>
            )}

            {/* TAB: USERS */}
            {activeTab === 'USERS' && (
                <div className="p-6 overflow-y-auto custom-scrollbar h-full">
                    {/* Add Rule Form */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-3 items-end">
                         <div className="flex-1 min-w-[120px]">
                            <label className="text-xs text-gray-500 block mb-1">類型</label>
                            <select className="w-full p-2 border rounded-lg text-sm" value={newRuleType} onChange={(e: any) => setNewRuleType(e.target.value)}>
                                <option value="EMAIL">單一 Email</option>
                                <option value="DOMAIN">網域 (@domain.com)</option>
                            </select>
                         </div>
                         <div className="flex-[2] min-w-[200px]">
                            <label className="text-xs text-gray-500 block mb-1">值 (Value)</label>
                            <input type="text" className="w-full p-2 border rounded-lg text-sm" placeholder="user@example.com" value={newRuleValue} onChange={e => setNewRuleValue(e.target.value)} />
                         </div>
                         <div className="flex-1 min-w-[120px]">
                            <label className="text-xs text-gray-500 block mb-1">指派角色</label>
                            <select className="w-full p-2 border rounded-lg text-sm" value={newRuleRole} onChange={e => setNewRuleRole(e.target.value)}>
                                {availableRoles.map(r => (
                                    <option key={r.role_name} value={r.role_name}>{r.role_name}</option>
                                ))}
                            </select>
                         </div>
                         <button onClick={handleAddRule} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">新增</button>
                    </div>

                    {/* Rule List */}
                    <div className="space-y-2">
                        {rules.map(rule => (
                            <div key={rule.id} className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded ${rule.type === 'EMAIL' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                        {rule.type === 'EMAIL' ? <User size={16} /> : <Globe size={16} />}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">{rule.value}</div>
                                        <div className="text-xs text-gray-500">{rule.type} • Role: <span className="font-semibold text-indigo-600">{rule.role}</span></div>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteRule(rule.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: ROLES */}
            {activeTab === 'ROLES' && (
                <div className="flex h-full">
                    {/* Left: Role List */}
                    <div className="w-1/3 border-r border-gray-200 bg-white p-4 flex flex-col">
                        <div className="mb-4 flex gap-2">
                            <input 
                                type="text" 
                                placeholder="新角色名稱 (e.g. AUDITOR)" 
                                className="flex-1 p-2 text-sm border rounded-lg uppercase"
                                value={newRoleName}
                                onChange={e => setNewRoleName(e.target.value)}
                            />
                            <button onClick={handleCreateRole} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus size={18} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {roles.map(role => (
                                <div 
                                    key={role.role_name} 
                                    onClick={() => startEditRole(role)}
                                    className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${selectedRole?.role_name === role.role_name ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">{role.role_name}</div>
                                        <div className="text-xs text-gray-500">{role.permissions.length} 權限</div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.role_name); }}
                                        className="text-gray-300 hover:text-red-500 p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Permission Matrix */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                        {selectedRole ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-800">設定權限: {selectedRole.role_name}</h4>
                                        <p className="text-sm text-gray-500">勾選下方功能以授權給此角色</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingRole(false)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                                        <button onClick={saveRolePermissions} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                            <Save size={16} /> 儲存設定
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(PERMISSIONS).map(([key, value]) => {
                                        const isChecked = tempPermissions.includes(value);
                                        return (
                                            <div 
                                                key={value}
                                                onClick={() => togglePermission(value)}
                                                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-all ${isChecked ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'}`}
                                            >
                                                <div className={isChecked ? 'text-indigo-600' : 'text-gray-300'}>
                                                    {isChecked ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-700">{key}</div>
                                                    <div className="text-xs text-gray-400 font-mono">{value}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Shield size={48} className="mb-4 opacity-20" />
                                <p>請從左側選擇一個角色來設定權限</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: LOGS */}
            {activeTab === 'LOGS' && (
                <div className="p-0 h-full overflow-hidden flex flex-col">
                    <div className="p-4 bg-yellow-50 border-b border-yellow-100 text-xs text-yellow-800 flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>系統僅保留最近 3 個月的操作紀錄。</span>
                        <button onClick={fetchData} className="ml-auto flex items-center gap-1 text-indigo-600 hover:underline">
                            <RotateCcw size={12} /> 重新整理
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 border-b">
                                <tr>
                                    <th className="px-6 py-3">時間</th>
                                    <th className="px-6 py-3">使用者</th>
                                    <th className="px-6 py-3">動作 (Action)</th>
                                    <th className="px-6 py-3">對象 (Target)</th>
                                    <th className="px-6 py-3">詳細資料</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString('zh-TW')}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">{log.user_email}</td>
                                        <td className="px-6 py-3">
                                            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-700 border border-gray-200">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-600">{log.target || '-'}</td>
                                        <td className="px-6 py-3 text-xs text-gray-400 font-mono max-w-[200px] truncate">
                                            {JSON.stringify(log.details)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AccessControlModal;