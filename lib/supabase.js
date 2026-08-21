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

export const DEFAULT_USER_PREFERENCES = {
  academic: true,    // 🩺 كويزات ومذاكرة الطب (Locked True)
  english: true,     // 🗣️ مدرب وفلاش كاردز الإنجليزية
  schedule: true,    // 📅 جدول السكاشن والغياب
  islamic: true,     // 🕌 القسم الروحي (القرآن، الصيام، الأذكار، الصلوات)
  wellness: true,    // 🧠 الفضفضة والاتزان النفسي
  finance: true,     // 💵 الخزنة والمصروفات الشخصية
  gym: false,        // 🏋️‍♂️ الجيم واللياقة البدنية
  content: false,    // 🎬 صناعة المحتوى والمونتاج
  work: false        // 💼 مشاريع البيزنس والشغل
};

export const PRESET_COURSES_BY_YEAR = {
  'الفرقة الأولى': {
    'الترم الأول': [
      { code: 'ANAT101', title: 'Anatomy 1 (تشريح عام)' },
      { code: 'PHYS101', title: 'Physiology 1 (علم وظائف الأعضاء)' },
      { code: 'HIST101', title: 'Histology 1 (علم الأنسجة)' },
      { code: 'BIOC101', title: 'Biochemistry 1 (كيمياء حيوية)' }
    ],
    'الترم الثاني': [
      { code: 'ANAT102', title: 'Anatomy 2 (تشريح أحشاء وأطراف)' },
      { code: 'PHYS102', title: 'Physiology 2 (فسيولوجي أجهزة)' },
      { code: 'HIST102', title: 'Histology 2 (هستولوجي خاص)' },
      { code: 'BIOC102', title: 'Biochemistry 2 (جينات وبيوكيمستري)' }
    ]
  },
  'الفرقة الثانية': {
    'الترم الأول': [
      { code: 'PATH201', title: 'General Pathology (علم الأمراض العام)' },
      { code: 'PHAR201', title: 'General Pharmacology (علم الأدوية العام)' },
      { code: 'MICR201', title: 'Microbiology & Immunology (ميكروبيولوجي ومناعة)' },
      { code: 'PARA201', title: 'Parasitology (طفيليات)' }
    ],
    'الترم الثاني': [
      { code: 'PATH202', title: 'Systemic Pathology (باثولوجي أجهزة)' },
      { code: 'PHAR202', title: 'Systemic Pharmacology (فارما أجهزة)' },
      { code: 'MICR202', title: 'Systemic Microbiology (ميكرو أجهزة)' },
      { code: 'COMM202', title: 'Community Medicine (طب المجتمع)' }
    ]
  },
  'الفرقة الثالثة': {
    'الترم الأول': [
      { code: 'SURG301', title: 'General Surgery 1 (مقدمة الجراحة العامة)' },
      { code: 'IMED301', title: 'Internal Medicine 1 (مقدمة الباطنة العامة)' },
      { code: 'FORE301', title: 'Forensic Medicine & Tox (طب شرعي وسموم)' },
      { code: 'OPHT301', title: 'Ophthalmology (طب وجراحة العيون)' }
    ],
    'الترم الثاني': [
      { code: 'SURG302', title: 'General Surgery 2 (جراحة سريرية)' },
      { code: 'IMED302', title: 'Internal Medicine 2 (باطنة سريرية)' },
      { code: 'ENT302', title: 'ENT (أنف وأذن وحنجرة)' },
      { code: 'PMR302', title: 'Physical Medicine & Rehab (تأهيل وعلاج طبيعي)' }
    ]
  },
  'الفرقة الرابعة': {
    'الترم الأول': [
      { code: 'PED401', title: 'Pediatrics 1 (طب الأطفال 1)' },
      { code: 'CAD402', title: 'Cardiac Disorders (أمراض القلب والأوعية)' },
      { code: 'RSD403', title: 'Respiratory Disorders (أمراض الجهاز التنفسي)' },
      { code: 'HVD404', title: 'Hematological Disorders (أمراض الدم والأوعية)' },
      { code: 'SKL 7', title: 'Clinical Skills 7 (المهارات الإكلينيكية)' }
    ],
    'الترم الثاني': [
      { code: 'PED402', title: 'Pediatrics 2 (طب الأطفال المتقدم)' },
      { code: 'GIT402', title: 'Gastroenterology & Hepatology (باطنة وجهاز هضمي)' },
      { code: 'NEPH403', title: 'Nephrology & Urology (كلى ومسالك)' },
      { code: 'ENDO404', title: 'Endocrine & Metabolic (غدد صماء وسكر)' },
      { code: 'SKL 8', title: 'Clinical Skills 8 (المهارات الإكلينيكية 8)' }
    ]
  },
  'الفرقة الخامسة': {
    'الترم الأول': [
      { code: 'MED501', title: 'Advanced Internal Medicine (باطنة متقدمة ورعاية)' },
      { code: 'SURG501', title: 'Advanced General Surgery (جراحة عامة وتخصصية)' },
      { code: 'OBGY501', title: 'Obstetrics & Gynecology 1 (نساء وتوليد 1)' },
      { code: 'PEDI501', title: 'Clinical Pediatrics (أطفال إكلينيكي)' }
    ],
    'الترم الثاني': [
      { code: 'OBGY502', title: 'Obstetrics & Gynecology 2 (نساء وتوليد متقدم)' },
      { code: 'ORTH502', title: 'Orthopedics & Traumatology (عظام وكسور)' },
      { code: 'NEUR502', title: 'Neurology & Neurosurgery (مخ وأعصاب)' },
      { code: 'EMER502', title: 'Emergency & Critical Care (طوارئ وعناية مركزة)' }
    ]
  },
  'الامتياز': {
    'الترم الأول': [
      { code: 'ROT_SURG', title: 'Surgery Rotation (راوند الجراحة العامة)' },
      { code: 'ROT_IMED', title: 'Internal Medicine Rotation (راوند الباطنة العامة)' },
      { code: 'ROT_PEDI', title: 'Pediatrics Rotation (راوند الأطفال)' },
      { code: 'ROT_OBGY', title: 'OB/GYN Rotation (راوند النساء والتوليد)' },
      { code: 'ROT_EMER', title: 'Emergency Rotation (راوند الطوارئ والحوادث)' }
    ]
  }
};

