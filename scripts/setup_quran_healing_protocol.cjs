const fs = require('fs');

// 1. UPDATE SUPABASE.JS
let supaCode = fs.readFileSync('./lib/supabase.js', 'utf8');

const healingProtocolSupaCode = `
// ==============================================================================
// 🌿 30-Day Quran Healing Protocol Engine (الورد القرآني العلاجي لـ د. عبدالله)
// Surahs: سورة ق، سورة الرحمن، سورة الملك، سورة الزلزلة (30 Days)
// ==============================================================================

export async function getAdminHealingProtocol(telegramId = 1191760477) {
  try {
    const { data: sess } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('chat_id', 999333)
      .maybeSingle();

    if (sess?.data) return sess.data;

    const initial = {
      start_date: '2026-09-02',
      target_days: 30,
      surahs: ['سورة ق', 'سورة الرحمن', 'سورة الملك', 'سورة الزلزلة'],
      completed_dates: [],
      current_day_number: 1,
      streak_days: 0,
      updated_at: new Date().toISOString()
    };

    await supabase.from('bot_sessions').upsert({
      chat_id: 999333,
      state: 'quran_healing_protocol',
      data: initial,
      updated_at: new Date().toISOString()
    });

    return initial;
  } catch (e) {
    return {
      start_date: '2026-09-02',
      target_days: 30,
      surahs: ['سورة ق', 'سورة الرحمن', 'سورة الملك', 'سورة الزلزلة'],
      completed_dates: [],
      current_day_number: 1,
      streak_days: 0
    };
  }
}

export async function logAdminHealingDay(telegramId = 1191760477, todayStr = getCairoToday()) {
  try {
    const proto = await getAdminHealingProtocol(telegramId);
    const completed = Array.isArray(proto.completed_dates) ? [...proto.completed_dates] : [];
    
    if (!completed.includes(todayStr)) {
      completed.push(todayStr);
    }

    // Calculate day number since start_date (2026-09-02)
    const startDate = new Date('2026-09-02T00:00:00+03:00');
    const todayDate = new Date();
    const diffTime = Math.abs(todayDate - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const currentDayNum = Math.min(30, Math.max(1, diffDays));

    const updated = {
      ...proto,
      completed_dates: completed,
      current_day_number: currentDayNum,
      streak_days: completed.length,
      updated_at: new Date().toISOString()
    };

    await supabase.from('bot_sessions').upsert({
      chat_id: 999333,
      state: 'quran_healing_protocol',
      data: updated,
      updated_at: new Date().toISOString()
    });

    // Also insert individual Quran logs for all 4 Surahs in quran_logs
    for (const s of ['ق', 'الرحمن', 'الملك', 'الزلزلة']) {
      await supabase.from('quran_logs').insert({
        telegram_id: telegramId,
        surah_name: s,
        pages_count: 3,
        learning_mode: 'recitation_review',
        notes: 'الورد القرآني العلاجي اليومي (30 يوماً)',
        date: todayStr,
        quality_rating: 5
      }).catch(() => {});
    }

    await addDoctorXp(telegramId, 50, 'quran_healing_pro');

    return {
      success: true,
      dayNumber: currentDayNum,
      totalCompleted: completed.length,
      targetDays: 30,
      isFinished: completed.length >= 30
    };
  } catch (e) {
    console.warn('logAdminHealingDay error:', e.message);
    return { success: false, dayNumber: 1, totalCompleted: 1, targetDays: 30 };
  }
}
`;

if (!supaCode.includes('getAdminHealingProtocol')) {
  supaCode += healingProtocolSupaCode;
  fs.writeFileSync('./lib/supabase.js', supaCode, 'utf8');
  console.log('✅ Added getAdminHealingProtocol and logAdminHealingDay to supabase.js');
}

// 2. UPDATE SCHEDULER.JS TO ADD 08:15 PM REMINDER
let schCode = fs.readFileSync('./lib/scheduler.js', 'utf8');

