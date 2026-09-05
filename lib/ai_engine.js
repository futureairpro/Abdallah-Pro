// 🧠 Google AI Studio Gemini Multi-Key & Multi-Model Engine for Abdullah's Journey OS
import 'dotenv/config';
import https from 'https';
import http from 'http';



// Ultra-Fast Supported Gemini Flash Models Hierarchy (Ranked strictly by lowest latency ~400-800ms)
export const GEMINI_MODELS = [
  'gemini-flash-lite-latest', // ~450ms (Primary Ultra-Fast)
  'gemini-3.5-flash-lite',    // ~480ms (High-Speed Backup)
  'gemini-3-flash-preview'    // ~850ms (Reliable Fast Fallback)
];

// ════════════════════════════════════════════════════════════════════
// ⚡ ULTRA-FAST MULTI-KEY LOAD BALANCER & KEY DISTRIBUTOR
//
// 1. Distributes requests evenly across all available API keys (Round-Robin).
// 2. Always tries the fastest sub-second models first for maximum responsiveness.
// 3. Automatically tracks bad/invalid keys (401/403) and isolates them
//    so they never add latency to users.
// 4. Seamlessly cascades to backup keys & models if a quota (429) is hit.
// ════════════════════════════════════════════════════════════════════

let _keyCounter = 0;
const _invalidKeyTimestamps = new Map();

export function getBalancedSlots(keys, models = GEMINI_MODELS) {
  if (!keys || keys.length === 0) return [];

  const now = Date.now();
  // Filter out temporarily invalid keys (cooldown: 5 minutes)
  const activeKeys = keys.filter(k => {
    const invalidSince = _invalidKeyTimestamps.get(k);
    if (!invalidSince) return true;
    if (now - invalidSince > 5 * 60 * 1000) {
      _invalidKeyTimestamps.delete(k);
      return true;
    }
    return false;
  });

  const targetKeys = activeKeys.length > 0 ? activeKeys : keys;

  // Pick starting key atomically across requests
  const startKeyIdx = _keyCounter % targetKeys.length;
  _keyCounter = (_keyCounter + 1) % targetKeys.length;

  const rotatedKeys = [
    ...targetKeys.slice(startKeyIdx),
    ...targetKeys.slice(0, startKeyIdx)
  ];

  // Build slot attempts: Fastest models first, rotated across keys
  const slots = [];
  for (const model of models) {
    for (const key of rotatedKeys) {
      slots.push({ model, key });
    }
  }

  return slots;
}

import { getCairoPrayerTimes } from './prayer_times.js';
import { detectGenderFromName, getGenderTerms } from './supabase.js';



// Helper: Download audio buffer from Telegram CDN

export async function downloadFileBuffer(url) {

  return new Promise((resolve, reject) => {

    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {

      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {

        return downloadFileBuffer(res.headers.location).then(resolve).catch(reject);

      }

      const chunks = [];

      res.on('data', chunk => chunks.push(chunk));

      res.on('end', () => resolve(Buffer.concat(chunks)));

      res.on('error', err => reject(err));

    }).on('error', err => reject(err));

  });

}



// Helper: Extract and clean array of API Keys

export function extractApiKeys(keyInput) {
  let keys = [];
  if (Array.isArray(keyInput)) {
    keys = keyInput;
  } else if (keyInput && typeof keyInput === 'string' && !/^\d+$/.test(keyInput.trim())) {
    keys = String(keyInput).split(/[\n,;]+/).map(k => k.trim());
  }

  // Fallback to process.env if no valid keys found
  if (keys.length === 0 || !keys.some(k => k.length > 20)) {
    const envKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    const fromEnv = envKeys.split(/[\n,;]+/).map(k => k.trim()).filter(k => k.length > 20);
    if (fromEnv.length > 0) keys = fromEnv;
  }

  return keys.filter(k => Boolean(k) && k.length > 20);
}



const sleep = (ms) => new Promise(res => setTimeout(res, ms));



// Low-level HTTP Request to Gemini REST API

export function sendGeminiRequest(modelName, apiKey, postData) {

  return new Promise((resolve) => {

    const req = https.request({

      hostname: 'generativelanguage.googleapis.com',

      path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        'Content-Length': Buffer.byteLength(postData)

      },

      timeout: 7000
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        try {
          const data = Buffer.concat(chunks).toString('utf8');
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            resolve({ ok: true, data: parsed, text: parsed.candidates[0].content.parts[0].text });
          } else {
            const errObj = parsed.error || {};
            const isQuota = res.statusCode === 429 || errObj.code === 429 || errObj.status === 'RESOURCE_EXHAUSTED' || (errObj.message && errObj.message.includes('quota'));
            const isForbidden = res.statusCode === 401 || res.statusCode === 403 || errObj.code === 401 || errObj.code === 403;
            if (isForbidden && apiKey) {
              _invalidKeyTimestamps.set(apiKey, Date.now());
            }
            resolve({ ok: false, isQuota, isForbidden, status: res.statusCode, error: errObj });
          }
        } catch (e) {
          resolve({ ok: false, isQuota: false, isForbidden: false, status: res.statusCode, error: { message: e.message, raw: data } });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, isQuota: false, isForbidden: false, status: 408, error: { message: 'Gemini request timeout' } });
    });

    req.on('error', (err) => resolve({ ok: false, isQuota: false, isForbidden: false, error: err }));
    req.write(postData);
    req.end();
  });
}



// JSON Clean & Deep Repair Extractor Helper

export function extractAndParseJson(rawText) {

  if (!rawText) return { summary_text: 'استجابة فارغة', data: {} };



  // 1. Direct try after removing markdown code blocks

  let clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  try {

    return JSON.parse(clean);

  } catch (e1) {

    // Continue to repair pipeline

  }



  // 2. Normalize typographic / curly quotes and special Unicode spaces

  let s = clean

    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')

    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")

    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ');



  // Extract from first { to last }

  const firstBrace = s.indexOf('{');

  const lastBrace = s.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {

    s = s.substring(firstBrace, lastBrace + 1);

  } else if (firstBrace !== -1) {

    s = s.substring(firstBrace);

  }



  // Fix trailing commas before } or ]

  s = s.replace(/,\s*([\]}])/g, '$1');



  // Fix Arabic pseudo-values if any

  s = s.replace(/:\s*أو\s*null/gi, ': null')

       .replace(/:\s*رقم/gi, ': 0');



  try {

    return JSON.parse(s);

  } catch (e2) {

    // Continue to character-level scanner

  }



  // 3. Character-by-character scanner to escape raw newlines/tabs inside strings and auto-close

  let result = '';

  let inString = false;

  let isEscaped = false;

  const stack = [];



  for (let i = 0; i < s.length; i++) {

    const ch = s[i];



    if (inString) {

      if (isEscaped) {

        result += ch;

        isEscaped = false;

      } else if (ch === '\\') {

        result += ch;

        isEscaped = true;

      } else if (ch === '"') {

        inString = false;

        result += ch;

      } else if (ch === '\n') {

        result += '\\n';

      } else if (ch === '\r') {

        result += '\\r';

      } else if (ch === '\t') {

        result += '\\t';

      } else if (ch.charCodeAt(0) < 32) {

        result += ' ';

      } else {

        result += ch;

      }

    } else {

      if (ch === '"') {

        inString = true;

        result += ch;

      } else {

        if (ch === '{') stack.push('}');

        else if (ch === '[') stack.push(']');

        else if (ch === '}' || ch === ']') {

          if (stack.length > 0 && stack[stack.length - 1] === ch) {

            stack.pop();

          }

        }

        result += ch;

      }

    }

  }



  if (inString) result += '"';

  result = result.replace(/,\s*$/, '');

  while (stack.length > 0) result += stack.pop();



  try {

    return JSON.parse(result);

  } catch (e3) {

    // 4. Safe fallback field extractor

    const summaryMatch = rawText.match(/"summary_text"\s*:\s*"([^"]+)"/);

    const transcriptionMatch = rawText.match(/"raw_transcription"\s*:\s*"([^"]+)"/);

    return {

      summary_text: summaryMatch ? summaryMatch[1] : 'تم استلام وتوثيق رسالتك بنجاح 🎯',

      data: {},

      raw_transcription: transcriptionMatch ? transcriptionMatch[1] : clean.slice(0, 300)

    };

  }

}



