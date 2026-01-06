import React, { useState } from 'react';
import { X, Mail, Send, Copy, Loader2, CheckCircle } from 'lucide-react';
import { Patent } from '../types';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patent: Patent | null;
  onSendEmail: (patent: Patent, subject: string, body: string) => Promise<boolean>;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ isOpen, onClose, patent, onSendEmail }) => {
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !patent) return null;

  // Subject template: 【專利繳費提醒】XXX專利
  const subject = `【專利繳費提醒】${patent.name}專利`;
  
  // Body template provided by user
  const body = `
敬愛的 ${patent.patentee} 您好：

以下專利即將到期，請於 ${patent.annuityDate} (即年費到期日) 前繳納年費，避免專利失效。

----------------------------------------
專利名稱：${patent.name}
申請國家：${patent.country}
專利權人：${patent.patentee}
申請號/公開號：${patent.appNumber} / ${patent.pubNumber}
專利期間：${patent.duration}
年費到期日/年次：${patent.annuityDate}，第 ${patent.annuityYear} 年
----------------------------------------

若有任何疑問，請與我們聯繫。

PatentVault 管理系統 自動發送
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    alert('信件內容已複製到剪貼簿');
  };

  const handleAutoSend = async () => {
    if (!patent.notificationEmails) return;
    
    setIsSending(true);
    try {
        await onSendEmail(patent, subject, body);
        setIsSending(false);
        setIsSuccess(true);
        // Auto close after success
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
        }, 1500);
    } catch (error) {
        setIsSending(false);
        alert('發送失敗');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {isSuccess ? <CheckCircle size={20} /> : <Mail size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{isSuccess ? '發送成功' : '自動發送通知信'}</h3>
              <p className="text-xs text-gray-500">{isSuccess ? '系統已紀錄本次發送作業' : '系統將透過您的 Gmail 帳號發送'}</p>
            </div>
          </div>
          {!isSending && !isSuccess && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white space-y-4">
            
            {/* Metadata Fields */}
            <div className="space-y-3 text-sm bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex gap-3">
                    <span className="w-16 text-gray-500 font-medium text-right shrink-0">收件者：</span>
                    <span className={`${patent.notificationEmails ? 'text-blue-600' : 'text-gray-400 italic'} font-medium`}>
                        {patent.notificationEmails || '尚未設定 (請至編輯頁面新增)'}
                    </span>
                </div>
                <div className="flex gap-3 items-start">
                    <span className="w-16 text-gray-500 font-medium text-right shrink-0 pt-0.5">主旨：</span>
                    <span className="font-bold text-gray-900">{subject}</span>
                </div>
            </div>

            {/* Email Content Box */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative">
                <div className="absolute top-2 right-2">
                    <button 
                        onClick={handleCopy}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="複製內容"
                    >
                        <Copy size={16} />
                    </button>
                </div>
                <pre className="font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {body}
                </pre>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between gap-3 items-center">
          <span className="text-xs text-gray-400">
            * 系統將自動紀錄發送歷程 (Log)
          </span>
          <div className="flex gap-3">
            <button 
                onClick={onClose}
                disabled={isSending || isSuccess}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
                取消
            </button>
            <button 
                onClick={handleAutoSend}
                disabled={!patent.notificationEmails || isSending || isSuccess}
                title={!patent.notificationEmails ? "請先設定收件信箱" : ""}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm
                    ${isSuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
                    disabled:bg-gray-300 disabled:cursor-not-allowed
                `}
            >
                {isSending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        發送中...
                    </>
                ) : isSuccess ? (
                    <>
                        <CheckCircle size={16} />
                        已寄出
                    </>
                ) : (
                    <>
                        <Send size={16} />
                        確認發送
                    </>
                )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewModal;