// 🗄️ Supabase Cloud Client for Abdullah's Journey OS
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getCairoPrayerTimes } from './prayer_times.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://iluvbcadeteawbyrlqmo.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdXZiY2FkZXRlYXdieXJscW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NzYzMjAsImV4cCI6MjEwMjU1MjMyMH0.sMZqoW6697HLOCNb5CJFO47ZQzjCBRw7KBIxLfvtI6g';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

export const ADMIN_CHAT_ID = 1191760477;

export function isAdminUser(id) {
  return Number(id) === 1191760477;
}

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

export function detectGenderFromName(name) {
  if (!name || typeof name !== 'string') return 'male';
  const clean = name.replace(/^د[\.\/]?\s*/, '').trim();
  const firstWord = clean.split(/\s+/)[0];

  const femaleNames = new Set([
    'سارة', 'ساره', 'مريم', 'فاطمة', 'فاطمه', 'خديجة', 'خديجه', 'عائشة', 'عائشه', 'هاجر', 'ريم', 'روان', 'سلمى', 'يارا', 'دينا', 'شروق', 'تسنيم', 'هايدي', 'مي', 'رنا', 'أماني', 'اماني', 'شمس', 'أسماء', 'اسماء', 'إسراء', 'اسراء', 'شيماء', 'دعاء', 'إيمان', 'ايمان', 'ياسمين', 'رحمة', 'رحمه', 'منة', 'منه', 'منى', 'جنى', 'جني', 'ملك', 'شهد', 'مروة', 'مروه', 'أروى', 'اروى', 'ريهام', 'نورهان', 'ندى', 'ندي', 'بسنت', 'بسملة', 'بسمله', 'حبيبة', 'حبيبه', 'رضوى', 'رضوي', 'آلاء', 'الاء', 'تقى', 'تقي', 'سجى', 'سجي', 'رزان', 'لمى', 'لمي', 'ليلى', 'ليلي', 'جودي', 'تالين', 'كرمة', 'كرمه', 'مليكة', 'مليكه', 'صبا', 'همس', 'وعد', 'نور', 'فريدة', 'فريده', 'نوران', 'دنيا', 'آية', 'ايه', 'آيات', 'ايات', 'حنان', 'هالة', 'هاله', 'رانيا', 'داليا', 'هبة', 'هبه', 'عبير', 'أميرة', 'اميرة', 'نهى', 'نهي', 'وفاء', 'سلوى', 'سلوي', 'سحر', 'أمل', 'امل', 'زينب', 'هدى', 'هدي', 'ميرنا', 'ساندي', 'مارينا', 'كريستين', 'كاترين', 'مونيكا', 'نانسي', 'ريناد', 'ريماس', 'سيلين', 'لين', 'لارا', 'جوليا', 'مايا', 'كارما', 'شروق', 'لبنى', 'لبني', 'وسام', 'إلهام', 'الهام', 'صفاء', 'نجلاء', 'وفاء', 'سناء', 'ولاء'
  ]);

  if (femaleNames.has(firstWord)) return 'female';
  if (firstWord.endsWith('ة') || firstWord.endsWith('اء') || firstWord.endsWith('ى')) {
    const maleExceptions = new Set(['علاء', 'براء', 'ضياء', 'بهاء', 'رجاء', 'يحيى', 'يحيي', 'موسى', 'موسي', 'عيسى', 'عيسي', 'مصطفى', 'مصطفي', 'حمزة', 'حمزه', 'أسامة', 'اسامه', 'قتادة', 'قتاده', 'حذيفة', 'حذيفه', 'طلحة', 'طلحه', 'عبيدة', 'عبيده', 'عنترة', 'عنتره', 'سلامة', 'سلامه', 'جمعة', 'جمعه', 'عرفة', 'عرفه', 'عكرمة', 'عكرمه', 'رضا', 'طاها', 'طه', 'مجتبى', 'مرتضى']);
    if (!maleExceptions.has(firstWord)) return 'female';
  }
  return 'male';
}

