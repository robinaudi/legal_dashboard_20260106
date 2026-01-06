import React, { useState, useEffect } from 'react';
import { X, Save, Users, Link as LinkIcon, Edit3, Building, Mail } from 'lucide-react';
import { Patent, PatentStatus, PatentType } from '../types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patent: Patent) => void;
  patent: Patent | null;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, patent }) => {
  const [formData, setFormData] = useState<Patent | null>(null);

  useEffect(() => {
    if (patent) {
      setFormData({ ...patent });
    }
  }, [patent]);

  const handleSave = () => {
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Edit3 size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">編輯專利資料</h3>
              <p className="text-xs text-gray-500">ID: {formData.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">專利名稱</label>
                <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>

             <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Building size={12} />
                    專利權人
                </label>
                <input 
                    type="text" 
                    value={formData.patentee || ''} 
                    onChange={e => setFormData({...formData, patentee: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Users size={12} />
                    發明人/創作人
                </label>
                <input 
                    type="text" 
                    value={formData.inventor} 
                    onChange={e => setFormData({...formData, inventor: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <LinkIcon size={12} />
                    電子證書連結 (Link)
                </label>
                <input 
                    type="text" 
                    value={formData.link || ''} 
                    onChange={e => setFormData({...formData, link: e.target.value})}
                    placeholder="請輸入連結..."
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 underline focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>
            
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">申請國家</label>
                <input 
                    type="text" 
                    value={formData.country} 
                    onChange={e => setFormData({...formData, country: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">狀態</label>
                <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as PatentStatus})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                >
                    <option value={PatentStatus.Active}>存續中</option>
                    <option value={PatentStatus.Expired}>已屆期</option>
                    <option value={PatentStatus.Pending}>審查中</option>
                </select>
                </div>
                <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">類型</label>
                <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as PatentType})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                >
                    <option value={PatentType.Invention}>發明</option>
                    <option value={PatentType.Utility}>新型</option>
                    <option value={PatentType.Design}>設計</option>
                </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">申請號</label>
                <input 
                    type="text" 
                    value={formData.appNumber} 
                    onChange={e => setFormData({...formData, appNumber: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">公開/公告號</label>
                <input 
                    type="text" 
                    value={formData.pubNumber} 
                    onChange={e => setFormData({...formData, pubNumber: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">申請日</label>
                <input 
                    type="date" 
                    value={formData.appDate} 
                    onChange={e => setFormData({...formData, appDate: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>
                <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">公開/公告日</label>
                <input 
                    type="date" 
                    value={formData.pubDate} 
                    onChange={e => setFormData({...formData, pubDate: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">專利期間</label>
                <input 
                    type="text" 
                    value={formData.duration} 
                    onChange={e => setFormData({...formData, duration: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>
            
                <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">年費到期日</label>
                <input 
                    type="date" 
                    value={formData.annuityDate} 
                    onChange={e => setFormData({...formData, annuityDate: e.target.value})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>
                <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">年費有效年次</label>
                <input 
                    type="number" 
                    value={formData.annuityYear} 
                    onChange={e => setFormData({...formData, annuityYear: parseInt(e.target.value)})}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>

            <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Mail size={12} />
                    自動通知信箱 (提前3個月通知)
                </label>
                <input 
                    type="text" 
                    value={formData.notificationEmails || ''} 
                    onChange={e => setFormData({...formData, notificationEmails: e.target.value})}
                    placeholder="請輸入 Email，多筆請用逗號分隔"
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 outline-none transition-colors"
                />
            </div>
            </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save size={16} />
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;