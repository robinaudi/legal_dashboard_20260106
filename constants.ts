import { Patent, PatentStatus, PatentType } from './types';

// ==========================================
// 系統版本設定 (System Version)
// ==========================================
export const APP_VERSION = 'v1.2.0 (DB Auth)';

// ==========================================
// 權限設定 (Access Control)
// 注意：現在權限已改為從 Supabase 資料庫 'access_control' 表讀取。
// 以下常數僅作為備用或初始參考，實際邏輯在 App.tsx 與 LoginPage.tsx
// ==========================================

export const DEFAULT_ADMIN_EMAIL = 'robinhsu@91app.com';

// ==========================================
// Mock Data
// ==========================================

export const MOCK_PATENTS: Patent[] = [
  {
    id: '1',
    name: '高效率太陽能電池結構',
    patentee: '光電創新股份有限公司',
    country: 'TW (台灣)',
    status: PatentStatus.Active,
    type: PatentType.Invention,
    appNumber: '112100123',
    pubNumber: 'I1234567',
    appDate: '2023-01-15',
    pubDate: '2023-08-20',
    duration: '2023-01-15 ~ 2043-01-15',
    annuityDate: '2024-01-15',
    annuityYear: 2,
    notificationEmails: 'admin@solar-tech.com.tw, finance@solar-tech.com.tw',
    inventor: '王小明, 李大同',
    abstract: '本發明涉及一種太陽能電池結構，特別是一種具有高光電轉換效率的堆疊式結構...',
    link: 'https://twpat.tipo.gov.tw/'
  },
  {
    id: '2',
    name: '折疊式電子裝置樞紐',
    patentee: 'Future Tech Inc.',
    country: 'US (美國)',
    status: PatentStatus.Active,
    type: PatentType.Invention,
    appNumber: '17/890,123',
    pubNumber: 'US-2023-0123456-A1',
    appDate: '2022-05-10',
    pubDate: '2023-11-12',
    duration: '2022-05-10 ~ 2042-05-10',
    annuityDate: '2024-05-10',
    annuityYear: 3,
    notificationEmails: 'ip-dept@futuretech.com',
    inventor: 'John Smith, Sarah Johnson',
    link: 'https://ppubs.uspto.gov/'
  },
  {
    id: '3',
    name: '飲料杯架改良',
    patentee: '生活好物有限公司',
    country: 'JP (日本)',
    status: PatentStatus.Expired,
    type: PatentType.Utility,
    appNumber: '2018-001234',
    pubNumber: 'JP-3210987-U',
    appDate: '2018-03-20',
    pubDate: '2018-09-15',
    duration: '2018-03-20 ~ 2028-03-20',
    annuityDate: '2023-03-20',
    annuityYear: 6,
    notificationEmails: 'contact@lifestyle-goods.jp',
    inventor: '田中太郎',
  },
  {
    id: '4',
    name: '智慧手錶外觀設計',
    patentee: 'Smart Wearables Ltd.',
    country: 'CN (中國)',
    status: PatentStatus.Active,
    type: PatentType.Design,
    appNumber: '202330012345.X',
    pubNumber: 'CN-308123456-S',
    appDate: '2023-02-01',
    pubDate: '2023-07-01',
    duration: '2023-02-01 ~ 2038-02-01',
    annuityDate: '2024-02-01',
    annuityYear: 2,
    inventor: '張偉',
  },
  {
    id: '5',
    name: '自適應網路路由方法',
    patentee: '網通科技股份有限公司',
    country: 'TW (台灣)',
    status: PatentStatus.Active,
    type: PatentType.Invention,
    appNumber: '111100567',
    pubNumber: 'I7654321',
    appDate: '2022-11-10',
    pubDate: '2023-05-20',
    duration: '2022-11-10 ~ 2042-11-10',
    annuityDate: '2024-11-10',
    annuityYear: 2,
    inventor: '陳志豪, 林雅婷',
  },
   {
    id: '6',
    name: '具備除濕功能的空氣清淨機',
    patentee: 'CleanAir Korea Co.',
    country: 'KR (韓國)',
    status: PatentStatus.Active,
    type: PatentType.Utility,
    appNumber: '20-2021-0001234',
    pubNumber: 'KR-20-0498765-Y1',
    appDate: '2021-06-15',
    pubDate: '2021-12-01',
    duration: '2021-06-15 ~ 2031-06-15',
    annuityDate: '2024-06-15',
    annuityYear: 4,
    inventor: 'Park Ji-sung',
  },
  {
    id: '7',
    name: '電動車充電樁外殼',
    patentee: 'Euro Charge GmbH',
    country: 'EU (歐盟)',
    status: PatentStatus.Active,
    type: PatentType.Design,
    appNumber: '009123456-0001',
    pubNumber: '009123456-0001',
    appDate: '2022-08-30',
    pubDate: '2022-09-15',
    duration: '2022-08-30 ~ 2047-08-30',
    annuityDate: '2027-08-30',
    annuityYear: 1, // EU design renewal every 5 years usually
    inventor: 'Hans Müller',
  },
  {
    id: '8',
    name: '半導體製程清洗裝置',
    patentee: 'SemiTech US Corp.',
    country: 'US (美國)',
    status: PatentStatus.Expired,
    type: PatentType.Invention,
    appNumber: '13/456,789',
    pubNumber: 'US-8765432-B2',
    appDate: '2012-04-20',
    pubDate: '2014-06-10',
    duration: '2012-04-20 ~ 2032-04-20',
    annuityDate: '2023-04-20',
    annuityYear: 12, // Expired due to non-payment or other reason in mock scenario
    inventor: 'David Wilson',
  }
];
