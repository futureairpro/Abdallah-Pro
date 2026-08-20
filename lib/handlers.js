// 🌟 Telegram Bot Handlers & Master Action & 24-Hour Undo Engine for Abdullah's Journey OS

import {

  supabase,

  getStoredAiKeys,

  setUserSession,

  getUserSession,

  updateLiquidity,

  getUserProfile,

  registerUserProfile,

  activateUserSubscription,

  getAllRegisteredUsers,

  recordPaymentReceipt,

  ADMIN_CHAT_ID

} from './supabase.js';

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

import { sendMindsetPulse } from './mindset_pulses.js';

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

let handlersRegistered = false;

// ⏱️ In-Memory Fair Use Cooldown Rate Limiter (Max 6 AI requests per minute per student)
const userRequestHistory = new Map();

function checkFairUseRateLimit(fromId) {
  if (!fromId || Number(fromId) === Number(ADMIN_CHAT_ID)) return { allowed: true }; // Admin Dr. Abdullah is 100% exempt
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequestsPerWindow = 6; // Max 6 AI requests per minute
  
  const history = userRequestHistory.get(fromId) || [];
  const recentRequests = history.filter(ts => (now - ts) < windowMs);
  
  if (recentRequests.length >= maxRequestsPerWindow) {
    const waitSecs = Math.max(1, Math.ceil((recentRequests[0] + windowMs - now) / 1000));
    return { allowed: false, waitSecs };
  }
  
  recentRequests.push(now);
  userRequestHistory.set(fromId, recentRequests);
  return { allowed: true };
}

