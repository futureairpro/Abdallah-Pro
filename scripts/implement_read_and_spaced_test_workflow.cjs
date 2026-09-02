const fs = require('fs');

// 1. ADD scheduleAdminSpacedQuiz TO SUPABASE.JS
let supaCode = fs.readFileSync('./lib/supabase.js', 'utf8');

const scheduleHelperCode = `
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
    topic: \`[UID:\${numId}] \${topic || 'كويز تفاعلي'}\`.trim(),
    question: question,
    answer_and_explanation: explanation || 'شرح الإجابة',
    doctor_pearl: \`<<<QUIZ_META_START>>>\${JSON.stringify(metaObj)}<<<QUIZ_META_END>>> \${explanation || ''}\`.trim(),
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
`;

if (!supaCode.includes('scheduleAdminSpacedQuiz')) {
  supaCode += scheduleHelperCode;
  fs.writeFileSync('./lib/supabase.js', supaCode, 'utf8');
  console.log('✅ Added scheduleAdminSpacedQuiz to supabase.js');
}

// 2. UPDATE SCHEDULER.JS TO DISPATCH DUE ADMIN SPACED QUIZZES
let schCode = fs.readFileSync('./lib/scheduler.js', 'utf8');

const dueQuizSchedulerCode = `    // 🎯 E. فحص وإرسال الكويزات التفاعلية المجدولة للدروس التي قرأها د. عبدالله
    try {
      const nowIso = new Date().toISOString();
      const { data: dueQuizzes } = await supabase
        .from('medical_spaced_quizzes')
        .select('*')
        .ilike('topic', \`[UID:\${adminChatId}]%\`)
        .eq('repetition_level', 0)
        .lte('next_review_at', nowIso)
        .order('next_review_at', { ascending: true })
        .limit(1);

      if (dueQuizzes && dueQuizzes.length > 0) {
        const qRow = dueQuizzes[0];
        const quizKey = \`admin_due_quiz_sent_\${qRow.id}\`;
        if (!(await hasSent(quizKey, 43200000))) {
          await markSent(quizKey, 43200000);
          let meta = {};
          if (qRow.doctor_pearl && qRow.doctor_pearl.includes('<<<QUIZ_META_START>>>')) {
            try {
              const metaJson = qRow.doctor_pearl.split('<<<QUIZ_META_START>>>')[1].split('<<<QUIZ_META_END>>>')[0];
              meta = JSON.parse(metaJson);
            } catch (e) {}
          }

          if (meta.options && meta.options.length >= 2) {
            const cleanTopic = qRow.topic.replace(\`[UID:\${adminChatId}]\`, '').trim();
            const introMsg = \`🎯 <b>اختبار تثبيت ما قرأته واستوعبته يا دكتور 🧠✨</b>\\n━━━━━━━━━━━━━━━━━━━━━\\n📌 <b>الموضوع:</b> <b>\${cleanTopic}</b>\\n👇 <i>جاوب على السؤال لتثبيت المعلومة بالذاكرة طويلة المدى (+30 XP):</i>\`;
            await bot.telegram.sendMessage(adminChatId, introMsg, { parse_mode: 'HTML' }).catch(() => {});

            const pollMsg = await bot.telegram.sendQuiz(
              adminChatId,
              qRow.question,
              meta.options,
              {
                correct_option_id: Number(meta.correct_index || 0),
                is_anonymous: false,
                explanation: meta.explanation || qRow.answer_and_explanation
              }
            );

            meta.poll_id = pollMsg.poll.id;
            await supabase.from('medical_spaced_quizzes').update({
              repetition_level: 1,
              doctor_pearl: \`<<<QUIZ_META_START>>>\${JSON.stringify(meta)}<<<QUIZ_META_END>>> \${meta.explanation || ''}\`.trim()
            }).eq('id', qRow.id);
          }
        }
      }
    } catch (dueErr) {
      console.warn('[Scheduler Due Quiz Error]:', dueErr.message);
    }\n\n    // 🧠 1. كبسولة علم الأعصاب والانضباط الذاتي والدوبامين (11:15 صباحاً)`;

