# 📘 PatentVault Pro - 企業級專利管理系統

**版本**: v1.2.0 (DB Auth)
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
*   **權限控制 (RBAC)**：基於資料庫的角色權限管理，支援動態指派角色與權限。

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

## 5. 系統設定 (Configuration)

本系統依賴 **Supabase** 與 **Google AI Studio**。

### A. Supabase 設定 (資料庫)
請在 `services/supabaseService.ts` 中填入 Project URL 與 Key。需建立 `patents`, `access_control`, `app_roles`, `action_logs` 等資料表。

### B. Google Gemini 設定 (AI)
本專案目前設定於 `process.env.API_KEY` 或直接在 `services/geminiService.ts` 內讀取環境變數。

---

## 6. 功能實作細節 (Implementation Details)

### 身份驗證與權限 (RBAC)
*   **混合驗證**：支援 Supabase Auth (Magic Link) 登入。
*   **動態權限**：登入後，系統會根據 User Email 查詢資料庫中的角色 (Role)，並根據角色權重 (`ROLE_LEVELS`) 決定最終權限。
*   **權限守門員**：前端使用 `<PermissionGuard />` 元件包裹敏感按鈕，無權限者無法看見操作入口。

### AI 智慧匯入
*   **多模態解析**：支援 Excel (.xlsx) 批次匯入，以及 PDF/文字 的 AI 語意解析。
*   **格式標準化**：AI 強制輸出符合 `Patent` 介面的 JSON 格式。

### 系統日誌 (Logging)
*   **行為追蹤**：記錄登入、刪除、匯入等關鍵操作。
*   **環境偵測**：自動記錄操作者的 IP 位址與瀏覽器/作業系統資訊。

---

## 7. 系統架構與檔案結構 (System Architecture)

### 7.1 核心架構流程 (Architecture Overview)

本系統採用 **單頁應用程式 (SPA)** 架構，前後端分離設計：

*   **View Layer (UI)**: React 19 + Tailwind CSS。
*   **Logic Layer**: TypeScript 負責型別安全與業務邏輯。
*   **Data Layer**: Supabase (PostgreSQL) 負責資料儲存與即時權限驗證 (RLS)。
*   **AI Layer**: Google Gemini API 負責非結構化資料解析與自然語言問答。

### 7.2 資料流向 (Data Flow)

1.  **驗證 (Auth)**: `LoginPage` -> Supabase Auth (Magic Link) -> `App.tsx` (Session State)。
2.  **權限 (RBAC)**: `App.tsx` 讀取 User Email -> 查詢 `access_control` 表 -> 計算權重 (`ROLE_LEVELS`) -> 決定 `currentUserRole` -> `PermissionGuard` 控制 UI 渲染。
3.  **專利操作**: `PatentTable` -> `supabaseService` -> DB CRUD。
4.  **日誌 (Logging)**: 用戶操作 -> `logService` -> 收集 IP/Browser -> 寫入 `action_logs`。

### 7.3 詳細目錄結構 (Directory Structure)

```
/
├── index.html              # 應用程式入口點 (Entry Point)
├── index.tsx               # React 掛載點
├── App.tsx                 # [核心] 主控制器：負責路由、全局狀態、權限載入
├── types.ts                # [核心] TypeScript 型別定義 (Patent, User, Logs, Roles)
├── constants.ts            # 全域常數、Mock Data、版本號
├── vite.config.ts          # Vite 建置設定
│
├── components/             # UI 元件庫
│   ├── AccessControlModal.tsx  # [後台] 系統管理：使用者名單、角色權限、登入日誌 (含 IP 偵測)
│   ├── AIChat.tsx              # [AI] 懸浮聊天視窗 (整合 Gemini 3)
│   ├── DeleteConfirmModal.tsx  # 刪除確認對話框
│   ├── EditModal.tsx           # 專利編輯表單
│   ├── EmailPreviewModal.tsx   # 郵件預覽與發送介面
│   ├── ImportModal.tsx         # [AI] 智慧匯入 (Excel/PDF/Text 解析)
│   ├── LogModal.tsx            # 郵件發送紀錄檢視
│   ├── LoginPage.tsx           # 登入頁面 (含 Supabase Auth 與權限檢查)
│   ├── PatentStats.tsx         # [儀表板] 視覺化統計圖表 (Recharts)
│   ├── PatentTable.tsx         # [清單] 專利資料表格 (含到期日計算與燈號邏輯)
│   └── PermissionGuard.tsx     # [權限] 前端權限守門員 (HOC)
│
└── services/               # 外部服務整合層
    ├── geminiService.ts        # Google Gemini AI 整合 (Chat & Parsing)
    ├── logService.ts           # 系統操作日誌 (含 Throttle 防抖與環境偵測)
    └── supabaseService.ts      # Supabase Client 初始化
```

---

## 8. 系統管理後台功能詳解 (System Admin Panel Guide)

本系統包含一個功能強大的管理後台 (`AccessControlModal.tsx`)，用於集中管理使用者、角色權限與系統日誌。若需將此功能移植至其他專案，請參考以下規格。

