import { supabase } from './supabaseService';

/**
 * 記錄使用者操作
 * @param userEmail 使用者 Email (若未登入可傳 null 或 'system')
 * @param action 動作名稱 (建議使用大寫，如 'LOGIN', 'DELETE')
 * @param target 操作對象 (如專利 ID 或功能名稱)
 * @param details 詳細資訊 (JSON 物件)
 */
export const logAction = async (
  userEmail: string | undefined | null,
  action: string,
  target?: string,
  details?: object
) => {
  try {
    const { error } = await supabase.from('action_logs').insert([
      {
        user_email: userEmail || 'anonymous',
        action: action,
        target: target || '',
        details: details || {},
        // ip_address: 获取 IP 需要服务端支持，纯前端较难获取真实 IP，此处省略或由 Supabase Edge Function 处理
      }
    ]);

    if (error) {
      console.error('Failed to write log:', error);
    }
  } catch (e) {
    console.error('Log service error:', e);
  }
};
