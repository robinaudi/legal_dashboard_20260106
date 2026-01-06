import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patentName: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, patentName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">確認刪除？</h3>
            
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                您確定要刪除專利<br/>
                <span className="font-bold text-gray-800 my-1 block">{patentName}</span>
                此動作無法復原，資料將永久移除。
            </p>

            <div className="flex gap-3 w-full">
                <button 
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                    取消
                </button>
                <button 
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm shadow-red-200"
                >
                    <Trash2 size={18} />
                    確認刪除
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;