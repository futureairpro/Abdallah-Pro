// 🗄️ Supabase Cloud Client for Abdullah's Journey OS
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://iluvbcadeteawbyrlqmo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ WARNING: Supabase credentials missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Helper: Get AI Keys from DB or ENV
export async function getStoredAiKeys() {
  try {
    const { data } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', 999999)
      .maybeSingle();

    return data?.data?.GEMINI_API_KEYS || process.env.GEMINI_API_KEYS;
  } catch (e) {
    return process.env.GEMINI_API_KEYS;
  }
}

// Helper: User Session Storage in Supabase
export async function setUserSession(userId, sessionData) {
  try {
    if (!userId) return;
    await supabase.from('bot_sessions').upsert({
      chat_id: Number(userId),
      state: 'user_session',
      data: sessionData,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('setUserSession error:', e.message);
  }
}

export async function getUserSession(userId) {
  try {
    if (!userId) return null;
    const { data } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', Number(userId))
      .maybeSingle();
    return data?.data || null;
  } catch (e) {
    return null;
  }
}

// Helper: Update Liquidity Balances (Cash Flow)
export async function updateLiquidity(paymentMethod, amountChange) {
  try {
    if (!paymentMethod || amountChange === 0) return;
    const { data: row } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', 999999)
      .maybeSingle();

    const finData = row?.data || {};
    const liquidity = finData.liquidity || {
      'خزنة شخصية': 0,
      'فودافون كاش': 0,
      'إنستا باي': 0,
      'بنك مصر': 0
    };

    const cleanMethod = String(paymentMethod).trim();
    let finalKey = 'خزنة شخصية';
    if (cleanMethod.includes('فودافون')) finalKey = 'فودافون كاش';
    else if (cleanMethod.includes('إنستا') || cleanMethod.includes('انستا')) finalKey = 'إنستا باي';
    else if (cleanMethod.includes('بنك')) finalKey = 'بنك مصر';

    liquidity[finalKey] = Number(liquidity[finalKey] || 0) + amountChange;
    finData.liquidity = liquidity;

    await supabase
      .from('bot_sessions')
      .upsert({ chat_id: 999999, data: finData, updated_at: new Date().toISOString() });

    return liquidity[finalKey];
  } catch (e) {
    console.warn('updateLiquidity failed:', e.message);
  }
}
