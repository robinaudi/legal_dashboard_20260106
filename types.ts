
export enum PatentStatus {
  Active = '存續中',
  Expired = '已屆期',
  Pending = '審查中'
}

export enum PatentType {
  Invention = '發明',
  Utility = '新型',
  Design = '設計'
}

export interface Patent {
  id: string;
  name: string;             // 專利名稱
  patentee: string;         // 專利權人
  country: string;          // 申請國家
  status: PatentStatus;     // 狀態
  type: PatentType;         // 類型
  appNumber: string;        // 申請號
  pubNumber: string;        // 公開公告號
  appDate: string;          // 申請日
  pubDate: string;          // 公開公告期日
  duration: string;         // 專利期間 (e.g., 2020/01/01 - 2040/01/01)
  annuityDate: string;      // 年費有效日期
  annuityYear: number;      // 年費有效年次
  notificationEmails?: string; // 到期通知信箱 (Comma separated)
  inventor: string;         // 發明人/創作人
  abstract?: string;        // 摘要 (Optional for AI analysis)
  link?: string;            // 電子證書連結
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  patentName: string;
  recipient: string;
  subject: string;
  status: 'Success' | 'Failed';
  errorMessage?: string;
}

export interface AccessRule {
  id: string;
  value: string;       // Email or Domain
  type: 'EMAIL' | 'DOMAIN';
  role: 'ADMIN' | 'USER';
  description?: string;
}
