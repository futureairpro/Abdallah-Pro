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

export const ADMIN_CHAT_ID = 1191760477;

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

// ==============================================================================
// 👥 Multi-Tenant User Management & Subscription Engine
// ==============================================================================

export async function getUserProfile(userId) {
  if (!userId) return null;
  const numId = Number(userId);

  // 1. Super Admin (Dr. Abdullah)
  if (numId === ADMIN_CHAT_ID) {
    return {
      telegram_id: ADMIN_CHAT_ID,
      full_name: 'د. عبدالله (المؤسس والمدير)',
      username: 'AbdallahPro',
      role: 'admin',
      subscription_status: 'lifetime',
      is_active: true,
      is_admin: true,
      trial_ends_at: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
      subscription_ends_at: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString()
    };
  }

  try {
    // Try users table first
    const { data: userRow } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', numId)
      .maybeSingle();

    if (userRow) {
      const now = Date.now();
      const trialEnd = userRow.trial_ends_at ? new Date(userRow.trial_ends_at).getTime() : 0;
      const subEnd = userRow.subscription_ends_at ? new Date(userRow.subscription_ends_at).getTime() : 0;

      let isActive = false;
      let status = userRow.subscription_status || 'trial';

      if (status === 'lifetime') {
        isActive = true;
      } else if (status === 'active' && subEnd > now) {
        isActive = true;
      } else if (status === 'trial' && trialEnd > now) {
        isActive = true;
      } else {
        isActive = false;
        status = 'expired';
      }

      return {
        ...userRow,
        subscription_status: status,
        is_active: isActive,
        is_admin: userRow.role === 'admin',
        is_trial: status === 'trial' && isActive,
        days_remaining: Math.max(0, Math.ceil(((status === 'active' ? subEnd : trialEnd) - now) / (24 * 3600 * 1000)))
      };
    }

    // Fallback: Check bot_sessions (state: user_profile)
    const { data: sessionRow } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', numId)
      .maybeSingle();

    if (sessionRow?.data?.profile) {
      const p = sessionRow.data.profile;
      const now = Date.now();
      const trialEnd = p.trial_ends_at ? new Date(p.trial_ends_at).getTime() : 0;
      const subEnd = p.subscription_ends_at ? new Date(p.subscription_ends_at).getTime() : 0;

      let isActive = false;
      let status = p.subscription_status || 'trial';

      if (status === 'lifetime') {
        isActive = true;
      } else if (status === 'active') {
        isActive = (subEnd > now) || (Number(p.days_remaining || 0) > 0);
        if (!isActive) status = 'expired';
      } else if (status === 'trial') {
        isActive = (trialEnd > now) || (Number(p.days_remaining || 0) > 0);
        if (!isActive) status = 'expired';
      } else {
        isActive = false;
        status = 'expired';
      }

      return {
        telegram_id: numId,
        full_name: p.full_name || 'دكتور زميل',
        username: p.username || null,
        university: p.university || 'كلية الطب البشري',
        role: p.role || 'student',
        subscription_status: status,
        is_active: isActive,
        is_admin: p.role === 'admin',
        is_trial: status === 'trial' && isActive,
        trial_ends_at: p.trial_ends_at,
        subscription_ends_at: p.subscription_ends_at,
        days_remaining: Math.max(0, Math.ceil(((status === 'active' ? subEnd : trialEnd) - now) / (24 * 3600 * 1000)))
      };
    }

    return null; // User not registered yet
  } catch (e) {
    console.warn('[getUserProfile Warn]:', e.message);
    return null;
  }
}

export async function registerUserProfile(userId, { fullName, username, university = 'كلية الطب البشري' }) {
  if (!userId || !fullName) return null;
  const numId = Number(userId);
  const now = new Date();
  const trialDays = 3;
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 3600 * 1000).toISOString();

  const profile = {
    telegram_id: numId,
    full_name: fullName.trim(),
    username: username || null,
    university: university.trim(),
    academic_year: 'الفرقة الرابعة',
    role: numId === ADMIN_CHAT_ID ? 'admin' : 'student',
    subscription_status: numId === ADMIN_CHAT_ID ? 'lifetime' : 'trial',
    trial_ends_at: trialEndsAt,
    subscription_ends_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  };

  try {
    // 1. Try insert/upsert into users table
    try {
      await supabase.from('users').upsert(profile);
    } catch (_) {}

    // 2. Always persist into bot_sessions as primary/fallback storage
    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    const sessData = existing?.data || {};
    sessData.profile = profile;

    await supabase.from('bot_sessions').upsert({
      chat_id: numId,
      state: 'user_profile',
      data: sessData,
      updated_at: now.toISOString()
    });

    return profile;
  } catch (e) {
    console.error('[registerUserProfile Error]:', e.message);
    return profile;
  }
}

