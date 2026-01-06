import React from 'react';
import { X, History, CheckCircle, XCircle } from 'lucide-react';
import { EmailLog } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: EmailLog[];
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, logs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
              <History size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">郵件發送紀錄 (System Logs)</h3>
              <p className="text-xs text-gray-500">追蹤所有由系統自動發出的通知信件</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-white">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100 sticky top-0">
                <tr>
                    <th className="px-6 py-3">發送時間</th>
                    <th className="px-6 py-3">狀態</th>
                    <th className="px-6 py-3">收件人</th>
                    <th className="px-6 py-3">關聯專利</th>
                    <th className="px-6 py-3">主旨</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-500 text-xs whitespace-nowrap">
                                {log.timestamp}
                            </td>
                            <td className="px-6 py-4">
                                {log.status === 'Success' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <CheckCircle size={12} /> Success
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                        <XCircle size={12} /> Failed
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 max-w-[200px] truncate" title={log.recipient}>
                                {log.recipient}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                                {log.patentName}
                            </td>
                             <td className="px-6 py-4 text-gray-500 text-xs max-w-[250px] truncate" title={log.subject}>
                                {log.subject}
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                            <div className="flex flex-col items-center gap-2">
                                <History size={32} className="opacity-20" />
                                <span>尚無發送紀錄</span>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogModal;