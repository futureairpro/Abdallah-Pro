const fs = require('fs');

let handlersCode = fs.readFileSync('./lib/handlers.js', 'utf8');

// Check if take_sharia_quiz is already present
if (!handlersCode.includes('take_sharia_quiz')) {
  const target = `  // 3. Essential Sharia Sciences (ما لا يسع المسلم جهله)`;
  const replacement = `  // 3. Essential Sharia Sciences (ما لا يسع المسلم جهله)
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
  });

  bot.action('take_statesman_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال قيادي وتاريخي تفاعلي!').catch(() => {});
    const mistake = getRandomPastRulerMistake();
    if (!mistake.quiz) return;
    try {
      const pollMsg = await bot.telegram.sendQuiz(
        fromId,
        mistake.quiz.question,
        mistake.quiz.options,
        {
          correct_option_id: mistake.quiz.correct_option_index,
          is_anonymous: false,
          explanation: mistake.quiz.explanation
        }
      );
      await saveNativeQuizPoll(fromId, {
        telegram_poll_id: pollMsg.poll.id,
        course_code: 'STATESMAN',
        topic: mistake.title,
        question: mistake.quiz.question,
        options: mistake.quiz.options,
        correct_option_index: mistake.quiz.correct_option_index,
        explanation: mistake.quiz.explanation
      });
    } catch (e) {
      console.warn('sendQuiz error:', e.message);
    }
  });

  bot.action('take_purity_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال حديثي وعفة تفاعلي!').catch(() => {});
    const fuel = getRandomPuritySpiritualFuel('د. عبدالله');
    if (!fuel.quiz) return;
    try {
      const pollMsg = await bot.telegram.sendQuiz(
        fromId,
        fuel.quiz.question,
        fuel.quiz.options,
        {
          correct_option_id: fuel.quiz.correct_option_index,
          is_anonymous: false,
          explanation: fuel.quiz.explanation
        }
      );
      await saveNativeQuizPoll(fromId, {
        telegram_poll_id: pollMsg.poll.id,
        course_code: 'PURITY',
        topic: fuel.category,
        question: fuel.quiz.question,
        options: fuel.quiz.options,
        correct_option_index: fuel.quiz.correct_option_index,
        explanation: fuel.quiz.explanation
      });
    } catch (e) {
      console.warn('sendQuiz error:', e.message);
    }
  });`;

  // Replace sharia command section cleanly
  handlersCode = handlersCode.replace(
    /bot\.command\(\['sharia', 'fiqh', 'فقه', 'علم_شرعي', 'شريعة'\].*?\}\);/s,
    ''
  );
  handlersCode = handlersCode.replace(target, replacement);
  fs.writeFileSync('./lib/handlers.js', handlersCode, 'utf8');
  console.log('✅ Updated handlers.js with interactive quiz actions');
} else {
  console.log('ℹ️ handlers.js already contains take_sharia_quiz');
}