export async function activateUserSubscription(userId, days = 120, adminNotes = 'تفعيل اشتراك فصلي') {
  if (!userId) return false;
  const numId = Number(userId);
  const now = new Date();
  const subEndsAt = new Date(now.getTime() + Number(days) * 24 * 3600 * 1000).toISOString();

  try {
    // Update users table if exists
    try {
      await supabase.from('users').update({
        subscription_status: 'active',
        subscription_ends_at: subEndsAt,
        updated_at: now.toISOString()
      }).eq('telegram_id', numId);
    } catch (_) {}

    // Update bot_sessions
    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    const sessData = existing?.data || {};
    if (!sessData.profile) sessData.profile = { telegram_id: numId, full_name: 'دكتور زميل' };
    sessData.profile.subscription_status = 'active';
    sessData.profile.subscription_ends_at = subEndsAt;
    sessData.profile.admin_notes = adminNotes;

    await supabase.from('bot_sessions').upsert({
      chat_id: numId,
      state: 'user_profile',
      data: sessData,
      updated_at: now.toISOString()
    });

    return true;
  } catch (e) {
    console.error('[activateUserSubscription Error]:', e.message);
    return false;
  }
}

export async function getAllRegisteredUsers() {
  try {
    const { data: rows } = await supabase.from('bot_sessions').select('*');
    const usersMap = new Map();

    // 1. Always include Super Admin Dr. Abdullah
    usersMap.set(ADMIN_CHAT_ID, {
      telegram_id: ADMIN_CHAT_ID,
      full_name: 'د. عبدالله',
      role: 'admin',
      is_active: true,
      subscription_status: 'lifetime'
    });

    // 2. Add all registered users/students from bot_sessions
    (rows || []).forEach(r => {
      const cid = Number(r.chat_id);
      if (cid && cid !== 999999 && cid !== 888888 && cid > 1000) {
        const prof = r.data?.profile || {};
        usersMap.set(cid, {
          telegram_id: cid,
          full_name: prof.full_name || 'دكتور زميل',
          role: prof.role || (cid === ADMIN_CHAT_ID ? 'admin' : 'student'),
          is_active: prof.is_active !== false,
          subscription_status: prof.subscription_status || 'active'
        });
      }
    });

    return Array.from(usersMap.values());
  } catch (e) {
    console.warn('[getAllRegisteredUsers Error]:', e.message);
    return [{ telegram_id: ADMIN_CHAT_ID, full_name: 'د. عبدالله', role: 'admin', is_active: true }];
  }
}

export async function recordPaymentReceipt(userId, { photoId, amount = 300, paymentMethod = 'فودافون كاش' }) {
  if (!userId) return null;
  const numId = Number(userId);
  const now = new Date();
  const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const paymentRecord = {
    id: paymentId,
    telegram_id: numId,
    amount: Number(amount),
    payment_method: paymentMethod,
    receipt_photo_id: photoId || null,
    status: 'pending',
    created_at: now.toISOString()
  };

  try {
    // Store in bot_sessions under user session
    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    const sessData = existing?.data || {};
    if (!sessData.payments) sessData.payments = [];
    sessData.payments.push(paymentRecord);
    sessData.last_pending_payment = paymentRecord;

    await supabase.from('bot_sessions').upsert({
      chat_id: numId,
      data: sessData,
      updated_at: now.toISOString()
    });

    // Also store in pending payments queue on chat_id: 777777 (Admin Queue)
    const { data: adminQ } = await supabase.from('bot_sessions').select('*').eq('chat_id', 777777).maybeSingle();
    const qData = adminQ?.data || { pending: [] };
    qData.pending.push(paymentRecord);

    await supabase.from('bot_sessions').upsert({
      chat_id: 777777,
      state: 'admin_payment_queue',
      data: qData,
      updated_at: now.toISOString()
    });

    return paymentRecord;
  } catch (e) {
    console.error('[recordPaymentReceipt Error]:', e.message);
    return paymentRecord;
  }
}

// Helper: User Session Storage in Supabase
export async function setUserSession(userId, sessionData) {
  try {
    if (!userId) return;
    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', Number(userId)).maybeSingle();
    const merged = { ...(existing?.data || {}), ...sessionData };
    await supabase.from('bot_sessions').upsert({
      chat_id: Number(userId),
      state: existing?.state || 'user_session',
      data: merged,
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

// Helper: Update Liquidity Balances (Cash Flow) - Strictly Scoped to User ID
export async function updateLiquidity(paymentMethod, amountChange, userId = 1191760477) {
  try {
    if (!paymentMethod || amountChange === 0) return;
    const targetChatId = Number(userId || 1191760477);
    
    const { data: row } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', targetChatId)
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
      .upsert({
        chat_id: targetChatId,
        state: row?.state || 'idle',
        data: finData,
        updated_at: new Date().toISOString()
      });

    return liquidity[finalKey];
  } catch (e) {
    console.warn('updateLiquidity failed:', e.message);
  }
}
