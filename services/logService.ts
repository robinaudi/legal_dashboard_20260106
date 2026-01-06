import { supabase } from './supabaseService';

// 用於記錄上一次操作的時間戳，防止短時間內重複寫入 (Key: email_action)
const logThrottleMap = new Map<string, number>();

/**
 * 獲取客戶端 IP (使用公開 API)
 */
const getClientIp = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
};

/**
 * 簡易解析瀏覽器資訊
 */
const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  if (ua.indexOf("Win") !== -1) os = "Windows";
  if (ua.indexOf("Mac") !== -1) os = "MacOS";
  if (ua.indexOf("Linux") !== -1) os = "Linux";
  if (ua.indexOf("Android") !== -1) os = "Android";
  if (ua.indexOf("like Mac") !== -1) os = "iOS";

  if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
  else if (ua.indexOf("Safari") !== -1) browser = "Safari";
  else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
  else if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident/") !== -1) browser = "IE/Edge";

  return `${browser} on ${os}`;
};

/**
 * 記錄使用者操作 (含防抖動與環境資訊偵測)
 * @param userEmail 使用者 Email
 * @param action 動作名稱
 * @param target 操作對象
 * @param details 詳細資訊
 */
export const logAction = async (
  userEmail: string | undefined | null,
  action: string,
  target?: string,
  details?: any
) => {
  const email = userEmail || 'anonymous';
  
  // 1. 防抖動檢查 (Throttle): 2秒內同一人同一動作不重複紀錄
  const throttleKey = `${email}_${action}`;
  const now = Date.now();
  const lastTime = logThrottleMap.get(throttleKey) || 0;

  if (now - lastTime < 2000) {
    console.warn(`[Log Skipped] Duplicate action detected: ${action}`);
    return;
  }
  logThrottleMap.set(throttleKey, now);

  try {
    // 2. 獲取環境資訊 (非同步不阻擋)
    const [ip, browserInfo] = await Promise.all([
        getClientIp(), 
        Promise.resolve(getBrowserInfo())
    ]);

    // 3. 組合詳細資訊
    const enrichedDetails = {
        ...details,
        ip: ip,
        browser: browserInfo,
        userAgent: navigator.userAgent
    };

    const { error } = await supabase.from('action_logs').insert([
      {
        user_email: email,
        action: action,
        target: target || '',
        details: enrichedDetails,
      }
    ]);

    if (error) {
      console.error('Failed to write log:', error);
    }
  } catch (e) {
    console.error('Log service error:', e);
  }
};