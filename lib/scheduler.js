// ⏰ Proactive Life Scheduler & Spaced Repetition Engine for Abdullah's Journey OS
import { supabase } from './supabase.js';
import { getCairoPrayerTimes } from './prayer_times.js';

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

const notificationTracker = new Map();

function hasSent(key) {
  return notificationTracker.has(key);
}

function markSent(key, ttlMs = 86400000) {
  notificationTracker.set(key, Date.now());
  setTimeout(() => notificationTracker.delete(key), ttlMs);
}

export function startScheduler(bot, targetChatId = '1191760477') {
  if (!bot || !targetChatId) return;

  console.log(`[Scheduler] 🚀 Spaced repetition & prayer scheduler active for Dr. Abdullah (${targetChatId})...`);

  setInterval(async () => {
    try {
      await runSchedulerCycle(bot, targetChatId);
    } catch (err) {
      console.error('[Scheduler Cycle Error]:', err.message);
    }
  }, 60000);

  runSchedulerCycle(bot, targetChatId).catch(() => {});
}

async function runSchedulerCycle(bot, chatId) {
  const { dateStr, hours, minutes, dayName } = getCairoNow();
  const currentTimeMinutes = hours * 60 + minutes;
  const prayerData = getCairoPrayerTimes();

  // ============================================================================
  // 1. 🧠 فلاش كاردز الإنجليزية بالتكرار المتباعد (Spaced Repetition)
  // ============================================================================
  try {
    const { data: dueCards } = await supabase
      .from('english_spaced_flashcards')
      .select('*')
      .lte('next_review_at', new Date().toISOString())
      .eq('is_mastered', false)
      .limit(1);

    if (dueCards && dueCards.length > 0) {
      const card = dueCards[0];
      const key = `eng_spaced_${card.id}_${Math.floor(Date.now() / 3600000)}`; // 1 hour cooldown per card
      if (!hasSent(key)) {
        markSent(key, 7200000);

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

  // ============================================================================
  // 2. 🩺 كويزات الموديولات الطبية بالتكرار المتباعد (Medical Spaced Quizzes)
  // ============================================================================
  try {
    const { data: dueQuizzes } = await supabase
      .from('medical_spaced_quizzes')
      .select('*')
      .lte('next_review_at', new Date().toISOString())
      .eq('is_mastered', false)
      .limit(1);

    if (dueQuizzes && dueQuizzes.length > 0) {
      const quiz = dueQuizzes[0];
      const key = `med_spaced_${quiz.id}_${Math.floor(Date.now() / 3600000)}`;
      if (!hasSent(key)) {
        markSent(key, 7200000);

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

  // ============================================================================
  // 3. 🌙 تذكيرات الصيام (الإثنين والخميس)
  // ============================================================================
  if ((dayName.includes('أحد') || dayName.includes('أربعاء')) && hours === 22 && minutes === 0) {
    const nextDay = dayName.includes('أحد') ? 'الإثنين' : 'الخميس';
    const key = `fasting_night_${dateStr}_${nextDay}`;
    if (!hasSent(key)) {
      markSent(key);
      const msg = `🌙 <b>تذكير صيام سنة يوم ${nextDay} يا دكتور عبدالله:</b>\n` +
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
  if (currentTimeMinutes === fajrMinutes - 60 && (dayName.includes('إثنين') || dayName.includes('خميس'))) {
    const key = `suhur_fajr_${dateStr}`;
    if (!hasSent(key)) {
      markSent(key);
      const msg = `🥣 <b>وقت السحور المبارك يا دكتور:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ <i>"تسحروا فإن في السحور بركة"</i>.\n` +
        `⏳ متبقي ساعة على أذان الفجر (${prayerData.times.fajr}). اشرب ماء كافياً وصلّ ركعتين في جوف الليل! 🤍`;

      const keyboard = {
        inline_keyboard: [[{ text: '✅ تسحرت وصليت ركعتين', callback_data: `ack_suhur_done_${dateStr}` }]]
      };
      await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
    }
  }

  // ============================================================================
  // 4. 📿 أذكار الصباح والمساء والصلوات
  // ============================================================================

  // أذكار الصباح بعد شروق الشمس (Sunrise + 15 mins)
  if (currentTimeMinutes === prayerData.minutes.sunrise + 15) {
    const key = `adhkar_morning_${dateStr}`;
    if (!hasSent(key)) {
      markSent(key);
      const msg = `🌅 <b>أذكار الصباح وحصن المسلم:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ <i>"أصبحنا وأصبح الملك لله والحمد لله"</i>.\n` +
        `📿 ابدأ يومك بنور الأذكار لفتح أبواب البركة والتوفيق في المذاكرة!`;

      const keyboard = {
        inline_keyboard: [[{ text: '✅ قرأت أذكار الصباح', callback_data: `ack_adhkar_morning_${dateStr}` }]]
      };
      await bot.telegram.sendMessage(chatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
    }
  }

  // صلاة الضحى (10:30 صباحاً)
  if (hours === 10 && minutes === 30) {
    const key = `duha_prayer_${dateStr}`;
    if (!hasSent(key)) {
      markSent(key);
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

  // أذكار المساء بعد العصر بنصف ساعة (Asr + 30 mins)
  if (currentTimeMinutes === prayerData.minutes.asr + 30) {
    const key = `adhkar_evening_${dateStr}`;
    if (!hasSent(key)) {
      markSent(key);
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

  // صلاة الوتر والقيام (23:00 مساءً)
  if (hours === 23 && minutes === 0) {
    const key = `witr_prayer_${dateStr}`;
    if (!hasSent(key)) {
      markSent(key);
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

  // ============================================================================
  // 5. ⏰ السكاشن والمحاضرات الجامعية
  // ============================================================================
  try {
    const { data: schedule } = await supabase.from('academic_schedule').select('*').eq('is_active', true);
    if (schedule && schedule.length > 0) {
      for (const item of schedule) {
        if (item.day_of_week && (dayName.includes(item.day_of_week) || item.day_of_week.includes(dayName))) {
          const [sHour, sMin] = item.start_time.split(':').map(Number);
          const sectionStartMinutes = sHour * 60 + sMin;
          const diff = sectionStartMinutes - currentTimeMinutes;

          if (diff > 0 && diff <= (item.reminder_mins_before || 60)) {
            const key = `section_${item.id}_${dateStr}`;
            if (!hasSent(key)) {
              markSent(key);
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

  // ============================================================================
  // 6. 🎯 متابعة المهام المعلقة
  // ============================================================================
  if (minutes === 10 || minutes === 40) {
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
            const key = `task_followup_${task.id}_${task.reminder_count || 0}`;
            if (!hasSent(key)) {
              markSent(key, 10800000);
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
}
