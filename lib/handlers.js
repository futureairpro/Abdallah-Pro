// 🌟 Telegram Bot Handlers & Master Action & 24-Hour Undo Engine for Abdullah's Journey OS
import { supabase, getStoredAiKeys, setUserSession, getUserSession, updateLiquidity } from './supabase.js';
import { isAuthorized } from './bot.js';
import { startScheduler } from './scheduler.js';
import { getCairoPrayerTimes, getRelativePrayerTarget } from './prayer_times.js';
import {
  downloadFileBuffer,
  parseWithGeminiPool,
  talkWithEnglishCoach,
  generateMedicalQuiz,
  analyzeImageWithGemini
} from './ai_engine.js';

function formatEgp(num) {
  return Number(num || 0).toLocaleString('en-US') + ' ج.م';
}

function getCairoToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

const UNDO_TIME_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 Hours

function isUndoExpired(timestamp) {
  if (!timestamp) return false;
  return (Date.now() - Number(timestamp)) > UNDO_TIME_LIMIT_MS;
}

// Spaced Repetition Interval Calculator (Levels 0 -> 6)
function getNextSpacedReviewDate(currentLevel, isSuccess) {
  const now = Date.now();
  if (!isSuccess) {
    return {
      nextLevel: 0,
      nextReviewDate: new Date(now + 12 * 3600 * 1000).toISOString(),
      isMastered: false
    };
  }

  const nextLevel = Math.min(6, (currentLevel || 0) + 1);
  let intervalHours = 12;

  switch (nextLevel) {
    case 1: intervalHours = 24; break;
    case 2: intervalHours = 72; break;
    case 3: intervalHours = 168; break;
    case 4: intervalHours = 336; break;
    case 5: intervalHours = 720; break;
    case 6:
      return {
        nextLevel: 6,
        nextReviewDate: new Date(now + 365 * 24 * 3600 * 1000).toISOString(),
        isMastered: true
      };
  }

  return {
    nextLevel,
    nextReviewDate: new Date(now + intervalHours * 3600 * 1000).toISOString(),
    isMastered: false
  };
}

let schedulerStarted = false;

