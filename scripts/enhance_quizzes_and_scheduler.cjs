const fs = require('fs');

// 1. UPDATE SCHEDULER.JS TO AUTOMATICALLY DISPATCH QUIZ POLLS WITH CAPSULES
let schCode = fs.readFileSync('./lib/scheduler.js', 'utf8');

const oldSchedulerAdminBlock = `    // 🧠 1. كبسولة علم الأعصاب والانضباط الذاتي والدوبامين (11:15 صباحاً) -> [675-705 mins]
    if (curMinutes >= 675 && curMinutes <= 705) {
      const discKey = \`admin_discipline_auto_\${dateStr}\`;
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
      const ayahKey = \`admin_ayah_asbab_auto_\${dateStr}\`;
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
      const sahabiKey = \`admin_sahabi_auto_\${dateStr}\`;
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
      const bukhariKey = \`admin_bukhari_auto_\${dateStr}\`;
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
    }`;

const newSchedulerAdminBlock = `    // 🧠 1. كبسولة علم الأعصاب والانضباط الذاتي والدوبامين (11:15 صباحاً) -> [675-705 mins]
    if (curMinutes >= 675 && curMinutes <= 705) {
      const discKey = \`admin_discipline_auto_\${dateStr}\`;
      if (!(await hasSent(discKey, 86400000))) {
        await markSent(discKey, 86400000);
        const disc = getRandomScientificDiscipline();
        await bot.telegram.sendMessage(adminChatId, disc.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎯 اختبر فهمك بسؤال تفاعلي (+15 XP)', callback_data: 'take_discipline_quiz' }],
              [{ text: '🔬 مقولة علمية أخرى', callback_data: 'get_discipline_pulse' }]
            ]
          }
        }).catch(() => {});

        if (disc.quiz) {
          try {
            await bot.telegram.sendQuiz(adminChatId, disc.quiz.question, disc.quiz.options, {
              correct_option_id: disc.quiz.correct_option_index,
              is_anonymous: false,
              explanation: disc.quiz.explanation
            });
          } catch (qErr) {}
        }
      }
    }

    // 📖 2. آية قرآنية وقصة وسبب نزولها (01:30 ظهراً) -> [810-840 mins]
    if (curMinutes >= 810 && curMinutes <= 840) {
      const ayahKey = \`admin_ayah_asbab_auto_\${dateStr}\`;
      if (!(await hasSent(ayahKey, 86400000))) {
        await markSent(ayahKey, 86400000);
        const ayah = getRandomAyahWithAsbab();
        await bot.telegram.sendMessage(adminChatId, ayah.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎯 اختبر فهمك لسبب النزول (+15 XP)', callback_data: 'take_ayah_quiz' }],
              [{ text: '📖 آية وسبب نزول آخر', callback_data: 'get_ayah_asbab' }]
            ]
          }
        }).catch(() => {});

        if (ayah.quiz) {
          try {
            await bot.telegram.sendQuiz(adminChatId, ayah.quiz.question, ayah.quiz.options, {
              correct_option_id: ayah.quiz.correct_option_index,
              is_anonymous: false,
              explanation: ayah.quiz.explanation
            });
          } catch (qErr) {}
        }
      }
    }

    // 🌟 3. صحابي اليوم وصناعة القائد والخليفة (05:15 عصراً) -> [1035-1065 mins]
    if (curMinutes >= 1035 && curMinutes <= 1065) {
      const sahabiKey = \`admin_sahabi_auto_\${dateStr}\`;
      if (!(await hasSent(sahabiKey, 86400000))) {
        await markSent(sahabiKey, 86400000);
        const sahabi = getRandomSahabiSpotlight();
        await bot.telegram.sendMessage(adminChatId, sahabi.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎯 كويز الصحابي التفاعلي (+15 XP)', callback_data: 'take_sahabi_quiz' }],
              [{ text: '🌟 صحابي آخر', callback_data: 'get_sahabi_spotlight' }],
              [{ text: '⚔️ موقف قيادي نبوي', callback_data: 'get_prophetic_situation' }]
            ]
          }
        }).catch(() => {});

        if (sahabi.quiz) {
          try {
            await bot.telegram.sendQuiz(adminChatId, sahabi.quiz.question, sahabi.quiz.options, {
              correct_option_id: sahabi.quiz.correct_option_index,
              is_anonymous: false,
              explanation: sahabi.quiz.explanation
            });
          } catch (qErr) {}
        }
      }
    }

    // 📜 4. درر صحيح البخاري والقيادة (07:00 مساءً) -> [1140-1170 mins]
    if (curMinutes >= 1140 && curMinutes <= 1170) {
      const bukhariKey = \`admin_bukhari_auto_\${dateStr}\`;
      if (!(await hasSent(bukhariKey, 86400000))) {
        await markSent(bukhariKey, 86400000);
        const bukhari = getRandomBukhariHadith();
        await bot.telegram.sendMessage(adminChatId, bukhari.formattedText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎯 كويز حديث البخاري (+15 XP)', callback_data: 'take_bukhari_quiz' }],
              [{ text: '📜 حديث بخاري آخر', callback_data: 'get_bukhari_hadith' }]
            ]
          }
        }).catch(() => {});

        if (bukhari.quiz) {
          try {
            await bot.telegram.sendQuiz(adminChatId, bukhari.quiz.question, bukhari.quiz.options, {
              correct_option_id: bukhari.quiz.correct_option_index,
              is_anonymous: false,
              explanation: bukhari.quiz.explanation
            });
          } catch (qErr) {}
        }
      }
    }`;

