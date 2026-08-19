// 🚀 Telegram Web App Dashboard Data API for Abdullah's Journey & Medical OS
import { supabase, getUserProfile, ADMIN_CHAT_ID } from '../lib/supabase.js';

function getCairoToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const telegramId = req.query.telegram_id || req.query.user_id || '1191760477';
  const numId = Number(telegramId);
  const today = getCairoToday();

  try {
    // 1. Fetch User Profile
    const profile = await getUserProfile(numId);
    const userName = profile?.full_name || (numId === ADMIN_CHAT_ID ? 'د. عبدالله (المؤسس)' : 'دكتور زميل');

    // 2. Fetch Today's Study Sessions
    const { data: studyRows } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('date', today);

    // Filter user sessions
    const userStudy = (studyRows || []).filter(s => {
      if (!s.telegram_id || s.telegram_id == numId) return true;
      return false;
    });

    let totalStudyMins = 0;
    const moduleBreakdown = {
      'CAD402': 0,
      'PED401': 0,
      'RSD403': 0,
      'HVD404': 0,
      'SKL 7': 0,
      'أخرى': 0
    };

    userStudy.forEach(s => {
      const mins = Number(s.duration_minutes || 0);
      totalStudyMins += mins;
      const code = s.course_code || 'أخرى';
      if (moduleBreakdown[code] !== undefined) {
        moduleBreakdown[code] += mins;
      } else {
        moduleBreakdown['أخرى'] += mins;
      }
    });

    // 3. Fetch Tasks
    const { data: taskRows } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: false });

    const userTasks = (taskRows || []).filter(t => !t.telegram_id || t.telegram_id == numId);

    // 4. Fetch Finance
    const { data: finRows } = await supabase
      .from('personal_finance')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: false });

    const userFinance = (finRows || []).filter(f => !f.telegram_id || f.telegram_id == numId);
    let todayIncome = 0;
    let todayExpense = 0;
    userFinance.forEach(f => {
      if (f.type === 'إيراد') todayIncome += Number(f.amount || 0);
      else todayExpense += Number(f.amount || 0);
    });

    // 5. Fetch Quran & Worship
    const { data: quranRows } = await supabase
      .from('quran_logs')
      .select('*')
      .eq('date', today);
    const userQuran = (quranRows || []).filter(q => !q.telegram_id || q.telegram_id == numId);

    const { data: fwRow } = await supabase
      .from('fasting_and_worship_logs')
      .select('*')
      .eq('date', today)
      .maybeSingle();

    // 6. Fetch Appointments
    const { data: apptRows } = await supabase
      .from('appointments_and_reminders')
      .select('*')
      .eq('date', today)
      .order('due_datetime', { ascending: true });

    const userAppts = (apptRows || []).filter(a => {
      if (a.notes?.includes(`usr:${numId}`) || a.telegram_id == numId) return true;
      if (!a.notes?.includes('usr:') && numId === ADMIN_CHAT_ID) return true;
      return false;
    });

    return res.status(200).json({
      ok: true,
      user: {
        telegram_id: numId,
        full_name: userName,
        role: profile?.role || 'student',
        subscription_status: profile?.subscription_status || 'trial',
        days_remaining: profile?.days_remaining || 3,
        is_active: profile?.is_active ?? true
      },
      today,
      study: {
        total_minutes: totalStudyMins,
        target_minutes: 180,
        progress_percentage: Math.min(100, Math.round((totalStudyMins / 180) * 100)),
        module_breakdown: moduleBreakdown,
        sessions: userStudy
      },
      tasks: userTasks,
      finance: {
        income: todayIncome,
        expense: todayExpense,
        net: todayIncome - todayExpense,
        items: userFinance
      },
      worship: {
        quran: userQuran,
        sunan_count: fwRow?.sunan_rawatib_count || 0,
        adhkar_morning: fwRow?.adhkar_morning || false,
        adhkar_evening: fwRow?.adhkar_evening || false,
        duha: fwRow?.duha_prayer_done || false,
        witr: fwRow?.witr_prayer_done || false
      },
      appointments: userAppts
    });

  } catch (err) {
    console.error('[Dashboard Data Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
