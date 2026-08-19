// 🧠 Google AI Studio Gemini Multi-Key & Multi-Model Engine for Abdullah's Journey OS
import https from 'https';
import http from 'http';

// Ultra-Fast Supported Gemini Flash Models Hierarchy (Ranked by lowest latency ~400-600ms)
export const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash'
];

// ════════════════════════════════════════════════════════════════════
// ⚡ OPTIMAL LOAD BALANCER — Atomic Slot Rotation
//
// Problem: N users hitting at the same time can exhaust ANY single
//          model's quota OR any single key's quota.
//
// Solution: Treat every (model, key) pair as an independent "slot".
//   - 5 models × 5 keys = 25 unique slots
//   - A single atomic counter rotates across ALL 25 slots
//   - User 1 starts at slot 0, User 2 at slot 1, etc.
//   - If the assigned slot fails (quota), fall back to next slot
//   - Quota is spread evenly across ALL models AND ALL keys simultaneously
// ════════════════════════════════════════════════════════════════════
let _slotCounter = 0;

function getBalancedSlots(keys, models) {
  // Build all (model, key) pairs in a flat ring
  const allSlots = [];
  for (const model of models) {
    for (const key of keys) {
      allSlots.push({ model, key });
    }
  }
  if (allSlots.length === 0) return [];

  // Pick starting slot atomically (non-blocking, thread-safe in single-threaded Node.js)
  const startIdx = _slotCounter % allSlots.length;
  _slotCounter = (_slotCounter + 1) % allSlots.length;

  // Return slots in order starting from the assigned slot (wrapping around)
  return [...allSlots.slice(startIdx), ...allSlots.slice(0, startIdx)];
}
import { getCairoPrayerTimes } from './prayer_times.js';

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
  if (!keyInput) return [];
  if (Array.isArray(keyInput)) return keyInput.filter(Boolean);
  return String(keyInput).split(/[\n,;]+/).map(k => k.trim()).filter(Boolean);
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
      timeout: 25000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
            resolve({ ok: true, data: parsed, text: parsed.candidates[0].content.parts[0].text });
          } else {
            const errObj = parsed.error || {};
            const isQuota = res.statusCode === 429 || errObj.code === 429 || errObj.status === 'RESOURCE_EXHAUSTED' || (errObj.message && errObj.message.includes('quota'));
            const isForbidden = res.statusCode === 403 || errObj.code === 403;
            resolve({ ok: false, isQuota, isForbidden, status: res.statusCode, error: errObj });
          }
        } catch (e) {
          resolve({ ok: false, isQuota: false, isForbidden: false, status: res.statusCode, error: { message: e.message, raw: data } });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, isQuota: false, status: 408, error: { message: 'Gemini request timeout' } });
    });

    req.on('error', (err) => resolve({ ok: false, isQuota: false, error: err }));
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
export function getLiveLifeOsPrompt(studentName = 'د. عبدالله') {
  const now = new Date();
  const cairoDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const cairoTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour12: false });
  const cairoTime12 = now.toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: true });
  const dayFormatter = new Intl.DateTimeFormat('ar-EG', { timeZone: 'Africa/Cairo', weekday: 'long' });
  const dayName = dayFormatter.format(now).replace('الـ', '').trim();
  const prayers = getCairoPrayerTimes(now);

  return `أنت العقل المدبر والمدير التنفيذي والمستشار الشخصي لمنظومة الطبيب الذكية (Abdullah's Journey & Medical OS).
المستخدم هو "${studentName}" - طالب طب بشري في الفرقة الرابعة (الفصل الدراسي السابع - 450 درجة).
مهمتك: الاستماع للتسجيل الصوتي أو قراءة النص، واستخراج وتصنيف جميع الأنشطة بدقة تامة في صيغة JSON نقية ومباشرة.

📍 السياق الزمني الحي الحالي بالقاهرة (استخدمه بدقة لحساب أي تواريخ أو مواعيد نسبية):
- التاريخ الحالي بالقاهرة: ${cairoDateStr}
- اليوم الحالي: ${dayName}
- الوقت الحالي بالقاهرة (24H): ${cairoTimeStr} (${cairoTime12})
- مواقيت الصلاة اليوم بالقاهرة: الفجر: ${prayers.times.fajr} | الشروق: ${prayers.times.sunrise} | الظهر: ${prayers.times.dhuhr} | العصر: ${prayers.times.asr} | المغرب: ${prayers.times.maghrib} | العشاء: ${prayers.times.isha}

قواعد مهمة جداً لإخراج الـ JSON:
1. يجب أن يكون الناتج JSON صالحاً بنسبة 100% بدون أي أخطاء.
2. ضع علامات تنصيص مزدوجة (Double Quotes) حول جميع المفاتيح والقيم النصية.
3. إذا احتوى النص على علامات تنصيص، قم بهروبها بـ \\" (مثال: \\"نص\\").
4. لا تضع أسطراً جديدة مباشرة داخل النصوص بدون \\n.
5. لا تترك فواصل زائدة (Trailing Commas).

قواعد تحويل واستخراج الأرقام والمدد الزمنية والمواعيد والموديولات بدقة شديدة:

1. ⏰ المواعيد والتذكيرات (appointments & reminders):
   - إذا طلب ${studentName} تذكيراً بوقت محدد أو بعد مدة زمنية (مثال: "ذكرني بعد ساعة بتصوير المحل", "فكرني كمان 30 دقيقة أكلم فلان", "عندي ميعاد الساعة 8 مساءً", "ذكرني بكرة الساعة 9 الصبح"):
     * استخرج عنوان الموعد/التذكير في title (نص واضح، مثال: "تصوير المحل").
     * احسب التوقيت الدقيق المستهدف بالـ ISO Format مع التوقيت المصري +03:00 وضعه في due_datetime:
       - إذا قال "بعد ساعة" / "خلال ساعة" والوقت الآن ${cairoTimeStr} ➔ احسب الوقت بدقة بعد 60 دقيقة في due_datetime بتنسيق: "${cairoDateStr}THH:mm:00+03:00".
       - إذا قال "بعد 30 دقيقة" ➔ الوقت الحالي + 30 دقيقة.
       - إذا قال "الساعة 5 عصراً" ➔ "${cairoDateStr}T17:00:00+03:00".
       - إذا قال "بكرة" ➔ تاريخ الغد.
     * ضع أي تفاصيل إضافية في notes.
   - ضع هذه المواعيد دائماً في مصفوفة data.appointments ككائنات:
     [{ "title": "...", "due_datetime": "YYYY-MM-DDTHH:mm:ss+03:00", "notes": "..." }]

2. 🕌 التذكيرات المرتبطة بالصلوات (prayer_relative_reminders):
   - إذا كان التذكير مرتبطاً بوقت أذان أو صلاة (مثال: "ذكرني بعد صلاة العصر بنص ساعة بـ...", "فكرني قبل المغرب بربع ساعة"):
     * استخرج prayer_name ("fajr" | "dhuhr" | "asr" | "maghrib" | "isha").
     * استخرج offset_minutes كـ Number (مثال: 30 بعد الصلاة، -15 قبل الصلاة).
     * استخرج title.

3. 🎯 المهام اليومية (tasks):
   - إذا ذكر مهمة للقيام بها (مثال: "سجل عندي مهمة أراجع شابتر 1", "عايز أعمل تصميم للمحل"):
     * استخرج title (نص، تأكد من استخدام المفتاح title دائماً).
     * استخرج category ("مذاكرة" / "بيزنس" / "شخصي" / "تطوير").
     * استخرج priority ("عالية" / "متوسطة" / "عادية").
     * استخرج target_duration_mins (بالدقائق إن وجدت).

4. 📚 المذاكرة (study):
   - يجب تحويل المدد المنطوقة بالساعات أو الدقائق دائماً إلى دقائق في duration_minutes كـ Number:
     * 4 ساعات ➔ 240 | 3 ساعات ➔ 180 | ساعتين ➔ 120 | ساعة ونصف ➔ 90 | ساعة ➔ 60 | 45 دقيقة ➔ 45 | نصف ساعة ➔ 30
   - تمييز كود الموديول الطبي تلقائياً:
     * كارديو / قلب ➔ CAD402 | أطفال / بيديكس ➔ PED401 | صدرية / تنفسي ➔ RSD403 | أوعية دموية / فاسكولار ➔ HVD404 | مهارات إكلينيكية / سكيلز ➔ SKL 7
   - استخراج عدد الصفحات في pages_covered إن ذكرت.

5. 🏋️‍♂️ الجيم (fitness_gym):
   - حول وقت التمرين إلى دقائق في duration_minutes، واستخرج العضلات المستهدفة وجرامات البروتين وكمية الماء.

6. 💵 المالية (finance):
   - استخرج المبلغ في amount كـ Number، والنوع (مصروف / إيراد).
   - طريقة الدفع payment_method: إذا لم يذكر طريقة الدفع أو المحفظة صراحة، اجعلها دائماً وافتراضياً "خزنة شخصية" (كاش/نقدي). إذا ذكر صراحة فودافون كاش / إنستا باي / بنك مصر، استخرجها بدقة.

7. 📖 القرآن (quran):
   - استخرج اسم السورة، عدد الصفحات في pages_count، ونوع الجلسة (حفظ جديد / مراجعة تثبيت).

8. 💤 النوم والصلاة (prayer_habits):
   - استخرج عدد ساعات النوم الفعلي في sleep_hours، ووقت الاستيقاظ والنوم، وحالة الصلوات الخمس.

9. 📝 صياغة summary_text:
   - يجب أن يذكر summary_text تفاصيل ما تم فهمه وتوثيقه بوضوح تام مع ذكر الأرقام والمواعيد والمدد واسم ${studentName} بدقة بالغة.

هيكل الـ JSON المطلوب بدقة:
{
  "summary_text": "ملخص مفصل وواضح يذكر المدة الدقيقة والموضوع والموديول والمبالغ ومواعيد التذكير باللغة العربية مع إيموجي راقية",
  "data": {
    "date": "${cairoDateStr}",
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
    "mental_wellness": null,
    "fasting_worship": null,
    "study": [],
    "clinical_case": null,
    "quran": [],
    "fitness_gym": [],
    "content_creation": [],
    "work_projects": [],
    "tasks": [],
    "appointments": [],
    "thoughts": [],
    "self_development": [],
    "finance": []
  },
  "raw_transcription": "التفريغ الحرفي للكلام"
}`;
}