if (!schCode.includes('admin_due_quiz_sent')) {
  schCode = schCode.replace('    // 🧠 1. كبسولة علم الأعصاب والانضباط الذاتي والدوبامين (11:15 صباحاً)', dueQuizSchedulerCode);
  fs.writeFileSync('./lib/scheduler.js', schCode, 'utf8');
  console.log('✅ Integrated due spaced quizzes dispatcher in scheduler.js');
}

// 3. UPDATE HANDLERS.JS TO USE [✅ تمت القراءة والاستيعاب 🧠✨ (+20 XP)] BUTTONS ACROSS ALL CURRICULA
let handCode = fs.readFileSync('./lib/handlers.js', 'utf8');

const updatedHandlersScript = `
  // ==============================================================================
  // 👑 Admin "تمت القراءة والاستيعاب" + Spaced Quiz Scheduling Engine
  // ==============================================================================

  // 1. Sharia Capsule Read Confirmation
  bot.action(/^ack_read_sharia_(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    const capsuleId = ctx.match[1];
    const { getShariaCapsuleById } = await import('./sharia_sciences.js');
    const capsule = getShariaCapsuleById(capsuleId);

    const { scheduleAdminSpacedQuiz } = await import('./supabase.js');
    if (capsule.quiz) {
      await scheduleAdminSpacedQuiz(fromId, {
        course_code: 'SHARIA',
        topic: capsule.title,
        question: capsule.quiz.question,
        options: capsule.quiz.options,
        correct_option_index: capsule.quiz.correct_option_index,
        explanation: capsule.quiz.explanation,
        delayHours: 2.5
      });
    }

    await ctx.answerCbQuery('✅ تم تأكيد القراءة والاستيعاب بنجاح! (+20 XP)\\n⏳ تمت جدولة سؤال الكويز التفاعلي ليختبرك البوت فيه بعد قليل.', { show_alert: true }).catch(() => {});

    return ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '✅ تم استيعاب الدرس — مجدول للاختبار التفاعلي ⏳', callback_data: 'noop_read' }],
        [{ text: '📖 كبسولة فقهية أخرى', callback_data: \`get_sharia_capsule_\${capsule.id}\` }]
      ]
    }).catch(() => {});
  });

  // 2. Scientific Discipline Read Confirmation
  bot.action(/^ack_read_discipline_(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    const discId = ctx.match[1];
    const { SCIENTIFIC_DISCIPLINE_INSIGHTS } = await import('./admin_curriculum.js');
    const disc = SCIENTIFIC_DISCIPLINE_INSIGHTS.find(d => d.id === discId) || SCIENTIFIC_DISCIPLINE_INSIGHTS[0];

    const { scheduleAdminSpacedQuiz } = await import('./supabase.js');
    if (disc.quiz) {
      await scheduleAdminSpacedQuiz(fromId, {
        course_code: 'DISCIPLINE',
        topic: disc.title,
        question: disc.quiz.question,
        options: disc.quiz.options,
        correct_option_index: disc.quiz.correct_option_index,
        explanation: disc.quiz.explanation,
        delayHours: 2.5
      });
    }

    await ctx.answerCbQuery('✅ تم توثيق استيعاب المبدأ العلمي! (+20 XP)\\n⏳ سيتم إرسال كويز التثبيت التفاعلي لك بعد قليل.', { show_alert: true }).catch(() => {});

    return ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '✅ تم استيعاب المبدأ العلمي — مجدول للاختبار ⏳', callback_data: 'noop_read' }],
        [{ text: '🔬 مقولة علمية أخرى', callback_data: 'get_discipline_pulse' }]
      ]
    }).catch(() => {});
  });

  // 3. Quran Ayah & Asbab al-Nuzul Read Confirmation
  bot.action(/^ack_read_ayah_(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    const ayahId = ctx.match[1];
    const { QURAN_AYAHS_WITH_ASBAB } = await import('./admin_curriculum.js');
    const ayah = QURAN_AYAHS_WITH_ASBAB.find(a => a.id === ayahId) || QURAN_AYAHS_WITH_ASBAB[0];

    const { scheduleAdminSpacedQuiz } = await import('./supabase.js');
    if (ayah.quiz) {
      await scheduleAdminSpacedQuiz(fromId, {
        course_code: 'QURAN_ASBAB',
        topic: ayah.surah,
        question: ayah.quiz.question,
        options: ayah.quiz.options,
        correct_option_index: ayah.quiz.correct_option_index,
        explanation: ayah.quiz.explanation,
        delayHours: 2.5
      });
    }

    await ctx.answerCbQuery('✅ تم توثيق تدبر الآية وسبب النزول! (+20 XP)\\n⏳ تمت جدولة سؤال الكويز التفاعلي ليختبرك فيه البوت بعد قليل.', { show_alert: true }).catch(() => {});

    return ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '✅ تم تدبر الآية — مجدولة للاختبار ⏳', callback_data: 'noop_read' }],
        [{ text: '📖 آية وسبب نزول آخر', callback_data: 'get_ayah_asbab' }]
      ]
    }).catch(() => {});
  });

  // 4. Sahih Bukhari Read Confirmation
  bot.action(/^ack_read_bukhari_(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    const bukhariId = ctx.match[1];
    const { BUKHARI_HADITHS } = await import('./admin_curriculum.js');
    const bukhari = BUKHARI_HADITHS.find(b => b.id === bukhariId) || BUKHARI_HADITHS[0];

    const { scheduleAdminSpacedQuiz } = await import('./supabase.js');
    if (bukhari.quiz) {
      await scheduleAdminSpacedQuiz(fromId, {
        course_code: 'BUKHARI',
        topic: bukhari.hadith_title,
        question: bukhari.quiz.question,
        options: bukhari.quiz.options,
        correct_option_index: bukhari.quiz.correct_option_index,
        explanation: bukhari.quiz.explanation,
        delayHours: 2.5
      });
    }

    await ctx.answerCbQuery('✅ تم توثيق قراءة حديث البخاري! (+20 XP)\\n⏳ تمت جدولة سؤال الكويز التفاعلي ليختبرك فيه البوت بعد قليل.', { show_alert: true }).catch(() => {});

    return ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '✅ تم استيعاب الحديث والدرس القيادي — مجدول للاختبار ⏳', callback_data: 'noop_read' }],
        [{ text: '📜 حديث بخاري آخر', callback_data: 'get_bukhari_hadith' }]
      ]
    }).catch(() => {});
  });

  // 5. Prophetic Situation Read Confirmation
  bot.action(/^ack_read_prophet_(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    const sitId = ctx.match[1];
    const { PROPHETIC_SITUATIONS } = await import('./admin_curriculum.js');
    const sit = PROPHETIC_SITUATIONS.find(s => s.id === sitId) || PROPHETIC_SITUATIONS[0];

    const { scheduleAdminSpacedQuiz } = await import('./supabase.js');
    if (sit.quiz) {
      await scheduleAdminSpacedQuiz(fromId, {
        course_code: 'PROPHETIC_LEADERSHIP',
        topic: sit.title,
        question: sit.quiz.question,
        options: sit.quiz.options,
        correct_option_index: sit.quiz.correct_option_index,
        explanation: sit.quiz.explanation,
        delayHours: 2.5
      });
    }

    await ctx.answerCbQuery('✅ تم توثيق الموقف القيادي النبوي! (+20 XP)\\n⏳ سيتم إرسال كويز الموقف بعد قليل.', { show_alert: true }).catch(() => {});

    return ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '✅ تم استيعاب الموقف القيادي — مجدول للاختبار ⏳', callback_data: 'noop_read' }],
        [{ text: '⚔️ موقف قيادي آخر', callback_data: 'get_prophetic_situation' }]
      ]
    }).catch(() => {});
  });

  // 6. Sahabi Spotlight Read Confirmation
  bot.action(/^ack_read_sahabi_(.+)$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    const sahabiId = ctx.match[1];
    const { SAHABA_SPOTLIGHTS } = await import('./admin_curriculum.js');
    const sahabi = SAHABA_SPOTLIGHTS.find(s => s.id === sahabiId) || SAHABA_SPOTLIGHTS[0];

    const { scheduleAdminSpacedQuiz } = await import('./supabase.js');
    if (sahabi.quiz) {
      await scheduleAdminSpacedQuiz(fromId, {
        course_code: 'SAHABA_SPOTLIGHT',
        topic: sahabi.name,
        question: sahabi.quiz.question,
        options: sahabi.quiz.options,
        correct_option_index: sahabi.quiz.correct_option_index,
        explanation: sahabi.quiz.explanation,
        delayHours: 2.5
      });
    }

    await ctx.answerCbQuery('✅ تم توثيق مناقب الصحابي! (+20 XP)\\n⏳ سيصلك كويز الصحابي لاختبار حفظك بعد قليل.', { show_alert: true }).catch(() => {});

    return ctx.editMessageReplyMarkup({
      inline_keyboard: [
        [{ text: '✅ تم استيعاب سيرة الصحابي — مجدول للاختبار ⏳', callback_data: 'noop_read' }],
        [{ text: '🌟 صحابي آخر', callback_data: 'get_sahabi_spotlight' }]
      ]
    }).catch(() => {});
  });

  bot.action('noop_read', async (ctx) => {
    return ctx.answerCbQuery('📌 تم تأكيد قراءتك لهذا الدرس مسبقاً وهو مجدول للاختبار التفاعلي تلقائياً!').catch(() => {});
  });
`;