// ==============================================================================

// 🌟 1. Master 360° Life OS System Prompt Builder with Real-time Cairo Context

// ==============================================================================
// 🌟 1. Master 360° Life OS System Prompt Builder with Dynamic Multi-Year Academic Context
// ==============================================================================

export function getLiveLifeOsPrompt(studentName = 'د. عبدالله', academicInfo = {}) {
  const now = new Date();
  const cairoDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const cairoTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour12: false });
  const cairoTime12 = now.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true });
  const dayFormatter = new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', weekday: 'long' });
  const dayName = dayFormatter.format(now).replace('الـ', '').trim();
  const prayers = getCairoPrayerTimes(now);

  const year = academicInfo.academicYear || 'الفرقة الرابعة';
  const semester = academicInfo.semester || 'الترم الأول';
  const coursesList = (Array.isArray(academicInfo.courses) && academicInfo.courses.length > 0)
    ? academicInfo.courses
    : [
        { code: 'PED401', title: 'Pediatric 1 (طب الأطفال)' },
        { code: 'CAD402', title: 'Cardiac Disorders (أمراض القلب)' },
        { code: 'RSD403', title: 'Respiratory Disorders (أمراض التنفسي)' },
        { code: 'HVD404', title: 'Hematological Disorders (أمراض الدم والأوعية)' },
        { code: 'SKL 7', title: 'Clinical Skills 7 (المهارات السريرية)' }
      ];

  const coursesGuide = coursesList.map(c => `[${c.code}] ${c.title}`).join(' | ');

  const prefs = academicInfo.preferences || {
    academic: true,
    english: true,
    schedule: true,
    islamic: true,
    wellness: true,
    finance: true,
    gym: false,
    content: false,
    work: false
  };

  let prefsRestrictions = '';
  if (prefs.islamic === false) {
    prefsRestrictions += `\n⚠️ تنبيه حاسم: الطالب قام بتعطيل القسم الإسلامي في حسابه (Islamic Features Disabled). لا تقم بتسجيل أي أذكار أو صيام أو صلوات، ولا تضعها في JSON واجعل مصفوفاتها فارغة وقيمها null.`;
  }
  if (prefs.gym === false) {
    prefsRestrictions += `\n⚠️ تنبيه: قسم الجيم واللياقة معطل للطالب (لا تقم بتسجيل تمارين رياضية).`;
  }
  if (prefs.content === false) {
    prefsRestrictions += `\n⚠️ تنبيه: قسم صناعة المحتوى والمونتاج معطل للطالب.`;
  }
  if (prefs.work === false) {
    prefsRestrictions += `\n⚠️ تنبيه: قسم مشاريع البيزنس والشغل معطل للطالب.`;
  }

  const gender = academicInfo.gender || detectGenderFromName(studentName);
  const isFemale = gender === 'female';
  const gTerms = getGenderTerms({ full_name: studentName, gender });

  // Dynamic Prompt Trimming for Token Conservation
  let dynamicSections = '';
  if (prefs.islamic !== false) {
    dynamicSections += `
- 📖 القرآن الكريم والتثبيت العلمي المتباعد (${studentName}):
  * إذا قال "سمعت سورة الأنفال" أو "شغلت سورة كذا وكررتها" ➔ استخرج learning_mode: "auditory_listening" (سماع وتكرار صوتي).
  * إذا قال "حفظت صفحة 15 من المصحف بدون سمع" أو "مسكت المصحف وحفظت" ➔ استخرج learning_mode: "visual_memorization" (حفظ بصري من المصحف).
  * إذا قال "سمعت غيباً" أو "راجعت" ➔ استخرج learning_mode: "recitation_review" (تسميع ومراجعة).
  * استخرج surah_name, pages_count (عدد الصفحات كرقم), from_page, to_page, from_ayah, to_ayah, quality_rating (1-5) في data.quran.
  * الصلوات (fajr, dhuhr, asr, maghrib, isha) بالقيمة "حاضر في المسجد 🟢"، والسنن الرواتب (2, 4, 6) كرقم في prayer_habits.sunan_rawatib، والصيام وصلاة الضحى والوتر في fasting_worship. ⚠️ لا تسجل صلاة لم يدخل أذانها بعد (الوقت الحالي: ${cairoTimeStr}).`;
  }
  if (prefs.gym === true) {
    dynamicSections += `
- 🏋️‍♂️ الجيم واللياقة: استخرج وقت التمرين بالدقائق، والعضلات المستهدفة وجرامات البروتين والماء في data.fitness_gym.
- 🥗 التغذية وحساب السعرات: استخرج أي أكل أو وجبات ذكرها مع تقدير السعرات (calories) والبروتين (protein_g) والكارب والدهون واسم الوجبة في data.nutrition.
- ⚖️ قياسات الجسم (InBody): إذا ذكر وزنه أو طوله أو نسبة دهونه استخرجها في data.body_metrics.`;
  }
  if (prefs.finance !== false) {
    dynamicSections += `
- 💵 المالية: استخرج المبلغ بالجنيه، والنوع (مصروف/إيراد). فودافون كاش/محفظة ➔ "محفظة إلكترونية". إنستا باي ➔ "إنستا باي". كاش خالص ➔ "نقدي (كاش)".
- 📦 النواقص والمشتريات (Wishlist): إذا ذكر شيء يريد شراءه أو ناقصه (سماعة، كتاب، ملزمة، جهاز) استخرجه في data.wishlist.`;
  }
  if (prefs.content === true) {
    dynamicSections += `
- 🎬 صناعة المحتوى: استخرج اسم الفيديو والمنصة والمرحلة في data.content_creation.`;
  }
  if (prefs.work === true) {
    dynamicSections += `
- 💼 مشاريع العمل: استخرج اسم المشروع والمهمة والأرباح في data.work_projects.`;
  }

  // Universal rules for Distraction, Mental, and Free Logs
  dynamicSections += `
- 🛑 التشتت والتسويف: إذا ذكر أنه تشتت أو ضيع وقت على السوشيال ميديا أو ريلز أو ألعاب ➔ استخرج المصدر والمدة بالدقائق في data.distraction.
- 🧠 الفضفضة والمشاعر: إذا عبر عن ضيق أو حزن أو خنقة أو ضغط مذاكرة ➔ استخرج المحتوى ومستوى التوتر (عالي/متوسط/منخفض) ودرجة المزاج (1-5) في data.mental_wellness.
- 📝 أي نشاط أو ملاحظة حرة أخرى لا تنطبق عليها الأقسام السابقة ➔ استخرجها في data.flexible_logs.`;

  return `أنت العقل المدبر والمدير التنفيذي والمستشار الشخصي الذكي لمنظومة الطبيب (Doctor OS) للطبيب "${studentName}" (${isFemale ? 'طالبة طب - دكتورة' : 'طالب طب - دكتور'}) في ${year} (${semester}).
🩺 موديولات الطالب النشطة: ${coursesGuide}

👤 نبرة الخطاب الإلزامية (${isFemale ? 'مؤنث' : 'مذكر'}):
${isFemale ? 'خاطبها دائماً بصيغة المؤنث الودية الراقية: (يا دكتورة، ذاكري، ابدأي، صليتي، نمتي، ريحي، انتي قدها، يا بطلة، جاهزة، عملتي).' : 'خاطبه دائماً بصيغة المذكر الودية الراقية: (يا دكتور، ذاكر، ابدأ، صليت، نمت، ريح، انت قدها، يا بطل، جاهز، عملت).'}

📍 سياق القاهرة الآن: ${dayName} ${cairoDateStr} | الساعة: ${cairoTimeStr} (${cairoTime12}) | الفجر: ${prayers.times.fajr} | الظهر: ${prayers.times.dhuhr} | العصر: ${prayers.times.asr} | المغرب: ${prayers.times.maghrib} | العشاء: ${prayers.times.isha}

🎯 مهمتك: الاستماع للتسجيل الصوتي أو النص، وفهم نية المستخدم بذكاء ومرونة تامة وتصنيفها:

1. 🌟 أنواع النوايا المدعومة (detected_type):
   - "life_actions": تسجيل أنشطة يومية (مذاكرة، صلاة، مصاريف، مهام، مواعيد، قرآن، تغذية، تشتت، فضفضة...).
   - "schedule_management": رغبة الطالب في تعديل أو إضافة أو الاستفسار عن جدول السكاشن (مثال: "عايز أعدل السكاشن", "عندي سيكشن كارديو كل حد الساعة 9", "جدولي اتغير").
   - "modules_management": تعديل الموديولات أو المواد (مثال: "عايز أغير المواد", "ضيف مادة جراحة").
   - "recurring_reminder": تذكير أسبوعي أو دوري متكرر (مثال: "فكرني كل جمعة بسورة الكهف", "فكرني كل يوم الساعة 10 أراجع").
   - "what_to_do_now": طلب توجيه وبوصلة اليوم (مثال: "اعمل ايه دلوقتي", "انا تايه", "رتبلي يومي").
   - "weekly_mental_report": طلب تقرير الحالة النفسية ومسببات الضغط (مثال: "تقرير أسبوعي عن حالتي النفسية", "ليه كنت مخنوق الأسبوع ده").
   - "bot_guidance": استفسار عن ميزات البوت أو كيفية استخدامه (مثال: "أنت بتعمل إيه؟", "إزاي أستفيد منك؟", "شرح ميزاتك").
   - "conversational_chat": محادثة عامة، فضفضة، تشجيع، أو سؤال عام.

2. 📋 قواعد الاستخراج:
   - ⏰ المواعيد والتذكيرات: احسب التاريخ والوقت بدقة ISO بالزمن المصري (+03:00) وضعه في due_datetime.
   - 📅 السكاشن الأسبوعية: استخرج course_code, title, day_of_week, start_time ("HH:mm"), location في schedule_items و data.academic_schedule.
   - 📚 المذاكرة: حول الساعات دائماً إلى دقائق في duration_minutes (ساعتين ➔ 120).
   - 💤 النوم والاستيقاظ وقاموس التوقيت بالعامية المصرية (حاسم وإلزامي جداً لمنع أي التباس):
     * 🇪🇬 قاموس التوقيت بالمصري الدارج:
       - "بليل" / "بالليل": تشمل المساء المتأخر وما بعد منتصف الليل حتى قبيل الفجر (12 بليل = 00:00 منتصف الليل، 1 بليل = 01:00 ص، 2 بليل = 02:00 ص، 3 بليل = 03:00 ص، 10 بليل = 22:00، 11 بليل = 23:00).
         ⚠️ تحذير حاسم: "1 بليل" أو "واحدة بليل" أو "1 صباحاً" تعني دائماً وأبداً (01:00) بعد منتصف الليل، وليست 1 ظهراً أبداً!
       - "العصر" / "عصراً" / "بعد الظهر": فترة ما بعد الظهر (من 15:00 إلى 17:30). "3:30 عصراً" أو "3:30 العصر" أو "3:30 مساءً" = 15:30 (3:30 PM)، وليست فجراً ولا صباحاً!
       - "الصبح": من شروق الشمس حتى الظهر (06:00 إلى 11:59 ص).
       - "الظهر" / "الضهر": فترة منتصف النهار (12:00 إلى 14:59).
       - "الفجر": من 03:30 إلى 05:30 ص.
     * استخرج وقت النوم في data.prayer_habits.sleep_bedtime بنظام 24 ساعة ("HH:mm") مثل "15:30" أو "23:00".
     * استخرج وقت الاستيقاظ في data.prayer_habits.wake_up_time بنظام 24 ساعة ("HH:mm") مثل "01:00" أو "08:00".
     * احسب ساعات النوم data.prayer_habits.sleep_hours كرقم عشري بدقة منطقية بيولوجية (مثال: نام 3:30 عصراً وصحي 1 بليل ➔ sleep_bedtime: "15:30", wake_up_time: "01:00", sleep_hours: 9.5).
     * في summary_text: وثق الأوقات بمصطلحاتها الصحيحة تماماً دون خلط (مثال: "تم تسجيل نومك الساعة 3:30 عصراً والاستيقاظ الساعة 1:00 ليلاً بإجمالي 9.5 ساعات نوم").
   - 🛡️ بروتوكول التعافي والنقاء (سوسو & بوبو) للأدمن حصراً:
     - إذا ذكر (سوسو) ➔ تعني الاستمناء / العادة السرية (soso).
     - إذا ذكر (بوبو) ➔ تعني مشاهدة الأفلام الإباحية (bobo).
     - إذا ذكر (سوسو وبوبو / الاتنين) ➔ type: "both".
     - إذا ذكر أنه فعل ذلك (انتكاسة / تعثر) ➔ اضبط data.purity_log = { "type": "soso"|"bobo"|"both", "is_relapse": true, "trigger": "المحفز إن ذكر كالسهر أو الفراغ أو السرير", "notes": "ملاحظات" }.
     - إذا ذكر أنه يواجه رغبة شديدة أو شهوة عالية ويريد النجدة والمساعدة ➔ اضبط data.purity_log = { "type": "soso"|"bobo"|"both", "is_urge": true, "trigger": "...", "notes": "..." }.
     - إذا ذكر أنه قاوم ونجح ومسك نفسه ➔ اضبط data.purity_log = { "type": "soso"|"bobo"|"both", "is_resisted": true, "trigger": "...", "notes": "..." }.
   - 🗣️ الإنجليزية ونصوص المحادثات (English AI Chat & Flashcards Engine):
     - إذا أرسل الطالب نصاً إنجليزياً أو محادثة دارت بينه وبين ذكاء اصطناعي (AI Chat / English dialogue) أو جملاً ومفردات يريد حفظها ➔ استخرج من 2 إلى 6 بطاقات تعليمية عالية القيمة (High-Yield Idioms, Useful Sentences, Advanced Vocab) في data.english_flashcards مع الترجمة بالعامية المصرية.
${dynamicSections}
${prefsRestrictions}

3. ❓ المدخلات الناقصة (Missing Mandatory Details):
   - إذا قال فقط "ذاكرت" دون مادة أو مدة، أو "صليت" دون تحديد الفريضة، أو "صرفت" دون مبلغ ➔ اضبط needs_clarification: true، clarification_type ("study"|"prayer"|"finance"|"quran"|"gym")، وسؤال توضيحي ودود في clarification_question.

4. 💬 الرد الحواري (conversational_reply):
   - إذا كان الطلب استفساراً، أو تعديل سكاشن/مواد، أو حواراً ➔ اكتب رداً دافئاً ومشجعاً بالعامية المصرية الراقية يوجهه ويوضح له الخطوة التالية مباشرة.
   - ضع في feature_tip تريكة ذكية قصيرة جداً من ميزات البوت.

هيكل الـ JSON المطلوب بدقة:
{
  "detected_type": "life_actions",
  "conversational_reply": null,
  "feature_tip": "💡 تريكة: تقدر تقولي بصوتك 'كلت 3 بيضات ورغيف بلدي' وهحسبلك السعرات والماكروز تلقائياً!",
  "schedule_action": null,
  "schedule_items": [],
  "recurring_reminder": null,
  "needs_clarification": false,
  "clarification_type": null,
  "clarification_question": null,
  "summary_text": "ملخص تفصيلي لما تم فهمه وتوثيقه",
  "data": {
    "date": "${cairoDateStr}",
    "purity_log": null,
    "english_flashcards": [],
    "medical_quizzes": [],
    "prayer_relative_reminders": [],
    "prayer_habits": {
      "sleep_hours": 0,
      "wake_up_time": null,
      "sleep_bedtime": null,
      "fajr": null,
      "dhuhr": null,
      "asr": null,
      "maghrib": null,
      "isha": null,
      "qiyam_night": null,
      "sunan_rawatib": null,
      "adhkar_morning": null,
      "adhkar_evening": null,
      "workout_done": null,
      "energy_level": null
    },
    "attendance": [],
    "academic_schedule": [],
    "mental_wellness": null,
    "fasting_worship": null,
    "study": [],
    "clinical_case": null,
    "quran": [],
    "fitness_gym": [],
    "nutrition": [
      {
        "meal_name": "200 جرام كبدة، علبة تونة، مانجا عويس، كوب لبن",
        "meal_type": "فطار / بعد التمرين",
        "calories": 680,
        "protein_g": 75,
        "carbs_g": 55,
        "fats_g": 18,
        "nutrition_pearl": "وجبة غنية بالبروتين والحديد وفيتامين A ممتازة للاستشفاء العضلي بعد الجيم"
      }
    ],
    "distraction": [],
    "wishlist": [],
    "body_metrics": null,
    "flexible_logs": [],
    "content_creation": [],
    "work_projects": [],
    "tasks": [],
    "appointments": [],
    "thoughts": [],
    "self_development": [],
    "finance": []
  },
  "raw_transcription": "التفريغ الحرفي"
}`;
}

