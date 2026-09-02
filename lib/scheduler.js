import { 
  getRandomScientificDiscipline, 
  getRandomAyahWithAsbab, 
  getRandomBukhariHadith, 
  getRandomPropheticSituation, 
  getRandomSahabiSpotlight 
} from './admin_curriculum.js';
import { supabase, getAllRegisteredUsers, getUserProfile, getGenderTerms, DEFAULT_USER_PREFERENCES, ADMIN_CHAT_ID } from './supabase.js';
import { getCairoPrayerTimes } from './prayer_times.js';
import { sendMindsetPulse } from './mindset_pulses.js';
import { getRandomPuritySpiritualFuel } from './purity_spiritual_fuel.js';
import { getRandomPastRulerMistake, getRandomStatesmanPearl } from './statesman_engine.js';
import { getRandomShariaCapsule } from './sharia_sciences.js';

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

  // 1. Gather all registered users
  const registered = await getAllRegisteredUsers();
  const allSubscribers = [
    { telegram_id: ADMIN_CHAT_ID, full_name: 'د. عبدالله' },
    ...registered
  ];

  // Unique by telegram_id
  const seenIds = new Set();
  const uniqueUsers = allSubscribers.filter(u => {
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

  // 🔒 Proactive Check: Send subscription notification when trial/subscription expires
  if (userProf && !userProf.is_active && userProf.role !== 'admin') {
    const expiredKey = `trial_expired_notice_${chatId}`;
    const alreadyNotified = await hasSent(expiredKey, 30 * 86400000); // 30 days
    if (!alreadyNotified) {
      await markSent(expiredKey, 30 * 86400000);
      let paywallMsg = `🔒 <b>عفواً يا ${userName}، انتهت فترتك التجريبية المجانية (3 أيام)! 🎯</b>\n`;
      paywallMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      paywallMsg += `نتمنى أن تكون المنظومة قد ساعدتك في تنظيم مذاكرتك وكويزاتك الطبية وتدريباتك!\n\n`;
      paywallMsg += `💳 <b>للاشتراك وتفعيل المنظومة شهرياً:</b> 30 ج.م فقط شهرياً\n\n`;
      paywallMsg += `💸 <b>بيانات التحويل المباشر (فودافون كاش / إنستا باي):</b>\n`;
      paywallMsg += `📱 <b>فودافون كاش:</b> <code>01006311569</code>\n`;
      paywallMsg += `⚡ <b>إنستا باي (InstaPay):</b> <code>01006311569</code>\n\n`;
      paywallMsg += `📞 <b>للتواصل والدعم الفني:</b>\n`;
      paywallMsg += `✈️ <a href="https://t.me/Dr31327">@Dr31327</a> | 🟢 <a href="https://wa.me/201096247662">+201096247662</a>\n\n`;
      paywallMsg += `📸 <i>بعد التحويل، أرسل صورة الإيصال هنا في الشات وسيتم تفعيل حسابك فوراً!</i> 🚀`;

      const paywallKb = {
        inline_keyboard: [
          [{ text: '✈️ تواصل عبر تليجرام (@Dr31327)', url: 'https://t.me/Dr31327' }],
          [{ text: '🟢 تواصل عبر واتساب (+201096247662)', url: 'https://wa.me/201096247662' }]
        ]
      };

      await bot.telegram.sendMessage(chatId, paywallMsg, {
        parse_mode: 'HTML',
        reply_markup: paywallKb,
        disable_web_page_preview: true
      }).catch(() => {});
    }
    return; // Stop processing further routines for expired users
  }

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
        .ilike('topic', `[UID:${chatId}]%`)
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

          if (quiz.options && Array.isArray(quiz.options) && quiz.options.length >= 2) {
            const questionText = `[${quiz.course_code || 'MED'}] ${quiz.question}`.substring(0, 300);
            const options = quiz.options.map(o => String(o).substring(0, 100));
            const correctIdx = Number(quiz.correct_option_index || 0);
            const explanation = (quiz.explanation || quiz.answer_and_explanation || 'إجابة من مذكرة الموديول').substring(0, 195);

            const pollMessage = await bot.telegram.sendPoll(chatId, questionText, options, {
              type: 'quiz',
              correct_option_id: Math.max(0, Math.min(options.length - 1, correctIdx)),
              explanation: `💡 ${explanation}`,
              is_anonymous: false
            }).catch(err => {
              console.warn('[SendPoll Error]:', err.message);
            });

            if (pollMessage && pollMessage.poll) {
              await supabase.from('medical_spaced_quizzes').update({
                telegram_poll_id: pollMessage.poll.id
              }).eq('id', quiz.id);
            }
          } else {
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

    const g = getGenderTerms(userName);

    // 🕌 1. تذكيرات ما قبل خروج وقت الصلاة السابقة (قبل أذان الصلاة القادمة بـ 15 دقيقة - مجرد تذكير نقي بدون أزرار)
    const prePrayerTransitions = [
      {
        nextPrayerName: 'العصر',
        nextPrayerMins: prayerData.minutes.asr,
        prevPrayerKey: 'dhuhr',
        prevPrayerName: 'الظهر',
        msg: `⏳ <b>باقي 15 دقيقة على أذان صلاة العصر (${prayerData.times12.asr}) ${g.docTitle}:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${g.dontForget} تصلي <b>صلاة الظهر</b> قبل خروج وقتها 🕌\n<i>"حافظوا على الصلوات والصلاة الوسطى وقوموا لله قانتين"</i>.`
      },
      {
        nextPrayerName: 'المغرب',
        nextPrayerMins: prayerData.minutes.maghrib,
        prevPrayerKey: 'asr',
        prevPrayerName: 'العصر',
        msg: `⏳ <b>باقي 15 دقيقة على أذان صلاة المغرب (${prayerData.times12.maghrib}) ${g.docTitle}:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${g.dontForget} تصلي <b>صلاة العصر (الصلاة الوسطى)</b> قبل خروج وقتها 🕌\n<i>"من ترك صلاة العصر فقد حبط عمله"</i>.`
      },
      {
        nextPrayerName: 'العشاء',
        nextPrayerMins: prayerData.minutes.isha,
        prevPrayerKey: 'maghrib',
        prevPrayerName: 'المغرب',
        msg: `⏳ <b>باقي 15 دقيقة على أذان صلاة العشاء (${prayerData.times12.isha}) ${g.docTitle}:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${g.dontForget} تصلي <b>صلاة المغرب</b> قبل خروج وقتها 🕌`
      },
      {
        nextPrayerName: 'الفجر',
        nextPrayerMins: prayerData.minutes.fajr,
        prevPrayerKey: 'isha',
        prevPrayerName: 'العشاء',
        msg: `⏳ <b>باقي 15 دقيقة على أذان صلاة الفجر (${prayerData.times12.fajr}) ${g.docTitle}:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${g.dontForget} تصلي <b>صلاة العشاء والوتر</b> قبل أذان الفجر 🌌`
      },
      {
        nextPrayerName: 'الظهر',
        nextPrayerMins: prayerData.minutes.dhuhr,
        prevPrayerKey: 'fajr',
        prevPrayerName: 'الفجر',
        msg: `⏳ <b>باقي 15 دقيقة على أذان صلاة الظهر (${prayerData.times12.dhuhr}) ${g.docTitle}:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${g.dontForget} ركعتي الضحى وتأكيد صلاة الفجر قبل أذان الظهر ☀️`
      }
    ];

    for (const item of prePrayerTransitions) {
      const diff = item.nextPrayerMins - currentTimeMinutes;
      if (diff >= 10 && diff <= 18) {
        const key = `pre_prayer_${item.prevPrayerKey}_${dateStr}_${chatId}`;
        if (!(await hasSent(key, 12 * 3600 * 1000))) {
          await markSent(key, 12 * 3600 * 1000);
          await bot.telegram.sendMessage(chatId, item.msg, { parse_mode: 'HTML' }).catch(() => {});
        }
      }
    }

    // 🕌 2. تذكير وقت إقامة الصلاة (بعد الأذان بـ 15 دقيقة بالضبط)
    const prayersList = [
      { key: 'fajr', name: 'الفجر', adhanMins: prayerData.minutes.fajr },
      { key: 'dhuhr', name: 'الظهر', adhanMins: prayerData.minutes.dhuhr },
      { key: 'asr', name: 'العصر', adhanMins: prayerData.minutes.asr },
      { key: 'maghrib', name: 'المغرب', adhanMins: prayerData.minutes.maghrib },
      { key: 'isha', name: 'العشاء', adhanMins: prayerData.minutes.isha }
    ];

    for (const p of prayersList) {
      const elapsedSinceAdhan = currentTimeMinutes - p.adhanMins;
      if (elapsedSinceAdhan >= 12 && elapsedSinceAdhan <= 22) {
        const key = `iqama_prayer_${p.key}_${dateStr}_${chatId}`;
        if (!(await hasSent(key, 12 * 3600 * 1000))) {
          await markSent(key, 12 * 3600 * 1000);
          const iqamaMsg = `🕌 <b>حان الآن وقت إقامة صلاة ${p.name} في القاهرة:</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `🤍 <i>"لا يُصلي المصلون ولستَ فيهم ${g.docTitle}!"</i>\n\n` +
            `✨ ${g.getUpAndPray} لتنال${g.isFemale ? 'ي' : ''} بركة وقتك ويومك 🤲\n\n` +
            `👇 <i>أكّد${g.isFemale ? 'ي' : ''} أداء الصلاة عند الانتهاء:</i>`;

          const keyboard = {
            inline_keyboard: [
              [
                { text: '✅ صليت الحمدلله', callback_data: `prayer_done_${p.key}` },
                { text: '❌ مصلتش لسه', callback_data: `prayer_notyet_${p.key}` }
              ]
            ]
          };
          await bot.telegram.sendMessage(chatId, iqamaMsg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
        }
      }
    }

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
          const isUserMatch = !task.category?.includes('usr:') ? Number(chatId) === ADMIN_CHAT_ID : task.category.includes(`usr:${chatId}`);
          if (!isUserMatch) continue;

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

              const cleanCat = (task.category || 'عام').replace(/\[usr:\d+\]/g, '').trim();
              const cleanTitle = (task.title || '').replace(/\[usr:\d+\]/g, '').trim();
              const gTerms = getGenderTerms(userProfile?.full_name);

              let msg = `🎯 <b>متابعة إنجاز المهمة ${gTerms.docTitle}:</b>\n`;
              msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
              msg += `📌 المهمة: <b>${cleanTitle}</b> [${cleanCat}]\n`;
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

          let isQuranSrs = appt.notes && appt.notes.includes('[quran_srs:');
          let quranMasteryId = isQuranSrs ? (appt.notes.match(/\[quran_srs:(.+?)\]/) || [])[1] : null;

          let isAcadSrs = appt.notes && appt.notes.includes('[academic_srs:');
          let acadMasteryId = isAcadSrs ? (appt.notes.match(/\[academic_srs:(.+?)\]/) || [])[1] : null;
          let acadCourse = isAcadSrs ? (appt.notes.match(/\[course:(.+?)\]/) || [])[1] : 'MED';

          let msg = isQuranSrs
            ? `🕌 <b>حان موعد التسميع والتثبيت العلمي للقرآن الكريم يا ${userName}:</b>\n`
            : (isAcadSrs ? `🩺 <b>حان موعد المراجعة والتثبيت العصبي للموديول يا ${userName}:</b>\n` : `⏰ <b>تذكير بموعد / التزام مسجل يا ${userName}:</b>\n`);
          msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
          msg += `📌 <b>${cleanTitle}</b>\n`;
          if (cleanNotes) msg += `📝 <i>${cleanNotes.replace(/\[(quran_srs|academic_srs|course):.+?\]/g, '').trim()}</i>\n`;
          msg += `\n👇 <i>اضغط لتأكيد الإتقان أو طلب كويز تفاعلي:</i>`;

          let keyboard;
          if (isQuranSrs && quranMasteryId) {
            keyboard = {
              inline_keyboard: [
                [
                  { text: '✅ تم التسميع بإتقان (ترقية المرحلة)', callback_data: `ack_quran_mastered_${quranMasteryId}_${appt.id}` },
                  { text: '🎧 يحتاج إعادة سماع', callback_data: `ack_quran_retry_${quranMasteryId}_${appt.id}` }
                ],
                [
                  { text: '⏳ تأجيل 30 دقيقة', callback_data: `snooze_appt_${appt.id}_30` }
                ]
              ]
            };
          } else if (isAcadSrs) {
            keyboard = {
              inline_keyboard: [
                [
                  { text: '✅ راجعت وأتقنت (ترقية المرحلة)', callback_data: `ack_acad_mastered_${acadMasteryId}_${appt.id}` }
                ],
                [
                  { text: '⏳ تأجيل 30 دقيقة', callback_data: `snooze_appt_${appt.id}_30` }
                ]
              ]
            };
          } else {
            keyboard = {
              inline_keyboard: [
                [
                  { text: '✅ تم إنجاز الموعد', callback_data: `ack_appt_done_${appt.id}` },
                  { text: '⏳ تأجيل 15 دقيقة', callback_data: `snooze_appt_${appt.id}_15` }
                ]
              ]
            };
          }

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
  // 8. ⚡ نبضات المجد، الانضباط، واليقين (Mindset Pulses) — [DISABLED PERMANENTLY]
  // ============================================================================
  // Note: Disabled per user request - no automatic pulse notifications sent to admin or users.

  // ============================================================================
  // 9. 👑 التوزيع الذكي التلقائي لمنظومة إعداد القائد والعلم الشرعي ووقود النقاء (حصرياً للأدمن)
  // ============================================================================
  try {
    const adminChatId = ADMIN_CHAT_ID;
    const curMinutes = hours * 60 + minutes;

    // 🧠 1. كبسولة علم الأعصاب والانضباط الذاتي والدوبامين (11:15 صباحاً) -> [675-705 mins]
    if (curMinutes >= 675 && curMinutes <= 705) {
      const discKey = `admin_discipline_auto_${dateStr}`;
      if (!(await hasSent(discKey, 86400000))) {
        await markSent(discKey, 86400000);
        const disc = getRandomScientificDiscipline();
        await bot.telegram.sendMessage(adminChatId, disc.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔬 مقولة علمية أخرى', callback_data: 'get_discipline_pulse' }]
            ]
          }
        }).catch(() => {});
      }
    }

    // 📖 2. آية قرآنية وقصة وسبب نزولها (01:30 ظهراً) -> [810-840 mins]
    if (curMinutes >= 810 && curMinutes <= 840) {
      const ayahKey = `admin_ayah_asbab_auto_${dateStr}`;
      if (!(await hasSent(ayahKey, 86400000))) {
        await markSent(ayahKey, 86400000);
        const ayah = getRandomAyahWithAsbab();
        await bot.telegram.sendMessage(adminChatId, ayah.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📖 آية وسبب نزول آخر', callback_data: 'get_ayah_asbab' }]
            ]
          }
        }).catch(() => {});
      }
    }

    // 🌟 3. صحابي اليوم وصناعة القائد والخليفة (05:15 عصراً) -> [1035-1065 mins]
    if (curMinutes >= 1035 && curMinutes <= 1065) {
      const sahabiKey = `admin_sahabi_auto_${dateStr}`;
      if (!(await hasSent(sahabiKey, 86400000))) {
        await markSent(sahabiKey, 86400000);
        const sahabi = getRandomSahabiSpotlight();
        await bot.telegram.sendMessage(adminChatId, sahabi.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌟 صحابي آخر', callback_data: 'get_sahabi_spotlight' }],
              [{ text: '⚔️ موقف قيادي نبوي', callback_data: 'get_prophetic_situation' }]
            ]
          }
        }).catch(() => {});
      }
    }

    // 📜 4. درر صحيح البخاري والقيادة (07:00 مساءً) -> [1140-1170 mins]
    if (curMinutes >= 1140 && curMinutes <= 1170) {
      const bukhariKey = `admin_bukhari_auto_${dateStr}`;
      if (!(await hasSent(bukhariKey, 86400000))) {
        await markSent(bukhariKey, 86400000);
        const bukhari = getRandomBukhariHadith();
        await bot.telegram.sendMessage(adminChatId, bukhari.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📜 حديث بخاري آخر', callback_data: 'get_bukhari_hadith' }]
            ]
          }
        }).catch(() => {});
      }
    }

    // A. 📖 كبسولة العلم الشرعي الصباحية (09:30 صباحاً) -> [570-600 mins]
    if (curMinutes >= 570 && curMinutes <= 600) {
      const shariaKey = `admin_sharia_auto_${dateStr}`;
      if (!(await hasSent(shariaKey, 86400000))) {
        await markSent(shariaKey, 86400000);
        const capsule = getRandomShariaCapsule();
        const header = `🌅 <b>كبسولة العلم الشرعي الصباحية يا د. عبدالله 📖</b>\n\n`;
        await bot.telegram.sendMessage(adminChatId, header + capsule.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📖 كبسولة أخرى', callback_data: 'get_sharia_capsule' }]
            ]
          }
        }).catch(() => {});
      }
    }

    // B. 🏛️ فقرة أخطاء الذين مضوا وصناعة الخليفة (03:45 عصراً) -> [945-975 mins]
    if (curMinutes >= 945 && curMinutes <= 975) {
      const statesmanKey = `admin_statesman_auto_${dateStr}`;
      if (!(await hasSent(statesmanKey, 86400000))) {
        await markSent(statesmanKey, 86400000);
        const mistake = getRandomPastRulerMistake();
        const header = `👑 <b>إعداد رجل الدولة والخليفة — فقرة العصر 🏛️</b>\n\n`;
        await bot.telegram.sendMessage(adminChatId, header + mistake.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📜 درس تاريخي آخر', callback_data: 'get_statesman_mistake' }],
              [{ text: '👑 كبسولة صناعة القائد', callback_data: 'get_statesman_pearl' }]
            ]
          }
        }).catch(() => {});
      }
    }

    // 🌿 D. الورد القرآني العلاجي (08:15 مساءً) -> [1215-1245 mins]
    if (curMinutes >= 1215 && curMinutes <= 1245) {
      const healKey = `admin_quran_healing_auto_${dateStr}`;
      if (!(await hasSent(healKey, 86400000))) {
        await markSent(healKey, 86400000);
        const { getAdminHealingProtocol } = await import('./supabase.js');
        const proto = await getAdminHealingProtocol(adminChatId);
        const dayNum = proto.current_day_number || 1;
        const streak = proto.streak_days || 0;

        let msg = `🌿 <b>الورد القرآني العلاجي اليومي (اليوم ${dayNum} من 30) 📖✨</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🤍 <b>وردك العلاجي لليوم وسكينة نفسك يا د. عبدالله:</b>\n`;
        msg += `1️⃣ <b>سورة ق 💎</b> (آيات البعث واليقين وقرب الله).\n`;
        msg += `2️⃣ <b>سورة الرحمن 🌸</b> (عروس القرآن وتعداد نعم الله والاستشفاء).\n`;
        msg += `3️⃣ <b>سورة الملك 👑</b> (المانعة والمنجية وحصن الليل).\n`;
        msg += `4️⃣ <b>سورة الزلزلة ⚡</b> (تطهير القلب وتعظيم الجزاء).\n\n`;
        msg += `📊 <b>الإنجاز حتى الآن:</b> ${streak}/30 يوماً مكتملة 🎯\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `👇 <i>اضغط للتأكيد عند إتمام تلاوة الورد:</i>`;

        const keyboard = {
          inline_keyboard: [
            [{ text: `✅ أتممت قراءة الورد العلاجي كاملاً اليوم (${dayNum}/30) 🌟`, callback_data: 'ack_healing_quran_done' }],
            [{ text: '📊 فحص تقدم الـ 30 يوماً', callback_data: 'check_healing_progress' }]
          ]
        };

        await bot.telegram.sendMessage(adminChatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }

    // C. 🔥 وقود النقاء والتميز الإيماني المسائي (09:15 مساءً) -> [1275-1305 mins]
    if (curMinutes >= 1275 && curMinutes <= 1305) {
      const fuelKey = `admin_purity_fuel_auto_${dateStr}`;
      if (!(await hasSent(fuelKey, 86400000))) {
        await markSent(fuelKey, 86400000);
        const fuel = getRandomPuritySpiritualFuel('د. عبدالله');
        const header = `🛡️ <b>وقود النقاء والسيادة المسائية يا دكتور 👑</b>\n\n`;
        await bot.telegram.sendMessage(adminChatId, header + fuel.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✨ وقود عفة آخر', callback_data: 'get_purity_fuel' }],
              [{ text: '🔥 شعلة النقاء', callback_data: 'purity_check_streak' }],
              [{ text: '🆘 زر النجدة (Urge Surfing)', callback_data: 'launch_urge_surfing' }]
            ]
          }
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[Scheduler Admin Curriculum Warn]:', err.message);
  }
}

export { runSchedulerCycle };
