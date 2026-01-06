import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, List, Search, Bell, Menu, MessageSquare, Briefcase, Upload, Download, History, Loader2, CloudOff, Cloud, Database, AlertTriangle, LogOut, User, LogIn, ShieldAlert, Shield } from 'lucide-react';
import { MOCK_PATENTS, DEFAULT_ADMIN_EMAIL, APP_VERSION } from './constants';
import PatentTable from './components/PatentTable';
import PatentStats from './components/PatentStats';
import AIChat from './components/AIChat';
import ImportModal from './components/ImportModal';
import EditModal from './components/EditModal';
import EmailPreviewModal from './components/EmailPreviewModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import LogModal from './components/LogModal';
import LoginPage from './components/LoginPage'; 
import AccessControlModal from './components/AccessControlModal'; // Import New Modal
import { Patent, PatentStatus, EmailLog, AccessRule } from './types';
import * as XLSX from 'xlsx';
import { supabase } from './services/supabaseService';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isMockSession, setIsMockSession] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'ADMIN' | 'USER'>('USER');

  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [showOnlyUrgent, setShowOnlyUrgent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatentStatus | 'ALL'>('ALL');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMsg, setChatInitialMsg] = useState<string | undefined>(undefined);
  
  // Data States
  const [patents, setPatents] = useState<Patent[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [logError, setLogError] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Modal States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false); // New Access Modal
  
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [patentToDelete, setPatentToDelete] = useState<Patent | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  const hasCheckedSeed = useRef(false);

  // ------------------------------------------------------------------
  // 0. Auth Check & Default Login Logic
  // ------------------------------------------------------------------
  
  // 檢查使用者角色 (Check User Role from DB)
  const checkUserRole = async (email: string) => {
    const lowerEmail = email.toLowerCase().trim();
    const domain = lowerEmail.split('@')[1];
    
    // Default to USER
    let role: 'ADMIN' | 'USER' = 'USER';

    try {
        // 1. Check exact email rule (Higher priority)
        const { data: emailRule } = await supabase
            .from('access_control')
            .select('role')
            .eq('type', 'EMAIL')
            .eq('value', lowerEmail)
            .single();
        
        if (emailRule) {
            role = emailRule.role as 'ADMIN' | 'USER';
        } else {
            // 2. Check domain rule
            const { data: domainRule } = await supabase
                .from('access_control')
                .select('role')
                .eq('type', 'DOMAIN')
                .eq('value', domain)
                .maybeSingle(); // Use maybeSingle to avoid error if multiple domains (shouldn't happen ideally) or none
            
            if (domainRule) {
                role = domainRule.role as 'ADMIN' | 'USER';
            }
        }
    } catch (e) {
        console.error("Role check error:", e);
    }
    
    setCurrentUserRole(role);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setIsMockSession(false);
        if(session.user.email) checkUserRole(session.user.email);
      } else {
        // 預設無痛登入 (Default Bypass Login)
        console.log("No Supabase session found. Using Default Admin Mode.");
        setSession({
            user: { email: DEFAULT_ADMIN_EMAIL }
        } as Session);
        setIsMockSession(true);
        // Mock session is ADMIN by default for dev convenience, or query DB too
        checkUserRole(DEFAULT_ADMIN_EMAIL); 
      }
      setIsAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        setIsMockSession(false);
        if(session.user.email) checkUserRole(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); 
    setIsMockSession(false);
  };

  // ------------------------------------------------------------------
  // 1. Fetch Data 
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!session) return; 

    const initData = async () => {
      setIsLoading(true);
      
      let currentPatents: Patent[] = [];
      try {
          const { data: patentData, error: patentError } = await supabase
              .from('patents')
              .select('*')
              .order('created_at', { ascending: false });
          
          if (patentError) throw patentError;
          currentPatents = patentData || [];

          if (currentPatents.length === 0 && !hasCheckedSeed.current) {
             hasCheckedSeed.current = true;
             console.log("Database is empty. Auto-seeding mock data...");
             setIsSeeding(true);
             const seedSuccess = await performSeed();
             
             if (seedSuccess) {
                 const { data: newData } = await supabase
                    .from('patents')
                    .select('*')
                    .order('created_at', { ascending: false });
                 currentPatents = newData || [];
             }
             setIsSeeding(false);
          }

          setPatents(currentPatents);
          setIsError(false);

      } catch (error) {
          console.error('Error fetching patents:', error);
          setIsError(true);
          setIsLoading(false);
          return;
      }

      try {
          const { data: logData, error: logError } = await supabase
              .from('emailLogs')
              .select('*')
              .order('created_at', { ascending: false });

          if (logError) {
              setLogError(true);
          } else {
              setEmailLogs(logData || []);
              setLogError(false);
          }
      } catch (error) {
          setLogError(true);
      } finally {
          setIsLoading(false);
      }
    };

    initData();
  }, [session]); 

  const performSeed = async () => {
    try {
        const dataToInsert = MOCK_PATENTS.map(p => ({
            ...p,
            annuityYear: Number(p.annuityYear)
        }));
        
        const { error } = await supabase
            .from('patents')
            .upsert(dataToInsert, { onConflict: 'id' });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Auto-seed error:', e);
        return false;
    }
  };

  const handleManualSeed = async () => {
    // 改用更安全的確認方式 (簡單的 confirm，未來可改為 Modal)
    if (!confirm("⚠️ 危險操作：確定要重置資料庫嗎？\n\n系統將會先自動備份當前資料，然後覆蓋為範例資料。")) return;

    setIsLoading(true);

    try {
        // 2. 自動備份 (Auto Backup)
        console.log("Starting Backup...");
        const { data: currentData, error: fetchError } = await supabase.from('patents').select('*');
        if (fetchError) throw fetchError;

        if (currentData && currentData.length > 0) {
            const backupId = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
            const backupPayload = currentData.map(item => ({
                backupId: backupId,
                originalId: item.id,
                patentData: item 
            }));

            const { error: backupError } = await supabase.from('patent_backups').insert(backupPayload);
            if (backupError) {
                // 如果備份表不存在，Supabase 會報錯，這裡 catch 住並警告
                throw new Error("備份失敗！(可能原因：patent_backups 資料表尚未建立)");
            }
        }

        // 3. 執行重置 (Seed)
        const success = await performSeed();
        if (!success) throw new Error("寫入範例資料時發生錯誤。");

        // 4. Reload UI
        const { data: newData } = await supabase.from('patents').select('*').order('created_at', { ascending: false });
        setPatents(newData || []);
        
        alert("✅ 重置成功！舊資料已安全備份。");

    } catch (error: any) {
        console.error(error);
        alert(`❌ 操作失敗：${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!patents) return;
    const today = new Date();
    const count = patents.reduce((acc, patent) => {
        if (!patent.annuityDate) return acc;
        const due = new Date(patent.annuityDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 90 && patent.status === PatentStatus.Active) {
            return acc + 1;
        }
        return acc;
    }, 0);
    setAlertCount(count);
  }, [patents]);

  const filteredPatents = (patents || []).filter(patent => {
    const matchesSearch = 
        patent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        patent.appNumber.includes(searchTerm) || 
        patent.country.includes(searchTerm) ||
        patent.patentee.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || patent.status === statusFilter;
    
    let matchesUrgent = true;
    if (showOnlyUrgent) {
        const today = new Date();
        const due = new Date(patent.annuityDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        matchesUrgent = diffDays > 0 && diffDays <= 90 && patent.status === PatentStatus.Active;
    }

    return matchesSearch && matchesStatus && matchesUrgent;
  });

  const handleEditClick = (patent: Patent) => {
    setSelectedPatent(patent);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (patent: Patent) => {
    setPatentToDelete(patent);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (patentToDelete) {
        try {
            const { error } = await supabase
                .from('patents')
                .delete()
                .eq('id', patentToDelete.id);
            if (error) throw error;
            setPatents(prev => prev.filter(p => p.id !== patentToDelete.id));
            setPatentToDelete(null);
            setIsDeleteModalOpen(false);
        } catch (error) {
            alert('刪除失敗，請檢查網路連線。');
        }
    }
  };

  const handlePreviewEmail = (patent: Patent) => {
    setSelectedPatent(patent);
    setIsEmailModalOpen(true);
  };

  const handleSendEmail = async (patent: Patent, subject: string, body: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const newLog: EmailLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleString('zh-TW'),
        patentName: patent.name,
        recipient: patent.notificationEmails || 'Unknown',
        subject: subject,
        status: 'Success'
    };
    try {
        const { error } = await supabase.from('emailLogs').insert([newLog]);
        if (error) throw error;
        setEmailLogs(prev => [newLog, ...prev]);
        return true; 
    } catch (error) {
        console.error('Error saving log:', error);
        return true; 
    }
  };

  const handleImportPatent = async (newData: Patent | Patent[]) => {
    const incomingPatents = Array.isArray(newData) ? newData : [newData];
    const sanitizedData = incomingPatents.map(p => ({
        ...p,
        annuityYear: Number(p.annuityYear) || 1
    }));
    try {
        const { error } = await supabase.from('patents').insert(sanitizedData);
        if (error) throw error;
        const { data } = await supabase.from('patents').select('*').order('created_at', { ascending: false });
        setPatents(data || []);
        setViewMode('list');
        setShowOnlyUrgent(false);
    } catch (error) {
        alert('匯入失敗，請檢查資料格式。');
    }
  };

  const handleUpdatePatent = async (updatedPatent: Patent) => {
    try {
        const { error } = await supabase
            .from('patents')
            .update({
                name: updatedPatent.name,
                patentee: updatedPatent.patentee,
                country: updatedPatent.country,
                status: updatedPatent.status,
                type: updatedPatent.type,
                appNumber: updatedPatent.appNumber,
                pubNumber: updatedPatent.pubNumber,
                appDate: updatedPatent.appDate,
                pubDate: updatedPatent.pubDate,
                duration: updatedPatent.duration,
                annuityDate: updatedPatent.annuityDate,
                annuityYear: Number(updatedPatent.annuityYear),
                notificationEmails: updatedPatent.notificationEmails,
                inventor: updatedPatent.inventor,
                link: updatedPatent.link
            })
            .eq('id', updatedPatent.id);
        if (error) throw error;
        setPatents(prev => prev.map(p => p.id === updatedPatent.id ? updatedPatent : p));
    } catch (error) {
        alert('更新失敗。');
    }
  };

  const handleExport = () => {
    const exportData = filteredPatents.map(p => ({
      "專利名稱": p.name,
      "專利權人": p.patentee,
      "申請國家": p.country,
      "狀態": p.status,
      "類型": p.type,
      "申請號": p.appNumber,
      "公告號": p.pubNumber,
      "年費到期日": p.annuityDate,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "專利清單");
    XLSX.writeFile(workbook, `Patent_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const switchView = (mode: 'dashboard' | 'list', urgentOnly: boolean = false) => {
    setViewMode(mode);
    setShowOnlyUrgent(urgentOnly);
    if (urgentOnly) setStatusFilter('ALL');
  };

  // ------------------------------------------------------------------
  // RENDER Logic
  // ------------------------------------------------------------------

  if (isAuthChecking) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
             <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
    );
  }

  if (!session) {
      return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <Briefcase size={20} />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">PatentVault</span>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => switchView('dashboard')}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all ${viewMode === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800'}`}
          >
            <LayoutGrid size={18} className="mr-3" />
            總覽儀表板
          </button>
          <button 
            onClick={() => switchView('list')}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all ${viewMode === 'list' && !showOnlyUrgent ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-slate-800'}`}
          >
            <List size={18} className="mr-3" />
            專利清單
          </button>
          <div className="my-4 border-t border-slate-800 mx-2"></div>
          <button 
            onClick={() => switchView('list', true)}
            className={`flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all group ${showOnlyUrgent ? 'bg-orange-600/20 text-orange-400 border border-orange-500/20' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            <Bell size={18} className={`mr-3 ${showOnlyUrgent ? 'text-orange-400' : 'group-hover:text-blue-400'}`} />
            期限提醒
            {alertCount > 0 && (
                <span className={`ml-auto text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ${showOnlyUrgent ? 'bg-orange-500' : 'bg-red-500'}`}>{alertCount}</span>
            )}
          </button>
          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-slate-800 text-slate-400"
          >
            <History size={18} className="mr-3 group-hover:text-blue-400" />
            發送紀錄
          </button>
          
          {/* Admin Tools */}
          {currentUserRole === 'ADMIN' && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <button 
                    onClick={() => setIsAccessModalOpen(true)}
                    className="flex items-center w-full px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-indigo-900/20 text-indigo-400 border border-transparent hover:border-indigo-900/50 group"
                >
                    <Shield size={18} className="mr-3 group-hover:text-indigo-300" />
                    權限管理
                </button>
            </div>
          )}
        </nav>

        {/* System Status Widget */}
        <div className="px-4 mb-3">
            <div className={`bg-slate-800/40 rounded-xl p-4 border ${isError ? 'border-red-500/30' : 'border-slate-700/50'}`}>
                <div className="flex items-center gap-2 mb-3 text-slate-400">
                    {isError ? <CloudOff size={14} className="text-red-400"/> : <Cloud size={14} className={isLoading ? "animate-pulse" : "text-green-400"} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isError ? '連線異常' : isSeeding ? '初始化資料庫中...' : isLoading ? '同步中...' : '雲端已同步'}
                    </span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">專利總數</span>
                        <span className="text-white font-mono">{patents?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">存續率</span>
                        <span className="text-green-400 font-mono">
                            {patents?.length > 0 ? Math.round((patents.filter(p => p.status === PatentStatus.Active).length / patents.length) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isMockSession ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-slate-700'}`}>
                    {session.user.email?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{session.user.email}</p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        {currentUserRole === 'ADMIN' ? '系統管理員' : '一般使用者'}
                    </p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700 hover:border-slate-600"
            >
                {isMockSession ? (
                    <>
                        <LogIn size={14} />
                        切換其他帳號
                    </>
                ) : (
                    <>
                        <LogOut size={14} />
                        登出系統
                    </>
                )}
            </button>
            <div className="mt-4 text-center">
                 <span className="text-[10px] text-slate-600 font-mono bg-slate-800/50 px-2 py-0.5 rounded border border-slate-800">
                    {APP_VERSION}
                 </span>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-8 shadow-sm z-10 shrink-0">
            <div className="flex items-center lg:hidden gap-3">
                 <button className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <Menu size={20} />
                 </button>
                 <span className="font-bold text-gray-800">PatentVault</span>
            </div>

            <div className="flex-1 max-w-xl mx-auto hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="搜尋專利名稱、號碼、國家或權人..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl text-sm transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
                 <button 
                    onClick={handleExport}
                    className="hidden md:flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all active:scale-95"
                 >
                    <Download size={16} />
                    匯出清單
                 </button>
                 <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 active:scale-95"
                 >
                    <Upload size={16} />
                    新增專利
                 </button>
                 
                 <button onClick={handleLogout} className="md:hidden p-2 text-gray-500">
                    <LogOut size={20} />
                 </button>

                 <div className="h-6 w-px bg-gray-200 hidden md:block mx-1"></div>
                 <div className="flex items-center gap-3 pl-2">
                    <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md uppercase">
                        {session.user.email?.substring(0, 2)}
                    </span>
                 </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            {viewMode === 'dashboard' ? '智慧管理儀表板' : showOnlyUrgent ? (
                                <>
                                    <span className="text-orange-600">期限提醒中心</span>
                                    <span className="text-sm px-2 py-1 bg-orange-100 text-orange-700 rounded-lg border border-orange-200 font-medium">90天內到期</span>
                                </>
                            ) : '專利組合清單'}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {viewMode === 'dashboard' ? '即時監控專利分佈、法律狀態與屆期風險' : 
                             showOnlyUrgent ? '以下專利即將到期，請盡快通知專利權人或進行年費繳納' : 
                             '管理、編輯並追蹤您的所有智慧財產權案件'}
                        </p>
                    </div>
                    {viewMode === 'list' && !showOnlyUrgent && (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                            <button 
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === 'ALL' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                全部
                            </button>
                            <button 
                                onClick={() => setStatusFilter(PatentStatus.Active)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === PatentStatus.Active ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                存續中
                            </button>
                            <button 
                                onClick={() => setStatusFilter(PatentStatus.Expired)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === PatentStatus.Expired ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                已屆期
                            </button>
                        </div>
                    )}
                </div>

                {isLoading && patents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                        <p>{isSeeding ? '偵測到資料庫為空，正在自動寫入範例資料...' : '正在從雲端載入資料...'}</p>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <CloudOff size={40} className="mb-4 text-red-400" />
                        <p>
                            無法連線至資料庫 (Permission Denied) <br/>
                            <span className="text-xs text-gray-500 mt-2 block">
                                請確認您已在 Supabase 執行了「開放權限」的 SQL 指令，<br/>
                                否則預設管理員 (未登入狀態) 將無法讀取資料。
                            </span>
                        </p>
                        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100">重新連線</button>
                    </div>
                ) : viewMode === 'dashboard' ? (
                    <PatentStats patents={patents} />
                ) : (
                    <PatentTable 
                        patents={filteredPatents} 
                        onEdit={handleEditClick}
                        onPreviewEmail={handlePreviewEmail}
                        onDelete={handleDeleteClick}
                    />
                )}
            </div>
        </div>
      </main>

      {/* Modals & AI Chat */}
      <AIChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        contextPatents={patents}
        initialMessage={chatInitialMsg}
      />
      
      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportPatent}
      />

      <EditModal 
        isOpen={isEditModalOpen}
        onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPatent(null);
        }}
        onSave={handleUpdatePatent}
        patent={selectedPatent}
      />

      <EmailPreviewModal 
        isOpen={isEmailModalOpen}
        onClose={() => {
            setIsEmailModalOpen(false);
            setSelectedPatent(null);
        }}
        patent={selectedPatent}
        onSendEmail={handleSendEmail}
      />

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
            setIsDeleteModalOpen(false);
            setPatentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        patentName={patentToDelete?.name || ''}
      />

      <LogModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={emailLogs}
      />
      
      <AccessControlModal 
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />
    </div>
  );
};

export default App;