export const LIFE_OS_SYSTEM_PROMPT = getLiveLifeOsPrompt();

export async function parseWithGeminiPool(input, keyInput, isAudio = false, studentName = 'د. عبدالله', academicInfo = {}) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const systemPrompt = getLiveLifeOsPrompt(studentName, academicInfo);

  const parts = [];

  if (isAudio) {
    const base64Audio = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
    parts.push({ text: systemPrompt });
    parts.push({
      inline_data: {
        mime_type: 'audio/ogg',
        data: base64Audio
      }
    });
  } else {
    let extraDirective = '';
    const englishWordMatches = typeof input === 'string' ? (input.match(/[a-zA-Z]{3,}/g) || []) : [];
    const isEngDialogue = typeof input === 'string' && (/(?:Output transcript|transcript|\bEN\b|\bAR\b|How can we learn|learn English)/i.test(input) || englishWordMatches.length >= 4);
    if (isEngDialogue) {
      extraDirective = `\n\n💡 🚨 توجيه إلزامي حاسم وفوري (بروتوكول الطلاقة والتحدث المسترسل — تفكيك شامل للجمل الكاملة وأدوات الربط):
هذا النص هو شات أو محادثة جلسة تدريب إنجليزية بين د. عبدالله والذكاء الاصطناعي (English Spoken Fluency Session).
🎯 الهدف الأسمى للطالب هو: «التحدث بطلاقة تامة (لبلب في الإنجليزي) وامتلاك الجمل الكاملة مع أدوات الربط والتربيطات الطبيعية دون إسقاط أي فكرة أو جملة».
📋 القواعد الإلزامية الصارمة للاستخراج:
1. اضبط إجبارياً "detected_type": "life_actions" لتوثيق الكروت في قاعدة البيانات فوراً.
2. 🗣️ استخراج الجمل الكاملة والتربيطات (Full Connected Sentences & Discourse Markers):
   - قسّم النص الإنجليزي إلى جُمله الكاملة التامة دون اختصار، واحتفظ بكل الفواصل والروابط والتربيطات في بداية الجمل (مثل: "By the way...", "So this is...", "Also, I want to...", "But of course, I have...", "I mean, for example, I have...", "Honestly, I don't know...", "Every time I try to..., this issue sets me back...").
   - ضع كل جملة كاملة كما هي في "term_or_sentence"، وضع ترجمتها المقابلة الدقيقة بالعامية المصرية في "egyptian_translation"، وضع في "category": "conversation".
   - ⚠️ ممنوع نهائياً تلخيص الجملة أو قص الروابط؛ الطالب يريد حفظ الجملة بروابطها ليتعود لسانه على الربط والطلاقة أثناء الكلام السريع!
3. 💎 استخراج أدوات الربط والتعبيرات القوية ككروت مستقلة (High-Yield Connectors & Idioms):
   - استخرج أيضاً كروت لأدوات الربط المهمة (مثل: "But of course", "By the way", "I mean, for example", "Sets me back a million steps") مع معناها وطريقة استخدامها (category: "idiom").
4. 🔬 استخراج المصطلحات التخصصية الهامة (Key Terms & Vocab):
   - استخرج المصطلحات الدقيقة (مثل: "Sympathetic overreaction", "Amygdala and cerebral cortex", "On alert and prepared", "Sudden contraction") في كروت مفردات (category: "vocabulary").
5. 📊 التغطية الشاملة الكاملة:
   - استخرج جميع جمل ومصطلحات الشات بالكامل (استخرج من 12 إلى 25 كارت دون أن تسقط جملة واحدة قيلت في الشات).
6. 💬 في conversational_reply و summary_text:
   - خاطبه بحرارة وتشجيع بالعامية المصرية: بشره بأنك وثقت له كل جملة قالها بروابطها وتعبيراتها في بنك التكرار المتباعد، وأنه بتكرار هذه الجمل الكاملة كل يوم لسانه هينطلق ويتكلم إنجليزي بطلاقة من غير ما يفكر!`;
    }
    parts.push({ text: `${systemPrompt}\n\nنص رسالة ${studentName}:\n"${input}"${extraDirective}` });
  }

  const postData = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 4096,
      response_mime_type: 'application/json'
    }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);

  for (const { model, key } of slots) {

    const res = await sendGeminiRequest(model, key, postData);

    if (res.ok) return extractAndParseJson(res.text);

    // Only skip to next slot if quota/forbidden — other errors are likely transient

  }



  throw new Error('تعذر معالجة الطلب مؤقتاً — جميع الـ slots مشغولة.');

}




