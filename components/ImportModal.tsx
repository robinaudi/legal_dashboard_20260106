import React, { useState, useRef } from 'react';
import { X, Sparkles, Upload, FileText, Check, Loader2, Link as LinkIcon, File, Users, Building, Mail, FileSpreadsheet } from 'lucide-react';
import { Patent, PatentStatus, PatentType } from '../types';
import { parsePatentFromText, parsePatentFromFile } from '../services/geminiService';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (patent: Patent | Patent[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Single patent parse result
  const [parsedData, setParsedData] = useState<Partial<Patent>>({});
  // Batch patent parse result (for Excel)
  const [parsedBatch, setParsedBatch] = useState<Patent[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setRawText(''); // Clear text if file is selected
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data url prefix (e.g. "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper to map Excel row keys to Patent interface
  const mapExcelRowToPatent = (row: any, index: number): Patent => {
    const getString = (key: string | string[]) => {
      const keys = Array.isArray(key) ? key : [key];
      for (const k of keys) {
        if (row[k] !== undefined) return String(row[k]).trim();
      }
      return '';
    };

    const name = getString(['專利名稱', '名稱', 'Name', 'Title']);
    const patentee = getString(['專利權人', '申請人', 'Patentee', 'Applicant']);
    const country = getString(['申請國家', '國家', 'Country']);
    
    // Status Logic
    const rawStatus = getString(['狀態', 'Status']);
    let status = PatentStatus.Pending;
    if (rawStatus.includes('存續') || rawStatus.includes('Active')) status = PatentStatus.Active;
    else if (rawStatus.includes('屆期') || rawStatus.includes('Expired')) status = PatentStatus.Expired;
    
    // Type Logic
    const rawType = getString(['類型', 'Type']);
    let type = PatentType.Invention;
    if (rawType.includes('新型') || rawType.includes('Utility')) type = PatentType.Utility;
    else if (rawType.includes('設計') || rawType.includes('Design')) type = PatentType.Design;

    // Date Logic (Handle potential Excel serial dates)
    const formatDate = (val: string) => {
        // Simple check if it matches Excel date serial number (e.g. 45000)
        if (!isNaN(Number(val)) && Number(val) > 20000) {
           const date = new Date(Math.round((Number(val) - 25569)*86400*1000));
           return date.toISOString().split('T')[0];
        }
        return val; // Assume YYYY-MM-DD or similar
    };

    return {
      id: `excel-${Date.now()}-${index}`,
      name: name || '未命名專利',
      patentee: patentee,
      country: country || 'TW',
      status: status,
      type: type,
      appNumber: getString(['申請號', 'Application Number']),
      pubNumber: getString(['公開號', '公告號', 'Publication Number']),
      appDate: formatDate(getString(['申請日', 'Application Date'])),
      pubDate: formatDate(getString(['公開日', '公告日', 'Publication Date'])),
      duration: getString(['專利期間', 'Duration']),
      annuityDate: formatDate(getString(['年費到期日', 'Annuity Date'])),
      annuityYear: parseInt(getString(['年費年次', '年次', 'Annuity Year'])) || 1,
      notificationEmails: getString(['通知信箱', 'Email']),
      inventor: getString(['發明人', '創作人', 'Inventor']),
      link: getString(['連結', 'Link'])
    };
  };

  const handleAnalyze = async () => {
    if (!rawText.trim() && !selectedFile) return;
    
    setIsAnalyzing(true);
    setParsedBatch([]); // Clear previous batch
    setParsedData({});  // Clear previous single data

    try {
      // 1. Handle Excel
      if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
        const data = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const mappedData = jsonData.map((row, idx) => mapExcelRowToPatent(row, idx));
        if (mappedData.length > 0) {
            setParsedBatch(mappedData);
            setStep('preview');
        } else {
            alert('Excel 檔案中沒有資料或格式無法辨識');
        }
        return; 
      }

      // 2. Handle PDF / Text (AI)
      let result: Partial<Patent> | null = null;

      if (selectedFile) {
        // Assuming PDF logic for non-excel files
        const base64 = await convertFileToBase64(selectedFile);
        result = await parsePatentFromFile(base64, selectedFile.type);
      } else {
        result = await parsePatentFromText(rawText);
      }

      if (result) {
        setParsedData(result);
        setStep('preview');
      }
    } catch (error) {
      console.error("Analysis failed", error);
      alert('解析失敗，請確認檔案格式或內容。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    // If batch mode
    if (parsedBatch.length > 0) {
        onImport(parsedBatch);
        handleClose();
        return;
    }

    // Single mode validation / defaults
    const newPatent: Patent = {
      id: Date.now().toString(), // Simple ID generation
      name: parsedData.name || '未命名專利',
      patentee: parsedData.patentee || '',
      country: parsedData.country || 'TW (台灣)',
      status: (parsedData.status as PatentStatus) || PatentStatus.Pending,
      type: (parsedData.type as PatentType) || PatentType.Invention,
      appNumber: parsedData.appNumber || '',
      pubNumber: parsedData.pubNumber || '',
      appDate: parsedData.appDate || '',
      pubDate: parsedData.pubDate || '',
      duration: parsedData.duration || '',
      annuityDate: parsedData.annuityDate || '',
      annuityYear: parsedData.annuityYear || 1,
      notificationEmails: parsedData.notificationEmails || '',
      inventor: parsedData.inventor || '',
      abstract: parsedData.abstract || '',
      link: parsedData.link || '',
    };
    onImport(newPatent);
    handleClose();
  };

  const handleClose = () => {
    setStep('input');
    setRawText('');
    setSelectedFile(null);
    setParsedData({});
    setParsedBatch([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!isOpen) return null;

  const isExcel = selectedFile?.name.endsWith('.xlsx') || selectedFile?.name.endsWith('.xls');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Upload size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">匯入專利資料</h3>
              <p className="text-xs text-gray-500">支援文字貼上、PDF 公報或 Excel 清單匯入</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 'input' ? (
            <div className="space-y-6">
              
              {/* File Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,application/pdf,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={handleFileChange}
                />
                
                {selectedFile ? (
                    <div className="flex flex-col items-center text-blue-700">
                        {isExcel ? <FileSpreadsheet size={48} className="mb-2 text-green-600"/> : <File size={48} className="mb-2" />}
                        <span className="font-medium text-sm">{selectedFile.name}</span>
                        <span className="text-xs opacity-70">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        <button 
                            className="mt-4 text-xs bg-white border border-blue-200 px-3 py-1 rounded hover:bg-blue-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                if(fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        >
                            更換檔案
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600 mb-3">
                            <Upload size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">點擊上傳檔案</p>
                        <p className="text-xs text-gray-400 mt-1">支援 .pdf (AI解析) 或 .xlsx (批次匯入)</p>
                    </>
                )}
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-3 text-xs text-gray-400 font-medium absolute">或</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">直接貼上文字資訊 (AI解析)</label>
                <textarea
                  className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-sm leading-relaxed"
                  placeholder={`若無檔案，可貼上文字。範例：
專利名稱：新型顯示器結構...`}
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if(e.target.value) setSelectedFile(null);
                  }}
                  disabled={!!selectedFile}
                />
              </div>
            </div>
          ) : parsedBatch.length > 0 ? (
            // Batch Preview Mode (Excel)
            <div className="space-y-4">
                 <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex gap-2 items-center text-sm text-green-800">
                    <Check size={16} />
                    <span>Excel 解析完成！共 {parsedBatch.length} 筆資料。</span>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs text-left text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                            <tr>
                                <th className="px-3 py-2">專利名稱</th>
                                <th className="px-3 py-2">專利權人</th>
                                <th className="px-3 py-2">國家</th>
                                <th className="px-3 py-2">狀態</th>
                                <th className="px-3 py-2">申請日</th>
                                <th className="px-3 py-2">年費日</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {parsedBatch.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 truncate max-w-[150px]">{p.name}</td>
                                    <td className="px-3 py-2 truncate max-w-[100px]">{p.patentee}</td>
                                    <td className="px-3 py-2">{p.country}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.status === PatentStatus.Active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">{p.appDate}</td>
                                    <td className="px-3 py-2">{p.annuityDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          ) : (
            // Single Item Preview Mode (Original AI Form)
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex gap-2 items-center text-sm text-green-800">
                <Check size={16} />
                <span>AI 解析完成！請確認並補充連結資訊。</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1">專利名稱</label>
                   <input 
                      type="text" 
                      value={parsedData.name || ''} 
                      onChange={e => setParsedData({...parsedData, name: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800"
                   />
                </div>

                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <Building size={12} />
                      專利權人
                   </label>
                   <input 
                      type="text" 
                      value={parsedData.patentee || ''} 
                      onChange={e => setParsedData({...parsedData, patentee: e.target.value})}
                      placeholder="公司或個人名稱"
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>

                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <Users size={12} />
                      發明人/創作人
                   </label>
                   <input 
                      type="text" 
                      value={parsedData.inventor || ''} 
                      onChange={e => setParsedData({...parsedData, inventor: e.target.value})}
                      placeholder="例如: 王小明, 李大同"
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>

                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <LinkIcon size={12} />
                      電子證書連結 (Link)
                   </label>
                   <input 
                      type="text" 
                      value={parsedData.link || ''} 
                      onChange={e => setParsedData({...parsedData, link: e.target.value})}
                      placeholder="請輸入電子證書連結..."
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 underline"
                   />
                </div>
                
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">申請國家</label>
                   <input 
                      type="text" 
                      value={parsedData.country || ''} 
                      onChange={e => setParsedData({...parsedData, country: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">狀態</label>
                    <select 
                        value={parsedData.status || PatentStatus.Pending}
                        onChange={e => setParsedData({...parsedData, status: e.target.value as PatentStatus})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    >
                        <option value={PatentStatus.Active}>存續中</option>
                        <option value={PatentStatus.Expired}>已屆期</option>
                        <option value={PatentStatus.Pending}>審查中</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">類型</label>
                    <select 
                        value={parsedData.type || PatentType.Invention}
                        onChange={e => setParsedData({...parsedData, type: e.target.value as PatentType})}
                        className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
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
                      value={parsedData.appNumber || ''} 
                      onChange={e => setParsedData({...parsedData, appNumber: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                   />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">公開/公告號</label>
                   <input 
                      type="text" 
                      value={parsedData.pubNumber || ''} 
                      onChange={e => setParsedData({...parsedData, pubNumber: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                   />
                </div>

                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">申請日</label>
                   <input 
                      type="date" 
                      value={parsedData.appDate || ''} 
                      onChange={e => setParsedData({...parsedData, appDate: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">公開/公告日</label>
                   <input 
                      type="date" 
                      value={parsedData.pubDate || ''} 
                      onChange={e => setParsedData({...parsedData, pubDate: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>

                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1">專利期間</label>
                   <input 
                      type="text" 
                      value={parsedData.duration || ''} 
                      onChange={e => setParsedData({...parsedData, duration: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>
                
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">年費到期日</label>
                   <input 
                      type="date" 
                      value={parsedData.annuityDate || ''} 
                      onChange={e => setParsedData({...parsedData, annuityDate: e.target.value})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">年費有效年次</label>
                   <input 
                      type="number" 
                      value={parsedData.annuityYear || 0} 
                      onChange={e => setParsedData({...parsedData, annuityYear: parseInt(e.target.value)})}
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>
                
                <div className="col-span-2">
                   <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                      <Mail size={12} />
                      自動通知信箱 (提前3個月通知)
                   </label>
                   <input 
                      type="text" 
                      value={parsedData.notificationEmails || ''} 
                      onChange={e => setParsedData({...parsedData, notificationEmails: e.target.value})}
                      placeholder="請輸入 Email，多筆請用逗號分隔"
                      className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                   />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          {step === 'input' ? (
            <>
              <button 
                onClick={handleClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!rawText.trim() && !selectedFile)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm ${
                    isExcel 
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300' 
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
                } disabled:cursor-not-allowed`}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : (isExcel ? <FileSpreadsheet size={16} /> : <Sparkles size={16} />)}
                {isAnalyzing ? '正在處理...' : (isExcel ? '解析 Excel' : 'AI 智慧解析')}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setStep('input')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                返回修改
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
              >
                <Check size={16} />
                {parsedBatch.length > 0 ? `確認匯入 ${parsedBatch.length} 筆` : '確認匯入'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;