export const LIFE_OS_SYSTEM_PROMPT = getLiveLifeOsPrompt();

export async function parseWithGeminiPool(input, keyInput, isAudio = false, studentName = 'د. عبدالله') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const systemPrompt = getLiveLifeOsPrompt(studentName);
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
    parts.push({ text: `${systemPrompt}\n\nنص رسالة ${studentName}:\n"${input}"` });
  }

  const postData = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.15,
      response_mime_type: 'application/json'
    }
  });

  // ⚡ Atomic Slot Rotation: pick a unique (model, key) starting slot per request
  // → quota distributed across ALL models AND ALL keys simultaneously
  const slots = getBalancedSlots(keys, GEMINI_MODELS);
  for (const { model, key } of slots) {
    const res = await sendGeminiRequest(model, key, postData);
    if (res.ok) return extractAndParseJson(res.text);
    // Only skip to next slot if quota/forbidden — other errors are likely transient
  }

  throw new Error('تعذر معالجة الطلب مؤقتاً — جميع الـ slots مشغولة.');
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

export async function generateMedicalQuiz(moduleCode, topic, keyInput) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const prompt = `أنت أستاذ طب بشري إكلينيكي ممتاز في مصر والـ USMLE.
قم بإنشاء حالة سريرية ذكية وسؤال تفاعلي (Clinical Case MCQ + OSCE Checklist) لـ د. عبدالله في موديول: ${moduleCode || 'CAD402 / PED401'} في موضوع: ${topic || 'High-Yield Clinical Pearls'}.
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

أخرج النتيجة بصيغة JSON نقية ومباشرة كالتالي:
{
  "detected_type": "medical_quiz" أو "english_flashcard" أو "medical_note",
  "summary_title": "عنوان موجز مع إيموجي",
  "medical_quiz": {
    "course_code": "CAD402" أو "PED401" أو "RSD403" أو "HVD404" أو "SKL 7",
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

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok) return extractAndParseJson(res.text);
    }
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

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok && res.text) {
        return { ok: true, text: res.text };
      }
    }
  }
  return { ok: false, text: null };
}