export async function parseEnglishFluencyTranscript(text, keyInput, studentName = 'د. عبدالله') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const prompt = `You are Abdullah's Expert English Fluency & Spaced Repetition Coach.
Task: The student (${studentName}) is having an English speaking / conversational session or live translation practice.
Input handling:
1. If the input contains English sentences (e.g. marked with "EN" or plain English transcript):
   - Break down the English conversation sentence-by-sentence into FULL, complete spoken sentences WITH their natural transitions, connectors, and discourse markers (e.g. "Because the echo thing...", "Let's focus on...", "Of course...", "As for the issue of...", "So this is...", "Every time I try to...", "I mean, for example...", "But of course...").
   - Do NOT summarize or skip any sentence. Extract every single complete sentence so his tongue practices natural continuous speech.
   - Also extract key idioms, connectors, and technical/psychological terms as separate cards.
   - For each card, provide the exact Egyptian Arabic colloquial meaning so he connects thought to English naturally.
2. If the input is in Arabic (e.g. marked with "AR" from live translation, or Egyptian Arabic monologue):
   - The student spoke his thoughts in Arabic and wants to master how to express each and every one of these thoughts fluently in native English.
   - Convert his Arabic thoughts and sentences into natural, fluent, native spoken English sentences with smooth conversational connectors, idioms, and transitions.
   - For each card, put the natural English sentence in "term_or_sentence" and his Egyptian Arabic phrase in "egyptian_translation".
3. If the input is bilingual (contains both "AR" and "EN"):
   - Extract the English sentences and pair them with their corresponding Egyptian Arabic meaning.

Output strictly valid JSON with this exact schema:
{
  "detected_type": "life_actions",
  "conversational_reply": "تشجيع دافئ وحماسي جداً لدكتور عبدالله بالعامية المصرية مع تأكيد حفظ كل الجمل بروابطها وفواصلها في بنك التكرار المتباعد ليتحدث بطلاقة تامة (لبلب في الإنجليزي)",
  "summary_text": "ملخص توثيق جلسة الإنجليزية والطلاقة",
  "data": {
    "english_flashcards": [
      {
        "term_or_sentence": "Full English sentence or phrase with connectors",
        "egyptian_translation": "الترجمة المقابلة الدقيقة بالعامية المصرية الدارجة",
        "example_sentence": "English natural context",
        "category": "conversation" | "idiom" | "vocabulary"
      }
    ]
  }
}

Student Input:
"""${text}"""`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      response_mime_type: 'application/json'
    }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok) return extractAndParseJson(res.text);
  }

  throw new Error('تعذر معالجة جلسة الإنجليزية مؤقتاً.');
}