schCode = schCode.replace(oldSchedulerAdminBlock, newSchedulerAdminBlock);
fs.writeFileSync('./lib/scheduler.js', schCode, 'utf8');
console.log('✅ Updated scheduler.js with automatic quiz poll dispatches');

// 2. UPDATE HANDLERS.JS TO ADD QUIZ ACTION CALLBACKS
let handCode = fs.readFileSync('./lib/handlers.js', 'utf8');

const oldAdminCurriculumHandlers = `  // 1. Scientific Discipline
  bot.command(['discipline', 'انضباط', 'دوبامين', 'علم_الاعصاب'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const disc = getRandomScientificDiscipline();
    return ctx.reply(disc.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🔬 مقولة علمية أخرى', callback_data: 'get_discipline_pulse' }]]
      }
    });
  });

  bot.action('get_discipline_pulse', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('🔬 توليد مقولة علمية!').catch(() => {});
    const disc = getRandomScientificDiscipline();
    return ctx.reply(disc.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🔬 مقولة علمية أخرى', callback_data: 'get_discipline_pulse' }]]
      }
    });
  });

  // 2. Quran Ayah & Asbab al-Nuzul
  bot.command(['ayah', 'اية', 'تفسير', 'سبب_نزول'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const ayah = getRandomAyahWithAsbab();
    return ctx.reply(ayah.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '📖 آية وسبب نزول آخر', callback_data: 'get_ayah_asbab' }]]
      }
    });
  });

  bot.action('get_ayah_asbab', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('📖 جاري جلب آية جديدة!').catch(() => {});
    const ayah = getRandomAyahWithAsbab();
    return ctx.reply(ayah.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '📖 آية وسبب نزول آخر', callback_data: 'get_ayah_asbab' }]]
      }
    });
  });

  // 3. Sahih Bukhari Hadiths
  bot.command(['bukhari', 'بخاري', 'حديث'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const bukhari = getRandomBukhariHadith();
    return ctx.reply(bukhari.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '📜 حديث بخاري آخر', callback_data: 'get_bukhari_hadith' }]]
      }
    });
  });

  bot.action('get_bukhari_hadith', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('📜 جاري جلب حديث شريف!').catch(() => {});
    const bukhari = getRandomBukhariHadith();
    return ctx.reply(bukhari.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '📜 حديث بخاري آخر', callback_data: 'get_bukhari_hadith' }]]
      }
    });
  });

  // 4. Prophetic Situations
  bot.command(['prophet', 'سيرة', 'موقف', 'قيادة_نبوية'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const sit = getRandomPropheticSituation();
    return ctx.reply(sit.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⚔️ موقف قيادي آخر', callback_data: 'get_prophetic_situation' }]]
      }
    });
  });

  bot.action('get_prophetic_situation', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('⚔️ جاري جلب موقف تاريخي!').catch(() => {});
    const sit = getRandomPropheticSituation();
    return ctx.reply(sit.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⚔️ موقف قيادي آخر', callback_data: 'get_prophetic_situation' }]]
      }
    });
  });

  // 5. Daily Sahabi Spotlight
  bot.command(['sahabi', 'صحابي', 'صحابة', 'رجال_الدولة'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const sahabi = getRandomSahabiSpotlight();
    return ctx.reply(sahabi.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🌟 صحابي آخر', callback_data: 'get_sahabi_spotlight' }]]
      }
    });
  });

  bot.action('get_sahabi_spotlight', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('🌟 جاري جلب صحابي جليل!').catch(() => {});
    const sahabi = getRandomSahabiSpotlight();
    return ctx.reply(sahabi.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '🌟 صحابي آخر', callback_data: 'get_sahabi_spotlight' }]]
      }
    });
  });`;

