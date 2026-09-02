const fs = require('fs');

let handCode = fs.readFileSync('./lib/handlers.js', 'utf8');

// 1. Sharia Command & Callbacks
const oldShariaHandlers = `  // 3. Essential Sharia Sciences (ما لا يسع المسلم جهله)
  bot.command(['sharia', 'fiqh', 'فقه', 'علم_شرعي', 'شريعة'], async (ctx) => {
    const capsule = getRandomShariaCapsule();
    const keyboard = {
      inline_keyboard: [
        [{ text: '🎯 اختبر حفظي وفهمي الآن (سؤال تفاعلي)', callback_data: 'take_sharia_quiz' }],
        [{ text: '📖 كبسولة فقهية / حديثية أخرى', callback_data: 'get_sharia_capsule' }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };
    return ctx.reply(capsule.formattedText, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('take_sharia_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال تثبيت فقهي تفاعلي!').catch(() => {});
    const capsule = getRandomShariaCapsule();
    if (!capsule.quiz) return;
    try {
      const pollMsg = await bot.telegram.sendQuiz(
        fromId,
        capsule.quiz.question,
        capsule.quiz.options,
        {
          correct_option_id: capsule.quiz.correct_option_index,
          is_anonymous: false,
          explanation: capsule.quiz.explanation
        }
      );
      await saveNativeQuizPoll(fromId, {
        telegram_poll_id: pollMsg.poll.id,
        course_code: 'SHARIA',
        topic: capsule.title,
        question: capsule.quiz.question,
        options: capsule.quiz.options,
        correct_option_index: capsule.quiz.correct_option_index,
        explanation: capsule.quiz.explanation
      });
    } catch (e) {
      console.warn('sendQuiz error:', e.message);
    }
  });`;

const newShariaHandlers = `  // 3. Essential Sharia Sciences (ما لا يسع المسلم جهله) - مع منع التكرار وكويز مطابق 100%
  bot.command(['sharia', 'fiqh', 'فقه', 'علم_شرعي', 'شريعة'], async (ctx) => {
    const capsule = getRandomShariaCapsule();
    const keyboard = {
      inline_keyboard: [
        [{ text: '🎯 اختبر فهمك في هذه الكبسولة (+15 XP)', callback_data: \`take_sharia_quiz_\${capsule.id}\` }],
        [{ text: '📖 كبسولة فقهية أخرى (غير مكررة)', callback_data: \`get_sharia_capsule_\${capsule.id}\` }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };
    return ctx.reply(capsule.formattedText, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action(/^get_sharia_capsule(?:_(.+))?$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('📖 كبسولة جديدة غير مكررة!').catch(() => {});
    const currentId = ctx.match[1] || null;
    const { getRandomShariaCapsule } = await import('./sharia_sciences.js');
    const capsule = getRandomShariaCapsule(currentId);
    const keyboard = {
      inline_keyboard: [
        [{ text: '🎯 اختبر فهمك في هذه الكبسولة (+15 XP)', callback_data: \`take_sharia_quiz_\${capsule.id}\` }],
        [{ text: '📖 كبسولة فقهية أخرى', callback_data: \`get_sharia_capsule_\${capsule.id}\` }]
      ]
    };
    return ctx.reply(capsule.formattedText, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action(/^take_sharia_quiz(?:_(.+))?$/, async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 جاري إرسال كويز الكبسولة!').catch(() => {});
    const capsuleId = ctx.match[1];
    const { getShariaCapsuleById, getRandomShariaCapsule } = await import('./sharia_sciences.js');
    const capsule = capsuleId ? getShariaCapsuleById(capsuleId) : getRandomShariaCapsule();
    if (!capsule.quiz) return;
    try {
      const pollMsg = await bot.telegram.sendQuiz(
        fromId,
        capsule.quiz.question,
        capsule.quiz.options,
        {
          correct_option_id: capsule.quiz.correct_option_index,
          is_anonymous: false,
          explanation: capsule.quiz.explanation
        }
      );
      await saveNativeQuizPoll(fromId, {
        telegram_poll_id: pollMsg.poll.id,
        course_code: 'SHARIA',
        topic: capsule.title,
        question: capsule.quiz.question,
        options: capsule.quiz.options,
        correct_option_index: capsule.quiz.correct_option_index,
        explanation: capsule.quiz.explanation
      });
    } catch (e) {
      console.warn('sendQuiz error:', e.message);
    }
  });`;

handCode = handCode.replace(oldShariaHandlers, newShariaHandlers);
fs.writeFileSync('./lib/handlers.js', handCode, 'utf8');
console.log('✅ Updated handlers.js with exact matching quizzes and no-repeat rotation for Sharia capsules');
