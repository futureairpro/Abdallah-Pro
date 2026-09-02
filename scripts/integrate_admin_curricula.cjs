const fs = require('fs');

// 1. UPDATE SCHEDULER.JS
let schCode = fs.readFileSync('./lib/scheduler.js', 'utf8');

const importAdminCurriculum = `import { 
  getRandomScientificDiscipline, 
  getRandomAyahWithAsbab, 
  getRandomBukhariHadith, 
  getRandomPropheticSituation, 
  getRandomSahabiSpotlight 
} from './admin_curriculum.js';\n`;

if (!schCode.includes('getRandomScientificDiscipline')) {
  schCode = importAdminCurriculum + schCode;
}

const targetSlot = `    // A. 📖 كبسولة العلم الشرعي الصباحية (09:30 صباحاً) -> [570-600 mins]`;

const newSchedulerSlots = `    // 🧠 1. كبسولة علم الأعصاب والانضباط الذاتي والدوبامين (11:15 صباحاً) -> [675-705 mins]
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
    }\n\n    // A. 📖 كبسولة العلم الشرعي الصباحية (09:30 صباحاً) -> [570-600 mins]`;

if (!schCode.includes('admin_discipline_auto')) {
  schCode = schCode.replace(targetSlot, newSchedulerSlots);
  fs.writeFileSync('./lib/scheduler.js', schCode, 'utf8');
  console.log('✅ Integrated new curricula slots into scheduler.js');
}

// 2. UPDATE HANDLERS.JS
let handCode = fs.readFileSync('./lib/handlers.js', 'utf8');

const importAdminCurriculumHandlers = `import { 
  getRandomScientificDiscipline, 
  getRandomAyahWithAsbab, 
  getRandomBukhariHadith, 
  getRandomPropheticSituation, 
  getRandomSahabiSpotlight 
} from './admin_curriculum.js';\n`;

if (!handCode.includes('getRandomScientificDiscipline')) {
  handCode = importAdminCurriculumHandlers + handCode;
}

const newHandlersCode = `
  // ==============================================================================
  // 👑 Admin Exclusive Curricula Commands & Callbacks (د. عبدالله فقط)
  // ==============================================================================

  // 1. Scientific Discipline
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
  });
`;

if (!handCode.includes("bot.command(['discipline'")) {
  const targetHandlerPos = `  // 🌿 Quran Healing Protocol Actions`;
  handCode = handCode.replace(targetHandlerPos, newHandlersCode + '\n' + targetHandlerPos);
  fs.writeFileSync('./lib/handlers.js', handCode, 'utf8');
  console.log('✅ Integrated commands & callbacks into handlers.js');
}
