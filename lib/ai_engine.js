// 🧠 Google AI Studio Gemini Multi-Key & Multi-Model Engine for Abdullah's Journey OS
import https from 'https';
import http from 'http';

// Modern Supported Gemini 3.x Models Fallback Hierarchy
export const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest'
];

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

// JSON Clean Extractor Helper
export function extractAndParseJson(rawText) {
  if (!rawText) throw new Error('استجابة فارغة من الذكاء الاصطناعي');
  let clean = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (e1) {
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const extracted = clean.substring(firstOpen, lastClose + 1).trim();
      try {
        return JSON.parse(extracted);
      } catch (e2) {
        const sanitized = extracted
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u201C\u201D]/g, '"');
        return JSON.parse(sanitized);
      }
    }
    throw new Error(`تعذر استخراج البيانات بصيغة JSON: ${e1.message}`);
  }
}

// ==============================================================================
// 🌟 1. Master 360° Life OS System Prompt
// ==============================================================================
export const LIFE_OS_SYSTEM_PROMPT = `أنت العقل المدبر والمدير التنفيذي والمستشار الشخصي لمنظومة "رحلة عبدالله" (Abdullah's Journey OS).
المستخدم هو "د. عبدالله" - طالب طب بشري في الفرقة الرابعة (الفصل الدراسي السابع - 450 درجة).
مهمتك: الاستماع للتسجيل الصوتي أو النص، واستخراج وتصنيف جميع الأنشطة بدقة تامة في صيغة JSON نقية ومباشرة.

قواعد واستيعاب سيناريوهات التكرار المتباعد والصلاة والحياة اليومية:

1. 🗣️ بنك الإنجليزية والتكرار المتباعد (english_flashcards):
- أي كلمة أو جملة إنجليزية يرسلها د. عبدالله (مثلاً: "عايز احفظ كلمة Dyspnea on exertion يعني كتمة نفس مع المجهود" أو "احفظ جملة Out of the blue"):
- استخرج الكلمة/الجملة، ترجمتها بالمصري الدارج، مثال إنجليزي واقعي، وسياق الاستخدام ليتم جدولتها بنظام Spaced Repetition (بعد 12 ساعة، ثم يوم، ثم 3 أيام...).

2. 🩺 بنك أسئلة وكويزات الموديولات الطبية بالتكرار المتباعد (medical_quizzes):
- أي سؤال طبي يرسله لموديول معين (مثال: "سؤال كارديو CAD402: ايه اول لاين في علاج الـ Acute STEMI؟ والإجابة كذا" أو يرسل السؤال بدون إجابة):
- استخرج: course_code (PED401, CAD402, RSD403, HVD404, SKL 7)، topic، question، answer_and_explanation (الإجابة النموذجية والشرح)، و doctor_pearl (تريكة الراوند).

3. 🕌 التنبيهات المرتبطة بمواقيت الصلاة (prayer_relative_reminders):
- إذا قال: "فكرني اذاكر بعد العصر" أو "فكرني اعمل كذا بعد المغرب" أو "بعد الفجر":
- يتم تمييز اسم الصلاة (العصر / المغرب / الفجر / الظهر / العشاء) ليقوم النظام تلقائياً بجدولة التنبيه بعد أذان الصلاة بنصف ساعة (30 دقيقة) بتوقيت القاهرة المتغير تلقائياً صيفاً وشتاءً.

4. 💤 الاستيقاظ والنوم الذكي (Sleep & Wake-up):
- "صحيت دلوقتي ونمت امبارح الساعة 12:30 بليل" -> استخراج wake_up_time, sleep_bedtime, sleep_hours.

5. 📅 السكاشن والحضور والغياب (attendance):
- "غيبت من سيكشن الأطفال" أو "حضرت سيكشن القلب" -> course_code, session_title, status, reason, makeup_plan.

6. 🔄 إعادة جدولة المذاكرة (rescheduled study):
- "حصل ظرف ومقدرتش اذاكر كارديو دلوقتي وهأجلها لبكرة" -> was_rescheduled: true, reschedule_reason: "السبب", topic: "الموضوع".

7. 🧠 الفضفضة والحالة النفسية (mental_wellness):
- "دردشة عامة / فضفضة: حاسس بضغط..." -> mood_rating, stress_level, emotional_state, venting_content, ai_therapeutic_feedback.

8. 🌙 الصيام والسنن والأذكار (fasting_worship):
- صيام الإثنين/الخميس/البيض، ركعات السنن، الضحى، الوتر، أذكار الصباح والمساء.

9. 📖 المصحف (quran)، 🏋️‍♂️ الجيم (fitness_gym)، 🎬 المحتوى (content_creation)، 💼 الشغل (work_projects)، 🎯 المهام (tasks)، 💡 الخواطر (thoughts)، 💵 المالية (finance).

صيغة الـ JSON المطلوبة دائماً:
{
  "summary_text": "ملخص فخم ومرتب ومشجع باللغة العربية مع إيموجي راقية",
  "data": {
    "date": "YYYY-MM-DD إن وجد أو null",
    "english_flashcards": [
      {
        "term_or_sentence": "النص الإنجليزي",
        "egyptian_translation": "الترجمة بالعامية المصرية الدارجة بدقة",
        "example_sentence": "مثال توضيحي بالإنجليزية",
        "usage_context": "طبي سريري / محادثة عامة"
      }
    ],
    "medical_quizzes": [
      {
        "course_code": "CAD402" أو "PED401" أو "RSD403" أو "HVD404" أو "SKL 7",
        "topic": "الموضوع الطبي",
        "question": "نص السؤال الإكلينيكي",
        "answer_and_explanation": "الإجابة النموذجية والشرح",
        "doctor_pearl": "تريكة الاستشاري في الراوند"
      }
    ],
    "prayer_relative_reminders": [
      {
        "title": "عنوان المهمة المطلوب التذكير بها",
        "prayer_name": "الفجر" أو "الظهر" أو "العصر" أو "المغرب" أو "العشاء",
        "offset_minutes": 30
      }
    ],
    "prayer_habits": {
      "sleep_hours": عدد ساعات النوم الفعلي كـ Number,
      "wake_up_time": "وقت الاستيقاظ",
      "sleep_bedtime": "وقت النوم",
      "fajr": "حاضر بالمسجد" أو "حاضر" أو "قضاء" أو null,
      "dhuhr": "حاضر بالمسجد" أو "حاضر" أو "قضاء" أو null,
      "asr": "حاضر بالمسجد" أو "حاضر" أو "قضاء" أو null,
      "maghrib": "حاضر بالمسجد" أو "حاضر" أو "قضاء" أو null,
      "isha": "حاضر بالمسجد" أو "حاضر" أو "قضاء" أو null,
      "qiyam_night": true / false / null,
      "sunan_rawatib": عدد الركعات أو null,
      "adhkar_morning": true / false / null,
      "adhkar_evening": true / false / null,
      "workout_done": true / false / null,
      "energy_level": رقم من 1 إلى 5 أو null
    },
    "attendance": [
      {
        "course_code": "PED401",
        "session_title": "اسم السيكشن",
        "status": "حضور" أو "غياب",
        "reason": "السبب",
        "makeup_plan": "خطة التعويض"
      }
    ],
    "mental_wellness": {
      "mood_rating": رقم من 1 إلى 5,
      "stress_level": "منخفض" أو "معتدل" أو "عالي",
      "emotional_state": "حماس" أو "ضغط مذاكرة" أو "اطمئنان",
      "venting_content": "نص الفضفضة",
      "ai_therapeutic_feedback": "الدعم النفسي والتوجيه العملي"
    },
    "fasting_worship": {
      "fasting_type": "صيام الإثنين" أو "صيام الخميس" أو "الأيام البيض" أو null,
      "fasting_completed": true / false / null,
      "sunan_rawatib_count": عدد ركعات السنن كـ Number,
      "duha_prayer_done": true / false / null,
      "witr_prayer_done": true / false / null,
      "adhkar_morning": true / false / null,
      "adhkar_evening": true / false / null
    },
    "study": [
      {
        "course_code": "CAD402",
        "topic": "اسم الموضوع",
        "session_type": "مذاكرة نظرية",
        "duration_minutes": رقم,
        "pages_covered": رقم,
        "comprehension_rating": رقم من 1 إلى 5,
        "was_rescheduled": true / false,
        "reschedule_reason": "سبب التأجيل إن وجد",
        "notes": "ملاحظات"
      }
    ],
    "clinical_case": {
      "course_code": "CAD402",
      "title": "عنوان الحالة",
      "chief_complaint": "الشكوى",
      "provisional_diagnosis": "التشخيص",
      "doctor_pearls": "تريكة الراوند"
    },
    "quran": [
      {
        "surah_name": "اسم السورة",
        "from_page": رقم الصفحة أو null,
        "to_page": رقم الصفحة أو null,
        "pages_count": عدد الصفحات,
        "session_type": "حفظ جديد" أو "مراجعة تثبيت",
        "mastery_status": "متقن" أو "يحتاج تثبيت عاجل",
        "quality_rating": رقم من 1 إلى 5
      }
    ],
    "fitness_gym": [
      {
        "workout_type": "حديد وتمارين مقاومة",
        "muscle_groups": "العضلات",
        "duration_minutes": مدة التمرين,
        "protein_grams": رقم,
        "water_liters": رقم
      }
    ],
    "content_creation": [
      {
        "title": "عنوان الفيديو",
        "platform": "يوتيوب",
        "stage": "فكرة جديدة" أو "كتابة سكريبت",
        "script_content": "السكريبت"
      }
    ],
    "work_projects": [
      {
        "project_name": "فيوتشر إير",
        "task_description": "تفاصيل المهمة",
        "revenue_generated": رقم الأرباح إن وجد,
        "status": "قيد التنفيذ" أو "مكتمل"
      }
    ],
    "tasks": [
      {
        "title": "اسم المهمة",
        "category": "مذاكرة",
        "target_duration_mins": رقم الدقائق,
        "status": "قيد التنفيذ" أو "تم الإنجاز" أو "مؤجل",
        "priority": "عالية" أو "متوسطة"
      }
    ],
    "appointments": [
      {
        "title": "عنوان الموعد",
        "due_datetime": "YYYY-MM-DDTHH:mm:ss",
        "remind_at": "YYYY-MM-DDTHH:mm:ss أو null"
      }
    ],
    "thoughts": [
      {
        "content": "نص الخاطرة",
        "category": "فلسفة وانضباط",
        "tags": ["انضباط"]
      }
    ],
    "self_development": [
      {
        "title": "اسم الكتاب أو الكورس",
        "category": "كتاب وقراءة",
        "key_takeaways": "أهم الفوائد"
      }
    ],
    "finance": [
      {
        "type": "مصروف" أو "إيراد",
        "amount": رقم كـ Number,
        "category": "طعام وفطار" أو "مواصلات" أو "عام",
        "payment_method": "خزنة شخصية" أو "فودافون كاش" أو "إنستا باي" أو "بنك مصر",
        "description": "بيان الحركة"
      }
    ]
  },
  "raw_transcription": "التفريغ النصي الحرفي الكامل"
}`;