// Replace button templates in commands
// 1. Sharia command & get_sharia_capsule
handCode = handCode.replace(
  /\[\{ text: '🎯 اختبر فهمك في هذه الكبسولة \(\+15 XP\)', callback_data: `take_sharia_quiz_\$\{capsule\.id\}` \}\]/g,
  "[{ text: '✅ تمت القراءة والاستيعاب 🧠✨ (+20 XP)', callback_data: `ack_read_sharia_${capsule.id}` }]"
);

// 2. Discipline command & get_discipline_pulse
handCode = handCode.replace(
  /\[\{ text: '🎯 اختبر فهمك بسؤال تفاعلي \(\+15 XP\)', callback_data: 'take_discipline_quiz' \}\]/g,
  "[{ text: '✅ تمت القراءة والاستيعاب 🧠✨ (+20 XP)', callback_data: `ack_read_discipline_${disc.item.id}` }]"
);

// 3. Ayah command & get_ayah_asbab
handCode = handCode.replace(
  /\[\{ text: '🎯 اختبر فهمك لسبب النزول \(\+15 XP\)', callback_data: 'take_ayah_quiz' \}\]/g,
  "[{ text: '✅ تمت القراءة وتدبر الآية 🌿✨ (+20 XP)', callback_data: `ack_read_ayah_${ayah.item.id}` }]"
);