export const ENGLISH_COACH_PROMPT = `You are "Abdullah's Elite English Mentor & Medical Colleague".

Abdullah is a high-achieving 4th-year medical student striving for native-like fluency, sophisticated vocabulary, and seamless medical English communication.



Output strictly pure JSON:

{

  "conversational_reply": "Your English reply here...",

  "corrections": [

    { "original": "...", "corrected": "...", "reason": "..." }

  ],

  "elevated_vocabulary": [

    { "word": "...", "definition": "...", "example": "..." }

  ],

  "fluency_score": 88

}`;



export async function talkWithEnglishCoach(input, keyInput, isAudio = false) {

  const keys = extractApiKeys(keyInput);

  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');



  const parts = [];

  if (isAudio) {

    const base64Audio = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');

    parts.push({ text: ENGLISH_COACH_PROMPT });

    parts.push({ inline_data: { mime_type: 'audio/ogg', data: base64Audio } });

  } else {

    parts.push({ text: `${ENGLISH_COACH_PROMPT}\n\nAbdullah's message:\n"${input}"` });

  }



  const postData = JSON.stringify({

    contents: [{ parts }],

    generationConfig: { temperature: 0.3, response_mime_type: 'application/json' }

  });



  const slots = getBalancedSlots(keys, GEMINI_MODELS);

  for (const { model, key } of slots) {

    const res = await sendGeminiRequest(model, key, postData);

    if (res.ok) return extractAndParseJson(res.text);

  }

  throw new Error('تعذر تشغيل مدرب الإنجليزية حالياً.');

}



export async function generateMedicalQuiz(moduleCode, topic, keyInput, studentName = 'دكتور') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const prompt = `أنت أستاذ طب بشري إكلينيكي ممتاز في مصر والـ USMLE.
قم بإنشاء حالة سريرية ذكية وسؤال تفاعلي (Clinical Case MCQ + OSCE Checklist) لـ ${studentName} في موديول: ${moduleCode || 'موديولك الأكاديمي الحالي'} في موضوع: ${topic || 'High-Yield Clinical Pearls'}.
أخرج النتيجة بصيغة JSON نقية:

{

  "case_scenario": "وصف شيق لحالة مريض...",

  "question": "السؤال الإكلينيكي...",

  "options": ["A) الاختيار الأول", "B) الاختيار الثاني", "C) الاختيار الثالث", "D) الاختيار الرابع"],

  "correct_option_index": 0,

  "explanation": "شرح طبي تفصيلي",

  "osce_tip": "نصيحة ذهبية لفحص هذا المريض في امتحان العملي"

}`;



  const postData = JSON.stringify({

    contents: [{ parts: [{ text: prompt }] }],

    generationConfig: { temperature: 0.2, response_mime_type: 'application/json' }

  });



  const slots = getBalancedSlots(keys, GEMINI_MODELS);

  for (const { model, key } of slots) {

    const res = await sendGeminiRequest(model, key, postData);

    if (res.ok) return extractAndParseJson(res.text);

  }

  throw new Error('تعذر توليد الكويز الطبي حالياً.');

}