export async function getUserProfile(userId) {
  if (!userId) return null;
  const numId = Number(userId);

  // Fallback / stored preferences from bot_sessions if any
  let storedSession = null;
  try {
    const { data } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    storedSession = data?.data;
  } catch (_) {}

  // 1. Super Admin (Dr. Abdullah)
  if (numId === ADMIN_CHAT_ID) {
    const adminPrefs = storedSession?.profile?.preferences || {
      ...DEFAULT_USER_PREFERENCES,
      gym: true,
      content: true,
      work: true
    };

    return {
      telegram_id: ADMIN_CHAT_ID,
      full_name: 'د. عبدالله (المؤسس والمدير)',
      username: 'AbdallahPro',
      university: storedSession?.profile?.university || 'كلية الطب البشري',
      academic_year: storedSession?.profile?.academic_year || 'الفرقة الرابعة',
      semester: storedSession?.profile?.semester || 'الترم الأول',
      custom_courses: storedSession?.profile?.custom_courses || [],
      preferences: adminPrefs,
      role: 'admin',
      subscription_status: 'lifetime',
      is_active: true,
      is_admin: true,
      trial_ends_at: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
      subscription_ends_at: new Date(Date.now() + 3650 * 24 * 3600 * 1000).toISOString(),
      days_remaining: 3650
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

      const mergedPrefs = {
        ...DEFAULT_USER_PREFERENCES,
        ...(userRow.preferences || {}),
        ...(storedSession?.profile?.preferences || {})
      };

      return {
        ...userRow,
        academic_year: userRow.academic_year || storedSession?.profile?.academic_year || 'الفرقة الرابعة',
        semester: userRow.semester || storedSession?.profile?.semester || 'الترم الأول',
        custom_courses: userRow.custom_courses || storedSession?.profile?.custom_courses || [],
        preferences: mergedPrefs,
        subscription_status: status,
        is_active: isActive,
        is_admin: userRow.role === 'admin',
        is_trial: status === 'trial' && isActive,
        days_remaining: Math.max(0, Math.ceil(((status === 'active' ? subEnd : trialEnd) - now) / (24 * 3600 * 1000)))
      };
    }

    // Fallback: Check bot_sessions (state: user_profile)
    if (storedSession?.profile) {
      const p = storedSession.profile;
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

      const mergedPrefs = {
        ...DEFAULT_USER_PREFERENCES,
        ...(p.preferences || {})
      };

      return {
        telegram_id: numId,
        full_name: p.full_name || 'دكتور زميل',
        username: p.username || null,
        university: p.university || 'كلية الطب البشري',
        academic_year: p.academic_year || 'الفرقة الرابعة',
        semester: p.semester || 'الترم الأول',
        custom_courses: p.custom_courses || [],
        preferences: mergedPrefs,
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

// 🎛️ User Preferences Management (Modular Section Toggles)
export async function getUserPreferences(userId) {
  const prof = await getUserProfile(userId);
  return prof?.preferences || { ...DEFAULT_USER_PREFERENCES };
}

export async function updateUserPreferences(userId, newPrefs) {
  if (!userId) return null;
  const numId = Number(userId);
  const currentProf = await getUserProfile(userId);
  const updatedPrefs = {
    ...DEFAULT_USER_PREFERENCES,
    ...(currentProf?.preferences || {}),
    ...newPrefs
  };

  try {
    // 1. Update users table
    try {
      await supabase.from('users').update({
        preferences: updatedPrefs,
        updated_at: new Date().toISOString()
      }).eq('telegram_id', numId);
    } catch (_) {}

    // 2. Update bot_sessions
    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    const sessData = existing?.data || {};
    if (!sessData.profile) sessData.profile = { telegram_id: numId };
    sessData.profile.preferences = updatedPrefs;

    await supabase.from('bot_sessions').upsert({
      chat_id: numId,
      state: existing?.state || 'user_profile',
      data: sessData,
      updated_at: new Date().toISOString()
    });

    return updatedPrefs;
  } catch (e) {
    console.error('[updateUserPreferences Error]:', e.message);
    return updatedPrefs;
  }
}

// 🎓 Academic Year & Semester Profile Management
export async function updateUserAcademicProfile(userId, { academicYear, semester, university, customCourses }) {
  if (!userId) return null;
  const numId = Number(userId);
  const currentProf = await getUserProfile(userId);

  const updates = {
    academic_year: academicYear || currentProf?.academic_year || 'الفرقة الرابعة',
    semester: semester || currentProf?.semester || 'الترم الأول',
    university: university || currentProf?.university || 'كلية الطب البشري',
    custom_courses: customCourses !== undefined ? customCourses : (currentProf?.custom_courses || [])
  };

  try {
    // 1. Update users table
    try {
      await supabase.from('users').update({
        ...updates,
        updated_at: new Date().toISOString()
      }).eq('telegram_id', numId);
    } catch (_) {}

    // 2. Update bot_sessions
    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    const sessData = existing?.data || {};
    if (!sessData.profile) sessData.profile = { telegram_id: numId };
    sessData.profile = { ...sessData.profile, ...updates };

    await supabase.from('bot_sessions').upsert({
      chat_id: numId,
      state: existing?.state || 'user_profile',
      data: sessData,
      updated_at: new Date().toISOString()
    });

    return { ...currentProf, ...updates };
  } catch (e) {
    console.error('[updateUserAcademicProfile Error]:', e.message);
    return null;
  }
}

// Get active courses list for a student (presets for their year/semester + any custom courses)
export async function getUserActiveCourses(userId) {
  const prof = await getUserProfile(userId);
  const year = prof?.academic_year || 'الفرقة الرابعة';
  const sem = prof?.semester || 'الترم الأول';

  const presetList = PRESET_COURSES_BY_YEAR[year]?.[sem] || PRESET_COURSES_BY_YEAR['الفرقة الرابعة']['الترم الأول'];
  const customList = prof?.custom_courses || [];

  return [...presetList, ...customList];
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
    const oldLiq = finData.liquidity || {};
    
    const liquidity = {
      'نقدي (كاش)': Number(oldLiq['نقدي (كاش)'] ?? oldLiq['خزنة شخصية'] ?? oldLiq['نقدي'] ?? 0),
      'محفظة إلكترونية': Number(oldLiq['محفظة إلكترونية'] ?? oldLiq['فودافون كاش'] ?? 0),
      'إنستا باي': Number(oldLiq['إنستا باي'] ?? (Number(oldLiq['إنستا باي'] || 0) + Number(oldLiq['بنك مصر'] || 0)))
    };

    const cleanMethod = String(paymentMethod).trim();
    let finalKey = 'نقدي (كاش)';
    
    if (cleanMethod.includes('فودافون') || cleanMethod.includes('اتصالات') || cleanMethod.includes('اورانج') || cleanMethod.includes('أورانج') || cleanMethod.includes('وي') || cleanMethod.includes('محفظة') || cleanMethod.includes('إلكترونية') || cleanMethod.includes('الكترونية') || cleanMethod.includes('smart wallet') || cleanMethod.includes('e-wallet')) {
      finalKey = 'محفظة إلكترونية';
    } else if (cleanMethod.includes('إنستا') || cleanMethod.includes('انستا') || cleanMethod.includes('instapay') || cleanMethod.includes('بنك') || cleanMethod.includes('تحويل')) {
      finalKey = 'إنستا باي';
    } else {
      finalKey = 'نقدي (كاش)';
    }

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