export function registerHandlers(bot) {
  if (!bot) return;

  if (!schedulerStarted) {
    const authUser = process.env.AUTHORIZED_USERS?.split(',')[0]?.trim() || '1191760477';
    startScheduler(bot, authUser);
    schedulerStarted = true;
  }

  // 🛡️ Middleware: Exclusive Dr. Abdullah check
  bot.use(async (ctx, next) => {
    const fromId = ctx.from?.id;
    if (fromId && !isAuthorized(fromId)) {
      return ctx.reply('⛔ عذراً، هذا البوت مخصص حصرياً لـ د. عبدالله لإدارة حياته ودراسته.');
    }
    return next();
  });

  // ==============================================================================
  // 🌟 1. /start & Main Menu
  // ==============================================================================
  bot.command(['start', 'menu', 'help'], async (ctx) => {
    const name = ctx.from?.first_name || 'د. عبدالله';
    const prayers = getCairoPrayerTimes();

    let welcome = `👑 <b>أهلاً بك يا ${name} في منظومة رحلة عبدالله الذكية (Abdullah's Journey OS)!</b>\n`;
    welcome += `━━━━━━━━━━━━━━━━━━━━━\n`;
    welcome += `🕌 <b>مواقيت الصلاة الحية بالقاهرة اليوم:</b>\n`;
    welcome += `• الفجر: <b>${prayers.times.fajr}</b> | الشروق: <b>${prayers.times.sunrise}</b> | الظهر: <b>${prayers.times.dhuhr}</b>\n`;
    welcome += `• العصر: <b>${prayers.times.asr}</b> | المغرب: <b>${prayers.times.maghrib}</b> | العشاء: <b>${prayers.times.isha}</b>\n`;
    welcome += `━━━━━━━━━━━━━━━━━━━━━\n`;
    welcome += `⚡ <b>المحرك التفاعلي ونظام التراجع (24 ساعة) نشط الآن على كافة الأزرار!</b>\n\n`;
    welcome += `👇 <b>تصفح الأقسام الذكية بالضغط على الأزرار:</b>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🩺 كويزات الموديولات الطبية', callback_data: 'menu_med_spaced' },
          { text: '🗣️ فلاش كاردز الإنجليزية', callback_data: 'menu_eng_spaced' }
        ],
        [
          { text: '📅 جدول السكاشن والغياب', callback_data: 'menu_academic' },
          { text: '📖 سجل المصحف والتثبيت', callback_data: 'menu_quran' }
        ],
        [
          { text: '🌙 الصيام والسنن والأذكار', callback_data: 'menu_fasting' },
          { text: '🧠 الفضفضة والاتزان النفسي', callback_data: 'menu_wellness' }
        ],
        [
          { text: '🏋️‍♂️ الجيم واللياقة البدنية', callback_data: 'menu_gym' },
          { text: '🎬 صناعة المحتوى والمونتاج', callback_data: 'menu_content' }
        ],
        [
          { text: '💼 الشغل ومشاريع البيزنس', callback_data: 'menu_work' },
          { text: '🎯 المهام والمواعيد والتركيز', callback_data: 'menu_tasks' }
        ],
        [
          { text: '💡 بنك الخواطر والانضباط', callback_data: 'menu_thoughts' },
          { text: '💵 الخزنة والمصروفات الشخصية', callback_data: 'menu_finance' }
        ]
      ]
    };

    return ctx.reply(welcome, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  // ==============================================================================
  // 🎙️ 2. Voice & Audio Handler
  // ==============================================================================
  bot.on(['voice', 'audio'], async (ctx) => {
    const fromId = ctx.from?.id;
    const session = fromId ? await getUserSession(fromId) : null;
    const isEnglishMode = session?.mode === 'english_coach';

    const waitMsg = await ctx.reply(
      isEnglishMode
        ? '🎙️ <i>Listening and analyzing your English speech...</i>'
        : '⏳ <i>جاري استيعاب الفويس وتصنيف إنجازاتك في المنظومة الذكية...</i>',
      { parse_mode: 'HTML' }
    );

    try {
      const voice = ctx.message.voice || ctx.message.audio;
      const fileLink = await ctx.telegram.getFileLink(voice.file_id);
      const audioBuffer = await downloadFileBuffer(fileLink.href);

      const aiKeys = await getStoredAiKeys();

      if (isEnglishMode) {
        const coachResult = await talkWithEnglishCoach(audioBuffer, aiKeys, true);
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

        await supabase.from('english_logs').insert({
          topic: 'Voice Practice',
          ai_response_text: coachResult.conversational_reply,
          grammar_corrections: coachResult.corrections || [],
          new_vocabulary: coachResult.elevated_vocabulary || [],
          fluency_score: coachResult.fluency_score || 85,
          date: getCairoToday()
        });

        let msg = `🗣️ <b>English Coach Feedback:</b>\n━━━━━━━━━━━━━━━━━━━━━\n💬 <b>Reply:</b>\n${coachResult.conversational_reply}\n\n`;
        if (coachResult.corrections?.length > 0) {
          msg += `🛠️ <b>Corrections:</b>\n`;
          coachResult.corrections.forEach(c => msg += `• ❌ <s>${c.original}</s> ➔ ✅ <b>${c.corrected}</b> (${c.reason})\n`);
          msg += `\n`;
        }
        if (coachResult.elevated_vocabulary?.length > 0) {
          msg += `✨ <b>High-Yield Vocabulary Bank:</b>\n`;
          coachResult.elevated_vocabulary.forEach(v => msg += `• 🌟 <b>${v.word}</b>: ${v.definition}\n  <i>Ex: ${v.example}</i>\n`);
          msg += `\n`;
        }
        msg += `🎯 <b>Fluency Score:</b> <b>${coachResult.fluency_score || 85}/100</b>\n━━━━━━━━━━━━━━━━━━━━━\n🎙️ <i>Send another voice note to continue!</i>`;
        return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔄 إنهاء وضع الإنجليزية والعودة', callback_data: 'exit_english_mode' }]] } });
      }

      const parsedResult = await parseWithGeminiPool(audioBuffer, aiKeys, true);
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return executeParsedLifeActions(ctx, parsedResult, fromId);

    } catch (err) {
      console.error('Error processing voice message:', err);
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return ctx.reply(`⚠️ <b>تعذر معالجة الفويس:</b> ${err.message}`, { parse_mode: 'HTML' });
    }
  });

  // ==============================================================================
  // ⌨️ 3. Text Messages Handler
  // ==============================================================================
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;
    const fromId = ctx.from?.id;

    const session = fromId ? await getUserSession(fromId) : null;
    const isEnglishMode = session?.mode === 'english_coach';

    const waitMsg = await ctx.reply('⏳ <i>جاري معالجة طلبك وتوجيهه بدقة...</i>', { parse_mode: 'HTML' });

    try {
      const aiKeys = await getStoredAiKeys();

      // ⏱️ 1. Check Real-time Activity / Commute Tracker first
      const isHandled = await handleRealtimeActivity(ctx, text, fromId);
      if (isHandled) {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        return;
      }

      if (isEnglishMode) {
        const coachResult = await talkWithEnglishCoach(text, aiKeys, false);
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

        await supabase.from('english_logs').insert({
          topic: 'Text Chat Practice',
          user_speech_transcript: text,
          ai_response_text: coachResult.conversational_reply,
          grammar_corrections: coachResult.corrections || [],
          new_vocabulary: coachResult.elevated_vocabulary || [],
          fluency_score: coachResult.fluency_score || 85,
          date: getCairoToday()
        });

        let msg = `🗣️ <b>English Coach Feedback:</b>\n\n💬 ${coachResult.conversational_reply}\n\n`;
        if (coachResult.corrections?.length > 0) {
          msg += `🛠️ <b>Corrections:</b>\n`;
          coachResult.corrections.forEach(c => msg += `• <s>${c.original}</s> ➔ <b>${c.corrected}</b> (${c.reason})\n`);
        }
        return ctx.reply(msg, { parse_mode: 'HTML' });
      }

      const parsedResult = await parseWithGeminiPool(text, aiKeys, false);
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return executeParsedLifeActions(ctx, parsedResult, fromId);

    } catch (err) {
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return ctx.reply(`⚠️ تعذر فهم الرسالة: ${err.message}`);
    }
  });

  // ==============================================================================
  // 📷 4. Photo & Notes OCR
  // ==============================================================================
  bot.on(['photo', 'document'], async (ctx) => {
    const caption = ctx.message.caption || '';
    const photos = ctx.message.photo;
    const document = ctx.message.document;

    let fileId = null;
    if (photos && photos.length > 0) fileId = photos[photos.length - 1].file_id;
    else if (document && (document.mime_type?.startsWith('image/') || document.mime_type === 'application/pdf')) fileId = document.file_id;
    else return;

    const waitMsg = await ctx.reply('📸 <i>جاري فحص وتلخيص الصورة بالذكاء الاصطناعي (Gemini Vision)...</i>', { parse_mode: 'HTML' });

    try {
      const fileLink = await ctx.telegram.getFileLink(fileId);
      const photoBuffer = await downloadFileBuffer(fileLink.href);

      const aiKeys = await getStoredAiKeys();
      const analysis = await analyzeImageWithGemini(photoBuffer, aiKeys, caption);

      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

      // 🩺 1. Auto-detected Medical MCQ / Clinical Case
      if (analysis.detected_type === 'medical_quiz' || (analysis.medical_quiz && analysis.medical_quiz.question)) {
        const q = analysis.medical_quiz;
        const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
        await supabase.from('medical_spaced_quizzes').insert({
          course_code: q.course_code || 'CAD402',
          topic: q.topic || 'Clinical MCQ From Screenshot',
          question: q.question,
          answer_and_explanation: q.answer_and_explanation || 'الشرح المستخرج من الصورة',
          doctor_pearl: q.doctor_pearl || null,
          repetition_level: 0,
          next_review_at: nextReview
        });

        let msg = `🩺 <b>تم استخراج السؤال الطبي وإدراجه بالتكرار المتباعد بنجاح! 🎯</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📚 <b>الموديول:</b> [${q.course_code || 'CAD402'}] ${q.topic || ''}\n\n`;
        msg += `❓ <b>السؤال:</b>\n${q.question}\n\n`;
        msg += `💡 <b>الإجابة والشرح:</b>\n${q.answer_and_explanation}\n`;
        if (q.doctor_pearl) msg += `\n🔬 💡 <b>تريكة الراوند:</b> ${q.doctor_pearl}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n⏳ <i>تمت الجدولة للتثبيت والمراجعة التلقائية بعد 12 ساعة!</i>`;

        return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🩺 بنك كويزات الطب', callback_data: 'menu_med_spaced' }]] } });
      }

      // 🗣️ 2. Auto-detected English Flashcard
      if (analysis.detected_type === 'english_flashcard' || (analysis.english_flashcard && analysis.english_flashcard.term_or_sentence)) {
        const c = analysis.english_flashcard;
        const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
        await supabase.from('english_spaced_flashcards').insert({
          term_or_sentence: c.term_or_sentence,
          egyptian_translation: c.egyptian_translation || 'الترجمة بالمعنى الدارج',
          example_sentence: c.example_sentence || null,
          usage_context: c.usage_context || 'محادثة عامة',
          repetition_level: 0,
          next_review_at: nextReview
        });

        let msg = `🗣️ <b>تم استخراج الجملة الإنجليزية وجدولتها للتكرار المتباعد! 🌟</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🌟 <b>النص:</b> <b>${c.term_or_sentence}</b>\n`;
        msg += `🇪🇬 <b>الترجمة بالمصري:</b> <b>${c.egyptian_translation}</b>\n`;
        if (c.example_sentence) msg += `📝 <b>المثال:</b> <i>"${c.example_sentence}"</i>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n⏳ <i>تمت الجدولة للمراجعة والتثبيت بعد 12 ساعة!</i>`;

        return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🗣️ فلاش كاردز الإنجليزية', callback_data: 'menu_eng_spaced' }]] } });
      }

      // 📋 3. General Medical Document / Slide Note
      let generalMsg = `📋 <b>${analysis.summary_title || 'تحليل وتلخيص المستند / السلايد الطبي'}:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n${analysis.general_summary || JSON.stringify(analysis)}`;
      return ctx.reply(generalMsg, { parse_mode: 'HTML' });

    } catch (err) {
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return ctx.reply(`❌ فشل تحليل الصورة: ${err.message}`);
    }
  });

  // ==============================================================================
  // ⏱️ Live Real-time Activity & Commute Stopwatch Engine
  // ==============================================================================
  async function handleRealtimeActivity(ctx, text, fromId) {
    if (!text || !fromId) return false;
    const t = text.toLowerCase().trim();
    const session = await getUserSession(fromId);
    const active = session?.active_activity;

    // 1. Check if user wants to FINISH an active activity
    const isFinish = t.includes('رجعت') || t.includes('خلصت') || t.includes('وقفت') || t.includes('انتهيت') || t.includes('تم الانتهاء') || t.includes('جيت من') || t.includes('وصلت البيت');
    if (isFinish && active) {
      const elapsedMs = Date.now() - Number(active.startTime);
      const elapsedMins = Math.max(1, Math.round(elapsedMs / (60 * 1000)));
      const today = getCairoToday();
      let replyMsg = '';

      if (active.type === 'prayer') {
        replyMsg = `🕌 <b>تقبل الله صلاتك وطاعتك يا دكتور عبدالله! 🤍</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>مدة رحلة الصلاة والمسجد:</b> <b>${elapsedMins} دقيقة</b>\n📍 تم تسجيل وقت الذهاب والإياب بنجاح لحساب أوقات انتقالك اليومية بدقة!`;
      } else if (active.type === 'study') {
        const { data: pastSessions } = await supabase.from('study_sessions').select('duration_minutes').eq('date', today);
        let totalMins = elapsedMins;
        (pastSessions || []).forEach(s => totalMins += Number(s.duration_minutes || 0));

        await supabase.from('study_sessions').insert({
          course_code: active.course || 'CAD402',
          topic: active.topic || 'جلسة مذاكرة وتركيز',
          duration_minutes: elapsedMins,
          session_type: 'مذاكرة مركزة (Deep Work)',
          date: today
        });

        const totalHours = (totalMins / 60).toFixed(1);
        const remainingHours = Math.max(0, 3 - (totalMins / 60)).toFixed(1);
        const isGoalAchieved = totalMins >= 180;

        replyMsg = `📚 <b>عاش يا دكتور! تم توثيق جلسة المذاكرة بنجاح! 🎯</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>مدة الجلسة:</b> <b>${elapsedMins} دقيقة</b>\n📊 <b>إجمالي مذاكرة اليوم:</b> <b>${totalHours} / 3 ساعات</b>\n` +
          (isGoalAchieved 
            ? `🎉 <b>ألف مبروك! حققت هدفك اليومي الأساسي (3 ساعات مذاكرة على الأقل)! 👑</b>` 
            : `⏳ <b>متبقي على هدف الـ 3 ساعات:</b> <b>${remainingHours} ساعة</b>.`);
      } else if (active.type === 'gym') {
        await supabase.from('fitness_gym_logs').insert({
          workout_type: active.workout || 'تمرين عام',
          duration_minutes: elapsedMins,
          date: today
        });
        replyMsg = `🏋️‍♂️ <b>عاش يا بطل! تم إنهاء التمرين وتوثيق الجلسة! 💪</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>مدة التمرين:</b> <b>${elapsedMins} دقيقة</b>`;
      } else if (active.type === 'quran') {
        await supabase.from('quran_logs').insert({
          surah_name: active.surah || 'ورد التثبيت اليومي',
          session_type: 'ورد يومي',
          pages_count: 5,
          date: today
        });
        replyMsg = `📖 <b>كتب الله أجرك وثبّت القرآن في صدرك! 🤍</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>مدة الورد:</b> <b>${elapsedMins} دقيقة</b> (الهدف اليومي: 30 دقيقة)`;
      } else if (active.type === 'english') {
        await supabase.from('english_logs').insert({
          topic: 'ممارسة يومية',
          fluency_score: 90,
          date: today
        });
        replyMsg = `🗣️ <b>Great job, Dr. Abdallah! Session logged. 🌟</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>Duration:</b> <b>${elapsedMins} mins</b> (Goal: 30 mins)`;
      } else if (active.type === 'adhkar') {
        replyMsg = `📿 <b>تقبل الله ذكرك وطاعتك وشرح صدرك! 🌅</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>المدة:</b> <b>${elapsedMins} دقيقة</b>`;
      }

      await setUserSession(fromId, { ...session, active_activity: null });
      await ctx.reply(replyMsg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📊 ملخص اليوم', callback_data: 'menu_today' }]] } });
      return true;
    }

    // 2. Check if user wants to START an activity
    const isStartPrayer = (t.includes('نازل') || t.includes('رايح') || t.includes('داخل')) && (t.includes('صلي') || t.includes('صلاه') || t.includes('صلاة') || t.includes('مسجد') || t.includes('جامع'));
    const isStartStudy = (t.includes('داخل') || t.includes('هبدأ') || t.includes('بدأت') || t.includes('رايح')) && (t.includes('ذاكر') || t.includes('ذاكره') || t.includes('مذاكرة') || t.includes('session') || t.includes('دراسة'));
    const isStartGym = (t.includes('نازل') || t.includes('رايح') || t.includes('هبدأ')) && (t.includes('جيم') || t.includes('تمرن') || t.includes('تمرين') || t.includes('gym'));
    const isStartQuran = (t.includes('هبدأ') || t.includes('بدأت') || t.includes('هقرأ') || t.includes('داخل')) && (t.includes('قرآن') || t.includes('قرءان') || t.includes('مصحف') || t.includes('ورد'));
    const isStartEnglish = (t.includes('هبدأ') || t.includes('بدأت') || t.includes('داخل')) && (t.includes('إنجليزي') || t.includes('انجليزي') || t.includes('english'));
    const isStartAdhkar = (t.includes('هبدأ') || t.includes('بدأت') || t.includes('داخل')) && (t.includes('أذكار') || t.includes('اذكار'));

    let newActivity = null;
    if (isStartPrayer) newActivity = { type: 'prayer', name: 'الصلاة في المسجد', startTime: Date.now() };
    else if (isStartStudy) newActivity = { type: 'study', name: 'جلسة مذاكرة طب', startTime: Date.now(), course: 'CAD402' };
    else if (isStartGym) newActivity = { type: 'gym', name: 'تمرين الجيم', startTime: Date.now() };
    else if (isStartQuran) newActivity = { type: 'quran', name: 'ورد القرآن الكريم', startTime: Date.now() };
    else if (isStartEnglish) newActivity = { type: 'english', name: 'ممارسة الإنجليزية', startTime: Date.now() };
    else if (isStartAdhkar) newActivity = { type: 'adhkar', name: 'الأذكار والتدبر', startTime: Date.now() };

    if (newActivity) {
      await setUserSession(fromId, { ...session, active_activity: newActivity });
      const nowTimeStr = new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true });

      let msg = `⏱️ <b>تم بدء توقيت [${newActivity.name}] الآن! (${nowTimeStr}) 🚀</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
      if (newActivity.type === 'prayer') msg += `🕌 تقبل الله مقدماً يا دكتور! عندما ترجع البيت، قل للبوت <i>"رجعت من الصلاة"</i> أو اضغط الزر بالأسفل لحساب وقت المشوار.`;
      else if (newActivity.type === 'study') msg += `🩺 تركيز عميق وموفق يا دكتور! هدفك الأساسي لليوم: <b>3 ساعات مذاكرة</b>.\nعندما تنتهي، قل للبوت <i>"خلصت مذاكرة"</i> أو اضغط الزر بالأسفل.`;
      else if (newActivity.type === 'gym') msg += `💪 تمرين قوي وموفق يا بطل! عند الانتهاء قل <i>"خلصت تمرين"</i>.`;
      else if (newActivity.type === 'quran') msg += `📖 تدبر مبارك وسكينة لقلبك! هدفك اليومي: <b>30 دقيقة</b>.`;
      else if (newActivity.type === 'english') msg += `🗣️ Good luck! Daily Target: <b>30 mins</b>.`;
      else if (newActivity.type === 'adhkar') msg += `📿 حفظك الله ورعاك! عند الانتهاء قل <i>"خلصت الأذكار"</i>.`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '⏹️ إنهاء الجلسة وتوثيق الوقت', callback_data: `stop_activity_${newActivity.type}` }]
        ]
      };
      await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
      return true;
    }

    return false;
  }

  // ==============================================================================
  // ⚡ 5. Master Action Executor
  // ==============================================================================
  async function executeParsedLifeActions(ctx, result, fromId) {
    if (!result || !result.data) {
      return ctx.reply('⚠️ لم يتم التعرف على أي أنشطة محددة في رسالتك، يرجى توضيح التفاصيل.');
    }

    const { data } = result;
    const todayDate = data.date || getCairoToday();
    const insertedSummary = [];

    // 1. English Flashcards
    if (Array.isArray(data.english_flashcards) && data.english_flashcards.length > 0) {
      for (const card of data.english_flashcards) {
        if (card.term_or_sentence) {
          const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
          await supabase.from('english_spaced_flashcards').insert({
            term_or_sentence: card.term_or_sentence,
            egyptian_translation: card.egyptian_translation || 'ترجمة بالمعنى الدارج',
            example_sentence: card.example_sentence || null,
            usage_context: card.usage_context || 'محادثة عامة',
            repetition_level: 0,
            next_review_at: nextReview
          });
          insertedSummary.push(`🗣️ <b>فلاش كارد إنجليزي:</b> <b>${card.term_or_sentence}</b> (${card.egyptian_translation})`);
        }
      }
    }

    // 2. Medical Quizzes
    if (Array.isArray(data.medical_quizzes) && data.medical_quizzes.length > 0) {
      for (const q of data.medical_quizzes) {
        if (q.question) {
          const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
          await supabase.from('medical_spaced_quizzes').insert({
            course_code: q.course_code || 'CAD402',
            topic: q.topic || 'High-Yield Clinical Question',
            question: q.question,
            answer_and_explanation: q.answer_and_explanation || 'الإجابة النموذجية وتريكة الراوند',
            doctor_pearl: q.doctor_pearl || null,
            repetition_level: 0,
            next_review_at: nextReview
          });
          insertedSummary.push(`🩺 <b>كويز طبي [${q.course_code || 'CAD402'}]:</b> ${q.question.slice(0, 45)}...`);
        }
      }
    }

    // 3. Prayer Relative Reminders
    if (Array.isArray(data.prayer_relative_reminders) && data.prayer_relative_reminders.length > 0) {
      for (const pr of data.prayer_relative_reminders) {
        if (pr.prayer_name) {
          const targetTimeStr = getRelativePrayerTarget(pr.prayer_name, pr.offset_minutes || 30);
          const dueDateTime = `${todayDate}T${targetTimeStr}:00`;
          await supabase.from('appointments_and_reminders').insert({
            title: pr.title || `تذكير بعد ${pr.prayer_name}`,
            due_datetime: dueDateTime,
            notes: `محسوبة تلقائياً بعد أذان ${pr.prayer_name} بـ ${pr.offset_minutes || 30} دقيقة`,
            date: todayDate
          });
          insertedSummary.push(`🕌 <b>تذكير مرتبط بالصلاة:</b> ${pr.title || 'مهمة'} ➔ الساعة ${targetTimeStr}`);
        }
      }
    }

    // 4. Attendance
    if (Array.isArray(data.attendance) && data.attendance.length > 0) {
      for (const att of data.attendance) {
        if (att.session_title || att.course_code) {
          await supabase.from('attendance_logs').insert({
            course_code: att.course_code || 'CAD402',
            session_title: att.session_title || 'سيكشن عملي',
            status: att.status || 'حضور',
            reason: att.reason || null,
            makeup_plan: att.makeup_plan || null,
            date: todayDate
          });
          const icon = att.status === 'حضور' ? '✅' : '⚠️';
          insertedSummary.push(`${icon} <b>سجل السكاشن:</b> [${att.course_code || 'CAD402'}] ${att.session_title} (${att.status})`);
        }
      }
    }

    // 5. Mental Wellness
    if (data.mental_wellness && (data.mental_wellness.venting_content || data.mental_wellness.emotional_state)) {
      const mw = data.mental_wellness;
      await supabase.from('mental_wellness_logs').insert({
        mood_rating: Number(mw.mood_rating || 4),
        stress_level: mw.stress_level || 'معتدل',
        emotional_state: mw.emotional_state || 'تفريغ مشاعر',
        venting_content: mw.venting_content || 'دردشة عامة',
        ai_therapeutic_feedback: mw.ai_therapeutic_feedback || null,
        date: todayDate
      });
      insertedSummary.push(`🧠 <b>سجل الاتزان النفسي:</b> تم توثيق الفضفضة والمشاعر (المزاج: ⭐ ${mw.mood_rating || 4}/5)`);
    }

    // 6. Fasting & Sunnah
    if (data.fasting_worship && (data.fasting_worship.fasting_type || data.fasting_worship.sunan_rawatib_count != null || data.fasting_worship.adhkar_morning || data.fasting_worship.adhkar_evening)) {
      const fw = data.fasting_worship;
      const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', todayDate).maybeSingle();
      const payload = {
        date: todayDate,
        fasting_type: fw.fasting_type || existing?.fasting_type || null,
        fasting_completed: fw.fasting_completed != null ? fw.fasting_completed : (existing?.fasting_completed || false),
        sunan_rawatib_count: fw.sunan_rawatib_count != null ? Number(fw.sunan_rawatib_count) : (existing?.sunan_rawatib_count || 0),
        duha_prayer_done: fw.duha_prayer_done != null ? fw.duha_prayer_done : (existing?.duha_prayer_done || false),
        witr_prayer_done: fw.witr_prayer_done != null ? fw.witr_prayer_done : (existing?.witr_prayer_done || false),
        adhkar_morning: fw.adhkar_morning != null ? fw.adhkar_morning : (existing?.adhkar_morning || false),
        adhkar_evening: fw.adhkar_evening != null ? fw.adhkar_evening : (existing?.adhkar_evening || false)
      };
      await supabase.from('fasting_and_worship_logs').upsert(payload, { onConflict: 'date' });
      insertedSummary.push(`🌙 <b>الصيام والسنن والأذكار:</b> تم توثيق السنن والأذكار`);
    }

    // 7. Finance
    if (Array.isArray(data.finance) && data.finance.length > 0) {
      for (const f of data.finance) {
        const amt = Number(f.amount || 0);
        if (amt > 0) {
          const type = f.type || 'مصروف';
          const method = f.payment_method || 'خزنة شخصية';
          await supabase.from('personal_finance').insert({
            type: type,
            amount: amt,
            category: f.category || 'عام',
            payment_method: method,
            description: f.description || (type === 'إيراد' ? 'استلام نقدية' : 'مصروف شخصي'),
            date: todayDate
          });
          const factor = (type === 'إيراد') ? 1 : -1;
          await updateLiquidity(method, factor * amt);
          insertedSummary.push(`💵 <b>${type}:</b> <b>${formatEgp(amt)}</b> (${f.description || ''}) عبر ${method}`);
        }
      }
    }

    // 8. Thoughts
    if (Array.isArray(data.thoughts) && data.thoughts.length > 0) {
      for (const t of data.thoughts) {
        if (t.content) {
          await supabase.from('thoughts_and_wisdom').insert({
            content: t.content,
            category: t.category || 'فلسفة وانضباط',
            tags: Array.isArray(t.tags) ? t.tags : ['انضباط'],
            date: todayDate
          });
          insertedSummary.push(`💡 <b>خاطرة محفوظة:</b> <i>"${t.content}"</i>`);
        }
      }
    }

    // 9. Appointments
    if (Array.isArray(data.appointments) && data.appointments.length > 0) {
      for (const a of data.appointments) {
        if (a.title && a.due_datetime) {
          await supabase.from('appointments_and_reminders').insert({
            title: a.title,
            due_datetime: a.due_datetime,
            remind_at: a.remind_at || null,
            notes: a.notes || null,
            date: todayDate
          });
          insertedSummary.push(`⏰ <b>موعد مجدول:</b> <b>${a.title}</b> (${a.due_datetime.replace('T', ' ')})`);
        }
      }
    }

    // 10. Tasks
    if (Array.isArray(data.tasks) && data.tasks.length > 0) {
      for (const tk of data.tasks) {
        if (tk.title) {
          await supabase.from('daily_tasks').insert({
            title: tk.title,
            category: tk.category || 'مذاكرة',
            target_duration_mins: Number(tk.target_duration_mins || 0),
            status: tk.status || 'قيد التنفيذ',
            priority: tk.priority || 'متوسطة',
            date: todayDate
          });
          insertedSummary.push(`🎯 <b>مهمة مسجلة:</b> ${tk.title}`);
        }
      }
    }

    // 11. Quran
    if (Array.isArray(data.quran) && data.quran.length > 0) {
      for (const q of data.quran) {
        if (q.surah_name) {
          await supabase.from('quran_logs').insert({
            surah_name: q.surah_name,
            from_ayah: q.from_ayah ? Number(q.from_ayah) : null,
            to_ayah: q.to_ayah ? Number(q.to_ayah) : null,
            from_page: q.from_page ? Number(q.from_page) : null,
            to_page: q.to_page ? Number(q.to_page) : null,
            pages_count: Number(q.pages_count || 1),
            session_type: q.session_type || 'مراجعة تثبيت',
            mastery_status: q.mastery_status || 'متقن',
            quality_rating: Number(q.quality_rating || 5),
            date: todayDate
          });
          insertedSummary.push(`📖 <b>قرآن:</b> سورة ${q.surah_name} (${q.session_type})`);
        }
      }
    }

    // 12. Study Sessions
    if (Array.isArray(data.study) && data.study.length > 0) {
      for (const s of data.study) {
        if (s.topic || s.course_code) {
          await supabase.from('study_sessions').insert({
            course_code: s.course_code || 'CAD402',
            topic: s.topic || 'مذاكرة عامة',
            session_type: s.session_type || 'مذاكرة نظرية',
            duration_minutes: Number(s.duration_minutes || 0),
            pages_covered: Number(s.pages_covered || 0),
            comprehension_rating: Number(s.comprehension_rating || 5),
            was_rescheduled: Boolean(s.was_rescheduled),
            reschedule_reason: s.reschedule_reason || null,
            notes: s.notes || null,
            date: todayDate
          });
          if (s.was_rescheduled) {
            insertedSummary.push(`🔄 <b>إعادة جدولة مذاكرة:</b> [${s.course_code || 'CAD402'}] ${s.topic}`);
          } else {
            insertedSummary.push(`🩺 <b>مذاكرة طب [${s.course_code || 'CAD402'}]:</b> ${s.topic}`);
          }
        }
      }
    }

    // 13. Prayers & Habits (including sleep & wake-up)
    if (data.prayer_habits && Object.keys(data.prayer_habits).length > 0) {
      const p = data.prayer_habits;
      const { data: existing } = await supabase.from('prayers_and_habits').select('*').eq('date', todayDate).maybeSingle();
      const payload = {
        date: todayDate,
        fajr: p.fajr || existing?.fajr || 'لم يُسجل',
        dhuhr: p.dhuhr || existing?.dhuhr || 'لم يُسجل',
        asr: p.asr || existing?.asr || 'لم يُسجل',
        maghrib: p.maghrib || existing?.maghrib || 'لم يُسجل',
        isha: p.isha || existing?.isha || 'لم يُسجل',
        qiyam_night: p.qiyam_night != null ? p.qiyam_night : (existing?.qiyam_night || false),
        sunan_rawatib: p.sunan_rawatib != null ? Number(p.sunan_rawatib) : (existing?.sunan_rawatib || 0),
        adhkar_morning: p.adhkar_morning != null ? p.adhkar_morning : (existing?.adhkar_morning || false),
        adhkar_evening: p.adhkar_evening != null ? p.adhkar_evening : (existing?.adhkar_evening || false),
        sleep_hours: p.sleep_hours != null ? Number(p.sleep_hours) : (existing?.sleep_hours || 0),
        wake_up_time: p.wake_up_time || existing?.wake_up_time || null,
        sleep_bedtime: p.sleep_bedtime || existing?.sleep_bedtime || null,
        workout_done: p.workout_done != null ? p.workout_done : (existing?.workout_done || false),
        energy_level: p.energy_level != null ? Number(p.energy_level) : (existing?.energy_level || 5)
      };
      await supabase.from('prayers_and_habits').upsert(payload, { onConflict: 'date' });
      if (p.sleep_hours > 0) {
        insertedSummary.push(`💤 <b>سجل النوم والاستيقاظ:</b> نمت (${p.sleep_hours} ساعات)`);
      }
    }

    let card = `✅ <b>تم استيعاب وتوثيق إنجازاتك بالمنظومة فوراً! 🎯</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    if (result.summary_text) card += `${result.summary_text}\n\n`;
    if (data.mental_wellness?.ai_therapeutic_feedback) {
      card += `💬 <b>رسالة دعم وتوجيه نفسي وطبي:</b>\n<i>${data.mental_wellness.ai_therapeutic_feedback}</i>\n\n`;
    }
    if (insertedSummary.length > 0) {
      card += `📌 <b>سجلات تم تثبيتها (${todayDate}):</b>\n`;
      insertedSummary.forEach(s => card += `• ${s}\n`);
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }, { text: '🎯 عرض المهام والمواعيد', callback_data: 'menu_tasks' }],
        [{ text: '🗣️ فلاش كاردز الإنجليزية', callback_data: 'menu_eng_spaced' }, { text: '🩺 كويزات الطب', callback_data: 'menu_med_spaced' }]
      ]
    };

    return ctx.reply(card, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  // ==============================================================================
  // 🔘 6. Interactive Action Handlers & 24-Hour Undo Engine
  // ==============================================================================

  // 0. Stop Real-time Activity Button
  bot.action(/^stop_activity_(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id;
    await ctx.answerCbQuery('⏱️ جاري حساب وتوثيق الوقت...');
    return handleRealtimeActivity(ctx, 'خلصت ورجعت', fromId);
  });

  // 1. Water Intake
  bot.action(/^ack_water_done_(.+?)_(\d+)$/, async (ctx) => {
    const [, date, hour] = ctx.match;
    const now = Date.now();
    const { data: existing } = await supabase.from('prayers_and_habits').select('*').eq('date', date).maybeSingle();
    const currentWater = Number(existing?.water_liters || 0) + 0.4;
    await supabase.from('prayers_and_habits').upsert({ date, water_liters: currentWater }, { onConflict: 'date' });

    await ctx.answerCbQuery('💧 صحة وعافية! تم تسجيل شرب الماء');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل الماء', callback_data: `undo_water_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText(
      `✅ <b>تم شرب الماء وتجديد نشاط الدماغ! 💧🧠</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 <b>إجمالي اليوم:</b> <b>${currentWater.toFixed(1)} لتر</b>\n` +
      `⏱️ <i>يمكنك التراجع خلال 24 ساعة بالضغط على الزر أدناه:</i>`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    ).catch(() => {});
  });

  bot.action(/^undo_water_(.+?)_(\d+)$/, async (ctx) => {
    const [, date, actionTime] = ctx.match;
    if (isUndoExpired(actionTime)) {
      return ctx.answerCbQuery('⛔ عذراً، انتهت صلاحية التراجع (مرت أكثر من 24 ساعة)', { show_alert: true });
    }

    const { data: existing } = await supabase.from('prayers_and_habits').select('*').eq('date', date).maybeSingle();
    const reverted = Math.max(0, Number(existing?.water_liters || 0) - 0.4);
    await supabase.from('prayers_and_habits').upsert({ date, water_liters: reverted }, { onConflict: 'date' });

    await ctx.answerCbQuery('↩️ تم التراجع عن تسجيل الماء بنجاح!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '✅ شربت الماء وتمددت', callback_data: `ack_water_done_${date}_12` }]
      ]
    };

    return ctx.editMessageText(
      `💧 <b>تذكير الترطيب وتجديد طاقة الدماغ:</b>\n` +
      `🩺 اشرب الآن كوب ماء بارد (300-500 مل) وتمدد لإنعاش دورتك الدموية! 🧠✨`,
      { parse_mode: 'HTML', reply_markup: keyboard }
    ).catch(() => {});
  });

  // 2. Daily Tasks
  bot.action(/^ack_task_done_(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const now = Date.now();
    await supabase.from('daily_tasks').update({ status: 'تم الإنجاز' }).eq('id', taskId);
    await ctx.answerCbQuery('🎉 تم تأكيد إنجاز المهمة بنجاح!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن إنجاز المهمة', callback_data: `undo_task_${taskId}_${now}` }]
      ]
    };

    return ctx.editMessageText(
      '✅ <b>تم إنجاز المهمة بنجاح وتوثيقها في سجلات إنجازاتك اليومية! 🎯</b>\n\n' +
      '⏱️ <i>يمكنك التراجع خلال 24 ساعة إذا تم الضغط بالخطأ:</i>',
      { parse_mode: 'HTML', reply_markup: keyboard }
    ).catch(() => {});
  });

  bot.action(/^undo_task_(.+?)_(\d+)$/, async (ctx) => {
    const [, taskId, actionTime] = ctx.match;
    if (isUndoExpired(actionTime)) {
      return ctx.answerCbQuery('⛔ عذراً، لا يمكن التراجع بعد مرور 24 ساعة', { show_alert: true });
    }

    await supabase.from('daily_tasks').update({ status: 'قيد التنفيذ' }).eq('id', taskId);
    await ctx.answerCbQuery('↩️ تم التراجع وإعادة المهمة لقيد التنفيذ');

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ تم إنجاز المهمة', callback_data: `ack_task_done_${taskId}` },
          { text: '⏳ تأجيل المهمة لبكرة', callback_data: `ack_task_defer_${taskId}` }
        ]
      ]
    };

    return ctx.editMessageText(
      '🎯 <b>متابعة إنجاز المهمة يا دكتور:</b>\n' +
      '📌 تم استعادة حالة المهمة إلى <b>قيد التنفيذ</b>.\n\n' +
      '👇 <i>اضغط عند الإنجاز:</i>',
      { parse_mode: 'HTML', reply_markup: keyboard }
    ).catch(() => {});
  });

  bot.action(/^ack_task_defer_(.+)$/, async (ctx) => {
    const taskId = ctx.match[1];
    const now = Date.now();
    await supabase.from('daily_tasks').update({ status: 'مؤجل' }).eq('id', taskId);
    await ctx.answerCbQuery('⏳ تم تأجيل المهمة');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ إلغاء التأجيل وإعادتها لقيد التنفيذ', callback_data: `undo_task_${taskId}_${now}` }]
      ]
    };

    return ctx.editMessageText('⏳ <b>تم تأجيل المهمة وإعادة جدولتها بسلاسة دون تراكم.</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  // 3. Morning Adhkar
  bot.action(/^ack_adhkar_morning_(.+)$/, async (ctx) => {
    const date = ctx.match[1] || getCairoToday();
    const now = Date.now();
    const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', date).maybeSingle();
    await supabase.from('fasting_and_worship_logs').upsert({ date, adhkar_morning: true, sunan_rawatib_count: existing?.sunan_rawatib_count || 0 }, { onConflict: 'date' });
    await ctx.answerCbQuery('📿 تقبل الله أذكار الصباح!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل أذكار الصباح', callback_data: `undo_adhkar_morning_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText('✅ <b>تم قراءة أذكار الصباح وحفظها في سجل اليوم بنجاح! 🌅</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^undo_adhkar_morning_(.+?)_(\d+)$/, async (ctx) => {
    const [, date, actionTime] = ctx.match;
    if (isUndoExpired(actionTime)) return ctx.answerCbQuery('⛔ انتهت صلاحية التراجع (24 ساعة)', { show_alert: true });

    await supabase.from('fasting_and_worship_logs').upsert({ date, adhkar_morning: false }, { onConflict: 'date' });
    await ctx.answerCbQuery('↩️ تم التراجع بنجاح');

    const keyboard = {
      inline_keyboard: [[{ text: '✅ قرأت أذكار الصباح', callback_data: `ack_adhkar_morning_${date}` }]]
    };
    return ctx.editMessageText('🌅 <b>أذكار الصباح وحصن المسلم:</b>\n📿 اضغط لتأكيد القراءة عند الانتهاء:', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  // 4. Evening Adhkar
  bot.action(/^ack_adhkar_evening_(.+)$/, async (ctx) => {
    const date = ctx.match[1] || getCairoToday();
    const now = Date.now();
    const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', date).maybeSingle();
    await supabase.from('fasting_and_worship_logs').upsert({ date, adhkar_evening: true, sunan_rawatib_count: existing?.sunan_rawatib_count || 0 }, { onConflict: 'date' });
    await ctx.answerCbQuery('📿 تقبل الله أذكار المساء!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل أذكار المساء', callback_data: `undo_adhkar_evening_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText('✅ <b>تم قراءة أذكار المساء وتوثيقها في سجل اليوم بنجاح! 🌇</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^undo_adhkar_evening_(.+?)_(\d+)$/, async (ctx) => {
    const [, date, actionTime] = ctx.match;
    if (isUndoExpired(actionTime)) return ctx.answerCbQuery('⛔ انتهت صلاحية التراجع (24 ساعة)', { show_alert: true });

    await supabase.from('fasting_and_worship_logs').upsert({ date, adhkar_evening: false }, { onConflict: 'date' });
    await ctx.answerCbQuery('↩️ تم التراجع بنجاح');

    const keyboard = {
      inline_keyboard: [[{ text: '✅ قرأت أذكار المساء', callback_data: `ack_adhkar_evening_${date}` }]]
    };
    return ctx.editMessageText('🌇 <b>أذكار المساء وسكينة النفس:</b>\n📿 اضغط لتأكيد القراءة:', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  // 5. Duha Prayer
  bot.action(/^ack_duha_done_(.+)$/, async (ctx) => {
    const date = ctx.match[1] || getCairoToday();
    const now = Date.now();
    const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', date).maybeSingle();
    await supabase.from('fasting_and_worship_logs').upsert({ date, duha_prayer_done: true, sunan_rawatib_count: (existing?.sunan_rawatib_count || 0) + 2 }, { onConflict: 'date' });
    await ctx.answerCbQuery('☀️ تقبل الله صلاة الضحى!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل الضحى', callback_data: `undo_duha_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText('✅ <b>تم صلاة الضحى وإضافتها لسجل السنن بنجاح! ☀️</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^undo_duha_(.+?)_(\d+)$/, async (ctx) => {
    const [, date, actionTime] = ctx.match;
    if (isUndoExpired(actionTime)) return ctx.answerCbQuery('⛔ انتهت صلاحية التراجع (24 ساعة)', { show_alert: true });

    const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', date).maybeSingle();
    await supabase.from('fasting_and_worship_logs').upsert({ date, duha_prayer_done: false, sunan_rawatib_count: Math.max(0, (existing?.sunan_rawatib_count || 0) - 2) }, { onConflict: 'date' });
    await ctx.answerCbQuery('↩️ تم التراجع بنجاح');

    const keyboard = {
      inline_keyboard: [[{ text: '✅ صليت صلاة الضحى', callback_data: `ack_duha_done_${date}` }]]
    };
    return ctx.editMessageText('☀️ <b>صلاة الأوابين (صلاة الضحى):</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  // 6. Witr Prayer
  bot.action(/^ack_witr_done_(.+)$/, async (ctx) => {
    const date = ctx.match[1] || getCairoToday();
    const now = Date.now();
    const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', date).maybeSingle();
    await supabase.from('fasting_and_worship_logs').upsert({ date, witr_prayer_done: true, sunan_rawatib_count: existing?.sunan_rawatib_count || 0 }, { onConflict: 'date' });
    await ctx.answerCbQuery('🌌 تقبل الله صلاة الوتر!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل الوتر', callback_data: `undo_witr_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText('✅ <b>تم صلاة الوتر والقيام بنجاح! نوم هادئ ومبارك يا دكتور عبدالله. 🌌</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^undo_witr_(.+?)_(\d+)$/, async (ctx) => {
    const [, date, actionTime] = ctx.match;
    if (isUndoExpired(actionTime)) return ctx.answerCbQuery('⛔ انتهت صلاحية التراجع (24 ساعة)', { show_alert: true });

    await supabase.from('fasting_and_worship_logs').upsert({ date, witr_prayer_done: false }, { onConflict: 'date' });
    await ctx.answerCbQuery('↩️ تم التراجع بنجاح');

    const keyboard = {
      inline_keyboard: [[{ text: '✅ صليت الوتر بحمد الله', callback_data: `ack_witr_done_${date}` }]]
    };
    return ctx.editMessageText('🌌 <b>صلاة الوتر والختام المبارك لليوم:</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  // 7. Section Attendance
  bot.action(/^ack_section_attend_(.+?)_(.+)$/, async (ctx) => {
    const [, code, date] = ctx.match;
    const now = Date.now();
    await supabase.from('attendance_logs').insert({ course_code: code, session_title: `راوند / سيكشن [${code}]`, status: 'حضور', date: date || getCairoToday() });
    await ctx.answerCbQuery('✅ تم تأكيد حضور الراوند!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل الحضور', callback_data: `undo_att_${code}_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText(`✅ <b>تم توثيق حضورك في راوند [${code}] وزيادة نسبة الالتزام الجامعي! 🩺</b>`, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^ack_section_absent_(.+?)_(.+)$/, async (ctx) => {
    const [, code, date] = ctx.match;
    const now = Date.now();
    await supabase.from('attendance_logs').insert({ course_code: code, session_title: `راوند / سيكشن [${code}]`, status: 'غياب بعذر', reason: 'عذر طارئ', makeup_plan: 'مراجعة تسجيل المحاضرة وسلايدات الراوند', date: date || getCairoToday() });
    await ctx.answerCbQuery('⚠️ تم تسجيل الغياب');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل الغياب', callback_data: `undo_att_${code}_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText(`⚠️ <b>تم تسجيل غياب بعذر في [${code}] مع إدراج خطة تعويض للمحتوى.</b>`, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^undo_att_(.+?)_(.+?)_(\d+)$/, async (ctx) => {
    const [, code, date, actionTime] = ctx.match;
    if (isUndoExpired(actionTime)) return ctx.answerCbQuery('⛔ انتهت صلاحية التراجع (24 ساعة)', { show_alert: true });

    await supabase.from('attendance_logs').delete().match({ course_code: code, date: date });
    await ctx.answerCbQuery('↩️ تم حذف السجل وإلغاء التسجيل');

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ تم الحضور بالراوند', callback_data: `ack_section_attend_${code}_${date}` },
          { text: '⚠️ غياب بعذر', callback_data: `ack_section_absent_${code}_${date}` }
        ]
      ]
    };

    return ctx.editMessageText(`⏰ <b>تذكير بموعد سيكشن [${code}]:</b>\n👇 اختر الإجراء:`, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  // Fasting Intent & Suhur
  bot.action(/^ack_fasting_intent_(.+?)_(.+)$/, async (ctx) => {
    const [, date, dayName] = ctx.match;
    await ctx.answerCbQuery('🌙 نية مباركة وتقبل الله صيامك!');
    return ctx.editMessageText(`✅ <b>تم تسجيل نية صيام سنة يوم ${dayName} وتجهيز تنبيه السحور قبل الفجر بساعة! 🌙</b>`, { parse_mode: 'HTML' }).catch(() => {});
  });

  bot.action(/^ack_suhur_done_(.+)$/, async (ctx) => {
    const date = ctx.match[1] || getCairoToday();
    await supabase.from('fasting_and_worship_logs').upsert({ date, fasting_type: 'صيام سنة', fasting_completed: true }, { onConflict: 'date' });
    await ctx.answerCbQuery('🥣 صحة وعافية وصياماً مقبولاً!');
    return ctx.editMessageText('✅ <b>تم توثيق السحور وبداية يوم الصيام بنجاح! صياماً مقبولاً وعملاً متقبلاً. 🤍</b>', { parse_mode: 'HTML' }).catch(() => {});
  });

  // Spaced Repetition Flashcards
  bot.action(/^reveal_eng_(.+)$/, async (ctx) => {
    const cardId = ctx.match[1];
    const { data: card } = await supabase.from('english_spaced_flashcards').select('*').eq('id', cardId).maybeSingle();
    if (!card) return ctx.answerCbQuery('تعذر العثور على الفلاش كارد');
    await ctx.answerCbQuery();

    let msg = `🧠 <b>فلاش كارد إنجليزي (Spaced Repetition):</b>\n━━━━━━━━━━━━━━━━━━━━━\n🌟 <b>${card.term_or_sentence}</b>\n\n🇪🇬 <b>الترجمة بالمصري:</b> <b>${card.egyptian_translation}</b>\n`;
    if (card.example_sentence) msg += `📝 <b>المثال:</b> <i>"${card.example_sentence}"</i>\n`;
    msg += `\n📊 المستوى: <b>${card.repetition_level || 0}/6</b>\n\n👇 <i>كيف كان استرجاعك؟</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🟢 حفظتها تمام (Level Up)', callback_data: `pass_eng_${card.id}_${card.repetition_level || 0}` },
          { text: '🔴 نسيتها (إعادة تثبيت)', callback_data: `fail_eng_${card.id}` }
        ]
      ]
    };
    return ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^pass_eng_(.+?)_(\d+)$/, async (ctx) => {
    const [, cardId, curLvl] = ctx.match;
    const { nextLevel, nextReviewDate, isMastered } = getNextSpacedReviewDate(Number(curLvl), true);
    await supabase.from('english_spaced_flashcards').update({ repetition_level: nextLevel, next_review_at: nextReviewDate, is_mastered: isMastered, last_reviewed_at: new Date().toISOString() }).eq('id', cardId);
    await ctx.answerCbQuery('🎉 تم رفع مستوى الحفظ والتثبيت!');
    return ctx.editMessageText(`🎉 <b>إتقان ممتاز يا دكتور! تم رفع المستوى إلى (${nextLevel}/6) 🎯</b>`, { parse_mode: 'HTML' }).catch(() => {});
  });

  bot.action(/^fail_eng_(.+)$/, async (ctx) => {
    const cardId = ctx.match[1];
    const { nextLevel, nextReviewDate } = getNextSpacedReviewDate(0, false);
    await supabase.from('english_spaced_flashcards').update({ repetition_level: nextLevel, next_review_at: nextReviewDate, last_reviewed_at: new Date().toISOString() }).eq('id', cardId);
    await ctx.answerCbQuery('تم جدولتها بعد 12 ساعة لتثبيتها');
    return ctx.editMessageText('🔄 <b>تمت إعادة جدولة الكلمة بعد 12 ساعة لتثبيتها في الذاكرة طويلة المدى! 🧠</b>', { parse_mode: 'HTML' }).catch(() => {});
  });

  // Reveal Medical Quiz
  bot.action(/^reveal_med_(.+)$/, async (ctx) => {
    const quizId = ctx.match[1];
    const { data: q } = await supabase.from('medical_spaced_quizzes').select('*').eq('id', quizId).maybeSingle();
    if (!q) return ctx.answerCbQuery('تعذر العثور على السؤال');
    await ctx.answerCbQuery();

    let msg = `🩺 <b>سؤال سريري [${q.course_code}]:</b>\n━━━━━━━━━━━━━━━━━━━━━\n❓ <b>السؤال:</b>\n${q.question}\n\n💡 <b>الإجابة والشرح:</b>\n${q.answer_and_explanation}\n`;
    if (q.doctor_pearl) msg += `\n🔬 <b>تريكة الراوند:</b> ${q.doctor_pearl}\n`;
    msg += `\n📊 المستوى: <b>${q.repetition_level || 0}/6</b>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🟢 متقنة 100% (Level Up)', callback_data: `pass_med_${q.id}_${q.repetition_level || 0}` },
          { text: '🔴 محتاجة تثبيت', callback_data: `fail_med_${q.id}` }
        ]
      ]
    };
    return ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^pass_med_(.+?)_(\d+)$/, async (ctx) => {
    const [, quizId, curLvl] = ctx.match;
    const { nextLevel, nextReviewDate, isMastered } = getNextSpacedReviewDate(Number(curLvl), true);
    await supabase.from('medical_spaced_quizzes').update({ repetition_level: nextLevel, next_review_at: nextReviewDate, is_mastered: isMastered, last_reviewed_at: new Date().toISOString() }).eq('id', quizId);
    await ctx.answerCbQuery('🩺 ممتاز! تم تثبيت المعلومة');
    return ctx.editMessageText(`🎯 <b>إتقان طبي ممتاز يا دكتور! المستوى: (${nextLevel}/6) 🩺</b>`, { parse_mode: 'HTML' }).catch(() => {});
  });

  bot.action(/^fail_med_(.+)$/, async (ctx) => {
    const quizId = ctx.match[1];
    const { nextLevel, nextReviewDate } = getNextSpacedReviewDate(0, false);
    await supabase.from('medical_spaced_quizzes').update({ repetition_level: nextLevel, next_review_at: nextReviewDate, last_reviewed_at: new Date().toISOString() }).eq('id', quizId);
    await ctx.answerCbQuery('تم جدولتها للمراجعة القريبة');
    return ctx.editMessageText('🔄 <b>تمت إعادة جدولة السؤال بعد 12 ساعة لتثبيته! 🩺</b>', { parse_mode: 'HTML' }).catch(() => {});
  });

  // Submenu Actions
  bot.action('menu_eng_spaced', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: cards } = await supabase.from('english_spaced_flashcards').select('*').order('created_at', { ascending: false }).limit(6);
    let msg = `🗣️ <b>بنك الكلمات والجمل الإنجليزية (Spaced Repetition):</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    if (!cards || cards.length === 0) msg += `✨ <i>لا توجد كلمات محفوظة بعد. أرسل أي كلمة أو جملة وسيترجمها البوت بالمصري ويجدولها للمراجعة!</i>\n`;
    else cards.forEach(c => msg += `• 🌟 <b>${c.term_or_sentence}</b> (${c.egyptian_translation}) [مستوى: ${c.repetition_level || 0}/6]\n`);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_med_spaced', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: quizzes } = await supabase.from('medical_spaced_quizzes').select('*').order('created_at', { ascending: false }).limit(6);
    let msg = `🩺 <b>بنك أسئلة وكويزات الموديولات الطبية (Spaced Quizzes):</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    if (!quizzes || quizzes.length === 0) msg += `✨ <i>لا توجد أسئلة مسجلة بعد.</i>\n`;
    else quizzes.forEach(q => msg += `• 🩺 [${q.course_code}] <b>${q.question.slice(0, 50)}...</b> [مستوى: ${q.repetition_level || 0}/6]\n`);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_academic', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: schedule } = await supabase.from('academic_schedule').select('*').eq('is_active', true);
    const { data: att } = await supabase.from('attendance_logs').select('*').limit(5);

    let msg = `🩺 <b>خطة الفصل الدراسي السابع والسكاشن:</b>\n━━━━━━━━━━━━━━━━━━━━━\n🎯 <b>المجموع:</b> 450 درجة | 20 ساعة\n\n📅 <b>جدول السكاشن:</b>\n`;
    (schedule || []).forEach(s => msg += `• <b>${s.day_of_week}:</b> [${s.course_code}] ${s.title} (⏰ ${s.start_time})\n`);
    if (att && att.length > 0) {
      msg += `\n📝 <b>سجل الحضور الأخير:</b>\n`;
      att.forEach(a => msg += `• ${a.status === 'حضور' ? '✅' : '⚠️'} [${a.course_code}] ${a.session_title} (${a.status})\n`);
    }
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🧪 كويز سريري سريع (OSCE)', callback_data: 'menu_quiz' }], [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_fasting', async (ctx) => {
    await ctx.answerCbQuery();
    const today = getCairoToday();
    const { data: fw } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', today).maybeSingle();
    let msg = `🌙 <b>سجل الصيام والسنن والأذكار (${today}):</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `• 🥣 <b>الصيام:</b> ${fw?.fasting_type ? `${fw.fasting_type} (${fw.fasting_completed ? '✅ صائم' : 'قيد الصيام'})` : 'غير مسجل ⚪'}\n`;
    msg += `• 🕌 <b>السنن الرواتب:</b> <b>${fw?.sunan_rawatib_count || 0}</b> ركعة (الهدف: 12 ركعة)\n`;
    msg += `• ☀️ <b>صلاة الضحى:</b> ${fw?.duha_prayer_done ? '✅ تم بحمد الله' : '⚪'}\n`;
    msg += `• 🌌 <b>صلاة الوتر:</b> ${fw?.witr_prayer_done ? '✅ تم بحمد الله' : '⚪'}\n`;
    msg += `• 📿 <b>أذكار الصباح:</b> ${fw?.adhkar_morning ? '✅' : '⚪'} | <b>المساء:</b> ${fw?.adhkar_evening ? '✅' : '⚪'}`;
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_wellness', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: logs } = await supabase.from('mental_wellness_logs').select('*').order('created_at', { ascending: false }).limit(3);
    let msg = `🧠 <b>سجل الاتزان النفسي والفضفضة:</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    if (!logs || logs.length === 0) {
      msg += `✨ <i>لم تسجل أي فضفضة بعد. ابدأ فويس بـ "دردشة عامة / فضفضة..." وسيقوم البوت بالاستماع والدعم فوراً!</i>\n`;
    } else {
      logs.forEach(l => {
        msg += `📅 <b>${l.date}:</b> حالة: ${l.emotional_state} (⭐ ${l.mood_rating}/5)\n`;
        if (l.ai_therapeutic_feedback) msg += `   └ 💬 <i>"${l.ai_therapeutic_feedback.slice(0, 140)}..."</i>\n\n`;
      });
    }
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_quran', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: logs } = await supabase.from('quran_logs').select('*').order('created_at', { ascending: false }).limit(6);
    let msg = `📖 <b>سجل وخطة المصحف وتثبيت الحفظ:</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    if (!logs || logs.length === 0) msg += `✨ <i>لم يتم تسجيل ورد قرآني بعد.</i>\n`;
    else {
      logs.forEach(l => {
        const starCount = Math.max(1, Math.min(5, Number(l.quality_rating || 5)));
        msg += `• 🕌 <b>سورة ${l.surah_name}</b> (${l.session_type})\n   └ حالة الحفظ: <b>${l.mastery_status || 'متقن'}</b> | ${'⭐'.repeat(starCount)} (📅 ${l.date})\n`;
      });
    }
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_gym', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: rows } = await supabase.from('fitness_gym_logs').select('*').order('date', { ascending: false }).limit(5);
    let msg = `🏋️‍♂️ <b>قسم الجيم واللياقة والبدنية:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (!rows || rows.length === 0) msg += `✨ <i>لم تسجل تمارين بعد.</i>\n`;
    else rows.forEach(r => msg += `• 🏋️ <b>${r.workout_type}</b> (${r.muscle_groups || ''}) | ⏱️ ${r.duration_minutes || 45} دقيقة\n`);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_content', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: rows } = await supabase.from('content_creation').select('*').order('created_at', { ascending: false }).limit(5);
    let msg = `🎬 <b>قسم صناعة المحتوى والمونتاج:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (!rows || rows.length === 0) msg += `✨ <i>لم تسجل أفكار فيديوهات بعد.</i>\n`;
    else rows.forEach(r => msg += `• 🎬 <b>${r.title}</b> [${r.platform}] | المرحلة: <b>${r.stage}</b>\n`);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_work', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: rows } = await supabase.from('work_projects').select('*').order('created_at', { ascending: false }).limit(5);
    let msg = `💼 <b>قسم الشغل ومشاريع البيزنس:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (!rows || rows.length === 0) msg += `✨ <i>لا توجد مهام عمل مسجلة.</i>\n`;
    else rows.forEach(r => msg += `• 💼 <b>[${r.project_name}]</b> ${r.task_description} | الحالة: <b>${r.status}</b>\n`);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_tasks', async (ctx) => {
    await ctx.answerCbQuery();
    const today = getCairoToday();
    const { data: tasks } = await supabase.from('daily_tasks').select('*').eq('date', today);
    const { data: appts } = await supabase.from('appointments_and_reminders').select('*').gte('due_datetime', today).order('due_datetime', { ascending: true }).limit(5);

    let msg = `🎯 <b>المهام والمواعيد الذكية:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n📋 <b>مهام اليوم (${today}):</b>\n`;
    if (!tasks || tasks.length === 0) msg += `• <i>لا توجد مهام مسجلة اليوم.</i>\n`;
    else tasks.forEach(t => msg += `• ${t.status === 'تم الإنجاز' ? '✅' : (t.status === 'مؤجل' ? '⏳' : '🟡')} <b>${t.title}</b> [${t.status}]\n`);

    msg += `\n⏰ <b>المواعيد القادمة:</b>\n`;
    if (!appts || appts.length === 0) msg += `• <i>لا توجد مواعيد قادمة.</i>\n`;
    else appts.forEach(a => msg += `• 🔔 <b>${a.title}</b> ➔ <code>${a.due_datetime.replace('T', ' ').slice(0, 16)}</code>\n`);

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_thoughts', async (ctx) => {
    await ctx.answerCbQuery();
    const { data: thoughts } = await supabase.from('thoughts_and_wisdom').select('*').order('created_at', { ascending: false }).limit(5);
    let msg = `💡 <b>بنك الخواطر والأفكار:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    if (!thoughts || thoughts.length === 0) msg += `✨ <i>لا توجد خواطر مسجلة بعد.</i>\n`;
    else thoughts.forEach((th, idx) => msg += `<b>${idx + 1}.</b> 🌟 <i>"${th.content}"</i> (📅 ${th.date})\n\n`);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_english', async (ctx) => {
    await ctx.answerCbQuery();
    const fromId = ctx.from?.id;
    if (fromId) await setUserSession(fromId, { mode: 'english_coach' });
    let msg = `🗣️ <b>وضع مدرب الإنجليزية الصوتي الذكي (Active English Coach):</b>\n━━━━━━━━━━━━━━━━━━━━━\n✨ تم تفعيل وضع المحادثة! تحدث بالإنجليزية وسيرد عليك البوت صوتياً وتحليلياً.`;
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔄 إنهاء وضع الإنجليزية والعودة', callback_data: 'exit_english_mode' }]] } });
  });

  bot.action('exit_english_mode', async (ctx) => {
    const fromId = ctx.from?.id;
    if (fromId) await setUserSession(fromId, { mode: 'default' });
    await ctx.answerCbQuery('تم الرجوع للوضع العام');
    return ctx.reply('✅ <b>تم الرجوع إلى وضع إدارة الحياة العام بنجاح.</b>');
  });

  bot.action('menu_quiz', async (ctx) => {
    await ctx.answerCbQuery('⏳ جاري توليد حالة سريرية ذكية...');
    const waitMsg = await ctx.reply('🧠 <i>جاري تحضير حالة سريرية وسؤال تفاعلي للترم السابع...</i>', { parse_mode: 'HTML' });
    try {
      const aiKeys = await getStoredAiKeys();
      const quiz = await generateMedicalQuiz('CAD402 / PED401', 'High-Yield Clinical Pearls', aiKeys);
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      let msg = `🩺 <b>حالة إكلينيكية تفاعلية (Clinical Challenge):</b>\n━━━━━━━━━━━━━━━━━━━━━\n📋 <b>السيناريو:</b>\n${quiz.case_scenario}\n\n❓ <b>السؤال:</b>\n<b>${quiz.question}</b>\n`;
      const keyboardButtons = (quiz.options || []).map((opt, idx) => {
        const isCorrect = idx === quiz.correct_option_index ? '1' : '0';
        return [{ text: opt, callback_data: `qans_${idx}_${isCorrect}` }];
      });
      const fromId = ctx.from?.id;
      if (fromId) await setUserSession(fromId, { activeQuiz: quiz, timestamp: Date.now() });
      return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboardButtons });
    } catch (err) {
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return ctx.reply(`❌ تعذر توليد الكويز: ${err.message}`);
    }
  });

  bot.action(/^qans_(\d+)_(0|1)$/, async (ctx) => {
    const [, optIdx, isCorrectStr] = ctx.match;
    const isCorrect = isCorrectStr === '1';
    const fromId = ctx.from?.id;
    const sess = fromId ? await getUserSession(fromId) : null;
    const quiz = sess?.activeQuiz;
    await ctx.answerCbQuery(isCorrect ? '🎯 إجابة صحيحة وممتازة!' : '❌ إجابة غير دقيقة!');
    let msg = isCorrect ? `🎉 <b>إجابة ممتازة يا دكتور عبدالله! إجابة صحيحة 🎯</b>\n\n` : `⚠️ <b>الإجابة غير صحيحة، النموذجية هي: (${quiz?.options?.[quiz.correct_option_index] || ''})</b>\n\n`;
    if (quiz?.explanation) msg += `🔬 <b>الشرح الطبي:</b>\n${quiz.explanation}\n\n`;
    if (quiz?.osce_tip) msg += `💡 <b>نصيحة الـ OSCE:</b>\n${quiz.osce_tip}\n`;
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🧪 سؤال سريري آخر', callback_data: 'menu_quiz' }], [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_finance', async (ctx) => {
    await ctx.answerCbQuery();
    const today = getCairoToday();
    const { data: rows } = await supabase.from('personal_finance').select('*').gte('date', today);
    let income = 0;
    let expense = 0;
    (rows || []).forEach(r => {
      if (r.type === 'إيراد') income += Number(r.amount || 0);
      else expense += Number(r.amount || 0);
    });
    let msg = `💵 <b>الخزنة والمصروفات الشخصية:</b>\n━━━━━━━━━━━━━━━━━━━━━\n🟢 <b>إيرادات اليوم:</b> ${formatEgp(income)}\n🔴 <b>مصروفات اليوم:</b> ${formatEgp(expense)}\n⚖️ <b>الصافي:</b> <b>${formatEgp(income - expense)}</b>`;
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_today', async (ctx) => {
    await ctx.answerCbQuery();
    const today = getCairoToday();
    const { data: study } = await supabase.from('study_sessions').select('*').eq('date', today);
    const { data: quran } = await supabase.from('quran_logs').select('*').eq('date', today);
    const { data: tasks } = await supabase.from('daily_tasks').select('*').eq('date', today);
    const { data: thoughts } = await supabase.from('thoughts_and_wisdom').select('*').eq('date', today);
    const { data: fw } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', today).maybeSingle();
    const { data: mw } = await supabase.from('mental_wellness_logs').select('*').eq('date', today).maybeSingle();
    const { data: finance } = await supabase.from('personal_finance').select('*').eq('date', today);

    let studyMins = 0;
    let studyPages = 0;
    (study || []).forEach(s => {
      studyMins += Number(s.duration_minutes || 0);
      studyPages += Number(s.pages_covered || 0);
    });

    let incomeTotal = 0;
    let expenseTotal = 0;
    (finance || []).forEach(f => {
      if (f.type === 'إيراد') incomeTotal += Number(f.amount || 0);
      else expenseTotal += Number(f.amount || 0);
    });

    let msg = `📊 <b>تقرير إنجازات د. عبدالله الشامل ليوم (${today}):</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🩺 <b>الطب والمذاكرة:</b> ${studyMins} دقيقة (${studyPages} صفحة)\n`;
    msg += `📖 <b>القرآن الكريم:</b> ${(quran && quran.length > 0) ? quran.map(q => `${q.surah_name} (${q.mastery_status || 'متقن'})`).join(' • ') : 'لم يُسجل ورد'}\n`;
    msg += `🌙 <b>السنن والأذكار:</b> السنن: ${fw?.sunan_rawatib_count || 0} ركعة | أذكار: صباح (${fw?.adhkar_morning ? '✅' : '⚪'}) مساء (${fw?.adhkar_evening ? '✅' : '⚪'})\n`;
    msg += `🧠 <b>الحالة النفسية والمزاج:</b> ${mw ? `⭐ ${mw.mood_rating}/5 (${mw.emotional_state})` : 'مستقرة 🟢'}\n`;
    msg += `🎯 <b>المهام المنجزة:</b> ${(tasks && tasks.length > 0) ? tasks.map(t => `${t.status === 'تم الإنجاز' ? '✅' : '🟡'} ${t.title}`).join(' | ') : 'لا توجد مهام'}\n`;
    msg += `💡 <b>الخواطر المحفوظة:</b> ${thoughts?.length || 0} خواطر\n`;
    msg += `💵 <b>المالية:</b> إيراد: ${formatEgp(incomeTotal)} | مصروف: ${formatEgp(expenseTotal)}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n🚀 <b>عظيم جداً يا دكتور! استمر بنفس القوة والعزيمة.</b>`;

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });
  });

  bot.action('menu_main', async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply('👇 <b>القائمة الرئيسية لمنظومة رحلة عبدالله:</b>', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🩺 كويزات الموديولات الطبية', callback_data: 'menu_med_spaced' }, { text: '🗣️ فلاش كاردز الإنجليزية', callback_data: 'menu_eng_spaced' }],
          [{ text: '📅 جدول السكاشن والغياب', callback_data: 'menu_academic' }, { text: '📖 سجل المصحف والتثبيت', callback_data: 'menu_quran' }],
          [{ text: '🌙 الصيام والسنن والأذكار', callback_data: 'menu_fasting' }, { text: '🧠 الفضفضة والاتزان النفسي', callback_data: 'menu_wellness' }],
          [{ text: '🏋️‍♂️ الجيم واللياقة والبدنية', callback_data: 'menu_gym' }, { text: '🎬 صناعة المحتوى والمونتاج', callback_data: 'menu_content' }],
          [{ text: '💼 الشغل ومشاريع البيزنس', callback_data: 'menu_work' }, { text: '🎯 المهام والمواعيد والتركيز', callback_data: 'menu_tasks' }],
          [{ text: '💡 بنك الخواطر والانضباط', callback_data: 'menu_thoughts' }, { text: '💵 الخزنة والمصروفات الشخصية', callback_data: 'menu_finance' }],
          [{ text: '🧪 وضع تجربة البوت (Sandbox)', callback_data: 'menu_sandbox' }]
        ]
      }
    });
  });

  // ==============================================================================
  // 🧪 Sandbox Test Mode Bot Handlers
  // ==============================================================================
  const BOT_SNAPSHOT_TABLES = [
    'academic_schedule',
    'attendance_logs',
    'study_sessions',
    'clinical_cases',
    'medical_spaced_quizzes',
    'english_spaced_flashcards',
    'quran_logs',
    'fasting_and_worship_logs',
    'mental_wellness_logs',
    'fitness_gym_logs',
    'content_creation',
    'work_projects',
    'daily_tasks',
    'appointments_and_reminders',
    'thoughts_and_wisdom',
    'self_development_books',
    'prayers_and_habits',
    'personal_finance'
  ];

  const handleSandboxStatus = async (ctx) => {
    const { data: row } = await supabase.from('bot_sessions').select('*').eq('chat_id', 999999).maybeSingle();
    const isSandbox = row?.data?.sandbox_active === true;

    if (isSandbox) {
      const snapTime = row?.data?.sandbox_snapshot?.created_at ? new Date(row.data.sandbox_snapshot.created_at).toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo' }) : 'الآن';
      return ctx.reply(
        `🧪 <b>وضع تجربة البوت (Sandbox Mode) مفعّل حالياً! 🟢</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `• تم أخذ لقطة حفظ احتياطية لكافة بيانات المنظومة الساعة: <b>${snapTime}</b>.\n` +
        `• يمكنك تجربة أي رسائل، أوامر، أو تسجيلات جديدة دون التأثير على بياناتك الأصلية.\n\n` +
        `هل ترغب في إنهاء وضع التجربة واستعادة البيانات الأصلية؟`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔴 إنهاء التجربة واستعادة البيانات الأصلية', callback_data: 'disable_sandbox_bot' }],
              [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        }
      );
    } else {
      return ctx.reply(
        `🧪 <b>وضع تجربة واختبار البوت (Sandbox Mode)</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `عند تفعيل وضع التجربة:\n` +
        `1️⃣ سيتم أخذ نسخة احتياطية فورية لجميع السجلات وجداول المنظومة والسيولة المالية.\n` +
        `2️⃣ يمكنك اختبار أي محادثة أو تسجيل مهام أو مصاريف بحرية تامة.\n` +
        `3️⃣ عند الانتهاء يمكنك بضغطة زر استعادة كل شيء كما كان تماماً دون أي تغيير.\n\n` +
        `هل ترغب في تفعيل وضع التجربة الآن؟`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧪 نعم، تفعيل وضع التجربة الآن', callback_data: 'enable_sandbox_bot' }],
              [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        }
      );
    };
  };

  bot.command(['sandbox', 'testmode', 'تجربة'], handleSandboxStatus);
  bot.action('menu_sandbox', async (ctx) => {
    await ctx.answerCbQuery();
    return handleSandboxStatus(ctx);
  });

  bot.action('enable_sandbox_bot', async (ctx) => {
    await ctx.answerCbQuery('⏳ جاري أخذ لقطة الحفظ وتفعيل وضع التجربة...');
    try {
      const { data: row } = await supabase.from('bot_sessions').select('*').eq('chat_id', 999999).maybeSingle();
      const sessionData = row?.data || {};

      const snapshotPromises = BOT_SNAPSHOT_TABLES.map(async (tbl) => {
        const { data } = await supabase.from(tbl).select('*');
        return { tbl, rows: data || [] };
      });

      const results = await Promise.all(snapshotPromises);
      const snapshotObj = {
        liquidity: { ...(sessionData.liquidity || {}) },
        created_at: new Date().toISOString()
      };
      results.forEach(({ tbl, rows }) => {
        snapshotObj[tbl] = rows;
      });

      sessionData.sandbox_snapshot = snapshotObj;
      sessionData.sandbox_active = true;

      await supabase.from('bot_sessions').upsert({
        chat_id: 999999,
        state: 'global_state',
        data: sessionData,
        updated_at: new Date().toISOString()
      });

      return ctx.reply(
        `✅ <b>تم تفعيل وضع تجربة البوت بنجاح! 🧪</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `تم أخذ لقطة حفظ احتياطية كاملة لجميع أقسام المنظومة.\n` +
        `يمكنك الآن تجربة كل الرسائل والأوامر، ولإلغاء التجربة واستعادة بياناتك في أي وقت أرسل /sandbox أو اضغط الزر في لوحة التحكم.`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔴 إنهاء التجربة واستعادة البيانات', callback_data: 'disable_sandbox_bot' }],
              [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        }
      );
    } catch (e) {
      return ctx.reply(`❌ فشل تفعيل وضع التجربة: ${e.message}`);
    }
  });

  bot.action('disable_sandbox_bot', async (ctx) => {
    await ctx.answerCbQuery('⏳ جاري استعادة البيانات الأصلية...');
    try {
      const { data: row } = await supabase.from('bot_sessions').select('*').eq('chat_id', 999999).maybeSingle();
      const sessionData = row?.data;

      if (!sessionData || !sessionData.sandbox_active || !sessionData.sandbox_snapshot) {
        return ctx.reply('⚠️ وضع التجربة غير مفعّل أو لا توجد لقطة احتياطية محفوظة.');
      }

      const snap = sessionData.sandbox_snapshot;

      for (const tbl of BOT_SNAPSHOT_TABLES) {
        await supabase.from(tbl).delete().not('id', 'is', null);
      }

      for (const tbl of BOT_SNAPSHOT_TABLES) {
        const rows = snap[tbl];
        if (rows && rows.length > 0) {
          for (let i = 0; i < rows.length; i += 100) {
            const chunk = rows.slice(i, i + 100);
            await supabase.from(tbl).insert(chunk);
          }
        }
      }

      sessionData.liquidity = { ...(snap.liquidity || {}) };
      sessionData.sandbox_active = false;
      delete sessionData.sandbox_snapshot;

      await supabase.from('bot_sessions').upsert({
        chat_id: 999999,
        state: 'global_state',
        data: sessionData,
        updated_at: new Date().toISOString()
      });

      return ctx.reply(
        `✅ <b>تم إنهاء وضع التجربة بنجاح! 🔄</b>\n` +
        `تم إلغاء كافة الحركات التجريبية واستعادة جميع السجلات والبيانات الأصلية والسيولة كما كانت تماماً.`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏠 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        }
      );
    } catch (e) {
      return ctx.reply(`❌ فشل استعادة البيانات: ${e.message}`);
    }
  });
}