if (!schCode.includes('admin_quran_healing_auto')) {
  const target = `    // C. 🔥 وقود النقاء والتميز الإيماني المسائي (09:15 مساءً) -> [1275-1305 mins]`;
  const addition = `    // 🌿 D. الورد القرآني العلاجي (08:15 مساءً) -> [1215-1245 mins]
    if (curMinutes >= 1215 && curMinutes <= 1245) {
      const healKey = \`admin_quran_healing_auto_\${dateStr}\`;
      if (!(await hasSent(healKey, 86400000))) {
        await markSent(healKey, 86400000);
        const { getAdminHealingProtocol } = await import('./supabase.js');
        const proto = await getAdminHealingProtocol(adminChatId);
        const dayNum = proto.current_day_number || 1;
        const streak = proto.streak_days || 0;

        let msg = \`🌿 <b>الورد القرآني العلاجي اليومي (اليوم \${dayNum} من 30) 📖✨</b>\\n\`;
        msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
        msg += \`🤍 <b>وردك العلاجي لليوم وسكينة نفسك يا د. عبدالله:</b>\\n\`;
        msg += \`1️⃣ <b>سورة ق 💎</b> (آيات البعث واليقين وقرب الله).\\n\`;
        msg += \`2️⃣ <b>سورة الرحمن 🌸</b> (عروس القرآن وتعداد نعم الله والاستشفاء).\\n\`;
        msg += \`3️⃣ <b>سورة الملك 👑</b> (المانعة والمنجية وحصن الليل).\\n\`;
        msg += \`4️⃣ <b>سورة الزلزلة ⚡</b> (تطهير القلب وتعظيم الجزاء).\\n\\n\`;
        msg += \`📊 <b>الإنجاز حتى الآن:</b> \${streak}/30 يوماً مكتملة 🎯\\n\`;
        msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
        msg += \`👇 <i>اضغط للتأكيد عند إتمام تلاوة الورد:</i>\`;

        const keyboard = {
          inline_keyboard: [
            [{ text: \`✅ أتممت قراءة الورد العلاجي كاملاً اليوم (\${dayNum}/30) 🌟\`, callback_data: 'ack_healing_quran_done' }],
            [{ text: '📊 فحص تقدم الـ 30 يوماً', callback_data: 'check_healing_progress' }]
          ]
        };

        await bot.telegram.sendMessage(adminChatId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
      }
    }\n\n    // C. 🔥 وقود النقاء والتميز الإيماني المسائي (09:15 مساءً) -> [1275-1305 mins]`;

  schCode = schCode.replace(target, addition);
  fs.writeFileSync('./lib/scheduler.js', schCode, 'utf8');
  console.log('✅ Added Quran Healing 8:15 PM reminder to scheduler.js');
}

// 3. UPDATE HANDLERS.JS TO ADD ACTIONS
let handCode = fs.readFileSync('./lib/handlers.js', 'utf8');

if (!handCode.includes('ack_healing_quran_done')) {
  const target = `  // Action callbacks`;
  const addition = `  // 🌿 Quran Healing Protocol Actions
  bot.command(['healing', 'ورد_علاجي', 'علاج_قراني', 'سورة_ق'], async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return;
    const proto = await getAdminHealingProtocol(fromId);
    const dayNum = proto.current_day_number || 1;
    const streak = proto.streak_days || 0;

    let msg = \`🌿 <b>برنامج الورد القرآني العلاجي (30 يوماً) 📖✨</b>\\n\`;
    msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
    msg += \`📅 <b>تاريخ البداية:</b> 2 سبتمبر 2026\\n\`;
    msg += \`🎯 <b>اليوم الحالي:</b> <b>اليوم \${dayNum} من 30</b>\\n\`;
    msg += \`🔥 <b>أيام الإنجاز المكتملة:</b> \${streak} / 30 يوماً\\n\\n\`;
    msg += \`📖 <b>السور الأربعة المقررة يومياً:</b>\\n\`;
    msg += \`• 💎 <b>سورة ق</b>\\n\`;
    msg += \`• 🌸 <b>سورة الرحمن</b>\\n\`;
    msg += \`• 👑 <b>سورة الملك</b>\\n\`;
    msg += \`• ⚡ <b>سورة الزلزلة</b>\\n\`;
    msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
    msg += \`✨ <i>«ونُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ»</i>\`;

    const keyboard = {
      inline_keyboard: [
        [{ text: \`✅ أتممت قراءة الورد اليوم (\${dayNum}/30) 🌟\`, callback_data: 'ack_healing_quran_done' }]
      ]
    };
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('ack_healing_quran_done', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('🌿 تقبل الله وردك العلاجي يا دكتور!').catch(() => {});

    const res = await logAdminHealingDay(fromId);
    let msg = \`🎉 <b>تقبل الله طاعتك يا دكتور عبدالله! 🌿✨ (+50 Doctor XP)</b>\\n\`;
    msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
    msg += \`✅ <b>تم توثيق قراءة الورد القرآني العلاجي لليوم:</b>\\n\`;
    msg += \`   ├ 💎 سورة ق\\n\`;
    msg += \`   ├ 🌸 سورة الرحمن\\n\`;
    msg += \`   ├ 👑 سورة الملك\\n\`;
    msg += \`   └ ⚡ سورة الزلزلة\\n\\n\`;
    msg += \`🎯 <b>التقدم المحرز:</b> <b>\${res.totalCompleted} من 30 يوماً</b> مكتملة بنجاح! 🌟\\n\`;
    msg += \`━━━━━━━━━━━━━━━━━━━━━\\n\`;
    msg += \`💡 <i>"قراءة هذه السور بنية الشفاء واليقين تزرع سكينة ونوراً في الصدر لا ينطفئ."</i>\`;

    return ctx.reply(msg, { parse_mode: 'HTML' });
  });

  bot.action('check_healing_progress', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح').catch(() => {});
    await ctx.answerCbQuery('📊 فحص التقدم!').catch(() => {});
    const proto = await getAdminHealingProtocol(fromId);
    return ctx.reply(\`📊 <b>تقدم الورد العلاجي:</b> \${proto.streak_days || 0}/30 يوماً مكتملة (اليوم \${proto.current_day_number || 1} من 30).\`, { parse_mode: 'HTML' });
  });\n\n  // Action callbacks`;

  handCode = handCode.replace(target, addition);
  fs.writeFileSync('./lib/handlers.js', handCode, 'utf8');
  console.log('✅ Added healing protocol handlers and commands to handlers.js');
}