export function registerHandlers(bot) {

  if (!bot || handlersRegistered) return;

  handlersRegistered = true;

  // 🛡️ Middleware: Multi-Tenant Profile & Subscription Gatekeeper

  bot.use(async (ctx, next) => {

    const fromId = ctx.from?.id;

    if (!fromId) return next();

    // Ensure native persistent Web App Menu Button is set for this chat

    ctx.setChatMenuButton({

      type: 'web_app',

      text: '📱 لوحة التحكم',

      web_app: { url: `https://abdallah-pro.vercel.app/?telegram_id=${fromId}` }

    }).catch(() => {});

    // 1. Fetch or initialize profile

    const profile = await getUserProfile(fromId);

    // 2. If user is NOT registered yet:

    if (!profile) {

      const session = await getUserSession(fromId);

      const isRegistering = session?.state === 'registering_name';

      const text = ctx.message?.text?.trim();

      if (isRegistering && text && !text.startsWith('/')) {

        // User supplied their full name

        const newProfile = await registerUserProfile(fromId, {

          fullName: text,

          username: ctx.from?.username

        });

        await setUserSession(fromId, { state: 'idle' });

        // Notify user

        let regMsg = `🎉 <b>أهلاً بك يا ${newProfile.full_name} في منظومة الطب الذكية! 🩺</b>\n`;

        regMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;

        regMsg += `✨ <b>تم تفعيل حسابك وفترتك التجريبية المجانية (3 أيام) بنجاح! 🎁</b>\n\n`;

        regMsg += `🚀 <b>يمكنك الآن:</b>\n`;

        regMsg += `• إرسال تسجيلات صوتية لتوثيق مذاكرتك ومصاريفك ومواعيدك.\n`;

        regMsg += `• حل ومراجعة الكويزات الطبية وفلاش كاردز الإنجليزية بالتكرار المتباعد.\n`;

        regMsg += `• طلب أي تذكيرات (مثال: <i>"ذكرني بعد ساعة أراجع الكارديو"</i>).\n\n`;

        regMsg += `اضغط /menu في أي وقت لفتح القائمة الرئيسية! 👇`;

        await ctx.reply(regMsg, { parse_mode: 'HTML' });

        // Notify Admin Dr. Abdullah

        const adminAlert = `🔔 <b>طالب جديد انضم للمنظومة:</b>\n━━━━━━━━━━━━━━━━━━━━━\n👤 <b>الاسم:</b> ${newProfile.full_name}\n🆔 <b>المعرف:</b> <code>${fromId}</code>\n🔗 <b>اليوزر:</b> @${ctx.from?.username || 'لا يوجد'}\n⏳ <b>الفترة:</b> 3 أيام تجربة مجانية`;

        await bot.telegram.sendMessage(ADMIN_CHAT_ID, adminAlert, {

          parse_mode: 'HTML',

          reply_markup: {

            inline_keyboard: [

              [{ text: '🎁 تفعيل شهر مجاناً (30 يوم)', callback_data: `admin_approve_${fromId}_30` }]

            ]

          }

        }).catch(() => {});

        return;

      }

      // If user hasn't started registration or sent /start

      await setUserSession(fromId, { state: 'registering_name' });

      let promptMsg = `🩺 <b>مرحباً بك في منظومة الطبيب الذكية (الفرقة الرابعة)! 🌟</b>\n`;

      promptMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;

      promptMsg += `المساعد الذكي الأول لطلاب الطب لتنظيم المذاكرة، السكاشن، حل الكويزات، تسجيل المصاريف والمواعيد بالفويس والذكاء الاصطناعي.\n\n`;

      promptMsg += `✍️ <b>من فضلك، اكتب اسمك الكريم للبدء:</b> (مثال: د. أحمد محمد)`;

      return ctx.reply(promptMsg, { parse_mode: 'HTML' });

    }

    // 3. User is registered: Check subscription validity

    if (!profile.is_active) {

      // Check if user uploaded a payment screenshot

      const photos = ctx.message?.photo;

      if (photos && photos.length > 0) {

        const bestPhoto = photos[photos.length - 1];

        const paymentRecord = await recordPaymentReceipt(fromId, {

          photoId: bestPhoto.file_id,

          amount: 30,

          paymentMethod: 'فودافون كاش / إنستا باي'

        });

        await ctx.reply(

          `✅ <b>تم استلام صورة إيصال التحويل بنجاح يا ${profile.full_name}! 📸</b>\n` +

          `━━━━━━━━━━━━━━━━━━━━━\n` +

          `⏳ <b>رقم الطلب:</b> <code>${paymentRecord.id}</code>\n` +

          `جاري مراجعة الإيصال وتفعيل اشتراكك الشهري (30 ج.م) فوراً. ستصلك رسالة تأكيد هنا بمجرد التفعيل! 🌟`,

          { parse_mode: 'HTML' }

        );

        // Send to Admin with Instant Approval Buttons

        const adminPayMsg = `💳 <b>طلب تفعيل اشتراك شهري جديد (إيصال تحويل):</b>\n━━━━━━━━━━━━━━━━━━━━━\n👤 <b>الطالب:</b> ${profile.full_name}\n🆔 <b>المعرف:</b> <code>${fromId}</code>\n🔗 <b>اليوزر:</b> @${profile.username || 'لا يوجد'}\n💵 <b>المبلغ:</b> 30 ج.م (شهرياً)`;

        await bot.telegram.sendPhoto(ADMIN_CHAT_ID, bestPhoto.file_id, {

          caption: adminPayMsg,

          parse_mode: 'HTML',

          reply_markup: {

            inline_keyboard: [

              [

                { text: '✅ قبول وتفعيل شهر (30 يوم)', callback_data: `admin_approve_${fromId}_30` },

                { text: '❌ رفض', callback_data: `admin_reject_${fromId}` }

              ]

            ]

          }

        }).catch(() => {});

        return;

      }

      // Show Paywall

            const isExpiredSub = profile.subscription_status === 'active' || profile.subscription_status === 'expired';
      const headerTitle = isExpiredSub 
        ? `🔒 <b>عفواً يا ${profile.full_name}، انتهت فترة اشتراكك الشهري! 🎯</b>`
        : `🔒 <b>عفواً يا ${profile.full_name}، انتهت فترتك التجريبية المجانية! 🎯</b>`;

      let paywallMsg = `${headerTitle}\n`;
      paywallMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      paywallMsg += `للاشتراك أو تجديد باقتك ومتابعة توثيق مذاكرتك واستخدام المنظومة:\n\n`;
      paywallMsg += `💳 <b>رسوم الاشتراك الشهري:</b> 30 ج.م فقط شهرياً\n\n`;
      paywallMsg += `💸 <b>بيانات التحويل المباشر (فودافون كاش / إنستا باي):</b>\n`;
      paywallMsg += `📱 <b>فودافون كاش:</b> <code>01006311569</code>\n`;
      paywallMsg += `⚡ <b>إنستا باي (InstaPay):</b> <code>01006311569</code>\n\n`;
      paywallMsg += `📞 <b>للتواصل والدعم الفني أو إرسال الإيصال:</b>\n`;
      paywallMsg += `✈️ <b>تليجرام:</b> <a href="https://t.me/Dr31327">@Dr31327</a>\n`;
      paywallMsg += `🟢 <b>واتساب:</b> <a href="https://wa.me/201096247662">+201096247662</a>\n\n`;
      paywallMsg += `📸 <i>بعد التحويل، أرسل صورة الإيصال هنا في الشات وسيتم تفعيل حسابك فوراً!</i> 🚀`;

      const paywallKb = {
        inline_keyboard: [
          [{ text: '✈️ تواصل عبر تليجرام (@Dr31327)', url: 'https://t.me/Dr31327' }],
          [{ text: '🟢 تواصل عبر واتساب (+201096247662)', url: 'https://wa.me/201096247662' }]
        ]
      };

      return ctx.reply(paywallMsg, { parse_mode: 'HTML', reply_markup: paywallKb, disable_web_page_preview: true });

    }

    // Attach profile to context for seamless downstream usage

        // ⏱️ Fair-Use Rate Limit check for non-admin students
    if (ctx.message && (ctx.message.text || ctx.message.voice || ctx.message.audio || ctx.message.photo || ctx.message.document)) {
      const rateCheck = checkFairUseRateLimit(fromId);
      if (!rateCheck.allowed) {
        return ctx.reply(
          `⏳ <b>مهلاً يا دكتور.. لقد أرسلت عدة رسائل متتالية في وقت قصير جداً!</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `لحماية المنظومة وضمان أفضل سرعة استجابة، يرجى الانتظار (<b>${rateCheck.waitSecs} ثانية</b>) وسأكون جاهزاً لاستقبال رسالتك القادمة فوراً 🩺✨`,
          { parse_mode: 'HTML' }
        );
      }
    }

    // Attach profile to context for seamless downstream usage
    ctx.userProfile = profile;
    return next();

  });

  // Set Persistent Native Telegram Chat Menu Button

  bot.telegram.setChatMenuButton({

    menu_button: {

      type: 'web_app',

      text: '📱 لوحة التحكم',

      web_app: { url: 'https://abdallah-pro.vercel.app/' }

    }

  }).catch(() => {});

  // ==============================================================================

    // ==============================================================================
  // 💬 Customer Support & Subscription Help Commands
  // ==============================================================================
  bot.command(['support', 'contact', 'help_support', 'subscribe', 'renew', 'pay', 'help'], async (ctx) => {
    let supportMsg = `💳 <b>الاشتراك وتجديد الباقة الشهرية والدعم الفني:</b>\n`;
    supportMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    supportMsg += `أهلاً بك يا دكتور! يمكنك الاشتراك أو تجديد باقتك الشهرية بكل سهولة:\n\n`;
    supportMsg += `💰 <b>قيمة الاشتراك الشهري:</b> 30 ج.م فقط.\n\n`;
    supportMsg += `💸 <b>بيانات التحويل المباشر (فودافون كاش / إنستا باي):</b>\n`;
    supportMsg += `📱 <b>فودافون كاش:</b> <code>01006311569</code>\n`;
    supportMsg += `⚡ <b>إنستا باي (InstaPay):</b> <code>01006311569</code>\n\n`;
    supportMsg += `📸 <i>بعد التحويل، أرسل صورة إيصال التحويل هنا في الشات وسيتم تفعيل حسابك فوراً!</i>\n\n`;
    supportMsg += `📞 <b>لأي استفسار أو مشكلة تواصل مباشرة مع الدعم الفني:</b>\n`;
    supportMsg += `✈️ <b>تليجرام:</b> <a href="https://t.me/Dr31327">@Dr31327</a>\n`;
    supportMsg += `🟢 <b>واتساب:</b> <a href="https://wa.me/201096247662">+201096247662</a>\n\n`;
    supportMsg += `👇 <i>اضغط على أحد الأزرار أدناه للتواصل المباشر:</i>`;

    const supportKb = {
      inline_keyboard: [
        [{ text: '✈️ تواصل عبر تليجرام (@Dr31327)', url: 'https://t.me/Dr31327' }],
        [{ text: '🟢 تواصل عبر واتساب (+201096247662)', url: 'https://wa.me/201096247662' }]
      ]
    };
    return ctx.reply(supportMsg, { parse_mode: 'HTML', reply_markup: supportKb, disable_web_page_preview: true });
  });

  // 🌟 1. /start & Main Menu

  // ==============================================================================

  bot.command(['start', 'menu', 'help'], async (ctx) => {

    const name = ctx.userProfile?.full_name || ctx.from?.first_name || 'دكتور';

    const fromId = ctx.from?.id;

    const prayers = getCairoPrayerTimes();

    let welcome = Number(fromId) === ADMIN_CHAT_ID

      ? `👑 <b>أهلاً بك يا دكتور عبدالله في منظومة رحلة عبدالله الذكية (Abdullah's Journey OS)!</b>\n`

      : `🩺 <b>أهلاً بك يا ${name} في منظومة الطبيب الذكية (Doctor OS)!</b>\n`;

    welcome += `━━━━━━━━━━━━━━━━━━━━━\n`;

    welcome += `🕌 <b>مواقيت الصلاة الحية بالقاهرة اليوم (نظام 12 ساعة):</b>\n`;

    welcome += `• الفجر: <b>${prayers.times12.fajr}</b> | الشروق: <b>${prayers.times12.sunrise}</b> | الظهر: <b>${prayers.times12.dhuhr}</b>\n`;

    welcome += `• العصر: <b>${prayers.times12.asr}</b> | المغرب: <b>${prayers.times12.maghrib}</b> | العشاء: <b>${prayers.times12.isha}</b>\n`;

    welcome += `━━━━━━━━━━━━━━━━━━━━━\n`;

    welcome += `⚡ <b>المحرك التفاعلي ونظام التراجع (24 ساعة) نشط الآن على كافة الأزرار!</b>\n\n`;

    welcome += `👇 <b>تصفح الأقسام الذكية وافتح لوحة التحكم الرسومية بالأسفل:</b>`;

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

          { text: '💬 الدعم الفني والاشتراكات', url: 'https://t.me/Dr31327' },

          { text: '💵 الخزنة والمصروفات الشخصية', callback_data: 'menu_finance' }

        ]

      ]

    };

    return ctx.reply(welcome, { parse_mode: 'HTML', reply_markup: keyboard });

  });

  // ==============================================================================

  // 👑 Admin Control Panel (/admin, /grant, /broadcast)

  // ==============================================================================

  bot.command('admin', async (ctx) => {

    const fromId = ctx.from?.id;

    if (Number(fromId) !== ADMIN_CHAT_ID) {

      return ctx.reply('⛔ هذا الأمر مخصص فقط لمدير المنظومة (د. عبدالله).');

    }

    const users = await getAllRegisteredUsers();

    const total = users.length + 1;

    const active = users.filter(u => u.subscription_status === 'active' || u.subscription_status === 'lifetime').length + 1;

    const trials = users.filter(u => u.subscription_status === 'trial').length;

    const expired = users.filter(u => u.subscription_status === 'expired').length;

    const estimatedRev = active * 30;

    let adminMsg = `👑 <b>لوحة تحكم إدارة منصة الدفعة (Doctor OS Admin) 🚀</b>\n`;

    adminMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;

    adminMsg += `👥 <b>إجمالي الطلاب المسجلين:</b> <b>${total} طالب</b>\n`;

    adminMsg += `🟢 <b>المشتركين النشطين:</b> <b>${active} مشترك</b>\n`;

    adminMsg += `⏳ <b>في الفترة التجريبية:</b> <b>${trials} طالب</b>\n`;

    adminMsg += `🔒 <b>المنتهية فتراتهم:</b> <b>${expired} طالب</b>\n`;

    adminMsg += `💰 <b>إجمالي الإيرادات الشهرية:</b> <b>${formatEgp(estimatedRev)} / شهر</b>\n`;

    adminMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;

    adminMsg += `⚡ <b>أوامر سريعة:</b>\n`;

    adminMsg += `• تفعيل طالب: <code>/grant &lt;telegram_id&gt; [أيام]</code>\n`;

    adminMsg += `• رسالة للدفعة: <code>/broadcast &lt;رسالتك&gt;</code>\n`;

    const keyboard = {

      inline_keyboard: [

        [

          { text: '📋 عرض قائمة الطلاب', callback_data: 'admin_list_users' }

        ]

      ]

    };

    return ctx.reply(adminMsg, { parse_mode: 'HTML', reply_markup: keyboard });

  });

  bot.command('grant', async (ctx) => {

    const fromId = ctx.from?.id;

    if (Number(fromId) !== ADMIN_CHAT_ID) return;

    const parts = ctx.message.text.split(' ').filter(Boolean);

    if (parts.length < 2) {

      return ctx.reply('⚠️ الاستخدام: <code>/grant &lt;telegram_id&gt; [عدد_الأيام]</code>', { parse_mode: 'HTML' });

    }

    const targetId = parts[1];

    const days = Number(parts[2]) || 30;

    const success = await activateUserSubscription(targetId, days, 'تفعيل يدوي من المدير');

    if (success) {

      await ctx.reply(`✅ تم تفعيل الاشتراك للطالب <code>${targetId}</code> لمدة <b>${days} يوم</b> بنجاح!`, { parse_mode: 'HTML' });

      await bot.telegram.sendMessage(targetId, `🎉 <b>تهانينا يا دكتور! تم تفعيل اشتراكك الكامل في المنظومة لمدة ${days} يوم بنجاح! 🩺✨</b>\n\nاضغط /menu للبدء.`, { parse_mode: 'HTML' }).catch(() => {});

    } else {

      await ctx.reply(`❌ تعذر تفعيل الاشتراك.`);

    }

  });

  bot.command('broadcast', async (ctx) => {

    const fromId = ctx.from?.id;

    if (Number(fromId) !== ADMIN_CHAT_ID) return;

    const text = ctx.message.text.replace(/^\/broadcast\s*/i, '').trim();

    if (!text) {

      return ctx.reply('⚠️ اكتب الرسالة بعد الأمر: <code>/broadcast مرحباً يا دكاترة...</code>', { parse_mode: 'HTML' });

    }

    const users = await getAllRegisteredUsers();

    let sentCount = 0;

    for (const u of users) {

      if (u.telegram_id && u.telegram_id !== ADMIN_CHAT_ID) {

        await bot.telegram.sendMessage(u.telegram_id, `📢 <b>رسالة عامة من إدارة المنظومة:</b>\n━━━━━━━━━━━━━━━━━━━━━\n${text}`, { parse_mode: 'HTML' }).catch(() => {});

        sentCount++;

      }

    }

    return ctx.reply(`✅ تم إرسال الرسالة إلى <b>${sentCount} طالب</b> بنجاح!`, { parse_mode: 'HTML' });

  });

  // Admin Action Callbacks

  bot.action(/^admin_approve_(\d+)_(\d+)$/, async (ctx) => {

    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك');

    const targetId = ctx.match[1];

    const days = Number(ctx.match[2]) || 120;

    await activateUserSubscription(targetId, days, 'موافقة على الإيصال');

    await ctx.editMessageCaption(`✅ <b>تم قبول الإيصال وتفعيل الاشتراك للطالب <code>${targetId}</code> لمدة ${days} يوم بنجاح! 🎉</b>`, { parse_mode: 'HTML' }).catch(() => {});

    await bot.telegram.sendMessage(targetId, `🎉 <b>تم تأكيد استلام التحويل وتفعيل اشتراكك الفصلي (${days} يوم) بنجاح يا دكتور! 🩺✨</b>\n\nاضغط /menu للبدء والاستمتاع بكافة مميزات المنظومة.`, { parse_mode: 'HTML' }).catch(() => {});

    return ctx.answerCbQuery('تم تفعيل الحساب بنجاح!');

  });

  bot.action(/^admin_reject_(\d+)$/, async (ctx) => {

    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك');

    const targetId = ctx.match[1];

    await ctx.editMessageCaption(`❌ <b>تم رفض طلب التفعيل للطالب <code>${targetId}</code>.</b>`, { parse_mode: 'HTML' }).catch(() => {});

    await bot.telegram.sendMessage(targetId, `⚠️ <b>عفواً يا دكتور، تعذر التحقق من إيصال التحويل المرسل.</b>\nيرجى التأكد من صحة التحويل وإعادة إرسال صورة الإيصال واضحة.`, { parse_mode: 'HTML' }).catch(() => {});

    return ctx.answerCbQuery('تم رفض الطلب');

  });

  bot.action('admin_list_users', async (ctx) => {

    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك');

    const users = await getAllRegisteredUsers();

    if (users.length === 0) {

      return ctx.reply('📋 لا يوجد طلاب مسجلين بعد.');

    }

    let listMsg = `📋 <b>قائمة الطلاب المسجلين بالمنظومة (${users.length} طالب):</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;

    users.forEach((u, idx) => {

      const statusIcon = u.subscription_status === 'active' || u.subscription_status === 'lifetime' ? '🟢' : (u.subscription_status === 'trial' ? '⏳' : '🔒');

      listMsg += `${idx + 1}. ${statusIcon} <b>${u.full_name}</b> (@${u.username || 'لا_يوجد'})\n   └ 🆔 <code>${u.telegram_id}</code> | الحالة: ${u.subscription_status}\n`;

    });

    return ctx.reply(listMsg, { parse_mode: 'HTML' });

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

      // 💬 Support / Subscription / Contact Intent Detection (if voice caption exists)
      const captionText = (ctx.message.caption || '').trim().toLowerCase();
      if (captionText) {
        const isSupportIntent = (
          captionText.includes('اشتراك') || captionText.includes('اشترك') || captionText.includes('تجديد') ||
          captionText.includes('دعم') || captionText.includes('مشكلة') || captionText.includes('تواصل') ||
          captionText.includes('خدمة العملاء') || captionText.includes('خدمه العملاء') || captionText.includes('مساعدة') ||
          captionText.includes('واتس') || captionText.includes('تليجرام') || captionText.includes('ادمن') ||
          captionText.includes('support') || captionText.includes('contact') || captionText.includes('whatsapp')
        );

        if (isSupportIntent) {
          await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
          let supportMsg = `💳 <b>الاشتراك وتجديد الباقة الشهرية والدعم الفني:</b>\n`;
          supportMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
          supportMsg += `أهلاً بك يا دكتور! يمكنك الاشتراك أو تجديد باقتك الشهرية بكل سهولة:\n\n`;
          supportMsg += `💰 <b>قيمة الاشتراك الشهري:</b> 30 ج.م فقط.\n\n`;
          supportMsg += `💸 <b>بيانات التحويل المباشر (فودافون كاش / إنستا باي):</b>\n`;
          supportMsg += `📱 <b>فودافون كاش:</b> <code>01006311569</code>\n`;
          supportMsg += `⚡ <b>إنستا باي (InstaPay):</b> <code>01006311569</code>\n\n`;
          supportMsg += `📸 <i>بعد التحويل، أرسل صورة إيصال التحويل هنا في الشات وسيتم تفعيل حسابك فوراً!</i>\n\n`;
          supportMsg += `📞 <b>لأي استفسار أو مشكلة تواصل مباشرة مع الدعم الفني:</b>\n`;
          supportMsg += `✈️ <b>تليجرام:</b> <a href="https://t.me/Dr31327">@Dr31327</a>\n`;
          supportMsg += `🟢 <b>واتساب:</b> <a href="https://wa.me/201096247662">+201096247662</a>\n\n`;
          supportMsg += `👇 <i>اضغط على أحد الأزرار أدناه للتواصل المباشر:</i>`;

          const supportKb = {
            inline_keyboard: [
              [{ text: '✈️ تواصل عبر تليجرام (@Dr31327)', url: 'https://t.me/Dr31327' }],
              [{ text: '🟢 تواصل عبر واتساب (+201096247662)', url: 'https://wa.me/201096247662' }]
            ]
          };
          return ctx.reply(supportMsg, { parse_mode: 'HTML', reply_markup: supportKb, disable_web_page_preview: true });
        }
      }

      if (isEnglishMode) {

        const coachResult = await talkWithEnglishCoach(audioBuffer, aiKeys, true);

        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

        if (Array.isArray(coachResult.elevated_vocabulary) && coachResult.elevated_vocabulary.length > 0) {

          const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();

          for (const v of coachResult.elevated_vocabulary) {

            if (v.word) {

              await supabase.from('english_spaced_flashcards').insert({

                term_or_sentence: v.word,

                egyptian_translation: v.definition || 'مفردة متقدمة من المحادثة الصوتية',

                example_sentence: v.example || null,

                usage_context: 'English Coach Audio Practice',

                repetition_level: 0,

                next_review_at: nextReview

              }).catch(() => {});

            }

          }

        }

        const fallbackReply = Number(fromId) === ADMIN_CHAT_ID ? 'Well said, Dr. Abdallah!' : 'Well said, Doctor!';
        let msg = `🗣️ <b>English Coach Feedback:</b>\n━━━━━━━━━━━━━━━━━━━━━\n💬 <b>Reply:</b>\n${coachResult.conversational_reply || fallbackReply}\n\n`;

        if (coachResult.corrections?.length > 0) {

          msg += `🛠️ <b>Corrections:</b>\n`;

          coachResult.corrections.forEach(c => msg += `• ❌ <s>${c.original}</s> ➔ ✅ <b>${c.corrected}</b> (${c.reason})\n`);

          msg += `\n`;

        }

        if (coachResult.elevated_vocabulary?.length > 0) {

          msg += `✨ <b>High-Yield Vocabulary (Saved to Spaced Repetition):</b>\n`;

          coachResult.elevated_vocabulary.forEach(v => msg += `• 🌟 <b>${v.word}</b>: ${v.definition}\n  <i>Ex: ${v.example}</i>\n`);

          msg += `\n`;

        }

        msg += `🎯 <b>Fluency Score:</b> <b>${coachResult.fluency_score || 85}/100</b>\n━━━━━━━━━━━━━━━━━━━━━\n🎙️ <i>Send another voice note to continue!</i>`;

        return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔄 إنهاء وضع الإنجليزية والعودة', callback_data: 'exit_english_mode' }]] } });

      }

      const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'د. عبدالله' : 'دكتور زميل');

      const parsedResult = await parseWithGeminiPool(audioBuffer, aiKeys, true, studentName);

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

      // 💬 Support / Subscription / Contact Intent Detection
      const normText = text.toLowerCase();
      const isSupportIntent = (
        normText.includes('اشتراك') || normText.includes('اشترك') || normText.includes('تجديد') ||
        normText.includes('دعم') || normText.includes('مشكلة') || normText.includes('تواصل') ||
        normText.includes('خدمة العملاء') || normText.includes('خدمه العملاء') || normText.includes('مساعدة') ||
        normText.includes('واتس') || normText.includes('تليجرام') || normText.includes('ادمن') ||
        normText.includes('support') || normText.includes('contact') || normText.includes('whatsapp')
      );

      if (isSupportIntent) {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        let supportMsg = `💳 <b>الاشتراك وتجديد الباقة الشهرية والدعم الفني:</b>\n`;
        supportMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        supportMsg += `أهلاً بك يا دكتور! يمكنك الاشتراك أو تجديد باقتك الشهرية بكل سهولة:\n\n`;
        supportMsg += `💰 <b>قيمة الاشتراك الشهري:</b> 30 ج.م فقط.\n\n`;
        supportMsg += `💸 <b>بيانات التحويل المباشر (فودافون كاش / إنستا باي):</b>\n`;
        supportMsg += `📱 <b>فودافون كاش:</b> <code>01006311569</code>\n`;
        supportMsg += `⚡ <b>إنستا باي (InstaPay):</b> <code>01006311569</code>\n\n`;
        supportMsg += `📸 <i>بعد التحويل، أرسل صورة إيصال التحويل هنا في الشات وسيتم تفعيل حسابك فوراً!</i>\n\n`;
        supportMsg += `📞 <b>لأي استفسار أو مشكلة تواصل مباشرة مع الدعم الفني:</b>\n`;
        supportMsg += `✈️ <b>تليجرام:</b> <a href="https://t.me/Dr31327">@Dr31327</a>\n`;
        supportMsg += `🟢 <b>واتساب:</b> <a href="https://wa.me/201096247662">+201096247662</a>\n\n`;
        supportMsg += `👇 <i>اضغط على أحد الأزرار أدناه للتواصل المباشر:</i>`;

        const supportKb = {
          inline_keyboard: [
            [{ text: '✈️ تواصل عبر تليجرام (@Dr31327)', url: 'https://t.me/Dr31327' }],
            [{ text: '🟢 تواصل عبر واتساب (+201096247662)', url: 'https://wa.me/201096247662' }]
          ]
        };
        return ctx.reply(supportMsg, { parse_mode: 'HTML', reply_markup: supportKb, disable_web_page_preview: true });
      }

      if (isEnglishMode) {

        const coachResult = await talkWithEnglishCoach(text, aiKeys, false);

        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

        if (Array.isArray(coachResult.elevated_vocabulary) && coachResult.elevated_vocabulary.length > 0) {

          const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();

          for (const v of coachResult.elevated_vocabulary) {

            if (v.word) {

              await supabase.from('english_spaced_flashcards').insert({

                term_or_sentence: v.word,

                egyptian_translation: v.definition || 'مفردة من محادثة الشات',

                example_sentence: v.example || null,

                usage_context: 'English Coach Text Chat',

                repetition_level: 0,

                next_review_at: nextReview

              }).catch(() => {});

            }

          }

        }

        const fallbackReply = Number(fromId) === ADMIN_CHAT_ID ? 'Great message, Dr. Abdallah!' : 'Great message, Doctor!';
        let msg = `🗣️ <b>English Coach Feedback:</b>\n\n💬 ${coachResult.conversational_reply || fallbackReply}\n\n`;

        if (coachResult.corrections?.length > 0) {

          msg += `🛠️ <b>Corrections:</b>\n`;

          coachResult.corrections.forEach(c => msg += `• <s>${c.original}</s> ➔ <b>${c.corrected}</b> (${c.reason})\n`);

        }

        return ctx.reply(msg, { parse_mode: 'HTML' });

      }

      const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'د. عبدالله' : 'دكتور زميل');

      const parsedResult = await parseWithGeminiPool(text, aiKeys, false, studentName);

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
    const fromId = ctx.from?.id;

    // 📚 1. PDF / Document Guardrails (Prevent textbook abuse & quota drains)
    if (document) {
      const isPdf = document.mime_type === 'application/pdf' || document.file_name?.toLowerCase().endsWith('.pdf');
      const fileSizeMb = (document.file_size || 0) / (1024 * 1024);

      if (isPdf && fileSizeMb > 3) {
        let msg = `📚 <b>حجم الملف كبير جداً يا دكتور (${fileSizeMb.toFixed(1)} ميجابايت)!</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `✨ منظومتنا مصممة كـ <b>مساعد تنفيذي وطبي ذكي</b> لتوثيق ساعات مذاكرتك، تنظيم محاضراتك وسكاشنك، حل الكويزات، وتتبع المحافظ والمواعيد اليومية بالفويس والشات.\n\n`;
        msg += `💡 <i>لقراءة وتلخيص الكتب والمراجع الضخمة، ننصحك باستخدام تطبيق Google Gemini أو ChatGPT مباشرة.</i>`;
        return ctx.reply(msg, { parse_mode: 'HTML' });
      }

      if (!document.mime_type?.startsWith('image/') && !isPdf) {
        return ctx.reply('⚠️ عذراً يا دكتور، المنظومة تقبل الرسائل الصوتية، الشات، وصور الجداول والإيصالات فقط.', { parse_mode: 'HTML' });
      }
    }

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

        const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'دكتور عبدالله' : 'يا دكتور');

        replyMsg = `🕌 <b>تقبل الله صلاتك وطاعتك يا ${studentName}! 🤍</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>مدة رحلة الصلاة والمسجد:</b> <b>${elapsedMins} دقيقة</b>\n📍 تم تسجيل وقت الذهاب والإياب بنجاح لحساب أوقات انتقالك اليومية بدقة!`;

      } else if (active.type === 'study') {

        const { data: pastSessions } = await supabase.from('study_sessions').select('duration_minutes').eq('date', today);

        let totalMins = elapsedMins;

        (pastSessions || []).forEach(s => totalMins += Number(s.duration_minutes || 0));

        await supabase.from('study_sessions').insert({

          course_code: active.course || 'CAD402',

          topic: `[usr:${fromId}] ${active.topic || 'جلسة مذاكرة وتركيز'}`,

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

          workout_type: `[usr:${fromId}] ${active.workout || 'تمرين عام'}`,

          duration_minutes: elapsedMins,

          date: today

        });

        replyMsg = `🏋️‍♂️ <b>عاش يا بطل! تم إنهاء التمرين وتوثيق الجلسة! 💪</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>مدة التمرين:</b> <b>${elapsedMins} دقيقة</b>`;

      } else if (active.type === 'quran') {

        await supabase.from('quran_logs').insert({

          surah_name: `[usr:${fromId}] ${active.surah || 'ورد التثبيت اليومي'}`,

          session_type: 'ورد يومي',

          pages_count: 5,

          date: today

        });

        replyMsg = `📖 <b>كتب الله أجرك وثبّت القرآن في صدرك! 🤍</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>مدة الورد:</b> <b>${elapsedMins} دقيقة</b> (الهدف اليومي: 30 دقيقة)`;

      } else if (active.type === 'english') {

        await supabase.from('study_sessions').insert({

          course_code: 'ENG',

          topic: 'جلسة ممارسة محادثة إنجليزية',

          duration_minutes: elapsedMins,

          session_type: 'ممارسة لغوية',

          date: today

        }).catch(() => {});

        replyMsg = `🗣️ <b>Great job, Dr. Abdallah! English session logged. 🌟</b>\n━━━━━━━━━━━━━━━━━━━━━\n⏱️ <b>Duration:</b> <b>${elapsedMins} mins</b> (Goal: 30 mins)`;

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

    const recordedUndoItems = [];

    const financeReversions = [];

    const financeItems = [];

    const undoActionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let todayStudyTotalMinutes = 0;

    // 1. English Flashcards

    if (Array.isArray(data.english_flashcards) && data.english_flashcards.length > 0) {

      for (const card of data.english_flashcards) {

        try {

          if (card.term_or_sentence) {

            const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();

            const { data: row } = await supabase.from('english_spaced_flashcards').insert({

              term_or_sentence: card.term_or_sentence,

              egyptian_translation: card.egyptian_translation || 'ترجمة مصرية دارجة',

              example_sentence: card.example_sentence || null,

              category: card.category || 'medical_daily',

              repetition_level: 0,

              next_review_at: nextReview

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'english_spaced_flashcards', id: row.id, summary: `🗣️ فلاش كارد [${card.term_or_sentence}]` });

            }

            insertedSummary.push(`🗣️ <b>فلاش كارد إنجليزي:</b> <code>${card.term_or_sentence}</code>\n   └ 🇪🇬 <b>المعنى:</b> ${card.egyptian_translation || 'جاهز للمراجعة'}`);

          }

        } catch (e) {

          console.warn('english_flashcards insert error:', e.message);

        }

      }

    }

    // 2. Medical Quizzes

    if (Array.isArray(data.medical_quizzes) && data.medical_quizzes.length > 0) {

      for (const q of data.medical_quizzes) {

        try {

          if (q.question) {

            const nextReview = new Date(Date.now() + 12 * 3600 * 1000).toISOString();

            const { data: row } = await supabase.from('medical_spaced_quizzes').insert({

              course_code: q.course_code || 'CAD402',

              topic: q.topic || 'High-Yield Clinical Question',

              question: q.question,

              answer_and_explanation: q.answer_and_explanation || 'الإجابة النموذجية وتريكة الراوند',

              doctor_pearl: q.doctor_pearl || null,

              repetition_level: 0,

              next_review_at: nextReview

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'medical_spaced_quizzes', id: row.id, summary: `🩺 كويز طبي [${q.course_code || 'CAD402'}]` });

            }

            insertedSummary.push(`🩺 <b>كويز طبي [${q.course_code || 'CAD402'}]:</b> ${q.topic || 'سؤال سريري'}\n   └ ❓ <b>السؤال:</b> ${q.question.slice(0, 55)}...\n   └ 💡 <b>تريكة الراوند:</b> ${q.doctor_pearl || 'جاهز للمراجعة'}`);

          }

        } catch (e) {

          console.warn('medical_quizzes insert error:', e.message);

        }

      }

    }

    // 3. Prayer Relative Reminders

    if (Array.isArray(data.prayer_relative_reminders) && data.prayer_relative_reminders.length > 0) {

      for (const pr of data.prayer_relative_reminders) {

        try {

          if (pr.prayer_name) {

            const targetTimeStr = getRelativePrayerTarget(pr.prayer_name, pr.offset_minutes || 30);

            const dueDateTimeUtc = new Date(`${todayDate}T${targetTimeStr}:00+03:00`).toISOString();

            const { data: row } = await supabase.from('appointments_and_reminders').insert({

              title: pr.title || `تذكير بعد صلاة ${pr.prayer_name}`,

              due_datetime: dueDateTimeUtc,

              notes: `محسوبة تلقائياً بعد أذان ${pr.prayer_name} بـ ${pr.offset_minutes || 30} دقيقة`,

              date: todayDate,

              is_notified: false,

              is_completed: false

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'appointments_and_reminders', id: row.id, summary: `🕌 تذكير بعد ${pr.prayer_name}` });

            }

            insertedSummary.push(`🕌 <b>تذكير مرتبط بالأذان:</b> <b>${pr.title || 'مهمة'}</b>\n   └ ⏰ بعد أذان ${pr.prayer_name} بـ ${pr.offset_minutes || 30} دقيقة (الساعة ${targetTimeStr})`);

          }

        } catch (e) {

          console.warn('prayer_relative_reminders insert error:', e.message);

        }

      }

    }

    // 4. Attendance

    if (Array.isArray(data.attendance) && data.attendance.length > 0) {

      for (const att of data.attendance) {

        try {

          if (att.session_title || att.course_code) {

            const { data: row } = await supabase.from('attendance_logs').insert({

              course_code: att.course_code || 'CAD402',

              session_title: att.session_title || 'سيكشن عملي',

              status: att.status || 'حضور',

              reason: att.reason || null,

              makeup_plan: att.makeup_plan || null,

              date: todayDate

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'attendance_logs', id: row.id, summary: `📝 حضور [${att.course_code || 'راوند'}]` });

            }

            insertedSummary.push(`📝 <b>حضور وغياب [${att.course_code || 'CAD402'}]:</b> ${att.session_title || 'سيكشن'}\n   └ 📌 <b>الحالة:</b> ${att.status === 'حضور' ? '🟢 حاضر' : '🔴 غياب'}${att.reason ? ` (السبب: ${att.reason})` : ''}`);

          }

        } catch (e) {

          console.warn('attendance insert error:', e.message);

        }

      }

    }

    // 5. Mental Wellness

    if (data.mental_wellness && (data.mental_wellness.raw_dump || data.mental_wellness.emotion_tags?.length > 0)) {

      const w = data.mental_wellness;

      try {

        const { data: row } = await supabase.from('mental_wellness_logs').insert({

          raw_dump: w.raw_dump || 'فضفضة مسجلة بالصوت',

          stress_level: Number(w.stress_level || 3),

          focus_clarity: Number(w.focus_clarity || 4),

          gratitude_note: w.gratitude_note || null,

          emotion_tags: Array.isArray(w.emotion_tags) ? w.emotion_tags : [],

          ai_therapeutic_feedback: w.ai_therapeutic_feedback || null,

          date: todayDate

        }).select('id').maybeSingle();

        if (row?.id) {

          recordedUndoItems.push({ table: 'mental_wellness_logs', id: row.id, summary: `🧠 فضفضة واتزان نفسي` });

        }

        insertedSummary.push(`🧠 <b>فضفضة واتزان نفسي:</b> تم حفظ المشاعر والتحليل الذكي\n   └ 🧘 <b>مستوى الصفاء الذهني:</b> ${w.focus_clarity || 4}/5 | ⚡ <b>التوتر:</b> ${w.stress_level || 3}/5`);

      } catch (e) {

        console.warn('mental_wellness insert error:', e.message);

      }

    }

    // 6. Fasting & Sunnah

    let previousFastingSnapshot = null;

    if (data.fasting_worship && (data.fasting_worship.fasting_type || data.fasting_worship.sunan_rawatib_count != null || data.fasting_worship.adhkar_morning || data.fasting_worship.adhkar_evening)) {

      const fw = data.fasting_worship;

      try {

        const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', todayDate).maybeSingle();

        previousFastingSnapshot = existing ? { ...existing } : null;

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

        insertedSummary.push(`🌙 <b>الصيام والسنن والأذكار:</b>\n   └ ${fw.fasting_type ? `✨ ${fw.fasting_type} | ` : ''}🕌 سنن: ${payload.sunan_rawatib_count} ركعة | 🌅 صباح: ${payload.adhkar_morning ? '✅' : '—'} | 🌇 مساء: ${payload.adhkar_evening ? '✅' : '—'}`);

      } catch (e) {

        console.warn('fasting_worship upsert error:', e.message);

      }

    }

    // 7. Finance (Defaults to 'خزنة شخصية' / كاش if not specified)

    if (Array.isArray(data.finance) && data.finance.length > 0) {

      for (const f of data.finance) {

        try {

          const amt = Number(f.amount || 0);

          if (amt > 0) {

            const type = f.type || 'مصروف';

            let method = f.payment_method || 'خزنة شخصية';

            const cleanMethod = String(method).trim();

            if (cleanMethod.includes('فودافون')) method = 'فودافون كاش';

            else if (cleanMethod.includes('إنستا') || cleanMethod.includes('انستا')) method = 'إنستا باي';

            else if (cleanMethod.includes('بنك')) method = 'بنك مصر';

            else method = 'خزنة شخصية';

            const rawDesc = f.description || (type === 'إيراد' ? 'استلام نقدية' : 'مصروف شخصي');

            const description = `[usr:${fromId}] ${rawDesc}`.trim();

            const category = f.category || 'عام';

            const { data: row } = await supabase.from('personal_finance').insert({

              type: type,

              amount: amt,

              category: category,

              payment_method: method,

              description: description,

              date: todayDate

            }).select('id').maybeSingle();

            const factor = (type === 'إيراد') ? 1 : -1;

            await updateLiquidity(method, factor * amt, fromId);

            if (row?.id) {

              recordedUndoItems.push({ table: 'personal_finance', id: row.id, summary: `💵 ${type}: ${formatEgp(amt)} عبر ${method}` });

              financeReversions.push({ method: method, amountChange: -1 * factor * amt });

              financeItems.push({ id: row.id, type: type, amount: amt, method: method, category: category, description: rawDesc });

            }

            insertedSummary.push(`💵 <b>${type}:</b> <b>${formatEgp(amt)}</b>\n   └ 🏷️ <b>البند:</b> ${rawDesc || category} | 💳 <b>الخزنة:</b> ${method}`);

          }

        } catch (e) {

          console.warn('finance insert error:', e.message);

        }

      }

    }

    // 8. Thoughts

    if (Array.isArray(data.thoughts) && data.thoughts.length > 0) {

      for (const t of data.thoughts) {

        try {

          if (t.content) {

            const rawContent = t.content;

            const { data: row } = await supabase.from('thoughts_and_wisdom').insert({

              content: `[usr:${fromId}] ${rawContent}`,

              category: t.category || 'فلسفة وانضباط',

              tags: Array.isArray(t.tags) ? t.tags : ['انضباط'],

              date: todayDate

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'thoughts_and_wisdom', id: row.id, summary: `💡 خاطرة [${t.category || 'فلسفة'}]` });

            }

            insertedSummary.push(`💡 <b>خاطرة محفوظة [${t.category || 'فلسفة وانضباط'}]:</b>\n   └ <i>"${rawContent}"</i>`);

          }

        } catch (e) {

          console.warn('thoughts insert error:', e.message);

        }

      }

    }

    // 9. Appointments & Reminders

    if (Array.isArray(data.appointments) && data.appointments.length > 0) {

      for (const a of data.appointments) {

        try {

          const apptTitle = a.title || a.name || a.task_title || 'تذكير موعد';

          let dueDt = a.due_datetime || a.due_time || a.datetime;

          if (apptTitle && dueDt) {

            let isoStr = String(dueDt).trim();

            // Normalize timezone to Cairo +03:00 if missing offset

            if (!isoStr.includes('Z') && !isoStr.includes('+') && !isoStr.includes('-') && isoStr.includes('T')) {

              isoStr = `${isoStr}+03:00`;

            } else if (!isoStr.includes('T') && isoStr.includes(':')) {

              isoStr = `${todayDate}T${isoStr}:00+03:00`;

            }

            const dateObj = new Date(isoStr);

            const finalUtcIso = isNaN(dateObj.getTime()) ? new Date(Date.now() + 3600000).toISOString() : dateObj.toISOString();

            const { data: row } = await supabase.from('appointments_and_reminders').insert({

              title: apptTitle,

              due_datetime: finalUtcIso,

              remind_at: a.remind_at ? new Date(a.remind_at).toISOString() : null,

              notes: `[usr:${fromId}] ${a.notes || ''}`.trim(),

              date: todayDate,

              is_notified: false,

              is_completed: false

            }).select('id').maybeSingle();

            if (row?.id) {
              recordedUndoItems.push({ table: 'appointments_and_reminders', id: row.id, summary: `⏰ موعد / تذكير: ${apptTitle}` });

              // Fast-track immediate timer for short delays (<= 15 minutes)
              const delayMs = new Date(finalUtcIso).getTime() - Date.now();
              if (delayMs > 0 && delayMs <= 15 * 60 * 1000) {
                setTimeout(async () => {
                  try {
                    const { data: checkRow } = await supabase.from('appointments_and_reminders').select('*').eq('id', row.id).maybeSingle();
                    if (checkRow && !checkRow.is_notified && !checkRow.is_completed) {
                      await supabase.from('appointments_and_reminders').update({ is_notified: true }).eq('id', row.id);
                      const cleanTitle = (checkRow.title || '').replace(/\[usr:\d+\]\s*/g, '').trim();
                      let msg = `⏰ <b>تذكير بموعد / التزام مسجل:</b>\n`;
                      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
                      msg += `📌 <b>${cleanTitle}</b>\n`;
                      if (checkRow.notes) {
                        const cleanN = checkRow.notes.replace(/\[usr:\d+\]\s*/g, '').trim();
                        if (cleanN) msg += `📝 <i>${cleanN}</i>\n`;
                      }
                      msg += `\n👇 <i>اضغط لتأكيد الإنجاز أو تأجيل التذكير:</i>`;
                      const keyboard = {
                        inline_keyboard: [
                          [
                            { text: '✅ تم إنجاز الموعد', callback_data: `ack_appt_done_${checkRow.id}` },
                            { text: '⏳ تأجيل 15 دقيقة', callback_data: `snooze_appt_${checkRow.id}_15` }
                          ]
                        ]
                      };
                      await bot.telegram.sendMessage(fromId, msg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
                    }
                  } catch (err) {
                    console.warn('Fast-track reminder error:', err.message);
                  }
                }, Math.max(1000, delayMs));
              }
            }

            const cairoFormatted = isNaN(dateObj.getTime()) ? dueDt : dateObj.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true });

            insertedSummary.push(`⏰ <b>موعد / تذكير مجدول:</b> <b>${apptTitle}</b>\n   └ 📅 <b>الموعد:</b> ${cairoFormatted} (${todayDate})`);

          }

        } catch (e) {

          console.warn('appointments insert error:', e.message);

        }

      }

    }

    // 10. Tasks

    if (Array.isArray(data.tasks) && data.tasks.length > 0) {

      for (const tk of data.tasks) {

        try {

          const taskTitle = tk.title || tk.task_title || tk.name;

          if (taskTitle) {

            const rawCat = tk.category || 'مذاكرة';

            const { data: row } = await supabase.from('daily_tasks').insert({

              title: taskTitle,

              category: `${rawCat} [usr:${fromId}]`,

              target_duration_mins: Number(tk.target_duration_mins || 0),

              status: tk.status === 'completed' || tk.status === 'تم' ? 'مكتملة' : 'قيد التنفيذ',

              priority: tk.priority || 'متوسطة',

              date: todayDate

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'daily_tasks', id: row.id, summary: `🎯 مهمة: ${taskTitle}` });

            }

            insertedSummary.push(`🎯 <b>مهمة مسجلة:</b> <b>${taskTitle}</b>\n   └ ⚡ <b>الأولوية:</b> ${tk.priority || 'متوسطة'}${tk.target_duration_mins ? ` | ⏱️ <b>المدة المستهدفة:</b> ${tk.target_duration_mins} دقيقة` : ''}`);

            // If task specifies a reminder after minutes, ensure an appointment is scheduled too

            if (tk.reminder_after_minutes || tk.reminder_mins) {

              const mins = Number(tk.reminder_after_minutes || tk.reminder_mins);

              const targetTime = new Date(Date.now() + mins * 60 * 1000).toISOString();

              await supabase.from('appointments_and_reminders').insert({

                title: `تذكير بمهمة: ${taskTitle}`,

                due_datetime: targetTime,

                notes: `[usr:${fromId}] مجدولة تلقائياً بعد ${mins} دقيقة`,

                date: todayDate,

                is_notified: false,

                is_completed: false

              }).catch(() => {});

            }

          }

        } catch (e) {

          console.warn('tasks insert error:', e.message);

        }

      }

    }

    // 11. Quran

    if (Array.isArray(data.quran) && data.quran.length > 0) {

      for (const q of data.quran) {

        try {

          if (q.surah_name) {

            const rawSess = q.session_type || 'مراجعة تثبيت';

            const { data: row } = await supabase.from('quran_logs').insert({

              surah_name: q.surah_name,

              from_ayah: q.from_ayah ? Number(q.from_ayah) : null,

              to_ayah: q.to_ayah ? Number(q.to_ayah) : null,

              from_page: q.from_page ? Number(q.from_page) : null,

              to_page: q.to_page ? Number(q.to_page) : null,

              pages_count: Number(q.pages_count || 1),

              session_type: `${rawSess} [usr:${fromId}]`,

              mastery_status: q.mastery_status || 'متقن',

              quality_rating: Number(q.quality_rating || 5),

              date: todayDate

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'quran_logs', id: row.id, summary: `📖 قرآن: سورة ${q.surah_name}` });

            }

            insertedSummary.push(`📖 <b>القرآن الكريم:</b> <b>سورة ${q.surah_name}</b>\n   └ 📑 <b>الكمية:</b> ${q.pages_count || 1} صفحة (${rawSess}) | ⭐ الإتقان: ${q.quality_rating || 5}/5`);

          }

        } catch (e) {

          console.warn('quran insert error:', e.message);

        }

      }

    }

    // 12. Study Sessions

    if (Array.isArray(data.study) && data.study.length > 0) {

      for (const s of data.study) {

        try {

          const rawTopic = s.topic || s.subject || s.notes || 'جلسة مذاكرة';
          const courseCode = s.course_code || s.module_code || s.module || 'CAD402';
          if (rawTopic || courseCode || s.duration_minutes || s.hours) {

            const durMins = Number(s.duration_minutes || 0);

            const rawTopic = s.topic || 'مذاكرة عامة';

            const { data: row } = await supabase.from('study_sessions').insert({

              course_code: courseCode,

              topic: `[usr:${fromId}] ${rawTopic}`.trim(),

              session_type: s.session_type || 'مذاكرة نظرية',

              duration_minutes: durMins,

              pages_covered: Number(s.pages_covered || 0),

              comprehension_rating: Number(s.comprehension_rating || 5),

              was_rescheduled: Boolean(s.was_rescheduled),

              reschedule_reason: s.reschedule_reason || null,

              notes: `[usr:${fromId}] ${s.notes || ''}`.trim(),

              date: todayDate

            }).select('id').maybeSingle();

            let durText = '';

            if (durMins >= 60) {

              const h = (durMins / 60).toFixed(1).replace('.0', '');

              durText = `${h} ${durMins === 60 ? 'ساعة' : durMins === 120 ? 'ساعتين' : durMins >= 180 && durMins <= 600 ? 'ساعات' : 'ساعة'} (${durMins} دقيقة)`;

            } else if (durMins > 0) {

              durText = `${durMins} دقيقة`;

            } else {

              durText = 'جلسة مذاكرة';

            }

            if (row?.id) {

              recordedUndoItems.push({ table: 'study_sessions', id: row.id, summary: `🩺 مذاكرة [${s.course_code || 'CAD402'}] ${rawTopic} (${durText})` });

            }

            const pageText = s.pages_covered ? ` | 📄 <b>${s.pages_covered} صفحة</b>` : '';

            const ratingText = s.comprehension_rating ? ` | 🧠 استيعاب: ${'⭐'.repeat(s.comprehension_rating)}` : '';

            if (s.was_rescheduled) {

              insertedSummary.push(`🔄 <b>إعادة جدولة مذاكرة [${s.course_code || 'CAD402'}]:</b> ${rawTopic}\n   └ ⏱️ <b>المدة:</b> <b>${durText}</b>${s.reschedule_reason ? ` (السبب: ${s.reschedule_reason})` : ''}`);

            } else {

              insertedSummary.push(`🩺 <b>مذاكرة طب [${s.course_code || 'CAD402'}]:</b> ${rawTopic}\n   └ ⏱️ <b>المدة:</b> <b>${durText}</b>${pageText}${ratingText}`);

            }

          }

        } catch (e) {

          console.warn('study insert error:', e.message);

        }

      }

      // Calculate total today's study minutes

      try {

        const { data: allTodayStudy } = await supabase.from('study_sessions').select('duration_minutes, topic').eq('date', todayDate);

        todayStudyTotalMinutes = (allTodayStudy || []).filter(s => !s.topic?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : s.topic.includes(`usr:${fromId}`)).reduce((acc, curr) => acc + Number(curr.duration_minutes || 0), 0);

      } catch (e) {}

    }

    // 13. Prayers & Habits (including sleep & wake-up)

    let previousHabitsSnapshot = null;

    if (data.prayer_habits && Object.keys(data.prayer_habits).length > 0) {

      const p = data.prayer_habits;

      try {

        const { data: existing } = await supabase.from('prayers_and_habits').select('*').eq('date', todayDate).maybeSingle();

        previousHabitsSnapshot = existing ? { ...existing } : null;

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

        if (p.sleep_hours > 0 || p.wake_up_time || p.sleep_bedtime) {

          insertedSummary.push(`💤 <b>سجل النوم والاستيقاظ:</b> ${p.sleep_hours ? `نمت (${p.sleep_hours} ساعات)` : ''}${p.wake_up_time ? ` | صحيت: ${p.wake_up_time}` : ''}`);

        }

      } catch (e) {

        console.warn('prayer_habits upsert error:', e.message);

      }

    }

    // 14. Gym & Fitness

    if (Array.isArray(data.fitness_gym) && data.fitness_gym.length > 0) {

      for (const g of data.fitness_gym) {

        try {

          const rawMuscle = g.muscle_groups || '';

          const { data: row } = await supabase.from('fitness_gym_logs').insert({

            workout_type: g.workout_type || 'حديد وتمارين مقاومة',

            muscle_groups: `[usr:${fromId}] ${rawMuscle}`.trim(),

            duration_minutes: Number(g.duration_minutes || 45),

            exercises_summary: g.exercises_summary || null,

            protein_grams: Number(g.protein_grams || 0),

            water_liters: Number(g.water_liters || 0),

            body_weight: g.body_weight ? Number(g.body_weight) : null,

            date: todayDate

          }).select('id').maybeSingle();

          if (row?.id) {

            recordedUndoItems.push({ table: 'fitness_gym_logs', id: row.id, summary: `🏋️‍♂️ تمرين ${g.workout_type || 'جيم'}` });

          }

          insertedSummary.push(`🏋️‍♂️ <b>تمرين الجيم:</b> <b>${g.workout_type || 'حديد وتمارين مقاومة'}</b>\n   └ ⏱️ <b>المدة:</b> ${g.duration_minutes || 45} دقيقة${rawMuscle ? ` | 💪 <b>العضلات:</b> ${rawMuscle}` : ''}${g.protein_grams ? ` | 🥩 <b>البروتين:</b> ${g.protein_grams} جم` : ''}`);

        } catch (e) {

          console.warn('fitness_gym insert error:', e.message);

        }

      }

    }

    // 15. Content Creation

    if (Array.isArray(data.content_creation) && data.content_creation.length > 0) {

      for (const c of data.content_creation) {

        try {

          if (c.title) {

            const { data: row } = await supabase.from('content_creation').insert({

              title: c.title,

              platform: c.platform || 'يوتيوب',

              stage: c.stage || 'فكرة جديدة',

              script_content: c.script_content || null,

              video_url: c.video_url || null,

              views_count: Number(c.views_count || 0),

              notes: `[usr:${fromId}] ${c.notes || ''}`.trim(),

              date: todayDate

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'content_creation', id: row.id, summary: `🎬 محتوى: ${c.title}` });

            }

            insertedSummary.push(`🎬 <b>صناعة المحتوى [${c.platform || 'يوتيوب'}]:</b> <b>${c.title}</b>\n   └ 📌 <b>المرحلة:</b> ${c.stage || 'فكرة جديدة'}`);

          }

        } catch (e) {

          console.warn('content_creation insert error:', e.message);

        }

      }

    }

    // 16. Work & Business Projects

    if (Array.isArray(data.work_projects) && data.work_projects.length > 0) {

      for (const w of data.work_projects) {

        try {

          if (w.project_name || w.task_description) {

            const rawTask = w.task_description || 'مهمة عمل';

            const { data: row } = await supabase.from('work_projects').insert({

              project_name: w.project_name || 'Future Air & Ventures',

              task_description: `[usr:${fromId}] ${rawTask}`.trim(),

              revenue_generated: Number(w.revenue_generated || 0),

              status: w.status || 'قيد التنفيذ',

              notes: `[usr:${fromId}] ${w.notes || ''}`.trim(),

              date: todayDate

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'work_projects', id: row.id, summary: `💼 عمل: [${w.project_name || 'بيزنس'}]` });

            }

            insertedSummary.push(`💼 <b>مشروع عمل [${w.project_name || 'Future Air'}]:</b> <b>${rawTask}</b>\n   └ 📊 <b>الحالة:</b> ${w.status || 'قيد التنفيذ'}${w.revenue_generated ? ` | 💰 <b>الأرباح:</b> ${formatEgp(w.revenue_generated)}` : ''}`);

          }

        } catch (e) {

          console.warn('work_projects insert error:', e.message);

        }

      }

    }

    // 17. Self Development & Books

    if (Array.isArray(data.self_development) && data.self_development.length > 0) {

      for (const sd of data.self_development) {

        try {

          if (sd.title) {

            const { data: row } = await supabase.from('self_development_books').insert({

              title: sd.title,

              author_or_channel: sd.author_or_channel || null,

              category: sd.category || 'كتاب وقراءة',

              pages_or_minutes: Number(sd.pages_or_minutes || 0),

              key_takeaways: sd.key_takeaways || null,

              actionable_habits: `[usr:${fromId}] ${sd.actionable_habits || ''}`.trim(),

              date: todayDate

            }).select('id').maybeSingle();

            if (row?.id) {

              recordedUndoItems.push({ table: 'self_development_books', id: row.id, summary: `🚀 تطوير ذات: ${sd.title}` });

            }

            insertedSummary.push(`🚀 <b>تطوير ذات / قراءة:</b> <b>${sd.title}</b>\n   └ 📖 <b>النوع:</b> ${sd.category || 'كتاب'}${sd.pages_or_minutes ? ` | ⏱️ ${sd.pages_or_minutes} دقيقة/صفحة` : ''}`);

          }

        } catch (e) {

          console.warn('self_development insert error:', e.message);

        }

      }

    }

    // 18. Clinical Cases

    if (data.clinical_case && (data.clinical_case.title || data.clinical_case.chief_complaint)) {

      const cc = data.clinical_case;

      try {

        const { data: row } = await supabase.from('clinical_cases').insert({

          course_code: cc.course_code || 'CAD402',

          title: cc.title || 'حالة إكلينيكية بالراوند',

          chief_complaint: cc.chief_complaint || null,

          history_and_symptoms: cc.history_and_symptoms || null,

          clinical_examination: cc.clinical_examination || null,

          provisional_diagnosis: cc.provisional_diagnosis || null,

          differential_diagnosis: Array.isArray(cc.differential_diagnosis) ? cc.differential_diagnosis : [],

          investigations_management: cc.investigations_management || null,

          doctor_pearls: `[usr:${fromId}] ${cc.doctor_pearls || ''}`.trim(),

          osce_checklists: cc.osce_checklists || null,

          date: todayDate

        }).select('id').maybeSingle();

        if (row?.id) {

          recordedUndoItems.push({ table: 'clinical_cases', id: row.id, summary: `🏥 حالة سريرية [${cc.course_code || 'CAD402'}]` });

        }

        insertedSummary.push(`🏥 <b>حالة سريرية [${cc.course_code || 'CAD402'}]:</b> <b>${cc.title || 'حالة راوند'}</b>\n   └ 🩺 <b>التشخيص:</b> ${cc.provisional_diagnosis || cc.chief_complaint || 'قيد الفحص'}`);

      } catch (e) {

        console.warn('clinical_case insert error:', e.message);

      }

    }

    // Save Master Undo State in User Session (Valid for 24 Hours)

    if (fromId && (recordedUndoItems.length > 0 || previousHabitsSnapshot || previousFastingSnapshot)) {

      const currentSession = (await getUserSession(fromId)) || {};

      const undoHistory = currentSession.undo_history || {};

      undoHistory[undoActionId] = {

        undoId: undoActionId,

        timestamp: Date.now(),

        date: todayDate,

        items: recordedUndoItems,

        financeItems: financeItems,

        financeReversions: financeReversions,

        previousHabits: previousHabitsSnapshot,

        previousFasting: previousFastingSnapshot,

        summaryList: insertedSummary

      };

      // Keep only last 10 undo actions to conserve space

      const keys = Object.keys(undoHistory);

      if (keys.length > 10) {

        delete undoHistory[keys[0]];

      }

      currentSession.undo_history = undoHistory;

      await setUserSession(fromId, currentSession);

    }

    let card = `✅ <b>تم استيعاب وتوثيق إنجازاتك بالمنظومة فوراً! 🎯</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;

    if (result.summary_text) card += `${result.summary_text}\n\n`;

    if (data.mental_wellness?.ai_therapeutic_feedback) {

      card += `💬 <b>رسالة دعم وتوجيه نفسي وطبي:</b>\n<i>${data.mental_wellness.ai_therapeutic_feedback}</i>\n\n`;

    }

    if (insertedSummary.length > 0) {

      card += `📌 <b>سجلات تم تثبيتها بالمنظومة (${todayDate}):</b>\n`;

      insertedSummary.forEach(s => card += `• ${s}\n`);

    }

    // Add today's study progress tracker if applicable

    if (todayStudyTotalMinutes > 0) {

      const totalH = (todayStudyTotalMinutes / 60).toFixed(1).replace('.0', '');

      const studyTargetMins = 180; // 3 hours

      const remainingMins = Math.max(0, studyTargetMins - todayStudyTotalMinutes);

      const targetStatus = todayStudyTotalMinutes >= studyTargetMins

        ? `🟢 <b>تم تحقيق هدف اليوم (3 ساعات)!</b>`

        : `⏳ <b>متبقي ${Math.ceil(remainingMins / 60)} س (${remainingMins} د) على هدف الـ 3 ساعات</b>`;

      card += `\n📊 <b>إجمالي مذاكرة اليوم:</b> <b>${totalH} ساعة</b> (${todayStudyTotalMinutes} دقيقة) ➔ ${targetStatus}\n`;

    }

    const keyboardRows = [];

    if (financeItems.length > 0) {

      keyboardRows.push([

        { text: '↩️ تراجع عن التسجيل', callback_data: `undo_action_${undoActionId}` },

        { text: '💳 تغيير وسيلة الدفع', callback_data: `changepm_${undoActionId}` }

      ]);

    } else {

      keyboardRows.push([

        { text: '↩️ تراجع عن هذا التسجيل وإلغاؤه فوراً', callback_data: `undo_action_${undoActionId}` }

      ]);

    }

    keyboardRows.push([

      { text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' },

      { text: '🎯 عرض المهام والمواعيد', callback_data: 'menu_tasks' }

    ]);

    keyboardRows.push([

      { text: '🗣️ فلاش كاردز الإنجليزية', callback_data: 'menu_eng_spaced' },

      { text: '🩺 كويزات الطب', callback_data: 'menu_med_spaced' }

    ]);

    const keyboard = {

      inline_keyboard: keyboardRows

    };

    return ctx.reply(card, { parse_mode: 'HTML', reply_markup: keyboard });

  }

  // ==============================================================================

  // 🔘 6. Interactive Action Handlers & 24-Hour Undo Engine

  // ==============================================================================

  // Master 24-Hour Undo Action Handler for Voice/Text entries

  bot.action(/^undo_action_(.+)$/, async (ctx) => {

    const undoId = ctx.match[1];

    const fromId = ctx.from?.id;

    await ctx.answerCbQuery('🔄 جاري التراجع وحذف السجلات من قاعدة البيانات...');

    try {

      const session = fromId ? await getUserSession(fromId) : null;

      const undoData = session?.undo_history?.[undoId];

      if (!undoData) {

        return ctx.editMessageText(

          `⚠️ <b>تعذر التراجع:</b> انتهت صلاحية هذا التراجع أو تم تنفيذه مسبقاً.\n\nيمكنك مراجعة كافة بياناتك دائماً من ملخص اليوم.`,

          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }]] } }

        ).catch(() => {});

      }

      // Check 24 hour limit

      if (Date.now() - undoData.timestamp > 24 * 3600 * 1000) {

        return ctx.answerCbQuery('⛔ عذراً، انتهت صلاحية التراجع (مرت أكثر من 24 ساعة)', { show_alert: true });

      }

      const deletedItemsSummary = [];

      // 1. Delete all inserted records from Supabase tables

      if (Array.isArray(undoData.items)) {

        for (const item of undoData.items) {

          try {

            if (item.table && item.id) {

              await supabase.from(item.table).delete().eq('id', item.id);

              deletedItemsSummary.push(item.summary || `سجل من ${item.table}`);

            }

          } catch (e) {

            console.warn(`Failed to delete record ${item.id} from ${item.table}:`, e.message);

          }

        }

      }

      // 2. Revert finance liquidity balances

      if (Array.isArray(undoData.financeReversions)) {

        for (const rev of undoData.financeReversions) {

          try {

            await updateLiquidity(rev.method, rev.amountChange, fromId);

          } catch (e) {

            console.warn('Failed to revert liquidity:', e.message);

          }

        }

      }

      // 3. Restore previous habits / fasting state if applicable

      if (undoData.previousHabits) {

        try {

          await supabase.from('prayers_and_habits').upsert(undoData.previousHabits, { onConflict: 'date' });

          deletedItemsSummary.push('سجل الصلوات والعادات (تمت استعادة القيم السابقة)');

        } catch (e) {}

      }

      if (undoData.previousFasting) {

        try {

          await supabase.from('fasting_and_worship_logs').upsert(undoData.previousFasting, { onConflict: 'date' });

          deletedItemsSummary.push('سجل الصيام والسنن (تمت استعادة القيم السابقة)');

        } catch (e) {}

      }

      // Remove from session undo_history

      delete session.undo_history[undoId];

      await setUserSession(fromId, session);

      let replyMsg = `↩️ <b>تم التراجع بنجاح وإلغاء التسجيل بالكامل! ✨</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;

      replyMsg += `🗑️ <b>تم حذف السجلات التالية من قاعدة البيانات:</b>\n`;

      if (deletedItemsSummary.length > 0) {

        deletedItemsSummary.forEach(s => replyMsg += `• ${s}\n`);

      } else {

        replyMsg += `• كافة السجلات المرتبطة بهذه العملية.\n`;

      }

      replyMsg += `\n🎯 <i>تمت استعادة حالة المنظومة كأن شيئاً لم يكن بكل دقة وموثوقية.</i>`;

      const keyboard = {

        inline_keyboard: [

          [{ text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }, { text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]

        ]

      };

      return ctx.editMessageText(replyMsg, { parse_mode: 'HTML', reply_markup: keyboard }).catch(async () => {

        return ctx.reply(replyMsg, { parse_mode: 'HTML', reply_markup: keyboard });

      });

    } catch (err) {

      console.error('Error during master undo:', err);

      return ctx.reply(`⚠️ حدث خطأ أثناء محاولة التراجع: ${err.message}`);

    }

  });

  // 💳 Interactive Payment Method Change Menu

  bot.action(/^changepm_(.+)$/, async (ctx) => {

    const undoId = ctx.match[1];

    const fromId = ctx.from?.id;

    await ctx.answerCbQuery('💳 اختر وسيلة الدفع الجديدة...');

    try {

      const session = fromId ? await getUserSession(fromId) : null;

      const undoData = session?.undo_history?.[undoId];

      if (!undoData || !undoData.financeItems || undoData.financeItems.length === 0) {

        return ctx.reply('⚠️ لم يتم العثور على المعاملة المالية لتعديل وسيلتها (ربما مر عليها أكثر من 24 ساعة أو تم التراجع عنها).');

      }

      const fItem = undoData.financeItems[0];

      const currentMethod = fItem.method || 'خزنة شخصية';

      const pmKeyboard = {

        inline_keyboard: [

          [

            { text: currentMethod === 'خزنة شخصية' ? '🔘 💵 كاش (خزنة شخصية) ✅' : '💵 كاش (خزنة شخصية)', callback_data: `setpm_${undoId}_cash` },

            { text: currentMethod === 'فودافون كاش' ? '🔘 📱 فودافون كاش ✅' : '📱 فودافون كاش', callback_data: `setpm_${undoId}_voda` }

          ],

          [

            { text: currentMethod === 'إنستا باي' ? '🔘 ⚡ إنستا باي (InstaPay) ✅' : '⚡ إنستا باي (InstaPay)', callback_data: `setpm_${undoId}_insta` },

            { text: currentMethod === 'بنك مصر' ? '🔘 🏦 بنك مصر ✅' : '🏦 بنك مصر', callback_data: `setpm_${undoId}_bank` }

          ],

          [

            { text: '↩️ تراجع عن العملية بالكامل', callback_data: `undo_action_${undoId}` }

          ]

        ]

      };

      return ctx.reply(

        `💳 <b>تعديل وسيلة الدفع / الخزنة:</b>\n━━━━━━━━━━━━━━━━━━━━━\n` +

        `• 💵 <b>المبلغ:</b> <b>${formatEgp(fItem.amount)}</b> (${fItem.type})\n` +

        `• 🏷️ <b>البند:</b> ${fItem.description || fItem.category || 'عام'}\n` +

        `• 💳 <b>الوسيلة الحالية:</b> <b>${currentMethod}</b>\n\n` +

        `👇 <i>اضغط على الخزنة أو المحفظة الجديدة لتحويل المبلغ إليها فوراً وتحديث الأرصدة:</i>`,

        { parse_mode: 'HTML', reply_markup: pmKeyboard }

      );

    } catch (e) {

      console.error('changepm error:', e);

      return ctx.reply(`❌ حدث خطأ أثناء فتح قائمة وسائل الدفع: ${e.message}`);

    }

  });

  // 💳 Switch Payment Method & Update Balances

  const PM_MAP = {

    'cash': 'خزنة شخصية',

    'voda': 'فودافون كاش',

    'insta': 'إنستا باي',

    'bank': 'بنك مصر'

  };

  bot.action(/^setpm_([^_]+)_(cash|voda|insta|bank)$/, async (ctx) => {

    const undoId = ctx.match[1];

    const targetKey = ctx.match[2];

    const newMethod = PM_MAP[targetKey];

    const fromId = ctx.from?.id;

    await ctx.answerCbQuery(`جاري التبديل إلى ${newMethod}...`);

    try {

      const session = fromId ? await getUserSession(fromId) : null;

      const undoData = session?.undo_history?.[undoId];

      if (!undoData || !undoData.financeItems || undoData.financeItems.length === 0) {

        return ctx.reply('⚠️ لم يتم العثور على المعاملة المالية.');

      }

      const fItem = undoData.financeItems[0];

      const oldMethod = fItem.method || 'خزنة شخصية';

      if (oldMethod === newMethod) {

        return ctx.reply(`ℹ️ المعاملة مسجلة بالفعل على: <b>${newMethod}</b>!`, { parse_mode: 'HTML' });

      }

      const amt = Number(fItem.amount || 0);

      const type = fItem.type || 'مصروف';

      const factor = (type === 'إيراد') ? 1 : -1;

      // 1. Revert from old wallet

      await updateLiquidity(oldMethod, -1 * factor * amt, fromId);

      // 2. Apply to new wallet

      await updateLiquidity(newMethod, factor * amt, fromId);

      // 3. Update database row in personal_finance

      await supabase.from('personal_finance').update({

        payment_method: newMethod

      }).eq('id', fItem.id);

      // 4. Update session undo history

      fItem.method = newMethod;

      undoData.financeReversions = [

        { method: newMethod, amountChange: -1 * factor * amt }

      ];

      session.undo_history[undoId] = undoData;

      await setUserSession(fromId, session);

      const confirmKeyboard = {

        inline_keyboard: [

          [

            { text: '💳 تغيير وسيلة أخرى', callback_data: `changepm_${undoId}` },

            { text: '↩️ تراجع عن العملية', callback_data: `undo_action_${undoId}` }

          ],

          [

            { text: '📊 ملخص اليوم الشامل', callback_data: 'menu_today' }

          ]

        ]

      };

      const msg = `✅ <b>تم تعديل وسيلة الدفع بنجاح! 💳✨</b>\n━━━━━━━━━━━━━━━━━━━━━\n` +

        `• 💵 <b>المبلغ:</b> <b>${formatEgp(amt)}</b> (${type})\n` +

        `• 🔄 <b>تم التحويل من:</b> <s>${oldMethod}</s>\n` +

        `• 🎯 <b>إلى الخزنة الجديدة:</b> <b>${newMethod}</b>\n` +

        `• ⚡ <b>تم تحديث أرصدة الخزائن تلقائياً في السحابة والموقع.</b>`;

      return ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: confirmKeyboard }).catch(async () => {

        return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: confirmKeyboard });

      });

    } catch (e) {

      console.error('setpm error:', e);

      return ctx.reply(`❌ حدث خطأ أثناء تعديل وسيلة الدفع: ${e.message}`);

    }

  });

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

    const studentName = ctx.userProfile?.full_name || (Number(ctx.from?.id) === ADMIN_CHAT_ID ? 'دكتور عبدالله' : 'يا دكتور');

    return ctx.editMessageText(`✅ <b>تم صلاة الوتر والقيام بنجاح! نوم هادئ ومبارك يا ${studentName}. 🌌</b>`, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});

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

  // Custom Appointments & Reminders Actions

  bot.action(/^ack_appt_done_(.+)$/, async (ctx) => {

    const apptId = ctx.match[1];

    const now = Date.now();

    await supabase.from('appointments_and_reminders').update({ is_completed: true, is_notified: true }).eq('id', apptId);

    await ctx.answerCbQuery('✅ عاش يا دكتور! تم إنجاز الموعد');

    const keyboard = {

      inline_keyboard: [

        [{ text: '↩️ تراجع (إعادة الموعد كمعلق)', callback_data: `undo_appt_${apptId}_${now}` }]

      ]

    };

    const studentName = ctx.userProfile?.full_name || (Number(ctx.from?.id) === ADMIN_CHAT_ID ? 'دكتور عبدالله' : 'يا دكتور');

    return ctx.editMessageText(`✅ <b>عاش يا ${studentName}! تم إنجاز وتوثيق الموعد بنجاح 🎯</b>`, { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});

  });

  bot.action(/^snooze_appt_(.+?)_(\d+)$/, async (ctx) => {

    const [, apptId, snoozeMins] = ctx.match;

    const mins = Number(snoozeMins) || 15;

    const newDue = new Date(Date.now() + mins * 60 * 1000).toISOString();

    await supabase.from('appointments_and_reminders').update({ 

      due_datetime: newDue,

      is_notified: false 

    }).eq('id', apptId);

    await ctx.answerCbQuery(`⏳ تم تأجيل التذكير لمدة ${mins} دقيقة`);

    return ctx.editMessageText(`⏳ <b>تم تأجيل التذكير لمدة ${mins} دقيقة بنجاح! ⏰</b>\nسيتم إشعارك فور حلول الموعد الجديد تلقائياً.`, { parse_mode: 'HTML' }).catch(() => {});

  });

  bot.action(/^undo_appt_(.+?)_(\d+)$/, async (ctx) => {

    const [, apptId, actionTime] = ctx.match;

    if (isUndoExpired(actionTime)) return ctx.answerCbQuery('⛔ انتهت صلاحية التراجع (24 ساعة)', { show_alert: true });

    await supabase.from('appointments_and_reminders').update({ is_completed: false }).eq('id', apptId);

    await ctx.answerCbQuery('↩️ تم التراجع بنجاح');

    const keyboard = {

      inline_keyboard: [

        [{ text: '✅ تم الإنجاز', callback_data: `ack_appt_done_${apptId}` }]

      ]

    };

    return ctx.editMessageText('⏰ <b>تمت إعادة الموعد لقائمة المواعيد المعلقة:</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});

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

    await ctx.answerCbQuery().catch(() => {});

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

    await ctx.answerCbQuery().catch(() => {});

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

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;

    const { data: rawLogs } = await supabase.from('mental_wellness_logs').select('*').order('created_at', { ascending: false }).limit(10);

    const logs = (rawLogs || []).filter(l => !l.ai_therapeutic_feedback?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : l.ai_therapeutic_feedback.includes(`usr:${fromId}`)).slice(0, 3);

    let msg = `🧠 <b>سجل الاتزان النفسي والفضفضة:</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;

    if (!logs || logs.length === 0) {

      msg += `✨ <i>لم تسجل أي فضفضة بعد. ابدأ فويس بـ "دردشة عامة / فضفضة..." وسيقوم البوت بالاستماع والدعم فوراً!</i>\n`;

    } else {

      logs.forEach(l => {

        const cleanFeedback = (l.ai_therapeutic_feedback || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

        msg += `📅 <b>${l.date}:</b> حالة: ${l.emotional_state} (⭐ ${l.mood_rating}/5)\n`;

        if (cleanFeedback) msg += `   └ 💬 <i>"${cleanFeedback.slice(0, 140)}..."</i>\n\n`;

      });

    }

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_quran', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;

    const { data: rawLogs } = await supabase.from('quran_logs').select('*').order('created_at', { ascending: false }).limit(20);

    const logs = (rawLogs || []).filter(l => !l.session_type?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : l.session_type.includes(`usr:${fromId}`)).slice(0, 6);

    let msg = `📖 <b>سجل وخطة المصحف وتثبيت الحفظ:</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;

    if (!logs || logs.length === 0) msg += `✨ <i>لم يتم تسجيل ورد قرآني بعد.</i>\n`;

    else {

      logs.forEach(l => {

        const starCount = Math.max(1, Math.min(5, Number(l.quality_rating || 5)));

        const cleanSession = (l.session_type || 'مراجعة').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

        msg += `• 🕌 <b>سورة ${l.surah_name}</b> (${cleanSession})\n   └ حالة الحفظ: <b>${l.mastery_status || 'متقن'}</b> | ${'⭐'.repeat(starCount)} (📅 ${l.date})\n`;

      });

    }

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_gym', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;

    const { data: rawRows } = await supabase.from('fitness_gym_logs').select('*').order('date', { ascending: false }).limit(20);

    const rows = (rawRows || []).filter(r => !r.muscle_groups?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : r.muscle_groups.includes(`usr:${fromId}`)).slice(0, 5);

    let msg = `🏋️‍♂️ <b>قسم الجيم واللياقة والبدنية:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (!rows || rows.length === 0) msg += `✨ <i>لم تسجل تمارين بعد.</i>\n`;

    else rows.forEach(r => {

      const cleanMuscle = (r.muscle_groups || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

      msg += `• 🏋️ <b>${r.workout_type}</b> ${cleanMuscle ? `(${cleanMuscle})` : ''} | ⏱️ ${r.duration_minutes || 45} دقيقة\n`;

    });

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_content', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;

    const { data: rawRows } = await supabase.from('content_creation').select('*').order('created_at', { ascending: false }).limit(20);

    const rows = (rawRows || []).filter(r => !r.notes?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : r.notes.includes(`usr:${fromId}`)).slice(0, 5);

    let msg = `🎬 <b>قسم صناعة المحتوى والمونتاج:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (!rows || rows.length === 0) msg += `✨ <i>لم تسجل أفكار فيديوهات بعد.</i>\n`;

    else rows.forEach(r => msg += `• 🎬 <b>${r.title}</b> [${r.platform}] | المرحلة: <b>${r.stage}</b>\n`);

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_work', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;

    const { data: rawRows } = await supabase.from('work_projects').select('*').order('created_at', { ascending: false }).limit(20);

    const rows = (rawRows || []).filter(r => !r.task_description?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : r.task_description.includes(`usr:${fromId}`)).slice(0, 5);

    let msg = `💼 <b>قسم الشغل ومشاريع البيزنس:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (!rows || rows.length === 0) msg += `✨ <i>لا توجد مهام عمل مسجلة.</i>\n`;

    else rows.forEach(r => {

      const cleanTask = (r.task_description || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

      msg += `• 💼 <b>[${r.project_name}]</b> ${cleanTask} | الحالة: <b>${r.status}</b>\n`;

    });

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_tasks', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const today = getCairoToday();

    const fromId = ctx.from?.id;

    const { data: allTasks } = await supabase.from('daily_tasks').select('*').eq('date', today);

    const { data: allAppts } = await supabase.from('appointments_and_reminders').select('*').gte('due_datetime', today).order('due_datetime', { ascending: true }).limit(20);

    const tasks = (allTasks || []).filter(t => !t.category?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : t.category.includes(`usr:${fromId}`));

    const appts = (allAppts || []).filter(a => !a.notes?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : a.notes.includes(`usr:${fromId}`)).slice(0, 5);

    let msg = `🎯 <b>المهام والمواعيد الذكية:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n📋 <b>مهام اليوم (${today}):</b>\n`;

    if (!tasks || tasks.length === 0) msg += `• <i>لا توجد مهام مسجلة اليوم.</i>\n`;

    else tasks.forEach(t => {

      const cleanTitle = (t.title || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

      msg += `• ${t.status === 'تم الإنجاز' || t.status === 'مكتملة' ? '✅' : (t.status === 'مؤجل' ? '⏳' : '🟡')} <b>${cleanTitle}</b> [${t.status}]\n`;

    });

    msg += `\n⏰ <b>المواعيد والتذكيرات القادمة (نظام 12 ساعة):</b>\n`;

    if (!appts || appts.length === 0) msg += `• <i>لا توجد مواعيد قادمة.</i>\n`;

    else appts.forEach(a => {

      const cleanTitle = (a.title || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

      const dt = new Date(a.due_datetime);

      const time12 = !isNaN(dt.getTime())

        ? dt.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true })

        : a.due_datetime;

      const date12 = !isNaN(dt.getTime())

        ? dt.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' })

        : today;

      msg += `• 🔔 <b>${cleanTitle}</b> ➔ <code>${date12} ${time12}</code>\n`;

    });

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_thoughts', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;

    const { data: allThoughts } = await supabase.from('thoughts_and_wisdom').select('*').order('created_at', { ascending: false }).limit(20);

    const thoughts = (allThoughts || []).filter(th => !th.content?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : th.content.includes(`usr:${fromId}`)).slice(0, 5);

    let msg = `💡 <b>بنك الخواطر والأفكار:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (!thoughts || thoughts.length === 0) msg += `✨ <i>لا توجد خواطر مسجلة بعد.</i>\n`;

    else thoughts.forEach((th, idx) => {

      const cleanContent = (th.content || '').replace(/\[usr:\d+\]\s*/g, '').replace(/usr:\d+\s*/g, '').trim();

      msg += `<b>${idx + 1}.</b> 🌟 <i>"${cleanContent}"</i> (📅 ${th.date})\n\n`;

    });

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_english', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;

    if (fromId) await setUserSession(fromId, { mode: 'english_coach' });

    let msg = `🗣️ <b>وضع مدرب الإنجليزية الصوتي الذكي (Active English Coach):</b>\n━━━━━━━━━━━━━━━━━━━━━\n✨ تم تفعيل وضع المحادثة! تحدث بالإنجليزية وسيرد عليك البوت صوتياً وتحليلياً.`;

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔄 إنهاء وضع الإنجليزية والعودة', callback_data: 'exit_english_mode' }]] } });

  });

  bot.action('exit_english_mode', async (ctx) => {

    const fromId = ctx.from?.id;

    if (fromId) await setUserSession(fromId, { mode: 'default' });

    await ctx.answerCbQuery('تم الرجوع للوضع العام').catch(() => {});

    return ctx.reply('✅ <b>تم الرجوع إلى وضع إدارة الحياة العام بنجاح.</b>');

  });

  bot.action('menu_quiz', async (ctx) => {

    await ctx.answerCbQuery('⏳ جاري توليد حالة سريرية ذكية...').catch(() => {});

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

    const studentName = ctx.userProfile?.full_name || ctx.from?.first_name || 'دكتور';

    const sess = fromId ? await getUserSession(fromId) : null;

    const quiz = sess?.activeQuiz;

    await ctx.answerCbQuery(isCorrect ? '🎯 إجابة صحيحة وممتازة!' : '❌ إجابة غير دقيقة!').catch(() => {});

    let msg = isCorrect ? `🎉 <b>إجابة ممتازة يا ${studentName}! إجابة صحيحة 🎯</b>\n\n` : `⚠️ <b>الإجابة غير صحيحة، النموذجية هي: (${quiz?.options?.[quiz.correct_option_index] || ''})</b>\n\n`;

    if (quiz?.explanation) msg += `🔬 <b>الشرح الطبي:</b>\n${quiz.explanation}\n\n`;

    if (quiz?.osce_tip) msg += `💡 <b>نصيحة الـ OSCE:</b>\n${quiz.osce_tip}\n`;

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🧪 سؤال سريري آخر', callback_data: 'menu_quiz' }], [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_finance', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const today = getCairoToday();

    const fromId = ctx.from?.id;

    const { data: allRows } = await supabase.from('personal_finance').select('*').gte('date', today);

    const rows = (allRows || []).filter(f => !f.description?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : f.description.includes(`usr:${fromId}`));

    let income = 0;

    let expense = 0;

    rows.forEach(r => {

      if (r.type === 'إيراد') income += Number(r.amount || 0);

      else expense += Number(r.amount || 0);

    });

    let msg = `💵 <b>الخزنة والمصروفات الشخصية:</b>\n━━━━━━━━━━━━━━━━━━━━━\n🟢 <b>إيرادات اليوم:</b> ${formatEgp(income)}\n🔴 <b>مصروفات اليوم:</b> ${formatEgp(expense)}\n⚖️ <b>الصافي:</b> <b>${formatEgp(income - expense)}</b>`;

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_today', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const today = getCairoToday();

    const fromId = ctx.from?.id;

    const { data: rawStudy } = await supabase.from('study_sessions').select('*').eq('date', today);

    const { data: rawQuran } = await supabase.from('quran_logs').select('*').eq('date', today);

    const { data: rawTasks } = await supabase.from('daily_tasks').select('*').eq('date', today);

    const { data: rawThoughts } = await supabase.from('thoughts_and_wisdom').select('*').eq('date', today);

    const { data: fw } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', today).maybeSingle();

    const { data: mw } = await supabase.from('mental_wellness_logs').select('*').eq('date', today).maybeSingle();

    const { data: rawFinance } = await supabase.from('personal_finance').select('*').eq('date', today);

    const study = (rawStudy || []).filter(s => !s.topic?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : s.topic.includes(`usr:${fromId}`));

    const quran = (rawQuran || []).filter(q => !q.session_type?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : q.session_type.includes(`usr:${fromId}`));

    const tasks = (rawTasks || []).filter(t => !t.category?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : t.category.includes(`usr:${fromId}`));

    const thoughts = (rawThoughts || []).filter(th => !th.content?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : th.content.includes(`usr:${fromId}`));

    const finance = (rawFinance || []).filter(f => !f.description?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : f.description.includes(`usr:${fromId}`));

    let studyMins = 0;

    let studyPages = 0;

    study.forEach(s => {

      studyMins += Number(s.duration_minutes || 0);

      studyPages += Number(s.pages_covered || 0);

    });

    let incomeTotal = 0;

    let expenseTotal = 0;

    finance.forEach(f => {

      if (f.type === 'إيراد') incomeTotal += Number(f.amount || 0);

      else expenseTotal += Number(f.amount || 0);

    });

    const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'د. عبدالله' : 'دكتور');

    let msg = `📊 <b>تقرير إنجازات ${studentName} الشامل ليوم (${today}):</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;

    msg += `🩺 <b>الطب والمذاكرة:</b> ${studyMins} دقيقة (${studyPages} صفحة)\n`;

    msg += `📖 <b>القرآن الكريم:</b> ${(quran && quran.length > 0) ? quran.map(q => `${q.surah_name} (${(q.session_type || 'متقن').replace(/\[usr:\d+\]\s*/g, '').trim()})`).join(' • ') : 'لم يُسجل ورد'}\n`;

    msg += `🌙 <b>السنن والأذكار:</b> السنن: ${fw?.sunan_rawatib_count || 0} ركعة | أذكار: صباح (${fw?.adhkar_morning ? '✅' : '⚪'}) مساء (${fw?.adhkar_evening ? '✅' : '⚪'})\n`;

    msg += `🧠 <b>الحالة النفسية والمزاج:</b> ${mw ? `⭐ ${mw.mood_rating}/5 (${mw.emotional_state})` : 'مستقرة 🟢'}\n`;

    msg += `🎯 <b>المهام المنجزة:</b> ${(tasks && tasks.length > 0) ? tasks.map(t => `${t.status === 'تم الإنجاز' || t.status === 'مكتملة' ? '✅' : '🟡'} ${(t.title || '').replace(/\[usr:\d+\]\s*/g, '').trim()}`).join(' | ') : 'لا توجد مهام'}\n`;

    msg += `💡 <b>الخواطر المحفوظة:</b> ${thoughts?.length || 0} خواطر\n`;

    msg += `💵 <b>المالية:</b> إيراد: ${formatEgp(incomeTotal)} | مصروف: ${formatEgp(expenseTotal)}\n`;

    msg += `━━━━━━━━━━━━━━━━━━━━━\n🚀 <b>عظيم جداً يا ${studentName}! استمر بنفس القوة والعزيمة.</b>`;

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] } });

  });

  bot.action('menu_main', async (ctx) => {

    await ctx.answerCbQuery().catch(() => {});

    const fromId = ctx.from?.id;
    const appTitle = Number(fromId) === ADMIN_CHAT_ID ? 'منظومة رحلة عبدالله' : 'المنظومة الطبية الذكية';

    return ctx.reply(`👇 <b>القائمة الرئيسية لـ ${appTitle}:</b>`, {

      parse_mode: 'HTML',

      reply_markup: {

        inline_keyboard: [

          [{ text: '🩺 كويزات الموديولات الطبية', callback_data: 'menu_med_spaced' }, { text: '🗣️ فلاش كاردز الإنجليزية', callback_data: 'menu_eng_spaced' }],

          [{ text: '📅 جدول السكاشن والغياب', callback_data: 'menu_academic' }, { text: '📖 سجل المصحف والتثبيت', callback_data: 'menu_quran' }],

          [{ text: '🌙 الصيام والسنن والأذكار', callback_data: 'menu_fasting' }, { text: '🧠 الفضفضة والاتزان النفسي', callback_data: 'menu_wellness' }],

          [{ text: '🏋️‍♂️ الجيم واللياقة والبدنية', callback_data: 'menu_gym' }, { text: '🎬 صناعة المحتوى والمونتاج', callback_data: 'menu_content' }],

          [{ text: '💼 الشغل ومشاريع البيزنس', callback_data: 'menu_work' }, { text: '🎯 المهام والمواعيد والتركيز', callback_data: 'menu_tasks' }],

          [{ text: '💬 الدعم الفني والاشتراكات', url: 'https://t.me/Dr31327' }, { text: '💵 الخزنة والمصروفات الشخصية', callback_data: 'menu_finance' }],

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

  // ⚡ Mindset & Future Vision & B2/C1 English Pulses

  bot.command(['boost', 'mindset', 'pulse', 'شعلة', 'حماس', 'انضباط'], async (ctx) => {

    await sendMindsetPulse(bot, ctx.chat.id, true);

  });

  bot.action('get_another_mindset_pulse', async (ctx) => {

    await ctx.answerCbQuery('⚡ نبضة ملهمة جديدة!').catch(() => {});

    const studentName = ctx.userProfile?.full_name || ctx.from?.first_name || 'د. عبدالله';

    await sendMindsetPulse(bot, ctx.chat?.id || ctx.from?.id, true, studentName);

  });

}

