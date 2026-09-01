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
  getUserPreferences,
  updateUserPreferences,
  updateUserAcademicProfile,
  getUserActiveCourses,
  DEFAULT_USER_PREFERENCES,
  PRESET_COURSES_BY_YEAR,
  getUserMedicalQuizzes,
  saveUserMedicalQuiz,
  getStudentHolisticSnapshot,
  detectGenderFromName,
  getGenderTerms,
  ADMIN_CHAT_ID,
  isAdminUser,
  getUserBodyMetrics,
  updateUserBodyMetrics,
  logNutritionMeal,
  getDailyNutrition,
  logDistraction,
  getDailyDistractions,
  getUserGamification,
  addDoctorXp,
  updateUserStreak,
  getWishlistItems,
  addWishlistItem,
  updateWishlistItemStatus,
  saveAcademicPdfMastery,
  getAcademicPdfVault,
  logFlexibleFreeActivity,
  getFlexibleFreeLogs,
  logQuranSrsSession,
  advanceQuranSrsStage,
  logAcademicStudySrs,
  saveNativeQuizPoll,
  processStudentPollAnswer,
  getAcademicSrsQueue,
  getAdminPurityStats,
  logAdminPurityRelapse,
  logAdminUrgeResisted
} from './supabase.js';

import { isAuthorized } from './bot.js';

import { startScheduler } from './scheduler.js';

import { getCairoPrayerTimes, getRelativePrayerTarget } from './prayer_times.js';

import {
  downloadFileBuffer,
  parseWithGeminiPool,
  talkWithEnglishCoach,
  generateMedicalQuiz,
  analyzeImageWithGemini,
  parseModulesListWithAi,
  generateHolisticWhatToDoPlan,
  analyzeNutritionInput,
  generateWeeklyPsychologicalReport,
  processAcademicPdfMastery,
  extractGroundedMcqsFromPdf
} from './ai_engine.js';

import { sendMindsetPulse } from './mindset_pulses.js';
import { getRandomPuritySpiritualFuel } from './purity_spiritual_fuel.js';
import { getRandomPastRulerMistake, getRandomStatesmanPearl } from './statesman_engine.js';
import { getRandomShariaCapsule } from './sharia_sciences.js';

function formatEgp(num) {

  return Number(num || 0).toLocaleString('en-US') + ' ج.م';

}

function getCairoToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

