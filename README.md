# 📘 PatentVault Pro - 企業級專利管理系統

**版本**: v1.1.0 (Safe Mode)
**維護者**: Robin Hsu, Rachel Chiang, Dora Fu

## 1. 專案簡介 (Introduction)

PatentVault Pro 是一個專為企業法務與智權部門設計的現代化專利管理平台。解決了傳統 Excel 管理難以協作、缺乏主動提醒以及資料散亂的問題。系統整合了 Google Gemini AI，能自動化解析專利文件，並提供智慧法律諮詢。

## 2. 設計理念 (Design Philosophy)

*   **極簡與專業 (Minimalist & Professional)**：採用 `Inter` 字體與深藍/冷灰配色 (Slate/Blue)，營造專業、值得信賴的企業級軟體氛圍。
*   **儀表板優先 (Dashboard First)**：登入後首頁即為數據儀表板，讓管理者能一眼掌握專利總數、存續率、各國分佈及風險狀況。
*   **AI 賦能 (AI-Powered)**：
    *   **智慧匯入**：利用 Google Gemini 模型，將繁瑣的「資料輸入」自動化。
    *   **法律助手**：內建 AI Chat，根據當前專利清單提供風險分析與建議。
*   **防呆與提醒 (Safety & Alert)**：
    *   **視覺化狀態**：透過紅/綠/橘燈號直觀顯示專利狀態。
    *   **主動提醒**：系統自動計算年費到期日，並在儀表板與列表中高亮顯示即將到期 (90天內) 的案件。
    *   **資料安全 (v1.1)**：重置資料前強制備份，並需輸入驗證碼確認。
*   **權限控制 (RBAC)**：僅允許特定網域 (如 `91app.com`, `nine-yi.com`) 或白名單內的 Email 登入。

---

## 3. 技術架構 (Tech Stack)

*   **Frontend Framework**: React 19 (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Visualization**: Recharts
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Backend & Auth**: Supabase (`@supabase/supabase-js`)
*   **Excel Processing**: SheetJS (xlsx)
*   **Icons**: Lucide React

---

## 4. 安裝與執行 (Installation)

請確保環境已安裝 Node.js (v18+)。

```bash
# 1. 安裝依賴套件
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 建置生產版本
npm run build
```

---

## 5. 系統設定與第三方服務 (Configuration)

本系統依賴 **Supabase** 與 **Google AI Studio**。

### A. Supabase 設定 (資料庫)

1.  前往 [Supabase](https://supabase.com/) 建立專案。
2.  在 `services/supabaseService.ts` 中填入 `SUPABASE_URL` 與 `SUPABASE_KEY`。
3.  進入 Supabase **SQL Editor**，執行以下指令建立資料表與權限：

#### 基礎資料表
```sql
-- 1. 建立專利資料表
create table patents (
  id text primary key,
  name text not null,
  patentee text,
  country text,
  status text,
  type text,
  "appNumber" text,
  "pubNumber" text,
  "appDate" text,
  "pubDate" text,
  duration text,
  "annuityDate" text,
  "annuityYear" numeric,
  "notificationEmails" text,
  inventor text,
  abstract text,
  link text,
  created_at timestamptz default now()
);

-- 2. 建立郵件紀錄表
create table "emailLogs" (
  id text primary key,
  timestamp text,
  "patentName" text,
  recipient text,
  subject text,
  status text,
  created_at timestamptz default now()
);

-- 3. 建立自動備份資料表 (v1.1新增)
create table "patent_backups" (
  id uuid primary key default gen_random_uuid(),
  "backupId" text not null,
  "archivedAt" timestamptz default now(),
  "originalId" text,
  "patentData" jsonb
);

-- 4. 開放權限 (配合目前的免登入/模擬登入模式)
alter table "patents" enable row level security;
alter table "emailLogs" enable row level security;
alter table "patent_backups" enable row level security;

create policy "Enable full access for everyone" on "patents" for all using (true) with check (true);
create policy "Enable full access for everyone" on "emailLogs" for all using (true) with check (true);
create policy "Enable full access for everyone" on "patent_backups" for all using (true) with check (true);
```

### B. Google Gemini 設定 (AI)

1.  前往 [Google AI Studio](https://aistudio.google.com/) 申請 API Key。
2.  本專案目前設定於 `process.env.API_KEY` 或直接在 `services/geminiService.ts` 內讀取環境變數。

---

## 6. 功能實作細節 (Implementation Details)

### 身份驗證 (`LoginPage.tsx`, `App.tsx`)
*   **邏輯**：
    *   檢查 Email 是否在 `constants.ts` 的 `ALLOWED_DOMAINS` 或 `ALLOWED_EMAILS` 白名單中。
    *   **免登入模式**：若未偵測到 Supabase Session，系統會自動模擬 `ALLOWED_EMAILS[0]` (預設管理員) 的身份進入系統，跳過登入畫面。

### 安全備份 (`App.tsx`)
*   **觸發**：僅超級管理員可看見「重置範例資料」按鈕。
*   **流程**：
    1.  彈出 `prompt` 視窗，要求輸入 `RESET`。
    2.  讀取當前所有 `patents` 資料。
    3.  將資料打包寫入 `patent_backups` 表，並附帶 `backupId` (時間戳)。
    4.  若備份成功，才執行重置 (Upsert Mock Data)。

### AI 智慧匯入 (`ImportModal.tsx`)
*   **支援格式**：Excel (.xlsx), PDF, 純文字。
*   **Excel**：使用 `xlsx` 解析，批次匯入多筆資料。
*   **AI 解析**：將文字或 PDF 內容傳送至 Gemini-3-Flash 模型，並強制輸出為符合 `Patent` 介面的 JSON 格式。

### 數據儀表板 (`PatentStats.tsx`)
*   使用 `Recharts` 繪製圖表。
*   **圓餅圖**：案件類型佔比。
*   **長條圖**：申請國家分佈。
*   **堆疊圖**：專利權人 x 類型/國家 交叉分析。

---

## 7. 檔案結構 (Project Structure)

```
/
├── App.tsx             # 主應用程式邏輯 (路由、狀態管理、備份邏輯)
├── constants.ts        # 設定檔 (白名單、Mock Data)
├── types.ts            # TypeScript 型別定義
│
├── components/         # UI 元件
│   ├── PatentTable.tsx      # 列表表格 (含到期日計算)
│   ├── PatentStats.tsx      # 統計圖表 (Recharts)
│   ├── AIChat.tsx           # AI 聊天視窗 (Gemini)
│   ├── ImportModal.tsx      # 匯入模態框 (AI/Excel)
│   └── ...
│
└── services/           # API 服務層
    ├── supabaseService.ts   # 資料庫連線實例
    └── geminiService.ts     # AI API 呼叫邏輯
```