// 4. Bukhari command & get_bukhari_hadith
handCode = handCode.replace(
  /\[\{ text: '🎯 كويز حديث البخاري \(\+15 XP\)', callback_data: 'take_bukhari_quiz' \}\]/g,
  "[{ text: '✅ تم استيعاب الحديث الشريف 📜✨ (+20 XP)', callback_data: `ack_read_bukhari_${bukhari.item.id}` }]"
);

// 5. Prophetic command & get_prophetic_situation
handCode = handCode.replace(
  /\[\{ text: '🎯 كويز القيادة النبوية \(\+15 XP\)', callback_data: 'take_prophetic_quiz' \}\]/g,
  "[{ text: '✅ تم استيعاب الموقف القيادي ⚔️✨ (+20 XP)', callback_data: `ack_read_prophet_${sit.item.id}` }]"
);

// 6. Sahabi command & get_sahabi_spotlight
handCode = handCode.replace(
  /\[\{ text: '🎯 كويز الصحابي التفاعلي \(\+15 XP\)', callback_data: 'take_sahabi_quiz' \}\]/g,
  "[{ text: '✅ تم استيعاب سيرة الصحابي 🌟✨ (+20 XP)', callback_data: `ack_read_sahabi_${sahabi.item.id}` }]"
);

if (!handCode.includes('ack_read_sharia_')) {
  const targetPos = `  // 3. Essential Sharia Sciences (ما لا يسع المسلم جهله)`;
  handCode = handCode.replace(targetPos, updatedHandlersScript + '\n' + targetPos);
}

fs.writeFileSync('./lib/handlers.js', handCode, 'utf8');
console.log('✅ Handlers upgraded with "تمت القراءة والاستيعاب" button and spaced testing queue');