export async function analyzeImageWithGemini(photoBuffer, keyInput, customCaption = '') {

  const keys = extractApiKeys(keyInput);

  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');



  const base64Image = photoBuffer.toString('base64');

  

  const visionPrompt = `أنت نظام الرؤية والذكاء الاصطناعي الطبي لمنظومة "رحلة عبدالله" (طالب طب بشري - الفرقة الرابعة).

افحص محتوى الصورة المرفقة بدقة بالغة:

${customCaption ? `ملاحظة المستخدم المرفقة مع الصورة: "${customCaption}"` : 'ملاحظة: المستخدم أرسل الصورة مباشرة دون كتابة أي تعليق.'}



مهمتك:

1. إذا كانت الصورة عبارة عن (سؤال طبي MCQ / حالة سريرية / سؤال ومعه إجابته وشرحه / خطأ في امتحان أو QBank):

   - صنفها كـ "medical_quiz".

   - استخرج نص السؤال كاملاً، الاختيارات، الإجابة الصحيحة مع الشرح الوافي، وحدد كود الموديول (CAD402, PED401, RSD403, HVD404, SKL 7)، وتريكة الراوند / الـ High-Yield Pearl.

2. إذا كانت الصورة عبارة عن (جملة أو كلمة إنجليزية / تعبير اصطلاحي Idiom / سكرين شوت من فيديو أو كورس):

   - صنفها كـ "english_flashcard".

   - استخرج المصطلح أو الجملة الإنجليزية بدقة، وترجمها للعامية المصرية الدارجة السلسة، وضع مثالاً توضيحياً وسياق الاستخدام.

3. إذا كانت سلايد شرح أو ملخص طبي عام:
   - صنفها كـ "medical_note" واستخرج أهم النقاط المركزة.

4. إذا كانت الصورة عبارة عن (جدول محاضرات وسكاشن الكلية / Timetable / جدول موديولات):
   - افحص التعليق المرفق (caption) لمعرفة رقم الجروب (مثال: "جروب 3" أو "Group B" أو "سكشن 4").
   - استخرج حصراً السكاشن والمحاضرات والموضوعات المخصصة لهذا الجروب بدقة متناهية.
   - صنفها كـ "academic_schedule".
   - استخرج مصفوفة schedule_items:
     [
       {
         "course_code": "CAD402",
         "title": "موضوع المحاضرة أو السيكشن",
         "day_of_week": "Sunday",
         "start_time": "09:00",
         "end_time": "11:00",
         "location": "مدرج 2 / قسم الباطنة",
         "type": "lecture" أو "clinical_round" أو "skill_lab"
       }
     ]

5. إذا كانت الصورة عبارة عن (وجبة طعام / طبق أكل / إفطار / غداء / عشاء / سناك / مشروب):
   - صنفها كـ "nutrition_meal".
   - قدر مكونات الطبق والكميات بالجرامات والسعرات والماكروز (بروتين، كارب، دهون) بدقة طبيب تغذية ورياضة.
   - استخرج كائن nutrition_meal بالتفصيل.

أخرج النتيجة بصيغة JSON نقية ومباشرة كالتالي:
{
  "detected_type": "medical_quiz" أو "english_flashcard" أو "medical_note" أو "academic_schedule" أو "nutrition_meal",
  "summary_title": "عنوان موجز مع إيموجي",
  "group_matched": "رقم الجروب المكتشف إن وجد",
  "schedule_items": [],
  "medical_quiz": {
    "course_code": "CAD402",
    "topic": "الموضوع الطبي",
    "question": "نص السؤال كاملاً",
    "answer_and_explanation": "الإجابة النموذجية مع الشرح الوافي",
    "doctor_pearl": "تريكة إكلينيكية هامة مستخرجة من الشرح إن وجدت"
  },
  "english_flashcard": {
    "term_or_sentence": "النص الإنجليزي",
    "egyptian_translation": "الترجمة بالمصري الدارج",
    "example_sentence": "مثال توضيحي بالإنجليزية",
    "usage_context": "طبي / محادثة عامة"
  },
  "nutrition_meal": {
    "meal_name": "اسم الوجبة ومحتوياتها الرئيسية",
    "meal_type": "إفطار / غداء / عشاء / سناك",
    "calories": 450,
    "protein_g": 35,
    "carbs_g": 40,
    "fats_g": 12,
    "nutrition_pearl": "نصيحة غذائية إكلينيكية سريعة"
  },
  "general_summary": "تلخيص منظم ومرتب للمستند أو السلايد"
}`;



  const postData = JSON.stringify({

    contents: [{

      parts: [

        { text: visionPrompt },

        { inline_data: { mime_type: 'image/jpeg', data: base64Image } }

      ]

    }],

    generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }

  });



  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok) return extractAndParseJson(res.text);
  }

  throw new Error('تعذر قراءة الصورة بالذكاء الاصطناعي.');
}

export async function generateGeminiAnalysis(promptText, keyInput) {
  const keys = extractApiKeys(keyInput || process.env.GEMINI_API_KEY);
  if (keys.length === 0) {
    return { ok: false, text: null };
  }

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { temperature: 0.7 }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok && res.text) {
      return { ok: true, text: res.text };
    }
  }

  return { ok: false, text: null };
}

// 🎓 Smart Clinical Modules Parser for Custom Course Lists
export async function parseModulesListWithAi(input, keyInput, isAudio = false) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const prompt = `أنت خبير ذكاء اصطناعي طبي. مهمتك استخراج وتنظيم قائمة الموديولات والمقررات الطبية بدقة من النص أو التسجيل الصوتي.
أخرج النتيجة بصيغة JSON نقية ومباشرة كالتالي:
{
  "courses": [
    { "code": "FEM65", "title": "نساء وتوليد" },
    { "code": "PED401", "title": "طب الأطفال" }
  ]
}

قواعد حاسمة جداً لمنع أي التباس:
1. الكود (code): هو الرمز الأكاديمي المختصر بالإنجليزية والأرقام دائماً (مثال: "FEM65", "PED401", "GIT402", "SURG301", "OBG401").
2. الاسم (title): هو الاسم الطبي الوصفي بالعربية أو الإنجليزية (مثال: "نساء وتوليد", "أمراض القلب", "General Surgery").
3. ⚠️ تنبيه حاسم: إذا كتب المستخدم بالعكس مثلاً "نساء و توليد - FEM65" أو "باطنة - INT301"، تأكد أن تضع الرمز المختصر الإنجليزي في "code" (مثال: "FEM65")، والاسم الوصفي في "title" (مثال: "نساء و توليد"). لا تعكسهما إطلاقاً!
4. إذا لم يذكر كود صريح للموديول، قم بتوليد كود مختصر مناسب بالإنجليزية من اسم الموديول (مثال: "نساء وتوليد" -> "OBG401" أو "GYN401").
5. لا تترك المصفوفة فارغة إذا وجد موديول واحد على الأقل.`;

  const parts = [];
  if (isAudio) {
    const base64Audio = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
    parts.push({ text: prompt });
    parts.push({ inline_data: { mime_type: 'audio/ogg', data: base64Audio } });
  } else {
    parts.push({ text: `${prompt}\n\nنص الموديولات المدخل من الطالب:\n"${input}"` });
  }

  const postData = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok) {
      const parsed = extractAndParseJson(res.text);
      if (Array.isArray(parsed?.courses) && parsed.courses.length > 0) {
        // Extra sanitation: Ensure code is short/alphanumeric and not flipped
        return parsed.courses.map((c, idx) => {
          let code = (c.code || '').trim();
          let title = (c.title || '').trim();
          const codeHasArabic = /[\u0600-\u06FF]/.test(code);
          const titleIsLatinCode = /^[a-zA-Z0-9\s_]{2,10}$/.test(title) && !/[\u0600-\u06FF]/.test(title);
          if (codeHasArabic && titleIsLatinCode) {
            // Swap if accidentally inverted
            return { code: title.toUpperCase(), title: code };
          }
          return {
            code: code ? code.toUpperCase() : `MOD${idx + 1}`,
            title: title || code || 'موديول طبي'
          };
        });
      }
    }
  }

  // Fallback regex line-by-line parser
  if (typeof input === 'string') {
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    const fallbackCourses = [];
    lines.forEach((line, idx) => {
      const cleanLine = line.replace(/^[•\-\*\d\.\)]\s*/, '').trim();
      if (!cleanLine) return;
      const parts = cleanLine.split(/[-–—:]/);
      if (parts.length >= 2) {
        let p1 = parts[0].trim();
        let p2 = parts.slice(1).join('-').trim();
        const p1IsCode = /^[a-zA-Z0-9\s_]{2,10}$/.test(p1) && !/[\u0600-\u06FF]/.test(p1);
        const p2IsCode = /^[a-zA-Z0-9\s_]{2,10}$/.test(p2) && !/[\u0600-\u06FF]/.test(p2);
        if (!p1IsCode && p2IsCode) {
          fallbackCourses.push({ code: p2.toUpperCase(), title: p1 });
        } else {
          fallbackCourses.push({ code: p1.toUpperCase(), title: p2 });
        }
      } else {
        fallbackCourses.push({ code: `MOD${idx + 1}`, title: cleanLine });
      }
    });
    if (fallbackCourses.length > 0) return fallbackCourses;
  }

  throw new Error('تعذر استخراج الموديولات.');
}