### 8.1 使用者名單管理 (User Management)

此模組負責控制誰可以登入系統 (白名單機制) 以及他們擁有的初始角色。

*   **註冊方式 (Registration)**:
    *   本系統採用 **封閉式白名單 (Closed Whitelist)**。
    *   使用者無法自行註冊，必須由管理員在此後台新增其 Email 或 Domain。
*   **新增使用者/網域**:
    *   **類型選擇**: 支援 `單一 Email` (如 `user@company.com`) 或 `網域` (如 `company.com`)。
    *   **指派角色**: 支援多選角色。系統會自動依照 `ROLE_LEVELS` (權重) 由高至低排序顯示 (例如: ADMIN Lv.100 > IT Lv.80 > USER Lv.10)。
    *   **重複檢測**: 輸入時若偵測到該使用者已存在，會顯示黃色警告提示，確認後將執行「權限覆蓋/更新」。
*   **Notion 風格智能搜尋 (Smart Search UI)**:
    *   **置頂搜尋列 (Sticky Header)**: 列表滾動時，搜尋框與篩選器會固定在頂部。
    *   **關鍵字高亮 (Highlighting)**: 搜尋結果中的關鍵字會以黃底高亮顯示 (`HighlightText` 元件)。
    *   **角色篩選器 (Role Filter)**: 可點擊上方 Role Chips (如 "ADMIN", "USER") 快速篩選特定角色的使用者。
*   **列表呈現**:
    *   **自動合併顯示**: 同一個 Email 若有多個角色，會在同一列以 Tags 顯示。
    *   **別名同步**: 針對特定網域 (如 `91app.com` 與 `nine-yi.com`) 提供自動別名顯示。

### 8.2 角色與權限設定 (Role & Permission Settings)

此模組實現了 RBAC (Role-Based Access Control) 的核心配置。

*   **角色管理 (CRUD)**:
    *   **新增角色**: 輸入名稱 (自動轉大寫) 即可建立新角色 (e.g., `AUDITOR`)。
    *   **刪除角色**: 預設系統角色 (`ADMIN`, `USER`) 受保護無法刪除，其餘自定義角色可刪除。
    *   **角色改名 (Rename)**: 支援修改角色名稱。
        *   *Migration Logic*: 改名時，系統會自動搜尋所有擁有舊角色名稱的使用者，並將其更新為新角色名稱，確保權限不中斷。
*   **權限編輯 (Permission Matrix)**:
    *   左側選擇角色，右側顯示權限勾選清單。
    *   支援的權限顆粒度 (`PERMISSIONS`): `VIEW_DASHBOARD`, `EDIT_PATENT`, `DELETE_PATENT`, `IMPORT_DATA`, `EXPORT_DATA`, `SEND_EMAIL`, `AI_CHAT`, `MANAGE_ACCESS` 等。
    *   點擊「儲存權限」後即時寫入資料庫。

### 8.3 登入日誌 (Login Logs)

用於資安稽核與異常排除。

*   **紀錄內容**:
    *   **登入時間**: 使用者成功取得 Session 的時間。
    *   **使用者 Email**: 操作者帳號。
    *   **IP Address**: 透過 `ipify` API 獲取的客戶端 IP。
    *   **裝置指紋**: 瀏覽器 (Chrome/Safari) 與作業系統 (Windows/MacOS) 資訊。
*   **資料來源**: 讀取 `action_logs` 資料表中 `action = 'LOGIN'` 的紀錄。

### 8.4 資料庫結構參考 (Database Schema)

若要 100% 複製此後台功能，請在 Supabase 執行以下 SQL 建立對應 Table：

```sql
-- 1. 角色定義表 (App Roles)
CREATE TABLE app_roles (
    role_name text PRIMARY KEY, -- e.g., 'ADMIN', 'USER'
    permissions text[] DEFAULT '{}', -- e.g., ['view_dashboard', 'edit_patent']
    description text,
    created_at timestamptz DEFAULT now()
);

-- 初始資料種子
INSERT INTO app_roles (role_name, permissions, description) VALUES
('ADMIN', '{"view_dashboard","view_list","view_logs","manage_access","edit_patent","delete_patent","import_data","export_data","send_email","ai_chat"}', '系統管理員'),
('USER', '{"view_dashboard","view_list","ai_chat"}', '一般使用者');


-- 2. 權限白名單表 (Access Control)
CREATE TABLE access_control (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL CHECK (type IN ('EMAIL', 'DOMAIN')), -- 'EMAIL' or 'DOMAIN'
    value text NOT NULL, -- 'user@example.com' or 'example.com'
    role text REFERENCES app_roles(role_name) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- 3. 系統日誌表 (Action Logs)
CREATE TABLE action_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email text,
    action text NOT NULL, -- 'LOGIN', 'DELETE_PATENT', etc.
    target text,
    details jsonb, -- 儲存 IP, UserAgent 等詳細資訊
    created_at timestamptz DEFAULT now()
);
```