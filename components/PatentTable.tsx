import React from 'react';
import { Patent, PatentStatus, PatentType } from '../types';
import { AlertCircle, CheckCircle, Clock, FileText, Mail, ExternalLink, Edit, Trash2 } from 'lucide-react';

interface PatentTableProps {
  patents: Patent[];
  onEdit: (patent: Patent) => void;
  onPreviewEmail: (patent: Patent) => void;
  onDelete: (patent: Patent) => void;
}

const PatentTable: React.FC<PatentTableProps> = ({ patents, onEdit, onPreviewEmail, onDelete }) => {
  
  const getStatusColor = (status: PatentStatus) => {
    switch (status) {
      case PatentStatus.Active:
        return 'bg-green-100 text-green-800 border-green-200';
      case PatentStatus.Expired:
        return 'bg-red-100 text-red-800 border-red-200';
      case PatentStatus.Pending:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: PatentType) => {
    switch (type) {
      case PatentType.Invention:
        return <div className="p-1 bg-blue-50 rounded text-blue-600 mr-2"><FileText size={14} /></div>;
      case PatentType.Utility:
        return <div className="p-1 bg-purple-50 rounded text-purple-600 mr-2"><Clock size={14} /></div>;
      case PatentType.Design:
        return <div className="p-1 bg-pink-50 rounded text-pink-600 mr-2"><AlertCircle size={14} /></div>;
    }
  };

  // Helper to check if date is within 3 months (approx 90 days)
  const getDateStatus = (dateString: string) => {
    const today = new Date();
    const due = new Date(dateString);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isNaN(diffDays)) return { isUrgent: false, label: '' };

    if (diffDays > 0 && diffDays <= 90) {
        return { isUrgent: true, label: `剩餘 ${diffDays} 天` };
    } else if (diffDays <= 0) {
        return { isUrgent: false, label: '已過期', isExpired: true };
    }
    return { isUrgent: false, label: '' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto custom-scrollbar flex-grow">
        <table className="w-full text-sm text-left text-gray-500 min-w-[1300px]">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">狀態</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">申請國家</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">專利名稱 / 類型</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">專利權人</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">發明人</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">申請號 / 公開號</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">日期資訊 (申請/公告)</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">專利期間</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">年費到期日 / 年次</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">通知信箱</th>
              <th scope="col" className="px-6 py-3 font-semibold whitespace-nowrap text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patents.map((patent) => {
               const { isUrgent, label, isExpired } = getDateStatus(patent.annuityDate);
               
               return (
              <tr key={patent.id} className={`transition-colors ${isUrgent ? 'bg-orange-50/40 hover:bg-orange-50' : 'hover:bg-blue-50/50'}`}>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(patent.status)}`}>
                      {patent.status === PatentStatus.Active ? <CheckCircle size={12} className="mr-1"/> : <AlertCircle size={12} className="mr-1"/>}
                      {patent.status}
                   </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {patent.country}
                </td>
                <td className="px-6 py-4 min-w-[200px]">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 mb-1">{patent.name}</span>
                    <div className="flex items-center text-xs text-gray-500 flex-wrap gap-y-2">
                       <div className="flex items-center mr-3">
                           {getTypeIcon(patent.type)}
                           {patent.type}
                       </div>
                       {patent.link && (
                           <a 
                               href={patent.link} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 transition-colors"
                           >
                               <ExternalLink size={10} />
                               電子證書
                           </a>
                       )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium whitespace-nowrap">
                   {patent.patentee}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 min-w-[120px]">
                    <div>
                        {patent.inventor}
                    </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-600 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                        <div><span className="text-gray-400 w-8 inline-block">申:</span>{patent.appNumber}</div>
                        <div><span className="text-gray-400 w-8 inline-block">公:</span>{patent.pubNumber}</div>
                    </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap">
                     <div className="flex flex-col gap-1">
                        <div><span className="text-gray-400 w-8 inline-block">申:</span>{patent.appDate}</div>
                        <div><span className="text-gray-400 w-8 inline-block">公:</span>{patent.pubDate}</div>
                    </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 min-w-[150px]">
                  {patent.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-2">
                         <span className={`text-sm font-medium ${isUrgent ? 'text-orange-600 font-bold' : isExpired ? 'text-red-500' : 'text-green-600'}`}>
                            {patent.annuityDate}
                         </span>
                         {isUrgent && (
                             <button 
                                onClick={() => onPreviewEmail(patent)}
                                className="group relative focus:outline-none"
                             >
                                <Mail size={16} className="text-orange-500 hover:text-orange-700 hover:scale-110 transition-all" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-gray-800 text-white text-[10px] p-1.5 rounded text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                                    期限將至，點擊預覽通知信
                                </span>
                             </button>
                         )}
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">第 {patent.annuityYear} 年</span>
                        {isUrgent && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded">{label}</span>}
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-[150px]">
                    <div className="truncate text-xs text-gray-500" title={patent.notificationEmails}>
                        {patent.notificationEmails || '-'}
                    </div>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-2">
                    <button
                        onClick={() => onEdit(patent)}
                        className="text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100 cursor-pointer"
                        title="修改資料"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDelete(patent);
                        }}
                        className="text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                        title="刪除資料"
                    >
                        <Trash2 size={16} className="pointer-events-none" />
                    </button>
                  </div>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
        {patents.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            沒有符合條件的專利資料
          </div>
        )}
      </div>
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
        <span>顯示 {patents.length} 筆資料</span>
        <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>上一頁</button>
            <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50">1</button>
            <button className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>下一頁</button>
        </div>
      </div>
    </div>
  );
};

export default PatentTable;