// 🧭 Master "اعمل ايه دلوقتي ؟" (What Should I Do Right Now) Strategic Roadmapper
export async function generateHolisticWhatToDoPlan(snapshot, keyInput) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const {
    studentName = 'دكتور',
    academicYear = 'الفرقة الرابعة',
    semester = 'الترم الأول',
    activeCourses = [],
    studyLast7Days = {},
    totalStudyMinsLast7Days = 0,
    todayStudyMins = 0,
    uploadedQuizzesCount = 0,
    pendingTasks = [],
    upcomingAppointments = [],
    quranStatus = null,
    gymStatus = null,
    financeStatus = null,
    cairoTime = '',
    cairoPeriod = '',
    nextPrayer = '',
    preferences = {}
  } = snapshot;

  const coursesList = activeCourses.map(c => `[${c.code}] ${c.title}`).join(', ');

  const prompt = `أنت العقل المدبر، والمستشار الاستراتيجي، ومصدر راحة البال والبوصلة للطبيب "${studentName}".
الطالب في ${academicYear} (${semester}).
🩺 الموديولات الأكاديمية النشطة: ${coursesList || 'موديولات الطب'}

📊 التقرير الشامل لحالة وإنجاز الطالب حالياً:
- الوقت الحالي بالقاهرة: ${cairoTime} (${cairoPeriod}). الصلاة القادمة: ${nextPrayer || 'غير محدد'}.
- المذاكرة اليوم: ${todayStudyMins} دقيقة (${(todayStudyMins / 60).toFixed(1)} ساعة).
- المذاكرة خلال آخر 7 أيام: ${totalStudyMinsLast7Days} دقيقة (${(totalStudyMinsLast7Days / 60).toFixed(1)} ساعة).
- تفاصيل ساعات المذاكرة لكل موديول في آخر 7 أيام:
${JSON.stringify(studyLast7Days, null, 2)}
- بنك الكويزات المرفوعة من السلايدات: ${uploadedQuizzesCount} سؤال مسجل.
- المهام المعلقة لليوم (${pendingTasks.length}): ${pendingTasks.map(t => `• ${t.title}`).join(' | ') || 'لا توجد مهام معلقة'}
- المواعيد القادمة (${upcomingAppointments.length}): ${upcomingAppointments.map(a => `• ${a.title} (${a.time12 || a.due_datetime})`).join(' | ') || 'لا توجد'}
${preferences.islamic !== false && quranStatus ? `- حالة القرآن والعبادات: ورد اليوم (${quranStatus.pagesToday || 0} صفحة)، إنجاز الأسبوع (${quranStatus.pagesThisWeek || 0} صفحة).` : ''}
${preferences.gym === true && gymStatus ? `- حالة الجيم واللياقة: تمرن ${gymStatus.daysTrainedThisWeek || 0} أيام هذا الأسبوع. آخر عضلة: ${gymStatus.lastMuscleTrained || 'لا يوجد'}. عضلات مقصر فيها: ${gymStatus.neglectedMuscles || 'عام'}.` : ''}
${preferences.finance !== false && financeStatus ? `- المصروفات: مصروفات اليوم (${financeStatus.todayExpense || 0} ج.م)، مصروفات الأسبوع (${financeStatus.weekExpense || 0} ج.م).` : ''}

🎯 مهمتك: كتابة توجيه عملي مباشر وواضح جداً ومريح للأعصاب (دليل راحة البال)، يزيل التشتت ويرتب الأولويات فوراً.
قواعد الإجابة:
1. 🩺 التركيز الأول والأكبر دائماً على **المذاكرة والطب**: اكشف له بوضوح أي موديول واقع فيه أو لم يفتحه منذ أيام، وحدد له اسم الموديول المطلوب فتحه الآن.
2. 🎯 حدد له **خطوة فورية واحدة محددة للبدء الآن (بلوك تركيز 60-90 دقيقة)**.
3. 📋 رتب له **خطة باقي اليوم (جدول زمني بسيط من الآن حتى النوم)** يدمج المذاكرة، المهام المعلقة، والمواعيد، مع مراعاة وقت الصلاة.
4. 💡 إذا كان مقصراً في ورد القرآن أو الجيم أو الصرف (حسب الأقسام المفعلة فقط)، نبهه بلطف وذكاء بكلمة واحدة عملية.
5. ⚠️ إذا كان قسم معطل (مثل الجيم أو الإسلامي أو البيزنس) لا تذكره إطلاقاً.
6. الأسلوب: مصري طبي راقي، مشجع، حاسم، يزيل التوتر والتشتت تماماً ويبعث راحة البال.
7. التنسيق: استخدم HTML tags فقط (<b>, <i>, <code>). لا تستخدم Markdown (** أو ##).

الهيكل المطلوب للرد:
🧭 <b>بوصلتك وراحة بالك الآن يا دكتور ${studentName}:</b>
━━━━━━━━━━━━━━━━━━━━━
🎯 <b>1. الخطوة الفورية المطلوبة منك الآن (ابدأ بيها حالاً):</b>
[حدد بدقة الموديول أو المهمة والمدة]

🩺 <b>2. كشف النواقص الأكاديمية (واقع في إيه؟):</b>
[تحليل صريح للموديولات المهملة أو اللي محتاجة تعويض وساعات إضافية]

📋 <b>3. خطتك لبقية اليوم (${cairoPeriod}):</b>
[جدول زمني نقطي محكم حتى النوم يجمع المذاكرة والمهام]

🌿 <b>4. كبسولة راحة البال:</b>
[نصيحة نفسية محفزة وقصيرة تريحه وتبعث فيه الحماس]`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.25 }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok && res.text) {
      return res.text.trim();
    }
  }

  throw new Error('تعذر توليد خطة العمل الذكية حالياً.');
}

// ==============================================================================
// 🥗 1. Nutrition & Macro Intelligence Calculator
// ==============================================================================

export async function analyzeNutritionInput(input, bodyMetrics = {}, keyInput, studentName = 'دكتور') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const prompt = `أنت خبير تغذية رياضية وطبيب سريري معتمد.
قام الطالب "${studentName}" بوصف وجبة أو ما أكله كالتالي:
"${input}"

معلومات جسم الطالب الحالية:
- الوزن: ${bodyMetrics.weight_kg || 75} كجم | الطول: ${bodyMetrics.height_cm || 175} سم
- الهدف الرياضي: ${bodyMetrics.fitness_goal || 'تنشيف وحرق دهون'}
- الاحتياج اليومي المستهدف: ${bodyMetrics.target_calories || 2000} سعرة | ${bodyMetrics.target_protein_g || 150}g بروتين | ${bodyMetrics.target_carbs_g || 180}g كارب | ${bodyMetrics.target_fats_g || 55}g دهون

المطلوب:
1. قم بتقدير المكونات الغذائية بدقة واحترافية (بالجرامات والسعرات التقريبية).
2. استخرج ملخص الوجبة (اسم الوجبة ومحتوياتها).
3. قدم نصيحة غذائية إكلينيكية سريعة جداً (Doctor Nutrition Tip).

أخرج النتيجة بصيغة JSON نقية:
{
  "meal_name": "اسم الوجبة ومكوناتها باختصار",
  "meal_type": "إفطار / غداء / عشاء / سناك",
  "calories": 450,
  "protein_g": 32,
  "carbs_g": 45,
  "fats_g": 14,
  "health_rating": 5, // 1 to 5
  "nutrition_pearl": "نصيحة ذكية عن الوجبة بالنسبة لهدفه"
}`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.15, response_mime_type: 'application/json' }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok) return extractAndParseJson(res.text);
  }

  throw new Error('تعذر تحليل الوجبة الغذائية.');
}

