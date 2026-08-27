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

    // 1. Always include Super Admin Dr. Abdullah (8925138241)
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
        const prof = r.data?.profile;
        if (!prof) return;

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