export function formatDoctorName(raw) {
  if (!raw) return 'دكتور';
  let cleaned = String(raw).trim();
  cleaned = cleaned.replace(/^(?:أنا\s+اسمي|انا\s+اسمي|اسمي|أنا\s+دكتور|انا\s+دكتور|أنا\s+دكتورة|انا\s+دكتورة)\s*/i, '').trim();
  cleaned = cleaned.replace(/^(?:دكتور|دكتورة|د\.|د\/|د\s)\s*/i, '').trim();
  cleaned = cleaned.replace(/^[\(\[\{«"']+|[\)\]\}»"']+$/g, '').trim();
  return cleaned ? `د. ${cleaned}` : 'دكتور';
}

export function isValidPersonName(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const cleaned = raw.trim();
  if (cleaned.length < 2 || cleaned.length > 40) return false;
  if (cleaned.startsWith('/')) return false;

  // Strip doctor and name introduction prefixes
  let stripped = cleaned
    .replace(/^(?:أنا\s+اسمي|انا\s+اسمي|اسمي|أنا\s+دكتور|انا\s+دكتور|أنا\s+دكتورة|انا\s+دكتورة)\s*/i, '')
    .replace(/^(?:دكتور|دكتورة|د\.|د\/|د\s)\s*/i, '')
    .replace(/^[\(\[\{«"']+|[\)\]\}»"']+$/g, '')
    .trim();

  if (stripped.length < 2) return false;

  // Cannot contain any numbers/digits
  if (/\d/.test(stripped)) return false;

  // Cannot contain URLs, links, emails, or code brackets / math operators
  if (/(?:https?:\/\/|www\.|\.com|\.app|@|[<>{}\[\]=+\\_*~`|;:?!؟])/i.test(stripped)) return false;

  // Must not contain action / expense / study / religious / bot interaction keywords
  const invalidKeywords = [
    'صرفت', 'صرف', 'دفعت', 'دفع', 'اشتريت', 'شراء', 'فلوس', 'جنيه', 'جنية', 'ج.م', 'جم', 'egp', 'le', 'ريال', 'دولار', 'حساب', 'مصاريف', 'خزنة',
    'ذاكرت', 'مذاكرة', 'حفظت', 'سمعت', 'قرأت', 'محاضرة', 'سكشن', 'موديول', 'كويز', 'امتحان', 'سؤال', 'اسئلة', 'حل', 'فارما', 'اناتومي', 'باطنة', 'جراحة', 'اطفال', 'نساء', 'مايكرو', 'باثو',
    'صليت', 'صلاة', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء', 'وتر', 'سنن', 'رواتب', 'أذكار', 'اذكار', 'قرآن', 'صيام', 'صمت',
    'جيم', 'تمرين', 'تمرينات', 'شغل', 'بزنس', 'بيزنس', 'فويس', 'ريكورد', 'صوت', 'تسجيل',
    'تفعيل', 'اشتراك', 'تجديد', 'باقة', 'تحويل', 'إيصال', 'ايصال', 'كاش', 'فودافون', 'انستا', 'انستاباي', 'instapay',
    'سلام', 'مساء', 'صباح', 'ازيك', 'عامل ايه', 'مين', 'ليه', 'ازاي', 'فين', 'شكرا', 'تمام', 'اوك', 'ماشى', 'ماشي', 'هلو', 'هاي', 'الو', 'ألو'
  ];

  const words = stripped.split(/[\s,\.\-]+/).filter(Boolean);
  for (const w of words) {
    if (invalidKeywords.includes(w.toLowerCase())) return false;
  }

  // Must only consist of Arabic or Latin letters, spaces, dots, and hyphens/apostrophes
  const validNameRegex = /^[\u0621-\u064A\u0671-\u06D3a-zA-Z\s\.\-']{2,40}$/;
  if (!validNameRegex.test(stripped)) return false;

  return true;
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
  if (!fromId || isAdminUser(fromId)) return { allowed: true }; // Admin Dr. Abdullah is 100% exempt
  
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

const recentRegistrationPrompts = new Map();

function shouldThrottleRegistrationPrompt(fromId) {
  if (!fromId) return false;
  const now = Date.now();
  const last = recentRegistrationPrompts.get(fromId);
  if (last && now - last < 4000) {
    return true;
  }
  recentRegistrationPrompts.set(fromId, now);
  for (const [id, t] of recentRegistrationPrompts.entries()) {
    if (now - t > 60000) recentRegistrationPrompts.delete(id);
  }
  return false;
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
      web_app: { url: `https://futureairpro.github.io/Abdallah-Pro/?telegram_id=${fromId}` }
    }).catch(() => {});

    // 1. Fetch profile & session
    let profile = await getUserProfile(fromId);
    const session = await getUserSession(fromId);
    const text = ctx.message?.text?.trim();

    // 2. Super Admin (Dr. Abdullah) bypasses all gatekeepers
    if (isAdminUser(fromId)) {
      ctx.userProfile = profile;
      return next();
    }

    // 3. Handle Completely Unregistered Users (!profile)
    if (!profile) {
      const isRegisteringState = session?.state === 'registering_name';
      const nameMatch = text ? text.match(/^(?:أنا\s+اسمي|انا\s+اسمي|اسمي|أنا\s+دكتور|انا\s+دكتور|أنا\s+دكتورة|انا\s+دكتورة|دكتور|دكتورة|د\.|د\/)\s*(.+)$/i) : null;
      const candidateRaw = nameMatch ? nameMatch[1].trim() : (isRegisteringState ? text : null);

      if (candidateRaw && isValidPersonName(candidateRaw)) {
        // User supplied a valid full personal name
        const cleanName = formatDoctorName(candidateRaw);

        const newProfile = await registerUserProfile(fromId, {
          fullName: cleanName,
          username: ctx.from?.username
        });

        await setUserSession(fromId, { state: 'onboarding_year' });

        // Send Step 2 (Academic Year Selection with Educational Context)
        const { msg, keyboard } = getOnboardingStepContent('year', newProfile);
        await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });

        // Notify Admin Dr. Abdullah
        const adminAlert = `🔔 <b>طالب جديد قام بتسجيل حسابه:</b>\n━━━━━━━━━━━━━━━━━━━━━\n👤 <b>الاسم:</b> ${cleanName}\n🆔 <b>المعرف:</b> <code>${fromId}</code>\n🔗 <b>اليوزر:</b> @${ctx.from?.username || 'لا يوجد'}\n⏳ <b>الفترة:</b> 3 أيام تجربة مجانية`;

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

      // If user was prompted for their name but typed an invalid name or non-name text (like 'صرفت 50 جنيه')
      if (isRegisteringState && text && !text.startsWith('/')) {
        return ctx.reply(
          `⚠️ <b>يرجى كتابة اسمك الشخصي بشكل صحيح للبدء:</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `مثال: <code>د. محمد أحمد</code> أو <code>سارة إبراهيم</code>\n\n` +
          `❓ <b>ليه بنسأل عن اسمك؟</b>\n` +
          `عشان نخاطبك بيه دايماً في كل التقارير والتوجيهات، ونظبط نبرة الخطاب (دكتور / دكتورة) في الكويزات والتنبيهات بأسلوب راقي ومخصص لك.\n\n` +
          `✍️ <i>اكتب اسمك الآن لتفعيل حسابك وفترتك التجريبية المجانية (3 أيام)! 👇</i>`,
          { parse_mode: 'HTML' }
        );
      }

      // Prompt brand new user to enter their name (Step 1 of Onboarding)
      if (shouldThrottleRegistrationPrompt(fromId)) {
        return;
      }

      await setUserSession(fromId, { state: 'registering_name' });
      const { msg: promptMsg } = getOnboardingStepContent('name');
      return ctx.reply(promptMsg, { parse_mode: 'HTML' });
    }

    // 4. Existing User: Check Subscription Validity
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

      // Allow support commands even when expired
      const commandText = text ? text.split(' ')[0].toLowerCase() : '';
      if (['/support', '/contact', '/help_support', '/subscribe', '/renew', '/pay', '/help'].includes(commandText)) {
        ctx.userProfile = profile;
        return next();
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

    // 5. Active User: Fair-Use Rate Limit check
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

    // Attach profile to context for downstream handlers
    ctx.userProfile = profile;
    return next();
  });

  // Set Persistent Native Telegram Chat Menu Button

  bot.telegram.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: '📱 لوحة التحكم',
      web_app: { url: 'https://futureairpro.github.io/Abdallah-Pro/' }
    }
  }).catch(() => {});

  // Register official Bot Commands with Telegram
  bot.telegram.setMyCommands([
    { command: 'now', description: '🧭 أعمل إيه دلوقتي؟ (دليل راحة البال)' },
    { command: 'menu', description: '🚀 فتح القائمة الرئيسية' },
    { command: 'academic', description: '🎓 الفرقة والموديولات الدراسية' },
    { command: 'quiz', description: '🩺 كويز سريري من موادي المرفوعة' },
    { command: 'settings', description: '⚙️ تخصيص وإخفاء الأقسام' },
    { command: 'rename', description: '🏷️ تعديل اسم الحساب' },
    { command: 'stats', description: '📊 إحصائيات المذاكرة والتحصيل' },
    { command: 'support', description: '💬 الدعم الفني وتجديد الاشتراك' }
  ]).catch(() => {});

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

  // 🎛️ Dynamic Menu Builder based on Student's Preferences
  function buildDynamicMenuKeyboard(profile, fromId) {
    const prefs = profile?.preferences || DEFAULT_USER_PREFERENCES;
    const rows = [];

    // Row 0: 🧭 Ultimate Compass & Peace of Mind Engine (Top Primary Button)
    rows.push([{ text: '🧭 أعمل إيه دلوقتي؟ (دليل راحة البال)', callback_data: 'btn_what_to_do_now' }]);

    // Row 1: Core Medical & English (if enabled)
    const row1 = [{ text: '🩺 كويزات ومذاكرة الطب', callback_data: 'menu_med_spaced' }];
    if (prefs.english !== false) {
      row1.push({ text: '🗣️ فلاش كاردز الإنجليزية', callback_data: 'menu_eng_spaced' });
    }
    rows.push(row1);

    // Row 2: Academic Schedule & Quran (if islamic enabled)
    const row2 = [];
    if (prefs.schedule !== false) {
      row2.push({ text: '📅 جدول السكاشن والغياب', callback_data: 'menu_academic' });
    }
    if (prefs.islamic !== false) {
      row2.push({ text: '📖 سجل المصحف والتثبيت', callback_data: 'menu_quran' });
    }
    if (row2.length > 0) rows.push(row2);

    // Row 3: Fasting/Adhkar (if islamic enabled) & Wellness
    const row3 = [];
    if (prefs.islamic !== false) {
      row3.push({ text: '🌙 الصيام والسنن والأذكار', callback_data: 'menu_fasting' });
    }
    if (prefs.wellness !== false) {
      row3.push({ text: '🧠 الفضفضة والاتزان النفسي', callback_data: 'menu_wellness' });
    }
    if (row3.length > 0) rows.push(row3);

    // Row 4: Gym & Content (if enabled)
    const row4 = [];
    if (prefs.gym === true) {
      row4.push({ text: '🏋️‍♂️ الجيم واللياقة البدنية', callback_data: 'menu_gym' });
    }
    if (prefs.content === true) {
      row4.push({ text: '🎬 صناعة المحتوى والمونتاج', callback_data: 'menu_content' });
    }
    if (row4.length > 0) rows.push(row4);

    // Row 5: Work & Finance
    const row5 = [];
    if (prefs.work === true) {
      row5.push({ text: '💼 الشغل ومشاريع البيزنس', callback_data: 'menu_work' });
    }
    if (prefs.finance !== false) {
      row5.push({ text: '💵 الخزنة والمصروفات الشخصية', callback_data: 'menu_finance' });
    }
    if (row5.length > 0) rows.push(row5);

    // Row 6: Tasks & Academic Year Configuration
    rows.push([
      { text: '🎯 المهام والمواعيد والتركيز', callback_data: 'menu_tasks' },
      { text: '🎓 الفرقة والموديولات', callback_data: 'menu_academic_config' }
    ]);

    // Row 7: Settings & Customization + Commands Guide
    rows.push([
      { text: '⚙️ تخصيص الأقسام', callback_data: 'menu_settings' },
      { text: '🧭 دليل الأوامر السريعة', callback_data: 'menu_commands_guide' }
    ]);

    // Row 8: Support & (Admin-Only Sandbox)
    const row8 = [
      { text: '💬 الدعم الفني والاشتراك', url: 'https://t.me/Dr31327' }
    ];
    if (Number(fromId) === ADMIN_CHAT_ID) {
      row8.push({ text: '🧪 وضع التجربة (Admin)', callback_data: 'menu_sandbox' });
    }
    rows.push(row8);

    return { inline_keyboard: rows };
  }

  // 🌟 Master Comprehensive Encyclopedia Guide of all Bot Capabilities
  function getMasterBotGuideContent(profile) {
    const studentName = profile?.full_name || 'دكتور';
    const year = profile?.academic_year || 'الفرقة الرابعة';

    let msg = `🌟 <b>الدليل الشامل لإمكانيات منظومة الطبيب (Doctor OS)</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `أهلاً بك يا <b>${studentName}</b>! أنا عقلك المدبر ومساعدك الشخصي في رحلتك الطبية والحياتية (${year}).\n`;
    msg += `تقدر تقولي أي حاجة بصوتك 🎙️ أو بالكتابة ✍️ وهفهمها فوراً:\n\n`;

    msg += `🩺 <b>1. الأكاديميا والمذاكرة والكويزات:</b>\n`;
    msg += `• <i>تقولي:</i> «ذاكرت ساعتين أطفال شابتر Nutrition وحليت 20 صفحة فهم 90%»\n`;
    msg += `  ↳ <b>البوت:</b> يوثق 120 دقيقة بالموديول ونسبة الفهم ويحدث تقريرك.\n`;
    msg += `• <i>تقولي:</i> «عندي سيكشن كارديو كل حد الساعة 9 الصبح في المستشفى»\n`;
    msg += `  ↳ <b>البوت:</b> يثبته في جدولك الأسبوعي ويفكرك قبله بساعة.\n`;
    msg += `• <i>تقولي:</i> «شفت حالة طفل عنده Heart Failure في الراوند»\n`;
    msg += `  ↳ <b>البوت:</b> يفرغها كحالة إكلينيكية كاملة ويحفظها في سجلك.\n`;
    msg += `• <i>اكتب /quiz أو صور ورق:</i> لتوليد كويزات بالتكرار المتباعد.\n\n`;

    msg += `🕌 <b>2. الجانب الروحي والعبادات:</b>\n`;
    msg += `• <i>تقولي:</i> «صليت الظهر في المسجد وسنته 4 ركعات وقرأت 5 صفحات كهف»\n`;
    msg += `  ↳ <b>البوت:</b> يوثق الفريضة حاضر والسنن وصفحات القرآن وتثبيت الختمة.\n`;
    msg += `• <i>تقولي:</i> «صايم سنة الإثنين وصليت الضحى وقرأت أذكار الصباح»\n`;
    msg += `  ↳ <b>البوت:</b> يوثق صيام التطوع والسنن والأذكار فوراً.\n\n`;

    msg += `🧭 <b>3. بوصلة اليوم («أعمل إيه دلوقتي»):</b>\n`;
    msg += `• <i>تقولي:</i> «أعمل إيه دلوقتي؟» أو «أنا تايه ومش عارف أبدأ بإيه»\n`;
    msg += `  ↳ <b>البوت:</b> يحلل موديولاتك المهملة ويديك بلوك تركيز 60-90 دقيقة وجدول ليومك وكبسولة راحة بال.\n\n`;

    msg += `⏰ <b>4. المواعيد والتذكيرات الذكية:</b>\n`;
    msg += `• <i>تقولي:</i> «فكرني بعد ساعة أكلم الدكتور» أو «عندي ميعاد بكرة 8 مساءً»\n`;
    msg += `  ↳ <b>البوت:</b> يحسب الوقت بالدقيقة ويبعتلك إشعار تنبيهي تفاعلي.\n`;
    msg += `• <i>تقولي:</i> «فكرني بعد صلاة العصر بنص ساعة بـ...»\n`;
    msg += `  ↳ <b>البوت:</b> يحسب موعد أذان العصر تلقائياً ويفكرك بعده بـ 30 دقيقة.\n`;
    msg += `• <i>تقولي:</i> «فكرني كل جمعة أقرأ سورة الكهف 10 الصبح»\n`;
    msg += `  ↳ <b>البوت:</b> يبرمج تذكيراً أسبوعياً متكرراً بانتظام.\n\n`;

    msg += `🎯 <b>5. المهام اليومية (Daily Tasks):</b>\n`;
    msg += `• <i>تقولي:</i> «سجل عندي مهمة أراجع شابتر 1 لمدة ساعة»\n`;
    msg += `  ↳ <b>البوت:</b> يضيفها لقائمة مهامك بأولويتها وتصنيفها.\n\n`;

    msg += `🗣️ <b>6. مدرب الإنجليزية وفلاش كاردز:</b>\n`;
    msg += `• <i>اكتب /english أو اتكلم إنجليزي:</i>\n`;
    msg += `  ↳ <b>البوت:</b> يمارس معاك محادثة، يصحح النطق والجرامر، ويستخرج فلاش كاردز بمعاني مصرية للمراجعة.\n\n`;

    msg += `📸 <b>7. تصوير الورق والامتحانات (OCR Vision):</b>\n`;
    msg += `• <i>ارفع صورة MCQ أو سلايد:</i>\n`;
    msg += `  ↳ <b>البوت:</b> يستخرج الأسئلة ويحلها ويدخلها بنك الكويزات.\n\n`;

    msg += `🧠 <b>8. الفضفضة والاتزان النفسي:</b>\n`;
    msg += `• <i>تقولي:</i> «أنا مضغوط وحاسس بإحباط وتشتت»\n`;
    msg += `  ↳ <b>البوت:</b> يقدم دعم نفسي وتفريغ وتوجيه عملي لاستعادة طاقتك.\n\n`;

    msg += `💵 <b>9. الخزنة والمصروفات الشخصية:</b>\n`;
    msg += `• <i>تقولي:</i> «صرفت 150 جنيه غدا فودافون كاش» أو «جالي 500 إنستا باي»\n`;
    msg += `  ↳ <b>البوت:</b> يصنف وسيلة الدفع تلقائياً ويحدث رصيدك وتقاريرك.\n\n`;

    msg += `🏋️‍♂️ <b>10. الجيم واللياقة البدنية:</b>\n`;
    msg += `• <i>تقولي:</i> «تمرنت ساعة صدر وتراي وخدت 120ج بروتين و3 لتر مية»\n`;
    msg += `  ↳ <b>البوت:</b> يوثق التمرين والعضلات والبروتين والماء.\n\n`;

    msg += `🎬 <b>11. المحتوى والبيزنس (اختياري):</b>\n`;
    msg += `• <i>تقولي:</i> «صورت فيديو يوتيوب طبي» أو «أرباح 1000ج في مشروع»\n`;
    msg += `  ↳ <b>البوت:</b> يتابع مراحل الإنتاج وأرباح العمل.\n\n`;

    msg += `✨ <b>12. تريكات ذكية وميزات عامة:</b>\n`;
    msg += `• <b>↩️ التراجع الفوري:</b> زر تراجع لحذف أي عملية سجلتها بالخطأ.\n`;
    msg += `• <b>⚙️ التخصيص (/settings):</b> لإخفاء أي قسم لا تحتاجه.\n`;
    msg += `• <b>🎓 الموديولات (/academic):</b> لتغيير فرقتك أو موديولاتك.\n`;
    msg += `• <b>🏷️ الاسم (/rename):</b> لتعديل اسمك ولقبك.\n`;
    msg += `• <b>🌐 الـ Web App (/dashboard):</b> لوحة تحكم كاملة برسم بياني.`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🧭 جرب: أعمل إيه دلوقتي؟', callback_data: 'menu_today' },
          { text: '📅 جدول السكاشن', callback_data: 'menu_schedule' }
        ],
        [
          { text: '🩺 كويزات موادي', callback_data: 'start_user_quiz' },
          { text: '🗣️ مدرب الإنجليزية', callback_data: 'menu_eng_spaced' }
        ],
        [
          { text: '⚙️ تخصيص الأقسام والاهتمامات', callback_data: 'menu_settings' },
          { text: '🎓 إعدادات الفرقة', callback_data: 'menu_academic_config' }
        ],
        [
          { text: '🚀 فتح القائمة الرئيسية', callback_data: 'menu_main' }
        ]
      ]
    };

    return { msg, keyboard };
  }

  function getCommandsGuideContent(profile) {
    return getMasterBotGuideContent(profile);
  }

  // 🌟 Smart Onboarding Steps Generator (Step-by-Step Educational Wizard)
  function getOnboardingStepContent(step, profile) {
    const cleanName = profile?.full_name || 'دكتور';

    if (step === 'name') {
      let msg = `🩺 <b>أهلاً بك في منظومة الطبيب الذكية (Doctor OS)! 🌟</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `أنا عقلك المدبر ومساعدك الشخصي لإدارة دراستك والسكاشن وبنك الكويزات والصلوات ومصروفاتك اليومية.\n\n`;
      msg += `✍️ <b>قولي اسمك إيه؟</b>\n`;
      msg += `<i>(مثال: <code>د. محمد أحمد</code> أو <code>سارة إبراهيم</code>)</i>\n\n`;
      msg += `❓ <b>ليه بنسأل عن اسمك؟</b>\n`;
      msg += `عشان نخاطبك بيه دايماً في كل التقارير والتوجيهات، ونظبط نبرة الخطاب (دكتور / دكتورة) في الكويزات والتنبيهات بأسلوب راقي ومخصص لك.\n\n`;
      msg += `🎁 <i>فترتك التجريبية المجانية (3 أيام) نشطة بالكامل! اكتب اسمك للبدء فوراً 👇</i>`;
      return { msg, keyboard: null };
    }

    if (step === 'year') {
      let msg = `🎉 <b>أهلاً وسهلاً بك يا ${cleanName}! 🩺✨</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🎓 <b>أنت في الفرقة الكام دلوقتي في كلية الطب؟</b>\n\n`;
      msg += `❓ <b>ليه بنسأل عن فرقتك؟</b>\n`;
      msg += `عشان نفعل موديولات ومواد سنتك الدراسية تلقائياً في حسابك، فيظهر لك بنك الكويزات والسلايدات والأسئلة الخاصة بمنهجك أنت بالتحديد!\n\n`;
      msg += `👇 <i>اختر فرقتك الدراسية بلمسة واحدة:</i>`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🩺 الفرقة الأولى', callback_data: 'onboarding_year_1' },
            { text: '🩺 الفرقة الثانية', callback_data: 'onboarding_year_2' }
          ],
          [
            { text: '🩺 الفرقة الثالثة', callback_data: 'onboarding_year_3' },
            { text: '🩺 الفرقة الرابعة', callback_data: 'onboarding_year_4' }
          ],
          [
            { text: '🩺 الفرقة الخامسة', callback_data: 'onboarding_year_5' },
            { text: '🩺 سنة الامتياز', callback_data: 'onboarding_year_intern' }
          ],
          [
            { text: '✍️ كتابة موديولاتي بنفسي', callback_data: 'onboarding_custom_modules' }
          ]
        ]
      };
      return { msg, keyboard };
    }

    if (step === 'schedule') {
      let msg = `📚 <b>تم اعتماد موديولات سنتك الدراسية بنجاح! ✨</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📅 <b>هل تعرف مواعيد سكاشنك أو راونداتك الأسبوعية؟</b>\n`;
      msg += `<i>(مثال: سيكشن كارديو كل حد الساعة 9 الصبح في المستشفى)</i>\n\n`;
      msg += `❓ <b>ليه بنسأل عن السكاشن؟</b>\n`;
      msg += `عشان البوت يبرمج جدولك ويفكرك تلقائياً قبل كل سيكشن بساعة كاملة عشان متتأخرش ولا يفوتك غياب.\n\n`;
      msg += `💡 <i>لو لسه الدراسة مبدأتش وممعكش الجدول دلوقتي، مفيش أي مشكلة! اضغط تخطي ولما الدراسة تبدأ ابعت الجدول فويس أو صورة وهيتسجل فوراً.</i>`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: '⏳ لسه مش عارف جدولي (هضيفه لما تبدأ الدراسة)', callback_data: 'onboarding_skip_schedule' }
          ],
          [
            { text: '✍️ هسجل مواعيد سكاشني دلوقتي', callback_data: 'onboarding_input_schedule' }
          ]
        ]
      };
      return { msg, keyboard };
    }

    if (step === 'preferences') {
      let msg = `⚙️ <b>آخر خطوة: تظبيط اهتماماتك وأقسامك المفعلة:</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `❓ <b>ليه بنسأل عن اهتماماتك؟</b>\n`;
      msg += `عشان البوت يركز بس على الحاجات اللي تهمك، والأقسام اللي مش مهتم بيها (زي الجيم، صناعة المحتوى، أو مشاريع البيزنس) متظهرش في قائمتك ولا تزعجك بأي إشعارات.\n\n`;
      msg += `✨ <b>الإعدادات الافتراضية للطب:</b> مفعل فيها (المذاكرة الطبية، الكويزات، السكاشن، الإنجليزية، الصلاة والقرآن، والمصاريف).`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🚀 تفعيل الإعدادات الافتراضية والبدء فوراً', callback_data: 'onboarding_finish_default' }
          ],
          [
            { text: '⚙️ تخصيص الأقسام بنفسي الآن', callback_data: 'menu_settings' }
          ]
        ]
      };
      return { msg, keyboard };
    }

    if (step === 'finish') {
      let msg = `🎉 <b>ألف مبروك يا ${cleanName}! 🩺🚀</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `✨ <b>تم ضبط وتجهيز منظومتك بالكامل، وفترتك التجريبية المجانية (3 أيام) نشطة الآن! 🎁</b>\n\n`;
      msg += `💡 <b>تقدر من اللحظة دي تبعت أي حاجة بصوتك 🎙️ أو بالكتابة ✍️ وهفهمها فوراً:</b>\n`;
      msg += `• <i>«ذاكرت ساعتين أطفال شابتر 1»</i>\n`;
      msg += `• <i>«صليت الظهر في المسجد»</i>\n`;
      msg += `• <i>«فكرني بعد ساعة أكلم فلان»</i>\n`;
      msg += `• <i>«أعمل إيه دلوقتي؟»</i>\n\n`;
      msg += `👇 <i>استكشف كل إمكانيات المنظومة أو افتح قائمتك الرئيسية:</i>`;
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🌟 استعراض كل ميزات وإمكانيات البوت', callback_data: 'menu_bot_guide' }
          ],
          [
            { text: '🚀 فتح القائمة الرئيسية', callback_data: 'menu_main' }
          ]
        ]
      };
      return { msg, keyboard };
    }

    return { msg: '', keyboard: null };
  }

  function getSettingsMenuContent(profile) {
    const p = profile?.preferences || DEFAULT_USER_PREFERENCES;
    let msg = `⚙️ <b>لوحة تخصيص وتفعيل الأقسام والاهتمامات:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 <i>اضغط على أي قسم بالأسفل لتفعيله (✅) أو تعطيله (❌) فوراً.</i>\n`;
    msg += `الأقسام المعطلة لن تظهر في قائمتك الرئيسية ولن يصلك منها أي إشعارات أو تذكيرات:\n\n`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🩺 المحور الطبي والكويزات: [ 🔒 أساسي مفعّل ]', callback_data: 'toggle_info_med' }
        ],
        [
          { text: `🗣️ فلاش كاردز الإنجليزية: ${p.english !== false ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_english' }
        ],
        [
          { text: `📅 جدول السكاشن والمواعيد: ${p.schedule !== false ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_schedule' }
        ],
        [
          { text: `🕌 القسم الإسلامي والعبادات: ${p.islamic !== false ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_islamic' }
        ],
        [
          { text: `🏋️‍♂️ الجيم واللياقة البدنية: ${p.gym === true ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_gym' }
        ],
        [
          { text: `🎬 صناعة المحتوى والمونتاج: ${p.content === true ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_content' }
        ],
        [
          { text: `💼 مشاريع الشغل والبيزنس: ${p.work === true ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_work' }
        ],
        [
          { text: `💵 الخزنة والمصروفات الشخصية: ${p.finance !== false ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_finance' }
        ],
        [
          { text: `🧠 الفضفضة والاتزان النفسي: ${p.wellness !== false ? '✅ مفعّل' : '❌ معطّل'}`, callback_data: 'toggle_pref_wellness' }
        ],
        [
          { text: '🎓 ضبط الفرقة والتيرم والموديولات', callback_data: 'menu_academic_config' }
        ],
        [
          { text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }
        ]
      ]
    };

    return { msg, keyboard };
  }

  async function sendDynamicMainMenu(ctx) {
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    let name = profile?.full_name;
    if (!name || name === 'دكتور زميل') {
      name = ctx.from?.first_name ? formatDoctorName(ctx.from.first_name) : 'دكتور';
    }
    const prefs = profile?.preferences || DEFAULT_USER_PREFERENCES;
    const year = profile?.academic_year || 'الفرقة الرابعة';
    const semester = profile?.semester || 'الترم الأول';

    let welcome = Number(fromId) === ADMIN_CHAT_ID
      ? `👑 <b>أهلاً بك يا دكتور عبدالله في منظومة رحلة عبدالله الذكية (Abdullah's Journey OS)!</b>\n`
      : `🩺 <b>أهلاً بك يا ${name} في منظومة الطبيب الذكية (Doctor OS)!</b>\n`;

    welcome += `━━━━━━━━━━━━━━━━━━━━━\n`;
    welcome += `🎓 <b>الفرقة:</b> ${year} (${semester}) | <b>الحساب:</b> ${profile?.is_active ? '🟢 نشط' : '⏳ تجربة'}\n`;

    if (prefs.islamic !== false) {
      const prayers = getCairoPrayerTimes();
      welcome += `🕌 <b>مواقيت الصلاة اليوم بالقاهرة:</b>\n`;
      welcome += `• الفجر: <b>${prayers.times12.fajr}</b> | الشروق: <b>${prayers.times12.sunrise}</b> | الظهر: <b>${prayers.times12.dhuhr}</b>\n`;
      welcome += `• العصر: <b>${prayers.times12.asr}</b> | المغرب: <b>${prayers.times12.maghrib}</b> | العشاء: <b>${prayers.times12.isha}</b>\n`;
    } else {
      welcome += `⚡ <i>المساعد الذكي نشط لتنظيم المذاكرة، السكاشن، بنك الكويزات، والمهام بالفويس والذكاء الاصطناعي.</i>\n`;
    }

    welcome += `━━━━━━━━━━━━━━━━━━━━━\n`;
    welcome += `👇 <b>تصفح الأقسام النشطة في حسابك وافتح لوحة التحكم بالأسفل:</b>`;

    const keyboard = buildDynamicMenuKeyboard(profile, fromId);
    return ctx.reply(welcome, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  // 🌟 1. /start & Main Menu
  bot.command(['start', 'menu', 'help'], async (ctx) => {
    return sendDynamicMainMenu(ctx);
  });

  // ==============================================================================

  // 👑 Admin Control Panel (/admin, /grant, /broadcast)

  // ==============================================================================

  bot.command('admin', async (ctx) => {

    const fromId = ctx.from?.id;

    if (Number(fromId) !== ADMIN_CHAT_ID) {

      return ctx.reply('⛔ هذا الأمر مخصص فقط لمدير المنظومة (د. عبدالله).');

    }

    const allUsers = await getAllRegisteredUsers();
    const studentsOnly = allUsers.filter(u => Number(u.telegram_id) !== ADMIN_CHAT_ID);
    const total = studentsOnly.length;
    const active = studentsOnly.filter(u => u.subscription_status === 'active' || u.subscription_status === 'lifetime').length;
    const trials = studentsOnly.filter(u => u.subscription_status === 'trial').length;
    const expired = studentsOnly.filter(u => u.subscription_status === 'expired').length;
    const estimatedRev = active * 30;

    let adminMsg = `👑 <b>لوحة تحكم إدارة منصة الدفعة (Doctor OS Admin) 🚀</b>\n`;
    adminMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    adminMsg += `👥 <b>إجمالي الطلاب المسجلين:</b> <b>${total} طالب</b>\n`;
    adminMsg += `🟢 <b>المشتركين النشطين:</b> <b>${active} مشترك</b>\n`;
    adminMsg += `⏳ <b>في الفترة التجريبية:</b> <b>${trials} طالب</b>\n`;
    adminMsg += `🔒 <b>المنتهية فتراتهم:</b> <b>${expired} طالب</b>\n`;
    adminMsg += `💰 <b>إجمالي الإيرادات المتوقعة:</b> <b>${formatEgp(estimatedRev)} / شهر</b>\n`;

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

  // 🏷️ /rename Command for easy name updating
  bot.command(['rename', 'name', 'اسم'], async (ctx) => {
    const fromId = ctx.from?.id;
    const text = ctx.message.text.replace(/^\/(?:rename|name|اسم)\s*/i, '').trim();
    if (!text) {
      await setUserSession(fromId, { state: 'waiting_new_name' });
      return ctx.reply('✍️ <b>يرجى كتابة اسمك الجديد بعد الأمر:</b>\nمثال: <code>/rename د. محمد أحمد</code>\nأو اكتب اسمك في رسالة بالأسفل مباشرة.', { parse_mode: 'HTML' });
    }

    if (!isValidPersonName(text)) {
      return ctx.reply('⚠️ <b>يرجى كتابة اسم صحيح بدون أرقام أو كلمات أخرى:</b>\nمثال: <code>/rename د. محمد أحمد</code>', { parse_mode: 'HTML' });
    }

    const cleanName = formatDoctorName(text);
    const resolvedGender = detectGenderFromName(cleanName);

    const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', fromId).maybeSingle();
    const sessData = existing?.data || {};
    if (!sessData.profile) {
      sessData.profile = { telegram_id: fromId };
    }
    sessData.profile.full_name = cleanName;
    sessData.profile.gender = resolvedGender;
    sessData.profile.username = ctx.from?.username || sessData.profile.username;

    await supabase.from('bot_sessions').upsert({
      chat_id: fromId,
      state: 'idle',
      data: sessData,
      updated_at: new Date().toISOString()
    });
    await supabase.from('users').update({ full_name: cleanName, gender: resolvedGender, updated_at: new Date().toISOString() }).eq('telegram_id', fromId).catch(() => {});

    let successMsg = `✅ <b>تم تحديث اسمك في المنظومة بنجاح يا ${cleanName}! 🩺✨</b>\n`;
    successMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    successMsg += `تم اعتماد اسمك الجديد في كافة كويزاتك، موديولاتك، وتقاريرك.`;

    return ctx.reply(successMsg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 فتح القائمة الرئيسية', callback_data: 'menu_main' }],
          [{ text: '📱 لوحة التحكم', web_app: { url: `https://futureairpro.github.io/Abdallah-Pro/?telegram_id=${fromId}` } }]
        ]
      }
    });
  });

  // 📊 Helper: Send Comprehensive Student Study & Habit Stats
  async function sendStudentStats(ctx, fromId) {
    const today = getCairoToday();
    const profile = await getUserProfile(fromId);
    const studentName = profile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'د. عبدالله' : 'دكتور زميل');
    const activeCourses = await getUserActiveCourses(fromId);

    // 1. Fetch study sessions
    const { data: rawStudy } = await supabase.from('study_sessions').select('*').order('date', { ascending: false });
    const userStudy = (rawStudy || []).filter(s => !s.topic?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : s.topic.includes(`usr:${fromId}`));

    let totalMinsAll = 0;
    let todayMins = 0;
    const moduleMins = {};

    activeCourses.forEach(c => {
      moduleMins[c.code.toUpperCase()] = { title: c.title, mins: 0, count: 0 };
    });

    userStudy.forEach(s => {
      const mins = Number(s.duration_minutes || 0);
      totalMinsAll += mins;
      if (s.date === today) {
        todayMins += mins;
      }
      const code = (s.course_code || 'MOD').trim().toUpperCase();
      if (!moduleMins[code]) {
        moduleMins[code] = { title: s.topic || `موديول [${code}]`, mins: 0, count: 0 };
      }
      moduleMins[code].mins += mins;
      moduleMins[code].count++;
    });

    // 2. Fetch today's tasks & worship
    const { data: rawTasks } = await supabase.from('daily_tasks').select('*').eq('date', today);
    const userTasks = (rawTasks || []).filter(t => !t.category?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : t.category.includes(`usr:${fromId}`));
    const doneTasksCount = userTasks.filter(t => t.status === 'تم الإنجاز' || t.status === 'مكتملة').length;

    const { data: rawQuran } = await supabase.from('quran_logs').select('*').eq('date', today);
    const userQuran = (rawQuran || []).filter(q => !q.session_type?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : q.session_type.includes(`usr:${fromId}`));

    const { data: fw } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', today).maybeSingle();

    const todayHrsFormatted = (todayMins / 60).toFixed(1);
    const totalHrsFormatted = (totalMinsAll / 60).toFixed(1);

    let msg = `📊 <b>تقرير وإحصائيات تحصيل ${studentName}:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⏱️ <b>إجمالي مذاكرة اليوم:</b> <b>${todayHrsFormatted} ساعة</b> (${todayMins} دقيقة)\n`;
    msg += `📈 <b>إجمالي المذاكرة الموثقة:</b> <b>${totalHrsFormatted} ساعة</b> (${userStudy.length} جلسة)\n\n`;

    msg += `🩺 <b>توزيع المذاكرة على موديولاتك:</b>\n`;
    const sortedModules = Object.entries(moduleMins);
    if (sortedModules.length === 0) {
      msg += `• <i>لم يتم توثيق جلسات مذاكرة بعد.</i>\n`;
    } else {
      sortedModules.forEach(([code, data]) => {
        const modHrs = (data.mins / 60).toFixed(1);
        msg += `• <code>[${code}]</code> <b>${data.title}:</b> ${modHrs} س (${data.count} جلسات)\n`;
      });
    }

    msg += `\n🎯 <b>إنجازات اليوم (${today}):</b>\n`;
    msg += `• 📋 المهام: ${doneTasksCount} / ${userTasks.length} منجزة\n`;
    msg += `• 📖 ورد القرآن: ${userQuran.length > 0 ? `${userQuran.length} أوراد مسجلة 🟢` : 'لم يُسجل ورد اليوم ⚪'}\n`;
    msg += `• 🕌 السنن والرواتب: ${fw?.sunan_rawatib_count || 0} ركعات\n`;
    msg += `• 🌅 أذكار الصباح: ${fw?.adhkar_morning ? '✅' : '⚪'} | 🌇 أذكار المساء: ${fw?.adhkar_evening ? '✅' : '⚪'}\n`;

    msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 <i>يمكنك رؤية الرسوم البيانية والجداول الكاملة في لوحة التحكم التفاعلية!</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '📱 فتح لوحة التحكم الكاملة', web_app: { url: `https://futureairpro.github.io/Abdallah-Pro/?telegram_id=${fromId}` } }],
        [
          { text: '🧪 كويز سريري جديد', callback_data: 'menu_med_spaced' },
          { text: '🎓 ضبط الموديولات', callback_data: 'menu_academic_config' }
        ],
        [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  // 📊 /stats Command for Study & Habit Analytics
  bot.command(['stats', 'statistics', 'تقرير', 'احصائيات', 'انجاز', 'إحصائيات', 'احصائياتي', 'إحصائياتي'], async (ctx) => {
    const fromId = ctx.from?.id;
    return sendStudentStats(ctx, fromId);
  });

  bot.action('menu_stats', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    return sendStudentStats(ctx, fromId);
  });

  // 🧭 Command Shortcuts & Help Guide
  bot.command(['help', 'guide', 'اوامر', 'مساعدة'], async (ctx) => {
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    const { msg, keyboard } = getCommandsGuideContent(profile);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.command(['academic', 'modules', 'موديولات', 'فرقة'], async (ctx) => {
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    const courses = await getUserActiveCourses(fromId);
    const { msg, keyboard } = getAcademicConfigContent(profile, courses);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.command(['settings', 'prefs', 'تخصيص', 'اعدادات'], async (ctx) => {
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    const { msg, keyboard } = getSettingsMenuContent(profile);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.command(['quiz', 'كويز', 'سؤال', 'اختبار'], async (ctx) => {
    const fromId = ctx.from?.id;
    const quizzes = await getUserMedicalQuizzes(fromId);

    if (!quizzes || quizzes.length === 0) {
      let noQuizMsg = `🩺 <b>بنك الكويزات والأسئلة (Spaced Repetition):</b>\n`;
      noQuizMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      noQuizMsg += `⚠️ <b>لا توجد أسئلة أو كويزات مسجلة في حسابك بعد!</b>\n\n`;
      noQuizMsg += `💡 <i>المنظومة لا تولد أسئلة عشوائية من خارج منهجك، بل تختبرك حصراً في الأسئلة والسلايدات والصفحات التي تقوم برفعها بنفسك لموديولاتك.</i>\n\n`;
      noQuizMsg += `📸 <b>كيف تضيف كويزات وأسئلة لموديولاتك؟</b>\n`;
      noQuizMsg += `1️⃣ صوّر أي سلايد، صفحة من كتابك، أو ورقة أسئلة/MCQ من كليتك.\n`;
      noQuizMsg += `2️⃣ أرسل الصورة هنا في الشات (أو اكتب السؤال مباشرة).\n`;
      noQuizMsg += `3️⃣ سيقوم الذكاء الاصطناعي باستخراج الأسئلة فوراً وحفظها في بنكك الشخصي وجدولتها للمراجعة بالتكرار المتباعد! ⚡`;

      return ctx.reply(noQuizMsg, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]] }
      });
    }

    // Pick a random quiz from user's uploaded questions
    const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    let msg = `🩺 <b>كويز من أسئلتك وموادك المرفوعة [${randomQuiz.course_code}]:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (randomQuiz.topic || randomQuiz.clean_topic) {
      msg += `📌 <b>الموضوع:</b> ${randomQuiz.clean_topic || randomQuiz.topic}\n\n`;
    }
    msg += `❓ <b>السؤال:</b>\n<b>${randomQuiz.question}</b>\n\n`;
    msg += `💡 <i>فكر في الإجابة والتشخيص ثم اضغط لإظهار الشرح وتريكة الراوند:</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '💡 إظهار الإجابة النموذجية والشرح', callback_data: `reveal_user_quiz_${randomQuiz.id || 'last'}` }],
        [{ text: '🎲 سؤال آخر من موادي', callback_data: 'start_user_quiz' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    if (fromId) await setUserSession(fromId, { activeUserQuiz: randomQuiz });
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  // 🧭 Ultimate Compass & Peace of Mind Engine: "أعمل إيه دلوقتي؟"
  async function handleWhatToDoNow(ctx) {
    const fromId = ctx.from?.id;
    if (!fromId) return;

    // Send comforting wait message immediately so the student knows deep analysis is running
    const waitMsg = await ctx.reply(
      '🧭 <i>جاري فحص سجلك الطبي، ساعات مذاكرتك، الموديولات، والمهام لبناء خطة عمل ذكية لراحة بالك...</i> ⏳',
      { parse_mode: 'HTML' }
    );

    try {
      const [snapshot, aiKeys] = await Promise.all([
        getStudentHolisticSnapshot(fromId),
        getStoredAiKeys()
      ]);

      const planText = await generateHolisticWhatToDoPlan(snapshot, aiKeys);

      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

      const actionKeyboard = {
        inline_keyboard: [
          [
            { text: '🩺 كويزات ومذاكرة الطب', callback_data: 'menu_med_spaced' },
            { text: '🎯 المهام والمواعيد', callback_data: 'menu_tasks' }
          ],
          [
            { text: '🔄 تحديث البوصلة والخطة', callback_data: 'btn_what_to_do_now' },
            { text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }
          ]
        ]
      };

      return ctx.reply(planText, {
        parse_mode: 'HTML',
        reply_markup: actionKeyboard
      });
    } catch (err) {
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      console.error('Error generating what to do plan:', err);
      return ctx.reply(
        `❌ <b>تعذر استخراج التوجيه الذكي حالياً:</b> ${err.message}\n💡 <i>يرجى المحاولة مرة أخرى أو فتح القائمة الرئيسية.</i>`,
        { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]] } }
      );
    }
  }

  // Bind Commands and Action for "أعمل إيه دلوقتي؟"
  bot.command(['now', 'next', 'what_to_do', 'اعمل_ايه', 'توجيه', 'تايه', 'اعمل_ايه_دلوقتي'], async (ctx) => {
    return handleWhatToDoNow(ctx);
  });

  bot.action('btn_what_to_do_now', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    return handleWhatToDoNow(ctx);
  });

  // ✏️ Rename Student (/rename <الاسم الجديد> أو Admin: /rename <telegram_id> <الاسم الجديد>)
  bot.command(['rename', 'setname', 'تسمية', 'اسم'], async (ctx) => {
    const fromId = ctx.from?.id;
    const text = ctx.message.text.trim();
    const parts = text.split(' ').filter(Boolean);

    // 1. Admin renaming another student: /rename <telegram_id> <name>
    if (Number(fromId) === ADMIN_CHAT_ID && parts.length >= 3 && /^\d+$/.test(parts[1])) {
      const targetId = Number(parts[1]);
      const rawName = parts.slice(2).join(' ').trim();
      const newName = formatDoctorName(rawName);

      const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', targetId).maybeSingle();
      const sessData = existing?.data || {};
      if (!sessData.profile) sessData.profile = { telegram_id: targetId };
      sessData.profile.full_name = newName;

      await supabase.from('bot_sessions').upsert({
        chat_id: targetId,
        state: existing?.state || 'idle',
        data: sessData,
        updated_at: new Date().toISOString()
      });
      await supabase.from('users').update({ full_name: newName, updated_at: new Date().toISOString() }).eq('telegram_id', targetId).catch(() => {});

      await ctx.reply(`✅ تم تغيير اسم الطالب <code>${targetId}</code> إلى: <b>${newName}</b> بنجاح!`, { parse_mode: 'HTML' });
      await bot.telegram.sendMessage(targetId, `✨ <b>تم تحديث اسمك في المنظومة إلى:</b> <b>${newName}</b> 🩺`, { parse_mode: 'HTML' }).catch(() => {});
      return;
    }

    // 2. Student (or Admin) renaming themselves: /rename <name>
    if (parts.length >= 2) {
      const rawName = parts.slice(1).join(' ').trim();
      if (rawName.length < 2) {
        return ctx.reply('⚠️ يرجى كتابة اسم صحيح مكون من كلمتين على الأقل.');
      }
      const newName = formatDoctorName(rawName);

      const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', fromId).maybeSingle();
      const sessData = existing?.data || {};
      if (!sessData.profile) sessData.profile = { telegram_id: fromId };
      sessData.profile.full_name = newName;

      await supabase.from('bot_sessions').upsert({
        chat_id: fromId,
        state: existing?.state || 'idle',
        data: sessData,
        updated_at: new Date().toISOString()
      });
      await supabase.from('users').update({ full_name: newName, updated_at: new Date().toISOString() }).eq('telegram_id', fromId).catch(() => {});

      return ctx.reply(`✅ <b>تم تحديث اسمك في المنظومة بنجاح!</b>\nأهلاً بك يا <b>${newName}</b> 🩺✨`, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: [[{ text: '🚀 فتح القائمة الرئيسية', callback_data: 'menu_main' }]] }
      });
    }

    // 3. Prompt interactive name update
    await setUserSession(fromId, { state: 'waiting_new_name' });
    return ctx.reply(`✍️ <b>تعديل اسمك في المنظومة:</b>\nيرجى كتابة اسمك الجديد في رسالة الآن (مثال: <code>د. محمد أحمد</code> أو <code>أنا اسمي د. محمد أحمد</code>):`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '🔙 إلغاء والرجوع', callback_data: 'menu_commands_guide' }]] }
    });
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

      // 📅 Check if user was waiting to edit schedule via voice note
      if (session?.state === 'waiting_edit_schedule') {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        await setUserSession(fromId, { state: 'idle' });

        const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'د. عبدالله' : 'دكتور زميل');
        const userProf = await getUserProfile(fromId);
        const activeCourses = await getUserActiveCourses(fromId);

        const parsed = await parseWithGeminiPool(audioBuffer, aiKeys, true, studentName, {
          academicYear: userProf?.academic_year,
          semester: userProf?.semester,
          courses: activeCourses,
          preferences: userProf?.preferences,
          gender: userProf?.gender
        });

        const items = (Array.isArray(parsed.schedule_items) && parsed.schedule_items.length > 0)
          ? parsed.schedule_items
          : (Array.isArray(parsed.data?.academic_schedule) ? parsed.data.academic_schedule : []);

        if (items.length > 0) {
          for (const sch of items) {
            await supabase.from('academic_schedule').insert({
              course_code: sch.course_code || 'سيكشن',
              title: sch.title || 'سيكشن جامعي',
              day_of_week: sch.day_of_week || 'الأحد',
              start_time: sch.start_time || '09:00',
              end_time: sch.end_time || '11:00',
              location: sch.location || null,
              type: `[usr:${fromId}] سيكشن أسبوعي`
            }).catch(() => {});
          }

          let successMsg = `✅ <b>تم فهم وتثبيت جدول سكاشنك من الفويس بنجاح! 📅🎙️</b>\n`;
          successMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
          items.forEach(s => {
            successMsg += `• <b>${s.title}</b> [${s.course_code || 'MOD'}]: كل يوم ${s.day_of_week} الساعة ${s.start_time}${s.location ? ` (📍 ${s.location})` : ''}\n`;
          });
          successMsg += `\n⏰ <i>سيقوم البوت بتذكيرك تلقائياً قبل كل سيكشن بساعة كاملة!</i>`;

          return ctx.reply(successMsg, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📅 عرض جدول السكاشن الأسبوعي', callback_data: 'menu_schedule' }],
                [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
              ]
            }
          });
        }
      }

      // 🎓 Check if user was waiting to edit modules via voice note
      if (session?.state === 'waiting_edit_modules') {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        await setUserSession(fromId, { state: 'idle' });

        const parsedCourses = await parseModulesListWithAi(audioBuffer, aiKeys, true);
        await updateUserAcademicProfile(fromId, { customCourses: parsedCourses });

        let successMsg = `✅ <b>تم فهم وتحديث موديولاتك من التسجيل الصوتي بنجاح! 🎓🎙️</b>\n`;
        successMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        successMsg += `🩺 <b>الموديولات الجديدة المعتمدة (${parsedCourses.length}):</b>\n`;
        parsedCourses.forEach(c => {
          successMsg += `• <code>[${c.code}]</code> <b>${c.title}</b>\n`;
        });
        successMsg += `\n✨ تم تطبيق التغييرات فوراً في البوت والـ Web App ومحرك الكويزات الذكي! 🚀`;

        return ctx.reply(successMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎓 إعدادات الفرقة والموديولات', callback_data: 'menu_academic_config' }],
              [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        });
      }

      const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'د. عبدالله' : 'دكتور زميل');
      const userProf = await getUserProfile(fromId);
      const activeCourses = await getUserActiveCourses(fromId);

      const parsedResult = await parseWithGeminiPool(audioBuffer, aiKeys, true, studentName, {
        academicYear: userProf?.academic_year,
        semester: userProf?.semester,
        courses: activeCourses,
        preferences: userProf?.preferences,
        gender: userProf?.gender
      });

      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

      return executeParsedLifeActions(ctx, parsedResult, fromId);

    } catch (err) {

      console.error('Error processing voice message:', err);

      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

      return ctx.reply(`⚠️ <b>تعذر معالجة الفويس:</b> ${err.message}`, { parse_mode: 'HTML' });

    }

  });

  // ⚡ Zero-Token Local Pattern Guard Helper (0 Tokens, 5ms execution)
  function checkLocalPatternGuard(rawText, studentName = 'دكتور') {
    if (!rawText || typeof rawText !== 'string') return null;
    const clean = rawText.trim().replace(/[!؟\.\,\،\s]+/g, ' ').trim().toLowerCase();

    // 1. Bot Guidance & Capabilities Master Query (Matches any question about bot features)
    const guidancePhrases = [
      'هو انت بتعرف تعمل ايه وازاي استفيد منك',
      'هو انت بتعرف تعمل ايه وازاي استفيد منك؟',
      'هو أنت بتعرف تعمل إيه وإزاي أستفيد منك',
      'هو أنت بتعرف تعمل إيه وإزاي أستفيد منك؟',
      'انت بتعرف تعمل ايه وازاي استفيد منك',
      'أنت بتعرف تعمل إيه وإزاي أستفيد منك',
      'انت بتعرف تعمل ايه',
      'أنت بتعرف تعمل إيه',
      'بتعرف تعمل ايه',
      'بتعرف تعمل إيه',
      'بتعمل ايه',
      'بتعمل إيه',
      'ازاي استفيد منك',
      'إزاي أستفيد منك',
      'كيف استفيد منك',
      'اشرحلي البوت',
      'اشرح لي البوت',
      'شرح البوت',
      'ميزات البوت',
      'مميزات البوت',
      'دليل البوت',
      'شرح الميزات',
      'ممكن تعمل ايه',
      'ممكن تعمل إيه',
      'عايز اعرف ميزات البوت',
      'عايز اعرف مميزات البوت'
    ];
    if (guidancePhrases.includes(clean)) {
      return { type: 'guidance', is_guidance: true };
    }

    if (clean.length > 35) return null; // Long texts should be parsed by AI

    // 2. Gratitude
    const gratitudePhrases = ['شكرا', 'شكراً', 'شكرا ليك', 'شكرا جزيلا', 'الف شكر', 'ألف شكر', 'تسلم', 'تسلملي', 'تسلم يا غالي', 'تسلم ايدك', 'جزاك الله خيرا', 'جزاك الله خيراً', 'بارك الله فيك', 'ربنا يخليك', 'ربنا يحفظك', 'مشكور', 'thanks', 'thank you'];
    if (gratitudePhrases.includes(clean)) {
      return {
        type: 'gratitude',
        reply: `العفو يا ${studentName}! 🩺✨\nالشكر لله دائماً، أنا في خدمتك ومتابعة يومك خطوة بخطوة 🚀\n\n💡 <i>تقدر تقولي أي حاجة بصوتك أو كتابة وهفهمها فوراً!</i>`
      };
    }

    // 3. Greetings
    const greetingPhrases = ['السلام عليكم', 'سلام عليكم', 'سلامو عليكم', 'وعليكم السلام', 'صباح الخير', 'صباح الفل', 'صباح النور', 'مساء الخير', 'مساء النور', 'أهلا', 'اهلا', 'يا هلا', 'هاي', 'hello', 'hi', 'مرحبا', 'مرحباً', 'هلا', 'منور'];
    if (greetingPhrases.includes(clean)) {
      return {
        type: 'greeting',
        reply: `يا أهلاً وسهلاً بك يا ${studentName}! 🩺✨\nيومك موفق ومليء بالإنجاز والتركيز إن شاء الله.\n\n👇 <i>تقدر تسجل مذاكرتك، صلواتك، مصاريفك، أو تطلب تنظيم يومك في أي وقت:</i>`,
        buttons: [
          [{ text: '🧭 أعمل إيه دلوقتي؟', callback_data: 'menu_today' }],
          [{ text: '📅 جدول السكاشن', callback_data: 'menu_schedule' }, { text: '🩺 كويزات موادي', callback_data: 'start_user_quiz' }],
          [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
        ]
      };
    }

    // 4. Affirmations / Short Acks
    const ackPhrases = ['تمام', 'حاضر', 'أوك', 'اوك', 'ok', 'عاش', 'موافق', 'ممتاز', 'حلو', 'جميل', 'كويس', 'الحمدلله', 'الحمد لله', 'تمام يا دكتور', 'تمام يا غالي', 'تمام تسلم'];
    if (ackPhrases.includes(clean)) {
      return {
        type: 'ack',
        reply: `دايماً يا رب على خير وتفوق يا ${studentName}! 🌟\nلو خلصت أي جلسة مذاكرة أو صليت أو عندك موعد جديد، ابعتهولي وهسجله فوراً.`
      };
    }

    return null;
  }

  // ==============================================================================
  // ⌨️ 3. Text Messages Handler
  // ==============================================================================

  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;

    const fromId = ctx.from?.id;
    const session = fromId ? await getUserSession(fromId) : null;
    const studentName = ctx.userProfile?.full_name || (Number(fromId) === ADMIN_CHAT_ID ? 'د. عبدالله' : 'دكتور زميل');

    // ⚡ 1. Zero-Token Local Pattern Guard (Instant response without AI tokens)
    if (!session?.state || session.state === 'idle') {
      const localMatch = checkLocalPatternGuard(text, studentName);
      if (localMatch) {
        if (localMatch.is_guidance) {
          const profile = await getUserProfile(fromId);
          const { msg, keyboard } = getMasterBotGuideContent(profile);
          return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
        }
        if (localMatch.buttons) {
          return ctx.reply(localMatch.reply, {
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: localMatch.buttons }
          });
        }
        return ctx.reply(localMatch.reply, { parse_mode: 'HTML' });
      }
    }

    const isEnglishMode = session?.mode === 'english_coach';
    const waitMsg = await ctx.reply('⏳ <i>جاري معالجة طلبك وتوجيهه بدقة...</i>', { parse_mode: 'HTML' });

    try {
      const aiKeys = await getStoredAiKeys();

      // 🏷️ Check if user was waiting to rename themselves
      if (session?.state === 'waiting_new_name') {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        await setUserSession(fromId, { state: 'idle' });

        if (!isValidPersonName(text)) {
          return ctx.reply('⚠️ <b>يرجى كتابة اسم صحيح بدون أرقام أو كلمات أخرى:</b>\nمثال: <code>د. محمد أحمد</code> أو <code>سارة إبراهيم</code>', { parse_mode: 'HTML' });
        }

        const newName = formatDoctorName(text);
        const resolvedGender = detectGenderFromName(newName);

        const { data: existing } = await supabase.from('bot_sessions').select('*').eq('chat_id', fromId).maybeSingle();
        const sessData = existing?.data || {};
        if (!sessData.profile) sessData.profile = { telegram_id: fromId };
        sessData.profile.full_name = newName;
        sessData.profile.gender = resolvedGender;

        await supabase.from('bot_sessions').upsert({
          chat_id: fromId,
          state: 'idle',
          data: sessData,
          updated_at: new Date().toISOString()
        });
        await supabase.from('users').update({ full_name: newName, gender: resolvedGender, updated_at: new Date().toISOString() }).eq('telegram_id', fromId).catch(() => {});

        let successMsg = `✅ <b>تم تحديث اسمك في المنظومة بنجاح! 🩺✨</b>\n`;
        successMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        successMsg += `أهلاً بك يا <b>${newName}</b>! تم اعتماد اسمك الجديد في كل التقارير والكويزات والتذكيرات.`;

        return ctx.reply(successMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 فتح القائمة الرئيسية', callback_data: 'menu_main' }],
              [{ text: '🧭 دليل الأوامر السريعة', callback_data: 'menu_commands_guide' }]
            ]
          }
        });
      }

      // 📅 Check if user was waiting to edit weekly academic schedule
      if (session?.state === 'waiting_edit_schedule') {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        await setUserSession(fromId, { state: 'idle' });

        const userProf = await getUserProfile(fromId);
        const activeCourses = await getUserActiveCourses(fromId);
        const parsed = await parseWithGeminiPool(text, aiKeys, false, studentName, {
          academicYear: userProf?.academic_year,
          semester: userProf?.semester,
          courses: activeCourses,
          preferences: userProf?.preferences,
          gender: userProf?.gender
        });

        const items = (Array.isArray(parsed.schedule_items) && parsed.schedule_items.length > 0)
          ? parsed.schedule_items
          : (Array.isArray(parsed.data?.academic_schedule) ? parsed.data.academic_schedule : []);

        if (items.length > 0) {
          for (const sch of items) {
            await supabase.from('academic_schedule').insert({
              course_code: sch.course_code || 'سيكشن',
              title: sch.title || 'سيكشن جامعي',
              day_of_week: sch.day_of_week || 'الأحد',
              start_time: sch.start_time || '09:00',
              end_time: sch.end_time || '11:00',
              location: sch.location || null,
              type: `[usr:${fromId}] سيكشن أسبوعي`
            }).catch(() => {});
          }

          let successMsg = `✅ <b>تم حفظ وتثبيت جدول سكاشنك بنجاح! 📅✨</b>\n`;
          successMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
          items.forEach(s => {
            successMsg += `• <b>${s.title}</b> [${s.course_code || 'MOD'}]: كل يوم ${s.day_of_week} الساعة ${s.start_time}${s.location ? ` (📍 ${s.location})` : ''}\n`;
          });
          successMsg += `\n⏰ <i>سيقوم البوت بتذكيرك تلقائياً قبل كل سيكشن بساعة كاملة!</i>`;

          return ctx.reply(successMsg, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📅 عرض جدول السكاشن الأسبوعي', callback_data: 'menu_schedule' }],
                [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
              ]
            }
          });
        }
      }

      // 🎓 Check if user was waiting to edit full modules list
      if (session?.state === 'waiting_edit_modules') {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        await setUserSession(fromId, { state: 'idle' });

        const parsedCourses = await parseModulesListWithAi(text, aiKeys, false);
        await updateUserAcademicProfile(fromId, { customCourses: parsedCourses });

        let successMsg = `✅ <b>تم تحديث وحفظ موديولاتك بنجاح! 🎓</b>\n`;
        successMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        successMsg += `🩺 <b>الموديولات الجديدة المعتمدة (${parsedCourses.length}):</b>\n`;
        parsedCourses.forEach(c => {
          successMsg += `• <code>[${c.code}]</code> <b>${c.title}</b>\n`;
        });
        successMsg += `\n✨ تم تطبيق التغييرات فوراً في البوت والـ Web App ومحرك الكويزات الذكي! 🚀`;

        return ctx.reply(successMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎓 إعدادات الفرقة والموديولات', callback_data: 'menu_academic_config' }],
              [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        });
      }

      // 🎓 Check if user was waiting to add a custom course
      if (session?.state === 'waiting_custom_course') {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        await setUserSession(fromId, { state: 'idle' });

        const parsedCourses = await parseModulesListWithAi(text, aiKeys, false);
        const currentActive = await getUserActiveCourses(fromId);
        const updatedCustom = [...currentActive, ...parsedCourses];

        await updateUserAcademicProfile(fromId, { customCourses: updatedCustom });

        const added = parsedCourses[0] || { code: 'MOD', title: text };
        let successMsg = `✅ <b>تمت إضافة الموديول الجديد بنجاح! 🎓</b>\n`;
        successMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        successMsg += `🩺 <b>الكود:</b> <code>${added.code}</code>\n`;
        successMsg += `📚 <b>الموديول:</b> <b>${added.title}</b>\n\n`;
        successMsg += `سيقوم الذكاء الاصطناعي الآن بتصنيف أي أسئلة أو مذاكرة تذكر هذا الموديول تلقائياً! ⚡`;

        return ctx.reply(successMsg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎓 عرض الموديولات النشطة', callback_data: 'menu_academic_config' }],
              [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        });
      }

      // 🧭 Check if user asks "اعمل ايه دلوقتي" / "انا تايه" / "خطة اليوم"
      const whatNowRegex = /(?:اعمل\s+ايه|أعمل\s+إيه|اعمل\s+إيه|أعمل\s+ايه|انا\s+تايه|أنا\s+تايه|تايه|مش\s+عارف\s+أذاكر|مش\s+عارف\s+اذاكر|مش\s+عارف\s+أبدأ|مش\s+عارف\s+ابدا|قولي\s+أعمل\s+إيه|قولي\s+اعمل\s+ايه|خطة\s+النهاردة|خطة\s+اليوم|وجهني|توجيه|what\s+should\s+i\s+do|what\s+to\s+do)/i;
      if (whatNowRegex.test(text)) {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        return handleWhatToDoNow(ctx);
      }

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
      const userProf = await getUserProfile(fromId);
      const activeCourses = await getUserActiveCourses(fromId);

      let textToParse = text;
      if (session?.state === 'awaiting_clarification' && session?.pending_clarification) {
        textToParse = `${session.pending_clarification.original_text} - (توضيح وتفاصيل من الطالب): ${text}`;
        await setUserSession(fromId, { state: 'idle', pending_clarification: null });
      }

      const parsedResult = await parseWithGeminiPool(textToParse, aiKeys, false, studentName, {
        academicYear: userProf?.academic_year,
        semester: userProf?.semester,
        courses: activeCourses,
        preferences: userProf?.preferences,
        gender: userProf?.gender
      });

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

    // 📚 1. PDF / Document Guardrails & Super-Extractor
    if (document) {
      const isPdf = document.mime_type === 'application/pdf' || document.file_name?.toLowerCase().endsWith('.pdf');
      const fileSizeMb = (document.file_size || 0) / (1024 * 1024);

      if (isPdf && fileSizeMb > 20) {
        let msg = `📚 <b>حجم الملف كبير جداً يا دكتور (${fileSizeMb.toFixed(1)} ميجابايت)!</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `✨ منظومتنا تدعم استيعاب ملفات ومذكرات الامتحانات حتى <b>20 ميجابايت</b> لاستخراج كبسولات الامتحانات، بنك الـ MCQs، ومصطلحات الـ USMLE.\n\n`;
        msg += `💡 <i>للملفات الأكبر، يمكنك رفعها عبر بوابة الأدمن في لوحة التحكم أو تقسيمها.</i>`;
        return ctx.reply(msg, { parse_mode: 'HTML' });
      }

      if (!document.mime_type?.startsWith('image/') && !isPdf) {
        return ctx.reply('⚠️ عذراً يا دكتور، المنظومة تقبل الرسائل الصوتية، الشات، صور الجداول والإيصالات، وملفات مذكرات الـ PDF.', { parse_mode: 'HTML' });
      }
    }

    let fileId = null;
    if (photos && photos.length > 0) fileId = photos[photos.length - 1].file_id;
    else if (document && (document.mime_type?.startsWith('image/') || document.mime_type === 'application/pdf')) fileId = document.file_id;
    else return;

    const isPdfDoc = document && (document.mime_type === 'application/pdf' || document.file_name?.toLowerCase().endsWith('.pdf'));
    const waitMsg = await ctx.reply(isPdfDoc 
      ? '📑 <i>جاري فحص واستخراج بنك الامتحانات والكبسولات والمصطلحات من الـ PDF بالذكاء الاصطناعي الفائق... ⏳</i>' 
      : '📸 <i>جاري فحص وتلخيص الصورة بالذكاء الاصطناعي (Gemini Vision)...</i>', 
      { parse_mode: 'HTML' }
    );

    try {

      const fileLink = await ctx.telegram.getFileLink(fileId);

      const photoBuffer = await downloadFileBuffer(fileLink.href);

      const aiKeys = await getStoredAiKeys();

      const analysis = await analyzeImageWithGemini(photoBuffer, aiKeys, caption);

      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});

      // 📚 0. Full Academic PDF Extraction Pipeline (MCQs, Terms, High-Yield Pearls, OSCE)
      if (isPdfDoc || analysis.high_yield_summary || analysis.mcqs_extracted) {
        const courseCode = analysis.course_code || caption.match(/\[?([A-Z]{3,4}\s*\d{3}|PED|CAD|RSD|HVD|SURG|IMED|PATH|PHAR)\]?/i)?.[1] || 'MED';
        const docName = document?.file_name || 'ملف مذكرات الموديول';
        
        let mcqsCount = 0;
        let termsCount = 0;

        // 1. Insert MCQs into Spaced Repetition Bank
        if (Array.isArray(analysis.mcqs_extracted) && analysis.mcqs_extracted.length > 0) {
          for (const q of analysis.mcqs_extracted) {
            if (q.question) {
              await saveUserMedicalQuiz(fromId, {
                courseCode: courseCode,
                topic: analysis.topic_title || docName,
                question: q.question,
                answerAndExplanation: q.explanation || q.answer_and_explanation || 'الإجابة والشرح الإكلينيكي',
                doctorPearl: q.doctor_pearl || null
              });
              mcqsCount++;
            }
          }
        }

        // 2. Insert English Terms into Flashcards
        if (Array.isArray(analysis.english_terms) && analysis.english_terms.length > 0) {
          for (const term of analysis.english_terms) {
            if (term.term) {
              await supabase.from('english_spaced_flashcards').insert({
                term_or_sentence: term.term,
                egyptian_translation: term.egyptian_translation || 'مصطلح طبي',
                example_sentence: term.context || null,
                usage_context: 'طبي سريري',
                repetition_level: 0,
                next_review_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
              }).catch(() => {});
              termsCount++;
            }
          }
        }

        // 3. Save to Academic PDF Vault
        await saveAcademicPdfMastery({
          course_code: courseCode,
          file_name: docName,
          topic_title: analysis.topic_title || 'مذكرة أكاديمية',
          high_yield_summary: analysis.high_yield_summary || [],
          mcqs_extracted: analysis.mcqs_extracted || [],
          english_terms: analysis.english_terms || [],
          osce_pearls: analysis.osce_pearls || [],
          file_size_mb: document?.file_size ? (document.file_size / (1024 * 1024)).toFixed(1) : 1
        });

        await addDoctorXp(fromId, 100, 'pdf_master');

        let msg = `📑 <b>تم تفكيك الـ PDF واستخراج بنك الدرجات النهائية بنجاح! 🎯🏆</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📚 <b>الموديول:</b> [${courseCode}] ${analysis.topic_title || docName}\n\n`;

        if (Array.isArray(analysis.high_yield_summary) && analysis.high_yield_summary.length > 0) {
          msg += `🌟 <b>أهم كبسولات ليلة الامتحان (High-Yield):</b>\n`;
          analysis.high_yield_summary.slice(0, 3).forEach(p => {
            msg += `• <b>${p.point || p.title || 'نقطة هامة'}</b>: ${p.explanation || p.details || ''}\n`;
            if (p.exam_trap) msg += `  └ ⚠️ <i>فخ الامتحان:</i> ${p.exam_trap}\n`;
          });
          msg += `\n`;
        }

        msg += `📊 <b>المخرجات التفاعلية المضافة لمنظومتك:</b>\n`;
        msg += `• ❓ <b>${mcqsCount} أسئلة MCQs</b> تمت إضافتها للتكرار المتباعد 🎯\n`;
        msg += `• 🗣️ <b>${termsCount} مصطلحات إنجليزية</b> أُضيفت للفلاش كاردز 🌟\n`;
        msg += `• 🏆 <b>+100 نقطة خبرة (XP)</b> أُضيفت لرتبتك الطبية!\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `⏳ <i>جميع الأسئلة مجدولة للمراجعة السريعة ومتاحة على لوحة التحكم الآن!</i>`;

        return ctx.reply(msg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🩺 ابدأ حل كويزات هذا الملف', callback_data: 'start_user_quiz' }],
              [{ text: '🗣️ فلاش كاردز المصطلحات', callback_data: 'menu_eng_spaced' }],
              [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        });
      }

      // 🩺 1. Auto-detected Medical MCQ / Clinical Case
      if (analysis.detected_type === 'medical_quiz' || (analysis.medical_quiz && analysis.medical_quiz.question)) {
        const q = analysis.medical_quiz;

        await saveUserMedicalQuiz(fromId, {
          courseCode: q.course_code || 'MED',
          topic: q.topic || 'سؤال من السلايدات والماتريال',
          question: q.question,
          answerAndExplanation: q.answer_and_explanation || 'الشرح المستخرج من الصورة',
          doctorPearl: q.doctor_pearl || null
        });

        let msg = `🩺 <b>تم استخراج السؤال الطبي وحفظه في بنك كويزاتك بنجاح! 🎯</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📚 <b>الموديول:</b> [${q.course_code || 'MED'}] ${q.topic || ''}\n\n`;
        msg += `❓ <b>السؤال:</b>\n${q.question}\n\n`;
        msg += `💡 <b>الإجابة والشرح:</b>\n${q.answer_and_explanation}\n`;
        if (q.doctor_pearl) msg += `\n🔬 💡 <b>تريكة الراوند:</b> ${q.doctor_pearl}\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n⏳ <i>تم حفظ السؤال في بنك كويزاتك الشخصي وجدولته للتكرار المتباعد بعد 12 ساعة!</i>`;

        return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🩺 بنك كويزاتي المرفوعة', callback_data: 'menu_med_spaced' }]] } });
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

      // 📅 3. Auto-detected Academic Timetable / Group Schedule
      if (analysis.detected_type === 'academic_schedule' || (Array.isArray(analysis.schedule_items) && analysis.schedule_items.length > 0)) {
        const items = analysis.schedule_items || [];
        const groupName = analysis.group_matched || (caption.match(/(جروب|group|سكشن)\s*([A-Za-z0-9]+)/i) || [])[0] || 'جروبك';

        let insertedCount = 0;
        for (const item of items) {
          try {
            await supabase.from('academic_schedule').insert({
              course_code: item.course_code || 'CAD402',
              title: item.title || 'سيكشن / محاضرة',
              day_of_week: item.day_of_week || 'Sunday',
              start_time: item.start_time || '09:00',
              end_time: item.end_time || '11:00',
              location: item.location || 'الكلية / المستشفى',
              type: item.type || 'clinical_round',
              reminder_mins_before: 30,
              is_active: true
            });
            insertedCount++;
          } catch (e) {}
        }

        let msg = `📅 <b>تم استخراج واعتماد جدول السكاشن والمحاضرات لـ (${groupName}) بنجاح! 🩺✨</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📌 <b>تم تسجيل ${insertedCount} مواعيد ومحاضرات أسبوعية في جدولك الأكاديمي.</b>\n\n`;
        msg += `📋 <b>أبرز المواعيد والموضوعات المعتمدة:</b>\n`;
        items.slice(0, 5).forEach(it => {
          msg += `• <b>${it.day_of_week}:</b> [${it.course_code || 'MED'}] ${it.title} (⏰ ${it.start_time} - ${it.end_time} | 📍 ${it.location || 'المستشفى'})\n`;
        });
        msg += `\n🧠 <b>خطة المذاكرة والتحضير الاستباقية:</b>\n`;
        msg += `✨ سيقوم البوت بإشعارك صباح كل يوم بما عليك حضوره، ويرتب لك جلسات المذاكرة والكويزات التفاعلية لنفس موضوعات اليوم بعد عودتك مباشرة! 🚀`;

        return ctx.reply(msg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📅 فتح جدول السكاشن بالكامل', callback_data: 'menu_schedule_view' }],
              [{ text: '🧭 اعمل ايه دلوقتي؟', callback_data: 'what_to_do_now' }]
            ]
          }
        });
      }

      // 📋 4. General Medical Document / Slide Note
      let generalMsg = `📋 <b>${analysis.summary_title || 'تحليل وتلخيص المستند / السلايد الطبي'}:</b>\n━━━━━━━━━━━━━━━━━━━━━\n\n${analysis.general_summary || JSON.stringify(analysis)}`;
      return ctx.reply(generalMsg, { parse_mode: 'HTML' });

    } catch (err) {
      await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
      return ctx.reply(`❌ فشل تحليل الصورة: ${err.message}`);
    }

  });

  // ==============================================================================
  // 🎯 4.1 Native Telegram Quiz Poll Answer Listener & XP Engine
  // ==============================================================================

  bot.on('poll_answer', async (ctx) => {
    try {
      const pollAnswer = ctx.pollAnswer;
      if (!pollAnswer || !pollAnswer.poll_id || !Array.isArray(pollAnswer.option_ids) || pollAnswer.option_ids.length === 0) return;

      const pollId = pollAnswer.poll_id;
      const selectedIndex = pollAnswer.option_ids[0];
      const fromId = pollAnswer.user?.id || ADMIN_CHAT_ID;

      const result = await processStudentPollAnswer(pollId, selectedIndex, fromId);
      if (!result) return;

      if (result.isCorrect) {
        let msg = `🎉 <b>إجابة ممتازة وصحيحة يا دكتور! 🩺✨ (+30 Doctor XP)</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `🏆 <b>تمت ترقية السؤال إلى المرحلة:</b> ${result.nextLevel}/6 في نظام التكرار المتباعد.\n`;
        msg += `⏰ <b>المراجعة القادمة:</b> ${new Date(result.nextDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}\n`;
        if (result.quiz?.explanation) {
          msg += `\n💡 <b>تريكة الراوند والشرح من الـ PDF:</b>\n<i>${result.quiz.explanation}</i>`;
        }
        await bot.telegram.sendMessage(fromId, msg, { parse_mode: 'HTML' }).catch(() => {});
      } else {
        let msg = `⚠️ <b>إجابة غير دقيقة يا دكتور.. لا بأس! 🩺</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `📌 تم تثبيت هذا السؤال في قائمة المراجعة العاجلة لترسيخه في ذاكرتك.\n`;
        if (result.quiz?.explanation) {
          msg += `\n💡 <b>الشرح وتصحيح المفهوم من مذكرة الموديول:</b>\n<i>${result.quiz.explanation}</i>`;
        }
        await bot.telegram.sendMessage(fromId, msg, { parse_mode: 'HTML' }).catch(() => {});
      }
    } catch (e) {
      console.warn('poll_answer handler warn:', e.message);
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

    // ❓ Check for Missing Mandatory Information & Clarification Follow-up
    if (result.needs_clarification || result.data?.needs_clarification) {
      const question = result.data?.clarification_question || result.clarification_question || result.summary_text || 'يرجى توضيح التفاصيل الناقصة يا دكتور لنتمكن من توثيقها بدقة!';
      if (fromId) {
        const userSess = await getUserSession(fromId);
        const origText = ctx.message?.text || ctx.message?.caption || 'تسجيل صوتي سابق';
        await setUserSession(fromId, {
          ...(userSess || {}),
          state: 'awaiting_clarification',
          pending_clarification: {
            type: result.data?.clarification_type || result.clarification_type || 'general',
            original_text: origText,
            timestamp: Date.now()
          }
        });
      }
      return ctx.reply(question, { parse_mode: 'HTML' });
    }

    // 🧭 1. What To Do Now Intent
    if (result.detected_type === 'what_to_do_now' || result.data?.detected_type === 'what_to_do_now' || result.data?.is_what_to_do_now) {
      return handleWhatToDoNow(ctx);
    }

    // 📅 2. Schedule Management Intent
    if (result.detected_type === 'schedule_management') {
      const items = (Array.isArray(result.schedule_items) && result.schedule_items.length > 0)
        ? result.schedule_items
        : (Array.isArray(result.data?.academic_schedule) ? result.data.academic_schedule : []);

      if (items.length > 0) {
        for (const sch of items) {
          await supabase.from('academic_schedule').insert({
            course_code: sch.course_code || 'سيكشن',
            title: sch.title || 'سيكشن جامعي',
            day_of_week: sch.day_of_week || 'الأحد',
            start_time: sch.start_time || '09:00',
            end_time: sch.end_time || '11:00',
            location: sch.location || null,
            type: `[usr:${fromId}] سيكشن أسبوعي`
          }).catch(() => {});
        }

        let msg = `📅 <b>تم تثبيت السكاشن في جدولك الأسبوعي بنجاح! ✨</b>\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
        items.forEach(s => {
          msg += `• <b>${s.title}</b> [${s.course_code || 'MOD'}]: كل يوم ${s.day_of_week} الساعة ${s.start_time}${s.location ? ` (📍 ${s.location})` : ''}\n`;
        });
        msg += `\n⏰ <i>سيقوم البوت بتذكيرك تلقائياً قبل كل سيكشن بساعة كاملة!</i>`;
        if (result.feature_tip) msg += `\n\n${result.feature_tip}`;

        return ctx.reply(msg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📅 عرض جدول السكاشن الأسبوعي', callback_data: 'menu_schedule' }],
              [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        });
      }

      if (fromId) await setUserSession(fromId, { state: 'waiting_edit_schedule' });
      let reply = result.conversational_reply || `من عيوني يا دكتور! 📅 قولي السكاشن اللي عندك ومواعيدها كل يوم إيه (أو ابعتلي جدولك في فويس واحد) وهثبته وأفكرك بيه قبل كل سيكشن بساعة!`;
      if (result.feature_tip) reply += `\n\n${result.feature_tip}`;

      return ctx.reply(reply, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 عرض جدول السكاشن الحالي', callback_data: 'menu_schedule' }],
            [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
          ]
        }
      });
    }

    // 🎓 3. Modules Management Intent
    if (result.detected_type === 'modules_management') {
      if (fromId) await setUserSession(fromId, { state: 'waiting_edit_modules' });
      let reply = result.conversational_reply || `من عيوني يا دكتور! 🩺 ابعتلي قائمة الموديولات أو المواد الجديدة (بفويس أو كتابة) وهحدثهالك في حسابك والـ Web App فوراً!`;
      if (result.feature_tip) reply += `\n\n${result.feature_tip}`;

      return ctx.reply(reply, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎓 إعدادات الفرقة والموديولات', callback_data: 'menu_academic_config' }],
            [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
          ]
        }
      });
    }

    // ⏰ 4. Recurring Reminder Intent
    if (result.detected_type === 'recurring_reminder' && result.recurring_reminder) {
      const rem = result.recurring_reminder;
      const timeStr = rem.time_24h || '10:00';
      const dayStr = rem.day_of_week || 'الجمعة';
      await supabase.from('academic_schedule').insert({
        course_code: 'REM',
        title: rem.title || 'تذكير دوري',
        day_of_week: dayStr,
        start_time: timeStr,
        end_time: timeStr,
        location: 'تذكير دوري',
        type: `[usr:${fromId}] تذكير أسبوعي متكرر`
      }).catch(() => {});

      let msg = `⏰ <b>تم تثبيت التذكير الدوري بنجاح! 🔔✨</b>\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `📌 <b>الموضوع:</b> ${rem.title || 'تذكير دوري'}\n`;
      msg += `📅 <b>الموعد:</b> كل يوم ${dayStr} الساعة ${timeStr}\n\n`;
      msg += `✨ <i>سأقوم بإرسال إشعار وتذكير لك في هذا الموعد أسبوعياً بانتظام!</i>`;
      if (result.feature_tip) msg += `\n\n${result.feature_tip}`;

      return ctx.reply(msg, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 عرض المهام والمواعيد', callback_data: 'menu_tasks' }],
            [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
          ]
        }
      });
    }

    // 💡 5. Bot Guidance & Capabilities Intent
    if (result.detected_type === 'bot_guidance') {
      const profile = await getUserProfile(fromId);
      const { msg, keyboard } = getMasterBotGuideContent(profile);
      return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
    }

    // 🧠 5.1 Weekly Psychological & Mental Pattern Report
    if (result.detected_type === 'weekly_mental_report') {
      const waitMsg = await ctx.reply('🧠 <i>جاري تحليل نمط مشاعرك وضغوط الأسبوع وتوليد تقرير الاستشفاء الذهني...</i>', { parse_mode: 'HTML' });
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
        const { data: mentalLogs } = await supabase.from('mental_wellness_logs').select('*').gte('date', sevenDaysAgo).order('date', { ascending: true });
        const userLogs = (mentalLogs || []).filter(l => !l.venting_content?.includes('usr:') ? Number(fromId) === ADMIN_CHAT_ID : l.venting_content.includes(`usr:${fromId}`));
        const aiKeys = await getStoredAiKeys();
        const studentName = ctx.userProfile?.full_name || 'دكتور';
        const report = await generateWeeklyPsychologicalReport(userLogs, aiKeys, studentName);
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        return ctx.reply(report, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🧠 فضفضة وتفريغ جديد', callback_data: 'menu_wellness' }],
              [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
            ]
          }
        });
      } catch (err) {
        await ctx.deleteMessage(waitMsg.message_id).catch(() => {});
        return ctx.reply(`⚠️ <b>تعذر توليد التقرير:</b> ${err.message}`, { parse_mode: 'HTML' });
      }
    }

    // 💬 6. Casual Conversation / Chat Intent
    if (result.detected_type === 'conversational_chat') {
      let reply = result.conversational_reply || result.summary_text || `أهلاً بك يا دكتور! أنا هنا لمساعدتك في كل تفاصيل يومك ومذاكرتك.`;
      if (result.feature_tip) reply += `\n\n${result.feature_tip}`;

      return ctx.reply(reply, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧭 أعمل إيه دلوقتي؟', callback_data: 'menu_today' }],
            [{ text: '📅 جدول السكاشن', callback_data: 'menu_schedule' }, { text: '🩺 كويزات موادي', callback_data: 'start_user_quiz' }],
            [{ text: '⚙️ تخصيص الأقسام والاهتمامات', callback_data: 'menu_settings' }],
            [{ text: '🚀 فتح القائمة الرئيسية', callback_data: 'menu_main' }]
          ]
        }
      });
    }

    const { data } = result;

    const todayDate = data.date || getCairoToday();

    const insertedSummary = [];

    const recordedUndoItems = [];

    const financeReversions = [];

    const financeItems = [];

    const undoActionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const keyboardRows = [];
    let todayStudyTotalMinutes = 0;

    // 🛡️ 0. Admin Purity & Dopamine Recovery Protocol (سوسو & بوبو) - [Admin ONLY]
    if (Number(fromId) === ADMIN_CHAT_ID && data.purity_log) {
      const p = data.purity_log;
      const type = p.type || 'soso';
      const typeLabel = type === 'both' ? 'سوسو وبوبو' : (type === 'bobo' ? 'بوبو' : 'سوسو');

      if (p.is_relapse) {
        const res = await logAdminPurityRelapse(fromId, {
          type,
          trigger: p.trigger || 'غير محدد',
          notes: p.notes || ''
        });

        insertedSummary.push(
          `🛡️ <b>بروتوكول قلعة السيادة والتعافي (متابعة ${typeLabel}):</b>\n` +
          `   ├ ⏱️ <b>فترة الصمود السابقة:</b> ${type === 'both' ? `سوسو (${res?.sosoStreakBefore || 0} يوم) | بوبو (${res?.boboStreakBefore || 0} يوم)` : `${res?.sosoStreakBefore || res?.boboStreakBefore || 0} أيام`}\n` +
          `   ├ 🔍 <b>المحفز المرصود:</b> ${p.trigger || 'سهر / فراغ'}\n` +
          `   └ 🚀 <b>خطة الاستشفاء الفوري (3-Step Bio-Reset):</b>\n` +
          `      1️⃣ اغسل وجهك بماء بارد فوراً وتوضأ وصلي ركعتين.\n` +
          `      2️⃣ غادر السرير والغرفة، والعب 20 عدة ضغط.\n` +
          `      3️⃣ التعثر لا يعني الهزيمة.. جولة جديدة وشعلة جديدة تبدأ الآن يا دكتور!`
        );

        keyboardRows.push([
          { text: '🔥 فحص شعلة النقاء والتعافي', callback_data: 'purity_check_streak' },
          { text: '🆘 بروتوكول ركوب الموجة (Urge Surfing)', callback_data: 'launch_urge_surfing' }
        ]);
      } else if (p.is_urge) {
        insertedSummary.push(
          `🆘 <b>تنبيه اشتهاء حاد (موجة ${typeLabel})!</b>\n` +
          `   ├ 🧠 <b>التفسير العلمي:</b> موجة الدوبامين تستمر في ذروتها من 3 إلى 5 دقائق ثم تنكسر بيولوجياً.\n` +
          `   └ 🛡️ <b>خطوتك الآن:</b> اترك الموبايل، تنفس بعمق (4-7-8)، وغير مكانك فوراً!`
        );

        keyboardRows.push([
          { text: '🛡️ انتصرت على الرغبة وكسرت الموجة (+50 XP)', callback_data: 'resisted_urge_ack' },
          { text: '🌊 إرشادات ركوب الموجة (Urge Surfing)', callback_data: 'launch_urge_surfing' }
        ]);
      } else if (p.is_resisted) {
        const count = await logAdminUrgeResisted(fromId);
        insertedSummary.push(
          `👑 <b>بطل يا دكتور! انتصار عظيم على الشهوة وصد هجمة (${typeLabel})! 🛡️</b>\n` +
          `   ├ 🏆 <b>إجمالي مرات الانتصار وصد الرغبة:</b> ${count} مرات\n` +
          `   └ ⭐ <b>مكافأة الانضباط:</b> +50 Doctor XP!`
        );
      }
    }

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

    // 4.1 Academic Schedule (Weekly Sections / Rounds)
    if (Array.isArray(data.academic_schedule) && data.academic_schedule.length > 0) {
      for (const sch of data.academic_schedule) {
        try {
          if (sch.course_code || sch.title) {
            const { data: row } = await supabase.from('academic_schedule').insert({
              course_code: sch.course_code || 'CAD402',
              title: sch.title || 'سيكشن عملي',
              day_of_week: sch.day_of_week || 'الأحد',
              start_time: sch.start_time || '09:00',
              end_time: sch.end_time || '11:00',
              location: sch.location || 'الكلية / المستشفى',
              type: sch.type || 'سيكشن عملي',
              reminder_mins_before: Number(sch.reminder_mins_before || 60),
              telegram_id: Number(fromId || 1191760477),
              is_active: true
            }).select('id').maybeSingle();

            if (row?.id) {
              recordedUndoItems.push({ table: 'academic_schedule', id: row.id, summary: `📅 سيكشن [${sch.course_code || 'أكاديمي'}]` });
            }

            insertedSummary.push(`📅 <b>جدول السكاشن [${sch.course_code || 'سيكشن'}]:</b> <b>${sch.title || 'سيكشن'}</b>\n   └ ⏰ <b>الموعد:</b> كل يوم ${sch.day_of_week || 'أحد'} الساعة ${sch.start_time || '09:00'}${sch.location ? ` (${sch.location})` : ''}`);
          }
        } catch (e) {
          console.warn('academic_schedule insert error:', e.message);
        }
      }
    }

    // 4.2 Academic Study Sessions
    if (Array.isArray(data.academic_study) && data.academic_study.length > 0) {
      for (const s of data.academic_study) {
        try {
          const courseCode = s.course_code || 'CAD402';
          const rawTopic = s.topic || 'مذاكرة';
          const durText = s.duration_minutes ? `${s.duration_minutes} دقيقة` : 'غير محدد';
          
          const { data: row } = await supabase.from('study_sessions').insert({
            course_code: courseCode,
            topic: rawTopic,
            duration_minutes: s.duration_minutes || 0,
            pages_covered: s.pages_covered || null,
            comprehension_rating: s.comprehension_rating || null,
            date: todayDate,
            telegram_id: fromId
          }).select('id').maybeSingle();

          if (row?.id) {
            recordedUndoItems.push({ table: 'study_sessions', id: row.id, summary: `🩺 مذاكرة [${courseCode}] ${rawTopic} (${durText})` });
          }

          const pageText = s.pages_covered ? ` | 📄 <b>${s.pages_covered} صفحة</b>` : '';
          const ratingText = s.comprehension_rating ? ` | 🧠 استيعاب: ${'⭐'.repeat(s.comprehension_rating)}` : '';

          // 🧠 Academic Spaced Repetition (SRS) Engine & Conflict-Free Scheduling
          const srsResult = await logAcademicStudySrs(fromId, s);
          await addDoctorXp(fromId, 25);

          let pdfStatusText = '';
          if (srsResult.matchingPdf) {
            pdfStatusText = `\n   ├ 📚 <b>المذكرات المرفوعة:</b> متطابقة مع [${srsResult.matchingPdf.file_name}] — الكويزات تُستخرج منها حصراً 🎯`;
            keyboardRows.push([
              { text: `🎯 حل كويز تفاعلي الآن من الـ PDF [${courseCode}]`, callback_data: `launch_pdf_quiz_${srsResult.matchingPdf.id}_${s.pages_covered || ''}` }
            ]);
          } else {
            pdfStatusText = `\n   ├ 💡 <b>تريكة:</b> يمكنك رفع PDF الموديول لإنشاء كويزات MCQs تفاعلية من نفس الصفحات فوراً!`;
          }

          if (s.was_rescheduled) {
            insertedSummary.push(`🔄 <b>إعادة جدولة مذاكرة [${courseCode}]:</b> ${rawTopic}\n   └ ⏱️ <b>المدة:</b> <b>${durText}</b>${s.reschedule_reason ? ` (السبب: ${s.reschedule_reason})` : ''}`);
          } else {
            insertedSummary.push(
              `🩺 <b>جلسة تحصيل ومذاكرة [${courseCode}]:</b> <b>${rawTopic}</b>\n` +
              `   ├ ⏱️ <b>المدة:</b> <b>${durText}</b>${pageText}${ratingText}\n` +
              `   ├ 🧠 <b>منحنى التثبيت (SRS):</b> ${srsResult.stageTitle} (إتقان: ${srsResult.masteryPct}%)${pdfStatusText}\n` +
              `   └ ⏰ <b>موعد المراجعة القادمة:</b> ${srsResult.nextDateStr} الساعة <b>${srsResult.nextSlotStr}</b> <i>(وقت خالٍ من التعارضات)</i>`
            );
          }
        } catch (e) {
          console.warn('academic_study insert error:', e.message);
        }
      }
    }

    // 5. Mental Wellness
    if (data.mental_wellness && (data.mental_wellness.raw_dump || data.mental_wellness.venting_content || data.mental_wellness.content || data.mental_wellness.emotion_tags?.length > 0)) {
      const w = data.mental_wellness;
      try {
        const rawVenting = w.venting_content || w.raw_dump || w.content || 'فضفضة مسجلة بالصوت';
        const { data: row } = await supabase.from('mental_wellness_logs').insert({
          venting_content: `[usr:${fromId}] ${rawVenting}`.trim(),
          stress_level: String(w.stress_level || 3),
          mood_rating: Number(w.mood_rating || 5),
          energy_rating: Number(w.energy_rating || w.focus_clarity || 5),
          emotional_state: Array.isArray(w.emotion_tags) ? w.emotion_tags.join('، ') : (w.emotional_state || null),
          ai_therapeutic_feedback: w.ai_therapeutic_feedback ? `[usr:${fromId}] ${w.ai_therapeutic_feedback}` : null,
          date: todayDate
        }).select('id').maybeSingle();

        if (row?.id) {
          recordedUndoItems.push({ table: 'mental_wellness_logs', id: row.id, summary: `🧠 فضفضة واتزان نفسي` });
        }

        insertedSummary.push(`🧠 <b>فضفضة واتزان نفسي:</b> تم حفظ المشاعر والتحليل الذكي\n   └ 🧘 <b>مستوى الصفاء:</b> ${w.focus_clarity || 4}/5 | ⚡ <b>التوتر:</b> ${w.stress_level || 3}/5`);
      } catch (e) {
        console.warn('mental_wellness insert error:', e.message);
      }
    }

    // 6. Fasting & Sunnah / Worship
    let previousFastingSnapshot = null;
    let sunanLoggedFromFasting = false;

    // Parse incoming Sunan rak'ahs once for this request
    let incomingSunanRakats = 0;
    const rawSunan = (data.prayer_habits?.sunan_rawatib != null) 
      ? data.prayer_habits.sunan_rawatib 
      : (data.fasting_worship?.sunan_rawatib_count != null ? data.fasting_worship.sunan_rawatib_count : null);

    if (rawSunan != null) {
      if (typeof rawSunan === 'number') {
        incomingSunanRakats = isNaN(rawSunan) ? 0 : Math.max(0, rawSunan);
      } else if (typeof rawSunan === 'string') {
        const s = rawSunan.toLowerCase();
        if (s.includes('6') || s.includes('ست')) incomingSunanRakats = 6;
        else if (s.includes('4') || s.includes('أربع') || s.includes('اربع')) incomingSunanRakats = 4;
        else if (s.includes('2') || s.includes('ركعتين') || s.includes('سنة') || s.includes('الفجر') || s.includes('المغرب') || s.includes('العشاء')) incomingSunanRakats = 2;
        else {
          const m = s.match(/\d+/);
          incomingSunanRakats = m ? parseInt(m[0], 10) : 2;
        }
      }
    }

    if (data.fasting_worship && (data.fasting_worship.fasting_type || data.fasting_worship.sunan_rawatib_count != null || data.fasting_worship.adhkar_morning || data.fasting_worship.adhkar_evening || data.fasting_worship.duha_prayer_done != null || data.fasting_worship.duha != null || data.fasting_worship.witr_prayer_done != null || data.fasting_worship.witr != null)) {
      const fw = data.fasting_worship;
      try {
        const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', todayDate).maybeSingle();
        previousFastingSnapshot = existing ? { ...existing } : null;

        const isDuha = fw.duha_prayer_done != null ? Boolean(fw.duha_prayer_done) : (fw.duha != null ? Boolean(fw.duha) : (existing?.duha_prayer_done || false));
        const isWitr = fw.witr_prayer_done != null ? Boolean(fw.witr_prayer_done) : (fw.witr != null ? Boolean(fw.witr) : (existing?.witr_prayer_done || false));

        let currentSunan = Number(existing?.sunan_rawatib_count || 0);
        let totalSunan = currentSunan;
        if (incomingSunanRakats > 0) {
          totalSunan = Math.min(12, currentSunan + incomingSunanRakats);
          sunanLoggedFromFasting = true;
        }

        const payload = {
          date: todayDate,
          fasting_type: fw.fasting_type || existing?.fasting_type || null,
          fasting_completed: fw.fasting_completed != null ? fw.fasting_completed : (existing?.fasting_completed || false),
          sunan_rawatib_count: totalSunan,
          duha_prayer_done: isDuha,
          witr_prayer_done: isWitr,
          adhkar_morning: fw.adhkar_morning != null ? fw.adhkar_morning : (existing?.adhkar_morning || false),
          adhkar_evening: fw.adhkar_evening != null ? fw.adhkar_evening : (existing?.adhkar_evening || false),
          notes: `[usr:${fromId}] ${fw.notes || existing?.notes || ''}`.trim()
        };

        await supabase.from('fasting_and_worship_logs').upsert(payload, { onConflict: 'date' });

        // Sync to prayers_and_habits as well
        if (incomingSunanRakats > 0 || fw.adhkar_morning != null || fw.adhkar_evening != null) {
          await supabase.from('prayers_and_habits').upsert({
            date: todayDate,
            sunan_rawatib: totalSunan,
            ...(fw.adhkar_morning != null ? { adhkar_morning: Boolean(fw.adhkar_morning) } : {}),
            ...(fw.adhkar_evening != null ? { adhkar_evening: Boolean(fw.adhkar_evening) } : {}),
            daily_reflection: `[usr:${fromId}]`
          }, { onConflict: 'date' });
        }

        if (fromId && incomingSunanRakats > 0) {
          const uSess = await getUserSession(fromId);
          await setUserSession(fromId, {
            ...(uSess || {}),
            sunan_today: totalSunan
          });
        }

        const worshipSummaryParts = [];
        if (payload.fasting_type) worshipSummaryParts.push(`✨ ${payload.fasting_type} (${payload.fasting_completed ? 'تم الصيام' : 'صائم'})`);
        if (incomingSunanRakats > 0) worshipSummaryParts.push(`🕌 سنن: ${payload.sunan_rawatib_count} / 12 ركعة`);
        if (payload.duha_prayer_done && !existing?.duha_prayer_done) worshipSummaryParts.push(`☀️ صلاة الضحى ✅`);
        if (payload.witr_prayer_done && !existing?.witr_prayer_done) worshipSummaryParts.push(`🌌 صلاة الوتر ✅`);
        if (payload.adhkar_morning && !existing?.adhkar_morning) worshipSummaryParts.push(`🌅 أذكار الصباح ✅`);
        if (payload.adhkar_evening && !existing?.adhkar_evening) worshipSummaryParts.push(`🌇 أذكار المساء ✅`);

        if (worshipSummaryParts.length > 0) {
          insertedSummary.push(`🌙 <b>الصيام والسنن والأذكار:</b>\n   └ ${worshipSummaryParts.join(' | ')}`);
        }
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

            let method = f.payment_method || 'نقدي (كاش)';
            const cleanMethod = String(method).toLowerCase();
            const rawUserText = String(ctx.message?.text || ctx.message?.caption || '').toLowerCase();

            if (cleanMethod.includes('فودافون') || cleanMethod.includes('محفظة') || cleanMethod.includes('إلكترونية') || cleanMethod.includes('الكترونية') || cleanMethod.includes('اتصالات') || cleanMethod.includes('اورانج') || cleanMethod.includes('أورانج') || cleanMethod.includes('وي') || rawUserText.includes('فودافون') || rawUserText.includes('محفظة') || rawUserText.includes('اتصالات كاش') || rawUserText.includes('اورانج كاش') || rawUserText.includes('أورانج كاش')) {
              method = 'محفظة إلكترونية';
            } else if (cleanMethod.includes('إنستا') || cleanMethod.includes('انستا') || cleanMethod.includes('instapay') || cleanMethod.includes('بنك') || cleanMethod.includes('تحويل') || rawUserText.includes('انستا') || rawUserText.includes('إنستا') || rawUserText.includes('تحويل بنكي')) {
              method = 'إنستا باي';
            } else {
              method = 'نقدي (كاش)';
            }

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

    // 11. Quran (Scientific Spaced Repetition Engine & Conflict-Free Auto Scheduling)
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
              quality_rating: Number(q.quality_rating || 5),
              notes: `[usr:${fromId}]`,
              date: todayDate
            }).select('id').maybeSingle();

            if (row?.id) {
              recordedUndoItems.push({ table: 'quran_logs', id: row.id, summary: `📖 قرآن: سورة ${q.surah_name}` });
            }

            // 🧠 Run Scientific Spaced Repetition (SRS) Engine & Conflict-Free Slot Picker
            const srsResult = await logQuranSrsSession(fromId, q);
            await addDoctorXp(fromId, 30);

            const modeLabel = q.learning_mode === 'auditory_listening'
              ? '🎧 حفظ بالسماع والتكرار الصوتي'
              : (q.learning_mode === 'visual_memorization' ? '📖 حفظ بصري من المصحف' : '🎙️ تسميع ومراجعة');

            insertedSummary.push(
              `📖 <b>القرآن الكريم (تثبيت علمي):</b> <b>سورة ${q.surah_name}</b> (${q.pages_count || 1} صفحة)\n` +
              `   ├ 🏷️ <b>المسار:</b> ${modeLabel}\n` +
              `   ├ 🧠 <b>منحنى التثبيت (SRS):</b> ${srsResult.stageTitle} (إتقان: ${srsResult.masteryPct}%)\n` +
              `   └ ⏰ <b>موعد التسميع القادم:</b> ${srsResult.nextDateStr} الساعة <b>${srsResult.nextSlotStr}</b> <i>(وقت خالٍ تماماً من التعارضات)</i>`
            );
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

            const { data: row } = await supabase.from('study_sessions').insert({
              course_code: courseCode,
              topic: `[usr:${fromId}] ${rawTopic}`.trim(),
              session_type: s.session_type || 'مذاكرة نظرية',
              duration_minutes: durMins,
              pages_covered: Number(s.pages_covered || 0),
              comprehension_rating: Number(s.comprehension_rating || 5),
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
              recordedUndoItems.push({ table: 'study_sessions', id: row.id, summary: `🩺 مذاكرة [${courseCode}] ${rawTopic} (${durText})` });
            }

            const pageText = s.pages_covered ? ` | 📄 <b>${s.pages_covered} صفحة</b>` : '';
            const ratingText = s.comprehension_rating ? ` | 🧠 استيعاب: ${'⭐'.repeat(s.comprehension_rating)}` : '';

            // 🧠 Academic Spaced Repetition (SRS) Engine & Conflict-Free Scheduling
            const srsResult = await logAcademicStudySrs(fromId, s);
            await addDoctorXp(fromId, 25);

            let pdfStatusText = '';
            if (srsResult.matchingPdf) {
              pdfStatusText = `\n   ├ 📚 <b>المذكرات المرفوعة:</b> متطابقة مع [${srsResult.matchingPdf.file_name}] — الكويزات تُستخرج منها حصراً 🎯`;
              keyboardRows.push([
                { text: `🎯 حل كويز تفاعلي الآن من الـ PDF [${courseCode}]`, callback_data: `launch_pdf_quiz_${srsResult.matchingPdf.id}_${s.pages_covered || ''}` }
              ]);
            } else {
              pdfStatusText = `\n   ├ 💡 <b>تريكة:</b> يمكنك رفع PDF الموديول لإنشاء كويزات MCQs تفاعلية من نفس الصفحات فوراً!`;
            }

            if (s.was_rescheduled) {
              insertedSummary.push(`🔄 <b>إعادة جدولة مذاكرة [${courseCode}]:</b> ${rawTopic}\n   └ ⏱️ <b>المدة:</b> <b>${durText}</b>${s.reschedule_reason ? ` (السبب: ${s.reschedule_reason})` : ''}`);
            } else {
              insertedSummary.push(
                `🩺 <b>جلسة تحصيل ومذاكرة [${courseCode}]:</b> <b>${rawTopic}</b>\n` +
                `   ├ ⏱️ <b>المدة:</b> <b>${durText}</b>${pageText}${ratingText}\n` +
                `   ├ 🧠 <b>منحنى التثبيت (SRS):</b> ${srsResult.stageTitle} (إتقان: ${srsResult.masteryPct}%)${pdfStatusText}\n` +
                `   └ ⏰ <b>موعد المراجعة القادمة:</b> ${srsResult.nextDateStr} الساعة <b>${srsResult.nextSlotStr}</b> <i>(وقت خالٍ من التعارضات)</i>`
              );
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
        const { data: existingHabits } = await supabase.from('prayers_and_habits').select('*').eq('date', todayDate).maybeSingle();
        previousHabitsSnapshot = existingHabits ? { ...existingHabits } : null;

        const userSess = fromId ? await getUserSession(fromId) : null;
        const sessPrayers = userSess?.prayers_today || userSess?.data?.prayers_today || {};

        const cairoTodayStr = getCairoToday();
        const isTodayDate = todayDate === cairoTodayStr;
        const livePrayerTimes = getCairoPrayerTimes();
        const dNow = new Date();
        const curCairoMinutes = ((dNow.getUTCHours() + 3) % 24) * 60 + dNow.getUTCMinutes();

        // Helper to verify if prayer adhan has arrived today
        const canLogPrayer = (key) => {
          if (!isTodayDate) return true; // Past dates are allowed
          const adhanMins = livePrayerTimes?.minutes?.[key];
          if (adhanMins == null) return true;
          return curCairoMinutes >= (adhanMins - 5); // 5 min grace window
        };

        // 🕌 Helper to resolve obligatory prayer with default-to-prayed logic
        const resolveObligatoryPrayer = (key, incomingVal, existingVal) => {
          if (incomingVal) {
            if (incomingVal === 'لم يُصل' || incomingVal === 'فاتتني' || incomingVal === 'missed' || incomingVal === false) return 'لم يُصل';
            return incomingVal;
          }
          if (existingVal === 'لم يُصل') return 'لم يُصل';
          if (existingVal && existingVal !== 'لم يُسجل') return existingVal;
          if (canLogPrayer(key)) return 'حاضر'; // Default assumed prayed in good faith!
          return 'لم يُسجل';
        };

        const existingFajr = existingHabits?.fajr;
        const existingDhuhr = existingHabits?.dhuhr;
        const existingAsr = existingHabits?.asr;
        const existingMaghrib = existingHabits?.maghrib;
        const existingIsha = existingHabits?.isha;

        // Calculate Sunan count safely without double adding
        let totalSunan = Number(existingHabits?.sunan_rawatib || 0);
        if (incomingSunanRakats > 0 && !sunanLoggedFromFasting) {
          totalSunan = Math.min(12, totalSunan + incomingSunanRakats);
        }

        const payload = {
          date: todayDate,
          fajr: resolveObligatoryPrayer('fajr', p.fajr, existingFajr),
          dhuhr: resolveObligatoryPrayer('dhuhr', p.dhuhr, existingDhuhr),
          asr: resolveObligatoryPrayer('asr', p.asr, existingAsr),
          maghrib: resolveObligatoryPrayer('maghrib', p.maghrib, existingMaghrib),
          isha: resolveObligatoryPrayer('isha', p.isha, existingIsha),
          qiyam_night: p.qiyam_night != null ? p.qiyam_night : (existingHabits?.qiyam_night || false),
          sunan_rawatib: totalSunan,
          adhkar_morning: p.adhkar_morning != null ? p.adhkar_morning : (existingHabits?.adhkar_morning || false),
          adhkar_evening: p.adhkar_evening != null ? p.adhkar_evening : (existingHabits?.adhkar_evening || false),
          sleep_hours: p.sleep_hours != null ? Number(p.sleep_hours) : (existingHabits?.sleep_hours || 0),
          wake_up_time: p.wake_up_time || existingHabits?.wake_up_time || null,
          sleep_bedtime: p.sleep_bedtime || existingHabits?.sleep_bedtime || null,
          workout_done: p.workout_done != null ? p.workout_done : (existingHabits?.workout_done || false),
          energy_level: p.energy_level != null ? Number(p.energy_level) : (existingHabits?.energy_level || 5),
          daily_reflection: `[usr:${fromId}] ${p.daily_reflection || existingHabits?.daily_reflection || ''}`.trim()
        };

        await supabase.from('prayers_and_habits').upsert(payload, { onConflict: 'date' });

        // Synchronize with fasting_and_worship_logs
        if ((incomingSunanRakats > 0 && !sunanLoggedFromFasting) || p.adhkar_morning != null || p.adhkar_evening != null) {
          const { data: existingFw } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', todayDate).maybeSingle();
          await supabase.from('fasting_and_worship_logs').upsert({
            date: todayDate,
            sunan_rawatib_count: totalSunan,
            adhkar_morning: payload.adhkar_morning,
            adhkar_evening: payload.adhkar_evening,
            notes: `[usr:${fromId}]`
          }, { onConflict: 'date' });
        }

        // Update user's personal session with prayer status and sunan
        if (fromId) {
          try {
            const curPrayers = sessPrayers;
            if (payload.fajr && payload.fajr !== 'لم يُسجل') curPrayers.fajr = payload.fajr;
            if (payload.dhuhr && payload.dhuhr !== 'لم يُسجل') curPrayers.dhuhr = payload.dhuhr;
            if (payload.asr && payload.asr !== 'لم يُسجل') curPrayers.asr = payload.asr;
            if (payload.maghrib && payload.maghrib !== 'لم يُسجل') curPrayers.maghrib = payload.maghrib;
            if (payload.isha && payload.isha !== 'لم يُسجل') curPrayers.isha = payload.isha;
            else if (isTodayDate && !canLogPrayer('isha')) delete curPrayers.isha;

            await setUserSession(fromId, {
              ...(userSess || {}),
              prayers_today: curPrayers,
              sunan_today: totalSunan
            });
          } catch (sessErr) {}
        }

        const prayerListText = [];
        if (p.fajr && p.fajr !== 'لم يُسجل' && canLogPrayer('fajr')) prayerListText.push(`الفجر (${p.fajr})`);
        if (p.dhuhr && p.dhuhr !== 'لم يُسجل' && canLogPrayer('dhuhr')) prayerListText.push(`الظهر (${p.dhuhr})`);
        if (p.asr && p.asr !== 'لم يُسجل' && canLogPrayer('asr')) prayerListText.push(`العصر (${p.asr})`);
        if (p.maghrib && p.maghrib !== 'لم يُسجل' && canLogPrayer('maghrib')) prayerListText.push(`المغرب (${p.maghrib})`);
        if (p.isha && p.isha !== 'لم يُسجل' && canLogPrayer('isha')) prayerListText.push(`العشاء (${p.isha})`);

        if (prayerListText.length > 0) {
          insertedSummary.push(`🕌 <b>أداء الصلوات:</b> ${prayerListText.join(' | ')}`);
        }

        const rejectedFuturePrayers = [];
        if (p.fajr && !canLogPrayer('fajr')) rejectedFuturePrayers.push(`الفجر (${livePrayerTimes.times12.fajr})`);
        if (p.dhuhr && !canLogPrayer('dhuhr')) rejectedFuturePrayers.push(`الظهر (${livePrayerTimes.times12.dhuhr})`);
        if (p.asr && !canLogPrayer('asr')) rejectedFuturePrayers.push(`العصر (${livePrayerTimes.times12.asr})`);
        if (p.maghrib && !canLogPrayer('maghrib')) rejectedFuturePrayers.push(`المغرب (${livePrayerTimes.times12.maghrib})`);
        if (p.isha && !canLogPrayer('isha')) rejectedFuturePrayers.push(`العشاء (${livePrayerTimes.times12.isha})`);

        if (rejectedFuturePrayers.length > 0) {
          insertedSummary.push(`⏳ <b>تنبيه الصلوات:</b> لم يحن وقت أذان (${rejectedFuturePrayers.join(' | ')}) بعد، وسيصلك إشعارها في موعدها.`);
        }

        if (incomingSunanRakats > 0 && !sunanLoggedFromFasting) {
          insertedSummary.push(`🕌 <b>السنن الرواتب:</b> تم توثيق (${incomingSunanRakats} ركعات) بنجاح ➔ إجمالي اليوم: (${totalSunan}/12 ركعة)`);
        }

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

    // 19. 🥗 Nutrition Logs & Food Tracking
    if (Array.isArray(data.nutrition) && data.nutrition.length > 0) {
      for (const nut of data.nutrition) {
        try {
          if (nut.meal_name || nut.calories) {
            const savedMeal = await logNutritionMeal(fromId, {
              meal_name: nut.meal_name || 'وجبة طعام',
              meal_type: nut.meal_type || 'وجبة رئيسية',
              calories: Number(nut.calories || 0),
              protein_g: Number(nut.protein_g || 0),
              carbs_g: Number(nut.carbs_g || 0),
              fats_g: Number(nut.fats_g || 0),
              notes: nut.nutrition_pearl || nut.notes || null,
              date: todayDate
            });

            if (savedMeal?.id) {
              recordedUndoItems.push({ table: 'nutrition_logs', id: savedMeal.id, summary: `🥗 وجبة [${nut.meal_name || 'طعام'}]` });
            }

            await addDoctorXp(fromId, 25, 'nutrition_pro');
            insertedSummary.push(`🥗 <b>وجبة وتغذية:</b> <b>${nut.meal_name || 'وجبة'}</b>\n   └ ⚡ <b>السعرات:</b> ~${nut.calories || 0} kcal | 🥩 <b>البروتين:</b> ~${nut.protein_g || 0}g | 🍞 <b>كارب:</b> ~${nut.carbs_g || 0}g | 🥑 <b>دهون:</b> ~${nut.fats_g || 0}g`);
          }
        } catch (e) {
          console.warn('nutrition insert error:', e.message);
        }
      }
    }

    // 20. 🛑 Distraction & Procrastination Radar
    if (Array.isArray(data.distraction) && data.distraction.length > 0) {
      for (const dis of data.distraction) {
        try {
          if (dis.distraction_source || dis.duration_minutes) {
            const savedDis = await logDistraction(fromId, {
              distraction_source: dis.distraction_source || 'سوشيال ميديا وريلز',
              duration_minutes: Number(dis.duration_minutes || 30),
              trigger_reason: dis.trigger_reason || null,
              discipline_rating: Number(dis.discipline_rating || 3),
              date: todayDate
            });

            if (savedDis?.id) {
              recordedUndoItems.push({ table: 'distraction_logs', id: savedDis.id, summary: `🛑 تشتت [${dis.distraction_source}]` });
            }

            insertedSummary.push(`🛑 <b>رادار التشتت والتسويف:</b> <b>${dis.distraction_source || 'تشتت'}</b>\n   └ ⏳ <b>المدة:</b> ${dis.duration_minutes || 30} دقيقة | 💡 <b>وقفة انضباط:</b> تم تسجيلها لمتابعة صفائك الذهني ومحاربة التسويف!`);
          }
        } catch (e) {
          console.warn('distraction insert error:', e.message);
        }
      }
    }

    // 21. 📦 Wishlist & Supplies Kanban
    if (Array.isArray(data.wishlist) && data.wishlist.length > 0) {
      for (const wish of data.wishlist) {
        try {
          if (wish.title) {
            const savedWish = await addWishlistItem(fromId, {
              title: wish.title,
              category: wish.category || 'مستلزمات طبية',
              estimated_cost: Number(wish.estimated_cost || 0),
              priority: wish.priority || 'متوسطة',
              notes: wish.notes || null,
              date: todayDate
            });

            if (savedWish?.id) {
              recordedUndoItems.push({ table: 'wishlist_items', id: savedWish.id, summary: `📦 نواقص [${wish.title}]` });
            }

            await addDoctorXp(fromId, 15);
            insertedSummary.push(`📦 <b>سجل النواقص والمستلزمات:</b> <b>${wish.title}</b>\n   └ 🏷️ <b>التصنيف:</b> ${wish.category || 'مستلزمات'} | 💰 <b>التكلفة التقديرية:</b> ~${wish.estimated_cost ? formatEgp(wish.estimated_cost) : 'غير محددة'}`);
          }
        } catch (e) {
          console.warn('wishlist insert error:', e.message);
        }
      }
    }

    // 22. ⚖️ Body Metrics / InBody Profile
    if (data.body_metrics && (data.body_metrics.weight_kg || data.body_metrics.height_cm || data.body_metrics.body_fat_pct)) {
      try {
        await updateUserBodyMetrics(fromId, data.body_metrics);
        await addDoctorXp(fromId, 30);
        insertedSummary.push(`⚖️ <b>تحديث قياسات الجسم (InBody):</b>\n   └ 🏋️‍♂️ <b>الوزن:</b> ${data.body_metrics.weight_kg || '-'} كجم | 📏 <b>الطول:</b> ${data.body_metrics.height_cm || '-'} سم | 🧬 <b>نسبة الدهون:</b> ${data.body_metrics.body_fat_pct || '-'}%`);
      } catch (e) {
        console.warn('body_metrics update error:', e.message);
      }
    }

    // 23. 📝 Universal Flexible Free Logs
    if (Array.isArray(data.flexible_logs) && data.flexible_logs.length > 0) {
      for (const fl of data.flexible_logs) {
        try {
          if (fl.content || fl.title) {
            const savedLog = await logFlexibleFreeActivity(fromId, {
              category: fl.category || 'نشاط حر',
              title: fl.title || 'ملاحظة ونشاط',
              content: fl.content || '',
              metadata: fl.metadata || {},
              date: todayDate
            });

            if (savedLog?.id) {
              recordedUndoItems.push({ table: 'flexible_free_logs', id: savedLog.id, summary: `📝 نشاط [${fl.title || 'حر'}]` });
            }

            await addDoctorXp(fromId, 15);
            insertedSummary.push(`📝 <b>سجل نشاط حر:</b> <b>${fl.title || 'نشاط'}</b>\n   └ 📌 ${fl.content || ''}`);
          }
        } catch (e) {
          console.warn('flexible_logs insert error:', e.message);
        }
      }
    }

    // 🏆 Update Daily Streaks & XP for Activity
    let currentStreakCount = 1;
    let gamInfo = null;
    if (fromId && insertedSummary.length > 0) {
      try {
        currentStreakCount = await updateUserStreak(fromId);
        gamInfo = await addDoctorXp(fromId, 20);
      } catch (e) {}
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

    if (gamInfo) {
      card += `\n🏆 <b>رتبة الطبيب:</b> <code>${gamInfo.rank_title}</code> (${gamInfo.doctor_xp} XP)\n🔥 <b>شعلة الانضباط:</b> <b>${currentStreakCount} أيام متواصلة</b> مستمرة دون انقطاع! 🌟\n`;
    }
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

    await supabase.from('fasting_and_worship_logs').upsert({ date, duha_prayer_done: true, sunan_rawatib_count: existing?.sunan_rawatib_count || 0 }, { onConflict: 'date' });

    await ctx.answerCbQuery('☀️ تقبل الله صلاة الضحى!');

    const keyboard = {
      inline_keyboard: [
        [{ text: '↩️ تراجع عن تسجيل الضحى', callback_data: `undo_duha_${date}_${now}` }]
      ]
    };

    return ctx.editMessageText('✅ <b>تم تسجيل صلاة الضحى بنجاح! ☀️</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  bot.action(/^undo_duha_(.+?)_(\d+)$/, async (ctx) => {
    const [, date, actionTime] = ctx.match;

    if (isUndoExpired(actionTime)) return ctx.answerCbQuery('⛔ انتهت صلاحية التراجع (24 ساعة)', { show_alert: true });

    const { data: existing } = await supabase.from('fasting_and_worship_logs').select('*').eq('date', date).maybeSingle();

    await supabase.from('fasting_and_worship_logs').upsert({ date, duha_prayer_done: false, sunan_rawatib_count: existing?.sunan_rawatib_count || 0 }, { onConflict: 'date' });

    await ctx.answerCbQuery('↩️ تم التراجع بنجاح');

    const keyboard = {
      inline_keyboard: [[{ text: '✅ صليت صلاة الضحى', callback_data: `ack_duha_done_${date}` }]]
    };

    return ctx.editMessageText('☀️ <b>صلاة الأوابين (صلاة الضحى):</b>', { parse_mode: 'HTML', reply_markup: keyboard }).catch(() => {});
  });

  // 6. 🕌 Interactive Prayer Confirmation Handlers (Fajr, Dhuhr, Asr, Maghrib, Isha)
  bot.action(/^prayer_done_(fajr|dhuhr|asr|maghrib|isha)$/, async (ctx) => {
    const prayerKey = ctx.match[1];
    const fromId = ctx.from?.id;
    const today = getCairoToday();
    const prayerNames = {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء'
    };
    const pName = prayerNames[prayerKey] || prayerKey;
    const livePrayerData = getCairoPrayerTimes();
    const dNow = new Date();
    const curCairoMinutes = ((dNow.getUTCHours() + 3) % 24) * 60 + dNow.getUTCMinutes();
    const adhanMins = livePrayerData?.minutes?.[prayerKey] || 0;

    if (curCairoMinutes < adhanMins - 5) {
      const pTime12 = livePrayerData?.times12?.[prayerKey] || '';
      return ctx.answerCbQuery(`⏳ صلاة ${pName} لم يحن وقت أذانها بعد (${pTime12}) يا دكتور!`, { show_alert: true });
    }

    await ctx.answerCbQuery(`تقبل الله صلاة ${pName} يا دكتور! 🤲✨`);

    try {
      // 1. Update prayers_and_habits
      const { data: existing } = await supabase.from('prayers_and_habits').select('*').eq('date', today).maybeSingle();
      const payload = {
        date: today,
        [prayerKey]: 'حاضر في المسجد 🟢',
        daily_reflection: `[usr:${fromId}] ${existing?.daily_reflection || ''}`.trim()
      };
      await supabase.from('prayers_and_habits').upsert(payload, { onConflict: 'date' });

      // 2. Update user session
      if (fromId) {
        const session = await getUserSession(fromId);
        const currentPrayers = session?.data?.prayers_today || {};
        currentPrayers[prayerKey] = 'حاضر في المسجد 🟢';
        await setUserSession(fromId, {
          ...(session?.data || {}),
          prayers_today: currentPrayers
        });
      }

      // 3. Edit message
      const confirmMsg = `✅ <b>تقبل الله طاعتك يا دكتور! 🤲✨</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `تم تسجيل وتوثيق أداء <b>صلاة ${pName}</b> (حاضر في المسجد) في سجلك وميزان حسناتك بنجاح.\n\n` +
        `🤍 <i>"وجعلت قرة عيني في الصلاة"</i>`;

      return ctx.editMessageText(confirmMsg, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 عرض سجل العبادات واليوم', callback_data: 'menu_fasting' }],
            [{ text: '🚀 القائمة الرئيسية', callback_data: 'menu_main' }]
          ]
        }
      }).catch(() => {});
    } catch (err) {
      console.warn('prayer_done callback error:', err.message);
    }
  });

  bot.action(/^prayer_notyet_(fajr|dhuhr|asr|maghrib|isha)$/, async (ctx) => {
    const prayerKey = ctx.match[1];
    const prayerNames = {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء'
    };
    const pName = prayerNames[prayerKey] || prayerKey;
    await ctx.answerCbQuery(`لا تؤخرها يا دكتور، قم للصلاة الآن 🤍`);

    const msg = `⏳ <b>تنبيه حث على صلاة ${pName}:</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🤍 <i>"الصلاة على وقتها أحب الأعمال إلى الله"</i>.\n\n` +
      `قم الآن توضأ وافرغ قلبك لله لتنال التوفيق والسكينة في يومك يا دكتور.\n\n` +
      `👇 <i>اضغط لتأكيد الأداء فور انتهائك:</i>`;

    return ctx.editMessageText(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: `✅ صليت ${pName} الحمدلله`, callback_data: `prayer_done_${prayerKey}` }]
        ]
      }
    }).catch(() => {});
  });

  bot.action(/^prayer_fasttrack_(fajr|dhuhr|asr|maghrib|isha)$/, async (ctx) => {
    const prayerKey = ctx.match[1];
    const prayerNames = {
      fajr: 'الفجر',
      dhuhr: 'الظهر',
      asr: 'العصر',
      maghrib: 'المغرب',
      isha: 'العشاء'
    };
    const pName = prayerNames[prayerKey] || prayerKey;
    await ctx.answerCbQuery(`بارك الله في همتك، في انتظارك! 🤍`);

    const msg = `🏃‍♂️ <b>في انتظارك بعد أداء صلاة ${pName} يا دكتور:</b>\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `تقبل الله مقدماً! اضغط أدناه بمجرد الانتهاء لتثبيتها في سجلك وميزان حسناتك فوراً:`;

    return ctx.editMessageText(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: `✅ صليت ${pName} الحمدلله`, callback_data: `prayer_done_${prayerKey}` }]
        ]
      }
    }).catch(() => {});
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

  // Quran Spaced Repetition (SRS) Interactive Handlers
  bot.action(/^ack_quran_mastered_(.+?)_(.+)$/, async (ctx) => {
    const [, masteryId, apptId] = ctx.match;
    const fromId = ctx.from?.id;

    // Mark current appointment completed
    if (apptId) {
      await supabase.from('appointments_and_reminders').update({ is_completed: true, is_notified: true }).eq('id', apptId);
    }

    // Advance stage in Quran Spaced Mastery
    const updated = await advanceQuranSrsStage(masteryId, true);
    if (fromId) await addDoctorXp(fromId, 35);

    await ctx.answerCbQuery('🌟 ما شاء الله! تم ترقية مرحلة الحفظ والتثبيت بنجاح');

    const nextDate = updated?.next_review_at ? new Date(updated.next_review_at).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' }) : 'قريباً';
    const nextTime = updated?.next_review_at ? new Date(updated.next_review_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '';

    return ctx.editMessageText(
      `✅ <b>ثبّت الله حفظك يا دكتور! 🕌✨</b>\n━━━━━━━━━━━━━━━━━━━━━\n` +
      `📖 <b>سورة ${updated?.surah_name || 'القرآن'}</b>\n` +
      `🏆 <b>المرحلة الحالية:</b> ${updated?.repetition_stage || 1}/6 (إتقان: <b>${updated?.mastery_pct || 25}%</b>)\n` +
      `⏰ <b>موعد المراجعة التباعدية القادمة:</b> ${nextDate} ${nextTime} <i>(مجداول تلقائياً في وقت خالٍ تماماً)</i>`,
      { parse_mode: 'HTML' }
    ).catch(() => {});
  });

  bot.action(/^ack_quran_retry_(.+?)_(.+)$/, async (ctx) => {
    const [, masteryId, apptId] = ctx.match;

    // Mark current appointment completed
    if (apptId) {
      await supabase.from('appointments_and_reminders').update({ is_completed: true, is_notified: true }).eq('id', apptId);
    }

    // Adjust interval for reinforcement
    const updated = await advanceQuranSrsStage(masteryId, false);

    await ctx.answerCbQuery('🎧 لا بأس يا دكتور! تم ضبط موعد استماع وتكرار إضافي');

    return ctx.editMessageText(
      `🎧 <b>تمت جدولة جلسة استماع وتكرار إضافية لترسيخ الحفظ:</b>\n` +
      `📖 <b>سورة ${updated?.surah_name || 'القرآن'}</b>\n` +
      `💡 كرر مع القارئ مرتين أو ثلاث، وسيرسل لك البوت التذكير القادم في الموعد المناسب بإذن الله! ✨`,
      { parse_mode: 'HTML' }
    ).catch(() => {});
  });

  // 🎯 Launch Native Telegram Quiz Poll from Uploaded PDF Vault
  bot.action(/^launch_pdf_quiz_(.+?)_(.*)$/, async (ctx) => {
    const [, pdfVaultId, pagesRange] = ctx.match;
    const fromId = ctx.from?.id;

    await ctx.answerCbQuery('🎯 جاري استخراج كويز تفاعلي من مذكراتك...');

    try {
      const { data: pdfRow } = await supabase.from('academic_pdf_vault').select('*').eq('id', pdfVaultId).maybeSingle();
      if (!pdfRow) return ctx.reply('⚠️ لم يتم العثور على ملف المذكرات.');

      let mcqList = [];
      if (Array.isArray(pdfRow.mcqs_extracted) && pdfRow.mcqs_extracted.length > 0) {
        mcqList = pdfRow.mcqs_extracted;
      } else {
        const aiKeys = await getStoredAiKeys();
        mcqList = await extractGroundedMcqsFromPdf(pdfRow, pagesRange, 3, aiKeys);
      }

      if (mcqList.length === 0) {
        return ctx.reply('⚠️ لم نتمكن من استخراج أسئلة من هذا الملف حالياً.');
      }

      const mcq = mcqList[0];
      const questionText = `[${pdfRow.course_code || 'MED'}] ${mcq.question}`.substring(0, 300);
      const options = (mcq.options || ['A', 'B', 'C', 'D']).map(o => String(o).substring(0, 100));
      const correctIdx = Number(mcq.correct_option_index || 0);
      const explanation = (mcq.explanation || 'إجابة من مذكرة الموديول').substring(0, 195);

      const pollMessage = await bot.telegram.sendPoll(fromId, questionText, options, {
        type: 'quiz',
        correct_option_id: Math.max(0, Math.min(options.length - 1, correctIdx)),
        explanation: `💡 ${explanation}`,
        is_anonymous: false
      });

      if (pollMessage && pollMessage.poll) {
        await saveNativeQuizPoll(fromId, {
          course_code: pdfRow.course_code,
          topic: pdfRow.topic_title,
          question: questionText,
          options: options,
          correct_option_index: correctIdx,
          explanation: explanation,
          pdf_source_id: pdfRow.id,
          page_number: pagesRange || null,
          telegram_poll_id: pollMessage.poll.id
        });
      }
    } catch (err) {
      console.warn('launch_pdf_quiz error:', err.message);
      ctx.reply(`❌ حدث خطأ أثناء إرسال الكويز التفاعلي: ${err.message}`);
    }
  });

  // 🩺 Academic SRS Checkpoint Confirmation Handler
  bot.action(/^ack_acad_mastered_(.+?)_(.+)$/, async (ctx) => {
    const [, masteryId, apptId] = ctx.match;
    const fromId = ctx.from?.id;

    if (apptId) {
      await supabase.from('appointments_and_reminders').update({ is_completed: true, is_notified: true }).eq('id', apptId);
    }

    try {
      const { data: row } = await supabase.from('academic_spaced_mastery').select('*').eq('id', masteryId).maybeSingle();
      if (!row) return ctx.answerCbQuery('تعذر العثور على سجل المذاكرة');

      let nextStage = Math.min(6, (row.repetition_stage || 1) + 1);
      const intervals = { 1: 10, 2: 24, 3: 72, 4: 168, 5: 360, 6: 720 };
      const pcts = { 1: 25, 2: 45, 3: 65, 4: 80, 5: 92, 6: 100 };
      const nextDate = new Date(Date.now() + (intervals[nextStage] || 24) * 3600 * 1000);
      nextDate.setHours(21, 30, 0, 0);

      await supabase.from('academic_spaced_mastery').update({
        repetition_stage: nextStage,
        mastery_pct: pcts[nextStage],
        mastery_status: nextStage >= 6 ? 'متقن راسخ' : (nextStage >= 4 ? 'مراجعة متباعدة' : 'تثبيت أولي'),
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextDate.toISOString()
      }).eq('id', masteryId);

      if (fromId) await addDoctorXp(fromId, 30);
      await ctx.answerCbQuery('🌟 عاش يا دكتور! تم ترقية مرحلة تثبيت الموديول');

      const nextDateFormatted = nextDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' });

      return ctx.editMessageText(
        `✅ <b>عاش يا دكتور! تم توثيق المراجعة والتثبيت بنجاح 🩺✨</b>\n━━━━━━━━━━━━━━━━━━━━━\n` +
        `📚 <b>الموديول:</b> [${row.course_code}] ${row.topic}\n` +
        `🏆 <b>المرحلة الحالية:</b> ${nextStage}/6 (إتقان: <b>${pcts[nextStage]}%</b>)\n` +
        `⏰ <b>المراجعة القادمة:</b> ${nextDateFormatted} الساعة 09:30 م <i>(مجداول تلقائياً في وقت خالٍ)</i>`,
        { parse_mode: 'HTML' }
      ).catch(() => {});
    } catch (e) {
      console.warn('ack_acad_mastered error:', e.message);
    }
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
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const quizzes = await getUserMedicalQuizzes(fromId);

    if (!quizzes || quizzes.length === 0) {
      let noQuizMsg = `🩺 <b>بنك أسئلة وكويزات الموديولات الطبية:</b>\n`;
      noQuizMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
      noQuizMsg += `⚠️ <b>لم تقم برفع أي أسئلة أو سلايدات بعد!</b>\n\n`;
      noQuizMsg += `💡 <i>المنظومة تعتمد بالكامل على الماتريال والأسئلة والسلايدات الخاصة بجامعتك التي ترفعها بنفسك.</i>\n\n`;
      noQuizMsg += `📸 <b>طريقة البدء:</b>\n`;
      noQuizMsg += `• أرسل صورة سلايد محاضرة، صفحة كتاب، أو كويز MCQ في الشات.\n`;
      noQuizMsg += `• وسيقوم الذكاء الاصطناعي باستخراج الأسئلة وتثبيتها تلقائياً بالتكرار المتباعد! ⚡`;

      return ctx.reply(noQuizMsg, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
          ]
        }
      });
    }

    let msg = `🩺 <b>بنك أسئلتك وموادك المرفوعة (${quizzes.length} سؤال):</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    quizzes.slice(0, 8).forEach(q => {
      msg += `• 🩺 [${q.course_code}] <b>${q.question.slice(0, 45)}...</b> [مستوى: ${q.repetition_level || 0}/6]\n`;
    });

    const keyboard = {
      inline_keyboard: [
        [{ text: '🎯 بدء اختبار من أسئلتي المرفوعة', callback_data: 'start_user_quiz' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('start_user_quiz', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const quizzes = await getUserMedicalQuizzes(fromId);

    if (!quizzes || quizzes.length === 0) {
      return ctx.reply('⚠️ لم تقم برفع أي أسئلة أو صور بعد. أرسل صورة سلايد أو كتاب للبدء فوراً!');
    }

    const randomQuiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    let msg = `🩺 <b>كويز من أسئلتك المرفوعة [${randomQuiz.course_code}]:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    if (randomQuiz.clean_topic || randomQuiz.topic) {
      msg += `📌 <b>الموضوع:</b> ${randomQuiz.clean_topic || randomQuiz.topic}\n\n`;
    }
    msg += `❓ <b>السؤال:</b>\n<b>${randomQuiz.question}</b>\n\n`;
    msg += `💡 <i>فكر في الإجابة ثم اضغط لإظهار الحل والشرح:</i>`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '💡 إظهار الإجابة والشرح', callback_data: `reveal_user_quiz_${randomQuiz.id || 'last'}` }],
        [{ text: '🎲 سؤال آخر من موادي', callback_data: 'start_user_quiz' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    if (fromId) await setUserSession(fromId, { activeUserQuiz: randomQuiz });
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action(/^reveal_user_quiz_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const session = await getUserSession(fromId);
    const quiz = session?.activeUserQuiz;

    if (!quiz) {
      return ctx.reply('💡 <i>اضغط "بدء اختبار" لاختيار سؤال جديد.</i>', { parse_mode: 'HTML' });
    }

    let msg = `💡 <b>الإجابة النموذجية والشرح السريري:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `❓ <b>السؤال:</b>\n${quiz.question}\n\n`;
    msg += `✅ <b>الحل والشرح:</b>\n${quiz.answer_and_explanation || 'موضحة بالمرجع'}\n`;
    if (quiz.doctor_pearl) {
      msg += `\n🔬 💡 <b>تريكة الراوند:</b> ${quiz.doctor_pearl}\n`;
    }

    const keyboard = {
      inline_keyboard: [
        [{ text: '🎲 سؤال آخر من موادي', callback_data: 'start_user_quiz' }],
        [{ text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('menu_academic', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    const year = profile?.academic_year || 'الفرقة الرابعة';
    const semester = profile?.semester || 'الترم الأول';

    const { data: schedule } = await supabase
      .from('academic_schedule')
      .select('*')
      .or(`telegram_id.eq.${fromId},telegram_id.is.null`)
      .eq('is_active', true);

    const { data: att } = await supabase
      .from('attendance_logs')
      .select('*')
      .limit(5);

    let msg = `🩺 <b>خطة ${year} (${semester}) وجدول السكاشن:</b>\n━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📅 <b>جدول السكاشن والمواعيد الأسبوعية:</b>\n`;

    if (!schedule || schedule.length === 0) {
      msg += `✨ <i>لا توجد سكاشن مسجلة بعد في حسابك. يمكنك إرسال فويس أو كتابة موعد سيكشنك لتسجيله فوراً!</i>\n`;
    } else {
      schedule.forEach(s => msg += `• <b>${s.day_of_week}:</b> [${s.course_code}] ${s.title} (⏰ ${s.start_time})${s.location ? ` - 📍 ${s.location}` : ''}\n`);
    }

    if (att && att.length > 0) {
      msg += `\n📝 <b>سجل الحضور والغياب الأخير:</b>\n`;
      att.forEach(a => msg += `• ${a.status === 'حضور' ? '✅' : '⚠️'} [${a.course_code}] ${a.session_title} (${a.status})\n`);
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '➕ تسجيل موعد سيكشن جديد', callback_data: 'academic_add_section' },
          { text: '🎓 ضبط الفرقة والموديولات', callback_data: 'menu_academic_config' }
        ],
        [
          { text: '🧪 كويز سريري سريع (OSCE)', callback_data: 'menu_quiz' },
          { text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }
        ]
      ]
    };

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
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
    return sendDynamicMainMenu(ctx);
  });

  // ⚙️ Settings & Modular Section Toggles
  bot.action('menu_settings', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    const { msg, keyboard } = getSettingsMenuContent(profile);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('toggle_info_med', async (ctx) => {
    return ctx.answerCbQuery('🩺 المحور الطبي والكويزات هو المحرك الأساسي للمنظومة ولا يمكن تعطيله.', { show_alert: true });
  });

  const supportedToggles = ['english', 'schedule', 'islamic', 'gym', 'content', 'work', 'finance', 'wellness'];
  supportedToggles.forEach(prefKey => {
    bot.action(`toggle_pref_${prefKey}`, async (ctx) => {
      const fromId = ctx.from?.id;
      const profile = await getUserProfile(fromId);
      const currentPrefs = profile?.preferences || DEFAULT_USER_PREFERENCES;
      const currentVal = prefKey === 'gym' || prefKey === 'content' || prefKey === 'work'
        ? currentPrefs[prefKey] === true
        : currentPrefs[prefKey] !== false;
      const newVal = !currentVal;

      const updatedPrefs = await updateUserPreferences(fromId, { [prefKey]: newVal });
      await ctx.answerCbQuery(`تم ${newVal ? 'تفعيل ✅' : 'تعطيل ❌'} القسم بنجاح!`).catch(() => {});

      const { keyboard } = getSettingsMenuContent({ ...profile, preferences: updatedPrefs });
      try {
        await ctx.editMessageReplyMarkup(keyboard);
      } catch (_) {}
    });
  });

  bot.action('menu_commands_guide', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    const { msg, keyboard } = getCommandsGuideContent(profile);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('edit_profile_name', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    await setUserSession(fromId, { state: 'waiting_new_name' });
    return ctx.reply(`✍️ <b>تعديل اسمك في المنظومة:</b>\nيرجى كتابة اسمك الجديد في رسالة الآن (مثال: <code>د. محمد أحمد</code> أو <code>أنا اسمي د. محمد أحمد</code>):`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[{ text: '🔙 إلغاء والرجوع', callback_data: 'menu_commands_guide' }]] }
    });
  });

  // 🎓 Academic Year & Semester Configuration UI
  function getAcademicConfigContent(profile, courses) {
    const year = profile?.academic_year || 'الفرقة الرابعة';
    const semester = profile?.semester || 'الترم الأول';

    let msg = `🎓 <b>إعدادات الفرقة والتيرم الأكاديمي:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👤 <b>الطالب:</b> ${profile?.full_name || 'دكتور'}\n`;
    msg += `🏛️ <b>الفرقة الحالية:</b> <b>${year}</b>\n`;
    msg += `📚 <b>الفصل الدراسي:</b> <b>${semester}</b>\n\n`;
    msg += `🩺 <b>الموديولات النشطة في حسابك (${courses.length}):</b>\n`;
    courses.forEach(c => {
      msg += `• <code>[${c.code}]</code> ${c.title}\n`;
    });
    msg += `\n👇 <i>اضغط على فرقتك أو التيرم لتحديث موديولاتك تلقائياً:</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: `${year === 'الفرقة الأولى' ? '🔘' : '⚪'} سنة أولى`, callback_data: 'set_year_1' },
          { text: `${year === 'الفرقة الثانية' ? '🔘' : '⚪'} سنة ثانية`, callback_data: 'set_year_2' },
          { text: `${year === 'الفرقة الثالثة' ? '🔘' : '⚪'} سنة ثالثة`, callback_data: 'set_year_3' }
        ],
        [
          { text: `${year === 'الفرقة الرابعة' ? '🔘' : '⚪'} سنة رابعة`, callback_data: 'set_year_4' },
          { text: `${year === 'الفرقة الخامسة' ? '🔘' : '⚪'} سنة خامسة`, callback_data: 'set_year_5' },
          { text: `${year === 'الامتياز' ? '🔘' : '⚪'} الامتياز`, callback_data: 'set_year_intern' }
        ],
        [
          { text: `${semester === 'الترم الأول' ? '🔘' : '⚪'} الترم الأول 🍂`, callback_data: 'set_sem_1' },
          { text: `${semester === 'الترم الثاني' ? '🔘' : '⚪'} الترم الثاني 🌸`, callback_data: 'set_sem_2' }
        ],
        [
          { text: '✏️ تعديل وتخصيص الموديولات (نسخ وتعديل)', callback_data: 'menu_edit_courses' }
        ],
        [
          { text: '🔙 القائمة الرئيسية', callback_data: 'menu_main' }
        ]
      ]
    };

    return { msg, keyboard };
  }

  bot.action('menu_academic_config', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    const courses = await getUserActiveCourses(fromId);
    const { msg, keyboard } = getAcademicConfigContent(profile, courses);
    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('menu_edit_courses', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const courses = await getUserActiveCourses(fromId);
    const templateText = courses.map(c => `${c.code} - ${c.title}`).join('\n');

    await setUserSession(fromId, { state: 'waiting_edit_modules' });

    let msg = `✏️ <b>تعديل وتخصيص قائمة موديولاتك:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 <b>الموديولات الحالية (اضغط على الصندوق أدناه لنسخها بلمسة واحدة):</b>\n\n`;
    msg += `<code>${templateText}</code>\n\n`;
    msg += `✍️ <b>طريقة التعديل:</b>\n`;
    msg += `1. اضغط على النص أعلاه لنسخه.\n`;
    msg += `2. الصقه في مكان الكتابة وعدّل عليه كما تحب (احذف موديول، غيّر كود أو اسم، أو ضيف موديول جديد في سطر مستقل).\n`;
    msg += `3. أرسل الرسالة (أو أرسل تسجيلاً صوتياً بالموديولات) وسيقوم الذكاء الاصطناعي باستخراجها وحفظها في حسابك وتطبيقها في الـ Web App فوراً! ⚡`;

    return ctx.reply(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 إلغاء والرجوع', callback_data: 'menu_academic_config' }]
        ]
      }
    });
  });

  const yearMapping = {
    'set_year_1': 'الفرقة الأولى',
    'set_year_2': 'الفرقة الثانية',
    'set_year_3': 'الفرقة الثالثة',
    'set_year_4': 'الفرقة الرابعة',
    'set_year_5': 'الفرقة الخامسة',
    'set_year_intern': 'الامتياز'
  };

  for (const [btnAction, yearTitle] of Object.entries(yearMapping)) {
    bot.action(btnAction, async (ctx) => {
      const fromId = ctx.from?.id;
      const updatedProf = await updateUserAcademicProfile(fromId, { academicYear: yearTitle, customCourses: null });
      await ctx.answerCbQuery(`تم تحديث الفرقة إلى ${yearTitle} بنجاح! 🎓`).catch(() => {});
      const courses = await getUserActiveCourses(fromId);
      const { msg, keyboard } = getAcademicConfigContent(updatedProf, courses);
      try {
        await ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard });
      } catch (_) {
        await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
      }
    });
  }

  const semMapping = {
    'set_sem_1': 'الترم الأول',
    'set_sem_2': 'الترم الثاني'
  };

  for (const [btnAction, semTitle] of Object.entries(semMapping)) {
    bot.action(btnAction, async (ctx) => {
      const fromId = ctx.from?.id;
      const updatedProf = await updateUserAcademicProfile(fromId, { semester: semTitle, customCourses: null });
      await ctx.answerCbQuery(`تم تحديث الفصل الدراسي إلى ${semTitle} 📚`).catch(() => {});
      const courses = await getUserActiveCourses(fromId);
      const { msg, keyboard } = getAcademicConfigContent(updatedProf, courses);
      try {
        await ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard });
      } catch (_) {
        await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
      }
    });
  }

  bot.action('academic_add_section', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    let helpMsg = `📅 <b>إضافة موعد سيكشن / راوند جديد:</b>\n`;
    helpMsg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    helpMsg += `🪄 <b>أسهل طريقة:</b> أرسل تسجيلاً صوتياً أو اكتب رسالة مباشرة للبوت، مثل:\n\n`;
    helpMsg += `👉 <code>عندي سيكشن أطفال كل يوم ثلاثاء الساعة 10:00 صباحاً في المستشفى</code>\n`;
    helpMsg += `👉 <code>ضيف سيكشن كارديو يوم الأحد الساعة 9:00 في الكلية</code>\n\n`;
    helpMsg += `📸 أو ارفع صورة ورقة جدول الكلية واكتب: <i>"أنا سيكشن 5"</i> وسيقوم الذكاء الاصطناعي باستخراج جدولك وحفظه تلقائياً! ⚡`;

    return ctx.reply(helpMsg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 جدول السكاشن', callback_data: 'menu_academic' }]] } });
  });

  bot.action('menu_add_custom_course', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    await setUserSession(fromId, { state: 'waiting_custom_course' });

    let msg = `➕ <b>إضافة موديول دراسي مخصص:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `يرجى كتابة كود واسم الموديول في رسالة، مثلاً:\n\n`;
    msg += `👉 <code>SURG301 - جراحة عامة</code>\n`;
    msg += `👉 <code>MICR101 - ميكروبيولوجي ومناعة</code>\n\n`;
    msg += `✍️ <i>اكتب كود واسم الموديول الآن وسيقوم البوت بإضافته فوراً لقائمتك!</i>`;

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🔙 إلغاء والرجوع', callback_data: 'menu_academic_config' }]] } });
  });

  // ==============================================================================
  // 🌟 Smart Onboarding Wizard Actions
  // ==============================================================================

  const onboardingYears = {
    'onboarding_year_1': 'الفرقة الأولى',
    'onboarding_year_2': 'الفرقة الثانية',
    'onboarding_year_3': 'الفرقة الثالثة',
    'onboarding_year_4': 'الفرقة الرابعة',
    'onboarding_year_5': 'الفرقة الخامسة',
    'onboarding_year_intern': 'الامتياز'
  };

  for (const [actionKey, yearName] of Object.entries(onboardingYears)) {
    bot.action(actionKey, async (ctx) => {
      await ctx.answerCbQuery(`تم اختيار ${yearName} 🎓`).catch(() => {});
      const fromId = ctx.from?.id;
      const updatedProf = await updateUserAcademicProfile(fromId, { academicYear: yearName, customCourses: null });
      await setUserSession(fromId, { state: 'onboarding_schedule' });
      const { msg, keyboard } = getOnboardingStepContent('schedule', updatedProf);
      try {
        await ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard });
      } catch (_) {
        await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
      }
    });
  }

  bot.action('onboarding_custom_modules', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    await setUserSession(fromId, { state: 'waiting_edit_modules' });
    let msg = `✏️ <b>اكتب أو أرسل تسجيلاً صوتياً بموديولاتك:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `اكتب أسماء أو أكواد المواد التي تدرسها في رسالة، مثلاً:\n`;
    msg += `<code>SURG101 - جراحة عامة\nPED201 - طب أطفال\nCAD301 - قلب وأوعية</code>\n\n`;
    msg += `✍️ <i>أرسل الرسالة الآن وسيقوم البوت بحفظها والمتابعة معك فوراً!</i>`;
    return ctx.reply(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⏭️ تخطي ومتابعة الإعداد', callback_data: 'onboarding_skip_schedule' }]]
      }
    });
  });

  bot.action('onboarding_skip_schedule', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    await setUserSession(fromId, { state: 'onboarding_prefs' });
    const { msg, keyboard } = getOnboardingStepContent('preferences', profile);
    try {
      await ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch (_) {
      await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  });

  bot.action('onboarding_input_schedule', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    await setUserSession(fromId, { state: 'waiting_edit_schedule' });
    let msg = `📅 <b>تسجيل مواعيد السكاشن والراوندات الأسبوعية:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🎙️ أرسل تسجيلاً صوتياً أو اكتب رسالة بجدولك، مثلاً:\n`;
    msg += `👉 <code>عندي سيكشن أطفال كل ثلاثاء الساعة 10 الصبح في المستشفى وسيكشن كارديو كل حد الساعة 9</code>\n\n`;
    msg += `✍️ <i>أرسل جدولك الآن وسيقوم الذكاء الاصطناعي ببرمجته وتثبيته فوراً!</i>`;
    return ctx.reply(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[{ text: '⏭️ تخطي ومتابعة الإعداد', callback_data: 'onboarding_skip_schedule' }]]
      }
    });
  });

  bot.action('onboarding_finish_default', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    const fromId = ctx.from?.id;
    const profile = await getUserProfile(fromId);
    await setUserSession(fromId, { state: 'idle' });
    const { msg, keyboard } = getOnboardingStepContent('finish', profile);
    try {
      await ctx.editMessageText(msg, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch (_) {
      await ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
    }
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

  // ==============================================================================
  // 🛡️ Admin Purity & Dopamine Recovery Protocol Handlers (سوسو & بوبو)
  // ==============================================================================
  bot.command(['sos', 'نجدة', 'طوارئ', 'urgency'], async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return;

    let msg = `🆘 <b>بروتوكول الطوارئ وركوب الموجة (Urge Surfing Protocol) 🌊</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🧠 <b>الحقيقة العلمية الكيميائية:</b>\n`;
    msg += `موجة اشتهاء الدوبامين (Dopamine Craving Peak) مثل موجة البحر تماماً؛ ترتفع بشدة وتصل لقمة الألم خلال <b>90 إلى 180 ثانية</b>، ثم تنهار وتنكسر بيولوجياً إذا لم تستجب لها!\n\n`;
    msg += `⚡ <b>خطوات كسر الموجة الآن (3 دقائق):</b>\n`;
    msg += `1️⃣ <b>تغيير بيولوجي فوري:</b> ارمي الموبايل بعيداً فوراً والمس ماءً بارداً على وجهك.\n`;
    msg += `2️⃣ <b>تنفس إعادة ضبط الجهاز العصبي (4-7-8):</b> شهيق 4 ثوانٍ، كتم 7 ثوانٍ، زفير بطيء 8 ثوانٍ (كررها 4 مرات).\n`;
    msg += `3️⃣ <b>كسر وضعية الجسد:</b> غادر السرير والغرفة، والعب 20 عدة ضغط أو اخرج للمشي.\n\n`;
    msg += `👑 <i>"أنت المتحكم في عقلك.. الشهوة مجرد نبضة كهربائية عابرة وأنت السيّد!"</i> 🔥`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛡️ انتصرت على الرغبة وكسرت الموجة (+50 XP)', callback_data: 'resisted_urge_ack' }],
        [{ text: '🔥 شعلة النقاء والتعافي', callback_data: 'purity_check_streak' }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.command(['purity', 'نقاء', 'سيادة', 'تعافي'], async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return;

    const stats = await getAdminPurityStats(fromId);
    if (!stats) return ctx.reply('⚠️ لم يتم العثور على سجلات النقاء.');

    let msg = `🛡️ <b>قلعة السيادة والتعافي العصبي (د. عبدالله) 👑</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🔥 <b>شعلة النقاء الحالية:</b>\n`;
    msg += `• <b>سوسو:</b> <b>${stats.sosoStreakDays} يوم</b> (${stats.sosoStreakHours} ساعة) | 🏆 أطول صمود: ${stats.longestSoso} يوم\n`;
    msg += `• <b>بوبو:</b> <b>${stats.boboStreakDays} يوم</b> (${stats.boboStreakHours} ساعة) | 🏆 أطول صمود: ${stats.longestBobo} يوم\n\n`;
    msg += `🏆 <b>محطة التعافي الحالية (المسار العصبي):</b>\n`;
    msg += `📌 <b>${stats.currentMilestone.title}</b>\n`;
    msg += `📊 <b>نسبة الإنجاز نحو 90 يوماً:</b> ${stats.currentMilestone.progressPct}%\n\n`;
    msg += `🛡️ <b>مرات صد الشهوة والانتصار (Urges Defeated):</b> <b>${stats.urgesResisted} مرة</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `👑 <i>"كل يوم نظيف تبنيه هو مسار عصبي جديد يعيد لك حدة ذهنك وقوة حضورك كطبيب عظيم!"</i> 🩺✨`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🆘 زر النجدة العاجلة (Urge Surfing)', callback_data: 'launch_urge_surfing' }],
        [{ text: '🛡️ تسجيل انتصار على الرغبة (+50 XP)', callback_data: 'resisted_urge_ack' }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'menu_main' }]
      ]
    };

    return ctx.reply(msg, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  bot.action('purity_check_streak', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery().catch(() => {});

    const stats = await getAdminPurityStats(fromId);
    let msg = `🔥 <b>شعلة النقاء الحالية يا دكتور:</b>\n`;
    msg += `• <b>سوسو:</b> <b>${stats.sosoStreakDays} يوم</b> (أطول رقم: ${stats.longestSoso} يوم)\n`;
    msg += `• <b>بوبو:</b> <b>${stats.boboStreakDays} يوم</b> (أطول رقم: ${stats.longestBobo} يوم)\n`;
    msg += `🛡️ <b>مرات صد الاشتهاء:</b> ${stats.urgesResisted} مرات | 🎯 <b>المرحلة:</b> ${stats.currentMilestone.title}`;

    return ctx.reply(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🆘 زر النجدة (Urge Surfing)', callback_data: 'launch_urge_surfing' }],
          [{ text: '🛡️ انتصرت على الرغبة (+50 XP)', callback_data: 'resisted_urge_ack' }]
        ]
      }
    });
  });

  bot.action('launch_urge_surfing', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🌊 تم تفعيل ركوب الموجة!').catch(() => {});

    let msg = `🌊 <b>بروتوكول ركوب الموجة (Urge Surfing) — 180 ثانية لكسر الاشتهاء:</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `1️⃣ <b>لا تقاوم الشهوة بعنف ولا تستسلم لها:</b> راقب الشعور كأنه موجة في البحر ستصعد وتتلاشى وحدها بعد دقائق قليلة.\n`;
    msg += `2️⃣ <b>تمرين التنفس العصبي (Vagus Nerve Reset):</b>\n`;
    msg += `   • خذ شهيقاً عميقاً من الأنف (4 ثوانٍ).\n`;
    msg += `   • اكتم النفس بهدوء (7 ثوانٍ).\n`;
    msg += `   • أخرج الزفير ببطء شديد من الفم كأنك تنفخ شمعة (8 ثوانٍ).\n`;
    msg += `3️⃣ <b>صدمة حسية:</b> اغسل معصميك ووجهك بماء بارد جداً.\n`;
    msg += `4️⃣ <b>تحرك فوراً:</b> غير مكانك، اخرج من الغرفة، أو العب 20 عدة ضغط.\n\n`;
    msg += `👇 <i>بمجرد انكسار الموجة اضغط على الزر أدناه لتوثيق انتصارك ونقاط الـ XP:</i>`;

    return ctx.reply(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛡️ انتصرت على الرغبة وكسرت الموجة (+50 XP)', callback_data: 'resisted_urge_ack' }],
          [{ text: '🔥 شعلة النقاء', callback_data: 'purity_check_streak' }]
        ]
      }
    });
  });

  bot.action('resisted_urge_ack', async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    const newCount = await logAdminUrgeResisted(fromId);
    await ctx.answerCbQuery('👑 بطل! تم توثيق الانتصار +50 XP').catch(() => {});

    let msg = `🎉 <b>انتصار عظيم على الشهوة يا د. عبدالله! 🛡️👑</b>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⭐ <b>تم منحك:</b> <b>+50 Doctor XP</b> لحسابك!\n`;
    msg += `🛡️ <b>إجمالي مرات صد موجات الاشتهاء:</b> <b>${newCount} مرة</b>\n\n`;
    msg += `🧠 <i>بهذه اللحظة قمت بإضعاف المسار العصبي القديم وتقوية قشرة الفص الجبهي في دماغك! استمر يا بطل!</i> 🔥`;

    return ctx.reply(msg, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 فحص شعلة النقاء', callback_data: 'purity_check_streak' }],
          [{ text: '✨ وقود التميز الإيماني والنقاء', callback_data: 'get_purity_fuel' }],
          [{ text: '🏠 القائمة الرئيسية', callback_data: 'menu_main' }]
        ]
      }
    });
  });

  // ==============================================================================
  // 👑 Statesman, Caliph Formation, & Sharia Sciences Handlers (Admin Only)
  // ==============================================================================
  
  // 1. Statesman & Caliph Formation
  bot.command(['caliph', 'statesman', 'leader', 'حاكم', 'خليفة'], async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return;

    const pearl = getRandomStatesmanPearl();
    const keyboard = {
      inline_keyboard: [
        [{ text: '🏛️ فقرة أخطاء الذين مضوا', callback_data: 'get_statesman_mistake' }],
        [{ text: '👑 كبسولة قيادية جديدة', callback_data: 'get_statesman_pearl' }],
        [{ text: '📖 كبسولة علم شرعي', callback_data: 'get_sharia_capsule' }]
      ]
    };
    return ctx.reply(pearl.formattedText, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  // 2. Mistakes of Past Rulers (أخطاء الذين مضوا)
  bot.command(['mistakes', 'أخطاء_الذين_مضوا', 'سقطات_الحكام'], async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return;

    const mistake = getRandomPastRulerMistake();
    const keyboard = {
      inline_keyboard: [
        [{ text: '📜 خطأ تاريخي آخر للحكام', callback_data: 'get_statesman_mistake' }],
        [{ text: '👑 كبسولة صناعة رجل الدولة', callback_data: 'get_statesman_pearl' }]
      ]
    };
    return ctx.reply(mistake.formattedText, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  // 3. Essential Sharia Sciences (ما لا يسع المسلم جهله)
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
  });

  // 4. Purity Spiritual Fuel (وقود النقاء والتميز الإيماني)
  bot.command(['fuel', 'عفة', 'تميز', 'وقود_النقاء'], async (ctx) => {
    const fromId = ctx.from?.id;
    if (Number(fromId) !== ADMIN_CHAT_ID) return;

    const fuel = getRandomPuritySpiritualFuel('د. عبدالله');
    const keyboard = {
      inline_keyboard: [
        [{ text: '✨ حديث ونبضة عفة أخرى', callback_data: 'get_purity_fuel' }],
        [{ text: '🔥 شعلة النقاء', callback_data: 'purity_check_streak' }],
        [{ text: '🆘 زر النجدة (Urge Surfing)', callback_data: 'launch_urge_surfing' }]
      ]
    };
    return ctx.reply(fuel.formattedText, { parse_mode: 'HTML', reply_markup: keyboard });
  });

  // Action callbacks
  bot.action('get_statesman_mistake', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('📜 درس من أخطاء الحكام!').catch(() => {});
    const mistake = getRandomPastRulerMistake();
    return ctx.reply(mistake.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📜 درس تاريخي آخر', callback_data: 'get_statesman_mistake' }],
          [{ text: '👑 كبسولة صناعة القائد', callback_data: 'get_statesman_pearl' }]
        ]
      }
    });
  });

  bot.action('get_statesman_pearl', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('👑 كبسولة رجل الدولة!').catch(() => {});
    const pearl = getRandomStatesmanPearl();
    return ctx.reply(pearl.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏛️ فقرة أخطاء الذين مضوا', callback_data: 'get_statesman_mistake' }],
          [{ text: '👑 كبسولة قيادية أخرى', callback_data: 'get_statesman_pearl' }]
        ]
      }
    });
  });

  bot.action('get_sharia_capsule', async (ctx) => {
    await ctx.answerCbQuery('📖 كبسولة علم شرعي!').catch(() => {});
    const capsule = getRandomShariaCapsule();
    return ctx.reply(capsule.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📖 كبسولة شرعية أخرى', callback_data: 'get_sharia_capsule' }]
        ]
      }
    });
  });

  bot.action('get_purity_fuel', async (ctx) => {
    if (Number(ctx.from?.id) !== ADMIN_CHAT_ID) return ctx.answerCbQuery('غير مصرح لك').catch(() => {});
    await ctx.answerCbQuery('🛡️ وقود النقاء والسيادة!').catch(() => {});
    const fuel = getRandomPuritySpiritualFuel('د. عبدالله');
    return ctx.reply(fuel.formattedText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✨ وقود عفة آخر', callback_data: 'get_purity_fuel' }],
          [{ text: '🔥 شعلة النقاء', callback_data: 'purity_check_streak' }]
        ]
      }
    });
  });

}

