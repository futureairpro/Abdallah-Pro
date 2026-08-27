// 🚀 Telegram Web App Dashboard Data API for Abdullah's Journey & Medical OS
import { supabase, getUserProfile, getUserActiveCourses, getUserMedicalQuizzes, DEFAULT_USER_PREFERENCES, ADMIN_CHAT_ID } from '../lib/supabase.js';
import { getCairoPrayerTimes } from '../lib/prayer_times.js';
import { getRandomCuratedCapsule } from '../lib/mindset_pulses.js';

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
    // Run ALL database queries in parallel for ultra-fast response
    const [
      profile,
      activeCourses,
      studyRes,
      taskRes,
      finRes,
      quranRes,
      fwRes,
      apptRes,
      userMedQuizzes,
      engRes,
      gymRes,
      wellRes,
      thoughtRes
    ] = await Promise.all([
      getUserProfile(numId),
      getUserActiveCourses(numId),
      supabase.from('study_sessions').select('*').eq('date', today),
      supabase.from('daily_tasks').select('*').eq('date', today).order('created_at', { ascending: false }),
      supabase.from('personal_finance').select('*').eq('date', today).order('created_at', { ascending: false }),
      supabase.from('quran_logs').select('*').eq('date', today),
      supabase.from('fasting_and_worship_logs').select('*').eq('date', today).maybeSingle(),
      supabase.from('appointments_and_reminders').select('*').gte('due_datetime', today).order('due_datetime', { ascending: true }),
      getUserMedicalQuizzes(numId),
      supabase.from('english_spaced_flashcards').select('*').order('next_review_at', { ascending: true }).limit(20),
      supabase.from('fitness_gym_logs').select('*').order('date', { ascending: false }).limit(10),
      supabase.from('mental_wellness_logs').select('*').order('date', { ascending: false }).limit(10),
      supabase.from('thoughts_and_wisdom').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    const userName = profile?.full_name || (numId === ADMIN_CHAT_ID ? 'د. عبدالله (المؤسس)' : 'دكتور زميل');

    // 1. Process Study
    const studyRows = studyRes.data || [];
    const userStudy = studyRows.filter(s => {
      const hasTag = (s.topic?.includes(`usr:${numId}`) || s.notes?.includes(`usr:${numId}`));
      const hasAnyTag = (s.topic?.includes('usr:') || s.notes?.includes('usr:'));
      return numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
    }).map(s => ({
      ...s,
      topic: (s.topic || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
      notes: (s.notes || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim()
    }));

    let totalStudyMins = 0;
    let totalStudyPages = 0;
    const moduleBreakdown = {};
    (activeCourses || []).forEach(c => {
      moduleBreakdown[c.code] = 0;
    });
    moduleBreakdown['أخرى'] = 0;

    userStudy.forEach(s => {
      const mins = Number(s.duration_minutes || 0);
      totalStudyMins += mins;
      totalStudyPages += Number(s.pages_covered || 0);
      const code = s.course_code || 'أخرى';
      if (moduleBreakdown[code] !== undefined) {
        moduleBreakdown[code] += mins;
      } else {
        moduleBreakdown['أخرى'] = (moduleBreakdown['أخرى'] || 0) + mins;
      }
    });

    // 2. Process Tasks
    const taskRows = taskRes.data || [];
    const userTasks = taskRows.filter(t => {
      const hasTag = (t.category?.includes(`usr:${numId}`) || t.title?.includes(`usr:${numId}`));
      const hasAnyTag = (t.category?.includes('usr:') || t.title?.includes('usr:'));
      return numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
    }).map(t => ({
      ...t,
      title: (t.title || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
      category: (t.category || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim()
    }));

    // 3. Process Finance
    const finRows = finRes.data || [];
    const userFinance = finRows.filter(f => {
      const hasTag = (f.description?.includes(`usr:${numId}`) || f.category?.includes(`usr:${numId}`));
      const hasAnyTag = (f.description?.includes('usr:') || f.category?.includes('usr:'));
      return numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
    }).map(f => ({
      ...f,
      description: (f.description || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
      category: (f.category || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim()
    }));

    let todayIncome = 0;
    let todayExpense = 0;
    userFinance.forEach(f => {
      if (f.type === 'إيراد') todayIncome += Number(f.amount || 0);
      else todayExpense += Number(f.amount || 0);
    });

    // 4. Process Quran & Worship
    const quranRows = quranRes.data || [];
    const userQuran = quranRows.filter(q => {
      const hasTag = (q.session_type?.includes(`usr:${numId}`) || q.notes?.includes(`usr:${numId}`) || q.surah_name?.includes(`usr:${numId}`));
      const hasAnyTag = (q.session_type?.includes('usr:') || q.notes?.includes('usr:') || q.surah_name?.includes('usr:'));
      return numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
    }).map(q => ({
      ...q,
      session_type: (q.session_type || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
      notes: (q.notes || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim()
    }));
    const fwRow = fwRes.data;

    // 5. Process Appointments (12h format)
    const apptRows = apptRes.data || [];
    const userAppts = apptRows.filter(a => {
      const hasTag = (a.notes?.includes(`usr:${numId}`) || a.title?.includes(`usr:${numId}`));
      const hasAnyTag = (a.notes?.includes('usr:') || a.title?.includes('usr:'));
      const isTargetUser = numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
      if (!isTargetUser) return false;

      // Filter out auto reminders (prayers, adhkar, fasting, auto timers)
      const t = (a.title || '').toLowerCase();
      const n = (a.notes || '').toLowerCase();
      const comb = `${t} ${n}`;
      if (comb.includes('محسوبة تلقائياً') || comb.includes('مجدولة تلقائياً') || comb.includes('تلقائي') ||
          comb.includes('صلاة') || comb.includes('صلوات') || comb.includes('أذان') || comb.includes('أذكار') || comb.includes('اذكار') ||
          comb.includes('صيام') || comb.includes('سحور') || comb.includes('إفطار')) {
        return false;
      }
      return true;
    }).map(a => {
      const dt = new Date(a.due_datetime);
      const time12 = !isNaN(dt.getTime())
        ? dt.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true })
        : a.due_datetime;
      return {
        ...a,
        title: (a.title || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
        notes: (a.notes || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
        time12: time12
      };
    });

    // 6. Medical Quizzes & Flashcards
    const quizRows = (userMedQuizzes || []).map(q => ({
      course_code: q.course_code || 'MED',
      topic: q.clean_topic || q.topic || 'سؤال موديول',
      question: q.question,
      correct_answer: q.answer_and_explanation || q.correct_answer || 'موضحة بالمرجع',
      explanation: q.answer_and_explanation || q.explanation || '',
      doctor_pearl: q.doctor_pearl || null,
      repetition_level: q.repetition_level || 0
    }));
    const engRows = engRes.data || [];

    // 7. Gym Logs
    const gymRows = gymRes.data || [];
    const userGym = gymRows.filter(g => {
      const hasTag = (g.muscle_groups?.includes(`usr:${numId}`) || g.workout_type?.includes(`usr:${numId}`));
      const hasAnyTag = (g.muscle_groups?.includes('usr:') || g.workout_type?.includes('usr:'));
      return numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
    }).map(g => ({
      ...g,
      workout_type: (g.workout_type || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
      muscle_groups: (g.muscle_groups || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim()
    }));

    // 8. Wellness Logs
    const wellRows = wellRes.data || [];
    const userWellness = wellRows.filter(w => {
      const hasTag = (w.venting_content?.includes(`usr:${numId}`) || w.ai_therapeutic_feedback?.includes(`usr:${numId}`));
      const hasAnyTag = (w.venting_content?.includes('usr:') || w.ai_therapeutic_feedback?.includes('usr:'));
      return numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
    }).map(w => ({
      ...w,
      venting_content: (w.venting_content || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim(),
      ai_therapeutic_feedback: (w.ai_therapeutic_feedback || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim()
    }));

    // 9. Thoughts
    const thoughtRows = thoughtRes.data || [];
    const userThoughts = thoughtRows.filter(th => {
      const hasTag = (th.content?.includes(`usr:${numId}`) || th.category?.includes(`usr:${numId}`));
      const hasAnyTag = (th.content?.includes('usr:') || th.category?.includes('usr:'));
      return numId === ADMIN_CHAT_ID ? (hasTag || !hasAnyTag) : hasTag;
    }).map(th => ({
      ...th,
      content: (th.content || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim()
    }));

    // 10. Admin Data (Only for Dr. Abdullah)
    let adminData = null;
    if (numId === ADMIN_CHAT_ID) {
      const [registeredStudents, pendingPayRes] = await Promise.all([
        supabase.from('bot_sessions').select('*'),
        supabase.from('subscription_payments').select('*').eq('status', 'pending').order('created_at', { ascending: false })
      ]);

      const students = [];
      const nowMs = Date.now();
      (registeredStudents.data || []).forEach(r => {
        const cid = Number(r.chat_id);
        if (cid && cid !== 999999 && cid !== 888888 && cid !== 777777) {
          const p = r.data?.profile || {};
          const subEnd = p.subscription_ends_at ? new Date(p.subscription_ends_at).getTime() : 0;
          const trialEnd = p.trial_ends_at
            ? new Date(p.trial_ends_at).getTime()
            : (p.created_at ? new Date(p.created_at).getTime() + 3 * 24 * 3600 * 1000 : 0);

          let status = p.subscription_status || 'trial';
          let daysRem = 0;
          let isActive = false;

          if (cid === ADMIN_CHAT_ID || status === 'lifetime') {
            status = 'lifetime';
            daysRem = 'دائم 👑';
            isActive = true;
          } else if (status === 'active' && subEnd > nowMs) {
            daysRem = Math.max(1, Math.ceil((subEnd - nowMs) / (24 * 3600 * 1000)));
            isActive = true;
          } else if (status === 'trial' && trialEnd > nowMs) {
            daysRem = Math.max(1, Math.ceil((trialEnd - nowMs) / (24 * 3600 * 1000)));
            isActive = true;
          } else {
            status = 'expired';
            daysRem = 0;
            isActive = false;
          }

          students.push({
            telegram_id: Number(p.telegram_id || cid),
            full_name: p.full_name || (cid === ADMIN_CHAT_ID ? 'د. عبدالله' : 'طالب زميل'),
            username: p.username || null,
            university: p.university || 'كلية الطب البشري',
            role: p.role || (cid === ADMIN_CHAT_ID ? 'admin' : 'student'),
            subscription_status: status,
            days_remaining: daysRem,
            is_active: isActive
          });
        }
      });

      adminData = {
        total_students: students.length,
        students: students,
        pending_payments: pendingPayRes.data || []
      };
    }

    // 11. Fetch Prayers & Instant Mindset Pulse
    const prayers = getCairoPrayerTimes();
    const rawCapsule = getRandomCuratedCapsule();
    const mindsetPulse = {
      ...rawCapsule,
      text: (rawCapsule.text || '').replace(/يا عبدالله/g, `يا ${userName}`).replace(/د\. عبدالله/g, userName)
    };

    return res.status(200).json({
      ok: true,
      user: {
        telegram_id: numId,
        full_name: userName,
        role: profile?.role || (numId === ADMIN_CHAT_ID ? 'admin' : 'student'),
        subscription_status: profile?.subscription_status || (numId === ADMIN_CHAT_ID ? 'lifetime' : 'trial'),
        days_remaining: profile?.days_remaining || 3,
        is_active: profile?.is_active ?? true,
        academic_year: profile?.academic_year || 'الفرقة الرابعة',
        semester: profile?.semester || 'الترم الأول',
        preferences: profile?.preferences || DEFAULT_USER_PREFERENCES,
        active_courses: activeCourses || []
      },
      today,
      prayers: prayers.times12,
      mindset_pulse: mindsetPulse,
      study: {
        total_minutes: totalStudyMins,
        total_pages: totalStudyPages,
        target_minutes: 180,
        progress_percentage: Math.min(100, Math.round((totalStudyMins / 180) * 100)),
        module_breakdown: moduleBreakdown,
        sessions: userStudy
      },
      medical_quizzes: quizRows || [],
      english_flashcards: engRows || [],
      tasks: userTasks,
      appointments: userAppts,
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
      gym: userGym,
      wellness: userWellness,
      thoughts: userThoughts,
      admin: adminData
    });

  } catch (err) {
    console.error('[Dashboard Data Error]:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
