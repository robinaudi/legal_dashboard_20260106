# Changelog

## [v1.0.0] - Stable Release - 2026-01-06

### 🚀 Major Features (核心功能)
- **免登入快速存取**：預設使用模擬管理員身份進入系統，移除強制登入阻擋。
- **權限白名單**：僅允許 `91app.com` 與 `nine-yi.com` 網域，及特定管理員 Email。
- **儀表板 (Dashboard)**：
    - 專利總覽 (總數、存續率、屆期數)。
    - 視覺化圖表：案件類型分佈、國家分佈、專利權人交叉分析。
- **專利清單 (List View)**：
    - 支援搜尋、狀態篩選。
    - **年費期限計算**：自動標示 90 天內到期的案件。
    - CRUD 操作：新增、編輯、刪除。

### 🤖 AI Integration (AI 整合)
- **AI 智慧匯入**：支援解析純文字、PDF 文件，自動填入專利欄位。
- **AI 法律助手**：側邊欄快捷入口，支援上下文對話 (Context-aware chat)。

### 🛠 Utilities (工具)
- **Excel 整合**：支援批次匯入 (.xlsx) 與清單匯出。
- **通知模擬**：郵件預覽與發送紀錄 (Log) 保存。
- **資料庫同步**：整合 Supabase，支援雲端資料存取與 Mock Data 自動種子 (Seeding)。

### 🐛 Fixes & Improvements
- 修復側邊欄「系統狀態」與「AI 助手」區塊遺失的問題。
- 優化手機版與電腦版的響應式佈局 (RWD)。
- 調整 UI 配色為專業深藍/冷灰色系 (Inter Font)。