export function getGenderTerms(profileOrName) {
  const name = typeof profileOrName === 'string' ? profileOrName : profileOrName?.full_name;
  const gender = (typeof profileOrName === 'object' && profileOrName?.gender) || detectGenderFromName(name);
  const isFemale = gender === 'female';

  return {
    gender: isFemale ? 'female' : 'male',
    isFemale,
    docTitle: isFemale ? 'يا دكتورة' : 'يا دكتور',
    docTitleDirect: isFemale ? 'دكتورة' : 'دكتور',
    dontForget: isFemale ? 'متنسيش' : 'متنساش',
    remember: isFemale ? 'افتكرِي' : 'افتكر',
    prayVerb: isFemale ? 'صليتِي' : 'صليت',
    getUpAndPray: isFemale ? 'قومي توضي والحقي بركب المصلين' : 'قم توضأ والتحق بركب المصلين',
    youPronoun: isFemale ? 'أنتِ' : 'أنتَ',
    youCapable: isFemale ? 'أنتِ قدها' : 'أنتَ قدها',
    startVerb: isFemale ? 'ابدأي' : 'ابدأ',
    takeRest: isFemale ? 'افصلي وريحي' : 'افصل وريح',
    blessing: isFemale ? 'تقبل الله طاعتكِ' : 'تقبل الله طاعتك',
    welcome: isFemale ? 'أهلاً بكِ' : 'أهلاً بك',
    wakeUp: isFemale ? 'صحيتي' : 'صحيت',
    slept: isFemale ? 'نمتي' : 'نمت'
  };
}

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
      gender: 'male',
      username: 'AbdallahPro',
      university: storedSession?.profile?.university || 'كلية الطب البشري',
      academic_year: storedSession?.profile?.academic_year || 'الفرقة الرابعة',
      semester: storedSession?.profile?.semester || 'الترم الأول',
      custom_courses: storedSession?.profile?.custom_courses || [
        { code: 'FEM1', title: 'نساء 1' },
        { code: 'RES868', title: 'التنفسي' },
        { code: 'RSD403', title: 'أمراض الجهاز التنفسي' },
        { code: 'HVD404', title: 'أمراض الدم والأوعية' },
        { code: 'SKL7', title: 'المهارات الإكلينيكية' }
      ],
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

      const resolvedName = userRow.full_name || 'دكتور زميل';
      const resolvedGender = userRow.gender || detectGenderFromName(resolvedName);

      return {
        ...userRow,
        gender: resolvedGender,
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

    // Fallback: Check bot_sessions (state: user_profile or user_session)
    if (storedSession && storedSession.profile && (storedSession.profile.full_name || storedSession.profile.trial_ends_at || storedSession.profile.created_at)) {
      const p = storedSession.profile;
      const now = Date.now();
      const trialEnd = p.trial_ends_at
        ? new Date(p.trial_ends_at).getTime()
        : (p.created_at ? new Date(p.created_at).getTime() + 3 * 24 * 3600 * 1000 : 0);
      const subEnd = p.subscription_ends_at ? new Date(p.subscription_ends_at).getTime() : 0;

      let isActive = false;
      let status = p.subscription_status || 'trial';

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
        ...(p.preferences || {})
      };

      const resolvedName = p.full_name || 'طالب زميل';
      const resolvedGender = p.gender || detectGenderFromName(resolvedName);
      const targetEnd = (status === 'active' ? subEnd : trialEnd);
      const daysRemaining = status === 'lifetime' ? 3650 : Math.max(0, Math.ceil((targetEnd - now) / (24 * 3600 * 1000)));

      return {
        telegram_id: numId,
        full_name: resolvedName,
        gender: resolvedGender,
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
        trial_ends_at: p.trial_ends_at || (trialEnd ? new Date(trialEnd).toISOString() : null),
        subscription_ends_at: p.subscription_ends_at || null,
        days_remaining: daysRemaining
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
    sessData.profile = { ...sessData.profile, preferences: updatedPrefs };

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

// Get active courses list for a student (custom list if customized, otherwise presets for year/semester)
export async function getUserActiveCourses(userId) {
  const prof = await getUserProfile(userId);
  const year = prof?.academic_year || 'الفرقة الرابعة';
  const sem = prof?.semester || 'الترم الأول';

  if (Array.isArray(prof?.custom_courses) && prof.custom_courses.length > 0) {
    return prof.custom_courses;
  }

  const presetList = PRESET_COURSES_BY_YEAR[year]?.[sem] || PRESET_COURSES_BY_YEAR['الفرقة الرابعة']['الترم الأول'];
  return presetList;
}

export async function registerUserProfile(userId, { fullName, username, university = 'كلية الطب البشري' }) {
  if (!userId || !fullName) return null;
  const numId = Number(userId);
  const now = new Date();
  const gender = detectGenderFromName(fullName);
  const cleanFullName = fullName.trim();

  try {
    // 1. Fetch existing user and bot session to check if user already existed
    const { data: userRow } = await supabase.from('users').select('*').eq('telegram_id', numId).maybeSingle();
    const { data: existingSess } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    const sessData = existingSess?.data || {};
    const existingProf = userRow || sessData.profile;

    const isBrandNew = !existingProf || (!existingProf.created_at && !existingProf.trial_ends_at && !existingProf.subscription_status);

    let trialEndsAt;
    let subscriptionStatus;
    let subscriptionEndsAt;
    let createdAt;

    if (numId === ADMIN_CHAT_ID) {
      trialEndsAt = new Date(now.getTime() + 3650 * 24 * 3600 * 1000).toISOString();
      subscriptionStatus = 'lifetime';
      subscriptionEndsAt = new Date(now.getTime() + 3650 * 24 * 3600 * 1000).toISOString();
      createdAt = existingProf?.created_at || now.toISOString();
    } else if (isBrandNew) {
      // First-time registration -> grant initial 3 days trial
      const trialDays = 3;
      trialEndsAt = new Date(now.getTime() + trialDays * 24 * 3600 * 1000).toISOString();
      subscriptionStatus = 'trial';
      subscriptionEndsAt = null;
      createdAt = now.toISOString();
    } else {
      // Existing user -> PRESERVE existing subscription / trial status
      trialEndsAt = existingProf.trial_ends_at || (existingProf.created_at ? new Date(new Date(existingProf.created_at).getTime() + 3 * 24 * 3600 * 1000).toISOString() : now.toISOString());
      subscriptionStatus = existingProf.subscription_status || 'trial';
      subscriptionEndsAt = existingProf.subscription_ends_at || null;
      createdAt = existingProf.created_at || now.toISOString();
    }

    const profile = {
      telegram_id: numId,
      full_name: cleanFullName,
      gender: gender,
      username: username || existingProf?.username || null,
      university: existingProf?.university || university.trim(),
      academic_year: existingProf?.academic_year || 'الفرقة الرابعة',
      semester: existingProf?.semester || 'الترم الأول',
      custom_courses: existingProf?.custom_courses || [],
      preferences: existingProf?.preferences || DEFAULT_USER_PREFERENCES,
      role: numId === ADMIN_CHAT_ID ? 'admin' : (existingProf?.role || 'student'),
      subscription_status: subscriptionStatus,
      trial_ends_at: trialEndsAt,
      subscription_ends_at: subscriptionEndsAt,
      created_at: createdAt,
      updated_at: now.toISOString()
    };

    // 1. Try insert/upsert into users table
    try {
      await supabase.from('users').upsert(profile);
    } catch (_) {}

    // 2. Always persist into bot_sessions as primary/fallback storage
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
    return null;
  }
}

export async function activateUserSubscription(userId, days = 120, adminNotes = 'تفعيل اشتراك فصلي') {
  if (!userId) return false;
  const numId = Number(userId);
  const now = new Date();
  const subEndsAt = new Date(now.getTime() + Number(days) * 24 * 3600 * 1000).toISOString();

  try {
    // 1. Fetch current profile from both users table & bot_sessions first
    const { data: userRow } = await supabase.from('users').select('*').eq('telegram_id', numId).maybeSingle();
    const { data: existingSess } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();

    const sessData = existingSess?.data || {};
    const existingProf = sessData.profile || {};

    const preservedFullName = (userRow?.full_name && userRow.full_name !== 'دكتور زميل')
      ? userRow.full_name
      : (existingProf.full_name && existingProf.full_name !== 'دكتور زميل' ? existingProf.full_name : null);

    const preservedGender = userRow?.gender || existingProf.gender || (preservedFullName ? detectGenderFromName(preservedFullName) : 'male');
    const preservedYear = userRow?.academic_year || existingProf.academic_year || 'الفرقة الرابعة';
    const preservedSem = userRow?.semester || existingProf.semester || 'الترم الأول';
    const preservedUni = userRow?.university || existingProf.university || 'كلية الطب البشري';
    const preservedCourses = (userRow?.custom_courses && userRow.custom_courses.length > 0)
      ? userRow.custom_courses
      : (existingProf.custom_courses || []);
    const preservedPrefs = userRow?.preferences || existingProf.preferences || DEFAULT_USER_PREFERENCES;

    // 2. Update users table without wiping any user data
    try {
      await supabase.from('users').upsert({
        telegram_id: numId,
        full_name: preservedFullName || 'دكتور زميل',
        gender: preservedGender,
        academic_year: preservedYear,
        semester: preservedSem,
        university: preservedUni,
        custom_courses: preservedCourses,
        preferences: preservedPrefs,
        subscription_status: 'active',
        subscription_ends_at: subEndsAt,
        updated_at: now.toISOString()
      });
    } catch (_) {}

    // 3. Update bot_sessions profile preserving all fields
    sessData.profile = {
      ...(existingProf || {}),
      telegram_id: numId,
      full_name: preservedFullName || existingProf.full_name || 'دكتور زميل',
      gender: preservedGender,
      academic_year: preservedYear,
      semester: preservedSem,
      university: preservedUni,
      custom_courses: preservedCourses,
      preferences: preservedPrefs,
      subscription_status: 'active',
      subscription_ends_at: subEndsAt,
      admin_notes: adminNotes
    };

    await supabase.from('bot_sessions').upsert({
      chat_id: numId,
      state: existingSess?.state || 'user_profile',
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

    // 1. Always include Super Admin Dr. Abdullah (1191760477)
    usersMap.set(ADMIN_CHAT_ID, {
      telegram_id: ADMIN_CHAT_ID,
      full_name: 'د. عبدالله (المؤسس والمدير)',
      role: 'admin',
      is_active: true,
      subscription_status: 'lifetime',
      days_remaining: 3650
    });

    const now = Date.now();

    // 2. Add all registered users/students from bot_sessions
    (rows || []).forEach(r => {
      const cid = Number(r.chat_id);
      if (cid && cid !== 999999 && cid !== 888888 && cid !== 777777 && !isAdminUser(cid) && cid > 1000) {
        const prof = r.data?.profile || {};

        const trialEnd = prof.trial_ends_at
          ? new Date(prof.trial_ends_at).getTime()
          : (prof.created_at ? new Date(prof.created_at).getTime() + 3 * 24 * 3600 * 1000 : 0);
        const subEnd = prof.subscription_ends_at ? new Date(prof.subscription_ends_at).getTime() : 0;

        let status = prof.subscription_status || 'trial';
        let isActive = false;
        let daysRem = 0;

        if (status === 'lifetime') {
          isActive = true;
          daysRem = 3650;
        } else if (status === 'active' && subEnd > now) {
          isActive = true;
          daysRem = Math.max(1, Math.ceil((subEnd - now) / 86400000));
        } else if (status === 'trial' && trialEnd > now) {
          isActive = true;
          daysRem = Math.max(1, Math.ceil((trialEnd - now) / 86400000));
        } else {
          status = 'expired';
          isActive = false;
          daysRem = 0;
        }

        usersMap.set(cid, {
          telegram_id: cid,
          full_name: prof.full_name || 'طالب زميل',
          username: prof.username || null,
          role: prof.role || 'student',
          is_active: isActive,
          subscription_status: status,
          days_remaining: daysRem
        });
      }
    });

    return Array.from(usersMap.values());
  } catch (e) {
    console.warn('[getAllRegisteredUsers Error]:', e.message);
    return [{ telegram_id: ADMIN_CHAT_ID, full_name: 'د. عبدالله', role: 'admin', is_active: true, subscription_status: 'lifetime' }];
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
export async function updateLiquidity(paymentMethod, amountChange, userId = ADMIN_CHAT_ID) {
  try {
    if (!paymentMethod || amountChange === 0) return;
    const targetChatId = Number(userId || ADMIN_CHAT_ID);
    
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

// 🩺 User Medical Spaced Quizzes Management (Only from user's uploaded materials)
export async function getUserMedicalQuizzes(userId) {
  if (!userId) return [];
  const numId = Number(userId);

  // 1. Try Supabase medical_spaced_quizzes with [UID:userId] filter
  try {
    const { data: dbQuizzes } = await supabase
      .from('medical_spaced_quizzes')
      .select('*')
      .ilike('topic', `[UID:${numId}]%`)
      .order('created_at', { ascending: false });

    if (Array.isArray(dbQuizzes) && dbQuizzes.length > 0) {
      return dbQuizzes.map(q => ({
        ...q,
        clean_topic: (q.topic || '').replace(`[UID:${numId}]`, '').trim()
      }));
    }
  } catch (_) {}

  // 2. Fallback to bot_sessions uploaded_quizzes
  try {
    const sess = await getUserSession(numId);
    const sessionQuizzes = sess?.uploaded_quizzes || sess?.medical_quizzes || [];
    if (Array.isArray(sessionQuizzes) && sessionQuizzes.length > 0) {
      return sessionQuizzes;
    }
  } catch (_) {}

  return [];
}

export async function saveUserMedicalQuiz(userId, { courseCode, topic, question, answerAndExplanation, doctorPearl, options, correctOptionIndex }) {
  if (!userId || !question) return null;
  const numId = Number(userId);
  const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
  const taggedTopic = `[UID:${numId}] ${topic || courseCode || 'سؤال موديول'}`;

  let savedRow = null;
  try {
    const { data } = await supabase.from('medical_spaced_quizzes').insert({
      course_code: courseCode || 'MED',
      topic: taggedTopic,
      question: question,
      answer_and_explanation: answerAndExplanation || 'الشرح المستخرج من الصورة',
      doctor_pearl: doctorPearl || null,
      repetition_level: 0,
      next_review_at: nextReview
    }).select().maybeSingle();

    if (data) savedRow = data;
  } catch (_) {}

  // Also sync to bot_sessions for instant fallback and rich metadata
  try {
    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', numId).maybeSingle();
    const sessData = existing?.data || {};
    if (!sessData.uploaded_quizzes) sessData.uploaded_quizzes = [];

    const newQuizEntry = {
      id: savedRow?.id || `q_${Date.now()}`,
      course_code: courseCode || 'MED',
      topic: topic || courseCode || 'سؤال موديول',
      question,
      answer_and_explanation: answerAndExplanation || '',
      doctor_pearl: doctorPearl || null,
      options: options || null,
      correct_option_index: correctOptionIndex !== undefined ? correctOptionIndex : null,
      created_at: new Date().toISOString(),
      repetition_level: 0,
      next_review_at: nextReview
    };

    sessData.uploaded_quizzes.unshift(newQuizEntry);
    sessData.uploaded_quizzes = sessData.uploaded_quizzes.slice(0, 100);

    await supabase.from('bot_sessions').upsert({
      chat_id: numId,
      state: existing?.state || 'idle',
      data: sessData,
      updated_at: new Date().toISOString()
    });

    return newQuizEntry;
  } catch (err) {
    console.error('Error saving user quiz to session:', err);
    return savedRow;
  }
}

// 🧭 Holistic Student Diagnostic Snapshot for "اعمل ايه دلوقتي ؟" (What To Do Now Engine)
export async function getStudentHolisticSnapshot(userId) {
  if (!userId) return null;
  const numId = Number(userId);
  const profile = await getUserProfile(numId);
  const activeCourses = await getUserActiveCourses(numId);
  const prefs = profile?.preferences || DEFAULT_USER_PREFERENCES;

  const now = new Date();
  const cairoToday = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const cairoHour = Number(now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', hour12: false }));
  const cairoTime12 = now.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true });

  let cairoPeriod = 'الصباح';
  if (cairoHour >= 5 && cairoHour < 12) cairoPeriod = 'الصباح';
  else if (cairoHour >= 12 && cairoHour < 17) cairoPeriod = 'الظهيرة والعصر';
  else if (cairoHour >= 17 && cairoHour < 22) cairoPeriod = 'المساء';
  else cairoPeriod = 'فترة الليل المتأخر';

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const prayers = getCairoPrayerTimes(now);
  const nextPrayer = prayers?.nextPrayer ? `${prayers.nextPrayer.name} (⏰ ${prayers.nextPrayer.time12})` : '';

  // Parallel fetch of all student history
  const [
    studyRes,
    tasksRes,
    apptsRes,
    quizzesRes,
    quranRes,
    gymRes,
    finRes
  ] = await Promise.all([
    supabase.from('study_sessions').select('*').gte('date', sevenDaysAgo),
    supabase.from('daily_tasks').select('*').eq('date', cairoToday),
    supabase.from('appointments_and_reminders').select('*').gte('due_datetime', now.toISOString()).limit(5),
    getUserMedicalQuizzes(numId),
    prefs.islamic !== false ? supabase.from('quran_logs').select('*').gte('date', sevenDaysAgo) : Promise.resolve({ data: [] }),
    prefs.gym === true ? supabase.from('fitness_gym_logs').select('*').gte('date', sevenDaysAgo) : Promise.resolve({ data: [] }),
    prefs.finance !== false ? supabase.from('personal_finance').select('*').gte('date', sevenDaysAgo) : Promise.resolve({ data: [] })
  ]);

  // 1. Process Study (last 7 days by module)
  const studyRows = (studyRes.data || []).filter(s => !s.topic?.includes('usr:') ? numId === ADMIN_CHAT_ID : s.topic.includes(`usr:${numId}`));
  const studyLast7Days = {};
  (activeCourses || []).forEach(c => {
    studyLast7Days[`[${c.code}] ${c.title}`] = 0;
  });

  let totalStudyMinsLast7Days = 0;
  let todayStudyMins = 0;

  studyRows.forEach(s => {
    const mins = Number(s.duration_minutes || 0);
    totalStudyMinsLast7Days += mins;
    if (s.date === cairoToday) todayStudyMins += mins;

    const matchedCourse = (activeCourses || []).find(c =>
      (s.course_code && s.course_code.toUpperCase() === c.code.toUpperCase()) ||
      (s.topic && s.topic.includes(c.code)) ||
      (s.topic && s.topic.includes(c.title))
    );

    const courseKey = matchedCourse ? `[${matchedCourse.code}] ${matchedCourse.title}` : (s.course_code ? `[${s.course_code}]` : 'أخرى');
    studyLast7Days[courseKey] = (studyLast7Days[courseKey] || 0) + mins;
  });

  // 2. Pending Tasks
  const taskRows = (tasksRes.data || []).filter(t => !t.title?.includes('usr:') ? numId === ADMIN_CHAT_ID : t.title.includes(`usr:${numId}`));
  const pendingTasks = taskRows.filter(t => t.status !== 'تم الإنجاز' && t.status !== 'مكتملة');

  // 3. Upcoming Appointments
  const apptRows = (apptsRes.data || []).filter(a => !a.title?.includes('usr:') ? numId === ADMIN_CHAT_ID : a.title.includes(`usr:${numId}`));

  // 4. Quran & Worship Status
  let quranStatus = null;
  if (prefs.islamic !== false) {
    const qRows = (quranRes.data || []).filter(q => !q.session_type?.includes('usr:') ? numId === ADMIN_CHAT_ID : q.session_type.includes(`usr:${numId}`));
    let pagesToday = 0;
    let pagesThisWeek = 0;
    qRows.forEach(q => {
      const p = Number(q.pages_count || 0);
      pagesThisWeek += p;
      if (q.date === cairoToday) pagesToday += p;
    });
    quranStatus = { pagesToday, pagesThisWeek, targetPages: 2 };
  }

  // 5. Gym Status
  let gymStatus = null;
  if (prefs.gym === true) {
    const gRows = (gymRes.data || []).filter(g => !g.muscle_groups?.includes('usr:') ? numId === ADMIN_CHAT_ID : g.muscle_groups.includes(`usr:${numId}`));
    const daysTrainedThisWeek = gRows.length;
    const lastMuscleTrained = gRows[0]?.muscle_groups || 'لا يوجد';
    gymStatus = { daysTrainedThisWeek, lastMuscleTrained, neglectedMuscles: daysTrainedThisWeek < 3 ? 'تحتاج استئناف جدول التمارين' : 'منتظم' };
  }

  // 6. Finance Status
  let financeStatus = null;
  if (prefs.finance !== false) {
    const fRows = (finRes.data || []).filter(f => !f.description?.includes('usr:') ? numId === ADMIN_CHAT_ID : f.description.includes(`usr:${numId}`));
    let todayExpense = 0;
    let weekExpense = 0;
    fRows.forEach(f => {
      if (f.type !== 'إيراد') {
        const amt = Number(f.amount || 0);
        weekExpense += amt;
        if (f.date === cairoToday) todayExpense += amt;
      }
    });
    financeStatus = { todayExpense, weekExpense };
  }

  return {
    studentName: profile?.full_name || 'دكتور',
    academicYear: profile?.academic_year || 'الفرقة الرابعة',
    semester: profile?.semester || 'الترم الأول',
    activeCourses: activeCourses || [],
    studyLast7Days,
    totalStudyMinsLast7Days,
    todayStudyMins,
    uploadedQuizzesCount: (quizzesRes || []).length,
    pendingTasks,
    upcomingAppointments: apptRows,
    quranStatus,
    gymStatus,
    financeStatus,
    cairoTime: cairoTime12,
    cairoPeriod,
    nextPrayer,
    preferences: prefs
  };
}

// ==============================================================================
// 🥗 1. Body Metrics & Nutrition Helpers
// ==============================================================================

export async function getUserBodyMetrics(telegramId) {
  const numId = Number(telegramId);
  try {
    const { data, error } = await supabase
      .from('user_body_metrics')
      .select('*')
      .eq('telegram_id', numId)
      .maybeSingle();

    if (!error && data) return data;
  } catch (e) {}

  // Fallback default
  return {
    telegram_id: numId,
    height_cm: 175,
    weight_kg: 75,
    body_fat_pct: 18,
    muscle_mass_kg: 35,
    bmr: 1750,
    tdee: 2350,
    fitness_goal: 'تنشيف وحرق دهون',
    target_calories: 2000,
    target_protein_g: 150,
    target_carbs_g: 180,
    target_fats_g: 55,
    target_water_l: 3.5
  };
}

export async function updateUserBodyMetrics(telegramId, metrics = {}) {
  const numId = Number(telegramId);
  const current = await getUserBodyMetrics(numId);
  const updated = {
    telegram_id: numId,
    height_cm: Number(metrics.height_cm || current.height_cm || 175),
    weight_kg: Number(metrics.weight_kg || current.weight_kg || 75),
    body_fat_pct: Number(metrics.body_fat_pct || current.body_fat_pct || 18),
    muscle_mass_kg: Number(metrics.muscle_mass_kg || current.muscle_mass_kg || 35),
    bmr: Number(metrics.bmr || current.bmr || 1750),
    tdee: Number(metrics.tdee || current.tdee || 2350),
    fitness_goal: metrics.fitness_goal || current.fitness_goal || 'تنشيف وحرق دهون',
    target_calories: Number(metrics.target_calories || current.target_calories || 2000),
    target_protein_g: Number(metrics.target_protein_g || current.target_protein_g || 150),
    target_carbs_g: Number(metrics.target_carbs_g || current.target_carbs_g || 180),
    target_fats_g: Number(metrics.target_fats_g || current.target_fats_g || 55),
    target_water_l: Number(metrics.target_water_l || current.target_water_l || 3.5),
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from('user_body_metrics').upsert(updated);
  } catch (e) {}

  return updated;
}

export async function logNutritionMeal(telegramId, meal) {
  const numId = Number(telegramId);
  const payload = {
    telegram_id: numId,
    meal_name: meal.meal_name || 'وجبة طعام',
    meal_type: meal.meal_type || 'وجبة رئيسية',
    calories: Number(meal.calories || 0),
    protein_g: Number(meal.protein_g || 0),
    carbs_g: Number(meal.carbs_g || 0),
    fats_g: Number(meal.fats_g || 0),
    notes: meal.notes || null,
    date: meal.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
  };

  try {
    const { data, error } = await supabase.from('nutrition_logs').insert(payload).select().single();
    if (!error && data) return data;
  } catch (e) {}

  return payload;
}

export async function getDailyNutrition(telegramId, targetDate) {
  const numId = Number(telegramId);
  const date = targetDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  try {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('telegram_id', numId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (!error && data) return data;
  } catch (e) {}
  return [];
}

// ==============================================================================
// 🛑 2. Distraction & Procrastination Helpers
// ==============================================================================

export async function logDistraction(telegramId, distraction) {
  const numId = Number(telegramId);
  const payload = {
    telegram_id: numId,
    distraction_source: distraction.distraction_source || 'سوشيال ميديا وريلز',
    duration_minutes: Number(distraction.duration_minutes || 30),
    trigger_reason: distraction.trigger_reason || null,
    discipline_rating: Number(distraction.discipline_rating || 3),
    date: distraction.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
  };

  try {
    const { data, error } = await supabase.from('distraction_logs').insert(payload).select().single();
    if (!error && data) return data;
  } catch (e) {}

  return payload;
}

export async function getDailyDistractions(telegramId, targetDate) {
  const numId = Number(telegramId);
  const date = targetDate || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  try {
    const { data, error } = await supabase
      .from('distraction_logs')
      .select('*')
      .eq('telegram_id', numId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (!error && data) return data;
  } catch (e) {}
  return [];
}

// ==============================================================================
// 🏆 3. Gamification, Doctor XP & Streaks Helpers
// ==============================================================================

export function calculateRankAndLevel(xp) {
  const points = Number(xp || 0);
  if (points >= 4000) return { level: 6, title: 'استشاري ورئيس قسم (Consultant & Chief)', nextXp: 6000, currentProgress: 100 };
  if (points >= 2000) return { level: 5, title: 'أخصائي معتمد (Certified Specialist)', nextXp: 4000, currentProgress: Math.round(((points - 2000) / 2000) * 100) };
  if (points >= 1000) return { level: 4, title: 'طبيب مقيم أول (Senior Resident)', nextXp: 2000, currentProgress: Math.round(((points - 1000) / 1000) * 100) };
  if (points >= 500) return { level: 3, title: 'طبيب امتياز متمرس (Junior Intern)', nextXp: 1000, currentProgress: Math.round(((points - 500) / 500) * 100) };
  if (points >= 200) return { level: 2, title: 'طالب طب إكلينيكي (Clinical Student)', nextXp: 500, currentProgress: Math.round(((points - 200) / 300) * 100) };
  return { level: 1, title: 'طالب طب مستجد (Freshman Medical Student)', nextXp: 200, currentProgress: Math.round((points / 200) * 100) };
}

export async function getUserGamification(telegramId) {
  const numId = Number(telegramId);
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('telegram_id', numId)
      .maybeSingle();

    if (!error && data) {
      const calc = calculateRankAndLevel(data.doctor_xp);
      return {
        ...data,
        level: calc.level,
        rank_title: calc.title,
        nextXp: calc.nextXp,
        currentProgress: calc.currentProgress
      };
    }
  } catch (e) {}

  return {
    telegram_id: numId,
    doctor_xp: 50,
    level: 1,
    rank_title: 'طالب طب مستجد (Freshman Medical Student)',
    unlocked_badges: ['welcome_badge'],
    current_streak: 1,
    best_streak: 1,
    nextXp: 200,
    currentProgress: 25,
    last_active_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
  };
}

export async function addDoctorXp(telegramId, xpGain = 20, badgeId = null) {
  const numId = Number(telegramId);
  const current = await getUserGamification(numId);
  const newXp = (Number(current.doctor_xp) || 0) + Number(xpGain);
  const calc = calculateRankAndLevel(newXp);
  
  const badges = Array.isArray(current.unlocked_badges) ? [...current.unlocked_badges] : [];
  if (badgeId && !badges.includes(badgeId)) badges.push(badgeId);

  const payload = {
    telegram_id: numId,
    doctor_xp: newXp,
    level: calc.level,
    rank_title: calc.title,
    unlocked_badges: badges,
    current_streak: current.current_streak || 1,
    best_streak: Math.max(current.best_streak || 1, current.current_streak || 1),
    last_active_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }),
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from('user_gamification').upsert(payload);
  } catch (e) {}

  return { ...payload, gained: xpGain, levelUp: calc.level > current.level };
}

export async function updateUserStreak(telegramId) {
  const numId = Number(telegramId);
  const current = await getUserGamification(numId);
  const cairoToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const lastActive = current.last_active_date;

  if (lastActive === cairoToday) {
    return current.current_streak || 1;
  }

  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  let newStreak = 1;
  if (lastActive === yesterday) {
    newStreak = (current.current_streak || 0) + 1;
  }

  const bestStreak = Math.max(current.best_streak || 1, newStreak);
  const badges = Array.isArray(current.unlocked_badges) ? [...current.unlocked_badges] : [];
  if (newStreak >= 7 && !badges.includes('fire_streak_7')) badges.push('fire_streak_7');
  if (newStreak >= 30 && !badges.includes('fire_streak_30')) badges.push('fire_streak_30');

  try {
    await supabase.from('user_gamification').upsert({
      telegram_id: numId,
      current_streak: newStreak,
      best_streak: bestStreak,
      unlocked_badges: badges,
      last_active_date: cairoToday,
      updated_at: new Date().toISOString()
    });
  } catch (e) {}

  return newStreak;
}

// ==============================================================================
// 📦 4. Wishlist & Supplies Helpers
// ==============================================================================

export async function getWishlistItems(telegramId, statusFilter = null) {
  const numId = Number(telegramId);
  try {
    let query = supabase.from('wishlist_items').select('*').eq('telegram_id', numId).order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data, error } = await query;
    if (!error && data) return data;
  } catch (e) {}
  return [];
}

export async function addWishlistItem(telegramId, item) {
  const numId = Number(telegramId);
  const payload = {
    telegram_id: numId,
    title: item.title,
    category: item.category || 'مستلزمات طبية',
    estimated_cost: Number(item.estimated_cost || 0),
    priority: item.priority || 'متوسطة',
    status: item.status || 'pending',
    notes: item.notes || null,
    date: item.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
  };

  try {
    const { data, error } = await supabase.from('wishlist_items').insert(payload).select().single();
    if (!error && data) return data;
  } catch (e) {}
  return payload;
}

export async function updateWishlistItemStatus(itemId, newStatus) {
  try {
    const { data, error } = await supabase.from('wishlist_items').update({ status: newStatus }).eq('id', itemId).select().single();
    if (!error && data) return data;
  } catch (e) {}
  return null;
}

// ==============================================================================
// 📚 5. Academic PDF Vault & Mastery Helpers
// ==============================================================================

export async function saveAcademicPdfMastery(pdfData) {
  const payload = {
    course_code: pdfData.course_code || 'MED',
    file_name: pdfData.file_name || 'ملف موديول',
    topic_title: pdfData.topic_title || 'موضوع أكاديمي',
    high_yield_summary: Array.isArray(pdfData.high_yield_summary) ? pdfData.high_yield_summary : [],
    mcqs_extracted: Array.isArray(pdfData.mcqs_extracted) ? pdfData.mcqs_extracted : [],
    english_terms: Array.isArray(pdfData.english_terms) ? pdfData.english_terms : [],
    osce_pearls: Array.isArray(pdfData.osce_pearls) ? pdfData.osce_pearls : [],
    file_size_mb: Number(pdfData.file_size_mb || 0)
  };

  try {
    const { data, error } = await supabase.from('academic_pdf_vault').insert(payload).select().single();
    if (!error && data) return data;
  } catch (e) {}
  return payload;
}

export async function getAcademicPdfVault(courseCode = null) {
  try {
    let query = supabase.from('academic_pdf_vault').select('*').order('created_at', { ascending: false });
    if (courseCode) query = query.eq('course_code', courseCode);
    const { data, error } = await query;
    if (!error && data) return data;
  } catch (e) {}
  return [];
}

// ==============================================================================
// 📝 6. Universal Flexible Free Logs
// ==============================================================================

export async function logFlexibleFreeActivity(telegramId, activity) {
  const numId = Number(telegramId);
  const payload = {
    telegram_id: numId,
    category: activity.category || 'أخرى',
    title: activity.title || 'نشاط مسجل',
    content: activity.content || '',
    metadata: activity.metadata || {},
    date: activity.date || new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })
  };

  try {
    const { data, error } = await supabase.from('flexible_free_logs').insert(payload).select().single();
    if (!error && data) return data;
  } catch (e) {}
  return payload;
}

export async function getFlexibleFreeLogs(telegramId, targetDate = null) {
  const numId = Number(telegramId);
  try {
    let query = supabase.from('flexible_free_logs').select('*').eq('telegram_id', numId).order('created_at', { ascending: false });
    if (targetDate) query = query.eq('date', targetDate);
    const { data, error } = await query;
    if (!error && data) return data;
  } catch (e) {}
  return [];
}

// ==============================================================================
// 📖 7. Scientific Quran Spaced Repetition (SRS) & Conflict-Free Auto Scheduling
// ==============================================================================

const QURAN_SRS_INTERVALS_HOURS = {
  1: 10,   // Stage 1: ~10 hours (same day evening or next morning)
  2: 24,   // Stage 2: 1 day (next day consolidation)
  3: 72,   // Stage 3: 3 days (short-term consolidation)
  4: 168,  // Stage 4: 7 days (weekly review)
  5: 360,  // Stage 5: 15 days (bi-weekly mastery)
  6: 720   // Stage 6: 30 days (long-term permanent retention)
};

const QURAN_STAGE_MASTERY_PCT = {
  1: 25,
  2: 45,
  3: 65,
  4: 80,
  5: 92,
  6: 100
};

const QURAN_STAGE_TITLES = {
  1: 'المرحلة 1: استرجاع أولي سريع (Early Active Recall)',
  2: 'المرحلة 2: تسميع غيبي أول (Initial Recitation)',
  3: 'المرحلة 3: تثبيت الذاكرة المتوسطة (Medium Consolidation)',
  4: 'المرحلة 4: مراجعة أسبوعية تباعدية (Weekly Review)',
  5: 'المرحلة 5: دمج في السرد التراكمي (Mastery Integration)',
  6: 'المرحلة 6: حفظ متقن راسخ كالفاتحة (Permanent Mastery 100%)'
};

export async function findOptimalConflictFreeSlot(telegramId, targetDateObj) {
  const numId = Number(telegramId);
  const targetDateStr = targetDateObj.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  
  // Fetch existing appointments on that date
  let existingAppts = [];
  try {
    const { data } = await supabase
      .from('appointments_and_reminders')
      .select('due_datetime')
      .gte('due_datetime', `${targetDateStr}T00:00:00`)
      .lte('due_datetime', `${targetDateStr}T23:59:59`);
    if (data) existingAppts = data;
  } catch (e) {}

  // Preferred candidate time windows (Cairo Time)
  const candidateSlots = [
    [5, 45, 'بعد صلاة الفجر'],      // 05:45 AM - Peak mental clarity
    [21, 30, 'فترة المساء والهدوء'], // 09:30 PM - Post Isha / Pre sleep
    [11, 30, 'قبل صلاة الظهر'],     // 11:30 AM
    [17, 15, 'بعد صلاة العصر']      // 05:15 PM
  ];

  for (const [h, m, label] of candidateSlots) {
    const slotDate = new Date(targetDateObj);
    slotDate.setHours(h, m, 0, 0);

    // Check if slot overlaps with any existing appointment (within 45 mins)
    const isConflicting = existingAppts.some(appt => {
      if (!appt.due_datetime) return false;
      const apptTime = new Date(appt.due_datetime).getTime();
      const diffMins = Math.abs(apptTime - slotDate.getTime()) / (60 * 1000);
      return diffMins < 45;
    });

    if (!isConflicting) {
      return {
        slotDate: slotDate.toISOString(),
        timeLabel: `${String(h > 12 ? h - 12 : h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'م' : 'ص'} (${label})`,
        dateStr: targetDateStr
      };
    }
  }

  // Default fallback slot: 05:45 AM
  const fallback = new Date(targetDateObj);
  fallback.setHours(5, 45, 0, 0);
  return {
    slotDate: fallback.toISOString(),
    timeLabel: '05:45 ص (بعد صلاة الفجر)',
    dateStr: targetDateStr
  };
}

export async function logQuranSrsSession(telegramId, sessionData) {
  const numId = Number(telegramId);
  const surahName = (sessionData.surah_name || 'سورة من القرآن').trim();
  const pagesCount = Number(sessionData.pages_count || 1);
  const learningMode = sessionData.learning_mode || 'auditory_listening';
  const fromPage = sessionData.from_page ? Number(sessionData.from_page) : null;
  const toPage = sessionData.to_page ? Number(sessionData.to_page) : null;
  const fromAyah = sessionData.from_ayah ? Number(sessionData.from_ayah) : null;
  const toAyah = sessionData.to_ayah ? Number(sessionData.to_ayah) : null;

  // Check if existing mastery record exists for this surah/section
  let existing = null;
  try {
    const { data } = await supabase
      .from('quran_spaced_mastery')
      .select('*')
      .eq('telegram_id', numId)
      .eq('surah_name', surahName)
      .maybeSingle();
    if (data) existing = data;
  } catch (e) {}

  let nextStage = 1;
  if (existing) {
    nextStage = Math.min(6, (existing.repetition_stage || 1) + 1);
  }

  const intervalHours = QURAN_SRS_INTERVALS_HOURS[nextStage] || 24;
  const targetReviewDate = new Date(Date.now() + intervalHours * 3600 * 1000);
  const optimalSlot = await findOptimalConflictFreeSlot(numId, targetReviewDate);

  const masteryPct = QURAN_STAGE_MASTERY_PCT[nextStage] || 25;
  const stageTitle = QURAN_STAGE_TITLES[nextStage] || 'مرحلة تثبيت';

  const payload = {
    telegram_id: numId,
    surah_name: surahName,
    pages_count: pagesCount,
    from_page: fromPage,
    to_page: toPage,
    from_ayah: fromAyah,
    to_ayah: toAyah,
    learning_mode: learningMode,
    repetition_stage: nextStage,
    mastery_pct: masteryPct,
    mastery_status: nextStage >= 6 ? 'متقن راسخ' : (nextStage >= 4 ? 'مراجعة متباعدة' : 'تثبيت أولي'),
    last_reviewed_at: new Date().toISOString(),
    next_review_at: optimalSlot.slotDate,
    notes: sessionData.notes || `[usr:${numId}]`
  };

  let savedMastery = payload;
  try {
    if (existing?.id) {
      const { data } = await supabase
        .from('quran_spaced_mastery')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (data) savedMastery = data;
    } else {
      const { data } = await supabase
        .from('quran_spaced_mastery')
        .insert(payload)
        .select()
        .single();
      if (data) savedMastery = data;
    }
  } catch (e) {
    console.warn('quran_spaced_mastery error:', e.message);
  }

  // Create linked reminder in appointments_and_reminders
  let apptRow = null;
  try {
    const modeLabel = learningMode === 'auditory_listening' ? '🎧 استماع وتسميع' : '📖 تسميع ومراجعة بصرية';
    const apptTitle = `🕌 تسميع ومراجعة قرآن: سورة ${surahName} (${pagesCount} صفحة)`;
    const apptNotes = `[usr:${numId}] [quran_srs:${savedMastery.id || ''}] مسار: ${modeLabel} | مرحلة التثبيت: ${nextStage}/6 | نسبة الإتقان: ${masteryPct}%`;

    const { data: newAppt } = await supabase
      .from('appointments_and_reminders')
      .insert({
        title: apptTitle,
        due_datetime: optimalSlot.slotDate,
        is_completed: false,
        is_notified: false,
        notes: apptNotes
      })
      .select()
      .single();
    
    if (newAppt?.id) {
      apptRow = newAppt;
      if (savedMastery.id) {
        await supabase.from('quran_spaced_mastery').update({ reminder_appt_id: newAppt.id }).eq('id', savedMastery.id);
      }
    }
  } catch (e) {
    console.warn('quran appt schedule error:', e.message);
  }

  return {
    mastery: savedMastery,
    appt: apptRow,
    stageNumber: nextStage,
    stageTitle: stageTitle,
    masteryPct: masteryPct,
    nextSlotStr: optimalSlot.timeLabel,
    nextDateStr: optimalSlot.dateStr
  };
}

export async function getQuranSrsMasteryQueue(telegramId) {
  const numId = Number(telegramId);
  try {
    const { data, error } = await supabase
      .from('quran_spaced_mastery')
      .select('*')
      .eq('telegram_id', numId)
      .order('next_review_at', { ascending: true });
    if (!error && data) return data;
  } catch (e) {}
  return [];
}

export async function advanceQuranSrsStage(masteryId, isSuccess = true) {
  try {
    const { data: row } = await supabase
      .from('quran_spaced_mastery')
      .select('*')
      .eq('id', masteryId)
      .maybeSingle();

    if (!row) return null;

    let nextStage = isSuccess ? Math.min(6, (row.repetition_stage || 1) + 1) : Math.max(1, (row.repetition_stage || 1) - 1);
    const intervalHours = QURAN_SRS_INTERVALS_HOURS[nextStage] || 24;
    const targetDate = new Date(Date.now() + intervalHours * 3600 * 1000);
    const optimalSlot = await findOptimalConflictFreeSlot(row.telegram_id, targetDate);

    const updatePayload = {
      repetition_stage: nextStage,
      mastery_pct: QURAN_STAGE_MASTERY_PCT[nextStage],
      mastery_status: nextStage >= 6 ? 'متقن راسخ' : (nextStage >= 4 ? 'مراجعة متباعدة' : 'تثبيت أولي'),
      last_reviewed_at: new Date().toISOString(),
      next_review_at: optimalSlot.slotDate
    };

    const { data: updated } = await supabase
      .from('quran_spaced_mastery')
      .update(updatePayload)
      .eq('id', masteryId)
      .select()
      .single();

    return updated;
  } catch (e) {
    console.warn('advanceQuranSrsStage error:', e.message);
    return null;
  }
}

// ==============================================================================
// 🩺 8. Academic Module Spaced Repetition & Native Quiz Engine
// ==============================================================================

export async function logAcademicStudySrs(telegramId, studyData) {
  const numId = Number(telegramId);
  const courseCode = (studyData.course_code || studyData.module_code || 'CAD402').trim();
  const topic = (studyData.topic || studyData.subject || 'مذاكرة طبية').trim();
  const fromPage = studyData.from_page ? Number(studyData.from_page) : null;
  const toPage = studyData.to_page ? Number(studyData.to_page) : null;
  const pagesCount = Number(studyData.pages_covered || studyData.pages_count || 1);

  // Check if matching PDF exists in academic_pdf_vault
  let matchingPdf = null;
  try {
    const { data: pdfs } = await supabase
      .from('academic_pdf_vault')
      .select('*')
      .ilike('course_code', courseCode)
      .limit(1);
    if (pdfs && pdfs.length > 0) matchingPdf = pdfs[0];
  } catch (e) {}

  // Check existing mastery record
  let existing = null;
  try {
    const { data } = await supabase
      .from('academic_spaced_mastery')
      .select('*')
      .eq('telegram_id', numId)
      .eq('course_code', courseCode)
      .eq('topic', topic)
      .maybeSingle();
    if (data) existing = data;
  } catch (e) {}

  let nextStage = 1;
  if (existing) {
    nextStage = Math.min(6, (existing.repetition_stage || 1) + 1);
  }

  const intervalHours = QURAN_SRS_INTERVALS_HOURS[nextStage] || 24;
  const targetReviewDate = new Date(Date.now() + intervalHours * 3600 * 1000);
  const optimalSlot = await findOptimalConflictFreeSlot(numId, targetReviewDate);

  const masteryPct = QURAN_STAGE_MASTERY_PCT[nextStage] || 25;
  const stageTitle = QURAN_STAGE_TITLES[nextStage] || 'مرحلة تثبيت';

  const payload = {
    telegram_id: numId,
    course_code: courseCode,
    topic: topic,
    from_page: fromPage,
    to_page: toPage,
    pages_count: pagesCount,
    repetition_stage: nextStage,
    mastery_pct: masteryPct,
    mastery_status: nextStage >= 6 ? 'متقن راسخ' : (nextStage >= 4 ? 'مراجعة متباعدة' : 'تثبيت أولي'),
    pdf_vault_id: matchingPdf?.id || null,
    last_reviewed_at: new Date().toISOString(),
    next_review_at: optimalSlot.slotDate,
    notes: studyData.notes || `[usr:${numId}]`
  };

  let savedMastery = payload;
  try {
    if (existing?.id) {
      const { data } = await supabase
        .from('academic_spaced_mastery')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (data) savedMastery = data;
    } else {
      const { data } = await supabase
        .from('academic_spaced_mastery')
        .insert(payload)
        .select()
        .single();
      if (data) savedMastery = data;
    }
  } catch (e) {
    console.warn('academic_spaced_mastery insert error:', e.message);
  }

  // Create linked reminder in appointments_and_reminders
  let apptRow = null;
  try {
    const pageLabel = fromPage && toPage ? `صـ ${fromPage}-${toPage}` : `${pagesCount} صفحة`;
    const apptTitle = `🩺 مراجعة وتثبيت طبي: [${courseCode}] ${topic} (${pageLabel})`;
    const apptNotes = `[usr:${numId}] [academic_srs:${savedMastery.id || ''}] [course:${courseCode}] مرحلة التثبيت: ${nextStage}/6 | إتقان: ${masteryPct}%`;

    const { data: newAppt } = await supabase
      .from('appointments_and_reminders')
      .insert({
        title: apptTitle,
        due_datetime: optimalSlot.slotDate,
        is_completed: false,
        is_notified: false,
        notes: apptNotes
      })
      .select()
      .single();

    if (newAppt?.id) {
      apptRow = newAppt;
      if (savedMastery.id) {
        await supabase.from('academic_spaced_mastery').update({ reminder_appt_id: newAppt.id }).eq('id', savedMastery.id);
      }
    }
  } catch (e) {}

  return {
    mastery: savedMastery,
    appt: apptRow,
    matchingPdf: matchingPdf,
    stageNumber: nextStage,
    stageTitle: stageTitle,
    masteryPct: masteryPct,
    nextSlotStr: optimalSlot.timeLabel,
    nextDateStr: optimalSlot.dateStr
  };
}

export async function saveNativeQuizPoll(telegramId, quizData) {
  const numId = Number(telegramId);
  const metaObj = {
    poll_id: quizData.telegram_poll_id || null,
    options: quizData.options || [],
    correct_index: Number(quizData.correct_option_index || 0),
    explanation: quizData.explanation || null,
    pdf_source_id: quizData.pdf_source_id || null,
    page_number: quizData.page_number ? String(quizData.page_number) : null
  };

  const payload = {
    course_code: quizData.course_code || 'MED',
    topic: `[UID:${numId}] ${quizData.topic || 'كويز تفاعلي'}`.trim(),
    question: quizData.question,
    answer_and_explanation: quizData.explanation || quizData.answer || 'إجابة وشرح',
    doctor_pearl: `<<<QUIZ_META_START>>>${JSON.stringify(metaObj)}<<<QUIZ_META_END>>> ${quizData.doctor_pearl || quizData.explanation || ''}`.trim(),
    repetition_level: 1,
    next_review_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
  };

  try {
    const { data, error } = await supabase.from('medical_spaced_quizzes').insert(payload).select().single();
    if (!error && data) return data;
  } catch (e) {
    console.warn('saveNativeQuizPoll error:', e.message);
  }
  return payload;
}

export async function processStudentPollAnswer(pollId, selectedOptionIndex, telegramId) {
  const numId = Number(telegramId);
  try {
    // Search by embedded poll_id in doctor_pearl
    const { data: quizzes, error } = await supabase
      .from('medical_spaced_quizzes')
      .select('*')
      .ilike('doctor_pearl', `%"poll_id":"${pollId}"%`)
      .limit(1);

    let quiz = quizzes && quizzes.length > 0 ? quizzes[0] : null;

    if (!quiz) {
      // Fallback: search most recent quiz for this user
      const { data: recents } = await supabase
        .from('medical_spaced_quizzes')
        .select('*')
        .ilike('topic', `[UID:${numId}]%`)
        .order('created_at', { ascending: false })
        .limit(1);
      if (recents && recents.length > 0) quiz = recents[0];
    }

    if (!quiz) return null;

    // Parse metadata from doctor_pearl
    let correctIdx = 0;
    let explanation = quiz.answer_and_explanation;
    if (quiz.doctor_pearl && quiz.doctor_pearl.includes('<<<QUIZ_META_START>>>')) {
      try {
        const jsonStr = quiz.doctor_pearl.split('<<<QUIZ_META_START>>>')[1].split('<<<QUIZ_META_END>>>')[0];
        const parsedMeta = JSON.parse(jsonStr);
        if (parsedMeta.correct_index !== undefined) correctIdx = Number(parsedMeta.correct_index);
        if (parsedMeta.explanation) explanation = parsedMeta.explanation;
      } catch (e) {}
    }

    const isCorrect = Number(selectedOptionIndex) === Number(correctIdx);
    let nextLevel = isCorrect ? Math.min(6, (quiz.repetition_level || 1) + 1) : 1;
    const intervals = { 1: 12, 2: 24, 3: 72, 4: 168, 5: 360, 6: 720 };
    const nextHours = intervals[nextLevel] || 24;
    const nextDate = new Date(Date.now() + nextHours * 3600 * 1000).toISOString();

    await supabase.from('medical_spaced_quizzes').update({
      repetition_level: nextLevel,
      next_review_at: nextDate,
      is_mastered: nextLevel >= 6,
      last_reviewed_at: new Date().toISOString()
    }).eq('id', quiz.id);

    if (isCorrect) {
      await addDoctorXp(numId, 30);
    }

    return {
      isCorrect,
      quiz: { ...quiz, explanation },
      nextLevel,
      nextDate
    };
  } catch (e) {
    console.warn('processStudentPollAnswer error:', e.message);
    return null;
  }
}

export async function getAcademicSrsQueue(telegramId) {
  const numId = Number(telegramId);
  try {
    const { data, error } = await supabase
      .from('academic_spaced_mastery')
      .select('*')
      .eq('telegram_id', numId)
      .order('next_review_at', { ascending: true });
    if (!error && data) return data;
  } catch (e) {}
  return [];
}

// ==============================================================================
// 🛡️ Admin Purity & Dopamine Recovery Protocol Engine (سوسو & بوبو)
// ==============================================================================

export async function getAdminPurityStats(adminId = ADMIN_CHAT_ID) {
  const numId = Number(adminId);
  if (numId !== ADMIN_CHAT_ID) return null;

  let row = null;
  try {
    const { data, error } = await supabase
      .from('admin_purity_recovery')
      .select('*')
      .eq('telegram_id', numId)
      .maybeSingle();
    if (!error && data) row = data;
  } catch (e) {}

  // Fallback to bot_sessions if table is not yet migrated on remote Supabase
  if (!row) {
    try {
      const { data: sessionRow } = await supabase
        .from('bot_sessions')
        .select('*')
        .eq('chat_id', 999119) // Dedicated purity tracker session ID
        .maybeSingle();
      if (sessionRow?.data) row = sessionRow.data;
    } catch (e) {}
  }

  const now = Date.now();
  const lastSoso = row?.last_soso_relapse_at ? new Date(row.last_soso_relapse_at).getTime() : now;
  const lastBobo = row?.last_bobo_relapse_at ? new Date(row.last_bobo_relapse_at).getTime() : now;

  const sosoStreakHours = Math.max(0, Math.floor((now - lastSoso) / (3600 * 1000)));
  const sosoStreakDays = Math.floor(sosoStreakHours / 24);

  const boboStreakHours = Math.max(0, Math.floor((now - lastBobo) / (3600 * 1000)));
  const boboStreakDays = Math.floor(boboStreakHours / 24);

  const longestSoso = Math.max(row?.longest_soso_streak_days || 0, sosoStreakDays);
  const longestBobo = Math.max(row?.longest_bobo_streak_days || 0, boboStreakDays);
  const urgesResisted = row?.urges_resisted_count || 0;
  const history = Array.isArray(row?.relapse_history) ? row.relapse_history : [];

  // Determine current neuro-milestone (out of 90 days)
  const combinedDays = Math.min(sosoStreakDays, boboStreakDays);
  let currentMilestone = { stage: 1, title: 'اليوم 1: كسر العطالة والسيطرة', targetDays: 1, progressPct: Math.min(100, Math.round((combinedDays / 1) * 100)) };
  if (combinedDays >= 90) {
    currentMilestone = { stage: 8, title: 'اليوم 90: التحرر والسيادة التامة 👑', targetDays: 90, progressPct: 100 };
  } else if (combinedDays >= 60) {
    currentMilestone = { stage: 7, title: 'اليوم 60: استقرار الفص الجبهي', targetDays: 90, progressPct: Math.round((combinedDays / 90) * 100) };
  } else if (combinedDays >= 30) {
    currentMilestone = { stage: 6, title: 'اليوم 30: استعادة حساسية الدوبامين D2', targetDays: 60, progressPct: Math.round((combinedDays / 60) * 100) };
  } else if (combinedDays >= 21) {
    currentMilestone = { stage: 5, title: 'اليوم 21: كسر الدائرة العصبية القديمة', targetDays: 30, progressPct: Math.round((combinedDays / 30) * 100) };
  } else if (combinedDays >= 14) {
    currentMilestone = { stage: 4, title: 'اليوم 14: انحسار ضباب الدماغ', targetDays: 21, progressPct: Math.round((combinedDays / 21) * 100) };
  } else if (combinedDays >= 7) {
    currentMilestone = { stage: 3, title: 'اليوم 7: قفزة التستوستيرون والتركيز', targetDays: 14, progressPct: Math.round((combinedDays / 14) * 100) };
  } else if (combinedDays >= 3) {
    currentMilestone = { stage: 2, title: 'اليوم 3: كسر جدار الاشتهاء الكيميائي 72h', targetDays: 7, progressPct: Math.round((combinedDays / 7) * 100) };
  }

  return {
    sosoStreakDays,
    sosoStreakHours,
    boboStreakDays,
    boboStreakHours,
    longestSoso,
    longestBobo,
    urgesResisted,
    lastSosoDate: row?.last_soso_relapse_at || new Date().toISOString(),
    lastBoboDate: row?.last_bobo_relapse_at || new Date().toISOString(),
    currentMilestone,
    relapseHistory: history.slice(-10)
  };
}

export async function logAdminPurityRelapse(adminId, relapseData = {}) {
  const numId = Number(adminId);
  if (numId !== ADMIN_CHAT_ID) return null;

  const type = relapseData.type || 'soso'; // 'soso' | 'bobo' | 'both'
  const trigger = relapseData.trigger || 'غير محدد';
  const notes = relapseData.notes || '';
  const nowIso = new Date().toISOString();

  const currentStats = await getAdminPurityStats(numId);
  const isSoso = type === 'soso' || type === 'both';
  const isBobo = type === 'bobo' || type === 'both';

  const newHistoryEntry = {
    type,
    trigger,
    notes,
    timestamp: nowIso,
    soso_streak_before: isSoso ? currentStats.sosoStreakDays : undefined,
    bobo_streak_before: isBobo ? currentStats.boboStreakDays : undefined
  };

  const updatedHistory = [...(currentStats.relapseHistory || []), newHistoryEntry];
  const payload = {
    telegram_id: numId,
    last_soso_relapse_at: isSoso ? nowIso : currentStats.lastSosoDate,
    last_bobo_relapse_at: isBobo ? nowIso : currentStats.lastBoboDate,
    longest_soso_streak_days: currentStats.longestSoso,
    longest_bobo_streak_days: currentStats.longestBobo,
    urges_resisted_count: currentStats.urgesResisted,
    relapse_history: updatedHistory,
    updated_at: nowIso
  };

  try {
    await supabase.from('admin_purity_recovery').upsert(payload);
  } catch (e) {}

  try {
    await supabase.from('bot_sessions').upsert({
      chat_id: 999119,
      state: 'admin_purity_vault',
      data: payload,
      updated_at: nowIso
    });
  } catch (e) {}

  return {
    type,
    trigger,
    sosoStreakBefore: currentStats.sosoStreakDays,
    boboStreakBefore: currentStats.boboStreakDays
  };
}

export async function logAdminUrgeResisted(adminId) {
  const numId = Number(adminId);
  if (numId !== ADMIN_CHAT_ID) return 0;

  const currentStats = await getAdminPurityStats(numId);
  const newCount = (currentStats.urgesResisted || 0) + 1;
  const nowIso = new Date().toISOString();

  const payload = {
    telegram_id: numId,
    last_soso_relapse_at: currentStats.lastSosoDate,
    last_bobo_relapse_at: currentStats.lastBoboDate,
    longest_soso_streak_days: currentStats.longestSoso,
    longest_bobo_streak_days: currentStats.longestBobo,
    urges_resisted_count: newCount,
    relapse_history: currentStats.relapseHistory || [],
    updated_at: nowIso
  };

  try {
    await supabase.from('admin_purity_recovery').upsert(payload);
  } catch (e) {}

  try {
    await supabase.from('bot_sessions').upsert({
      chat_id: 999119,
      state: 'admin_purity_vault',
      data: payload,
      updated_at: nowIso
    });
  } catch (e) {}

  await addDoctorXp(numId, 50);
  return newCount;
}




// ==============================================================================
// 🌿 30-Day Quran Healing Protocol Engine (الورد القرآني العلاجي لـ د. عبدالله)
// Surahs: سورة ق، سورة الرحمن، سورة الملك، سورة الزلزلة (30 Days)
// ==============================================================================

export async function getAdminHealingProtocol(telegramId = 1191760477) {
  try {
    const { data: sess } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', 999333)
      .maybeSingle();

    if (sess?.data) return sess.data;

    const initial = {
      start_date: '2026-09-02',
      target_days: 30,
      surahs: ['سورة ق', 'سورة الرحمن', 'سورة الملك', 'سورة الزلزلة'],
      completed_dates: [],
      current_day_number: 1,
      streak_days: 0,
      updated_at: new Date().toISOString()
    };

    await supabase.from('bot_sessions').upsert({
      chat_id: 999333,
      state: 'quran_healing_protocol',
      data: initial,
      updated_at: new Date().toISOString()
    });

    return initial;
  } catch (e) {
    return {
      start_date: '2026-09-02',
      target_days: 30,
      surahs: ['سورة ق', 'سورة الرحمن', 'سورة الملك', 'سورة الزلزلة'],
      completed_dates: [],
      current_day_number: 1,
      streak_days: 0
    };
  }
}

export async function logAdminHealingDay(telegramId = 1191760477, todayStr = getCairoToday()) {
  try {
    const proto = await getAdminHealingProtocol(telegramId);
    const completed = Array.isArray(proto.completed_dates) ? [...proto.completed_dates] : [];
    
    if (!completed.includes(todayStr)) {
      completed.push(todayStr);
    }

    // Calculate day number since start_date (2026-09-02)
    const startDate = new Date('2026-09-02T00:00:00+03:00');
    const todayDate = new Date();
    const diffTime = Math.abs(todayDate - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const currentDayNum = Math.min(30, Math.max(1, diffDays));

    const updated = {
      ...proto,
      completed_dates: completed,
      current_day_number: currentDayNum,
      streak_days: completed.length,
      updated_at: new Date().toISOString()
    };

    await supabase.from('bot_sessions').upsert({
      chat_id: 999333,
      state: 'quran_healing_protocol',
      data: updated,
      updated_at: new Date().toISOString()
    });

    // Also insert individual Quran logs for all 4 Surahs in quran_logs
    for (const s of ['ق', 'الرحمن', 'الملك', 'الزلزلة']) {
      try {
        await supabase.from('quran_logs').insert({
          telegram_id: telegramId,
          surah_name: s,
          pages_count: 3,
          learning_mode: 'recitation_review',
          notes: 'الورد القرآني العلاجي اليومي (30 يوماً)',
          date: todayStr,
          quality_rating: 5
        });
      } catch (err) {}
    }

    await addDoctorXp(telegramId, 50, 'quran_healing_pro');

    return {
      success: true,
      dayNumber: currentDayNum,
      totalCompleted: completed.length,
      targetDays: 30,
      isFinished: completed.length >= 30
    };
  } catch (e) {
    console.warn('logAdminHealingDay error:', e.message);
    return { success: false, dayNumber: 1, totalCompleted: 1, targetDays: 30 };
  }
}

export async function scheduleAdminSpacedQuiz(telegramId, { course_code = 'SHARIA', topic, question, options, correct_option_index = 0, explanation = '', delayHours = 2.5 }) {
  const numId = Number(telegramId);
  const nextDate = new Date(Date.now() + delayHours * 3600 * 1000).toISOString();

  const metaObj = {
    poll_id: null,
    options: options || [],
    correct_index: Number(correct_option_index || 0),
    explanation: explanation || null
  };

  const payload = {
    course_code: course_code,
    topic: `[UID:${numId}] ${topic || 'كويز تفاعلي'}`.trim(),
    question: question,
    answer_and_explanation: explanation || 'شرح الإجابة',
    doctor_pearl: `<<<QUIZ_META_START>>>${JSON.stringify(metaObj)}<<<QUIZ_META_END>>> ${explanation || ''}`.trim(),
    repetition_level: 0,
    next_review_at: nextDate
  };

  try {
    const { data, error } = await supabase.from('medical_spaced_quizzes').insert(payload).select().single();
    await addDoctorXp(numId, 20);
    return { success: true, data };
  } catch (e) {
    console.warn('scheduleAdminSpacedQuiz error:', e.message);
    await addDoctorXp(numId, 20);
    return { success: false };
  }
}
