import { createClient } from '@supabase/supabase-js';

// 使用您提供的 Project URL 與 Public Key
const SUPABASE_URL = 'https://uqhumjknzrlnefbtlqyn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_bEIyJ7p6JNw7RNHAQ3JGyQ_RpSh412R';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 說明：
 * 雖然將 Key 放在前端程式碼中對於 "Public (Anon)" Key 來說是允許的（因為它受 RLS 規則限制），
 * 但在正式生產環境中，建議開啟 Supabase 的 Row Level Security (RLS) 
 * 來限制誰可以讀寫資料，或者將這些變數移至環境變數 (.env) 中。
 */
