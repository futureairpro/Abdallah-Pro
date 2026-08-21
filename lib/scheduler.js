// ⏰ Proactive Life Scheduler & Spaced Repetition Engine for Abdullah's Journey & Medical OS
import { supabase, getAllRegisteredUsers, getUserProfile, DEFAULT_USER_PREFERENCES, ADMIN_CHAT_ID } from './supabase.js';
import { getCairoPrayerTimes } from './prayer_times.js';
import { sendMindsetPulse } from './mindset_pulses.js';

function getCairoNow() {
  const now = new Date();
  const cairoDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const cairoTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour12: false });
  const [hours, minutes] = cairoTimeStr.split(':').map(Number);
  
  const dayFormatter = new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', weekday: 'long' });
  const dayName = dayFormatter.format(now).replace('الـ', '').trim();

  return {
    dateStr: cairoDateStr,
    timeStr: cairoTimeStr,
    hours,
    minutes,
    dayName
  };
}

// 🗄️ Database-Backed Persistent Notification Tracker (Supabase bot_sessions chat_id: 888888)
let memoryCache = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 15000; // 15 seconds local cache within execution cycle

async function getTrackerFromDb() {
  const now = Date.now();
  if (memoryCache && (now - lastCacheFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }
  try {
    const { data: row } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', 888888)
      .maybeSingle();

    memoryCache = row?.data || {};
    lastCacheFetchTime = now;
    return memoryCache;
  } catch (e) {
    console.warn('[NotificationTracker DB Fetch Warn]:', e.message);
    return memoryCache || {};
  }
}

export async function hasSent(key, ttlMs = 86400000) {
  try {
    const tracker = await getTrackerFromDb();
    if (!tracker) return false;
    
    // Check EXACT key only to ensure 100% independent tracking per user
    const sentTimestamp = tracker[key] ? Number(tracker[key]) : null;
    if (!sentTimestamp || isNaN(sentTimestamp)) return false;
    return (Date.now() - sentTimestamp) < ttlMs;
  } catch (e) {
    return false;
  }
}

export async function markSent(key, ttlMs = 86400000) {
  try {
    const tracker = await getTrackerFromDb();
    const now = Date.now();
    tracker[key] = now;

    memoryCache = tracker;
    lastCacheFetchTime = now;

    // Prune entries older than 7 days
    const pruneThreshold = now - (7 * 86400000);
    for (const k of Object.keys(tracker)) {
      if (Number(tracker[k]) < pruneThreshold) {
        delete tracker[k];
      }
    }

    await supabase.from('bot_sessions').upsert({
      chat_id: 888888,
      state: 'notification_tracker',
      data: tracker,
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    console.warn('[NotificationTracker DB Save Warn]:', e.message);
  }
}

export function startScheduler(bot, targetChatId = '1191760477') {
  if (!bot) return;

  console.log(`[Scheduler] 🚀 Multi-Tenant Spaced repetition & prayer scheduler active...`);

  setInterval(async () => {
    try {
      await runSchedulerCycle(bot, targetChatId);
    } catch (err) {
      console.error('[Scheduler Cycle Error]:', err.message);
    }
  }, 60000);

  runSchedulerCycle(bot, targetChatId).catch(() => {});
}

async function runSchedulerCycle(bot, fallbackChatId = '1191760477') {
  if (!bot) return;

  // 1. Gather all active subscribers
  const registered = await getAllRegisteredUsers();
  const activeSubscribers = [
    { telegram_id: ADMIN_CHAT_ID, full_name: 'د. عبدالله' },
    ...registered.filter(u => u.subscription_status === 'active' || u.subscription_status === 'trial' || u.subscription_status === 'lifetime')
  ];

  // Unique by telegram_id
  const seenIds = new Set();
  const uniqueUsers = activeSubscribers.filter(u => {
    const id = Number(u.telegram_id);
    if (!id || seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });

  for (const user of uniqueUsers) {
    try {
      await runUserCycle(bot, user);
    } catch (err) {
      console.error(`[Scheduler Cycle Error for User ${user.telegram_id}]:`, err.message);
    }
  }
}

async function runUserCycle(bot, user) {
  const chatId = user.telegram_id;
  const userProf = await getUserProfile(chatId);
  const prefs = userProf?.preferences || DEFAULT_USER_PREFERENCES;
  const userName = userProf?.full_name || user.full_name || 'يا دكتور';
  const { dateStr, hours, minutes, dayName } = getCairoNow();
  const currentTimeMinutes = hours * 60 + minutes;
  const prayerData = getCairoPrayerTimes();

  // ============================================================================
  // 1. 🧠 فلاش كاردز الإنجليزية بالتكرار المتباعد (Spaced Repetition)
  // ============================================================================
  if (prefs.english !== false) {
    try {
      const { data: dueCards } = await supabase
        .from('english_spaced_flashcards')
        .select('*')
        .lte('next_review_at', new Date().toISOString())
        .eq('is_mastered', false)
        .limit(1);

      if (dueCards && dueCards.length > 0) {
        const card = dueCards[0];
        const key = `eng_spaced_${card.id}_${dateStr}`;
        const alreadySent = await hasSent(key, 8 * 3600 * 1000);
        if (!alreadySent) {
          await markSent(key, 8 * 3600 * 1000);

          // Push next review forward by 4 hours to avoid re-triggering during frequent cron checks
          await supabase
            .from('english_spaced_flashcards')
            .update({
              next_review_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
              last_reviewed_at: new Date().toISOString()
            })
            .eq('id', card.id);

          let msg = `🧠 <b>فلاش كارد إنجليزي للمراجعة (Spaced Repetition):</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `🌟 <b>${card.term_or_sentence}</b>\n\n`;
          msg += `💡 <i>فكر في المعنى بالمصري ثم اضغط على الزر أدناه لإظهار الترجمة والمثال:</i>`;

          const keyboard = {
            inline_keyboard: [
              [{ text: '💡 أظهر الترجمة والمثال', callback_data: `reveal_eng_${card.id}` }]
            ]
          };

          await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[Scheduler English Spaced Warn]:', e.message);
    }
  }

  // ============================================================================
  // 2. 🩺 كويزات الموديولات الطبية بالتكرار المتباعد (Medical Spaced Quizzes)
  // ============================================================================
  if (prefs.academic !== false) {
    try {
      const { data: dueQuizzes } = await supabase
        .from('medical_spaced_quizzes')
        .select('*')
        .lte('next_review_at', new Date().toISOString())
        .eq('is_mastered', false)
        .limit(1);

      if (dueQuizzes && dueQuizzes.length > 0) {
        const quiz = dueQuizzes[0];
        const key = `med_spaced_${quiz.id}_${dateStr}`;
        const alreadySent = await hasSent(key, 8 * 3600 * 1000);
        if (!alreadySent) {
          await markSent(key, 8 * 3600 * 1000);

          // Push next review forward by 4 hours to prevent spamming
          await supabase
            .from('medical_spaced_quizzes')
            .update({
              next_review_at: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
              last_reviewed_at: new Date().toISOString()
            })
            .eq('id', quiz.id);

          let msg = `🩺 <b>سؤال سريري للمراجعة والتثبيت [${quiz.course_code}]:</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
          if (quiz.topic) msg += `📌 <b>الموضوع:</b> ${quiz.topic}\n\n`;
          msg += `❓ <b>السؤال:</b>\n<b>${quiz.question}</b>\n\n`;
          msg += `💡 <i>فكر في الإجابة والتشخيص ثم اضغط لإظهار الشرح وتريكة الراوند:</i>`;

          const keyboard = {
            inline_keyboard: [
              [{ text: '💡 أظهر الإجابة النموذجية وتريكة الراوند', callback_data: `reveal_med_${quiz.id}` }]
            ]
          };

          await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[Scheduler Medical Spaced Warn]:', e.message);
    }
  }

  // ============================================================================
  // 3. 🌙 القسم الإسلامي والعبادات (تذكيرات الصيام، السحور، الأذكار، الصلوات)
  //    يتم تفعيله فقط لمن اختار القسم الروحي (ويتم استثناؤه تلقائياً لغير الراغبين والطلبة المسيحيين)
  // ============================================================================
  if (prefs.islamic !== false) {
    // Fetch user's worship log for today to prevent sending already completed items
    const { data: userWorship } = await supabase
      .from('fasting_and_worship_logs')
      .select('*')
      .eq('date', dateStr)
      .maybeSingle();

    if ((dayName.includes('أحد') || dayName.includes('أربعاء')) && (hours === 22 || (hours === 21 && minutes >= 45))) {
      const nextDay = dayName.includes('أحد') ? 'الإثنين' : 'الخميس';
      const key = `fasting_night_${dateStr}_${nextDay}_${chatId}`;
      if (!userWorship?.fasting_type && !(await hasSent(key, 48 * 3600 * 1000))) {
        await markSent(key, 48 * 3600 * 1000);
        const msg = `🌙 <b>تذكير صيام سنة يوم ${nextDay} يا ${userName}:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ <i>"تُعرض الأعمال يوم الإثنين والخميس، فأحب أن يُعرض عملي وأنا صائم"</i>.\n` +
          `📌 انوِ الصيام وجهز وجبة سحور خفيفة ومباركة! 🤍`;

        const keyboard = {
          inline_keyboard: [[{ text: '✅ نويت الصيام إن شاء الله', callback_data: `ack_fasting_intent_${dateStr}_${nextDay}` }]]
        };
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }

    // وقت السحور قبل الفجر بساعة (حسب الفجر الحي بالقاهرة)
    const fajrMinutes = prayerData.minutes.fajr;
    const suhurStart = fajrMinutes - 75;
    const suhurEnd = fajrMinutes - 15;
    if (currentTimeMinutes >= suhurStart && currentTimeMinutes <= suhurEnd && (dayName.includes('إثنين') || dayName.includes('خميس'))) {
      const key = `suhur_fajr_${dateStr}_${chatId}`;
      if (!userWorship?.fasting_completed && !(await hasSent(key, 24 * 3600 * 1000))) {
        await markSent(key, 24 * 3600 * 1000);
        const msg = `🥣 <b>وقت السحور المبارك يا ${userName}:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ <i>"تسحروا فإن في السحور بركة"</i>.\n` +
          `⏳ متبقي ساعة على أذان الفجر (${prayerData.times.fajr}). اشرب ماء كافياً وصلّ ركعتين في جوف الليل! 🤍`;

        const keyboard = {
          inline_keyboard: [[{ text: '✅ تسحرت وصليت ركعتين', callback_data: `ack_suhur_done_${dateStr}` }]]
        };
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }

    // أذكار الصباح بعد صلاة الفجر بنصف ساعة (Fajr + 30 mins وحتى قبيل الضحى)
    const fajrAdhkarMinutes = prayerData.minutes.fajr + 30;
    if (currentTimeMinutes >= fajrAdhkarMinutes && currentTimeMinutes < (10 * 60)) {
      const key = `adhkar_morning_${dateStr}_${chatId}`;
      if (!userWorship?.adhkar_morning && !(await hasSent(key, 24 * 3600 * 1000))) {
        await markSent(key, 24 * 3600 * 1000);
        const msg = `🌅 <b>أذكار الصباح وحصن المسلم (بعد صلاة الفجر):</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ <i>"أصبحنا وأصبح الملك لله والحمد لله، لا إله إلا الله وحده لا شريك له"</i>.\n` +
          `📿 ابدأ يومك بنور الأذكار لفتح أبواب البركة والتوفيق والسكينة في المذاكرة! 🤍`;

        const keyboard = {
          inline_keyboard: [[{ text: '✅ قرأت أذكار الصباح', callback_data: `ack_adhkar_morning_${dateStr}` }]]
        };
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }

    // صلاة الضحى (10:30 صباحاً وحتى قبيل الظهر)
    if (currentTimeMinutes >= (10 * 60 + 30) && currentTimeMinutes < prayerData.minutes.dhuhr) {
      const key = `duha_prayer_${dateStr}_${chatId}`;
      if (!userWorship?.duha_prayer_done && !(await hasSent(key, 24 * 3600 * 1000))) {
        await markSent(key, 24 * 3600 * 1000);
        const msg = `☀️ <b>صلاة الأوابين (صلاة الضحى):</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ <i>"يُصبح على كل سُلامى من أحدكم صدقة... ويُجزئ من ذلك ركعتان يركعهما من الضحى"</i>.\n` +
          `🕌 ركعتان خفيفتان لتجديد النشاط وشكر نعم الله!`;

        const keyboard = {
          inline_keyboard: [[{ text: '✅ صليت صلاة الضحى', callback_data: `ack_duha_done_${dateStr}` }]]
        };
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }

    // أذكار المساء بعد العصر بنصف ساعة (Asr + 30 mins وحتى العشاء)
    const asrAdhkarMinutes = prayerData.minutes.asr + 30;
    if (currentTimeMinutes >= asrAdhkarMinutes && currentTimeMinutes < prayerData.minutes.isha) {
      const key = `adhkar_evening_${dateStr}_${chatId}`;
      if (!userWorship?.adhkar_evening && !(await hasSent(key, 24 * 3600 * 1000))) {
        await markSent(key, 24 * 3600 * 1000);
        const msg = `🌇 <b>أذكار المساء وسكينة النفس (بعد صلاة العصر):</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ <i>"أمسينا وأمسى الملك لله والحمد لله"</i>.\n` +
          `📿 خذ استراحة دقيقتين ورطب لسانك بذكر الله والأذكار.`;

        const keyboard = {
          inline_keyboard: [[{ text: '✅ قرأت أذكار المساء', callback_data: `ack_adhkar_evening_${dateStr}` }]]
        };
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }

    // صلاة الوتر والقيام (23:00 مساءً وحتى الفجر)
    if (currentTimeMinutes >= (23 * 60) || currentTimeMinutes < prayerData.minutes.fajr) {
      const key = `witr_prayer_${dateStr}_${chatId}`;
      if (!userWorship?.witr_prayer_done && !(await hasSent(key, 24 * 3600 * 1000))) {
        await markSent(key, 24 * 3600 * 1000);
        const msg = `🌌 <b>صلاة الوتر والختام المبارك لليوم:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ <i>"إن الله وتر يحب الوتر، فأوتروا يا أهل القرآن"</i>.\n` +
          `🌙 اختم يومك بركعة وتر ودعاء صادق بالتوفيق والامتياز في الطب.`;

        const keyboard = {
          inline_keyboard: [[{ text: '✅ صليت الوتر بحمد الله', callback_data: `ack_witr_done_${dateStr}` }]]
        };
        await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }
  }

  // ============================================================================
  // 4. ⏰ السكاشن والمحاضرات الجامعية الخاصة بالطالب
  // ============================================================================
  if (prefs.schedule !== false) {
    try {
      const { data: schedule } = await supabase
        .from('academic_schedule')
        .select('*')
        .or(`telegram_id.eq.${chatId},telegram_id.is.null`)
        .eq('is_active', true);

      if (schedule && schedule.length > 0) {
        for (const item of schedule) {
          if (item.day_of_week && (dayName.includes(item.day_of_week) || item.day_of_week.includes(dayName))) {
            const [sHour, sMin] = item.start_time.split(':').map(Number);
            const sectionStartMinutes = sHour * 60 + sMin;
            const diff = sectionStartMinutes - currentTimeMinutes;

            if (diff > 0 && diff <= (item.reminder_mins_before || 60)) {
              const key = `section_${item.id}_${dateStr}_${chatId}`;
              if (!(await hasSent(key, 24 * 3600 * 1000))) {
                await markSent(key, 24 * 3600 * 1000);
                let msg = `⏰ <b>تذكير بموعد سيكشن / راوند قادم:</b>\n`;
                msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
                msg += `🩺 <b>المقرر:</b> [${item.course_code}] ${item.title}\n`;
                msg += `🏷️ <b>النوع:</b> ${item.type}\n`;
                msg += `📍 <b>المكان:</b> ${item.location || 'الكلية / المستشفى الجامعي'}\n`;
                msg += `⏱️ <b>الموعد:</b> ${item.start_time} (خلال ${diff} دقيقة)\n\n`;
                msg += `👇 <i>أكّد حضورك أو سجّل غيابك بالضغط على الزر:</i>`;

                const keyboard = {
                  inline_keyboard: [
                    [
                      { text: '✅ تم الحضور بالراوند', callback_data: `ack_section_attend_${item.course_code}_${dateStr}` },
                      { text: '⚠️ غياب بعذر', callback_data: `ack_section_absent_${item.course_code}_${dateStr}` }
                    ]
                  ]
                };
                await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Scheduler Section Warn]:', e.message);
    }
  }

  // ============================================================================
  // 6. 🎯 متابعة المهام المعلقة
  // ============================================================================
  if ((minutes >= 8 && minutes <= 15) || (minutes >= 38 && minutes <= 45)) {
    try {
      const { data: pendingTasks } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('date', dateStr)
        .eq('status', 'قيد التنفيذ')
        .lt('reminder_count', 2);

      if (pendingTasks && pendingTasks.length > 0) {
        for (const task of pendingTasks) {
          const createdAt = new Date(task.created_at).getTime();
          const elapsedHours = (Date.now() - createdAt) / (1000 * 60 * 60);

          if (elapsedHours >= 2.5) {
            const key = `task_followup_${task.id}_${task.reminder_count || 0}_${dateStr}`;
            if (!(await hasSent(key, 6 * 3600 * 1000))) {
              await markSent(key, 6 * 3600 * 1000);
              await supabase.from('daily_tasks').update({
                reminder_count: (task.reminder_count || 0) + 1,
                last_reminded_at: new Date().toISOString()
              }).eq('id', task.id);

              let msg = `🎯 <b>متابعة إنجاز المهمة يا دكتور:</b>\n`;
              msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
              msg += `📌 المهمة: <b>${task.title}</b> [${task.category}]\n`;
              msg += `⏱️ الوقت المستهدف: ${task.target_duration_mins || 0} دقيقة\n\n`;
              msg += `👇 <i>اضغط لتأكيد الإنجاز أو تأجيل المهمة:</i>`;

              const keyboard = {
                inline_keyboard: [
                  [
                    { text: '✅ تم إنجاز المهمة', callback_data: `ack_task_done_${task.id}` },
                    { text: '⏳ تأجيل المهمة لبكرة', callback_data: `ack_task_defer_${task.id}` }
                  ]
                ]
              };
              await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Scheduler Task Check Warn]:', e.message);
    }
  }

  // ============================================================================
  // 7. ⏰ المواعيد والتذكيرات المجدولة المخصصة (Custom Appointments & Reminders)
  // ============================================================================
  try {
    const nowIso = new Date().toISOString();
    const { data: dueAppts } = await supabase
      .from('appointments_and_reminders')
      .select('*')
      .eq('is_notified', false)
      .eq('is_completed', false)
      .lte('due_datetime', nowIso)
      .order('due_datetime', { ascending: true })
      .limit(10);

    if (dueAppts && dueAppts.length > 0) {
      for (const appt of dueAppts) {
        // If appt belongs to a specific user (via notes or telegram_id)
        const isUserMatch = !appt.notes?.includes('usr:') ? Number(chatId) === ADMIN_CHAT_ID : appt.notes.includes(`usr:${chatId}`);
        if (!isUserMatch) continue;

        const key = `appt_remind_${appt.id}_${chatId}`;
        // Mark notified immediately in DB so concurrent triggers won't duplicate
        await supabase
          .from('appointments_and_reminders')
          .update({ is_notified: true })
          .eq('id', appt.id);

        if (!(await hasSent(key, 48 * 3600 * 1000))) {
          await markSent(key, 48 * 3600 * 1000);

          let cleanTitle = (appt.title || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();
          let cleanNotes = (appt.notes || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

          let msg = `⏰ <b>تذكير بموعد / التزام مسجل يا ${userName}:</b>\n`;
          msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `📌 <b>${cleanTitle}</b>\n`;
          if (cleanNotes) msg += `📝 <i>${cleanNotes}</i>\n`;
          msg += `\n👇 <i>اضغط لتأكيد الإنجاز أو تأجيل التذكير:</i>`;

          const keyboard = {
            inline_keyboard: [
              [
                { text: '✅ تم إنجاز الموعد', callback_data: `ack_appt_done_${appt.id}` },
                { text: '⏳ تأجيل 15 دقيقة', callback_data: `snooze_appt_${appt.id}_15` }
              ]
            ]
          };

          await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch((err) => {
            console.error('[Send Reminder Error]:', err.message);
          });
        }
      }
    }
  } catch (e) {
    console.warn('[Scheduler Custom Appts Warn]:', e.message);
  }

  // ============================================================================
  // 8. ⚡ نبضات المجد، الانضباط، اليقين، والإنجليزية B2/C1 (Mindset Pulses)
  // ============================================================================
  // Slots: 08:30 (Morning Ignite), 13:30 (Midday Discipline), 17:30 (Afternoon Drive), 21:30 (Evening Wisdom)
  const pulseSlots = [
    { startMin: 8 * 60 + 30, endMin: 9 * 60 + 30, slotId: 'morning_ignite' },
    { startMin: 13 * 60 + 30, endMin: 14 * 60 + 30, slotId: 'midday_discipline' },
    { startMin: 17 * 60 + 30, endMin: 18 * 60 + 30, slotId: 'afternoon_drive' },
    { startMin: 21 * 60 + 30, endMin: 22 * 60 + 30, slotId: 'evening_wisdom' }
  ];

  for (const slot of pulseSlots) {
    if (currentTimeMinutes >= slot.startMin && currentTimeMinutes <= slot.endMin) {
      const key = `mindset_pulse_${slot.slotId}_${dateStr}_${chatId}`;
      if (!(await hasSent(key, 24 * 3600 * 1000))) {
        await markSent(key, 24 * 3600 * 1000);
        try {
          await sendMindsetPulse(bot, chatId, false, userName);
        } catch (e) {
          console.warn('[Scheduler Mindset Pulse Warn]:', e.message);
        }
      }
    }
  }
}

export { runSchedulerCycle };
