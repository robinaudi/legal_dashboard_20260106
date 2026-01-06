import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, Trash2, User, Globe, Loader2, Settings, FileText, CheckSquare, Square, Save, RotateCcw, AlertCircle, Edit, AlertTriangle, Search, Laptop, Edit3, Filter } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { AccessRule, AppRole, ActionLog, PERMISSIONS, ROLE_LEVELS } from '../types';

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'USERS' | 'ROLES' | 'LOGS';

// Helper for Aliasing
const ALIAS_DOMAIN_MAP: Record<string, string> = {
  'nine-yi.com': '91app.com',
  '91app.com': 'nine-yi.com'
};

const normalizeEmail = (val: string) => {
    const parts = val.toLowerCase().split('@');
    if (parts.length !== 2) return val;
    if (parts[1] === 'nine-yi.com') return `${parts[0]}@91app.com`;
    return val;
};

const getMirrorEmail = (val: string) => {
    const parts = val.toLowerCase().split('@');
    if (parts.length !== 2) return null;
    const mirrorDomain = ALIAS_DOMAIN_MAP[parts[1]];
    if (!mirrorDomain) return null;
    return `${parts[0]}@${mirrorDomain}`;
};

// --- Helper Component: Highlight Text ---
const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) {
        return <span className="text-gray-900">{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span className="text-gray-900">
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-200 text-gray-900 font-semibold rounded-[2px] px-0.5 mx-0.5">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const AccessControlModal: React.FC<AccessControlModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('USERS');
  const [isLoading, setIsLoading] = useState(false);

  // --- Users Tab State ---
  const [rules, setRules] = useState<AccessRule[]>([]); // Raw rules
  const [groupedUsers, setGroupedUsers] = useState<Record<string, string[]>>({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL'); // 新增：角色篩選狀態
  
  const [newUserValue, setNewUserValue] = useState('');
  const [newUserType, setNewUserType] = useState<'EMAIL' | 'DOMAIN'>('EMAIL');
  const [selectedRolesForNewUser, setSelectedRolesForNewUser] = useState<string[]>(['USER']);
  
  const [availableRoles, setAvailableRoles] = useState<AppRole[]>([]); // For dropdown
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // --- Roles Tab State ---
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [isRenamingRole, setIsRenamingRole] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // --- Logs Tab State ---
  const [logs, setLogs] = useState<ActionLog[]>([]);

  // -------------------------
  // Fetch Data & Grouping
  // -------------------------
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Rules
      const { data: rulesData } = await supabase.from('access_control').select('*').order('created_at', { ascending: false });
      const rawRules = rulesData || [];
      setRules(rawRules);

      // Group Rules by Normalized User
      const groups: Record<string, Set<string>> = {};
      rawRules.forEach((r: AccessRule) => {
          let key = r.value.toLowerCase();
          if (r.type === 'EMAIL') key = normalizeEmail(key);
          if (!groups[key]) groups[key] = new Set();
          groups[key].add(r.role);
      });
      
      const processedGroups: Record<string, string[]> = {};
      Object.keys(groups).forEach(key => {
          processedGroups[key] = Array.from(groups[key]).sort((a, b) => (ROLE_LEVELS[b] || 0) - (ROLE_LEVELS[a] || 0));
      });
      setGroupedUsers(processedGroups);

      // Fetch Roles
      const { data: rolesData } = await supabase.from('app_roles').select('*').order('created_at', { ascending: true });
      setRoles(rolesData || []);
      setAvailableRoles(rolesData || []);

      // Fetch Logs (Only LOGIN)
      if (activeTab === 'LOGS') {
        const { data: logsData } = await supabase
            .from('action_logs')
            .select('*')
            .eq('action', 'LOGIN') // Only show Login logs
            .order('created_at', { ascending: false })
            .limit(100);
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
      setDuplicateWarning(null);
      setNewUserValue('');
      setSelectedRolesForNewUser(['USER']);
      setIsRenamingRole(false);
      setRoleFilter('ALL'); // Reset filter
    }
  }, [isOpen, activeTab]);

  // -------------------------
  // Handlers: USERS
  // -------------------------
  const checkDuplicate = (val: string) => {
      const normalized = normalizeEmail(val.toLowerCase().trim());
      if (groupedUsers[normalized]) {
          setDuplicateWarning(`警告：使用者 ${normalized} 已存在。繼續操作將會合併/更新其權限。`);
      } else {
          setDuplicateWarning(null);
      }
  };

  const handleAddOrUpdateUser = async () => {
    if (!newUserValue.trim()) return;
    const mainValue = newUserValue.trim().toLowerCase();
    const mirrorValue = newUserType === 'EMAIL' ? getMirrorEmail(mainValue) : null;
    const valuesToProcess = [mainValue];
    if (mirrorValue) valuesToProcess.push(mirrorValue);

    setIsLoading(true);
    try {
        await supabase.from('access_control').delete().eq('type', newUserType).in('value', valuesToProcess);
        const newRows = [];
        for (const val of valuesToProcess) {
            for (const role of selectedRolesForNewUser) {
                newRows.push({ value: val, type: newUserType, role: role });
            }
        }
        const { error } = await supabase.from('access_control').insert(newRows);
        if (error) throw error;
        setNewUserValue('');
        setSelectedRolesForNewUser(['USER']);
        setDuplicateWarning(null);
        fetchData();
    } catch (e: any) {
        alert(`操作失敗: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteUser = async (normalizedValue: string) => {
    if (!confirm(`確定移除使用者 ${normalizedValue} 及其所有別名帳號的權限？`)) return;
    const mirrorValue = getMirrorEmail(normalizedValue);
    const valuesToDelete = [normalizedValue];
    if (mirrorValue) valuesToDelete.push(mirrorValue);
    // Explicitly convert to string to prevent 'unknown' type errors
    const valStr = String(normalizedValue);
    const type = valStr.includes('@') ? 'EMAIL' : 'DOMAIN';
    await supabase.from('access_control').delete().eq('type', type).in('value', valuesToDelete);
    fetchData();
  };

  const toggleNewUserRole = (role: string) => {
      setSelectedRolesForNewUser(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  // Filter Users
  const filteredUserEntries = Object.entries(groupedUsers).filter(([user, userRoles]) => {
    // Cast userRoles to string[] to avoid 'unknown' type error in some TS environments
    const roles = userRoles as string[];
    const matchesSearch = user.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || roles.includes(roleFilter); // 角色篩選邏輯
    return matchesSearch && matchesRole;
  });

  // Sort Available Roles by Priority (Descending)
  const sortedAvailableRoles = [...availableRoles].sort((a, b) => 
    (ROLE_LEVELS[b.role_name] || 0) - (ROLE_LEVELS[a.role_name] || 0)
  );

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
    setIsRenamingRole(false);
  };

  const startRenameRole = () => {
      if (!selectedRole) return;
      if (['ADMIN', 'USER'].includes(selectedRole.role_name)) {
          alert('系統預設角色名稱不可修改');
          return;
      }
      setRenameValue(selectedRole.role_name);
      setIsRenamingRole(true);
  };

  const handleRenameConfirm = async () => {
    if (!selectedRole || !renameValue.trim()) return;
    if (renameValue.trim().toUpperCase() === selectedRole.role_name) {
        setIsRenamingRole(false);
        return;
    }
    
    const oldName = selectedRole.role_name;
    const newName = renameValue.trim().toUpperCase();

    if (!confirm(`確定將角色 "${oldName}" 改名為 "${newName}"？\n所有擁有此角色的使用者將自動更新。`)) return;

    setIsLoading(true);
    try {
        // 1. Create New Role with same permissions
        const { error: createError } = await supabase.from('app_roles').insert([{
            role_name: newName,
            permissions: selectedRole.permissions,
            description: selectedRole.description
        }]);
        if (createError) throw createError;

        // 2. Migrate Users (Update access_control)
        const { error: updateError } = await supabase
            .from('access_control')
            .update({ role: newName })
            .eq('role', oldName);
        if (updateError) throw updateError;

        // 3. Delete Old Role
        const { error: deleteError } = await supabase
            .from('app_roles')
            .delete()
            .eq('role_name', oldName);
        if (deleteError) throw deleteError;

        setIsRenamingRole(false);
        setSelectedRole(null); // Deselect
        fetchData(); // Refresh all
    } catch (e: any) {
        alert('改名失敗：' + e.message);
    } finally {
        setIsLoading(false);
    }
  };

  const togglePermission = (permKey: string) => {
    setTempPermissions(prev => prev.includes(permKey) ? prev.filter(p => p !== permKey) : [...prev, permKey]);
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
      if (['ADMIN', 'USER'].includes(roleName)) { alert('系統預設角色不可刪除'); return; }
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
              <p className="text-xs text-slate-400">權限配置與日誌追蹤</p>
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
                <FileText size={16} /> 登入日誌 (Login Logs)
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
                <div className="p-6 overflow-y-auto custom-scrollbar h-full flex flex-col gap-6 relative">
                    
                    {/* Add/Edit Panel */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 shrink-0">
                         <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Plus size={16} className="text-indigo-600"/> 新增/編輯使用者權限
                         </h4>
                         <div className="flex flex-wrap gap-4 items-start">
                             <div className="w-[140px]">
                                <label className="text-xs text-gray-500 block mb-1">類型</label>
                                <select className="w-full p-2 border rounded-lg text-sm bg-gray-50" value={newUserType} onChange={(e: any) => setNewUserType(e.target.value)}>
                                    <option value="EMAIL">單一 Email</option>
                                    <option value="DOMAIN">網域 (@domain.com)</option>
                                </select>
                             </div>
                             <div className="flex-1 min-w-[200px]">
                                <label className="text-xs text-gray-500 block mb-1">值 (Value)</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded-lg text-sm" 
                                    placeholder={newUserType === 'EMAIL' ? "user@91app.com" : "91app.com"} 
                                    value={newUserValue} 
                                    onChange={e => {
                                        setNewUserValue(e.target.value);
                                        checkDuplicate(e.target.value);
                                    }} 
                                />
                                {duplicateWarning && (
                                    <div className="mt-1 flex items-center gap-1 text-orange-600 text-xs">
                                        <AlertTriangle size={12} />
                                        {duplicateWarning}
                                    </div>
                                )}
                             </div>
                         </div>
                         <div className="mt-3">
                             <label className="text-xs text-gray-500 block mb-2">指派角色 (系統自動依權重排序)</label>
                             <div className="flex flex-wrap gap-2">
                                {/* 使用排序後的 sortedAvailableRoles 渲染 */}
                                {sortedAvailableRoles.map(r => {
                                    const isSelected = selectedRolesForNewUser.includes(r.role_name);
                                    return (
                                        <button 
                                            key={r.role_name}
                                            onClick={() => toggleNewUserRole(r.role_name)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                                                isSelected 
                                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                                : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                                            }`}
                                        >
                                            {isSelected && <CheckSquare size={12} />}
                                            {r.role_name}
                                            <span className="opacity-50 text-[10px] ml-1">Lv.{ROLE_LEVELS[r.role_name] || 0}</span>
                                        </button>
                                    );
                                })}
                             </div>
                         </div>
                         <div className="mt-4 flex justify-end">
                            <button 
                                onClick={handleAddOrUpdateUser} 
                                disabled={selectedRolesForNewUser.length === 0}
                                className="bg-indigo-600 disabled:bg-indigo-300 text-white px-5 py-2 rounded-lg text-sm hover:bg-indigo-700 shadow-sm transition-all"
                            >
                                {duplicateWarning ? '更新權限' : '新增使用者'}
                            </button>
                         </div>
                    </div>

                    {/* Search & Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
                        {/* Notion-Style Sticky Search Bar & Filter */}
                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex flex-col">
                            {/* Role Filters */}
                            <div className="px-3 pt-3 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
                                <div className="flex items-center text-gray-400 mr-2 text-xs font-medium uppercase shrink-0">
                                    <Filter size={12} className="mr-1"/> 篩選
                                </div>
                                <button 
                                    onClick={() => setRoleFilter('ALL')}
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                                        roleFilter === 'ALL' 
                                        ? 'bg-gray-800 text-white border-gray-800' 
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    全部
                                </button>
                                {sortedAvailableRoles.map(r => (
                                    <button 
                                        key={r.role_name}
                                        onClick={() => setRoleFilter(r.role_name)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                                            roleFilter === r.role_name 
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        {r.role_name}
                                    </button>
                                ))}
                            </div>

                            {/* Search Input */}
                            <div className="p-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="搜尋使用者 Email 或網域..." 
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-9 py-2 bg-gray-50 hover:bg-gray-100 focus:bg-white rounded-lg text-sm transition-all outline-none ring-1 ring-transparent focus:ring-indigo-200 focus:shadow-sm placeholder:text-gray-400"
                                    />
                                    {userSearchTerm && (
                                        <button 
                                            onClick={() => setUserSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-auto max-h-[400px] custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold border-b">
                                    <tr>
                                        <th className="px-5 py-3 w-[60px]">類型</th>
                                        <th className="px-5 py-3">使用者 / 網域</th>
                                        <th className="px-5 py-3">擁有角色 (權重由高至低)</th>
                                        <th className="px-5 py-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredUserEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Search size={32} className="opacity-20" />
                                                    {userSearchTerm || roleFilter !== 'ALL' ? (
                                                        <span>
                                                            找不到符合條件的使用者
                                                            {roleFilter !== 'ALL' && <span className="block text-xs mt-1">篩選角色: <span className="font-bold">{roleFilter}</span></span>}
                                                        </span>
                                                    ) : (
                                                        <span>目前無任何權限規則</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUserEntries.map(([user, userRoles]) => {
                                            const type = user.includes('@') ? 'EMAIL' : 'DOMAIN';
                                            return (
                                                <tr key={user} className="hover:bg-gray-50 group">
                                                    <td className="px-5 py-4">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'EMAIL' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                            {type === 'EMAIL' ? <User size={16} /> : <Globe size={16} />}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 font-medium">
                                                        <HighlightText text={user} highlight={userSearchTerm} />
                                                        {type === 'EMAIL' && user.includes('91app.com') && (
                                                            <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
                                                                (自動同步: <HighlightText text={getMirrorEmail(user) || ''} highlight={userSearchTerm} />)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(userRoles as string[]).map((role, idx) => (
                                                                <span 
                                                                    key={idx} 
                                                                    className={`px-2 py-0.5 rounded text-xs font-bold border ${idx === 0 ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                                                >
                                                                    {role}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex justify-end gap-2 opacity-100">
                                                            <button 
                                                                onClick={() => {
                                                                    setNewUserType(type as any);
                                                                    setNewUserValue(user);
                                                                    setSelectedRolesForNewUser(userRoles as string[]);
                                                                    setDuplicateWarning(`正在編輯 ${user}`);
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                                title="編輯"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="刪除"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                        <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                            {role.role_name}
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">Lv.{ROLE_LEVELS[role.role_name] || 0}</span>
                                        </div>
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
                                    <div className="flex items-center gap-3">
                                        {isRenamingRole ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    autoFocus
                                                    type="text" 
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value.toUpperCase())}
                                                    className="border border-indigo-300 rounded px-2 py-1 text-lg font-bold text-gray-800 uppercase focus:ring-2 focus:ring-indigo-200 outline-none"
                                                />
                                                <button onClick={handleRenameConfirm} className="text-white bg-indigo-600 p-1 rounded hover:bg-indigo-700"><CheckSquare size={16}/></button>
                                                <button onClick={() => setIsRenamingRole(false)} className="text-gray-500 bg-gray-100 p-1 rounded hover:bg-gray-200"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                    {selectedRole.role_name}
                                                    <button 
                                                        onClick={startRenameRole}
                                                        className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                                        title="修改角色名稱"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                </h4>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditingRole(false)} className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                                        <button onClick={saveRolePermissions} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                            <Save size={16} /> 儲存權限
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-gray-500 mb-4">勾選下方功能以授權給 <span className="font-bold text-gray-700">{selectedRole.role_name}</span></p>

                                <div className="grid grid-cols-2 gap-4">
                                    {(Object.entries(PERMISSIONS) as [string, string][]).map(([key, value]) => {
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
                        <span>系統保留最近 3 個月的登入紀錄。</span>
                        <button onClick={fetchData} className="ml-auto flex items-center gap-1 text-indigo-600 hover:underline">
                            <RotateCcw size={12} /> 重新整理
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 border-b">
                                <tr>
                                    <th className="px-6 py-3">登入時間</th>
                                    <th className="px-6 py-3">使用者</th>
                                    <th className="px-6 py-3">IP Address</th>
                                    <th className="px-6 py-3">瀏覽器 / 裝置</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {logs.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">尚無登入紀錄</td></tr>
                                ) : (
                                    logs.map(log => {
                                        const details: any = log.details || {};
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString('zh-TW')}
                                                </td>
                                                <td className="px-6 py-3 font-medium text-gray-900">{log.user_email}</td>
                                                <td className="px-6 py-3 font-mono text-gray-600 text-xs">
                                                    {details.ip || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-3 text-gray-600 flex items-center gap-2">
                                                    <Laptop size={14} className="text-gray-400"/>
                                                    <span className="truncate max-w-[200px]" title={details.userAgent}>
                                                        {details.browser || 'Unknown'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
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