// ==============================================================================
// 🧠 2. Weekly Psychological & Mental Pattern Report Generator
// ==============================================================================

export async function generateWeeklyPsychologicalReport(logs = [], keyInput, studentName = 'دكتور') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const logsText = logs.map((l, i) => `[اليوم ${l.date || i + 1} | المزاج: ${l.mood_rating || 3}/5 | التوتر: ${l.stress_level || 'متوسط'} | الطاقة: ${l.energy_rating || 3}/5]: "${l.venting_content || 'لا يوجد نص'}"`).join('\n\n');

  const prompt = `أنت مستشار نفسي وإكلينيكي وطبيب داعم فائق الحكمة والرحمة لـ "${studentName}".
إليك سجلات الفضفضة والمشاعر وتفريغ الضغوط للطالب خلال الأيام الماضية:
${logsText || 'لا توجد سجلات كافية، قدم تقريراً تحفيزياً واستشفائياً عاماً.'}

المطلوب:
1. تحليل نمط الحالة النفسية على مدار الأسبوع (Emotional & Mental Trajectory).
2. استخراج الأسباب والمحفزات الرئيسية للشعور بالخنقة أو الضغط (Triggers: مثل قلة النوم، ضغط موديول معين، التسويف، أو توقعات عالية).
3. خطة استشفاء ذهني عملية من 3 خطوات مبنية على العلاج السلوكي المعرفي (CBT) والتفريغ الذهني.
4. رسالة طمأنينة وراحة بال خاصة جداً ومؤثرة لـ ${studentName}.

التنسيق: HTML فقط (<b>, <i>, <code>). لا تستخدم Markdown.`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok && res.text) return res.text.trim();
  }

  throw new Error('تعذر توليد التقرير النفسي الأسبوعي.');
}

// ==============================================================================
// 📚 3. High-Yield Academic PDF & Past-Paper Q-Bank Mastery Engine
// ==============================================================================

export async function processAcademicPdfMastery(pdfTextContent, courseCode = 'MED', keyInput, fileName = 'Module Material') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const prompt = `أنت أستاذ طب إكلينيكي ورئيس لجنة الامتحانات الجامعية والـ USMLE.
تم تزويدك بمحتوى ملزمة / سلايدات / امتحان سابق في الموديول الأكاديمي [${courseCode}] باسم الملف "${fileName}":

محتوى المادة:
"${pdfTextContent.slice(0, 30000)}"

🎯 مهمتك: استخراج عصارة المادة لتحقيق "الدرجة النهائية (Full Marks)" وتقسيمها إلى 4 مخرجات رئيسية بنظام التكرار المتباعد:

1. 🌟 كبسولات ليلة الامتحان (High-Yield Pearls): أهم 20% من المعلومات المسؤولة عن 80% من أسئلة الامتحان وتريكات الدكاترة الشائعة.
2. ❓ بنك أسئلة MCQs سريرية تفاعلية: استخرج أو صغ من الماتريال أهم الأسئلة الإكلينيكية مع 4 اختيارات وشرح تفصيلي وتحديد الإجابة الصحيحة وتريكة العملي.
3. 🗣️ قاموس المصطلحات الإنجليزية الطبية (Elevated Medical Jargon): الكلمات والمصطلحات اللاتينية والطبية المستخرجة مع معناها بالعامية المصرية وسياقها في الامتحان.
4. 🩺 محاكي الـ OSCE والامتحان الشفوي: نقاط فحص المريض (Checklists) وأسئلة الدكاترة الخادعة.

أخرج النتيجة بصيغة JSON نقية:
{
  "topic_title": "العنوان الأكاديمي الرئيسي للملف",
  "high_yield_summary": [
    {
      "point": "عنوان النقطة الذهبية",
      "explanation": "الشرح المكثف",
      "exam_trap": "فخ الامتحان الشائع"
    }
  ],
  "mcqs_extracted": [
    {
      "question": "نص السؤال الإكلينيكي...",
      "options": ["A) الاختيار الأول", "B) الاختيار الثاني", "C) الاختيار الثالث", "D) الاختيار الرابع"],
      "correct_option_index": 0,
      "explanation": "شرح الإجابة بالتفصيل",
      "doctor_pearl": "تريكة إضافية"
    }
  ],
  "english_terms": [
    {
      "term": "Medical Term",
      "egyptian_translation": "المعنى بالعامية المصرية الدارجة",
      "context": "سياق الاستخدام الإكلينيكي"
    }
  ],
  "osce_pearls": [
    {
      "station_title": "محطة OSCE أو سؤال شفوي",
      "critical_steps": ["الخطوة الأولى", "الخطوة الثانية", "الخطوة الثالثة"],
      "red_flags": "علامات الخطر التي يسأل عنها الممتحن"
    }
  ]
}`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, response_mime_type: 'application/json' }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok) return extractAndParseJson(res.text);
  }

  throw new Error('تعذر استخراج بنك الامتحانات من الملف الأكاديمي.');
}

export async function extractGroundedMcqsFromPdf(pdfVaultRow, pagesRange = '', count = 3, keyInput = null, studentName = 'د. عبدالله') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const sourceContent = JSON.stringify({
    file_name: pdfVaultRow.file_name,
    topic_title: pdfVaultRow.topic_title,
    high_yield_summary: pdfVaultRow.high_yield_summary,
    mcqs_extracted: pdfVaultRow.mcqs_extracted,
    osce_pearls: pdfVaultRow.osce_pearls
  });

  const prompt = `أنت المراجع الأكاديمي الصارم للطبيب "${studentName}".
⚠️ تحذير وميثاق صارم لا يقبل التجاوز (Strict Zero-Hallucination Guardrail):
يجب توليد ${count} أسئلة MCQs تفاعلية من صميم محتوى الملف المرفوع المرفق نصه أدناه فقط!
يُمنع منعاً باتاً جلب أي معلومة أو سؤال من مناهج خارجية أو من الإنترنت. كل سؤال يجب أن يعتمد حصراً على هذا النص.

سياق الصفحات المطلوبة: ${pagesRange || 'كامل الملف'}
محتوى مذكرات الطالب المرفوعة:
${sourceContent}

شروط الأسئلة:
1. كل سؤال يجب أن يكون له 4 خيارات واضحة وقصيرة (مناسبة كـ Telegram Quiz Poll).
2. حدد رقم الاختيار الصحيح بدقة في correct_option_index (من 0 إلى 3).
3. اكتب شرحاً طبياً موجزاً يظهر للطالب عند الخطأ في explanation (أقل من 200 حرف ليتوافق مع قيود التيليجرام).

أخرج النتيجة بصيغة JSON نقية كمصفوفة:
[
  {
    "question": "نص السؤال...",
    "options": ["الخيار A", "الخيار B", "الخيار C", "الخيار D"],
    "correct_option_index": 0,
    "explanation": "💡 التفسير الطبي من مذكرة الموديول..."
  }
]`;

  const postData = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
  });

  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok) {
      const parsed = extractAndParseJson(res.text);
      if (Array.isArray(parsed)) return parsed;
      if (parsed?.mcqs && Array.isArray(parsed.mcqs)) return parsed.mcqs;
    }
  }

  return [];
}