export async function parseWithGeminiPool(input, keyInput, isAudio = false) {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const parts = [];
  if (isAudio) {
    const base64Audio = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64');
    parts.push({ text: LIFE_OS_SYSTEM_PROMPT });
    parts.push({
      inline_data: {
        mime_type: 'audio/ogg',
        data: base64Audio
      }
    });
  } else {
    parts.push({ text: `${LIFE_OS_SYSTEM_PROMPT}\n\nنص رسالة د. عبدالله:\n"${input}"` });
  }

  const postData = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.15,
      response_mime_type: 'application/json'
    }
  });

  let lastError = null;
  for (const currentKey of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, currentKey, postData);
      if (res.ok) return extractAndParseJson(res.text);
      lastError = res.error?.message || `Error ${res.status}`;
      if (res.isQuota || res.isForbidden) continue;
    }
  }

  await sleep(1500);
  for (const currentKey of keys) {
    const retryRes = await sendGeminiRequest('gemini-flash-lite-latest', currentKey, postData);
    if (retryRes.ok) return extractAndParseJson(retryRes.text);
  }

  throw new Error(`تعذر معالجة الطلب مؤقتاً: ${lastError}`);
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

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok) return extractAndParseJson(res.text);
    }
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

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok) return extractAndParseJson(res.text);
    }
  }
  throw new Error('تعذر توليد الكويز الطبي حالياً.');
}

export async function analyzeImageWithGemini(photoBuffer, keyInput, customPrompt = '') {
  const keys = extractApiKeys(keyInput);
  if (keys.length === 0) throw new Error('مفاتيح Gemini غير متوفرة');

  const base64Image = photoBuffer.toString('base64');
  const systemText = customPrompt || `أنت مساعد د. عبدالله الطبي الذكي.
قم باستخراج وتلخيص أهم النقاط الطبية والمعلومات الجوهرية من هذه الصورة بأسلوب منظم وواضح.`;

  const postData = JSON.stringify({
    contents: [{
      parts: [
        { text: systemText },
        { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
      ]
    }],
    generationConfig: { temperature: 0.2 }
  });

  for (const key of keys) {
    for (const model of GEMINI_MODELS) {
      const res = await sendGeminiRequest(model, key, postData);
      if (res.ok) return res.text;
    }
  }
  throw new Error('تعذر قراءة الصورة بالذكاء الاصطناعي.');
}