const newAdminCurriculumHandlers = `  // 1. Scientific Discipline
  bot.command(['discipline', 'انضباط', 'دوبامين', 'علم_الاعصاب'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const disc = getRandomScientificDiscipline();
    return ctx.reply(disc.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 اختبر فهمك بسؤال تفاعلي (+15 XP)', callback_data: 'take_discipline_quiz' }],
          [{ text: '🔬 مقولة علمية أخرى', callback_data: 'get_discipline_pulse' }]
        ]
      }
    });
  });

  bot.action('get_discipline_pulse', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('🔬 توليد مقولة علمية!').catch(() => {});
    const disc = getRandomScientificDiscipline();
    return ctx.reply(disc.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 اختبر فهمك بسؤال تفاعلي (+15 XP)', callback_data: 'take_discipline_quiz' }],
          [{ text: '🔬 مقولة علمية أخرى', callback_data: 'get_discipline_pulse' }]
        ]
      }
    });
  });

  bot.action('take_discipline_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال علم الأعصاب!').catch(() => {});
    const disc = getRandomScientificDiscipline();
    if (!disc.quiz) return;
    try {
      await bot.telegram.sendQuiz(fromId, disc.quiz.question, disc.quiz.options, {
        correct_option_id: disc.quiz.correct_option_index,
        is_anonymous: false,
        explanation: disc.quiz.explanation
      });
    } catch (e) {}
  });

  // 2. Quran Ayah & Asbab al-Nuzul
  bot.command(['ayah', 'اية', 'تفسير', 'سبب_نزول'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const ayah = getRandomAyahWithAsbab();
    return ctx.reply(ayah.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 اختبر فهمك لسبب النزول (+15 XP)', callback_data: 'take_ayah_quiz' }],
          [{ text: '📖 آية وسبب نزول آخر', callback_data: 'get_ayah_asbab' }]
        ]
      }
    });
  });

  bot.action('get_ayah_asbab', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('📖 جاري جلب آية جديدة!').catch(() => {});
    const ayah = getRandomAyahWithAsbab();
    return ctx.reply(ayah.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 اختبر فهمك لسبب النزول (+15 XP)', callback_data: 'take_ayah_quiz' }],
          [{ text: '📖 آية وسبب نزول آخر', callback_data: 'get_ayah_asbab' }]
        ]
      }
    });
  });

  bot.action('take_ayah_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال أسباب النزول!').catch(() => {});
    const ayah = getRandomAyahWithAsbab();
    if (!ayah.quiz) return;
    try {
      await bot.telegram.sendQuiz(fromId, ayah.quiz.question, ayah.quiz.options, {
        correct_option_id: ayah.quiz.correct_option_index,
        is_anonymous: false,
        explanation: ayah.quiz.explanation
      });
    } catch (e) {}
  });

  // 3. Sahih Bukhari Hadiths
  bot.command(['bukhari', 'بخاري', 'حديث'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const bukhari = getRandomBukhariHadith();
    return ctx.reply(bukhari.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 كويز حديث البخاري (+15 XP)', callback_data: 'take_bukhari_quiz' }],
          [{ text: '📜 حديث بخاري آخر', callback_data: 'get_bukhari_hadith' }]
        ]
      }
    });
  });

  bot.action('get_bukhari_hadith', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('📜 جاري جلب حديث شريف!').catch(() => {});
    const bukhari = getRandomBukhariHadith();
    return ctx.reply(bukhari.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 كويز حديث البخاري (+15 XP)', callback_data: 'take_bukhari_quiz' }],
          [{ text: '📜 حديث بخاري آخر', callback_data: 'get_bukhari_hadith' }]
        ]
      }
    });
  });

  bot.action('take_bukhari_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال صحيح البخاري!').catch(() => {});
    const bukhari = getRandomBukhariHadith();
    if (!bukhari.quiz) return;
    try {
      await bot.telegram.sendQuiz(fromId, bukhari.quiz.question, bukhari.quiz.options, {
        correct_option_id: bukhari.quiz.correct_option_index,
        is_anonymous: false,
        explanation: bukhari.quiz.explanation
      });
    } catch (e) {}
  });

  // 4. Prophetic Situations
  bot.command(['prophet', 'سيرة', 'موقف', 'قيادة_نبوية'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const sit = getRandomPropheticSituation();
    return ctx.reply(sit.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 كويز القيادة النبوية (+15 XP)', callback_data: 'take_prophetic_quiz' }],
          [{ text: '⚔️ موقف قيادي آخر', callback_data: 'get_prophetic_situation' }]
        ]
      }
    });
  });

  bot.action('get_prophetic_situation', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('⚔️ جاري جلب موقف تاريخي!').catch(() => {});
    const sit = getRandomPropheticSituation();
    return ctx.reply(sit.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 كويز القيادة النبوية (+15 XP)', callback_data: 'take_prophetic_quiz' }],
          [{ text: '⚔️ موقف قيادي آخر', callback_data: 'get_prophetic_situation' }]
        ]
      }
    });
  });

  bot.action('take_prophetic_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال القيادة النبوية!').catch(() => {});
    const sit = getRandomPropheticSituation();
    if (!sit.quiz) return;
    try {
      await bot.telegram.sendQuiz(fromId, sit.quiz.question, sit.quiz.options, {
        correct_option_id: sit.quiz.correct_option_index,
        is_anonymous: false,
        explanation: sit.quiz.explanation
      });
    } catch (e) {}
  });

  // 5. Daily Sahabi Spotlight
  bot.command(['sahabi', 'صحابي', 'صحابة', 'رجال_الدولة'], async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return;
    const sahabi = getRandomSahabiSpotlight();
    return ctx.reply(sahabi.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 كويز الصحابي التفاعلي (+15 XP)', callback_data: 'take_sahabi_quiz' }],
          [{ text: '🌟 صحابي آخر', callback_data: 'get_sahabi_spotlight' }]
        ]
      }
    });
  });

  bot.action('get_sahabi_spotlight', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('🌟 جاري جلب صحابي جليل!').catch(() => {});
    const sahabi = getRandomSahabiSpotlight();
    return ctx.reply(sahabi.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎯 كويز الصحابي التفاعلي (+15 XP)', callback_data: 'take_sahabi_quiz' }],
          [{ text: '🌟 صحابي آخر', callback_data: 'get_sahabi_spotlight' }]
        ]
      }
    });
  });

  bot.action('take_sahabi_quiz', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🎯 سؤال صحابي اليوم!').catch(() => {});
    const sahabi = getRandomSahabiSpotlight();
    if (!sahabi.quiz) return;
    try {
      await bot.telegram.sendQuiz(fromId, sahabi.quiz.question, sahabi.quiz.options, {
        correct_option_id: sahabi.quiz.correct_option_index,
        is_anonymous: false,
        explanation: sahabi.quiz.explanation
      });
    } catch (e) {}
  });`;

handCode = handCode.replace(oldAdminCurriculumHandlers, newAdminCurriculumHandlers);
fs.writeFileSync('./lib/handlers.js', handCode, 'utf8');
console.log('✅ Handlers updated with interactive quiz triggers');
